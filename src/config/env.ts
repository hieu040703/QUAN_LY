import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import logger from "@/shared/utils/logger";

// Load .env file trước khi access process.env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Đảm bảo NODE_ENV được set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),

  // Database
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "3306", 10),
  DB_USERNAME: process.env.DB_USERNAME || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_DATABASE: process.env.DB_DATABASE || "backend_db",

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  REDIS_DB: parseInt(process.env.REDIS_DB || "0", 10),

  // Goong Maps
  GOONG_API_BASE_URL: process.env.GOONG_API_BASE_URL || "https://rsapi.goong.io/v2",
  GOONG_API_KEY: process.env.GOONG_API_KEY || "",
  GOONG_MAP_TILE_KEY: process.env.GOONG_MAP_TILE_KEY || "",
  GOONG_REQUEST_TIMEOUT_MS: parseInt(process.env.GOONG_REQUEST_TIMEOUT_MS || "10000", 10),
  GOONG_DAILY_LIMIT: parseInt(process.env.GOONG_DAILY_LIMIT || "10000", 10),
  GOONG_AUTOCOMPLETE_CACHE_TTL: parseInt(process.env.GOONG_AUTOCOMPLETE_CACHE_TTL || "300", 10),
  GOONG_PLACE_CACHE_TTL: parseInt(process.env.GOONG_PLACE_CACHE_TTL || "86400", 10),
  GOONG_GEOCODE_CACHE_TTL: parseInt(process.env.GOONG_GEOCODE_CACHE_TTL || "86400", 10),
  GOONG_DIRECTIONS_CACHE_TTL: parseInt(process.env.GOONG_DIRECTIONS_CACHE_TTL || "300", 10),

  // Bull Queue
  BULL_PREFIX: process.env.BULL_PREFIX || "bhxh",

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access_secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh_secret",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // App
  APP_NAME: process.env.APP_NAME || "Backend App",
  APP_VERSION: process.env.APP_VERSION || "1.0.0",

  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  TEMP_DIR: process.env.TEMP_DIR || "temp",
  AVATAR_DIR: process.env.AVATAR_DIR || "avatar",
  FILE_DIR: process.env.FILE_DIR || "files",
  UPLOAD_MAX_FILE_SIZE_MB: parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || "20", 10),
  ENABLE_AV_SCAN: process.env.ENABLE_AV_SCAN === "true",
  AV_SCAN_COMMAND: process.env.AV_SCAN_COMMAND || "clamscan",
  FILE_RETENTION_DAYS: parseInt(process.env.FILE_RETENTION_DAYS || "30", 10), // Số ngày giữ file đã xóa

  COMPANY_ID_ADDRESS: process.env.COMPANY_ID_ADDRESS || "itomo-checkin.myddns.me",

  DEFAULT_PAGE: 1,
  DEFAULT_SIZE: 20,
  MAX_SIZE: 10000,

  // AI Configuration (Gemini only)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  AI_MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || "2000"),
  AI_TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
  AI_SYSTEM_PROMPT: process.env.AI_SYSTEM_PROMPT,

  API_DOMAIN: process.env.API_DOMAIN || "http://localhost:4060",
  FE_DOMAIN: process.env.FE_DOMAIN || "http://localhost:3000",
  CUSTOMER_FE_DOMAIN: process.env.CUSTOMER_FE_DOMAIN || "http://localhost:3001",

  MAX_DEVICE_PER_CUSTOMER: parseInt(process.env.MAX_DEVICE_PER_CUSTOMER || "3", 10),
  MAX_DEVICE_AGE_DAYS: parseInt(process.env.MAX_DEVICE_AGE_DAYS || "30", 10),
  MAX_LOGIN_REQUEST_AGE_MINUTES: parseInt(process.env.MAX_LOGIN_REQUEST_AGE_MINUTES || "5", 10),

  MAIL_HOST: process.env.MAIL_HOST || "smtp.gmail.com",
  MAIL_PORT: parseInt(process.env.MAIL_PORT || "465", 10), // Cổng SMTP
  MAIL_USERNAME: process.env.MAIL_USERNAME,
  MAIL_PASSWORD: process.env.MAIL_PASSWORD,

  VAPID_PUBLIC_KEY:
    process.env.VAPID_PUBLIC_KEY ||
    "BJIAa5ccQvr8S0XRPeNYt0uBGSlcF9vV3VsKH9Cq39PZXG0IQcDnFQyLAVaUsc9k7usxBwzuQMt6DV8MkUX7UOw",
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || "rFvWwbJNhIco9X8IUBPBHR-aIwn0gpXQ3F_g-DPQSIs",

  OTP_EXPIRES_MINUTES: parseInt(process.env.OTP_EXPIRES_MINUTES || "10", 10),

  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || "your_google_oauth_client_id_here",
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "your_google_oauth_client_secret_here",

  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || "your_facebook_app_id_here",
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || "your_facebook_app_secret_here",

  // Tenant defaults
  MAX_TENANTS_PER_USER: parseInt(process.env.MAX_TENANTS_PER_USER || "3", 10),
  TRIAL_DAYS: parseInt(process.env.TRIAL_DAYS || "30", 10),

  SORT_ORDER_STEP: parseInt(process.env.SORT_ORDER_STEP || "10", 10),

  DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || "Asia/Ho_Chi_Minh",

  // Cron jobs (node-cron expressions, timezone Asia/Ho_Chi_Minh)
  S3_UPLOAD_CRON: process.env.S3_UPLOAD_CRON || "0 * * * *", // Mặc định: mỗi giờ
  S3_CLEANUP_CRON: process.env.S3_CLEANUP_CRON || "0 1 * * *", // Mặc định: 1h sáng mỗi ngày
};

logger.info("🔧 Config loaded:", {
  NODE_ENV: config.NODE_ENV,
  PORT: config.PORT,
  DB_HOST: config.DB_HOST,
});

if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
  logger.info(`Created directory: ${config.UPLOAD_DIR}`);
}
export const getConfig = (key: string) => {
  return process.env[key] || "";
};
export const getUploadDir = () => {
  return config.UPLOAD_DIR;
};
