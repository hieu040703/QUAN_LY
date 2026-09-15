import { EntityManager } from "typeorm";
import DatabaseConfig from "@/config/database";

export async function withTransaction<T>(
  callback: (manager: EntityManager) => Promise<T>,
): Promise<T> {
  return DatabaseConfig.transaction(async (manager) => {
    await manager.query(`SET LOCAL search_path TO public`);
    try {
      return await callback(manager);
    } catch (error) {
      throw error;
    }
  });
}
