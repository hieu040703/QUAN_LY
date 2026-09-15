import { container } from "@/config/container";
import { FILE_TYPES } from "@/modules/file/file.types";
import { NOTIFICATION_TYPES } from "@/modules/notification/notification.types";
import { ROLE_TYPES } from "@/modules/role/role.types";
import { USER_TYPES } from "@/modules/user/user.types";
import { VERIFY_OTP_TYPES } from "@/modules/verifyOtp/verifyOtp.types";

/** Repository registry used by the shared service layer. */
export class RepositoryFactory {
  private static repoMap: Record<string, any> | null = null;

  static getRepositories(): Record<string, any> {
    if (this.repoMap) return this.repoMap;

    this.repoMap = {
      User: container.get(USER_TYPES.UserRepository),
      Role: container.get(ROLE_TYPES.RoleRepository),
      Notification: container.get(NOTIFICATION_TYPES.NotificationRepository),
      File: container.get(FILE_TYPES.FileRepository),
      VerifyOtp: container.get(VERIFY_OTP_TYPES.VerifyOtpRepository),
    };
    return this.repoMap;
  }

  static reset(): void {
    this.repoMap = null;
  }
}
