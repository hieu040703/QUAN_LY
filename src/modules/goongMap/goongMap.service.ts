import { createHash } from "crypto";
import { inject, injectable } from "inversify";
import { AppError, BadRequestError } from "@/shared/types/errors";
import { ApiResponseHandler } from "@/shared/utils/response.utils";
import { config } from "@/config/env";
import { GoongMapCacheService } from "./goongMap.cache.service";
import { GOONG_MAP_TYPES } from "./goongMap.types";
import { GoongMapRepository } from "./goongMap.repository";
import {
  AutocompleteQueryDto,
  ClubMapQueryDto,
  DirectionsQueryDto,
  DistanceMatrixQueryDto,
  ForwardGeocodeQueryDto,
  GeocodeStreetQueryDto,
  PlaceChildrenQueryDto,
  PlaceDetailQueryDto,
  ReverseGeocodeQueryDto,
  TripQueryDto,
} from "./goongMap.validator";
import { GoongMapUtils } from "./goongMap.utils";

const hashPayload = (payload: unknown): string => createHash("sha256").update(JSON.stringify(payload)).digest("hex");

type GoongResponse = Record<string, any>;

@injectable()
export class GoongMapService {
  constructor(
    @inject(GOONG_MAP_TYPES.GoongMapRepository) private readonly goongMapRepository: GoongMapRepository,
    @inject(GOONG_MAP_TYPES.GoongMapCacheService) private readonly cacheService: GoongMapCacheService,
  ) {}

  private buildCacheKey(method: string, params: unknown): string {
    return `goong-map:${method}:${hashPayload(params)}`;
  }

  private ensureApiKey(): string {
    if (!config.GOONG_API_KEY) {
      throw new AppError("GOONG_API_KEY is not configured", 503, "SERVICE_UNAVAILABLE");
    }
    return config.GOONG_API_KEY;
  }

  private async checkDailyLimit(): Promise<void> {
    const quotaKey = `goong-map:daily-quota:${new Date().toISOString().slice(0, 10)}`;
    const currentCount = await this.cacheService.incrementDailyCounter(quotaKey);

    if (currentCount > config.GOONG_DAILY_LIMIT) {
      throw new AppError("Goong Maps daily request limit has been exceeded", 503, "SERVICE_UNAVAILABLE");
    }
  }

  private async callGoong<T extends GoongResponse>(endpoint: string, params: Record<string, string>): Promise<T> {
    const apiKey = this.ensureApiKey();
    await this.checkDailyLimit();

    const url = new URL(`${config.GOONG_API_BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set("api_key", apiKey);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(config.GOONG_REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new AppError("Unable to connect to Goong Maps", 503, "SERVICE_UNAVAILABLE");
    }

    if (!response.ok) {
      throw new AppError(`Goong Maps returned HTTP ${response.status}`, 503, "SERVICE_UNAVAILABLE");
    }

    const json = (await response.json()) as T & { status?: string; message?: string };
    if (json.status && json.status !== "OK" && json.status !== "Ok") {
      throw new BadRequestError(json.message ?? `Goong Maps returned status ${json.status}`);
    }

    return json;
  }

  private async withCache<T extends GoongResponse>(
    cacheKey: string,
    ttl: number,
    fetchFn: () => Promise<T>,
  ): Promise<{ data: T; source: "cache" | "api" }> {
    const cached = await this.cacheService.getJson<T>(cacheKey);
    if (cached) return { data: cached, source: "cache" };

    const data = await fetchFn();
    await this.cacheService.setJson(cacheKey, data, ttl);
    return { data, source: "api" };
  }

  async autocomplete(dto: AutocompleteQueryDto) {
    const params: Record<string, string> = { input: dto.input };
    if (dto.location) params.location = dto.location;
    if (dto.radius !== undefined) params.radius = String(dto.radius);
    if (dto.more_compound !== undefined) params.more_compound = String(dto.more_compound);
    if (dto.has_deprecated_administrative_unit !== undefined) {
      params.has_deprecated_administrative_unit = String(dto.has_deprecated_administrative_unit);
    }

    const { data } = await this.withCache(
      this.buildCacheKey("autocomplete", params),
      config.GOONG_AUTOCOMPLETE_CACHE_TTL,
      () => this.callGoong("/place/autocomplete", params),
    );
    return ApiResponseHandler.getSuccess("OK", data.predictions ?? []);
  }

  async placeChildren(dto: PlaceChildrenQueryDto) {
    const params: Record<string, string> = { parent_id: dto.parent_id };
    if (dto.has_deprecated_administrative_unit !== undefined) {
      params.has_deprecated_administrative_unit = String(dto.has_deprecated_administrative_unit);
    }

    const { data, source } = await this.withCache(
      this.buildCacheKey("place-children", params),
      config.GOONG_PLACE_CACHE_TTL,
      () => this.callGoong("/place/children", params),
    );
    return ApiResponseHandler.getSuccess("OK", { source, ...data });
  }

  async placeDetail(dto: PlaceDetailQueryDto) {
    const params: Record<string, string> = { place_id: dto.place_id };
    if (dto.has_deprecated_administrative_unit !== undefined) {
      params.has_deprecated_administrative_unit = String(dto.has_deprecated_administrative_unit);
    }

    const { data } = await this.withCache(
      this.buildCacheKey("place-detail", params),
      config.GOONG_PLACE_CACHE_TTL,
      () => this.callGoong("/place/detail", params),
    );
    return ApiResponseHandler.getSuccess("OK", GoongMapUtils.transformPlaceDetailToAddress(data.result ?? {}));
  }

  async geocode(dto: ForwardGeocodeQueryDto) {
    const params: Record<string, string> = { address: dto.address.trim() };
    if (dto.has_deprecated_administrative_unit !== undefined) {
      params.has_deprecated_administrative_unit = String(dto.has_deprecated_administrative_unit);
    }

    const { data } = await this.withCache(
      this.buildCacheKey("geocode", { ...params, address: params.address.toLowerCase() }),
      config.GOONG_GEOCODE_CACHE_TTL,
      () => this.callGoong("/geocode", params),
    );
    return ApiResponseHandler.getSuccess("OK", data.results ?? []);
  }

  async reverseGeocode(dto: ReverseGeocodeQueryDto) {
    const params: Record<string, string> = { latlng: dto.latlng };
    if (dto.has_deprecated_administrative_unit !== undefined) {
      params.has_deprecated_administrative_unit = String(dto.has_deprecated_administrative_unit);
    }

    const { data, source } = await this.withCache(
      this.buildCacheKey("reverse-geocode", params),
      config.GOONG_GEOCODE_CACHE_TTL,
      () => this.callGoong("/geocode", params),
    );
    return ApiResponseHandler.getSuccess("OK", { source, ...data });
  }

  async geocodeStreet(dto: GeocodeStreetQueryDto) {
    const params: Record<string, string> = { latlng: dto.latlng };
    if (dto.has_deprecated_administrative_unit !== undefined) {
      params.has_deprecated_administrative_unit = String(dto.has_deprecated_administrative_unit);
    }

    const { data, source } = await this.withCache(
      this.buildCacheKey("geocode-street", params),
      config.GOONG_GEOCODE_CACHE_TTL,
      () => this.callGoong("/geocode/street", params),
    );
    return ApiResponseHandler.getSuccess("OK", { source, ...data });
  }

  async directions(dto: DirectionsQueryDto) {
    const params: Record<string, string> = {
      origin: dto.origin,
      destination: dto.destination,
      vehicle: dto.vehicle,
    };
    if (dto.alternatives !== undefined) params.alternatives = String(dto.alternatives);

    const { data, source } = await this.withCache(
      this.buildCacheKey("directions", params),
      config.GOONG_DIRECTIONS_CACHE_TTL,
      () => this.callGoong("/direction", params),
    );
    return ApiResponseHandler.getSuccess("OK", { source, ...data });
  }

  async distanceMatrix(dto: DistanceMatrixQueryDto) {
    const params: Record<string, string> = {
      origins: dto.origins,
      destinations: dto.destinations,
      vehicle: dto.vehicle,
    };

    const { data, source } = await this.withCache(
      this.buildCacheKey("distance-matrix", params),
      config.GOONG_DIRECTIONS_CACHE_TTL,
      () => this.callGoong("/distancematrix", params),
    );
    return ApiResponseHandler.getSuccess("OK", { source, ...data });
  }

  async trip(dto: TripQueryDto) {
    const params: Record<string, string> = { vehicle: dto.vehicle };
    if (dto.origin) params.origin = dto.origin;
    if (dto.destination) params.destination = dto.destination;
    if (dto.waypoints) params.waypoints = dto.waypoints;
    if (dto.roundtrip !== undefined) params.roundtrip = String(dto.roundtrip);

    const { data, source } = await this.withCache(
      this.buildCacheKey("trip", params),
      config.GOONG_DIRECTIONS_CACHE_TTL,
      () => this.callGoong("/trip", params),
    );
    return ApiResponseHandler.getSuccess("OK", { source, ...data });
  }

  async getClubsForMap(query: ClubMapQueryDto) {
    const { data, total } = await this.goongMapRepository.findClubsForMap(query);
    const page = query.page ?? 1;
    const size = query.size ?? 100;

    return ApiResponseHandler.getSuccess("OK", data, {
      currentPage: page,
      size,
      totalRecords: total,
      totalPages: Math.ceil(total / size),
    });
  }

  getMapTileKey() {
    return ApiResponseHandler.getSuccess("OK", { tileKey: config.GOONG_MAP_TILE_KEY });
  }
}
