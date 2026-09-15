import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager, LessThanOrEqual, MoreThan } from "typeorm";
import { CheckIn, CheckInDirection } from "@/database/models/CheckIn";
import { Booking, BookingStatus } from "@/database/models/Booking";
import { UserPacket, UserPacketStatus } from "@/database/models/UserPacket";
import { Packet } from "@/database/models/Packet";
import { BaseService, IFindOptions } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { ApiResponseHandler } from "@/shared/utils/response.utils";
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/shared/types/errors";
import { CheckInReportQuery, CheckInRepository } from "./checkIn.repository";
import { CheckInTopMembersQueryDto } from "./checkIn.validator";
import { CHECK_IN_TYPES } from "./checkIn.types";
import { USER_PACKET_TYPES } from "../userPacket/userPacket.types";
import { UserPacketRepository } from "../userPacket/userPacket.repository";
import { PACKET_TYPES } from "../packet/packet.types";
import { PacketRepository } from "../packet/packet.repository";
import { BOOKING_TYPES } from "../booking/booking.types";
import { BookingRepository } from "../booking/booking.repository";
import { TRANSACTION_TYPES } from "../transaction/transaction.types";
import { TransactionService } from "../transaction/transaction.service";
import { CLUB_TYPES } from "../club/club.types";
import { ClubRepository } from "../club/club.repository";
import { USER_TYPES } from "../user/user.types";
import { UserRepository } from "../user/user.repository";
import { NOTIFICATION_TYPES, NotificationService } from "../notification";
import { ActionTypeEnum, NotificationTypeEnum } from "@/database/models/Notification";
import { getUserHasPermission } from "@/shared/utils/getRole.utils";
import { ChatService } from "../chat/chat.service";
import { CHAT_TYPES } from "../chat/chat.types";
import { ConversationTypeEnum } from "@/database/models/Chat";

export type CheckInReportOptions = IFindOptions<CheckIn> & {
  clubId: string;
  direction?: CheckInDirection;
};

@injectable()
export class CheckInService extends BaseService<CheckIn> {
  protected repository: CheckInRepository;
  protected searchableFields = ["code", "note"];
  protected timeField = "createdAt" as keyof CheckIn & string;

  constructor(
    @inject(CHECK_IN_TYPES.CheckInRepository)
    repository: CheckInRepository,
    @inject(USER_PACKET_TYPES.UserPacketRepository)
    private userPacketRepository: UserPacketRepository,
    @inject(PACKET_TYPES.PacketRepository)
    private packetRepository: PacketRepository,
    @inject(BOOKING_TYPES.BookingRepository)
    private bookingRepository: BookingRepository,
    @inject(TRANSACTION_TYPES.TransactionService)
    private transactionService: TransactionService,
    @inject(CLUB_TYPES.ClubRepository)
    private clubRepository: ClubRepository,
    @inject(USER_TYPES.UserRepository)
    private userRepository: UserRepository,
    @inject(NOTIFICATION_TYPES.NotificationService) private notificationService: NotificationService,
    @inject(CHAT_TYPES.ChatService) private chatService: ChatService,
  ) {
    super();
    this.repository = repository;
  }

  protected async attachMoreDataToEntities(entities: CheckIn[], req?: RequestContext): Promise<void> {
    const userId = req?.userContext?.userId;
    if (!userId) return;

    await Promise.all(
      entities.map(async (checkIn) => {
        const unreadMessageCount = await this.chatService.getUnreadMessageCount(
          checkIn.id,
          ConversationTypeEnum.PAYMENT,
          userId,
        );
        Object.assign(checkIn, { unreadMessageCount });
      }),
    );
  }

  protected async attachMoreDataToEntity(entity: CheckIn, req?: RequestContext): Promise<void> {
    await this.attachMoreDataToEntities([entity], req);
  }

  protected async validateBeforeCreate(data: DeepPartial<CheckIn>, manager: EntityManager): Promise<void> {
    const userId = data.userId;
    const clubId = data.clubId;
    const quantity = Number(data.quantity);

    if (!userId || !clubId) {
      throw new BadRequestError("Người dùng và CLB là bắt buộc");
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestError("Số lượng check-in phải là số nguyên dương");
    }

    const userPacket = await this.getUserPacket(data, manager);
    if (userPacket.userId !== userId) {
      throw new BadRequestError("Gói không thuộc người dùng này");
    }

    if (userPacket.clubId === clubId) {
      data.paid = true;
    }

    const now = new Date();
    if (userPacket.status !== UserPacketStatus.ACTIVE) {
      throw new BadRequestError("Gói của người dùng không còn hoạt động");
    }
    if (userPacket.endTime.getTime() < now.getTime()) {
      await this.userPacketRepository.update(userPacket.id, { status: UserPacketStatus.END }, manager);
      throw new BadRequestError("Gói của người dùng đã hết hạn");
    }

    const remainingQuantity = Number(userPacket.remainingQuantity);
    if (!Number.isInteger(remainingQuantity) || remainingQuantity < quantity) {
      throw new BadRequestError("Số lượt còn lại của gói không đủ");
    }

    const packet = await this.packetRepository.findById(userPacket.packetId, manager);
    if (!packet) throw new BadRequestError("Gói không tồn tại trên hệ thống");

    // quota = 1 là gói ngày. Gói nhiều lượt đã thanh toán theo packet,
    // nên check-in chỉ trừ lượt và không phát sinh thêm tiền.
    const isDailyPacket = packet.quota === 1;
    let amount = userPacket.amount / userPacket.quota;

    const booking = await this.findCurrentBooking(userId, clubId, now, manager);
    if (booking) data.bookingId = booking.id;

    if (isDailyPacket) {
      amount = Number(booking ? packet.bookingAmount : packet.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new BadRequestError("Giá của gói không hợp lệ");
      }
    }

    data.userPacketId = userPacket.id;
    data.amount = amount * quantity;
  }

  protected async afterCreate(entity: CheckIn, data: DeepPartial<CheckIn>, manager: EntityManager): Promise<void> {
    if (!entity.userPacketId) {
      throw new BadRequestError("Check-in chưa được gắn với gói người dùng");
    }

    const userPacket = await this.userPacketRepository.findById(entity.userPacketId, manager);
    if (!userPacket) throw new BadRequestError("Không tìm thấy gói người dùng");

    const remainingQuantity = userPacket.remainingQuantity - entity.quantity;
    const updatedUserPacket = await this.userPacketRepository.update(
      userPacket.id,
      {
        remainingQuantity,
        status: remainingQuantity <= 0 ? UserPacketStatus.END : UserPacketStatus.ACTIVE,
      },
      manager,
    );

    await this.transactionService.createTransactionCheckIn(
      {
        ...entity,
        userPacket: updatedUserPacket,
      },
      manager,
    );

    const booking = await this.findCurrentBooking(
      entity.userId,
      entity.clubId,
      entity.createdAt || new Date(),
      manager,
    );
    if (booking) {
      await this.bookingRepository.update(booking.id, { status: BookingStatus.CHECKED_IN }, manager);
    }
    const club = await this.clubRepository.findById(entity.clubId, manager);
    const dataNotification = {
      id: entity.id,
      clubName: club?.name,
      IdClubName: club?.id,
      timeAt: entity.createdAt,
    };
    this.notificationService.createNotificationByEntity(
      dataNotification,
      NotificationTypeEnum.CHECK_IN,
      ActionTypeEnum.SUCCESS,
      [entity.userId],
    );
  }

  private async getUserPacket(data: DeepPartial<CheckIn>, manager: EntityManager): Promise<UserPacket> {
    const userPacket = data.userPacketId
      ? await this.userPacketRepository.getRepository(manager).findOne({
          where: { id: data.userPacketId },
          lock: { mode: "pessimistic_write" },
        })
      : await this.userPacketRepository.getRepository(manager).findOne({
          where: {
            userId: data.userId,
            status: UserPacketStatus.ACTIVE,
          },
          order: { endTime: "ASC" },
          lock: { mode: "pessimistic_write" },
        });

    if (!userPacket) {
      throw new BadRequestError("Người dùng không có gói đang hoạt động");
    }

    return userPacket;
  }

  private async findCurrentBooking(
    userId: string,
    clubId: string,
    timeAt: Date,
    manager: EntityManager,
  ): Promise<Booking | null> {
    return this.bookingRepository.findOne(
      {
        where: {
          userId,
          clubId,
          status: BookingStatus.CONFIRMED,
          start: LessThanOrEqual(timeAt),
          end: MoreThan(timeAt),
        },

        order: { start: "DESC" },
      },
      manager,
    );
  }

  async report(query: CheckInReportOptions, direction: CheckInDirection | undefined, userId?: string) {
    if (!userId) throw new UnauthorizedError("User not authenticated");
    if (!query.clubId) throw new BadRequestError("clubId là bắt buộc", "clubId");

    if (direction && !Object.values(CheckInDirection).includes(direction)) {
      throw new BadRequestError("Hướng báo cáo check-in không hợp lệ", "direction");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("userId.not_found");

    const club = await this.clubRepository.findById(query.clubId);
    if (!club) throw new NotFoundError("clubId.not_found");

    // Always load both sides so that a direction-specific response still has
    // an accurate payable and receivable summary.
    const directions = [CheckInDirection.IN, CheckInDirection.OUT] as const;

    const reportResults = await Promise.all(
      directions.map(async (reportDirection) => {
        const checkIn = await this.findAllWithPagination({
          ...query,
          // The public report accepts one clubId. Internally the same club is
          // matched against the service club for IN and package-owning club for OUT.
          clubId: undefined,
          clubIds: undefined,
          direction: undefined,
          summaryFields: ["amount"],
          reportClubId: query.clubId,
          reportDirection,
        } as unknown as IFindOptions<CheckIn> & CheckInReportQuery);

        await Promise.all(
          checkIn.data.map(async (checkIn) => {
            const unreadMessageCount = await this.chatService.getUnreadMessageCount(
              checkIn.id,
              ConversationTypeEnum.PAYMENT,
              userId,
            );
            Object.assign(checkIn, { unreadMessageCount });
          }),
        );

        return checkIn;
      }),
    );

    const resultByDirection = new Map(directions.map((item, index) => [item, reportResults[index]]));
    const receivable = resultByDirection.get(CheckInDirection.IN);
    const payable = resultByDirection.get(CheckInDirection.OUT);

    const totalReceivableDebt = Number(receivable?.summary?.amount ?? 0);
    const totalPayableDebt = Number(payable?.summary?.amount ?? 0);
    const summary = {
      totalIn: totalReceivableDebt,
      totalOut: totalPayableDebt,
    };

    if (direction) {
      const selected = resultByDirection.get(direction)!;
      return { ...selected, summary };
    }

    return ApiResponseHandler.getSuccess(
      "OK",
      {
        receivable: receivable?.data ?? [],
        payable: payable?.data ?? [],
      },
      undefined,
      summary,
    );
  }

  async getTopMembers(query: CheckInTopMembersQueryDto) {
    if (!query.clubId) throw new BadRequestError("clubId is required", "clubId");

    const club = await this.clubRepository.findById(query.clubId);
    if (!club) throw new NotFoundError("clubId.not_found");

    const data = await this.repository.getTopMembersByClub(query.clubId, query.startAt, query.endAt, 5);
    return ApiResponseHandler.getSuccess("OK", data);
  }

  async paidCheckIn(checkInId: string, manager?: EntityManager) {
    const checkIn = await this.repository.findById(checkInId, manager);
    if (!checkIn) throw new NotFoundError("Không tìm thấy check-in");

    if (checkIn.paid) {
      throw new BadRequestError("Check-in đã được thanh toán");
    }

    await this.repository.update(checkInId, { paid: true }, manager);
    return ApiResponseHandler.getSuccess("Thanh toán check-in thành công", { id: checkInId });
  }

  async collectCheckIn(checkInId: string, clubId?: string, manager?: EntityManager) {
    if (!clubId) throw new BadRequestError("Thiếu header x-club-id", "x-club-id");

    const checkIn = await this.repository.findById(checkInId, manager);
    if (!checkIn) throw new NotFoundError("Không tìm thấy check-in");

    if (checkIn.paid) {
      throw new BadRequestError("Lượt check-in này đã được thanh toán");
    }

    if (!checkIn.userPacketId) {
      throw new BadRequestError("Check-in chưa được gắn với gói người dùng");
    }

    const userPacket = await this.userPacketRepository.findById(checkIn.userPacketId, manager);
    if (!userPacket) throw new NotFoundError("Không tìm thấy gói người dùng");

    if (userPacket.clubId === clubId || checkIn.clubId !== clubId || Number(checkIn.amount) <= 0) {
      throw new BadRequestError("Check-in không thuộc khoản tiền CLB này được thu");
    }

    await this.repository.update(checkInId, { paid: true }, manager);

    const [packetClub, permissionUserIds] = await Promise.all([
      this.clubRepository.findById(userPacket.clubId, manager),
      getUserHasPermission("checkIn", "update", userPacket.clubId),
    ]);
    const recipientIds = new Set(permissionUserIds);
    if (packetClub?.leaderId) recipientIds.add(packetClub.leaderId);

    await this.notificationService.createNotificationByEntity(
      {
        id: checkIn.id,
        userName: checkIn.user?.name,
        packetName: userPacket.packet?.name,
        clubName: checkIn.club?.name,
        timeAt: checkIn.createdAt,
        amount: checkIn.amount,
      },
      NotificationTypeEnum.CHECK_IN,
      ActionTypeEnum.COLLECTED,
      [...recipientIds],
    );

    return ApiResponseHandler.getSuccess("Thu tiền check-in thành công", {
      id: checkInId,
      amount: checkIn.amount,
    });
  }
}
