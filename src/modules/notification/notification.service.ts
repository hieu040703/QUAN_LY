import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { NotificationRepository } from "./notification.repository";
import { ActionTypeEnum, Notification, NotificationTypeEnum } from "@/database/models/Notification";
import { NotificationRelations, NotificationSelectBasic } from "./notification.select";
import { SocketUtils } from "@/shared/utils/socket.utils";
import { getNotificationData, mapHighlightValues } from "@/shared/utils/notification.utils";
import logger from "@/shared/utils/logger";
import { NOTIFICATION_TYPES } from "./notification.types";
import { UserNotification } from "@/database/models/UserNotification";
import { EntityManager, In, IsNull, Not } from "typeorm";
import { User, UserType } from "@/database/models/User";
import { UserRepository, USER_TYPES } from "../user";
import { DeviceService, DEVICE_TYPES } from "../device";
import { sendFcmPush } from "@/shared/utils/fcm.utils";

@injectable()
export class NotificationService extends BaseService<Notification> {
  protected repository: NotificationRepository;
  protected findOptions = {};
  protected relations = NotificationRelations;
  protected selectedFields = NotificationSelectBasic;

  constructor(
    @inject(NOTIFICATION_TYPES.NotificationRepository)
    repository: NotificationRepository,
    @inject(USER_TYPES.UserRepository) private userRepository: UserRepository,
    @inject(DEVICE_TYPES.DeviceService) private deviceService: DeviceService,
  ) {
    super();
    this.repository = repository;
  }

  /**
   * Tạo notification dựa trên entity (ví dụ: Activity) và gửi đến các user liên quan
   * @param data
   * @param type
   * @param action
   * @param userIds
   */
  async createNotificationByEntity(
    data: any,
    type: NotificationTypeEnum,
    action: ActionTypeEnum,
    userIds: string[] = [],
  ): Promise<void> {
    try {
      const notificationData: Partial<Notification> = getNotificationData(data, type, action);

      await this.createNotification(notificationData, userIds);
    } catch (error) {
      logger.error("Error creating notification by entity:", error);
    }
  }

  async createNotificationByEntityWithDedupe(
    data: any,
    type: NotificationTypeEnum,
    action: ActionTypeEnum,
    userIds: string[],
    dedupeKey: string,
  ): Promise<void> {
    try {
      const notificationData: Partial<Notification> = getNotificationData(data, type, action);
      await this.createNotificationWithDedupe(notificationData, userIds, dedupeKey);
    } catch (error) {
      logger.error("Error creating deduplicated notification by entity:", error);
    }
  }

  async createNotification(
    notificationData: Partial<Notification>,
    userIds: string[] = [],
    manager?: EntityManager,
  ): Promise<void> {
    try {
      if (userIds.length === 0) {
        return;
      }

      // Nếu trong danh sách nhận có nhân viên → gửi luôn cho admin
      const targetUserIds = [...new Set(userIds.filter(Boolean))];

      // Tạo notification trước
      const notification = await this.repository.create(notificationData, manager);

      // Nếu có userIds, tạo userNotifications tương ứng
      const userNotificationData = targetUserIds.map((userId) => ({
        userId,
        notificationId: notification.id,
        isRead: false,
      }));

      // Sử dụng TypeORM để tạo userNotifications
      await this.repository
        .getRepository(manager)
        .manager.createQueryBuilder()
        .insert()
        .into("user_notifications")
        .values(userNotificationData)
        .execute();

      SocketUtils.sendSocketNotifications(targetUserIds, "notification", notification);

      // Gửi push FCM cho khách hàng
      await this.sendFcmNotification(targetUserIds, notification, manager);
    } catch (error) {
      logger.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Nếu danh sách người nhận có nhân viên (user có customerId NULL) thì bổ sung
   * tất cả tài khoản admin (username = 'admin') vào danh sách để admin luôn nhận được.
   */
  private async includeAdminForEmployees(userIds: string[], manager?: EntityManager): Promise<string[]> {
    try {
      const repo = this.userRepository.getRepository(manager);
      const employeeExists = await repo
        .createQueryBuilder("employee")
        .select("employee.id", "id")
        .where("employee.id IN (:...userIds)", { userIds })
        .andWhere("employee.type = :employeeType", { employeeType: UserType.EMPLOYEE })
        .getRawOne();

      if (!employeeExists) return userIds;

      const admins = await repo.find({
        where: { username: "admin" },
        select: ["id"],
      });
      const adminIds = admins.map((a) => a.id);

      return [...new Set([...userIds, ...adminIds])];
    } catch (error) {
      logger.error("Error including admin for employee notification:", error);
      return userIds;
    }
  }

  private async existsByDedupeKey(dedupeKey: string, manager?: EntityManager): Promise<boolean> {
    const existed = await this.repository
      .getRepository(manager)
      .createQueryBuilder("notification")
      .select("notification.id", "id")
      .where("notification.deletedAt IS NULL")
      .andWhere("notification.metadata ->> 'dedupeKey' = :dedupeKey", {
        dedupeKey,
      })
      .limit(1)
      .getRawOne();

    return !!existed?.id;
  }

  private async createNotificationWithDedupe(
    notificationData: Partial<Notification>,
    userIds: string[],
    dedupeKey: string,
    manager?: EntityManager,
  ): Promise<void> {
    if (!userIds.length) return;

    const existed = await this.existsByDedupeKey(dedupeKey, manager);
    if (existed) return;

    await this.createNotification(
      {
        ...notificationData,
        metadata: {
          ...(notificationData.metadata || {}),
          dedupeKey,
        },
      },
      userIds,
      manager,
    );
  }

  async sendManualCollectorNotification(
    payload: {
      title: string;
      content: string;
      branchId?: string;
      collectorIds?: string[];
      senderId?: string;
      senderName?: string;
    },
    manager?: EntityManager,
  ): Promise<number> {
    const { title, content, collectorIds, senderId, senderName } = payload;

    const qb = this.repository
      .getRepository(manager)
      .manager.createQueryBuilder(User, "collector")
      .select("collector.id", "id")
      .where("collector.deletedAt IS NULL")
      .andWhere("collector.isActive = :isActive", { isActive: true })
      .andWhere("collector.type = :employeeType", { employeeType: UserType.EMPLOYEE });

    if (collectorIds?.length) {
      qb.andWhere("collector.id IN (:...collectorIds)", { collectorIds });
    }

    const rows = await qb.getRawMany<{ id: string }>();
    const userIds = rows.map((row) => row.id);

    if (!userIds.length) {
      return 0;
    }

    await this.createNotification(
      {
        title,
        content,
        type: NotificationTypeEnum.COLLECTOR,
        action: ActionTypeEnum.NOTIFICATION,
        metadata: {
          senderId,
          senderName,
        },
      },
      userIds,
      manager,
    );

    return userIds.length;
  }
  // Lấy notifications của user cụ thể
  async getUserNotifications(userId: string, page: number = 1, size: number = 20): Promise<any> {
    const offset = (page - 1) * size;

    const qb = this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .select(["n.*", 'un.isRead AS "isRead"'])
      .from(Notification, "n")
      .innerJoin(UserNotification, "un", "n.id = un.notificationId")
      .where("un.userId = :userId", { userId })
      .andWhere("n.deletedAt IS NULL")
      .orderBy("n.createdAt", "DESC")
      .limit(size)
      .offset(offset);

    const notifications = await qb.getRawMany();

    const countQb = this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .select("COUNT(*)", "total")
      .from(Notification, "n")
      .innerJoin(UserNotification, "un", "n.id = un.notificationId")
      .where("un.userId = :userId", { userId })
      .andWhere("n.deletedAt IS NULL");

    const { total } = await countQb.getRawOne();

    const unreadQb = this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .select("COUNT(*)", "totalUnread")
      .from(Notification, "n")
      .innerJoin(UserNotification, "un", "n.id = un.notificationId")
      .where("un.userId = :userId", { userId })
      .andWhere("n.deletedAt IS NULL")
      .andWhere("un.isRead = :isRead", { isRead: false });

    const { totalUnread } = await unreadQb.getRawOne();

    return {
      data: notifications,
      total: parseInt(total) || 0,
      page,
      size,
      totalPages: Math.ceil(parseInt(total) / size),
      totalUnread: parseInt(totalUnread) || 0,
    };
  }

  // Đánh dấu notification đã đọc
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .update(UserNotification)
      .set({ isRead: true })
      .where("userId = :userId", { userId })
      .andWhere("notificationId = :notificationId", { notificationId })
      .execute();
  }

  // Đánh dấu nhiều notifications đã đọc
  async markManyAsRead(userId: string, notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;

    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .update(UserNotification)
      .set({ isRead: true })
      .where("userId = :userId", { userId })
      .andWhere("notificationId IN (:...notificationIds)", { notificationIds })
      .execute();
  }

  // Đánh dấu tất cả notifications của user đã đọc
  async markAllAsRead(userId: string): Promise<void> {
    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .update(UserNotification)
      .set({ isRead: true })
      .where("userId = :userId", { userId })
      .andWhere("isRead = :isRead", { isRead: false })
      .execute();
  }

  // Xóa notification
  async deleteNotification(notificationId: string): Promise<void> {
    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .update(Notification)
      .set({ deletedAt: new Date() })
      .where("id = :id", { id: notificationId })
      .execute();
  }

  // Khôi phục notification
  async restoreNotification(notificationId: string): Promise<void> {
    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .update(Notification)
      .set({ deletedAt: null })
      .where("id = :id", { id: notificationId })
      .execute();
  }

  // Xóa vĩnh viễn notification
  async permanentDeleteNotification(notificationId: string): Promise<void> {
    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .delete()
      .from(Notification)
      .where("id = :id", { id: notificationId })
      .execute();
  }

  private async sendFcmNotification(userIds: string[], data: Notification, manager?: EntityManager): Promise<void> {
    try {
      if (!userIds.length) return;

      const tokens = await this.deviceService.getTokensByUserIds(userIds);
      if (!tokens.length) return;

      const body = mapHighlightValues(data.content, data.metadata?.highlightValues || []);
      await sendFcmPush(tokens, data.title, body, {
        notificationId: data.id,
        type: data.type,
        action: data.action,
        entityId: data.oId,
        metadata: JSON.stringify(data.metadata?.data ?? {}),
      });
    } catch (error) {
      logger.error("Error sending FCM notification:", error);
    }
  }
}
