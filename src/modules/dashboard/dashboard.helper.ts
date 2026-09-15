export interface DateRangeResult {
    startAt: Date;
    endAt: Date;
    prevStartAt: Date;
    prevEndAt: Date;
}

function startOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
}

function endOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(23, 59, 59, 999);
    return r;
}

function addDays(
    d: Date,
    days: number,
): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + days);
    return r;
}

export function resolveDateRange(
    startDate?: Date,
    endDate?: Date,
): DateRangeResult {
    const now = new Date();

    // Nếu không truyền ngày thì lấy hôm nay
    const start = startDate ?? now;
    const end = endDate ?? start;

    const startAt = startOfDay(start);
    const endAt = endOfDay(end);

    // Số ngày của khoảng hiện tại
    const rangeDays =
        Math.round(
            (
                endAt.getTime() -
                startAt.getTime()
            ) /
            (1000 * 60 * 60 * 24),
        ) + 1;

    // Khoảng trước đó có cùng số ngày
    const prevEndAt = endOfDay(
        addDays(startAt, -1),
    );

    const prevStartAt = startOfDay(
        addDays(
            prevEndAt,
            -(rangeDays - 1),
        ),
    );

    return {
        startAt,
        endAt,
        prevStartAt,
        prevEndAt,
    };
}

export function calcPercentChange(
    current: number,
    previous: number,
): number {
    if (previous === 0) {
        return current > 0
            ? 100
            : 0;
    }

    return Math.round(
        ((current - previous) / previous) *
        1000,
    ) / 10;
}
export function startOfMonth(d: Date): Date {
    const r = new Date(d.getFullYear(), d.getMonth(), 1);
    r.setHours(0, 0, 0, 0);
    return r;
}
export function endOfMonth(d: Date): Date {
    const r = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    r.setHours(23, 59, 59, 999);
    return r;
}