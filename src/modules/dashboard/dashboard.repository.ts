import DatabaseConfig from "@/config/database";
import {injectable} from "inversify";
import {DataSource, ObjectLiteral, SelectQueryBuilder} from "typeorm";

import {Club} from "@/database/models/Club";
import {ClubMember, MemberStatus} from "@/database/models/ClubMember";
import {ClubActivity} from "@/database/models/ClubActivity";
import {CheckIn} from "@/database/models/CheckIn";
import {UserPacket, UserPacketStatus} from "@/database/models/UserPacket";
import {User, UserType} from "@/database/models/User";
import {Packet} from "@/database/models/Packet";
import {HealthIndicator} from "@/database/models/HealthIndicator";
import {UserTarget} from "@/database/models/UserTarget";

export interface DashboardFilter {
    clubId?: string;
    clubIds?: string[];
    status?: "active" | "inactive";
}

export type ExpiringSoonMemberItem = {
    userId: string;
    userCode: string | null;
    userName: string;
    clubId: string;
    clubName: string;
    packetId: string;
    packetName: string;
    endTime: Date;
    remainingDays: number;
    isOverdue: boolean;
};

type RecentClubItem = {
    id: string;
    code: string | null;
    name: string;
    openingDay: Date;
    status: "active" | "upcoming";
};

type BirthdayMemberItem = {
    id: string;
    name: string;
    dob: Date;
};
type ClubFilterOnly = Pick<DashboardFilter, "clubId" | "clubIds" | "status">;

// ============================== TRANG CHỦ HỘI VIÊN ==============================
export type CurrentPacketItem = {
    address: string;
    userPacketId: string;
    startTime: Date;
    endTime: Date;
    status: UserPacketStatus;
    clubId: string;
    clubName: string;
    packetId: string;
    packetName: string;
    packetCode: string | null;
    dayLimit: number;
    amount: number;
    bookingAmount: number;
    remainingQuantity: number;
    quota: number;
};

export type PrimaryClubItem = {
    clubId: string;
    clubName: string;
    hotline: string | null;
    address: string | null;
};

export type RecentCheckinItem = {
    id: string;
    clubId: string;
    clubName: string;
    quantity: number;
    createdAt: Date;
};

export type WeightPointItem = {
    id: string;
    weight: number;
    createdAt: Date;
};

@injectable()
export class DashboardRepository {
    private get dataSource(): DataSource {
        return DatabaseConfig;
    }

    private applyClubStatus<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        filter: ClubFilterOnly,
        clubIdCol: string,
        clubAlias = "c",
    ): void {
        if (filter.clubIds) {
            if (filter.clubIds.length === 0) {
                qb.andWhere("1 = 0");
            } else {
                qb.andWhere(`${clubIdCol} IN (:...clubIds)`, {clubIds: filter.clubIds});
            }
        } else if (filter.clubId) {
            qb.andWhere(`${clubIdCol} = :clubId`, {clubId: filter.clubId});
        }
        if (filter.status) {
            qb.andWhere(`${clubAlias}.isActive = :isActive`, {
                isActive: filter.status === "active",
            });
        }
    }

    private hasClubFilter(filter: DashboardFilter): boolean {
        return Boolean(filter.clubId) || filter.clubIds !== undefined || Boolean(filter.status);
    }

    private toCountMap(rows: { clubId: string; count: string }[]): Map<string, number> {
        return new Map(rows.map((r) => [r.clubId, Number(r.count)]));
    }

    /** Danh sách Club theo filter */
    async getClubs(filter: ClubFilterOnly): Promise<{ id: string; code: string | null; name: string }[]> {
        const qb = this.dataSource
            .getRepository(Club)
            .createQueryBuilder("c")
            .select(["c.id", "c.code", "c.name"])
            .orderBy("c.code", "ASC");

        this.applyClubStatus(qb, filter, "c.id");

        return qb.getMany();
    }

    /**
     * Báo cáo hội viên theo từng Club
     *
     * Nguồn dữ liệu chính: user_packets
     *
     * Mỗi user + club chỉ lấy packet mới nhất theo startTime.
     *
     * Trạng thái:
     * - active + còn > 3 ngày  => active
     * - active + còn <= 3 ngày => expiring
     * - status != active        => expired
     * - active nhưng endTime <= NOW() => expired
     */
    async getMemberReportByClub(
        filter: DashboardFilter,
    ): Promise<
        {
            clubId: string;
            totalMembers: number;
            activeMembers: number;
            expiringMembers: number;
            expiredMembers: number;
        }[]
    > {
        const now = new Date();
        const soonThreshold = new Date(now);
        soonThreshold.setDate(soonThreshold.getDate() + 3);
        const raw = await this.dataSource
            .createQueryBuilder()
            .select('latest."clubId"', 'clubId')
            .addSelect('COUNT(*)', 'totalMembers')
            .addSelect(
                `COUNT(*) FILTER (
                WHERE latest."packetStatus" = 'active'
                  AND latest."endTime" > :soonThreshold
            )`,
                'activeMembers',
            )
            .addSelect(
                `COUNT(*) FILTER (
                WHERE latest."packetStatus" = 'active'
                  AND latest."endTime" > :now
                  AND latest."endTime" <= :soonThreshold
            )`,
                'expiringMembers',
            )
            .addSelect(
                `COUNT(*) FILTER (
                WHERE latest."packetStatus" != 'active'
                   OR latest."endTime" <= :now
            )`,
                'expiredMembers',
            )
            .from((subQb) => {
                const sq = subQb
                    .select('up."userId"', 'userId')
                    .addSelect('up."clubId"', 'clubId')
                    .addSelect('up."status"', 'packetStatus')
                    .addSelect('up."endTime"', 'endTime')
                    .distinctOn(['up."userId"', 'up."clubId"'])
                    .from(UserPacket, 'up')
                    .innerJoin(Club, 'c', 'c.id = up."clubId"')
                    .orderBy('up."userId"', 'ASC')
                    .addOrderBy('up."clubId"', 'ASC')
                    .addOrderBy('up."startTime"', 'DESC');

                if (filter.clubIds) {
                    if (filter.clubIds.length === 0) {
                        sq.andWhere('1 = 0');
                    } else {
                        sq.andWhere('up."clubId" IN (:...clubIds)', {
                            clubIds: filter.clubIds,
                        });
                    }
                } else if (filter.clubId) {
                    sq.andWhere('up."clubId" = :clubId', {
                        clubId: filter.clubId,
                    });
                }
                if (filter.status) {
                    sq.andWhere('c."isActive" = :isActive', {
                        isActive: filter.status === 'active',
                    });
                }
                return sq;
            }, 'latest')
            .setParameters({
                now,
                soonThreshold,
            })
            .groupBy('latest."clubId"')
            .getRawMany<{
                clubId: string;
                totalMembers: string;
                activeMembers: string;
                expiringMembers: string;
                expiredMembers: string;
            }>();
        return raw.map((row) => ({
            clubId: row.clubId,
            totalMembers: Number(row.totalMembers),
            activeMembers: Number(row.activeMembers),
            expiringMembers: Number(row.expiringMembers),
            expiredMembers: Number(row.expiredMembers),
        }));
    }

    /** Tổng số User tính đến một thời điểm (lọc theo Club nếu có) */
    async countMembersAt(
        referenceDate: Date,
        filter: DashboardFilter,
        roleIdIsNull = false,
    ): Promise<number> {
        const qb = this.dataSource
            .getRepository(User)
            .createQueryBuilder("u")
            .select("COUNT(DISTINCT u.id)", "count")
            .where("u.createdAt <= :referenceDate", {referenceDate})
            .andWhere("LOWER(u.username) <> :adminUsername", {adminUsername: "admin"})
            .andWhere(roleIdIsNull ? "u.roleId IS NULL" : "u.roleId IS NOT NULL");

        if (roleIdIsNull) {
            qb.andWhere("u.type = :type", { type: UserType.CUSTOMER });
        }

        if (this.hasClubFilter(filter)) {
            qb.innerJoin(
                ClubMember,
                "cm",
                "cm.userId = u.id AND cm.status = :cmStatus",
                { cmStatus: "active" },
            );
            if (filter.status) qb.innerJoin(Club, "c", "c.id = cm.clubId");
            this.applyClubStatus(qb, filter, "cm.clubId");
        }

        const raw = await qb.getRawOne<{ count: string }>();
        return Number(raw?.count ?? 0);
    }

    /** Số User đang active (User.isActive = true), lọc theo Club nếu có */
    async countActiveMembers(
        filter: DashboardFilter = {},
        roleIdIsNull = false,
        referenceDate?: Date,
    ): Promise<number> {
        const qb = this.dataSource
            .getRepository(User)
            .createQueryBuilder("u")
            .select("COUNT(DISTINCT u.id)", "count")
            .where("u.type = :type", { type: UserType.CUSTOMER })
            .andWhere("u.isActive = :isActive", { isActive: true });

        if (roleIdIsNull) {
            qb.andWhere("u.roleId IS NULL");
            if (referenceDate) {
                qb.andWhere("u.createdAt <= :referenceDate", { referenceDate });
            }
        }

        if (this.hasClubFilter(filter)) {
            qb.innerJoin(
                ClubMember,
                "cm",
                "cm.userId = u.id AND cm.status = :cmStatus",
                { cmStatus: "active" },
            );
            if (filter.status) qb.innerJoin(Club, "c", "c.id = cm.clubId");
            this.applyClubStatus(qb, filter, "cm.clubId");
        }

        const raw = await qb.getRawOne<{ count: string }>();
        return Number(raw?.count ?? 0);
    }

    /** Tổng lượt CheckIn trong khoảng thời gian */
    async countCheckins(startAt: Date, endAt: Date, filter: DashboardFilter): Promise<number> {
        const qb = this.dataSource
            .getRepository(CheckIn)
            .createQueryBuilder("ci")
            .innerJoin("ci.club", "c")
            .where("ci.createdAt BETWEEN :startAt AND :endAt", {startAt, endAt});

        this.applyClubStatus(qb, filter, "ci.clubId");

        const raw = await qb
            .select("COALESCE(SUM(ci.quantity), 0)", "count")
            .getRawOne<{ count: string }>();
        return Number(raw?.count ?? 0);
    }

    /** CheckIn group theo ngày */
    async getCheckinsByDate(
        startAt: Date,
        endAt: Date,
        filter: DashboardFilter,
    ): Promise<{ date: string; count: number }[]> {
        const qb = this.dataSource
            .getRepository(CheckIn)
            .createQueryBuilder("ci")
            .innerJoin("ci.club", "c")
            .select("DATE(ci.createdAt)", "date")
            .addSelect("COALESCE(SUM(ci.quantity), 0)", "count")
            .where("ci.createdAt BETWEEN :startAt AND :endAt", {startAt, endAt})
            .groupBy("DATE(ci.createdAt)")
            .orderBy("DATE(ci.createdAt)", "ASC");

        this.applyClubStatus(qb, filter, "ci.clubId");

        const rows = await qb.getRawMany<{ date: string; count: string }>();
        return rows.map((r) => ({date: r.date, count: Number(r.count)}));
    }

    /** Tổng hội viên theo Club */
    async getMembersCountByClub(referenceDate: Date, filter: ClubFilterOnly): Promise<Map<string, number>> {
        const qb = this.dataSource
            .getRepository(ClubMember)
            .createQueryBuilder("cm")
            .innerJoin("cm.user", "u")
            .innerJoin("cm.club", "c")
            .select("cm.clubId", "clubId")
            .addSelect("COUNT(DISTINCT cm.userId)", "count")
            .where("u.createdAt <= :referenceDate", {referenceDate})
            .groupBy("cm.clubId");

        this.applyClubStatus(qb, filter, "cm.clubId");

        return this.toCountMap(await qb.getRawMany());
    }

    /** Tổng CheckIn theo Club */
    async getCheckinsCountByClub(startAt: Date, endAt: Date, filter: ClubFilterOnly): Promise<Map<string, number>> {
        const qb = this.dataSource
            .getRepository(CheckIn)
            .createQueryBuilder("ci")
            .innerJoin("ci.club", "c")
            .select("ci.clubId", "clubId")
            .addSelect("COALESCE(SUM(ci.quantity), 0)", "count")
            .where("ci.createdAt BETWEEN :startAt AND :endAt", {startAt, endAt})
            .groupBy("ci.clubId");

        this.applyClubStatus(qb, filter, "ci.clubId");

        return this.toCountMap(await qb.getRawMany());
    }

    /** Active Member theo Club */
    async getActiveMembersCountByClub(referenceDate: Date, filter: ClubFilterOnly): Promise<Map<string, number>> {
        const qb = this.dataSource
            .getRepository(ClubMember)
            .createQueryBuilder("cm")
            .innerJoin("cm.user", "u")
            .innerJoin("cm.club", "c")
            .select("cm.clubId", "clubId")
            .addSelect("COUNT(DISTINCT cm.userId)", "count")
            .where("u.createdAt <= :referenceDate", {referenceDate})
            .andWhere("u.isActive = :isActive", {isActive: true})
            .groupBy("cm.clubId");

        this.applyClubStatus(qb, filter, "cm.clubId");

        return this.toCountMap(await qb.getRawMany());
    }

    async getMemberStatusDistribution(
        filter: DashboardFilter,
    ): Promise<{
        total: number;
        breakdown: { status: "active" | "expiring" | "expired"; count: number }[];
        byPacket: { packetId: string; packetCode: string | null; packetName: string; count: number }[];
    }> {
        const now = new Date();
        const soonThreshold = new Date(now);
        soonThreshold.setDate(soonThreshold.getDate() + 3);
        const raw = await this.dataSource
            .createQueryBuilder()
            .select(
                `CASE
                WHEN latest."packetStatus" != 'active' THEN 'expired'
                WHEN latest."endTime" <= :now THEN 'expired'
                WHEN latest."endTime" <= :soonThreshold THEN 'expiring'
                ELSE 'active'
            END`,
                "status",
            )
            .addSelect("COUNT(*)", "count")
            .from((subQb) => this.buildLatestSubQuery(subQb, filter), "latest")
            .setParameters({now, soonThreshold})
            .groupBy("status")
            .getRawMany<{ status: string; count: string }>();
        const counts: Record<string, number> = {active: 0, expiring: 0, expired: 0};
        for (const r of raw) counts[r.status] = Number(r.count);
        const breakdown = (["active", "expiring", "expired"] as const).map((status) => ({
            status,
            count: counts[status],
        }));
        const byPacket = await this.getMemberCountByPacket(filter);
        return {
            total: counts.active + counts.expiring + counts.expired,
            breakdown,
            byPacket,
        };
    }

    /** Số User đang giữ mỗi Packet (đang active, chưa hết hạn) — không giới hạn 1 packet/user */
    private async getMemberCountByPacket(
        filter: DashboardFilter,
    ): Promise<{ packetId: string; packetCode: string | null; packetName: string; count: number }[]> {
        const now = new Date();
        const qb = this.dataSource
            .getRepository(UserPacket)
            .createQueryBuilder("up")
            .innerJoin("up.club", "c")
            .innerJoin("up.packet", "p")
            .select("up.packetId", "packetId")
            .addSelect("p.code", "packetCode")
            .addSelect("p.name", "packetName")
            .addSelect("COUNT(DISTINCT up.userId)", "count")
            .where("up.status = :status", {status: "active"})
            .andWhere("up.endTime > :now", {now})
            .groupBy("up.packetId")
            .addGroupBy("p.code")
            .addGroupBy("p.name");

        if (filter.clubIds) {
            if (filter.clubIds.length === 0) {
                qb.andWhere("1 = 0");
            } else {
                qb.andWhere("up.clubId IN (:...clubIds)", {clubIds: filter.clubIds});
            }
        } else if (filter.clubId) {
            qb.andWhere("up.clubId = :clubId", {clubId: filter.clubId});
        }
        if (filter.status) {
            qb.andWhere("c.isActive = :isActive", {isActive: filter.status === "active"});
        }

        const raw = await qb.getRawMany<{
            packetId: string;
            packetCode: string | null;
            packetName: string;
            count: string
        }>();
        return raw.map((r) => ({
            packetId: r.packetId,
            packetCode: r.packetCode,
            packetName: r.packetName,
            count: Number(r.count),
        }));
    }

    private toMonthDay(d: Date): string {
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${mm}-${dd}`;
    }

    /** Số Club khai trương trong khoảng [startAt, endAt] */
    async countClubsOpeningInRange(startAt: Date, endAt: Date, filter: DashboardFilter = {}): Promise<number> {
        const qb = this.dataSource
            .getRepository(Club)
            .createQueryBuilder("c")
            .select("COUNT(*)", "count")
            .where("c.openingDay BETWEEN :startAt AND :endAt", {startAt, endAt});

        this.applyClubStatus(qb, filter, "c.id");

        const raw = await qb.getRawOne<{ count: string }>();
        return Number(raw?.count ?? 0);
    }

    /** Số hội viên có sinh nhật (ngày/tháng, bỏ qua năm) rơi vào khoảng [startAt, endAt] */
    async countBirthdayMembersInRange(
        startAt: Date,
        endAt: Date,
        filter: DashboardFilter = {},
        roleIdIsNull = false,
    ): Promise<number> {
        const startMD = this.toMonthDay(startAt);
        const endMD = this.toMonthDay(endAt);
        const qb = this.dataSource
            .getRepository(User)
            .createQueryBuilder("u")
            .select("COUNT(DISTINCT u.id)", "count")
            .where("u.type = :type", {type: UserType.CUSTOMER})
            .andWhere("u.dob IS NOT NULL")
            .andWhere("TO_CHAR(u.dob, 'MM-DD') BETWEEN :startMD AND :endMD", {startMD, endMD});

        if (roleIdIsNull) {
            qb.andWhere("u.roleId IS NULL");
        }

        if (this.hasClubFilter(filter)) {
            qb.innerJoin(ClubMember, "cm", "cm.userId = u.id");
            if (filter.status) qb.innerJoin(Club, "c", "c.id = cm.clubId");
            this.applyClubStatus(qb, filter, "cm.clubId");
        }

        const raw = await qb.getRawOne<{ count: string }>();
        return Number(raw?.count ?? 0);
    }

    /** Số hội viên mới trong khoảng [startAt, endAt] */
    async countNewMembersInRange(
        startAt: Date,
        endAt: Date,
        filter: DashboardFilter = {},
    ): Promise<number> {
        const qb = this.dataSource
            .getRepository(User)
            .createQueryBuilder("u")
            .select("COUNT(DISTINCT u.id)", "count")
            .where("u.type = :type", {type: UserType.CUSTOMER})
            .andWhere("u.createdAt BETWEEN :startAt AND :endAt", {startAt, endAt})
            .andWhere("u.roleId IS NOT NULL");

        if (this.hasClubFilter(filter)) {
            qb.innerJoin(ClubMember, "cm", "cm.userId = u.id");
            if (filter.status) qb.innerJoin(Club, "c", "c.id = cm.clubId");
            this.applyClubStatus(qb, filter, "cm.clubId");
        }

        const raw = await qb.getRawOne<{ count: string }>();
        return Number(raw?.count ?? 0);
    }

    /** Số hội viên mới trong 1 tháng cụ thể (không phụ thuộc filter ngày) */
    async getNewMembersTrendLast6Months(
        filter: DashboardFilter = {},
    ): Promise<{ month: number; year: number; count: number }[]> {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const qb = this.dataSource
            .getRepository(User)
            .createQueryBuilder("u")
            .select("EXTRACT(MONTH FROM u.createdAt)", "month")
            .addSelect("EXTRACT(YEAR FROM u.createdAt)", "year")
            .addSelect("COUNT(DISTINCT u.id)", "count")
            .where("u.type = :type", { type: UserType.CUSTOMER })
            .andWhere("u.createdAt >= :startDate", { startDate })
            .andWhere("u.createdAt < :endDate", { endDate })
            .groupBy("EXTRACT(YEAR FROM u.createdAt)")
            .addGroupBy("EXTRACT(MONTH FROM u.createdAt)");

        if (this.hasClubFilter(filter)) {
            qb.innerJoin(ClubMember, "cm", "cm.userId = u.id");
            if (filter.status) qb.innerJoin(Club, "c", "c.id = cm.clubId");
            this.applyClubStatus(qb, filter, "cm.clubId");
        }

        const raws = await qb.getRawMany<{ month: string; year: string; count: string }>();

        const resultMap = new Map<string, number>();
        raws.forEach((r) => resultMap.set(`${r.year}-${r.month}`, Number(r.count)));

        const result: { month: number; year: number; count: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = d.getMonth() + 1;
            const year = d.getFullYear();
            result.push({ month, year, count: resultMap.get(`${year}-${month}`) ?? 0 });
        }

        return result;
    }

    // lấy câu lạc bộ sắp khai trương and đang khai trương
    async getRecentClubs(
        limit = 5,
        filter: Pick<DashboardFilter, "clubId" | "clubIds"> = {},
    ): Promise<RecentClubItem[]> {
        const now = new Date();
        const qb = this.dataSource
            .getRepository(Club)
            .createQueryBuilder("c")
            .where("c.isActive = :isActive", {isActive: true})
            .orderBy("c.createdAt", "DESC")
            .limit(limit);

        if (filter.clubIds) {
            if (filter.clubIds.length === 0) {
                qb.andWhere("1 = 0");
            } else {
                qb.andWhere("c.id IN (:...clubIds)", {clubIds: filter.clubIds});
            }
        } else if (filter.clubId) {
            qb.andWhere("c.id = :clubId", {clubId: filter.clubId});
        }
        const rows: Club[] = await qb.getMany();

        return rows.map((c: Club) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            openingDay: c.openingDay,
            status: c.openingDay > now ? "upcoming" : "active",
        }));
    }

    // hiện danh sách hội viên sinh nhật
    async getBirthdayMembers(
        startAt: Date,
        endAt: Date,
        limit = 5,
        filter: DashboardFilter = {},
    ): Promise<BirthdayMemberItem[]> {
        const startMD = this.toMonthDay(startAt);
        const endMD = this.toMonthDay(endAt);
        const qb = this.dataSource
            .getRepository(User)
            .createQueryBuilder("u")
            .where("u.type = :type", {type: UserType.CUSTOMER})
            .andWhere("u.dob IS NOT NULL")
            .andWhere("TO_CHAR(u.dob, 'MM-DD') BETWEEN :startMD AND :endMD", {startMD, endMD})
            .addSelect("TO_CHAR(u.dob, 'MM-DD')", "birthdaySort")
            .orderBy("TO_CHAR(u.dob, 'MM-DD')", "ASC")
            .limit(limit)
            .distinct(true);

        if (this.hasClubFilter(filter)) {
            qb.innerJoin(ClubMember, "cm", "cm.userId = u.id");
            if (filter.status) qb.innerJoin(Club, "c", "c.id = cm.clubId");
            this.applyClubStatus(qb, filter, "cm.clubId");
        }

        const rows: User[] = await qb.getMany();

        return rows.map((u: User) => ({id: u.id, name: u.name, dob: u.dob as Date}));
    }

    async getExpiringSoonMembers(
        filter: DashboardFilter,
        limit = 5,
        daysAhead = 15,
        daysOverdue = 30,
    ): Promise<ExpiringSoonMemberItem[]> {
        const now = new Date();
        const upperBound = new Date(now);
        upperBound.setDate(upperBound.getDate() + daysAhead);
        const lowerBound = new Date(now);
        lowerBound.setDate(lowerBound.getDate() - daysOverdue);
        const raw = await this.dataSource
            .createQueryBuilder()
            .select('latest."userId"', "userId")
            .addSelect("u.code", "userCode")
            .addSelect("u.name", "userName")
            .addSelect('latest."clubId"', "clubId")
            .addSelect("c.name", "clubName")
            .addSelect('latest."packetId"', "packetId")
            .addSelect("p.name", "packetName")
            .addSelect('latest."endTime"', "endTime")
            .from((subQb) => this.buildLatestSubQuery(subQb, filter), "latest")
            .innerJoin(User, "u", 'u.id = latest."userId"')
            .innerJoin(Packet, "p", 'p.id = latest."packetId"')
            .innerJoin(Club, "c", 'c.id = latest."clubId"')
            .where('latest."packetStatus" = :status', {status: "active"})
            .andWhere('latest."endTime" BETWEEN :lowerBound AND :upperBound', {lowerBound, upperBound})
            .orderBy('latest."endTime"', "ASC")
            .limit(limit)
            .getRawMany<{
                userId: string;
                userCode: string | null;
                userName: string;
                clubId: string;
                clubName: string;
                packetId: string;
                packetName: string;
                endTime: Date;
            }>();
        return raw.map((r) => {
            const remainingDays = Math.ceil(
                (new Date(r.endTime).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );
            return {
                userId: r.userId,
                userCode: r.userCode,
                userName: r.userName,
                clubId: r.clubId,
                clubName: r.clubName,
                packetId: r.packetId,
                packetName: r.packetName,
                endTime: r.endTime,
                remainingDays,
                isOverdue: remainingDays < 0,
            };
        });
    }

    private buildLatestSubQuery(
        subQb: ReturnType<DataSource["createQueryBuilder"]>,
        filter: DashboardFilter,
    ) {
        const sq = subQb
            .select("up.userId", "userId")
            .addSelect("up.status", "packetStatus")
            .addSelect("up.endTime", "endTime")
            .addSelect("up.packetId", "packetId")
            .addSelect("up.clubId", "clubId")
            .distinctOn(["up.userId"])
            .from(UserPacket, "up")
            .innerJoin(Club, "c", "c.id = up.clubId")
            .orderBy("up.userId", "ASC")
            .addOrderBy("up.startTime", "DESC");

        if (filter.clubIds) {
            if (filter.clubIds.length === 0) {
                sq.andWhere("1 = 0");
            } else {
                sq.andWhere("up.clubId IN (:...clubIds)", {clubIds: filter.clubIds});
            }
        } else if (filter.clubId) {
            sq.andWhere("up.clubId = :clubId", {clubId: filter.clubId});
        }
        if (filter.status) {
            sq.andWhere("c.isActive = :isActive", {isActive: filter.status === "active"});
        }
        return sq;
    }

    // ============================== TRANG CHỦ HỘI VIÊN ==============================

    /** Gói tập hiện tại (đang active, gần hết hạn nhất) của user */
    async getCurrentPacket(userId: string): Promise<CurrentPacketItem | null> {
        const now = new Date();
        const row = await this.dataSource
            .getRepository(UserPacket)
            .createQueryBuilder("up")
            .innerJoin("up.club", "c")
            .innerJoin("up.packet", "p")
            .select("up.id", "userPacketId")
            .addSelect("up.startTime", "startTime")
            .addSelect("up.endTime", "endTime")
            .addSelect("up.status", "status")
            .addSelect("up.clubId", "clubId")
            .addSelect("c.name", "clubName")
            .addSelect("c.address", "address")
            .addSelect("up.packetId", "packetId")
            .addSelect("p.name", "packetName")
            .addSelect("p.code", "packetCode")
            .addSelect("p.dayLimit", "dayLimit")
            .addSelect("up.amount", "amount")
            .addSelect("up.bookingAmount", "bookingAmount")
            .addSelect("up.remainingQuantity", "remainingQuantity")
            .addSelect("up.quota", "quota")
            .where("up.userId = :userId", {userId})
            .andWhere("up.status = :status", {status: UserPacketStatus.ACTIVE})
            .andWhere("up.endTime > :now", {now})
            .orderBy("up.endTime", "ASC")
            .limit(1)
            .getRawOne<{
                userPacketId: string;
                startTime: Date;
                endTime: Date;
                status: UserPacketStatus;
                clubId: string;
                clubName: string;
                address: string;
                packetId: string;
                packetName: string;
                packetCode: string | null;
                dayLimit: number;
                amount: number;
                bookingAmount: number;
                remainingQuantity: number;
                quota: number;
            }>();

        return row ?? null;
    }

    /** Club chính của hội viên: bản ghi ClubMember active đầu tiên */
    async getPrimaryClub(userId: string): Promise<PrimaryClubItem | null> {
        const row = await this.dataSource
            .getRepository(ClubMember)
            .createQueryBuilder("cm")
            .innerJoin("cm.club", "c")
            .select("cm.clubId", "clubId")
            .addSelect("c.name", "clubName")
            .addSelect("c.hotline", "hotline")
            .addSelect("c.address", "address")
            .where("cm.userId = :userId", {userId})
            .andWhere("cm.status = :status", {status: MemberStatus.ACTIVE})
            .orderBy("cm.createdAt", "ASC")
            .limit(1)
            .getRawOne<{ clubId: string; clubName: string; hotline: string | null; address: string | null }>();

        return row ?? null;
    }

    /** Toàn bộ lịch hoạt động (giờ mở cửa) của 1 club */
    async getClubActivities(clubId: string): Promise<ClubActivity[]> {
        return this.dataSource
            .getRepository(ClubActivity)
            .createQueryBuilder("ca")
            .where("ca.clubId = :clubId", {clubId})
            .getMany();
    }

    /** Tổng lượt checkin + tổng quantity trong khoảng thời gian của 1 user */
    async getCheckinStatsInRange(
        userId: string,
        startAt: Date,
        endAt: Date,
    ): Promise<{ totalSessions: number; totalQuantity: number }> {
        const raw = await this.dataSource
            .getRepository(CheckIn)
            .createQueryBuilder("ci")
            .select("COUNT(*)", "totalSessions")
            .addSelect("COALESCE(SUM(ci.quantity), 0)", "totalQuantity")
            .where("ci.userId = :userId", {userId})
            .andWhere("ci.createdAt BETWEEN :startAt AND :endAt", {startAt, endAt})
            .getRawOne<{ totalSessions: string; totalQuantity: string }>();

        return {
            totalSessions: Number(raw?.totalSessions ?? 0),
            totalQuantity: Number(raw?.totalQuantity ?? 0),
        };
    }

    /** Tổng lượt checkin + tổng quantity toàn thời gian (không giới hạn khoảng ngày) của 1 user */
    async getCheckinStatsAllTime(userId: string): Promise<{ totalSessions: number; totalQuantity: number }> {
        const raw = await this.dataSource
            .getRepository(CheckIn)
            .createQueryBuilder("ci")
            .select("COUNT(*)", "totalSessions")
            .addSelect("COALESCE(SUM(ci.quantity), 0)", "totalQuantity")
            .where("ci.userId = :userId", {userId})
            .getRawOne<{ totalSessions: string; totalQuantity: string }>();

        return {
            totalSessions: Number(raw?.totalSessions ?? 0),
            totalQuantity: Number(raw?.totalQuantity ?? 0),
        };
    }

    /** Cân nặng gần nhất của user (từ health_indicators) */
    async getLatestWeight(userId: string): Promise<number | null> {
        const row = await this.dataSource
            .getRepository(HealthIndicator)
            .createQueryBuilder("hi")
            .select("hi.weight", "weight")
            .where("hi.userId = :userId", {userId})
            .orderBy("hi.createdAt", "DESC")
            .limit(1)
            .getRawOne<{ weight: string }>();

        return row ? Number(row.weight) : null;
    }
    /** Cân nặng mục tiêu của user */
    async getTargetWeight(userId: string): Promise<number | null> {
        const row = await this.dataSource
            .getRepository(UserTarget)
            .createQueryBuilder("ut")
            .select("ut.target", "target")
            .where('ut."userId" = :userId', { userId })
            .orderBy('ut."createdAt"', "DESC")
            .limit(1)
            .getRawOne<{ target: string }>();

        return row ? Number(row.target) : null;
    }

    /** 5 lượt checkin gần nhất, chỉ tính khi gói packet lúc đó đang active */
    async getRecentActiveCheckins(userId: string, limit = 5): Promise<RecentCheckinItem[]> {
        const rows = await this.dataSource
            .getRepository(CheckIn)
            .createQueryBuilder("ci")
            .innerJoin("ci.club", "c")
            .innerJoin("ci.userPacket", "up")
            .select("ci.id", "id")
            .addSelect("ci.clubId", "clubId")
            .addSelect("c.name", "clubName")
            .addSelect("ci.quantity", "quantity")
            .addSelect("ci.createdAt", "createdAt")
            .where("ci.userId = :userId", {userId})
            .andWhere("up.status = :status", {status: UserPacketStatus.ACTIVE})
            .orderBy("ci.createdAt", "DESC")
            .limit(limit)
            .getRawMany<{
                id: string;
                clubId: string;
                clubName: string;
                quantity: number;
                createdAt: Date;
            }>();

        return rows.map((r) => ({...r, quantity: Number(r.quantity)}));
    }

    /** N chỉ số cân nặng gần nhất của user, trả về theo thứ tự thời gian tăng dần (để vẽ biểu đồ) */
    async getWeightTrend(userId: string, limit = 6): Promise<WeightPointItem[]> {
        const rows = await this.dataSource
            .getRepository(HealthIndicator)
            .createQueryBuilder("hi")
            .select("hi.id", "id")
            .addSelect("hi.weight", "weight")
            .addSelect("hi.createdAt", "createdAt")
            .where("hi.userId = :userId", {userId})
            .orderBy("hi.createdAt", "DESC")
            .limit(limit)
            .getRawMany<{ id: string; weight: string; createdAt: Date }>();

        return rows
            .map((r) => ({id: r.id, weight: Number(r.weight), createdAt: r.createdAt}))
            .reverse();
    }
    /** Club user tham gia gần đây nhất (ClubMember.status = active) */
    async getLatestClubOfMember(userId: string): Promise<{ id: string; name: string; address: string | null } | null> {
        const row = await this.dataSource
            .getRepository(ClubMember)
            .createQueryBuilder("cm")
            .innerJoin("cm.club", "c")
            .select("c.id", "id")
            .addSelect("c.name", "name")
            .addSelect("c.address", "address")
            .where("cm.userId = :userId", {userId})
            .andWhere("cm.status = :status", {status: MemberStatus.ACTIVE})
            .orderBy("cm.createdAt", "DESC")
            .limit(1)
            .getRawOne<{ id: string; name: string; address: string | null }>();

        return row ?? null;
    }
}
