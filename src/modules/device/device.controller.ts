import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { DeviceService } from "./device.service";
import { DEVICE_TYPES } from "./device.types";
import { Device } from "@/database/models/Device";
import { Request, Response, NextFunction } from "express";
import { ApiResponseHandler } from "@/shared/utils/response.utils";
import { BadRequestError } from "@/shared/types/errors";

@injectable()
export class DeviceController extends BaseController<Device> {
  protected service: DeviceService;

  constructor(
    @inject(DEVICE_TYPES.DeviceService)
    service: DeviceService,
  ) {
    super();
    this.service = service;
  }

  /** POST /device/register — body { fcmToken, platform? } */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new BadRequestError("Chưa xác định được tài khoản");
      const { fcmToken, platform } = req.body;
      const data = await this.service.register(userId, fcmToken, platform);
      return res.status(200).json(ApiResponseHandler.createSuccess("OK", data));
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /device/unregister — body { fcmToken } */
  unregister = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new BadRequestError("Chưa xác định được tài khoản");
      const { fcmToken } = req.body;
      await this.service.unregister(userId, fcmToken);
      return res.status(200).json(ApiResponseHandler.deleteSuccess("OK"));
    } catch (error) {
      next(error);
    }
  };
}
