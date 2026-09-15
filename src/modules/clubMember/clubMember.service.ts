import { inject, injectable } from "inversify";
import { EntityManager } from "typeorm";
import { ClubMember, MemberStatus, RoleClub } from "@/database/models/ClubMember";
import { BaseService } from "@/shared/base/BaseService";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { RequestContext } from "@/shared/types/interfaces";
import { ClubMemberRepository } from "./clubMember.repository";
import { CLUB_MEMBER_TYPES } from "./clubMember.types";
import { CreateClubMemberDto, UpdateMemberStatusDto } from "./clubMember.validator";
import { ActionTypeEnum, NotificationTypeEnum } from "@/database/models/Notification";
import { getUserHasPermission } from "@/shared/utils/getRole.utils";
import { NOTIFICATION_TYPES, NotificationService } from "../notification";

@injectable()
export class ClubMemberService extends BaseService<ClubMember> {
  protected repository: ClubMemberRepository;
  protected searchableFields = ["status", "role", "memberNote", "note"];
  protected uniqueFields?: (keyof ClubMember)[] = ["userId"];
  protected uniqueScope?: (keyof ClubMember)[] = ["clubId"];

  constructor(
    @inject(CLUB_MEMBER_TYPES.ClubMemberRepository)
    repository: ClubMemberRepository,
    @inject(NOTIFICATION_TYPES.NotificationService) private notificationService: NotificationService,
  ) {
    super();
    this.repository = repository;
  }

  override async create(
    dto: CreateClubMemberDto,
    manager?: EntityManager,
    reqContext?: RequestContext,
  ): Promise<ClubMember> {
    const existingMember = await this.repository.findOne(
      {
        where: {
          clubId: dto.clubId,
          userId: dto.userId,
        },
      },
      manager,
    );
    if (existingMember) {
      if (existingMember.status === MemberStatus.BLOCKED) {
        throw new BadRequestError("Tài khoản này đã bị chặn khỏi câu lạc bộ");
      }
      if (existingMember.status === MemberStatus.ACTIVE || existingMember.status === MemberStatus.PENDING) {
        throw new BadRequestError("Tài khoản đã là thành viên hoặc đang chờ duyệt");
      }
      if (existingMember.status === MemberStatus.OUT) {
        const member = await this.repository.update(
          existingMember.id,
          {
            status: MemberStatus.PENDING,
            role: RoleClub.MEMBER,
            memberNote: dto.memberNote ?? existingMember.memberNote,
          },
          manager,
        );

        this.createNotificationMember(existingMember, ActionTypeEnum.MEMBER_PENDING);
        return member;
      }

      throw new BadRequestError("Hội viên đã tồn tại trong câu lạc bộ", "userId");
    }

    const member = await super.create(
      {
        ...dto,
        status: MemberStatus.PENDING,
      },
      manager,
      reqContext,
    );

    this.createNotificationMember(member, ActionTypeEnum.MEMBER_PENDING);
    return member;
  }

  protected async validateBeforeDelete(id: string, manager: EntityManager, req?: RequestContext): Promise<void> {
    const member = await this.repository.findById(id, manager);
    if (!member) {
      throw new NotFoundError("Không tìm thấy thành viên trong câu lạc bộ");
    }
    if (member.role === RoleClub.LEADER) {
      throw new BadRequestError("Không thể xóa trưởng câu lạc bộ");
    }
  }

  async createNotificationMember(data: ClubMember, action: ActionTypeEnum) {
    const userIds =
      action === ActionTypeEnum.MEMBER_ACTIVE || action === ActionTypeEnum.MEMBER_BLOCK
        ? [data.userId]
        : await getUserHasPermission("clubMember", "approve", data.clubId);

    const dataNotification = {
      id: data.clubId,
      name: data.user?.name,
      clubName: data.club?.name,
    };

    await this.notificationService.createNotificationByEntity(
      dataNotification,
      NotificationTypeEnum.CLUB_MEMBER,
      action,
      userIds,
    );
  }

  async updateStatus(
    id: string,
    status: MemberStatus,
    manager?: EntityManager,
    reqContext?: RequestContext,
  ): Promise<ClubMember> {
    const member = await this.repository.findById(id, manager);
    if (!member) {
      throw new NotFoundError("Không tìm thấy thành viên trong câu lạc bộ");
    }

    if (member.role === RoleClub.LEADER) {
      throw new BadRequestError("Không thể cập nhật trạng thái của trưởng câu lạc bộ");
    }

    const allowStatus: Record<MemberStatus, MemberStatus[]> = {
      [MemberStatus.PENDING]: [],
      [MemberStatus.ACTIVE]: [MemberStatus.PENDING, MemberStatus.BLOCKED, MemberStatus.OUT],
      [MemberStatus.OUT]: [MemberStatus.ACTIVE],
      [MemberStatus.BLOCKED]: [MemberStatus.ACTIVE, MemberStatus.PENDING, MemberStatus.OUT],
    };

    const allowedPreviousStatuses = allowStatus[status] ?? [];
    if (!allowedPreviousStatuses.includes(member.status)) {
      throw new BadRequestError(`Trạng thái thành viên không thể chuyển từ trạng thái ${member.status} sang ${status}`);
    }

    const updatedMember = await this.update(id, { status }, manager, reqContext);
    if (!updatedMember) {
      throw new NotFoundError("Cập nhật trạng thái không thành công");
    }

    const action =
      status === MemberStatus.ACTIVE
        ? ActionTypeEnum.MEMBER_ACTIVE
        : status === MemberStatus.BLOCKED
          ? ActionTypeEnum.MEMBER_BLOCK
          : ActionTypeEnum.MEMBER_OUT;
    this.createNotificationMember(member, action);

    return updatedMember;
  }
}
