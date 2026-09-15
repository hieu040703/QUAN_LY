import { HealthIndicator } from "@/database/models/HealthIndicator";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const HealthIndicatorSelectBasic: FindOptionsSelect<HealthIndicator> = {
  ...BaseSelect,
  userId: true,
  weight: true,
  height: true,
  bodyFat: true,
  muscleMass: true,
  boneWeight: true,
  waterVolume: true,
  visceralFat: true,
  kcal: true,
  bodyType: true,
  biologicalAge: true,
  timeAt: true,
};

export const HealthIndicatorSelectFull: FindOptionsSelect<HealthIndicator> = {
  ...HealthIndicatorSelectBasic,
};

export const HealthIndicatorRelations: FindOptionsRelations<HealthIndicator> = {
  user: true,
};
