import { UserTargetProgressType } from "../../database/models/UserTarget";
export type ProgressGroupBy = "day" | "week" | "month";

function progressFraction(t: number, progressType: UserTargetProgressType): number {
  const clampedT = Math.min(Math.max(t, 0), 1);

  switch (progressType) {
    case UserTargetProgressType.EASE_OUT:
      return Math.sqrt(clampedT);
    case UserTargetProgressType.EASE_IN:
      return clampedT * clampedT;
    case UserTargetProgressType.LINEAR:
    default:
      return clampedT;
  }
}

export function calcExpectedValue(params: {
  startValue: number;
  target: number;
  startTime: Date;
  deadline: Date;
  progressType: UserTargetProgressType;
  atDate: Date;
}): number {
  const { startValue, target, startTime, deadline, progressType, atDate } = params;

  const totalMs = deadline.getTime() - startTime.getTime();
  if (totalMs <= 0) return target;

  const elapsedMs = atDate.getTime() - startTime.getTime();
  const t = elapsedMs / totalMs;

  const f = progressFraction(t, progressType);
  return startValue + (target - startValue) * f;
}
/**
 * Tính % tiến độ THỰC TẾ đã đạt được (dựa trên current, không phải giá trị dự kiến)
 * Công thức: (current - startValue) / (target - startValue) * 100
 * */
export function calcProgressPercent(startValue: number, target: number, current: number): number {
  const totalChange = target - startValue;
  if (totalChange === 0) return 100;
  const actualChange = current - startValue;
  const percent = (actualChange / totalChange) * 100;
  return Math.round(Math.min(Math.max(percent, 0), 100));
}
export function buildSummary(params: {
  startValue: number;
  target: number;
  current: number;
  startTime: Date;
  deadline: Date;
}): {
  progressPercent: number;
  remainingValue: number;
  remainingDays: number;
  totalDays: number;
  changePerWeek: number;
} {
  const { startValue, target, current, startTime, deadline } = params;

  const now = new Date();
  const totalDays = Math.ceil((deadline.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercent = calcProgressPercent(startValue, target, current);
  const remainingValue = Math.abs(current - target);
  const totalWeeks = Math.max(1, Math.round(totalDays / 7));
  const changePerWeek = Math.abs(startValue - target) / totalWeeks;
  return {
    progressPercent,
    remainingValue: Math.round(remainingValue * 100) / 100,
    remainingDays,
    totalDays,
    changePerWeek: Math.round(changePerWeek * 100) / 100,
  };
}
