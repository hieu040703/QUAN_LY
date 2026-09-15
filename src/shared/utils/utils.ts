import dayjs from "dayjs";
import { ErrorsMessages } from "../constants/errors";
import dns from "dns";
import { Attribute } from "@/database/models/Attribute";
import { DeepPartial } from "typeorm";
import { User } from "@/database/models/User";
import { UserSnapshot } from "../base/BaseEntity";

export class Utils {
  static ParseFloat(value: any): number {
    const parsedValue = parseFloat(value.toFixed(2));
    return parsedValue;
  }

  static ResponseError(
    field: string,
    message: keyof typeof ErrorsMessages,
    key?: string,
  ): { message: string; errors: string[] } {
    const errorMessage = key ? `${field}.${message}.${key}` : `${field}.${message}`;
    return {
      message: errorMessage,
      errors: [errorMessage],
    };
  }

  static isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === "string" && value.trim() === "") {
      return true;
    }
    if (Array.isArray(value) && value.length === 0) {
      return true;
    }
    if (typeof value === "object" && Object.keys(value).length === 0) {
      return true;
    }
    return false;
  }

  // chuyển đổi tiếng Việt có dấu sang không dấu
  static convertToUnSign(str: string): string {
    const unSignMap: { [key: string]: string } = {
      a: "á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ",
      e: "é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ",
      i: "í|ì|ỉ|ĩ|ị",
      o: "ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ",
      u: "ú|ù|ủ|ũ|ụ|ứ",
      y: "ý |ỳ |ỷ |ỹ |ỵ",
      d: "đ",
    };
    const regex = new RegExp(Object.values(unSignMap).join("|"), "g");
    return str
      .toLowerCase()
      .replace(regex, (match) => {
        for (const key in unSignMap) {
          if (unSignMap[key].includes(match)) {
            return key;
          }
        }
        return match; // fallback if no match found
      })
      .replace(/[^a-z0-9\s]/g, "") // remove special characters
      .replace(/\s+/g, " ") // replace multiple spaces with a single space
      .trim(); // trim leading and trailing spaces
  }

  // chuyển đổi tiếng Việt có dấu sang không dấu và thay khoảng trắng bằng dấu '_'
  static convertToUnSignWithUnderscore(str: string, char: string): string {
    return this.convertToUnSign(str).replace(/\s+/g, char);
  }

  // chuyển đổi tiếng Việt có dấu sang không dấu và đổi sang quy ước camelCase
  static convertToCamelCase(str: string): string {
    return this.convertToUnSign(str)
      .toLowerCase()
      .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
        if (+match === 0) return ""; // remove spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      });
  }

  static generateRandomString(length: number = 6): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  }

  static getIPAddressFromDdns(hostName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      dns.lookup(hostName, (err, address) => {
        if (err || !address) {
          resolve("Không thể lấy địa chỉ IP từ DDNS");
        } else {
          resolve(address);
        }
      });
    });
  }

  // Helper to detect array of objects with id
  static isArrayOfObjectsWithId(v: any): boolean {
    return Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0] !== null && "id" in v[0];
  }
}

/**
 * Tạo datetime ISO từ ngày + giờ
 * @param dateStr string dạng 'YYYY-MM-DD'
 * @param timeStr string dạng 'HH:mm:ss' hoặc ISO string
 */
export function combineDateAndTime(dateStr: Date | string, timeStr: Date | string): Date {
  const time = dayjs(timeStr); // nếu timeStr là '08:00:00', dayjs sẽ hiểu là hôm nay, lấy giờ/phút/giây
  return dayjs(dateStr).hour(time.hour()).minute(time.minute()).second(time.second()).millisecond(0).toDate();
}

/**
 * Kiểm tra xem hôm nay đã muộn hay chưa
 * @param timeStr string dạng 'HH:mm:ss' hoặc ISO string
 * @returns true nếu đã muộn, false nếu chưa muộn
 */
export function isOverdueCheck(timeStr?: Date | string | null, actualDate?: Date | string | null): boolean {
  const today = dayjs(actualDate);
  return today.startOf("day").isAfter(dayjs(timeStr).startOf("day"));
}

export function getUserSnapshot(user: User): UserSnapshot {
  return {
    id: user.id,
    code: user.code,
    username: user.username,
    name: user.name,
    type: user.type,
    isLeader: user.isLeader,
    messenger: user.messenger,
    zalo: user.zalo,
  };
}
