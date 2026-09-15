import { inject, injectable } from "inversify";
import { EntityManager, DeepPartial } from "typeorm";
import { UserTarget, UserTargetStatus, UserTargetType } from "@/database/models/UserTarget";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { UserTargetRepository } from "./userTarget.repository";
import { USER_TARGET_TYPES } from "./userTarget.types";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { HealthIndicatorRepository } from "@/modules/healthIndicator/healthIndicator.repository";
import { HEALTH_INDICATOR_TYPES } from "@/modules/healthIndicator/healthIndicator.types";
import { buildSummary } from "./userTarget.progress.util";
import DatabaseConfig from "@/config/database";
import { CheckIn } from "@/database/models/CheckIn";
import { HealthIndicator } from "@/database/models/HealthIndicator";

@injectable()
export class UserTargetService extends BaseService<UserTarget> {
  protected repository: UserTargetRepository;

  constructor(
    @inject(USER_TARGET_TYPES.UserTargetRepository)
    repository: UserTargetRepository,
    @inject(HEALTH_INDICATOR_TYPES.HealthIndicatorRepository)
    private healthIndicatorRepository: HealthIndicatorRepository,
  ) {
    super();
    this.repository = repository;
  }

  /**
   * Hook chạy TRƯỚC khi tạo, bên trong transaction có sẵn của BaseService.create().
   * Tự động gán startValue + current = cân nặng mới nhất từ health_indicators.
   */
  protected async validateBeforeCreate(
    data: DeepPartial<UserTarget>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const userId = req?.userContext?.userId;
    if (!userId) {
      throw new BadRequestError("Thiếu userId để tạo mục tiêu");
    }
    if ((data.current ?? 0) === (data.target ?? 0)) throw new BadRequestError("Mục tiêu không hợp lệ");

    const runningTarget = await this.repository
      .getRepository(manager)
      .createQueryBuilder("ut")
      .where("ut.userId = :userId", { userId })
      .andWhere("ut.status = :status", { status: UserTargetStatus.PENDING })
      .andWhere("ut.deadline < :now", { now: new Date() })
      .andWhere("ut.deletedAt IS NULL")
      .getOne();
    if (runningTarget) {
      throw new BadRequestError("Bạn đang có mục tiêu chưa hoàn thành và chưa hết hạn, không thể tạo mục tiêu mới");
    }

    const latestWeight = await this.getLatestWeight(userId, manager);
    const currentWeight = data.current ?? latestWeight ?? 0;
    if (!data.startValue) {
      data.startValue = currentWeight;
    }
    data.current = currentWeight;
    data.userId = userId;
    data.type = currentWeight <= (data.target ?? 0) ? UserTargetType.UP : UserTargetType.DOWN;
  }

  private async getLatestWeight(userId: string, manager?: EntityManager): Promise<number | null> {
    const latest = await this.healthIndicatorRepository
      .getRepository(manager)
      .createQueryBuilder("hi")
      .where("hi.userId = :userId", { userId })
      .andWhere("hi.weight IS NOT NULL")
      .andWhere("hi.deletedAt IS NULL")
      .orderBy("hi.timeAt", "DESC")
      .limit(1)
      .getOne();

    return latest?.weight ?? null;
  }

  async getSummary(userId: string) {
    const userTarget = await this.repository.findOne({ where: { userId }, order: { createdAt: "DESC" } });
    if (!userTarget) return null;

    const summary = buildSummary({
      startValue: userTarget.startValue,
      target: userTarget.target,
      current: userTarget.current,
      startTime: userTarget.startTime,
      deadline: userTarget.deadline,
    });
    return {
      startValue: userTarget.startValue,
      target: userTarget.target,
      current: userTarget.current,
      startTime: userTarget.startTime,
      deadline: userTarget.deadline,
      status: userTarget.status,
      ...summary,
    };
  }

  async getAchievements(userId: string) {
    const repo = DatabaseConfig.manager;
    const [checkInCount, healthIndicator, targetCountCompleted] = await Promise.all([
      repo.getRepository(CheckIn).count({
        where: { userId },
      }),
      repo.getRepository(HealthIndicator).findOne({ where: { userId }, order: { createdAt: "DESC" } }),
      repo.getRepository(UserTarget).count({ where: { userId, status: UserTargetStatus.COMPLETED } }),
    ]);

    return {
      checkInCount,
      healthIndicator,
      targetCountCompleted,
    };
  }
}
