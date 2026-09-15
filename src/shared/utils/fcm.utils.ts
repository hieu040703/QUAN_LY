// Import để khởi tạo Firebase Admin SDK (side effect) trước khi gọi getMessaging()
import "@/config/firebase";
import { getMessaging } from "firebase-admin/messaging";
import type { MulticastMessage } from "firebase-admin/messaging";
import logger from "./logger";

/**
 * Gửi push notification FCM tới danh sách device token.
 * @param tokens - danh sách FCM token
 * @param title - tiêu đề thông báo
 * @param body - nội dung thông báo
 * @param data - payload tùy chỉnh (sẽ được chuyển thành string)
 */
export async function sendFcmPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!tokens?.length) return;

  try {
    const message: MulticastMessage = {
      notification: { title, body },
      tokens,
    };

    if (data) {
      message.data = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? "")]));
    }

    const response = await getMessaging().sendEachForMulticast(message);
    logger.info(`📲 FCM sent: ${response.successCount} success / ${response.failureCount} failed`);

    // Log chi tiết token lỗi để tiện gỡ (có thể dọn token chết ở đây)
    response.responses.forEach((r, index) => {
      if (!r.success) {
        logger.warn(`FCM token failed (${index}): ${r.error?.message}`);
      }
    });
  } catch (error) {
    logger.error("Error sending FCM push:", error);
  }
}
