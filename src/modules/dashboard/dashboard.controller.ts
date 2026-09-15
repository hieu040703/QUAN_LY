import {Request, Response, NextFunction} from "express";
import {inject, injectable} from "inversify";
import {DASHBOARD_TYPES} from "./dashboard.types";
import {DashboardService} from "./dashboard.service";
import {ApiResponseHandler} from "@/shared/utils/response.utils";
import {DashboardOverviewQueryDto, DashboardOverviewQuerySchema} from "./dashboard.validator";

@injectable()
export class DashboardController {
    constructor(
        @inject(DASHBOARD_TYPES.DashboardService)
        protected service: DashboardService,
    ) {
    }

    getOverview = async (req: Request, res: Response): Promise<void> => {
        const query = req.query as unknown as DashboardOverviewQueryDto;
        const data = await this.service.getOverview(query);

        const response = ApiResponseHandler.getSuccess(
            "Lấy dữ liệu thống kê thành công",
            data,
        );
        res.status(response.statusCode).json(response);
    };
    getGeneralStats = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = DashboardOverviewQuerySchema.parse(req.query);
            const data = await this.service.getGeneralStats(query);
            res.json(data);
        } catch (err) {
            next(err);
        }
    };
    getClubStatistics = async (req: Request, res: Response, next: NextFunction,) => {
        try {
            const query = DashboardOverviewQuerySchema.parse(req.query);
            const data = await this.service.getClubStatistics(query);
            res.json(data);
        } catch (err) {
            next(err);
        }
    };
    getMemberOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.userContext?.userId;
            if (!userId) {
                res.status(401).json(
                    ApiResponseHandler.error(401, "Không xác định được người dùng đăng nhập"),
                );
                return;
            }
            const data = await this.service.getMemberOverview(userId);
            const response = ApiResponseHandler.getSuccess(
                "Lấy dữ liệu trang chủ hội viên thành công",
                data,
            );
            res.status(response.statusCode).json(response);
        } catch (err) {
            next(err);
        }
    };
}