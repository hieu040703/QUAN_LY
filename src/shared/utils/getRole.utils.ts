import DatabaseConfig from "@/config/database";
import { ClubMember, MemberStatus, RoleClub } from "@/database/models/ClubMember";
import { User } from "@/database/models/User";
import { hasPermissionWithFallback, Module, Permission } from "../middleware/permission.middleware";

/**
 * Lấy danh sách user có quyền ở cấp hệ thống hoặc ít nhất một CLB.
 *
 * Leader được xem là có toàn bộ quyền trong CLB, giống như logic tại
 * getClubPermissionClubIds/clubPermissionMiddleware.
 */
export async function getUserHasPermission(module: Module, permission: Permission, clubId?: string): Promise<string[]> {
  // When clubId is provided, only club-level permissions are valid.
  // System permissions and admin must not receive club-scoped notifications.
  const manager = DatabaseConfig.manager;
  const userRepository = manager.getRepository(User);
  const memberRepository = manager.getRepository(ClubMember);

  const [users, activeMembers] = await Promise.all([
    userRepository.find({ relations: { role: true } }),
    clubId
      ? memberRepository.find({
          where: { status: MemberStatus.ACTIVE, clubId },
          relations: { clubRole: true },
        })
      : Promise.resolve([] as ClubMember[]),
  ]);

  const userIds = new Set<string>();

  // Admin được middleware xem là có toàn bộ quyền, kể cả khi không có role.
  if (!clubId) {
    users.forEach((user) => {
      if (user.username === "admin" || hasPermissionWithFallback(user.role?.permissions, module, permission)) {
        userIds.add(user.id);
      }
    });
  }

  // Quyền club chỉ có hiệu lực với membership đang active.
  activeMembers.forEach((member) => {
    const clubPermissions = member.clubRole?.permissions;
    if (member.role === RoleClub.LEADER || hasPermissionWithFallback(clubPermissions, module, permission)) {
      userIds.add(member.userId);
    }
  });

  return [...userIds];
}
