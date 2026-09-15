import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { ClubActivity } from "@/database/models/ClubActivity";
import { BaseService } from "@/shared/base/BaseService";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { ClubActivityRepository } from "./clubActivity.repository";
import { CLUB_ACTIVITY_TYPES } from "./clubActivity.types";

type TimeRange = {
  start: number;
  end: number;
};

type ActivitySegment = {
  day: number;
  start: number;
  end: number;
};

export type ClubActivityValidationInput = {
  day?: unknown;
  start?: unknown;
  end?: unknown;
};

const SECONDS_PER_DAY = 24 * 60 * 60;

const normalizeDay = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;

  const day = Number(value);
  if (!Number.isInteger(day) || day < 0 || day > 6) return null;

  return day;
};

const parseTime = (value: unknown): number | null => {
  if (typeof value !== "string") return null;

  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] || 0);

  if (hour > 23 || minute > 59 || second > 59) return null;
  return hour * 60 * 60 + minute * 60 + second;
};

const getActivitySegments = (day: number, range: TimeRange): ActivitySegment[] => {
  const normalizedDay = normalizeDay(day)!;

  // end <= start được coi là khung giờ chạy qua ngày hôm sau,
  // thống nhất với logic kiểm tra giờ hoạt động trong BookingService.
  if (range.end <= range.start) {
    return [
      { day: normalizedDay, start: range.start, end: SECONDS_PER_DAY },
      { day: (normalizedDay + 1) % 7, start: 0, end: range.end },
    ].filter((segment) => segment.start < segment.end);
  }

  return [{ day: normalizedDay, start: range.start, end: range.end }];
};

const hasOverlappingSegment = (left: ActivitySegment[], right: ActivitySegment[]): boolean =>
  left.some(
    (leftSegment) =>
      right.some(
        (rightSegment) =>
          leftSegment.day === rightSegment.day &&
          leftSegment.start < rightSegment.end &&
          rightSegment.start < leftSegment.end,
      ),
  );

/**
 * Validate các khung giờ được gửi kèm khi tạo Club.
 * Quy ước ngày: 0 = Chủ nhật, ..., 6 = Thứ 7.
 */
export const validateClubActivities = (activities: readonly ClubActivityValidationInput[]): void => {
  const normalizedActivities = activities.map((activity, index) => {
    const day = normalizeDay(activity.day);
    const start = parseTime(activity.start);
    const end = parseTime(activity.end);

    if (day === null) {
      throw new BadRequestError(`Ngày hoạt động tại vị trí ${index + 1} không hợp lệ`, "clubActivities");
    }
    if (start === null || end === null) {
      throw new BadRequestError(`Giờ hoạt động tại vị trí ${index + 1} không hợp lệ`, "clubActivities");
    }

    return {
      index,
      day,
      range: { start, end },
      segments: getActivitySegments(day, { start, end }),
    };
  });

  for (let index = 0; index < normalizedActivities.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < normalizedActivities.length; nextIndex += 1) {
      const current = normalizedActivities[index];
      const next = normalizedActivities[nextIndex];

      if (hasOverlappingSegment(current.segments, next.segments)) {
        throw new BadRequestError(
          `Khung giờ hoạt động tại vị trí ${next.index + 1} bị chồng lấn với vị trí ${current.index + 1}`,
          "clubActivities",
        );
      }
    }
  }
};

@injectable()
export class ClubActivityService extends BaseService<ClubActivity> {
  protected repository: ClubActivityRepository;
  protected searchableFields = ["start", "end", "note"];

  constructor(
    @inject(CLUB_ACTIVITY_TYPES.ClubActivityRepository)
    repository: ClubActivityRepository,
  ) {
    super();
    this.repository = repository;
  }

  protected async validateBeforeCreate(
    data: DeepPartial<ClubActivity>,
    manager: EntityManager,
  ): Promise<void> {
    const clubId = typeof data.clubId === "string" ? data.clubId : undefined;
    if (!clubId) throw new BadRequestError("CLB là bắt buộc", "clubId");

    validateClubActivities([{ day: data.day, start: data.start, end: data.end }]);

    const day = normalizeDay(data.day);
    const range = this.getTimeRange(data.start, data.end);

    await this.validateOverlappingActivity(clubId, day, range, manager);
  }

  protected async validateBeforeUpdate(
    id: string,
    data: DeepPartial<ClubActivity>,
    manager: EntityManager,
  ): Promise<void> {
    const currentActivity = await this.repository.findById(id, manager);
    if (!currentActivity) throw new NotFoundError("Không tìm thấy giờ hoạt động");

    const clubId = typeof data.clubId === "string" ? data.clubId : currentActivity.clubId;
    const day = normalizeDay(data.day ?? currentActivity.day);
    const range = this.getTimeRange(data.start ?? currentActivity.start, data.end ?? currentActivity.end);

    validateClubActivities([
      {
        day,
        start: data.start ?? currentActivity.start,
        end: data.end ?? currentActivity.end,
      },
    ]);

    await this.validateOverlappingActivity(clubId, day, range, manager, id);
  }

  private getTimeRange(start: unknown, end: unknown): TimeRange {
    const startInSeconds = parseTime(start);
    const endInSeconds = parseTime(end);

    if (startInSeconds === null || endInSeconds === null) {
      throw new BadRequestError("Giờ bắt đầu hoặc giờ kết thúc không hợp lệ", "start/end");
    }

    return { start: startInSeconds, end: endInSeconds };
  }

  private async validateOverlappingActivity(
    clubId: string,
    day: number | null,
    range: TimeRange,
    manager: EntityManager,
    excludeId?: string,
  ): Promise<void> {
    if (day === null) throw new BadRequestError("Ngày hoạt động không hợp lệ", "day");

    const existingActivities = await this.repository.find({ where: { clubId } }, manager);
    const newSegments = getActivitySegments(day, range);

    const conflict = existingActivities.find((activity) => {
      if (activity.id === excludeId) return false;

      const activityDay = normalizeDay(activity.day);
      const activityStart = parseTime(activity.start);
      const activityEnd = parseTime(activity.end);

      if (activityDay === null || activityStart === null || activityEnd === null) return false;

      return hasOverlappingSegment(
        newSegments,
        getActivitySegments(activityDay, { start: activityStart, end: activityEnd }),
      );
    });

    if (conflict) {
      throw new BadRequestError(
        `Khung giờ hoạt động bị chồng lấn với khung giờ ${conflict.start} - ${conflict.end} của cùng ngày`,
      );
    }
  }
}
