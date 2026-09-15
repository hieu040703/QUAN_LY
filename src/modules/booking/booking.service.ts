import { inject, injectable } from "inversify";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DeepPartial, EntityManager, In, LessThan, MoreThan } from "typeorm";
import { config } from "@/config/env";
import { Booking, BookingStatus } from "@/database/models/Booking";
import { ClubActivity } from "@/database/models/ClubActivity";
import { BaseService } from "@/shared/base/BaseService";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { BOOKING_TYPES } from "./booking.types";
import { BookingRepository } from "./booking.repository";
import { CLUB_TYPES } from "../club/club.types";
import { ClubRepository } from "../club/club.repository";
import { CLUB_ACTIVITY_TYPES } from "../clubActivity/clubActivity.types";
import { ClubActivityRepository } from "../clubActivity/clubActivity.repository";
import { ApiResponseHandler } from "@/shared/utils/response.utils";
import { RequestContext } from "@/shared/types/interfaces";
import { NOTIFICATION_TYPES, NotificationService } from "../notification";
import { ActionTypeEnum, NotificationTypeEnum } from "@/database/models/Notification";
import { getUserHasPermission } from "@/shared/utils/getRole.utils";
import { ChatService } from "../chat/chat.service";
import { CHAT_TYPES } from "../chat/chat.types";
import { ConversationTypeEnum } from "@/database/models/Chat";

dayjs.extend(utc);
dayjs.extend(timezone);

type TimeInterval = {
  start: Dayjs;
  end: Dayjs;
};

@injectable()
export class BookingService extends BaseService<Booking> {
  protected repository: BookingRepository;
  protected searchableFields = ["code", "status", "note"];

  constructor(
    @inject(BOOKING_TYPES.BookingRepository)
    repository: BookingRepository,
    @inject(CLUB_TYPES.ClubRepository)
    private clubRepository: ClubRepository,
    @inject(CLUB_ACTIVITY_TYPES.ClubActivityRepository)
    private clubActivityRepository: ClubActivityRepository,
    @inject(NOTIFICATION_TYPES.NotificationService) private notificationService: NotificationService,
    @inject(CHAT_TYPES.ChatService) private chatService: ChatService,
  ) {
    super();
    this.repository = repository;
  }

  protected async attachMoreDataToEntities(entities: Booking[], req?: RequestContext): Promise<void> {
    const userId = req?.userContext?.userId;
    if (!userId) return;

    await Promise.all(
      entities.map(async (booking) => {
        const unreadMessageCount = await this.chatService.getUnreadMessageCount(
          booking.id,
          ConversationTypeEnum.BOOKING,
          userId,
        );
        Object.assign(booking, { unreadMessageCount });
      }),
    );
  }

  protected async attachMoreDataToEntity(entity: Booking, req?: RequestContext): Promise<void> {
    await this.attachMoreDataToEntities([entity], req);
  }
  protected async validateBeforeCreate(data: DeepPartial<Booking>, manager: EntityManager): Promise<void> {
    await this.validateBookingWindow(
      {
        clubId: data.clubId,
        start: data.start,
        end: data.end,
        quantity: data.quantity,
      },
      manager,
    );
  }

  protected async afterCreate(
    entity: Booking,
    data: DeepPartial<Booking>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.sendNotificationBooking(entity, ActionTypeEnum.BOOKING_PENDING, manager);
  }

  protected async validateBeforeUpdate(id: string, data: DeepPartial<Booking>, manager: EntityManager): Promise<void> {
    const currentBooking = await this.repository.findById(id, manager);
    if (!currentBooking) throw new NotFoundError("Không tìm thấy lịch đặt");

    if (currentBooking.status !== BookingStatus.PENDING)
      throw new BadRequestError("Không thể thay đổi thông tinh lịch đặt đã được xác nhận hoặc đã hủy");

    await this.validateBookingWindow(
      {
        clubId: data.clubId ?? currentBooking.clubId,
        start: data.start ?? currentBooking.start,
        end: data.end ?? currentBooking.end,
        quantity: data.quantity ?? currentBooking.quantity,
      },
      manager,
      id,
    );
  }

  private async sendNotificationBooking(data: Booking, action: ActionTypeEnum, manager?: EntityManager) {
    // `afterCreate` receives the entity returned by save(), which does not
    // include relations. Reload it before building the notification payload.
    const booking = data.user && data.club ? data : await this.repository.findById(data.id, manager);
    const notificationBooking = booking || data;

    const userIds =
      action === ActionTypeEnum.BOOKING_CONFIRMED
        ? [notificationBooking.userId]
        : await getUserHasPermission("booking", "confirm", notificationBooking.clubId);

    const notificationData = {
      id: notificationBooking.id,
      name: notificationBooking.user?.name,
      clubName: notificationBooking.club?.name,
      timeAt: notificationBooking.createdAt,
    };

    await this.notificationService.createNotificationByEntity(
      notificationData,
      NotificationTypeEnum.BOOKING,
      action,
      userIds,
    );
  }

  private async validateBookingWindow(
    data: {
      clubId?: unknown;
      start?: unknown;
      end?: unknown;
      quantity?: unknown;
    },
    manager: EntityManager,
    excludeBookingId?: string,
  ): Promise<void> {
    const clubId = typeof data.clubId === "string" ? data.clubId : undefined;
    const start = this.toDate(data.start);
    const end = this.toDate(data.end);
    const quantity = Number(data.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestError("Booking quantity must be a positive integer");
    }

    if (!clubId) throw new BadRequestError("CLB là bắt buộc");
    if (!start || !end || start.getTime() >= end.getTime()) {
      throw new BadRequestError("Thời gian booking không hợp lệ");
    }

    // Khóa bản ghi CLB trong transaction để các booking đồng thời không
    // cùng vượt qua bước kiểm tra capacity.
    const club = await this.clubRepository.getRepository(manager).findOne({
      where: { id: clubId },
      lock: { mode: "pessimistic_write" },
    });
    if (!club) throw new BadRequestError("CLB không tồn tại");
    if (!club.isActive) throw new BadRequestError("CLB hiện không hoạt động");

    if (!Number.isFinite(club.capacity) || club.capacity <= 0) {
      throw new BadRequestError("CLB hiện không còn capacity để đặt lịch");
    }

    await this.validateOperatingHours(clubId, start, end, manager);
    await this.validateCapacity(clubId, start, end, quantity, club.capacity, manager, excludeBookingId);
  }

  private async validateOperatingHours(clubId: string, start: Date, end: Date, manager: EntityManager): Promise<void> {
    const activities = await this.clubActivityRepository.find({ where: { clubId } }, manager);

    if (!activities.length) {
      throw new BadRequestError("CLB chưa cấu hình thời gian hoạt động");
    }

    const timezoneName = config.DEFAULT_TIMEZONE || "Asia/Ho_Chi_Minh";
    const localStart = dayjs(start).tz(timezoneName);
    const localEnd = dayjs(end).tz(timezoneName);
    const firstDay = localStart.startOf("day").subtract(1, "day");
    const lastDay = localEnd.startOf("day");
    const openingIntervals: TimeInterval[] = [];

    for (let date = firstDay; !date.isAfter(lastDay, "day"); date = date.add(1, "day")) {
      const dayActivities = activities.filter((activity) => this.isSameActivityDay(activity, date.day()));

      for (const activity of dayActivities) {
        const activityStart = this.parseLocalTime(date, activity.start);
        const activityEndTime = this.parseLocalTime(date, activity.end);
        if (!activityStart || !activityEndTime) continue;

        // end <= start được hiểu là khung giờ qua ngày hôm sau, ví dụ 22:00-02:00.
        const activityEnd = activityEndTime.isAfter(activityStart) ? activityEndTime : activityEndTime.add(1, "day");

        openingIntervals.push({ start: activityStart, end: activityEnd });
      }
    }

    openingIntervals.sort((a, b) => a.start.valueOf() - b.start.valueOf());

    let coveredUntil = dayjs(start);
    const requestedEnd = dayjs(end);

    for (const interval of openingIntervals) {
      if (!interval.end.isAfter(coveredUntil)) continue;
      if (interval.start.isAfter(coveredUntil)) break;

      if (interval.end.isAfter(coveredUntil)) {
        coveredUntil = interval.end;
      }

      if (!coveredUntil.isBefore(requestedEnd)) return;
    }

    throw new BadRequestError("Thời gian booking nằm ngoài thời gian hoạt động của CLB");
  }

  private async validateCapacity(
    clubId: string,
    start: Date,
    end: Date,
    quantity: number,
    capacity: number,
    manager: EntityManager,
    excludeBookingId?: string,
  ): Promise<void> {
    const activeBookings = await this.repository.find(
      {
        where: {
          clubId,
          status: BookingStatus.CONFIRMED,
          start: LessThan(end),
          end: MoreThan(start),
        },
      },
      manager,
    );

    const events: Array<{ time: number; change: number }> = [
      { time: start.getTime(), change: quantity },
      { time: end.getTime(), change: -quantity },
    ];

    for (const booking of activeBookings) {
      if (booking.id === excludeBookingId) continue;

      const overlapStart = Math.max(start.getTime(), booking.start.getTime());
      const overlapEnd = Math.min(end.getTime(), booking.end.getTime());
      if (overlapStart >= overlapEnd) continue;

      const bookingQuantity = Number(booking.quantity);
      if (!Number.isInteger(bookingQuantity) || bookingQuantity <= 0) continue;

      events.push({ time: overlapStart, change: bookingQuantity }, { time: overlapEnd, change: -bookingQuantity });
    }

    events.sort((a, b) => a.time - b.time);

    let current = 0;
    let maxConcurrent = 0;
    let index = 0;

    while (index < events.length) {
      const eventTime = events[index].time;
      let change = 0;

      while (index < events.length && events[index].time === eventTime) {
        change += events[index].change;
        index += 1;
      }

      current += change;
      maxConcurrent = Math.max(maxConcurrent, current);
    }

    if (maxConcurrent > capacity) {
      throw new BadRequestError(`Khung giờ này đã vượt capacity của CLB (${capacity} người)`);
    }
  }

  private isSameActivityDay(activity: ClubActivity, jsDay: number): boolean {
    // Quy ước duy nhất: 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7.
    return activity.day === jsDay;
  }

  private parseLocalTime(date: Dayjs, time: string): Dayjs | null {
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time.trim());
    if (!match) return null;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3] || 0);
    if (hour > 23 || minute > 59 || second > 59) return null;

    return date.hour(hour).minute(minute).second(second).millisecond(0);
  }

  private toDate(value: unknown): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value as string);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  async getTimeslotStats(clubId?: string, date?: Date) {
    const timezoneName = config.DEFAULT_TIMEZONE || "Asia/Ho_Chi_Minh";
    const targetDate = date ? dayjs(date).tz(timezoneName) : dayjs().tz(timezoneName);
    const activities = await this.clubActivityRepository.find(clubId ? { where: { clubId } } : {});
    const activitiesOfDay = activities.filter((activity) => this.isSameActivityDay(activity, targetDate.day()));
    const clubIds = clubId ? [clubId] : [...new Set(activitiesOfDay.map((activity) => activity.clubId))];
    const clubs = clubIds.length ? await this.clubRepository.find({ where: { id: In(clubIds) } }) : [];
    const capacityByClubId = new Map(clubs.map((club) => [club.id, Number(club.capacity)]));
    const dayActivities = activitiesOfDay.filter((activity) => (capacityByClubId.get(activity.clubId) ?? 0) > 0);
    const allBookings = await this.getBookingsOfDay(clubIds, targetDate);
    const overview = this.buildOverviewStats(allBookings);

    if (!dayActivities.length) {
      return { ...overview, totalCapacity: 0, totalBooked: 0, slots: [] };
    }

    const confirmedBookings = allBookings.filter((b) => b.status === BookingStatus.CONFIRMED);
    const slots = this.buildSlots(dayActivities, confirmedBookings, targetDate, capacityByClubId);
    const totalCapacity = slots.reduce((sum, s) => sum + s.capacity, 0);
    const totalBooked = confirmedBookings.reduce((sum, b) => sum + Number(b.quantity || 0), 0);
    return { ...overview, totalCapacity, totalBooked, slots };
  }

  private async getConfirmedBookingsOfDay(clubIds: string[], targetDate: Dayjs): Promise<Booking[]> {
    const dayStart = targetDate.startOf("day").toDate();
    const dayEnd = targetDate.endOf("day").toDate();
    return this.repository.find({
      where: {
        clubId: In(clubIds),
        status: BookingStatus.CONFIRMED,
        start: LessThan(dayEnd),
        end: MoreThan(dayStart),
      } as any,
    });
  }

  private buildSlots(
    activities: ClubActivity[],
    bookings: Booking[],
    targetDate: Dayjs,
    capacityByClubId: Map<string, number>,
  ) {
    const slotMap = new Map<string, { start: string; end: string; capacity: number; booked: number }>();
    for (const activity of activities) {
      const slotStart = this.parseLocalTime(targetDate, activity.start);
      const slotEnd = this.parseLocalTime(targetDate, activity.end);
      if (!slotStart || !slotEnd) continue;
      const key = `${activity.start}-${activity.end}`;
      const capacity = capacityByClubId.get(activity.clubId) ?? 0;
      const booked = this.countBookedInSlot(bookings, activity.clubId, slotStart, slotEnd);
      const existing = slotMap.get(key);
      if (existing) {
        existing.capacity += capacity;
        existing.booked += booked;
      } else {
        slotMap.set(key, { start: activity.start, end: activity.end, capacity, booked });
      }
    }
    return Array.from(slotMap.values()).sort((a, b) => a.start.localeCompare(b.start));
  }
  private countBookedInSlot(bookings: Booking[], clubId: string, slotStart: Dayjs, slotEnd: Dayjs): number {
    const slotStartMs = slotStart.toDate().getTime();
    const slotEndMs = slotEnd.toDate().getTime();
    return bookings
      .filter((b) => b.clubId === clubId && b.start.getTime() < slotEndMs && b.end.getTime() > slotStartMs)
      .reduce((sum, b) => sum + Number(b.quantity || 0), 0);
  }
  private async getBookingsOfDay(clubIds: string[], targetDate: Dayjs): Promise<Booking[]> {
    const dayStart = targetDate.startOf("day").toDate();
    const dayEnd = targetDate.endOf("day").toDate();
    return this.repository.find({
      where: {
        clubId: In(clubIds),
        start: LessThan(dayEnd),
        end: MoreThan(dayStart),
      },
    });
  }
  private buildOverviewStats(bookings: Booking[]) {
    let pending = 0;
    let confirmed = 0;
    let checkedIn = 0;
    let canceled = 0;
    for (const b of bookings) {
      switch (b.status) {
        case BookingStatus.PENDING:
          pending++;
          break;
        case BookingStatus.CONFIRMED:
          confirmed++;
          break;
        case BookingStatus.CHECKED_IN:
          checkedIn++;
          break;
        case BookingStatus.CANCELED:
          canceled++;
          break;
      }
    }
    return {
      todayTotal: bookings.length,
      pending,
      confirmed,
      checkedIn,
      canceled,
    };
  }

  async updateStatusBooking(id: string, status: BookingStatus) {
    const booking = await this.repository.findById(id);
    if (!booking) throw new BadRequestError("Lịch đặt không tồn tại");

    const allowStatus: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [],
      [BookingStatus.CANCELED]: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      [BookingStatus.CONFIRMED]: [BookingStatus.PENDING],
      [BookingStatus.CHECKED_IN]: [],
    };

    const allowedPreviousStatuses = allowStatus[status] ?? [];
    if (!allowedPreviousStatuses.includes(booking.status)) {
      throw new BadRequestError(`Booking không thể chuyển từ trạng thái ${booking.status} sang ${status}`);
    }

    await this.repository.update(id, { status });

    const action =
      status === BookingStatus.CONFIRMED ? ActionTypeEnum.BOOKING_CONFIRMED : ActionTypeEnum.BOOKING_CANCEL;
    await this.sendNotificationBooking(booking, action);

    return ApiResponseHandler.updateSuccess("OK", status);
  }
}
