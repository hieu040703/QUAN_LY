import { Container } from "inversify";

// TODO: ======== GLOBAL MODULES ========
import { authModule } from "@/modules/auth";
import { notificationModule } from "@/modules/notification";
import { userModule } from "@/modules/user";
import { verifyOtpModule } from "@/modules/verifyOtp";
import { fileModule } from "@/modules/file";
import { roleModule } from "@/modules/role";
import { logModule } from "@/modules/log";
import { deviceModule } from "@/modules/device";

//# ================== Container Setup ====================
const container = new Container();

container.load(
  // TODO: Global Modules
  authModule,
  notificationModule,
  userModule,
  verifyOtpModule,
  fileModule,
  roleModule,
  logModule,
  deviceModule,
);

export { container };
