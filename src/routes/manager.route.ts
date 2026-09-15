import { Router } from "express";
import { container } from "@/config/container";
import { authenticate } from "@/shared/middleware/auth.middleware";
import { BOOKING_TYPES, ManagerBookingRouter } from "@/modules/booking";
import { CHECK_IN_TYPES, ManagerCheckInRouter } from "@/modules/checkIn";
import { CLUB_TYPES, ManagerClubRouter } from "@/modules/club";
import { CLUB_ACTIVITY_TYPES, ManagerClubActivityRouter } from "@/modules/clubActivity";
import { CLUB_MEMBER_TYPES, ManagerClubMemberRouter } from "@/modules/clubMember";
import { CLUB_ROLE_TYPES, ManagerClubRoleRouter } from "@/modules/clubRole";
import { DASHBOARD_TYPES, ManagerDashboardRouter } from "@/modules/dashboard";
import { GOONG_MAP_TYPES } from "@/modules/goongMap/goongMap.types";
import { ManagerGoongMapRouter } from "@/modules/goongMap/manager.route";
import { USER_PACKET_TYPES, ManagerUserPacketRouter } from "@/modules/userPacket";
import { PACKET_TYPES, ManagerPacketRouter } from "@/modules/packet";
import { UserRouter as ManagerUserRouter } from "@/modules/user/manager.route";
import { USER_TYPES } from "@/modules/user";

const managerRouter = Router();

const bookingRouter = container.get<ManagerBookingRouter>(BOOKING_TYPES.ManagerBookingRouter);
const checkInRouter = container.get<ManagerCheckInRouter>(CHECK_IN_TYPES.ManagerCheckInRouter);
const clubRouter = container.get<ManagerClubRouter>(CLUB_TYPES.ManagerClubRouter);
const clubActivityRouter = container.get<ManagerClubActivityRouter>(CLUB_ACTIVITY_TYPES.ManagerClubActivityRouter);
const clubMemberRouter = container.get<ManagerClubMemberRouter>(CLUB_MEMBER_TYPES.ManagerClubMemberRouter);
const clubRoleRouter = container.get<ManagerClubRoleRouter>(CLUB_ROLE_TYPES.ManagerClubRoleRouter);
const dashboardRouter = container.get<ManagerDashboardRouter>(DASHBOARD_TYPES.ManagerDashboardRouter);
const goongMapRouter = container.get<ManagerGoongMapRouter>(GOONG_MAP_TYPES.ManagerGoongMapRouter);
const userPacketRouter = container.get<ManagerUserPacketRouter>(USER_PACKET_TYPES.ManagerUserPacketRouter);
const packetRouter = container.get<ManagerPacketRouter>(PACKET_TYPES.ManagerPacketRouter);
const userRouter = container.get<ManagerUserRouter>(USER_TYPES.ManagerUserRouter);

// Manager users chỉ xác thực tài khoản; quyền được kiểm tra theo ClubRole
// bởi clubPermissionMiddleware trong các router nghiệp vụ.
managerRouter.use("/booking", bookingRouter.getRouter());
managerRouter.use("/check-in", checkInRouter.getRouter());
managerRouter.use("/club", clubRouter.getRouter());
managerRouter.use("/club-activity", clubActivityRouter.getRouter());
managerRouter.use("/club-member", clubMemberRouter.getRouter());
managerRouter.use("/club-role", clubRoleRouter.getRouter());
managerRouter.use("/dashboard", dashboardRouter.getRouter());
managerRouter.use("/goong-map", goongMapRouter.getRouter());
managerRouter.use("/user-packet", userPacketRouter.getRouter());
managerRouter.use("/packet", packetRouter.getRouter());
managerRouter.use("/user", userRouter.getRouter());
export default managerRouter;
