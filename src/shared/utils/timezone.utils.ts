import logger from "./logger";

/**
 * Utility class để xử lý timezone conversion
 */
export class TimezoneUtils {
  /**
   * Get timezone offset in hours from IANA timezone string
   */
  static getTimezoneOffset(timezone: string): number {
    try {
      const now = new Date();
      const utcTime = now.toLocaleString("en-US", { timeZone: "UTC" });
      const localTime = now.toLocaleString("en-US", { timeZone: timezone });

      const utcDate = new Date(utcTime);
      const localDate = new Date(localTime);
      const offsetMs = localDate.getTime() - utcDate.getTime();
      const offsetHours = offsetMs / (1000 * 60 * 60);

      return Math.round(offsetHours);
    } catch (error) {
      logger.warn(`Invalid timezone: ${timezone}, defaulting to GMT+7`);
      return 7;
    }
  }

  /**
   * Convert UTC date to user's local timezone
   */
  static utcToLocal(utcDate: Date, timezone: string): Date {
    const offsetHours = this.getTimezoneOffset(timezone);
    const localDate = new Date(utcDate);
    localDate.setHours(localDate.getHours() + offsetHours);
    return localDate;
  }

  /**
   * Convert local date to UTC
   */
  static localToUTC(localDate: Date, timezone: string): Date {
    const offsetHours = this.getTimezoneOffset(timezone);
    const utcDate = new Date(localDate);
    utcDate.setHours(utcDate.getHours() - offsetHours);
    return utcDate;
  }

  /**
   * Danh sách các field name có thể là date
   */
  private static readonly DATE_FIELD_PATTERNS = [
    /date$/i, // endDate, startDate, createdDate
    /^created/i, // createdAt, created_at
    /^updated/i, // updatedAt, updated_at
    /^deleted/i, // deletedAt, deleted_at
    /timestamp/i, // timestamp
    /time$/i, // lastTime, firstTime
    /^date/i, // dob, dateCreated
  ];

  /**
   * Check if field name matches date pattern
   */
  private static isDateField(fieldName: string): boolean {
    return this.DATE_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName));
  }

  /**
   * Convert all date fields in object from UTC to local timezone
   * @param data - Object or array to convert
   * @param timezone - IANA timezone string
   * @param dateFields - Optional: specific field names to convert (overrides auto-detection)
   */
  static convertDatesToLocal<T>(
    data: T,
    timezone: string,
    dateFields?: string[],
  ): T {
    if (!data || timezone === "UTC") return data;

    // Handle array
    if (Array.isArray(data)) {
      return data.map((item) =>
        this.convertDatesToLocal(item, timezone, dateFields),
      ) as any;
    }

    // Handle object
    if (typeof data === "object" && data !== null) {
      const converted: any = { ...data };

      Object.keys(converted).forEach((key) => {
        const value = converted[key];

        // Check if this field should be converted
        const shouldConvert = dateFields
          ? dateFields.includes(key)
          : this.isDateField(key);

        if (shouldConvert && value) {
          // Convert date string or Date object
          if (typeof value === "string" || value instanceof Date) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                converted[key] = this.utcToLocal(date, timezone);
              }
            } catch (error) {
              // Skip invalid dates
            }
          }
        }
        // Recursively handle nested objects/arrays
        else if (typeof value === "object" && value !== null) {
          converted[key] = this.convertDatesToLocal(
            value,
            timezone,
            dateFields,
          );
        }
      });

      return converted;
    }

    return data;
  }

  /**
   * Parse date range từ message với timezone
   */
  static parseDateRangeFromMessage(
    message: string,
    timezone: string = "Asia/Ho_Chi_Minh",
  ): { start: Date; end: Date } | undefined {
    const lowerMessage = message.toLowerCase();
    const now = new Date();
    const userLocalTime = new Date(
      now.toLocaleString("en-US", { timeZone: timezone }),
    );

    // Tuần này (Monday - Sunday)
    if (
      lowerMessage.includes("tuần này") ||
      lowerMessage.includes("this week")
    ) {
      const currentDay = userLocalTime.getDay();
      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;

      const start = new Date(userLocalTime);
      start.setDate(userLocalTime.getDate() + daysToMonday);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      return {
        start: this.localToUTC(start, timezone),
        end: this.localToUTC(end, timezone),
      };
    }

    // Tháng này
    if (
      lowerMessage.includes("tháng này") ||
      lowerMessage.includes("this month")
    ) {
      const start = new Date(
        userLocalTime.getFullYear(),
        userLocalTime.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );
      const end = new Date(
        userLocalTime.getFullYear(),
        userLocalTime.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      return {
        start: this.localToUTC(start, timezone),
        end: this.localToUTC(end, timezone),
      };
    }

    // Hôm nay
    if (lowerMessage.includes("hôm nay") || lowerMessage.includes("today")) {
      const start = new Date(userLocalTime);
      start.setHours(0, 0, 0, 0);

      const end = new Date(userLocalTime);
      end.setHours(23, 59, 59, 999);

      return {
        start: this.localToUTC(start, timezone),
        end: this.localToUTC(end, timezone),
      };
    }

    // Hôm qua
    if (
      lowerMessage.includes("hôm qua") ||
      lowerMessage.includes("yesterday")
    ) {
      const yesterday = new Date(userLocalTime);
      yesterday.setDate(userLocalTime.getDate() - 1);

      const start = new Date(yesterday);
      start.setHours(0, 0, 0, 0);

      const end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);

      return {
        start: this.localToUTC(start, timezone),
        end: this.localToUTC(end, timezone),
      };
    }

    return undefined;
  }
}
