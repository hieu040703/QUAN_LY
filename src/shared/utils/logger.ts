import winston from "winston";
import path from "path";

const logDir = "logs";
const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const meta = Object.keys(metadata).length ? JSON.stringify(metadata) : "";
  return `${timestamp} [${level}]: ${message}`;
});

const logger = winston.createLogger({
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // All logs
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5242880,
      maxFiles: 5,
    }),
    // Console in development
    ...(process.env.NODE_ENV !== "production"
      ? [
          new winston.transports.Console({
            format: combine(
              colorize({
                all: true,
                colors: {
                  error: "red",
                  warn: "yellow",
                  info: "green",
                  debug: "blue",
                },
              }),
              logFormat
            ),
          }),
        ]
      : []),
  ],
});

export default logger;
