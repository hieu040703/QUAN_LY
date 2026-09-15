import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { DeviceRepository } from "./device.repository";
import { Device } from "@/database/models/Device";
import { DEVICE_TYPES } from "./device.types";
import { BadRequestError } from "@/shared/types/errors";

@injectable()
export class DeviceService extends BaseService<Device> {
  protected repository: DeviceRepository;

  constructor(
    @inject(DEVICE_TYPES.DeviceRepository)
    repository: DeviceRepository,
  ) {
    super();
    this.repository = repository;
  }

  /**
   * Đăng ký FCM token cho 1 user.
   * - Nếu token đã tồn tại cho user này → cập nhật platform, không tạo trùng.
   * - Ngược lại tạo mới device.
   */
  async register(userId: string, fcmToken: string, platform?: string | null): Promise<Device> {
    if (!fcmToken) throw new BadRequestError("Thiếu FCM token");

    const existing = await this.repository.findOne({ where: { userId, fcmToken } });
    if (existing) {
      if (platform) await this.repository.update(existing.id, { platform });
      return existing;
    }

    return this.repository.create({ userId, fcmToken, platform: platform || null });
  }

  /**
   * Hủy đăng ký FCM token của 1 user.
   */
  async unregister(userId: string, fcmToken: string): Promise<void> {
    if (!fcmToken) throw new BadRequestError("Thiếu FCM token");

    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .delete()
      .from(Device)
      .where("userId = :userId", { userId })
      .andWhere("fcmToken = :fcmToken", { fcmToken })
      .execute();
  }

  /**
   * Hủy đăng ký device theo FCM token (không cần userId).
   * Dùng khi session hết hạn (token expired) để dọn device 1 cách độc lập.
   */
  async unregisterByToken(fcmToken: string): Promise<void> {
    if (!fcmToken) throw new BadRequestError("Thiếu FCM token");

    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .delete()
      .from(Device)
      .where("fcmToken = :fcmToken", { fcmToken })
      .execute();
  }

  /**
   * Lấy toàn bộ FCM token của danh sách userId.
   */
  async getTokensByUserIds(userIds: string[]): Promise<string[]> {
    if (!userIds?.length) return [];
    const devices = await this.repository.find({ where: userIds.map((userId) => ({ userId })) });
    return [...new Set(devices.map((d) => d.fcmToken))];
  }
}
