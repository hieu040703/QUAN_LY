import {DateTransform} from "@/shared/base/BaseValidator";
import {z} from "zod";

export const DashboardQuerySchema = z.object({
    startAt: DateTransform,
    endAt: DateTransform,
});

export const TopCustomerQuerySchema = z.object({
    startAt: DateTransform,
    endAt: DateTransform,
    sortBy: z.enum(["revenue", "netProfit", "profitMargin", "debt"]).default("revenue"),
});
export const RevenueQuerySchema = z.object({
    type: z.enum(["week", "month", "year"]),
    year: z.number().optional(),
    month: z.number().optional(),
});
export const DashboardOverviewQuerySchema = z.object({
    startDate: DateTransform.optional(),
    endDate: DateTransform.optional(),
    clubId: z.string().uuid().optional(),
    clubIds: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            if (Array.isArray(val)) return val;
            return val.split(",").filter(Boolean);
        }),
    status: z.enum(["active", "inactive"]).optional(),
});

export type DashboardQueryDto = z.infer<typeof DashboardQuerySchema>;
export type TopCustomerQueryDto = z.infer<typeof TopCustomerQuerySchema>;
export type RevenueQueryDto = z.infer<typeof RevenueQuerySchema>;
export type DashboardOverviewQueryDto = z.infer<typeof DashboardOverviewQuerySchema>;