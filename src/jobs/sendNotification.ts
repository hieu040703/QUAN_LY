import { Cron } from "croner";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DatabaseConfig } from "@/config/database";
import { config } from "@/config/env";
import { Club } from "@/database/models/Club";
import { User } from "@/database/models/User";
import { UserPacket, UserPacketStatus } from "@/database/models/UserPacket";
import { Packet } from "@/database/models/Packet";
import { ActionTypeEnum, NotificationTypeEnum } from "@/database/models/Notification";
import { NOTIFICATION_TYPES, NotificationService } from "@/modules/notification";
import { container } from "@/config/container";
import logger from "@/shared/utils/logger";

dayjs.extend(utc);
dayjs.extend(timezone);

type ExpiringPacketRow = {
  userPacketId: string;
  userId: string;
  packetName: string;
  clubName: string;
  endTime: Date | string;
};

const notificationService = container.get<NotificationService>(NOTIFICATION_TYPES.NotificationService);

const getTodayRange = () => {
  const timezoneName = config.DEFAULT_TIMEZONE || "Asia/Ho_Chi_Minh";
  const today = dayjs().tz(timezoneName);

  return {
    today,
    startAt: today.startOf("day").toDate(),
    endAt: today.add(1, "day").startOf("day").toDate(),
  };
};

async function sendClubOpeningNotifications(todayKey: string, startAt: Date, endAt: Date): Promise<number> {
  const users = await DatabaseConfig.getRepository(User)
    .createQueryBuilder("u")
    .select("u.id", "id")
    .where("u.deletedAt IS NULL")
    .andWhere("u.isActive = :isActive", { isActive: true })
    .getRawMany<{ id: string }>();

  const userIds = users.map((user) => user.id);
  if (!userIds.length) return 0;

  const clubs = await DatabaseConfig.getRepository(Club)
    .createQueryBuilder("c")
    .select("c.id", "id")
    .addSelect("c.name", "name")
    .where("c.deletedAt IS NULL")
    .andWhere("c.isActive = :isActive", { isActive: true })
    .andWhere("c.openingDay >= :startAt", { startAt })
    .andWhere("c.openingDay < :endAt", { endAt })
    .getRawMany<{ id: string; name: string }>();

  for (const club of clubs) {
    await notificationService.createNotificationByEntityWithDedupe(
      {
        id: club.id,
        clubName: club.name,
      },
      NotificationTypeEnum.CLUB,
      ActionTypeEnum.OPENING_DAY,
      userIds,
      `club-opening:${club.id}:${todayKey}`,
    );
  }

  return clubs.length;
}

async function sendExpiringPacketNotifications(todayKey: string, now: Date, threshold: Date): Promise<number> {
  const rows = await DatabaseConfig.getRepository(UserPacket)
    .createQueryBuilder("up")
    .innerJoin(User, "u", "u.id = up.userId")
    .innerJoin(Packet, "p", "p.id = up.packetId")
    .innerJoin(Club, "c", "c.id = up.clubId")
    .select("up.id", "userPacketId")
    .addSelect("up.userId", "userId")
    .addSelect("p.name", "packetName")
    .addSelect("c.name", "clubName")
    .addSelect("up.endTime", "endTime")
    .where("up.deletedAt IS NULL")
    .andWhere("up.status = :status", { status: UserPacketStatus.ACTIVE })
    .andWhere("up.endTime > :now", { now })
    .andWhere("up.endTime <= :threshold", { threshold })
    .andWhere("u.deletedAt IS NULL")
    .andWhere("u.isActive = :isActive", { isActive: true })
    .andWhere("p.deletedAt IS NULL")
    .andWhere("c.deletedAt IS NULL")
    .getRawMany<ExpiringPacketRow>();

  for (const row of rows) {
    // Raw PostgreSQL results can return timestamptz as a string without an
    // offset. Parse it as UTC before notification.utils converts it to the
    // configured local timezone; otherwise the server timezone is applied.
    const endTime = dayjs.utc(row.endTime).toDate();

    await notificationService.createNotificationByEntityWithDedupe(
      {
        id: row.userPacketId,
        packetName: row.packetName,
        clubName: row.clubName,
        expiredAt: endTime,
      },
      NotificationTypeEnum.USER_PACKET,
      ActionTypeEnum.PACKET_EXPIRING,
      [row.userId],
      `user-packet-expiring:${row.userPacketId}:${todayKey}`,
    );
  }

  return rows.length;
}

async function sendDailyNotifications(): Promise<void> {
  const { today, startAt, endAt } = getTodayRange();
  const now = new Date();
  const threshold = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const todayKey = today.format("YYYY-MM-DD");

  const [openingClubCount, expiringPacketCount] = await Promise.all([
    sendClubOpeningNotifications(todayKey, startAt, endAt),
    sendExpiringPacketNotifications(todayKey, now, threshold),
  ]);

  logger.info(
    `[SendNotification] Đã gửi thông báo khai trương cho ${openingClubCount} CLB và ${expiringPacketCount} gói sắp hết hạn.`,
  );
}

let job: Cron | null = null;

export const SendNotificationJob = {
  start: () => {
    if (job) return;

    const timezoneName = config.DEFAULT_TIMEZONE || "Asia/Ho_Chi_Minh";
    job = new Cron(
      "0 0 1 * * *",
      { timezone: timezoneName },
      async () => {
        try {
          logger.info("[SendNotification] Bắt đầu gửi thông báo định kỳ");
          await sendDailyNotifications();
        } catch (error) {
          logger.error("[SendNotification] Lỗi khi gửi thông báo định kỳ:", error);
        }
      },
    );

    logger.info(`[SendNotification] Job đã khởi động (cron: 01:00, timezone: ${timezoneName})`);
  },

  stop: () => {
    if (!job) return;

    job.stop();
    job = null;
    logger.info("[SendNotification] Job đã dừng");
  },
};
