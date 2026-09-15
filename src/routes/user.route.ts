import { Router } from "express";
import { container } from "@/config/container";
import { DEVICE_TYPES, UserDeviceRouter } from "@/modules/device";
import { attachUserIdFromAuthToQueryAndBody } from "@/shared/middleware/userId.middleware";

const customerRouter = Router();

const deviceRouter = container.get<UserDeviceRouter>(DEVICE_TYPES.UserDeviceRouter);

customerRouter.use(attachUserIdFromAuthToQueryAndBody);
customerRouter.use("/device", deviceRouter.getRouter());
export default customerRouter;
