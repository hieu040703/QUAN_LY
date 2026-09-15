// Smoke test: kiểm tra logic chuyển đổi ngày tháng Excel theo múi giờ VN.
// Chạy: npx ts-node scripts/test-excel-date-tz.ts
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  toExcelDateValue,
  parseExcelDateValue,
} from "../src/shared/utils/excelDateTimezone.utils";

dayjs.extend(utc);
dayjs.extend(timezone);

function assert(label: string, actual: unknown, expected: unknown) {
  const actualStr = actual instanceof Date ? actual.toISOString() : String(actual);
  const expectedStr = expected instanceof Date ? expected.toISOString() : String(expected);
  const ok = actualStr === expectedStr;
  console.log(`${ok ? "✅" : "❌"} ${label}`);
  console.log(`   actual:   ${actualStr}`);
  console.log(`   expected: ${expectedStr}`);
  if (!ok) process.exitCode = 1;
}

console.log("=== toExcelDateValue (export DB -> Excel) ===");

// Trường hợp 1: Date ở midnight UTC -> trả về y nguyên
assert(
  "Date midnight UTC -> midnight UTC của cùng ngày",
  toExcelDateValue(new Date("1990-01-15T00:00:00.000Z")),
  new Date("1990-01-15T00:00:00.000Z"),
);

// Trường hợp 2: Date có giờ VN (vd 14:00 VN = 07:00 UTC) -> vẫn ra 15/01 theo VN
assert(
  "Date 14:00 VN (07:00 UTC) -> midnight UTC của 15/01 theo VN",
  toExcelDateValue(new Date("1990-01-15T07:00:00.000Z")),
  new Date("1990-01-15T00:00:00.000Z"),
);

// Trường hợp 3: Date ở cuối ngày UTC (vd 23:00 UTC = 06:00 sáng hôm sau VN)
// ExcelJS sẽ ghi serial phần thập phân, ngày hiển thị vẫn là 15/01 theo VN
assert(
  "Date 23:00 UTC = 06:00 sáng 16/01 VN -> midnight UTC của 16/01 theo VN",
  toExcelDateValue(new Date("1990-01-15T23:00:00.000Z")),
  new Date("1990-01-16T00:00:00.000Z"),
);

// Trường hợp 4: Chuỗi ISO -> parse rồi chuẩn hoá
assert(
  "Chuỗi '1990-01-15T07:00:00.000Z' -> midnight UTC của 15/01 VN",
  toExcelDateValue("1990-01-15T07:00:00.000Z"),
  new Date("1990-01-15T00:00:00.000Z"),
);

// Trường hợp 5: null/undefined/'' -> chuỗi rỗng
assert("null -> ''", toExcelDateValue(null), "");
assert("undefined -> ''", toExcelDateValue(undefined), "");
assert("'' -> ''", toExcelDateValue(""), "");

console.log("\n=== parseExcelDateValue (import Excel -> DB) ===");

// Trường hợp 1: ExcelJS trả về Date ở midnight UTC
assert(
  "Date từ ExcelJS (midnight UTC) -> giữ nguyên",
  parseExcelDateValue(new Date("1990-01-15T00:00:00.000Z")),
  new Date("1990-01-15T00:00:00.000Z"),
);

// Trường hợp 2: Serial number 32874 (= 15/01/1990) -> midnight UTC
assert(
  "Serial 32874 -> Date midnight UTC 15/01/1990",
  parseExcelDateValue(32874),
  new Date("1990-01-15T00:00:00.000Z"),
);

// Trường hợp 3: Chuỗi dd/mm/yyyy
assert(
  "Chuỗi '15/01/1990' -> Date midnight UTC 15/01/1990",
  parseExcelDateValue("15/01/1990"),
  new Date("1990-01-14T17:00:00.000Z"), // midnight VN = 17:00 hôm trước UTC
);

// Trường hợp 4: Chuỗi yyyy-mm-dd
assert(
  "Chuỗi '1990-01-15' -> Date midnight UTC 15/01/1990",
  parseExcelDateValue("1990-01-15"),
  new Date("1990-01-14T17:00:00.000Z"),
);

// Trường hợp 5: null/undefined/'' -> null
assert("null -> null", parseExcelDateValue(null), null);
assert("undefined -> null", parseExcelDateValue(undefined), null);
assert("'' -> null", parseExcelDateValue(""), null);

// Trường hợp 6: Chuỗi ISO 8601
assert(
  "Chuỗi ISO '1990-01-15T00:00:00.000Z' -> Date y nguyên",
  parseExcelDateValue("1990-01-15T00:00:00.000Z"),
  new Date("1990-01-15T00:00:00.000Z"),
);

console.log("\n=== Round-trip kiểm tra (Date -> Excel serial -> Date) ===");

// Mô phỏng: lưu Date vào DB, đọc ra, ghi Excel, đọc lại Excel
const original = new Date("1990-01-14T17:00:00.000Z"); // 15/01/1990 midnight VN
const exported = toExcelDateValue(original);
console.log("Date gốc (15/01/1990 VN):", original.toISOString());
console.log("Date sau khi export (chuẩn hoá):", (exported as Date).toISOString());

// Tính serial mà ExcelJS sẽ ghi (công thức dateToExcel)
const serial = 25569 + ((exported as Date).getTime() / (24 * 3600 * 1000));
console.log("Serial Excel sẽ ghi:", serial);
assert("Serial đúng là 32874 (= 15/01/1990)", serial, 32874);

// Đọc lại từ serial
const reimported = parseExcelDateValue(serial);
assert("Đọc lại từ serial -> Date midnight UTC", reimported, new Date("1990-01-15T00:00:00.000Z"));

// Xuất lại lần nữa phải ra cùng serial
const reExported = toExcelDateValue(reimported!);
const serial2 = 25569 + ((reExported as Date).getTime() / (24 * 3600 * 1000));
assert("Round-trip ổn định (cùng serial)", serial2, 32874);

console.log("\n=== Test xong ===");
