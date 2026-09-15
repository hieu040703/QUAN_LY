import { Router } from "express";
import { container } from "@/config/container";
import { BOOKING_TYPES, UserBookingRouter } from "@/modules/booking";
import { CHECK_IN_TYPES, UserCheckInRouter } from "@/modules/checkIn";
import { CLUB_TYPES, UserClubRouter } from "@/modules/club";
import { CLUB_ACTIVITY_TYPES, UserClubActivityRouter } from "@/modules/clubActivity";
import { CLUB_MEMBER_TYPES, UserClubMemberRouter } from "@/modules/clubMember";
import { DEVICE_TYPES, UserDeviceRouter } from "@/modules/device";
import { HEALTH_INDICATOR_TYPES, UserHealthIndicatorRouter } from "@/modules/healthIndicator";
import { PACKET_TYPES, UserPacketRouter as UserPacketCatalogRouter } from "@/modules/packet";
import { TRANSACTION_TYPES, UserTransactionRouter } from "@/modules/transaction";
import { USER_PACKET_TYPES, UserUserPacketRouter } from "@/modules/userPacket";
import { USER_TARGET_TYPES, UserUserTargetRouter } from "@/modules/userTarget";
import { DASHBOARD_TYPES, DashboardUserRoute } from "@/modules/dashboard";
import { attachUserIdFromAuthToQueryAndBody } from "@/shared/middleware/userId.middleware";

const customerRouter = Router();

const bookingRouter = container.get<UserBookingRouter>(BOOKING_TYPES.UserBookingRouter);
const checkInRouter = container.get<UserCheckInRouter>(CHECK_IN_TYPES.UserCheckInRouter);
const clubRouter = container.get<UserClubRouter>(CLUB_TYPES.UserClubRouter);
const clubActivityRouter = container.get<UserClubActivityRouter>(CLUB_ACTIVITY_TYPES.UserClubActivityRouter);
const clubMemberRouter = container.get<UserClubMemberRouter>(CLUB_MEMBER_TYPES.UserClubMemberRouter);
const deviceRouter = container.get<UserDeviceRouter>(DEVICE_TYPES.UserDeviceRouter);
const healthIndicatorRouter = container.get<UserHealthIndicatorRouter>(
  HEALTH_INDICATOR_TYPES.UserHealthIndicatorRouter,
);
const packetRouter = container.get<UserPacketCatalogRouter>(PACKET_TYPES.PacketUserRouter);
const transactionRouter = container.get<UserTransactionRouter>(TRANSACTION_TYPES.UserTransactionRouter);
const userPacketRouter = container.get<UserUserPacketRouter>(USER_PACKET_TYPES.UserUserPacketRouter);
const userTargetRouter = container.get<UserUserTargetRouter>(USER_TARGET_TYPES.UserUserTargetRouter);
const dashboardUserRoute = container.get<DashboardUserRoute>(DASHBOARD_TYPES.DashboardUserRouter);

customerRouter.use("/club", clubRouter.getRouter());
customerRouter.use(attachUserIdFromAuthToQueryAndBody);

customerRouter.use("/booking", bookingRouter.getRouter());
customerRouter.use("/check-in", checkInRouter.getRouter());
customerRouter.use("/club-activity", clubActivityRouter.getRouter());
customerRouter.use("/club-member", clubMemberRouter.getRouter());
customerRouter.use("/device", deviceRouter.getRouter());
customerRouter.use("/health-indicator", healthIndicatorRouter.getRouter());
customerRouter.use("/packet", packetRouter.getRouter());
customerRouter.use("/transaction", transactionRouter.getRouter());
customerRouter.use("/user-packet", userPacketRouter.getRouter());
customerRouter.use("/user-target", userTargetRouter.getRouter());
customerRouter.use("/dashboard", dashboardUserRoute.getRouter());
export default customerRouter;
