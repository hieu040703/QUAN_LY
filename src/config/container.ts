import { Container } from "inversify";

// TODO: ======== GLOBAL MODULES ========
import { authModule } from "@/modules/auth";
import { notificationModule } from "@/modules/notification";
import { userModule } from "@/modules/user";
import { verifyOtpModule } from "@/modules/verifyOtp";
import { fileModule } from "@/modules/file";
import { attributeModule } from "@/modules/attribute";
import { roleModule } from "@/modules/role";
import { logModule } from "@/modules/log";
import { deviceModule } from "@/modules/device";
import { bookingModule } from "@/modules/booking";
import { checkInModule } from "@/modules/checkIn";
import { clubModule } from "@/modules/club";
import { clubActivityModule } from "@/modules/clubActivity";
import { clubMemberModule } from "@/modules/clubMember";
import { clubRoleModule } from "@/modules/clubRole";
import { healthIndicatorModule } from "@/modules/healthIndicator";
import { packetModule } from "@/modules/packet";
import { userPacketModule } from "@/modules/userPacket";
import { userTargetModule } from "@/modules/userTarget";
import { transactionModule } from "@/modules/transaction";
import { dashboardModule } from "@/modules/dashboard";
import { goongMapModule } from "@/modules/goongMap/goongMap.container";
import { chatModule } from "@/modules/chat";
import { seenMessageModule } from "@/modules/seenMessage";

//# ================== Container Setup ====================
const container = new Container();

container.load(
  // TODO: Global Modules
  authModule,
  notificationModule,
  userModule,
  verifyOtpModule,
  fileModule,
  attributeModule,
  roleModule,
  logModule,
  deviceModule,
  bookingModule,
  checkInModule,
  clubModule,
  clubActivityModule,
  clubMemberModule,
  clubRoleModule,
  healthIndicatorModule,
  packetModule,
  userPacketModule,
  userTargetModule,
  transactionModule,
  dashboardModule,
  goongMapModule,
  chatModule,
  seenMessageModule,
);

export { container };
