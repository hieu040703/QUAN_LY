import { Router } from "express";
import { container } from "@/config/container";
import { UserRouter as ManagerUserRouter } from "@/modules/user/manager.route";
import { USER_TYPES } from "@/modules/user";

const managerRouter = Router();

const userRouter = container.get<ManagerUserRouter>(USER_TYPES.ManagerUserRouter);

// Manager users chỉ xác thực tài khoản; quyền được kiểm tra theo ClubRole
// bởi clubPermissionMiddleware trong các router nghiệp vụ.
managerRouter.use("/user", userRouter.getRouter());
export default managerRouter;
