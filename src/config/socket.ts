import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import logger from "@/shared/utils/logger";

let io: SocketIOServer;

// Tổng hợp tất cả socket theo key (user, task, project, notification…)
export let socketMap: { [key: string]: string[] } = {};

export default {
  init: (server: HTTPServer): SocketIOServer => {
    io = new SocketIOServer(server, {
      pingTimeout: 60000,
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
      },
    });

    logger.info("Socket.io initialized");

    io.on("connect", (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);
      // ------------------------------
      // Đăng ký socket cho user
      // ------------------------------
      socket.on("register", (userId: string) => {
        const key = `user-${userId}`;
        if (!socketMap[key]) socketMap[key] = [];
        if (!socketMap[key].includes(socket.id)) socketMap[key].push(socket.id);

        logger.info(`User ${userId} registered with socket ID: ${socket.id}`);
      });

      // ------------------------------
      // Đăng ký socket cho customer
      // ------------------------------
      socket.on("register-customer", (customerId: string) => {
        const key = `customer-${customerId}`;
        if (!socketMap[key]) socketMap[key] = [];
        if (!socketMap[key].includes(socket.id)) socketMap[key].push(socket.id);
        logger.info(
          `Customer ${customerId} registered with socket ID: ${socket.id}`,
        );
      });

      // ------------------------------
      // Join bất kỳ room nào (task, project…)
      // key do client truyền
      // ------------------------------
      socket.on("joinRoom", (key: string) => {
        if (!socketMap[key]) socketMap[key] = [];
        if (!socketMap[key].includes(socket.id)) socketMap[key].push(socket.id);

        logger.info(`Socket ${socket.id} joined room: ${key}`);
      });

      // ------------------------------
      // Đăng ký socket cho device
      // ------------------------------
      socket.on("register-device", (deviceId: string) => {
        const key = `device-${deviceId}`;
        if (!socketMap[key]) socketMap[key] = [];
        if (!socketMap[key].includes(socket.id)) socketMap[key].push(socket.id);
        logger.info(
          `Device ${deviceId} registered with socket ID: ${socket.id}`,
        );
      });
      // ------------------------------

      // ------------------------------
      // Disconnect
      // ------------------------------
      socket.on("disconnect", () => {
        for (const key in socketMap) {
          socketMap[key] = socketMap[key].filter((id) => id !== socket.id);
        }
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    return io;
  },

  // Lấy instance io
  getIO: (): SocketIOServer => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
  },

  // Lấy danh sách socket theo key
  getSocketsByKey: (key: string): string[] => {
    return socketMap[key] || [];
  },

  // Lấy tất cả socket đang lưu
  getAllSockets: (): string[] => {
    return Object.values(socketMap).flat();
  },

  // Đóng socket server
  close: (callback?: () => void): void => {
    if (!io) {
      logger.warn("Socket.io not initialized, nothing to close");
      if (callback) callback();
      return;
    }

    logger.info("Closing Socket.io connections...");

    io.disconnectSockets(true);

    io.close((err) => {
      if (err) logger.error("Error closing Socket.io:", err);
      else logger.info("Socket.io server closed successfully");

      socketMap = {};

      if (callback) callback();
    });
  },
};
