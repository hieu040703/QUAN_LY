import { inject, injectable } from "inversify";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DeepPartial, EntityManager, In, LessThan, MoreThan } from "typeorm";
import { config } from "@/config/env";
import { Club } from "@/database/models/Club";
import { ClubActivity } from "@/database/models/ClubActivity";
import { BookingStatus } from "@/database/models/Booking";
import { ClubMember, MemberStatus, RoleClub } from "@/database/models/ClubMember";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { BadRequestError } from "@/shared/types/errors";
import { BOOKING_TYPES } from "../booking/booking.types";
import { BookingRepository } from "../booking/booking.repository";
import { validateClubActivities } from "../clubActivity/clubActivity.service";
import { CLUB_MEMBER_TYPES } from "../clubMember/clubMember.types";
import { ClubMemberRepository } from "../clubMember/clubMember.repository";
import { ClubRepository } from "./club.repository";
import { CLUB_TYPES } from "./club.types";
import { CHECK_IN_TYPES, CheckInRepository } from "../checkIn";
import { NOTIFICATION_TYPES, NotificationService } from "../notification";
import { ActionTypeEnum, NotificationTypeEnum } from "@/database/models/Notification";
import { USER_TYPES, UserRepository } from "@/modules/user";
import { CLUB_MODULES, PermissionClubStructure } from "@/shared/middleware/clubPermission.middleware";
import { createPermissions } from "@/shared/middleware/permission.middleware";
import { CLUB_ROLE_TYPES } from "../clubRole/clubRole.types";
import { ClubRoleRepository } from "../clubRole/clubRole.repository";
import { ApiResponseHandler } from "@/shared/utils/response.utils";
dayjs.extend(utc);
dayjs.extend(timezone);

type Coordinate = {
  latitude: number;
  longitude: number;
};

type ClubWithDistance = Club & {
  distance?: number | null;
  isJoined?: boolean;
  memberStatus?: MemberStatus | null;
  clubRole: RoleClub | null;
};

type ClubActivityWithBooked = ClubActivity & {
  booked?: number;
};

const parseCoordinate = (value: unknown, min: number, max: number): number | null => {
  if (value === undefined || value === null || value === "") return null;

  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max ? coordinate : null;
};

const getUserCoordinate = (req?: RequestContext): Coordinate | null => {
  const query = req?.query as { latitude?: unknown; longitude?: unknown } | undefined;
  const latitude = parseCoordinate(query?.latitude, -90, 90);
  const longitude = parseCoordinate(query?.longitude, -180, 180);

  return latitude === null || longitude === null ? null : { latitude, longitude };
};

const calculateDistanceInMeters = (from: Coordinate, to: Coordinate): number => {
  const earthRadiusInKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 * Math.cos(fromLatitude) * Math.cos(toLatitude);
  const distanceInKm = 2 * earthRadiusInKm * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(1 - Math.min(1, a)));

  return Math.round(distanceInKm * 1000);
};

@injectable()
export class ClubService extends BaseService<Club> {
  protected repository: ClubRepository;
  protected searchableFields = ["code", "name", "hotline"];
  protected uniqueFields?: (keyof Club)[] = ["name"];

  constructor(
    @inject(CLUB_TYPES.ClubRepository)
    repository: ClubRepository,
    @inject(CLUB_MEMBER_TYPES.ClubMemberRepository)
    private clubMemberRepository: ClubMemberRepository,
    @inject(BOOKING_TYPES.BookingRepository)
    private bookingRepository: BookingRepository,
    @inject(CHECK_IN_TYPES.CheckInRepository) private checkInRepository: CheckInRepository,
    @inject(NOTIFICATION_TYPES.NotificationService) private notificationService: NotificationService,
    @inject(USER_TYPES.UserRepository)
    private userRepository: UserRepository,
    @inject(CLUB_ROLE_TYPES.ClubRoleRepository)
    private clubRoleRepository: ClubRoleRepository,
  ) {
    super();
    this.repository = repository;
  }
  private createFullClubPermissions = (): PermissionClubStructure => {
    const fullPermissions = createPermissions();

    return Object.fromEntries(
      CLUB_MODULES.map((module) => [module, fullPermissions[module] || []]),
    ) as PermissionClubStructure;
  };

  protected async validateBeforeCreate(data: DeepPartial<Club>, _manager: EntityManager): Promise<void> {
    if (Array.isArray(data.clubActivities) && data.clubActivities.length > 0) {
      validateClubActivities(data.clubActivities);
    }
  }

  protected async validateBeforeUpdate(id: string, data: DeepPartial<Club>, manager: EntityManager): Promise<void> {
    if (Object.prototype.hasOwnProperty.call(data, "leaderId")) {
      const currentClub = await manager.getRepository(Club).findOne({
        where: { id },
        select: { id: true, leaderId: true },
      });

      if (currentClub && currentClub.leaderId === (data.leaderId ?? null)) {
        // Leader không thay đổi; không chạy lại logic đồng bộ member ở afterUpdate.
        delete (data as DeepPartial<Club> & { leaderId?: string | null }).leaderId;
      }
    }

    if (!Array.isArray(data.clubActivities)) return;

    const currentActivities = await manager.getRepository(ClubActivity).find({ where: { clubId: id } });
    const currentById = new Map(currentActivities.map((activity) => [activity.id, activity]));
    const activityUpdates = data.clubActivities as DeepPartial<ClubActivity>[];

    const seenIds = new Set<string>();
    const mergedActivities = activityUpdates.map((activity) => {
      if (!activity.id) {
        return {
          day: activity.day,
          start: activity.start,
          end: activity.end,
        };
      }

      const currentActivity = currentById.get(activity.id);
      if (!currentActivity) {
        throw new BadRequestError("ClubActivity không thuộc Club này", "clubActivities");
      }
      if (seenIds.has(activity.id)) {
        throw new BadRequestError("ClubActivity bị lặp trong danh sách cập nhật", "clubActivities");
      }

      seenIds.add(activity.id);
      return {
        day: activity.day ?? currentActivity.day,
        start: activity.start ?? currentActivity.start,
        end: activity.end ?? currentActivity.end,
      };
    });

    // Đây là trạng thái cuối cùng sau đồng bộ. Các activity cũ không nằm
    // trong payload sẽ được xóa ở afterUpdate.
    validateClubActivities(mergedActivities);
  }

  protected async afterCreate(
    entity: Club,
    _data: DeepPartial<Club>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.clubRoleRepository.create(
      {
        name: "Đồng vận hành",
        clubId: entity.id,
        permissions: this.createFullClubPermissions(),
        isDefault: true,
      },
      manager,
      req,
    );

    if (!entity.leaderId) return;

    await this.clubMemberRepository.create(
      {
        clubId: entity.id,
        userId: entity.leaderId,
        role: RoleClub.LEADER,
        status: MemberStatus.ACTIVE,
      },
      manager,
      req,
    );

    const leader = await this.userRepository.findById(entity.leaderId, manager);

    this.notificationService.createNotificationByEntity(
      {
        id: entity.id,
        clubName: entity.name,
        leaderId: leader?.id,
      },
      NotificationTypeEnum.CLUB,
      ActionTypeEnum.LEADER_ASSIGNED,
      [entity.leaderId],
    );
  }

  protected async afterUpdate(entity: Club, data: DeepPartial<Club>, manager: EntityManager): Promise<void> {
    if (Object.prototype.hasOwnProperty.call(data, "leaderId")) {
      await this.syncClubLeader(entity, manager);
    }

    await this.notifyClubInfoUpdated(entity, manager);
    if (!Array.isArray(data.clubActivities)) return;

    const activityRepository = manager.getRepository(ClubActivity);
    const activityUpdates = data.clubActivities as DeepPartial<ClubActivity>[];
    const currentActivities = await activityRepository.find({ where: { clubId: entity.id } });
    const incomingIds = new Set<string>();

    for (const activity of activityUpdates) {
      if (activity.id) {
        incomingIds.add(activity.id);
        await activityRepository.update(activity.id, {
          day: activity.day,
          start: activity.start,
          end: activity.end,
        });
        continue;
      }

      await activityRepository.save(
        activityRepository.create({
          clubId: entity.id,
          day: activity.day,
          start: activity.start,
          end: activity.end,
        }),
      );
    }

    for (const currentActivity of currentActivities) {
      if (!incomingIds.has(currentActivity.id)) {
        await activityRepository.softDelete(currentActivity.id);
      }
    }
  }
  private async notifyClubInfoUpdated(entity: Club, manager: EntityManager): Promise<void> {
    const memberRepository = manager.getRepository(ClubMember);
    const members = await memberRepository.find({
      where: { clubId: entity.id, status: MemberStatus.ACTIVE },
    });
    const userIds = new Set(members.map((member) => member.userId));
    if (entity.leaderId) {
      userIds.add(entity.leaderId);
    }
    if (!userIds.size) return;
    await this.notificationService.createNotificationByEntity(
      { id: entity.id, clubName: entity.name },
      NotificationTypeEnum.CLUB,
      ActionTypeEnum.INFO_UPDATED,
      [...userIds],
    );
  }

  private async syncClubLeader(entity: Club, manager: EntityManager): Promise<void> {
    const memberRepository = manager.getRepository(ClubMember);
    const newLeaderId = entity.leaderId;
    const currentLeader = await memberRepository.findOne({
      where: {
        clubId: entity.id,
        role: RoleClub.LEADER,
      },
    });

    // Frontend có thể gửi lại leaderId hiện tại khi cập nhật các thông tin khác của CLB.
    // Trường hợp này không phải đổi leader nên không cần validate/sync lại.
    if (currentLeader?.userId === newLeaderId) return;

    let newLeader: ClubMember | null = null;
    if (newLeaderId) {
      newLeader = await memberRepository.findOne({
        where: {
          clubId: entity.id,
          userId: newLeaderId,
          status: MemberStatus.ACTIVE,
        },
      });

      if (!newLeader) {
        throw new BadRequestError("Leader must be an active member of this club", "leaderId");
      }
    }

    await memberRepository.update(
      { clubId: entity.id, role: RoleClub.LEADER },
      { role: RoleClub.MEMBER, clubRoleId: null },
    );

    if (newLeader) {
      await memberRepository.update(newLeader.id, {
        role: RoleClub.LEADER,
        clubRoleId: null,
      });
    }
  }

  protected async attachMoreDataToEntities(entities: Club[], req?: RequestContext): Promise<void> {
    const userId = req?.userContext?.userId;

    const userCoordinate = getUserCoordinate(req);
    if ((userId && entities.length > 0) || req?.query?.clubIds?.length) {
      const memberships = await this.clubMemberRepository.find({
        where: { userId },
      });
      const memberStatusByClubId = new Map(memberships.map((member) => [member.clubId, member.status]));
      const memberRoleByClubId = new Map(memberships.map((member) => [member.clubId, member.clubRole?.permissions]));

      for (const club of entities) {
        const memberStatus = memberStatusByClubId.get(club.id) ?? null;
        (club as any).memberStatus = memberStatus;
        if (req?.query?.clubIds?.length) {
          (club as any).clubRole =
            club.leaderId === userId ? this.createFullClubPermissions() : (memberRoleByClubId.get(club.id) ?? null);
        }
      }
    }

    if (userCoordinate) {
      for (const club of entities as ClubWithDistance[]) {
        const clubLatitude = parseCoordinate(club.latitude, -90, 90);
        const clubLongitude = parseCoordinate(club.longitude, -180, 180);

        club.distance =
          clubLatitude === null || clubLongitude === null
            ? null
            : calculateDistanceInMeters(userCoordinate, {
                latitude: clubLatitude,
                longitude: clubLongitude,
              });
      }
    }
  }

  private async attachBookedQuantities(entities: Club[], req?: RequestContext): Promise<void> {
    const clubsWithActivities = entities.filter((club) => Array.isArray(club.clubActivities));
    const clubIds = clubsWithActivities.map((club) => club.id).filter(Boolean);

    if (!clubIds.length) return;

    const timezoneName = config.DEFAULT_TIMEZONE || "Asia/Ho_Chi_Minh";
    const query = req?.query as { date?: unknown } | undefined;
    const targetDate = query?.date ? dayjs(query.date as string | Date).tz(timezoneName) : dayjs().tz(timezoneName);
    const targetDay = targetDate.day();
    const dayStart = targetDate.startOf("day").toDate();
    // Lấy dư thêm một ngày để vẫn đếm đúng booking giao với activity qua ngày.
    const bookingWindowEnd = targetDate.add(1, "day").endOf("day").toDate();

    const bookings = await this.bookingRepository.find({
      where: {
        clubId: In(clubIds),
        status: BookingStatus.CONFIRMED,
        start: LessThan(bookingWindowEnd),
        end: MoreThan(dayStart),
      } as any,
    });

    for (const club of clubsWithActivities) {
      const activitiesOfDay = (club.clubActivities as ClubActivityWithBooked[]).filter(
        (activity) => activity.day === targetDay,
      );
      club.clubActivities = activitiesOfDay;

      for (const activity of activitiesOfDay) {
        activity.booked = 0;

        const slotStart = this.parseLocalTime(targetDate, activity.start);
        const slotEndTime = this.parseLocalTime(targetDate, activity.end);
        if (!slotStart || !slotEndTime) continue;

        const slotEnd = slotEndTime.isAfter(slotStart) ? slotEndTime : slotEndTime.add(1, "day");
        const slotStartMs = slotStart.valueOf();
        const slotEndMs = slotEnd.valueOf();

        activity.booked = bookings
          .filter(
            (booking) =>
              booking.clubId === club.id && booking.start.getTime() < slotEndMs && booking.end.getTime() > slotStartMs,
          )
          .reduce((total, booking) => total + Number(booking.quantity || 0), 0);
      }
    }
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

  protected async attachMoreDataToEntity(entity: Club, req?: RequestContext): Promise<void> {
    await this.attachMoreDataToEntities([entity], req);
    await this.attachBookedQuantities([entity], req);

    const [totalMember, totalCheckIn] = await Promise.all([
      this.clubMemberRepository.count({ clubId: entity.id, status: MemberStatus.ACTIVE }),
      this.checkInRepository.count({ clubId: entity.id }),
    ]);

    (entity as any).totalMember = totalMember;
    (entity as any).totalCheckIn = totalCheckIn;
  }

  async updateIsActive(clubId: string, isActive: boolean) {
    await this.repository.update(clubId, { isActive });
    return ApiResponseHandler.updateSuccess("OK");
  }
}
