import { Cron } from "croner";
import { LessThanOrEqual } from "typeorm";
import { UserPacket, UserPacketStatus } from "@/database/models/UserPacket";
import { DatabaseConfig } from "@/config/database";
import logger from "@/shared/utils/logger";

async function cancelExpiredUserPackets(): Promise<void> {
  try {
    const now = new Date();
    const userPacketRepository = DatabaseConfig.getRepository(UserPacket);

    const result = await userPacketRepository.update(
      {
        status: UserPacketStatus.ACTIVE,
        endTime: LessThanOrEqual(now),
      },
      {
        status: UserPacketStatus.END,
      },
    );

    logger.info(`[CancelPacket] Đã hủy ${result.affected ?? 0} userPacket hết hạn.`);
  } catch (error) {
    logger.error("[CancelPacket] Lỗi khi hủy userPacket hết hạn:", error);
  }
}

let job: Cron | null = null;

export const CancelPacketJob = {
  start: () => {
    if (!job) {
      job = new Cron(
        "0 0 0 * * *", // 00:00 mỗi ngày
        { timezone: "Asia/Ho_Chi_Minh" },
        async () => {
          logger.info("[CancelPacket] Bắt đầu kiểm tra userPacket hết hạn");
          await cancelExpiredUserPackets();
        },
      );

      logger.info("[CancelPacket] Job đã được khởi động");
    }
  },

  stop: () => {
    if (job) {
      job.stop();
      job = null;
      logger.info("[CancelPacket] Job đã dừng");
    }
  },
};
