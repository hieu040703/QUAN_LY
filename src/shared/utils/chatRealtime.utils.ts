import Socket from "@/config/socket";
import logger from "./logger";

export function emitChatRealtimeByKey(
  key: string,
  event: string,
  payload: unknown,
): void {
  try {
    const io = Socket.getIO();
    const socketIds = Socket.getSocketsByKey(key);

    for (const socketId of socketIds) {
      io.to(socketId).emit(event, payload);
    }
  } catch (error) {
    logger.warn(`[ChatRealtime] emit failed key=${key} event=${event}`);
  }
}

export function emitChatRealtimeByKeys(
  keys: string[],
  event: string,
  payload: unknown,
): void {
  const dedup = new Set(keys.filter(Boolean));
  for (const key of dedup) {
    emitChatRealtimeByKey(key, event, payload);
  }
}
