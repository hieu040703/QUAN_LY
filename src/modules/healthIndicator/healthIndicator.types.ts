export const HEALTH_INDICATOR_TYPES = {
  HealthIndicatorService: Symbol.for("HealthIndicatorService"),
  HealthIndicatorController: Symbol.for("HealthIndicatorController"),
  HealthIndicatorRepository: Symbol.for("HealthIndicatorRepository"),
  HealthIndicatorRouter: Symbol.for("HealthIndicatorRouter"),
  UserHealthIndicatorRouter: Symbol.for("UserHealthIndicatorRouter"),
};
export const HEALTH_INDICATOR_CHART_FIELDS = [
  "weight",
  "bodyFat",
  "muscleMass",
  "waterVolume",
  "visceralFat",
  "kcal",
] as const;
export type HealthIndicatorChartField = (typeof HEALTH_INDICATOR_CHART_FIELDS)[number];
