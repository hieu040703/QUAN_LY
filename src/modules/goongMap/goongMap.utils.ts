import { Address } from "@/shared/base/BaseValidator";
import { Club } from "@/database/models/Club";

type PlaceDetailLike = {
  formatted_address?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  compound?: { province?: string; commune?: string };
};

export type ClubMapItem = {
  id: string;
  code: string | null;
  name: string;
  hotline: string | null | undefined;
  isActive: boolean;
  address: Club["address"] | null;
  latitude: number | null;
  longitude: number | null;
};

const toFiniteNumber = (value: unknown): number | null => {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const toLatitude = (value: unknown): number | null => {
  const numberValue = toFiniteNumber(value);
  return numberValue !== null && numberValue >= -90 && numberValue <= 90 ? numberValue : null;
};

const toLongitude = (value: unknown): number | null => {
  const numberValue = toFiniteNumber(value);
  return numberValue !== null && numberValue >= -180 && numberValue <= 180 ? numberValue : null;
};

export class GoongMapUtils {
  static transformPlaceDetailToAddress(placeDetail: PlaceDetailLike): Address {
    return {
      state: placeDetail.compound?.province,
      ward: placeDetail.compound?.commune,
      detail: placeDetail.formatted_address ?? null,
      lat: toLatitude(placeDetail.geometry?.location?.lat) ?? undefined,
      lng: toLongitude(placeDetail.geometry?.location?.lng) ?? undefined,
    };
  }

  static transformClubToMapItem(club: Pick<Club, "id" | "code" | "name" | "hotline" | "isActive" | "address" | "latitude" | "longitude">): ClubMapItem {
    const address = club.address && typeof club.address === "object" ? club.address : null;
    const latitude = toLatitude(club.latitude) ?? toLatitude(address?.lat);
    const longitude = toLongitude(club.longitude) ?? toLongitude(address?.lng);

    return {
      id: club.id,
      code: club.code,
      name: club.name,
      hotline: club.hotline,
      isActive: club.isActive,
      address,
      latitude,
      longitude,
    };
  }
}

