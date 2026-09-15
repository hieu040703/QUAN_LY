import Socket from "@/config/socket";
import { Notification } from "@/database/models/Notification";
import { DeepPartial } from "typeorm";

export interface SocketData {
  userId: string;
  notification: Notification;
}

export class SocketUtils {
  static getUserSocket(userId: string) {
    return Socket.getSocketsByKey(`user-${userId}`);
  }

  static sendSocketNotifications(userIds: string[], socketName: string, data: Notification) {
    userIds.forEach((userId) => {
      const userSockets = Socket.getSocketsByKey(`user-${userId}`);
      if (userSockets?.length) {
        userSockets.forEach((socketId) => {
          Socket.getIO()
            .to(socketId)
            .emit(socketName, {
              ...data,
              isRead: false,
            });
        });
      }
    });
  }

  // Gửi sự kiện tới các socket đã đăng ký theo customer (register-customer)
  static sendSocketToCustomers(customerIds: string[], socketName: string, data: any) {
    customerIds.forEach((customerId) => {
      const sockets = Socket.getSocketsByKey(`customer-${customerId}`);
      if (!sockets?.length) return;
      sockets.forEach((socketId) => {
        Socket.getIO().to(socketId).emit(socketName, data);
      });
    });
  }

  // Gửi sự kiện tới các socket đã đăng ký theo user (register)
  static sendSocketToUsers(userIds: string[], socketName: string, data: any) {
    userIds.forEach((userId) => {
      const sockets = Socket.getSocketsByKey(`user-${userId}`);
      if (!sockets?.length) return;
      sockets.forEach((socketId) => {
        Socket.getIO().to(socketId).emit(socketName, data);
      });
    });
  }

  // Gửi sự kiện tới danh sách key socket (user-x, customer-y, ...).
  // Tự gom toàn bộ socket id và LOẠI BỎ TRÙNG → mỗi client chỉ nhận đúng 1 lần,
  // tránh gửi thừa khi 1 người đăng ký nhiều kênh (register + register-customer).
  static sendSocketToKeys(keys: string[], socketName: string, data: any) {
    const socketIds = new Set<string>();
    keys.forEach((key) => {
      const sockets = Socket.getSocketsByKey(key);
      if (sockets?.length) sockets.forEach((id) => socketIds.add(id));
    });
    socketIds.forEach((socketId) => {
      Socket.getIO().to(socketId).emit(socketName, data);
    });
  }

  static sendSocketPermission(userIds: string[]) {
    userIds.forEach((userId) => {
      const userSockets = Socket.getSocketsByKey(`user-${userId}`);
      if (userSockets?.length) {
        userSockets.forEach((socketId) => {
          Socket.getIO().to(socketId).emit("permission-update", {
            message: "Permission updated",
          });
        });
      }
    });
  }

  static sendSocketChatbotResponse(userId: string, data: any) {
    const userSockets = Socket.getSocketsByKey(`user-${userId}`);
    if (userSockets?.length) {
      userSockets.forEach((socketId) => {
        Socket.getIO().to(socketId).emit("chatbot-response", data);
      });
    }
  }

  static sendSocketLoginRequest(deviceId: string, remember: boolean) {
    const deviceSockets = Socket.getSocketsByKey(`device-${deviceId}`);
    if (deviceSockets?.length) {
      deviceSockets.forEach((socketId) => {
        Socket.getIO().to(socketId).emit("login-request", {
          remember,
        });
      });
    }
  }

  static sendSocketImportProgress(userId: string, data: any) {
    const userSockets = Socket.getSocketsByKey(`user-${userId}`);
    if (userSockets?.length) {
      console.log(
        `📤 [Socket] Sending import-progress to user ${userId} (${userSockets.length} sockets) - Progress: ${data.progress}% (${data.processedRows}/${data.totalRows})`,
      );
      userSockets.forEach((socketId) => {
        Socket.getIO().to(socketId).emit("import-progress", data);
      });
    } else {
      console.log(`⚠️ [Socket] No sockets found for user ${userId} - Cannot send import-progress`);
    }
  }
}
