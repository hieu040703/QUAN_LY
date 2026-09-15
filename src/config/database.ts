import { DataSource } from "typeorm";
import { config } from "./env";
import path from "path";

import { entities } from "@/database/models";

const isProduction = config.NODE_ENV === "production";

// Get the correct base path for entities, migrations, and subscribers
const getBasePath = () => {
  if (isProduction) {
    // In production, __dirname will be dist/config
    return path.join(__dirname, "..");
  } else {
    // In development, __dirname will be src/config
    return path.join(__dirname, "..");
  }
};

const basePath = getBasePath();

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
  migrations: [
    isProduction
      ? path.join(basePath, "database/migrations/**/*.js")
      : path.join(basePath, "database/migrations/**/*.ts"),
  ],
  subscribers: [
    isProduction
      ? path.join(basePath, "database/subscribers/**/*.js")
      : path.join(basePath, "database/subscribers/**/*.ts"),
  ],
});

export default DatabaseConfig;
