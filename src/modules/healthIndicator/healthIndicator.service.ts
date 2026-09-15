import { inject, injectable } from "inversify";
import { EntityManager, DeepPartial } from "typeorm";
import { HealthIndicator, TargetAchievementStatus } from "@/database/models/HealthIndicator";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { HealthIndicatorRepository } from "./healthIndicator.repository";
import { HEALTH_INDICATOR_TYPES, HealthIndicatorChartField } from "./healthIndicator.types";
import { buildHealthIndicatorSummary } from "./healthIndicator.summary.util";
import { calcExpectedValue } from "@/modules/userTarget/userTarget.progress.util";
import { UserTarget, UserTargetStatus } from "@/database/models/UserTarget";
import { USER_TARGET_TYPES } from "@/modules/userTarget/userTarget.types";
import { UserTargetRepository } from "@/modules/userTarget/userTarget.repository";
import { BadRequestError } from "@/shared/types/errors";
@injectable()
export class HealthIndicatorService extends BaseService<HealthIndicator> {
  protected repository: HealthIndicatorRepository;
  protected timeField: keyof HealthIndicator & string = "timeAt";

  constructor(
    @inject(HEALTH_INDICATOR_TYPES.HealthIndicatorRepository)
    repository: HealthIndicatorRepository,
    @inject(USER_TARGET_TYPES.UserTargetRepository)
    private userTargetRepository: UserTargetRepository,
  ) {
    super();
    this.repository = repository;
  }
  protected async afterCreate(
    entity: HealthIndicator,
    data: DeepPartial<HealthIndicator>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const targetRepository = manager.getRepository(UserTarget);
    const target = await targetRepository.findOne({
      where: {
        userId: entity.userId,
        status: UserTargetStatus.PENDING,
      },
      order: {
        createdAt: "DESC",
      },
    });
    if (!target) {
      return;
    }
    const current = Number(entity.weight);
    const targetValue = Number(target.target);
    const startValue = Number(target.startValue);
    const now = new Date();
    const deadline = new Date(target.deadline);
    target.current = current;
    if (!Number.isFinite(current) || !Number.isFinite(targetValue) || !Number.isFinite(startValue)) {
    } else if (targetValue > startValue) {
      target.status =
        current >= targetValue
          ? UserTargetStatus.COMPLETED
          : now >= deadline
            ? UserTargetStatus.FAILURE
            : UserTargetStatus.PENDING;
    } else if (targetValue < startValue) {
      target.status =
        current <= targetValue
          ? UserTargetStatus.COMPLETED
          : now >= deadline
            ? UserTargetStatus.FAILURE
            : UserTargetStatus.PENDING;
    } else {
      target.status =
        current === targetValue
          ? UserTargetStatus.COMPLETED
          : now >= deadline
            ? UserTargetStatus.FAILURE
            : UserTargetStatus.PENDING;
    }
    await targetRepository.save(target);
  }
  protected async attachMoreDataToEntities(entities: HealthIndicator[], req?: RequestContext): Promise<void> {
    for (let i = 0; i < entities.length; i++) {
      const current = entities[i];
      const previous = entities[i + 1];

      (current as any).weightDelta = previous ? Math.round((current.weight - previous.weight) * 100) / 100 : null;
      (current as any).bodyFatDelta = previous ? Math.round((current.bodyFat - previous.bodyFat) * 100) / 100 : null;
      (current as any).muscleMassDelta = previous
        ? Math.round((current.muscleMass - previous.muscleMass) * 100) / 100
        : null;
    }
  }
  protected async validateBeforeCreate(
    data: DeepPartial<HealthIndicator>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const userId = (data as any).userId;
    const weight = (data as any).weight;

    if (!userId || weight == null) return;

    const activeTarget = await this.getPendingTarget(userId, manager);
    if (!activeTarget) {
      (data as any).isTargetAchieved = TargetAchievementStatus.PENDING;
      return;
    }

    const expectedToday = calcExpectedValue({
      startValue: activeTarget.startValue,
      target: activeTarget.target,
      startTime: activeTarget.startTime,
      deadline: activeTarget.deadline,
      progressType: activeTarget.progressType,
      atDate: new Date(),
    });

    const isIncreasing = activeTarget.target >= activeTarget.startValue;
    const achieved = isIncreasing ? weight >= expectedToday : weight <= expectedToday;

    (data as any).isTargetAchieved = achieved ? TargetAchievementStatus.ACHIEVED : TargetAchievementStatus.NOT_ACHIEVED;
  }
  private async getPendingTarget(userId: string, manager?: EntityManager): Promise<UserTarget | null> {
    return this.userTargetRepository
      .getRepository(manager)
      .createQueryBuilder("ut")
      .where("ut.userId = :userId", { userId })
      .andWhere("ut.status = :status", { status: UserTargetStatus.PENDING })
      .andWhere("ut.deletedAt IS NULL")
      .orderBy("ut.createdAt", "DESC")
      .getOne();
  }

  async getChartData(userId: string, type: HealthIndicatorChartField, limit: number = 6) {
    const rows = await this.repository.getChartData(userId, type, limit);

    return rows.map((row) => ({
      date: row.date,
      value: type === "visceralFat" ? row.value : Number(row.value),
    }));
  }
  async getSummary(userId: string) {
    const rows = await this.repository
      .getRepository()
      .createQueryBuilder("hi")
      .where("hi.userId = :userId", { userId })
      .andWhere("hi.deletedAt IS NULL")
      .orderBy("hi.createdAt", "DESC")
      .getMany();
    return buildHealthIndicatorSummary(rows);
  }

  protected async validateBeforeUpdate(
    id: string,
    data: DeepPartial<HealthIndicator>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const exist = await this.repository.findById(id);
    if (!exist) throw new BadRequestError("Dữ liệu không tòn tại");
    const latest = await this.repository.findOne({ where: { userId: exist.userId }, order: { createdAt: "DESC" } });
    if (id !== latest?.id) throw new BadRequestError("Chỉ có thể chỉnh sửa kết quả đo mới nhất");
  }
}
