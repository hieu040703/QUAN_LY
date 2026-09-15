import {inject, injectable} from "inversify";
import {DASHBOARD_TYPES} from "./dashboard.types";
import {DashboardRepository, DashboardFilter} from "./dashboard.repository";
import {DashboardOverviewQueryDto} from "./dashboard.validator";
import {calcPercentChange, resolveDateRange, startOfMonth, endOfMonth} from "./dashboard.helper";

const DAY_MS = 1000 * 60 * 60 * 24;
const round1 = (n: number): number => Math.round(n * 10) / 10;
const percent1 = (numerator: number, denominator: number): number =>
    denominator > 0 ? round1((numerator / denominator) * 100) : 0;
const daysBetween = (start: Date, end: Date): number =>
    Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS));

type SummaryMetric = { value: number; changePercent: number };
type SummaryStats = {
    totalMembers: SummaryMetric;
    totalCheckins: SummaryMetric;
    avgCheckinsPerDay: SummaryMetric;
    activeMemberRate: SummaryMetric;
};

@injectable()
export class DashboardService {
    constructor(
        @inject(DASHBOARD_TYPES.DashboardRepository)
        private dashboardRepository: DashboardRepository,
    ) {
    }

    async getOverview(query: DashboardOverviewQueryDto) {
        const {startDate, endDate, clubId, clubIds, status} = query;
        const filter: DashboardFilter = {clubId, clubIds, status};
        const {startAt, endAt, prevStartAt, prevEndAt} = resolveDateRange(startDate, endDate);
        const [
            totalMembers,
            prevTotalMembers,
            totalCheckins,
            prevTotalCheckins,
            activeMembersCount,
            checkinsByDate,
            memberStatus,
            clubs,
            checkinsByClubMap,
            memberReportByClub,
        ] = await Promise.all([
            this.dashboardRepository.countMembersAt(endAt, filter, true),
            this.dashboardRepository.countMembersAt(prevEndAt, filter, true),
            this.dashboardRepository.countCheckins(startAt, endAt, filter),
            this.dashboardRepository.countCheckins(prevStartAt, prevEndAt, filter),
            this.dashboardRepository.countActiveMembers(filter, true, endAt),
            this.dashboardRepository.getCheckinsByDate(startAt, endAt, filter),
            this.dashboardRepository.getMemberStatusDistribution(filter),
            this.dashboardRepository.getClubs(filter),
            this.dashboardRepository.getCheckinsCountByClub(startAt, endAt, filter),
            this.dashboardRepository.getMemberReportByClub(filter),
        ]);

        const byClub = this.buildByClub(clubs, checkinsByClubMap, memberReportByClub);
        const summary = this.buildSummaryStats({
            totalMembers, prevTotalMembers,
            totalCheckins, prevTotalCheckins,
            activeMembersCount,
            startAt, endAt, prevStartAt, prevEndAt,
        });

        return {
            summary,
            checkinsByDate,
            memberStatus,
            byClub,
            filter: {startDate, endDate, clubId, clubIds, status},
            range: {startAt, endAt},
        };
    }

    async getGeneralStats(query: DashboardOverviewQueryDto) {
        const {clubId, clubIds, status} = query;
        const filter: DashboardFilter = {clubId, clubIds, status};
        const {now, startDate, endDate, startAt, endAt, prevStartAt, prevEndAt} =
            this.resolveQueryRange(query);

        const [
            clubsOpeningInRange,
            birthdayMembersInRange,
            newMembersInRange,
            recentClubs,
            birthdayMembers,
            totalMembers,
            prevTotalMembers,
            totalCheckins,
            prevTotalCheckins,
            activeMembersCount,
            clubs,
            checkinsByClubMap,
            memberReportByClub,
            checkinsByDate,
            memberStatus,
            expiringSoonMembers,
            newMembersTrendLast6Months
        ] = await Promise.all([
            this.dashboardRepository.countClubsOpeningInRange(startAt, endAt, filter),
            this.dashboardRepository.countBirthdayMembersInRange(startAt, endAt, filter, true),
            this.dashboardRepository.countNewMembersInRange(startAt, endAt, filter),
            this.dashboardRepository.getRecentClubs(6, {clubId: filter.clubId, clubIds: filter.clubIds}),
            this.dashboardRepository.getBirthdayMembers(startAt, endAt, 5, filter),
            this.dashboardRepository.countMembersAt(endAt, filter, true),
            this.dashboardRepository.countMembersAt(prevEndAt, filter, true),
            this.dashboardRepository.countCheckins(startAt, endAt, filter),
            this.dashboardRepository.countCheckins(prevStartAt, prevEndAt, filter),
            this.dashboardRepository.countActiveMembers(filter, true, endAt),
            this.dashboardRepository.getClubs(filter),
            this.dashboardRepository.getCheckinsCountByClub(startAt, endAt, filter),
            this.dashboardRepository.getMemberReportByClub(filter),
            this.dashboardRepository.getCheckinsByDate(startAt, endAt, filter),
            this.dashboardRepository.getMemberStatusDistribution(filter), // Trạng thái gói hội viên
            this.dashboardRepository.getExpiringSoonMembers(filter, 5, 15, 30),
            this.dashboardRepository.getNewMembersTrendLast6Months(filter),
        ]);

        const summary: SummaryStats & {
            clubsOpeningInRange: number;
            birthdayMembersInRange: number;
            newMembersInRange: number;
        } = {
            ...this.buildSummaryStats({
                totalMembers, prevTotalMembers,
                totalCheckins, prevTotalCheckins,
                activeMembersCount,
                startAt, endAt, prevStartAt, prevEndAt,
            }),
            clubsOpeningInRange,
            birthdayMembersInRange,
            newMembersInRange,
        };

        return {
            summary,
            recentClubs,
            birthdayMembers,
            checkinsByDate,
            memberStatus,
            expiringSoonMembers,
            newMembersTrendLast6Months,
            filter: {startDate, endDate, clubId, clubIds, status},
            range: {startAt, endAt},
        };
    }

    async getClubStatistics(query: DashboardOverviewQueryDto) {
        const {clubId, clubIds, status} = query;
        const filter: DashboardFilter = {clubId, clubIds, status};
        const {startDate, endDate, startAt, endAt} = this.resolveQueryRange(query);
        const [clubs, checkinsByClubMap, memberReportByClub] = await Promise.all([
            this.dashboardRepository.getClubs(filter),
            this.dashboardRepository.getCheckinsCountByClub(startAt, endAt, filter),
            this.dashboardRepository.getMemberReportByClub(filter),
        ]);
        const byClub = this.buildByClub(clubs, checkinsByClubMap, memberReportByClub);
        return {
            byClub,
            filter: {startDate, endDate, clubId, clubIds, status},
            range: {startAt, endAt},
        };
    }

    private resolveQueryRange(query: DashboardOverviewQueryDto) {
        const now = new Date();
        const startDate = query.startDate ?? startOfMonth(now);
        const endDate = query.endDate ?? endOfMonth(now);
        const {startAt, endAt, prevStartAt, prevEndAt} = resolveDateRange(startDate, endDate);
        return {now, startDate, endDate, startAt, endAt, prevStartAt, prevEndAt};
    }

    private buildSummaryStats(params: {
        totalMembers: number;
        prevTotalMembers: number;
        totalCheckins: number;
        prevTotalCheckins: number;
        activeMembersCount: number;
        startAt: Date;
        endAt: Date;
        prevStartAt: Date;
        prevEndAt: Date;
    }): SummaryStats {
        const {
            totalMembers, prevTotalMembers,
            totalCheckins, prevTotalCheckins,
            activeMembersCount,
            startAt, endAt, prevStartAt, prevEndAt,
        } = params;

        const rangeDays = daysBetween(startAt, endAt);
        const prevRangeDays = daysBetween(prevStartAt, prevEndAt);
        const avgPerDay = round1(totalCheckins / rangeDays);
        const prevAvgPerDay = round1(prevTotalCheckins / prevRangeDays);

        return {
            totalMembers: {
                value: totalMembers,
                changePercent: calcPercentChange(totalMembers, prevTotalMembers),
            },
            totalCheckins: {
                value: totalCheckins,
                changePercent: calcPercentChange(totalCheckins, prevTotalCheckins),
            },
            avgCheckinsPerDay: {
                value: avgPerDay,
                changePercent: calcPercentChange(avgPerDay, prevAvgPerDay),
            },
            activeMemberRate: {
                value: percent1(activeMembersCount, totalMembers),
                changePercent: 0,
            },
        };
    }

    private buildByClub(
        clubs: { id: string; code: string | null; name: string }[],
        checkinsByClubMap: Map<string, number>,
        memberReportByClub: Awaited<ReturnType<DashboardRepository["getMemberReportByClub"]>>,
    ) {
        const memberReportMap = new Map(
            memberReportByClub.map((item) => [item.clubId, item] as const),
        );
        return clubs.map((club) => {
            const report = memberReportMap.get(club.id);
            const clubTotalMembers = report?.totalMembers ?? 0;
            const clubActiveMembers = report?.activeMembers ?? 0;
            const clubExpiringMembers = report?.expiringMembers ?? 0;
            const clubExpiredMembers = report?.expiredMembers ?? 0;
            const totalCheckins = checkinsByClubMap.get(club.id) ?? 0;

            return {
                clubId: club.id,
                clubCode: club.code,
                clubName: club.name,
                totalMembers: clubTotalMembers,
                activeMembers: clubActiveMembers,
                expiringMembers: clubExpiringMembers,
                expiredMembers: clubExpiredMembers,
                activeMemberRate: percent1(clubActiveMembers, clubTotalMembers),
                totalCheckins,
            };
        });
    }

    private async resolveClubOpenStatus(clubId: string, now: Date) {
        const activities = await this.dashboardRepository.getClubActivities(clubId);
        const currentDay = now.getDay(); // 0 = CN ... 6 = T7 — chỉnh lại nếu DB dùng convention khác
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        const currentTime = `${hh}:${mm}:${ss}`;
        const todayActivities = activities.filter((a) => a.day === currentDay);
        if (todayActivities.length === 0) {
            return {isOpen: false, openTime: null, closeTime: null};
        }
        const openTime = todayActivities.reduce(
            (min, a) => (a.start < min ? a.start : min),
            todayActivities[0].start,
        );
        const closeTime = todayActivities.reduce(
            (max, a) => (a.end > max ? a.end : max),
            todayActivities[0].end,
        );
        const isOpen = todayActivities.some((a) => a.start <= currentTime && currentTime <= a.end);
        return {isOpen, openTime, closeTime};
    }

    async getMemberOverview(userId: string) {
        const now = new Date();
        const startAt = startOfMonth(now);
        const endAt = endOfMonth(now);
        const [
            currentPacket,
            latestClub,
            checkinStatsThisMonth,
            checkinStatsAllTime,
            currentWeight,
            recentCheckins,
            weightTrend,
            targetWeight,
        ] = await Promise.all([
            this.dashboardRepository.getCurrentPacket(userId),
            this.dashboardRepository.getLatestClubOfMember(userId),
            this.dashboardRepository.getCheckinStatsInRange(userId, startAt, endAt),
            this.dashboardRepository.getCheckinStatsAllTime(userId),
            this.dashboardRepository.getLatestWeight(userId),
            this.dashboardRepository.getRecentActiveCheckins(userId, 5),
            this.dashboardRepository.getWeightTrend(userId, 6),
            this.dashboardRepository.getTargetWeight(userId),
        ]);
        let club = null;
        if (latestClub) {
            const openStatus = await this.resolveClubOpenStatus(latestClub.id, now);
            club = {
                id: latestClub.id,
                name: latestClub.name,
                address: latestClub.address,
                ...openStatus,
            };
        }

        let packet = null;
        if (currentPacket) {
            const daysUsed = Math.max(
                0,
                Math.floor((now.getTime() - new Date(currentPacket.startTime).getTime()) / DAY_MS),
            );
            const daysLeft = Math.max(
                0,
                Math.ceil((new Date(currentPacket.endTime).getTime() - now.getTime()) / DAY_MS),
            );
            const usedQuantity = Math.max(0, currentPacket.quota - currentPacket.remainingQuantity);
            const openStatus = await this.resolveClubOpenStatus(currentPacket.clubId, now);
            packet = {
                userPacketId: currentPacket.userPacketId,
                startTime: currentPacket.startTime,
                endTime: currentPacket.endTime,
                status: currentPacket.status,
                club: {
                    id: currentPacket.clubId,
                    name: currentPacket.clubName,
                    address: currentPacket.address,
                    ...openStatus,
                },
                packet: {
                    id: currentPacket.packetId,
                    name: currentPacket.packetName,
                    code: currentPacket.packetCode,
                    dayLimit: currentPacket.dayLimit,
                },
                amount: currentPacket.amount,
                bookingAmount: currentPacket.bookingAmount,
                quota: currentPacket.quota,
                remainingQuantity: currentPacket.remainingQuantity,
                usedQuantity,
                daysUsed,
                daysLeft,
            };
        }

        return {
            currentPacket: packet,
            club,
            checkinThisMonth: {
                totalSessions: checkinStatsThisMonth.totalSessions,
                totalQuantity: checkinStatsThisMonth.totalQuantity,
            },
            checkinAllTime: {
                totalSessions: checkinStatsAllTime.totalSessions,
                totalQuantity: checkinStatsAllTime.totalQuantity,
            },
            currentWeight,
            targetWeight,
            recentActivities: recentCheckins,
            weightTrend,
            notifications: [],
        };
    }
}
