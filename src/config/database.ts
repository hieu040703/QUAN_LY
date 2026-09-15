import { DataSource } from "typeorm";
import { config } from "./env";

import { entities } from "@/database/models";

export const DatabaseConfig = new DataSource({
  type: "postgres",
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_DATABASE,
  synchronize: false, // Tắt synchronize tạm thời để tránh lỗi 1600 columns
  logging: false,
  entities: entities,
  cache: false,
  migrations: [],
  subscribers: [],
});

export default DatabaseConfig;
