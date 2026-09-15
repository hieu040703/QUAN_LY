import { container } from "@/config/container";
import { ATTRIBUTE_TYPES } from "@/modules/attribute/attribute.types";
import { FILE_TYPES } from "@/modules/file/file.types";
import { NOTIFICATION_TYPES } from "@/modules/notification/notification.types";
import { ROLE_TYPES } from "@/modules/role/role.types";
import { USER_TYPES } from "@/modules/user/user.types";
import { VERIFY_OTP_TYPES } from "@/modules/verifyOtp/verifyOtp.types";
import { BOOKING_TYPES } from "@/modules/booking/booking.types";
import { CHECK_IN_TYPES } from "@/modules/checkIn/checkIn.types";
import { CLUB_TYPES } from "@/modules/club/club.types";
import { CLUB_ACTIVITY_TYPES } from "@/modules/clubActivity/clubActivity.types";
import { CLUB_MEMBER_TYPES } from "@/modules/clubMember/clubMember.types";
import { CLUB_ROLE_TYPES } from "@/modules/clubRole/clubRole.types";
import { HEALTH_INDICATOR_TYPES } from "@/modules/healthIndicator/healthIndicator.types";
import { PACKET_TYPES } from "@/modules/packet/packet.types";
import { USER_PACKET_TYPES } from "@/modules/userPacket/userPacket.types";
import { USER_TARGET_TYPES } from "@/modules/userTarget/userTarget.types";
import { TRANSACTION_TYPES } from "@/modules/transaction/transaction.types";
import { CHAT_TYPES } from "@/modules/chat/chat.types";
import { SEEN_MESSAGE_TYPES } from "@/modules/seenMessage/seenMessage.types";

/**
 * Factory để tạo repository map cho tenant entities
 * Tự động lấy tất cả repositories từ inversify container
 */
export class RepositoryFactory {
  private static repoMap: Record<string, any> | null = null;

  /**
   * Lấy tất cả tenant repositories
   * Map entity name -> repository instance
   */
  static getRepositories(): Record<string, any> {
    // Cache lại để không phải get nhiều lần
    if (this.repoMap) {
      return this.repoMap;
    }

    this.repoMap = {
      // Tenant entities
      User: container.get(USER_TYPES.UserRepository),
      Notification: container.get(NOTIFICATION_TYPES.NotificationRepository),

      Attribute: container.get(ATTRIBUTE_TYPES.AttributeRepository),

      File: container.get(FILE_TYPES.FileRepository),
      Role: container.get(ROLE_TYPES.RoleRepository),

      VerifyOtp: container.get(VERIFY_OTP_TYPES.VerifyOtpRepository),

      Booking: container.get(BOOKING_TYPES.BookingRepository),
      CheckIn: container.get(CHECK_IN_TYPES.CheckInRepository),
      Club: container.get(CLUB_TYPES.ClubRepository),
      ClubActivity: container.get(CLUB_ACTIVITY_TYPES.ClubActivityRepository),
      ClubMember: container.get(CLUB_MEMBER_TYPES.ClubMemberRepository),
      ClubRole: container.get(CLUB_ROLE_TYPES.ClubRoleRepository),
      HealthIndicator: container.get(HEALTH_INDICATOR_TYPES.HealthIndicatorRepository),
      Packet: container.get(PACKET_TYPES.PacketRepository),
      UserPacket: container.get(USER_PACKET_TYPES.UserPacketRepository),
      UserTarget: container.get(USER_TARGET_TYPES.UserTargetRepository),
      Transaction: container.get(TRANSACTION_TYPES.TransactionRepository),
      Chat: container.get(CHAT_TYPES.ChatRepository),
      SeenMessage: container.get(SEEN_MESSAGE_TYPES.SeenMessageRepository),
    };

    return this.repoMap;
  }

  /**
   * Reset cache (dùng khi cần refresh repositories)
   */
  static reset(): void {
    this.repoMap = null;
  }
}
