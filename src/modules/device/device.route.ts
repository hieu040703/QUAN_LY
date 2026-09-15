import { Router } from "express";
import { injectable, inject } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { DEVICE_TYPES } from "./device.types";
import { DeviceController } from "./device.controller";
import { RegisterDeviceSchema, UnregisterDeviceSchema, DeviceQuerySchema } from "./device.validator";

@injectable()
export class DeviceRouter {
  private router: Router;

  constructor(
    @inject(DEVICE_TYPES.DeviceController)
    private controller: DeviceController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Đăng ký FCM token (dành cho khách hàng/nhân viên đã đăng nhập)
    this.router.post(
      "/register",
      zodValidate(RegisterDeviceSchema, "body"),
      permissionMiddleware("device", "create", true),
      this.controller.register,
    );

    // Hủy đăng ký FCM token
    this.router.delete(
      "/unregister",
      zodValidate(UnregisterDeviceSchema, "body"),
      permissionMiddleware("device", "delete", true),
      this.controller.unregister,
    );

    this.router.get(
      "/",
      zodValidate(DeviceQuerySchema, "query"),
      permissionMiddleware("device", "read"),
      this.controller.getAllWithPagination,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
