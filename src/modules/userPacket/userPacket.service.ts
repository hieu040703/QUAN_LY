import { inject, injectable } from "inversify";
import { UserPacket, UserPacketStatus } from "@/database/models/UserPacket";
import { BaseService, IFindOptions } from "@/shared/base/BaseService";
import { UserPacketRepository } from "./userPacket.repository";
import { USER_PACKET_TYPES } from "./userPacket.types";
import { PACKET_TYPES, PacketRepository } from "../packet";

import { TRANSACTION_TYPES } from "../transaction/transaction.types";
import { TransactionService } from "../transaction";
import { RequestContext, ApiResponse } from "@/shared/types/interfaces";
import { DeepPartial, EntityManager, MoreThan } from "typeorm";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import dayjs from "dayjs";
import { RefType } from "@/database/models/Transaction";
import { USER_TYPES, UserRepository } from "@/modules/user";
import { NOTIFICATION_TYPES, NotificationService } from "../notification";
import { ActionTypeEnum, NotificationTypeEnum } from "@/database/models/Notification";
import { ApiResponseHandler } from "@/shared/utils/response.utils";

@injectable()
export class UserPacketService extends BaseService<UserPacket> {
  protected repository: UserPacketRepository;
  protected searchableFields = ["code", "status", "note"];

  constructor(
    @inject(USER_PACKET_TYPES.UserPacketRepository)
    repository: UserPacketRepository,
    @inject(PACKET_TYPES.PacketRepository) private packetRepository: PacketRepository,
    @inject(TRANSACTION_TYPES.TransactionService)
    private transactionService: TransactionService,
    @inject(USER_TYPES.UserRepository)
    private userRepository: UserRepository,
    @inject(NOTIFICATION_TYPES.NotificationService) private notificationService: NotificationService,
  ) {
    super();
    this.repository = repository;
  }

  protected async validateBeforeCreate(
    data: DeepPartial<UserPacket>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const pack = await this.packetRepository.findById(data.packetId!, manager);
    if (!pack) throw new BadRequestError("Gói không tồn tại trên hệ thống");

    const trialPacketId = await this.getPacketTrial(manager);
    if (trialPacketId && pack.id === trialPacketId) {
      const existingTrialPacket = await this.repository.findOne(
        {
          where: { userId: data.userId, packetId: trialPacketId },
        },
        manager,
      );
      if (existingTrialPacket) {
        throw new BadRequestError("Người dùng đã nhận gói trải nghiệm trước đó");
      }
    }

    data.amount = pack.amount;
    data.bookingAmount = pack.bookingAmount;
    data.remainingQuantity = pack.quota;
    data.quota = pack.quota;
    data.endTime = dayjs(data.startTime as Date)
      .add(pack.dayLimit, "day")
      .endOf("day")
      .toDate();
  }

  protected async afterCreate(
    entity: UserPacket,
    data: DeepPartial<UserPacket>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // `repository.create()`/`save()` does not load ManyToOne relations.
    // Reload the saved record so the notification contains packet/club names.
    const [userPacket, , user] = await Promise.all([
      entity.packet && entity.club ? entity : this.repository.findById(entity.id, manager),
      this.transactionService.createTransactionAddPackage(entity, manager),
      this.userRepository.findById(entity.userId, manager),
    ]);
    const notificationEntity = userPacket || entity;

    await this.notificationService.createNotificationByEntity(
      {
        id: notificationEntity.id,
        userId: user?.id,
        userName: user?.name,
        packetName: notificationEntity.packet?.name,
        clubName: notificationEntity.club?.name,
      },
      NotificationTypeEnum.USER_PACKET,
      ActionTypeEnum.SUCCESS,
      [entity.userId],
    );
  }

  protected async validateBeforeDelete(id: string, manager: EntityManager, req?: RequestContext): Promise<void> {
    const trialPacketId = await this.getPacketTrial(manager);
    if (trialPacketId && trialPacketId === id) {
      throw new BadRequestError("Không thể xóa lịch sử gói trải nghiệm");
    }
  }

  protected async afterDelete(entity: UserPacket, manager: EntityManager, req?: RequestContext): Promise<void> {
    await this.transactionService.deleteTransactionPackage(entity, manager);
  }

  async registerTrialPackage(userId: string, clubId: string): Promise<UserPacket> {
    const trialPacketId = await this.getPacketTrial();
    if (!trialPacketId) {
      throw new NotFoundError("Không tìm thấy gói trải nghiệm");
    }

    return this.create({
      userId,
      clubId,
      packetId: trialPacketId,
      startTime: new Date(),
    });
  }

  private async getPacketTrial(manager?: EntityManager) {
    const packet = await this.packetRepository.findOne(
      {
        where: {
          code: "PKT-TRAI-NGHIEM",
          isDefault: true,
        },
      },
      manager,
    );

    return packet?.id;
  }

  async checkUsedPacketTrail(userId: string) {
    const trialPacketId = await this.getPacketTrial();
    if (!trialPacketId) return false;

    const packetUsed = await this.repository.findOne({ where: { userId, packetId: trialPacketId } });
    if (packetUsed) return true;
    return false;
  }

  override async findAllWithPagination(
    options: IFindOptions<UserPacket>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<ApiResponse<UserPacket[]>> {
    const result = await super.findAllWithPagination(options, manager, req);

    const query = options as any;
    const statusSummary = await this.repository.getStatusSummary({
      clubId: query.clubId,
      clubIds: query.clubIds,
      userId: query.userId,
      packetId: query.packetId,
      packetIds: query.packetIds,
    });

    result.summary = { ...(result.summary || {}), ...statusSummary };

    return result;
  }

  async findByUserId(userId: string): Promise<ApiResponse<UserPacket[]>> {
    const data = await this.repository.find({
      where: { userId, status: UserPacketStatus.ACTIVE, endTime: MoreThan(new Date()), remainingQuantity: MoreThan(0) },
      order: { createdAt: "DESC" },
    });
    return ApiResponseHandler.getSuccess("OK", data);
  }
}
