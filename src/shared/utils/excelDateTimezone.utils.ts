import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const DEFAULT_TZ = "Asia/Ho_Chi_Minh";

/**
 * Các trường ngày tháng trong Excel cần xử lý theo múi giờ Việt Nam
 * thay vì múi giờ mặc định của server (thường là UTC).
 *
 * Bài toán:
 *  - Server thường chạy ở UTC (+0)
 *  - Người dùng ở Việt Nam (+7)
 *  - Excel lưu ngày dưới dạng serial number (không kèm timezone)
 *  - ExcelJS quy đổi serial <-> Date dựa trên UTC ms
 *
 * Khi DB lưu `timestamptz` (vd `1990-01-15T07:00:00.000Z` tương ứng
 * `1990-01-15 14:00 giờ VN`), nếu truyền thẳng Date đó cho ExcelJS
 * thì serial sẽ lệch -> Excel hiển thị sai ngày.
 *
 * Utility này chuẩn hoá:
 *  - Export: lấy ngày theo múi giờ đích (mặc định VN), trả về Date ở
 *    midnight UTC của ngày đó để ExcelJS ghi serial chính xác.
 *  - Import: parse các định dạng ngày Việt Nam phổ biến
 *    (dd/mm/yyyy, yyyy-mm-dd, ...) theo múi giờ đích rồi trả về Date
 *    ở midnight UTC tương ứng.
 */

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function coerceToDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/**
 * Trả về "serial ngày" ở dạng Date ở midnight UTC tương ứng với ngày
 * (YYYY-MM-DD) khi nhìn từ múi giờ `tz`.
 *
 * Ví dụ: với `value = 1990-01-15T07:00:00.000Z` và `tz = Asia/Ho_Chi_Minh`,
 * ngày theo VN là 1990-01-15 -> kết quả là `1990-01-15T00:00:00.000Z`.
 * Nhờ vậy ExcelJS ghi serial 32874 và Excel hiển thị 15/01/1990.
 */
export function toExcelDateValue(
  value: unknown,
  tz: string = DEFAULT_TZ,
): Date | string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const date = coerceToDate(value);
  if (!date) return "";

  // Lấy ngày theo múi giờ đích rồi tạo Date ở midnight UTC.
  // Dùng Date.UTC trực tiếp để tránh phụ thuộc vào cách dayjs parse chuỗi.
  const day = dayjs(date).tz(tz);
  return new Date(
    Date.UTC(day.year(), day.month(), day.date(), 0, 0, 0, 0),
  );
}

/**
 * Ngược lại của `toExcelDateValue`: parse giá trị từ cell Excel (Date,
 * serial number, hoặc chuỗi ngày) và trả về Date ở midnight UTC tương
 * ứng với ngày theo múi giờ `tz`.
 *
 * - Nếu input là Date từ ExcelJS (đã ở midnight UTC của serial), giữ
 *   nguyên vì serial Excel luôn tương ứng với ngày calendar trong bất
 *   kỳ múi giờ nào (vd serial 32874 luôn là 15/01/1990 ở VN).
 * - Nếu input là số (serial thô): convert theo công thức của Excel.
 * - Nếu input là chuỗi dd/mm/yyyy: parse theo múi giờ đích.
 */
export function parseExcelDateValue(
  value: unknown,
  tz: string = DEFAULT_TZ,
): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (isValidDate(value)) {
    return value;
  }

  if (typeof value === "number") {
    // Công thức từ ExcelJS (utils.js):
    //   excelToDate(v) = new Date((v - 25569) * 86400000)
    // Trong đó 25569 là số ngày từ 1900-01-01 (epoch Excel) đến 1970-01-01
    // (Unix epoch). Do Excel có "fake leap day" ở serial 60, nên dùng 25569
    // (không trừ thêm) cho ra kết quả khớp với serial Excel cho mọi ngày
    // từ 1900-03-01 trở đi - vốn là phạm vi chúng ta quan tâm.
    const millisecondSinceEpoch = (value - 25569) * 24 * 60 * 60 * 1000;
    const parsed = new Date(millisecondSinceEpoch);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Thử parse theo dd/mm/yyyy trước (định dạng phổ biến ở VN)
    const slashParts = trimmed.split("/");
    if (slashParts.length === 3) {
      const [d, m, y] = slashParts;
      const day = Number(d);
      const month = Number(m);
      const year = Number(y);
      if (
        Number.isFinite(day) &&
        Number.isFinite(month) &&
        Number.isFinite(year) &&
        day >= 1 &&
        day <= 31 &&
        month >= 1 &&
        month <= 12
      ) {
        const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const parsed = dayjs.tz(iso, tz);
        if (parsed.isValid()) {
          return parsed.toDate();
        }
      }
    }

    // Thử parse theo yyyy-mm-dd
    const dashParts = trimmed.split("-");
    if (dashParts.length === 3) {
      const [y, m, d] = dashParts;
      const year = Number(y);
      const month = Number(m);
      const day = Number(d);
      if (
        Number.isFinite(year) &&
        Number.isFinite(month) &&
        Number.isFinite(day)
      ) {
        const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const parsed = dayjs.tz(iso, tz);
        if (parsed.isValid()) {
          return parsed.toDate();
        }
      }
    }

    // Fallback: parse tự do (ISO 8601 hoặc các định dạng khác)
    const direct = new Date(trimmed);
    if (!Number.isNaN(direct.getTime())) {
      return direct;
    }
  }

  return null;
}
