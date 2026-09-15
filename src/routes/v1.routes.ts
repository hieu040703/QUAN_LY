import { container } from "@/config/container";
import { authenticate, authorization } from "@/shared/middleware/auth.middleware";
import { AuthRouter } from "@/modules/auth/auth.route";
import { AUTH_TYPES } from "@/modules/auth/auth.types";
import { FILE_TYPES, FileRouter } from "@/modules/file";
import { ROLE_TYPES, RoleRouter } from "@/modules/role";
import { USER_TYPES, UserRouter } from "@/modules/user";
import { getCode } from "@/shared/utils/code.utils";
import { Router } from "express";
import { LOG_TYPES, LogRouter } from "@/modules/log";
import customerRouter from "./user.route";
import managerRouter from "./manager.route";

const router = Router();
const authRouter = container.get<AuthRouter>(AUTH_TYPES.AuthRouter);
const userRouter = container.get<UserRouter>(USER_TYPES.UserRouter);
const fileRouter = container.get<FileRouter>(FILE_TYPES.FileRouter);
const roleRouter = container.get<RoleRouter>(ROLE_TYPES.RoleRouter);
const logRouter = container.get<LogRouter>(LOG_TYPES.LogRouter);

router.use("/auth", authRouter.getRouter());

router.use(authenticate);
router.use(authorization);
router.use("/customer", customerRouter);
router.use("/manager", managerRouter);
router.use("/user", userRouter.getRouter());
router.use("/file", fileRouter.getRouter());
router.use("/role", roleRouter.getRouter());
router.use("/log", logRouter.getRouter());
router.use("/code", getCode);

export default router;
