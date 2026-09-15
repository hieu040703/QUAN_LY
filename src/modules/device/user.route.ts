import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachUserIdFromAuth } from "@/shared/middleware/userId.middleware";
import { DeviceController } from "./device.controller";
import { DEVICE_TYPES } from "./device.types";
import { DeviceQuerySchema, RegisterDeviceSchema, UnregisterDeviceSchema } from "./device.validator";

@injectable()
export class UserDeviceRouter {
  private router: Router;

  constructor(
    @inject(DEVICE_TYPES.DeviceController)
    private controller: DeviceController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post("/register", zodValidate(RegisterDeviceSchema, "body"), this.controller.register);
    this.router.delete("/unregister", zodValidate(UnregisterDeviceSchema, "body"), this.controller.unregister);
    this.router.get(
      "/",
      zodValidate(DeviceQuerySchema, "query"),
      attachUserIdFromAuth("device", "read", "query", { attachUserIdWhenHasPermission: false }),
      this.controller.getAllWithPagination,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
