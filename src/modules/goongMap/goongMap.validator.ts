import { z } from "zod";

const LatLngStringSchema = z
  .string()
  .trim()
  .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, "latlng must use the 'lat,lng' format");

const VehicleSchema = z.enum(["car", "bike", "motorcycle", "truck"]).default("car");

const BooleanLikeSchema = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => (typeof value === "string" ? value === "true" : value))
  .optional();

export const AutocompleteQuerySchema = z.object({
  input: z.string().trim().min(1).max(500),
  location: LatLngStringSchema.optional(),
  radius: z.coerce.number().positive().optional(),
  more_compound: BooleanLikeSchema,
  has_deprecated_administrative_unit: BooleanLikeSchema,
});

export const PlaceChildrenQuerySchema = z.object({
  parent_id: z.string().trim().min(1),
  has_deprecated_administrative_unit: BooleanLikeSchema,
});

export const PlaceDetailQuerySchema = z.object({
  place_id: z.string().trim().min(1),
  has_deprecated_administrative_unit: BooleanLikeSchema,
});

export const ForwardGeocodeQuerySchema = z.object({
  address: z.string().trim().min(3).max(500),
  has_deprecated_administrative_unit: BooleanLikeSchema,
});

export const ReverseGeocodeQuerySchema = z.object({
  latlng: LatLngStringSchema,
  has_deprecated_administrative_unit: BooleanLikeSchema,
});

export const GeocodeStreetQuerySchema = z.object({
  latlng: LatLngStringSchema,
  has_deprecated_administrative_unit: BooleanLikeSchema,
});

export const DirectionsQuerySchema = z.object({
  origin: LatLngStringSchema,
  destination: LatLngStringSchema,
  vehicle: VehicleSchema,
  alternatives: BooleanLikeSchema,
});

export const DistanceMatrixQuerySchema = z.object({
  origins: LatLngStringSchema,
  destinations: z.string().trim().min(1),
  vehicle: VehicleSchema,
});

export const TripQuerySchema = z.object({
  origin: LatLngStringSchema.optional(),
  destination: LatLngStringSchema.optional(),
  waypoints: z.string().trim().optional(),
  vehicle: VehicleSchema,
  roundtrip: BooleanLikeSchema,
});

export const ClubMapQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(500).default(100),
  keyword: z.string().trim().max(256).optional(),
  clubId: z.uuid().optional(),
  isActive: BooleanLikeSchema,
});

export type AutocompleteQueryDto = z.infer<typeof AutocompleteQuerySchema>;
export type PlaceChildrenQueryDto = z.infer<typeof PlaceChildrenQuerySchema>;
export type PlaceDetailQueryDto = z.infer<typeof PlaceDetailQuerySchema>;
export type ForwardGeocodeQueryDto = z.infer<typeof ForwardGeocodeQuerySchema>;
export type ReverseGeocodeQueryDto = z.infer<typeof ReverseGeocodeQuerySchema>;
export type GeocodeStreetQueryDto = z.infer<typeof GeocodeStreetQuerySchema>;
export type DirectionsQueryDto = z.infer<typeof DirectionsQuerySchema>;
export type DistanceMatrixQueryDto = z.infer<typeof DistanceMatrixQuerySchema>;
export type TripQueryDto = z.infer<typeof TripQuerySchema>;
export type ClubMapQueryDto = z.infer<typeof ClubMapQuerySchema>;

