import { NextFunction, Request, RequestHandler, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { GOONG_MAP_TYPES } from "./goongMap.types";
import { GoongMapController } from "./goongMap.controller";
import {
  AutocompleteQuerySchema,
  ClubMapQuerySchema,
  DirectionsQuerySchema,
  DistanceMatrixQuerySchema,
  ForwardGeocodeQuerySchema,
  GeocodeStreetQuerySchema,
  PlaceChildrenQuerySchema,
  PlaceDetailQuerySchema,
  ReverseGeocodeQuerySchema,
  TripQuerySchema,
} from "./goongMap.validator";

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

const goongRateLimiter: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = requestBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    next();
    return;
  }

  if (bucket.count >= 120) {
    res.status(429).json({ statusCode: 429, success: false, message: "Too many map requests" });
    return;
  }

  bucket.count += 1;
  next();
};

@injectable()
export class GoongMapRouter {
  private readonly router: Router;

  constructor(@inject(GOONG_MAP_TYPES.GoongMapController) private readonly controller: GoongMapController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/autocomplete",
      goongRateLimiter,
      zodValidate(AutocompleteQuerySchema, "query"),
      this.controller.autocomplete,
    );
    this.router.get(
      "/place-children",
      goongRateLimiter,
      zodValidate(PlaceChildrenQuerySchema, "query"),
      this.controller.placeChildren,
    );
    this.router.get(
      "/place-detail",
      goongRateLimiter,
      zodValidate(PlaceDetailQuerySchema, "query"),
      this.controller.placeDetail,
    );
    this.router.get(
      "/geocode",
      goongRateLimiter,
      zodValidate(ForwardGeocodeQuerySchema, "query"),
      this.controller.geocode,
    );
    this.router.get(
      "/reverse-geocode",
      goongRateLimiter,
      zodValidate(ReverseGeocodeQuerySchema, "query"),
      this.controller.reverseGeocode,
    );
    this.router.get(
      "/geocode-street",
      goongRateLimiter,
      zodValidate(GeocodeStreetQuerySchema, "query"),
      this.controller.geocodeStreet,
    );
    this.router.get(
      "/directions",
      goongRateLimiter,
      zodValidate(DirectionsQuerySchema, "query"),
      this.controller.directions,
    );
    this.router.get(
      "/distance-matrix",
      goongRateLimiter,
      zodValidate(DistanceMatrixQuerySchema, "query"),
      this.controller.distanceMatrix,
    );
    this.router.get("/trip", goongRateLimiter, zodValidate(TripQuerySchema, "query"), this.controller.trip);
    this.router.get(
      "/clubs",
      zodValidate(ClubMapQuerySchema, "query"),
      this.controller.getClubsForMap,
    );
    this.router.get("/map-tile-key", this.controller.getMapTileKey);
  }

  public getRouter(): Router {
    return this.router;
  }
}

