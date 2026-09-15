import { HealthIndicator } from "@/database/models/HealthIndicator";

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface HealthIndicatorSummary {
  latestDate: Date | null;
  totalCount: number;
  changeFromFirst: number | null;
  firstDate: Date | null;
  weight: { value: number; delta: number | null } | null;
  bodyFat: { value: number; delta: number | null } | null;
  muscleMass: { value: number; delta: number | null } | null;
}

function buildEmptySummary(): HealthIndicatorSummary {
  return {
    latestDate: null,
    totalCount: 0,
    changeFromFirst: null,
    firstDate: null,
    weight: null,
    bodyFat: null,
    muscleMass: null,
  };
}
export function buildHealthIndicatorSummary(rows: HealthIndicator[]): HealthIndicatorSummary {
  if (!rows.length) return buildEmptySummary();

  const latest = rows[0];
  const previous = rows[1] ?? null; // lần đo liền trước - để tính delta 3 card
  const first = rows[rows.length - 1]; // lần đo đầu tiên - để tính "giảm X kg từ ngày Y"

  return {
    latestDate: latest.createdAt,
    totalCount: rows.length,
    changeFromFirst: round2(latest.weight - first.weight),
    firstDate: first.createdAt,
    weight: {
      value: latest.weight,
      delta: previous ? round2(latest.weight - previous.weight) : null,
    },
    bodyFat: {
      value: latest.bodyFat,
      delta: previous ? round2(latest.bodyFat - previous.bodyFat) : null,
    },
    muscleMass: {
      value: latest.muscleMass,
      delta: previous ? round2(latest.muscleMass - previous.muscleMass) : null,
    },
  };
}
