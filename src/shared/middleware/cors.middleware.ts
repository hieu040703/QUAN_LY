import { config } from "@/config/env";
import cors from "cors";

const allowedOrigins = ["http://localhost:3000", "https://fitclub.itomosoft.com"];

const corsMiddleware = cors({
  origin: (origin: any, callback: any) => {
    if (!config.NODE_ENV || config.NODE_ENV === "development") {
      callback(null, true);
      return;
    }
    // Check if the incoming request's origin is in the allowedOrigins array
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-device-id",
    "x-timezone",
    "x-ip-address",
    "x-refresh-token",
    "x-store-code",
    "x-club-id",
  ],
});

export default corsMiddleware;
