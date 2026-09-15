import { inject, injectable } from "inversify";
import { EntityManager, In, Repository } from "typeorm";
import { DatabaseConfig } from "@/config/database";
import { BaseService } from "@/shared/base/BaseService";
import { Chat, ConversationTypeEnum } from "@/database/models/Chat";
import { CHAT_TYPES } from "./chat.types";
import { ChatRepository } from "./chat.repository";
import { Booking } from "@/database/models/Booking";
import { RefType, Transaction } from "@/database/models/Transaction";
import { CheckIn } from "@/database/models/CheckIn";
import { User } from "@/database/models/User";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/shared/types/errors";
import { CreateChatDto } from "./chat.validator";
import { SocketUtils } from "@/shared/utils/socket.utils";
import { SeenMessage } from "@/database/models/SeenMessage";
import { SeenMessageRepository } from "../seenMessage/seenMessage.repository";
import { DEVICE_TYPES } from "../device/device.types";
import { DeviceService } from "../device/device.service";
import { sendFcmPush } from "@/shared/utils/fcm.utils";
import { getUserHasPermission } from "@/shared/utils/getRole.utils";
import logger from "@/shared/utils/logger";

const STRIP_FIELDS = [
  "tempId",
  "note",
  "creatorId",
  "creator",
  "updaterId",
  "updater",
  "deleterId",
  "deleterSnapshot",
  "deletedAt",
  "isDefault",
  "sortOrder",
  "user",
];

type ConversationContext = {
  customerId: string;
  participantUserIds: string[]; // id người tham gia
  booking?: Booking;
  checkIn?: CheckIn;
};
@injectable()
export class ChatService extends BaseService<Chat> {
  protected repository: ChatRepository;
  protected searchableFields = ["content", "type"];
  protected timeField = "createdAt" as keyof Chat & string;

  constructor(
    @inject(CHAT_TYPES.ChatRepository) repository: ChatRepository,
    @inject(CHAT_TYPES.SeenMessageRepository) private seenMessageRepository: SeenMessageRepository,
    @inject(DEVICE_TYPES.DeviceService) private deviceService: DeviceService,
  ) {
    super();
    this.repository = repository;
  }

  private getCurrentUserId(req?: any): string {
    const userId = req?.userContext?.userId ?? req?.user?.userId ?? req?.userId;
    if (!userId) throw new ForbiddenError("Không xác định được người dùng đăng nhập");
    return userId;
  }

  private async getBookingContext(bookingId: string, currentUserId: string, manager?: EntityManager) {
    const repo: Repository<Booking> = manager ? manager.getRepository(Booking) : DatabaseConfig.getRepository(Booking);
    const booking = await repo.findOne({ where: { id: bookingId }, relations: { club: true } });
    if (!booking) throw new NotFoundError("Booking không tồn tại");

    const participantUserIds = [
      ...new Set([booking.userId, ...(await getUserHasPermission("booking", "read", booking.clubId))]),
    ];
    if (!participantUserIds.includes(currentUserId)) {
      throw new ForbiddenError("Bạn không có quyền chat trong booking này");
    }
    return { booking, customerId: booking.userId, participantUserIds };
  }

  private async getPaymentContext(
    refId: string,
    currentUserId: string,
    manager?: EntityManager,
  ): Promise<ConversationContext> {
    const checkInRepo: Repository<CheckIn> = manager
      ? manager.getRepository(CheckIn)
      : DatabaseConfig.getRepository(CheckIn);
    const checkIn = await checkInRepo.findOne({ where: { id: refId }, relations: { club: true } });
    if (!checkIn) throw new NotFoundError("Check-in của giao dịch không tồn tại");

    const participantUserIds = [
      ...new Set([checkIn.userId, ...(await getUserHasPermission("checkIn", "read", checkIn.clubId))]),
    ];
    if (!participantUserIds.includes(currentUserId)) {
      throw new ForbiddenError("Bạn không có quyền chat trong giao dịch này");
    }
    return { checkIn, customerId: checkIn.userId, participantUserIds };
  }

  private async getConversationContext(
    refId: string,
    type: ConversationTypeEnum,
    currentUserId: string,
    manager?: EntityManager,
  ): Promise<ConversationContext> {
    if (type === ConversationTypeEnum.BOOKING) return this.getBookingContext(refId, currentUserId, manager);
    if (type === ConversationTypeEnum.PAYMENT) return this.getPaymentContext(refId, currentUserId, manager);
    throw new BadRequestError("Loại hội thoại không hợp lệ");
  }

  private async getConversationContextByRefId(
    refId: string,
    currentUserId: string,
    manager?: EntityManager,
  ): Promise<ConversationContext> {
    const bookingRepo: Repository<Booking> = manager
      ? manager.getRepository(Booking)
      : DatabaseConfig.getRepository(Booking);
    const booking = await bookingRepo.findOne({ where: { id: refId } });
    if (booking) return this.getBookingContext(refId, currentUserId, manager);
    const checkInRepo: Repository<CheckIn> = manager
      ? manager.getRepository(CheckIn)
      : DatabaseConfig.getRepository(CheckIn);
    const checkIn = await checkInRepo.findOne({ where: { id: refId } });
    if (checkIn) return this.getPaymentContext(refId, currentUserId, manager);
    throw new NotFoundError("Không tìm thấy hội thoại");
  }

  public async markMessagesSeen(refId: string, userId: string, manager?: EntityManager): Promise<SeenMessage> {
    await this.getConversationContextByRefId(refId, userId, manager);
    const seenAt = new Date();
    const existing = await this.seenMessageRepository.findOne({ where: { refId, userId } }, manager);
    if (existing) return this.seenMessageRepository.update(existing.id, { seenAt }, manager);
    return this.seenMessageRepository.create({ refId, userId, seenAt }, manager);
  }

  public async getUnreadMessageCount(
    refId: string,
    type: ConversationTypeEnum,
    userId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const latestSeen = await this.seenMessageRepository
      .getRepository(manager)
      .createQueryBuilder("seen")
      .select("MAX(seen.seenAt)", "seenAt")
      .where("seen.refId = :refId", { refId })
      .andWhere("seen.userId = :userId", { userId })
      .andWhere("seen.deletedAt IS NULL")
      .getRawOne<{ seenAt: Date | string | null }>();

    const query = this.repository
      .getRepository(manager)
      .createQueryBuilder("chat")
      .select("COUNT(chat.id)", "count")
      .where("chat.refId = :refId", { refId })
      .andWhere("chat.type = :type", { type })
      .andWhere("chat.userId != :userId", { userId })
      .andWhere("chat.deletedAt IS NULL");
    if (latestSeen?.seenAt) query.andWhere("chat.createdAt > :seenAt", { seenAt: latestSeen.seenAt });

    const result = await query.getRawOne<{ count: string }>();
    return Number(result?.count ?? 0);
  }

  private async pushFCM(userIds: string[], message: Chat, context: ConversationContext): Promise<void> {
    try {
      const tokens = await this.deviceService.getTokensByUserIds(userIds);
      if (!tokens.length) return;
      const title = context.booking
        ? `Booking ${context.booking.code} có tin nhắn mới`
        : `Thanh toán check-in ${context.checkIn?.code ?? ""} có tin nhắn mới`;
      await sendFcmPush(tokens, title, message.content || "Có tin nhắn mới", {
        type: context.booking ? "chat-booking" : "chat-payment",
        refId: message.refId,
        conversationType: message.type,
        messageId: message.id,
      });
    } catch (error) {
      logger.error("Error sending FCM push for chat:", error);
    }
  }

  protected async validateBeforeCreate(data: CreateChatDto, manager: EntityManager, req?: any): Promise<void> {
    await super.validateBeforeCreate(data, manager, req);
    const currentUserId = this.getCurrentUserId(req);
    await this.getConversationContext(data.refId, data.type, currentUserId, manager);
    (data as any).userId = currentUserId;

    const user = await manager.getRepository(User).findOne({ where: { id: currentUserId } });
    if (user) {
      (data as any).userSnapshot = {
        id: user.id,
        username: user.username,
        fullName: (user as any).name ?? null,
        avatar: (user as any).avatar ?? null,
      };
    }
  }

  protected async afterCreate(entity: Chat, data: CreateChatDto, manager: EntityManager, req?: any): Promise<void> {
    await super.afterCreate(entity, data, manager, req);
    const currentUserId = this.getCurrentUserId(req);
    const context = await this.getConversationContext(data.refId, data.type, currentUserId, manager);
    const receiverIds = context.participantUserIds.filter((userId) => userId !== currentUserId);

    const payload: Record<string, unknown> = {
      id: entity.id,
      refId: entity.refId,
      type: entity.type,
      userId: entity.userId,
      userSnapshot: entity.userSnapshot,
      content: entity.content,
      createdAt: entity.createdAt,
    };
    if (context.booking) {
      const booking = context.booking;
      payload.booking = {
        id: booking.id,
        code: booking.code,
        userId: booking.userId,
        clubId: booking.clubId,
        start: booking.start,
        end: booking.end,
        quantity: booking.quantity,
        status: booking.status,
      };
    }
    if (context.checkIn) {
      const checkIn = context.checkIn;
      payload.checkIn = {
        id: checkIn.id,
        code: checkIn.code,
        userId: checkIn.userId,
        clubId: checkIn.clubId,
        bookingId: checkIn.bookingId,
        quantity: checkIn.quantity,
        amount: checkIn.amount,
        paid: checkIn.paid,
      };
    }
    SocketUtils.sendSocketToUsers(receiverIds, "chat:new", payload);
    await Promise.all(
      receiverIds.map(async (receiverId) => {
        const unreadMessageCount = await this.getUnreadMessageCount(entity.refId, entity.type, receiverId, manager);
        SocketUtils.sendSocketToUsers([receiverId], "unread-message-count", {
          refId: entity.refId,
          type: entity.type,
          unreadMessageCount,
        });
      }),
    );
    await this.pushFCM(receiverIds, entity, context);
  }

  public async hydrateEntities(entities: Chat[], reqContext?: any): Promise<void> {
    await super.hydrateEntities(entities, reqContext);
    await this.attachSenderRoleAndTrim(entities);
  }

  public async hydrateEntity(entity: Chat, reqContext?: any): Promise<void> {
    await super.hydrateEntity(entity, reqContext);
    await this.attachSenderRoleAndTrim([entity]);
  }

  /** Gắn senderRole (customer|leader) và bỏ field thừa để response nhẹ hơn. */
  private async attachSenderRoleAndTrim(entities: Chat[]): Promise<void> {
    const bookingChats = entities.filter((e) => e.type === ConversationTypeEnum.BOOKING && e.refId);
    if (bookingChats.length > 0) {
      const refIds = [...new Set(bookingChats.map((e) => e.refId))];
      const bookings = await DatabaseConfig.getRepository(Booking).find({
        where: { id: In(refIds) },
        relations: { club: true },
      });
      const bookingMap = new Map(bookings.map((b) => [b.id, b]));
      const bookingViewerMap = new Map(
        await Promise.all(
          [...new Set(bookings.map((booking) => booking.clubId))].map(
            async (clubId) => [clubId, new Set(await getUserHasPermission("booking", "read", clubId))] as const,
          ),
        ),
      );
      for (const entity of bookingChats) {
        const booking = bookingMap.get(entity.refId);
        if (!booking) continue;
        (entity as any).senderRole =
          entity.userId === booking.userId
            ? "customer"
            : bookingViewerMap.get(booking.clubId)?.has(entity.userId)
              ? "staff"
              : "unknown";
      }
    }
    const paymentChats = entities.filter((e) => e.type === ConversationTypeEnum.PAYMENT && e.refId);
    if (paymentChats.length > 0) {
      const refIds = [...new Set(paymentChats.map((e) => e.refId))];
      const checkInIds = refIds;
      const checkIns = checkInIds.length
        ? await DatabaseConfig.getRepository(CheckIn).find({ where: { id: In(checkInIds) }, relations: { club: true } })
        : [];
      const checkInMap = new Map(checkIns.map((checkIn) => [checkIn.id, checkIn]));
      const checkInViewerMap = new Map(
        await Promise.all(
          [...new Set(checkIns.map((checkIn) => checkIn.clubId))].map(
            async (clubId) => [clubId, new Set(await getUserHasPermission("checkIn", "read", clubId))] as const,
          ),
        ),
      );
      for (const entity of paymentChats) {
        const checkIn = checkInMap.get(entity.refId);
        (entity as any).senderRole =
          entity.userId === checkIn?.userId
            ? "customer"
            : checkIn && checkInViewerMap.get(checkIn.clubId)?.has(entity.userId)
              ? "staff"
              : "unknown";
      }
    }
    for (const entity of entities) {
      for (const field of STRIP_FIELDS) delete (entity as any)[field];
    }
  }
}
