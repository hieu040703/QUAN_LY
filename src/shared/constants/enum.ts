export enum Provider {
  GOOGLE = "google",
  FACEBOOK = "facebook",
  APPLE = "apple",
  YAHOO = "yahoo",
}

export enum FileEntityType {
  USER = "user",
  CLUB = "club",
}

export const VAT_CATEGORY_NAME = "Nộp thuế VAT";
export const INCOME_SALE_CATEGORY_NAME = "Thu tiền khách hàng";
export const DEPOSIT_SALE_CATEGORY_NAME = "Nhận cọc khách hàng";
export const INCOME_PURCHASE_CATEGORY_NAME = "NCC hoàn tiền";
export const EXPENSE_PURCHASE_CATEGORY_NAME = "Trả tiền NCC";

export enum IdentificationTypeEnum {
  CCCD = "CCCD",
  CMND = "CMND",
  HC = "HC",
  OTHER = "Khác",
}

export enum IdentityTypeEnum {
  CCCD = "CCCD",
  CMND = "CMND",
  HC = "HC",
  OTHER = "Khác",
}

export enum GenderEnum {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum DobFormatEnum {
  DD_MM_YYYY = 0, // 0 - Đầy đủ
  MM_YYYY = 1, // 1 - Chỉ tháng và năm
  YYYY = 2, // 2 - Chỉ năm
}

export enum FileType {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
  AUDIO = "audio",
  OTHER = "other",
}

export enum FileCategory {
  AVATAR = "avatar",
  RECEIPT = "receipt",
  ATTACHMENT = "attachment",
  DOCUMENT = "document",
  LOGO = "logo",
  IMAGE = "image",
  VIDEO = "video",
  ALBUM = "album",
  MEDIA = "media",
  BANNER = "banner",
}

export enum FileStatus {
  PENDING = "pending",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export enum DiscountTypeEnum {
  AMOUNT = "amount",
  PERCENT = "percent",
}

export enum VisitType {
  INITIAL = "initial", // Khám mới (Lần đầu hoặc khám bệnh mới hoàn toàn)
  FOLLOW_UP = "followUp", // Tái khám (Theo phác đồ hoặc hẹn gặp lại)
}

export enum AppointmentStatus {
  PENDING = "PENDING", // Chờ Admin duyệt
  CONFIRMED = "CONFIRMED", // Đã duyệt (Bệnh nhân có lịch hẹn chính thức)

  // --- Giai đoạn Tại phòng khám (Thực tế) ---
  WAITING = "WAITING", // Bệnh nhân đã đến, đang ngồi phòng chờ
  EXAMINING = "EXAMINING", // Bác sĩ đang khám trong phòng
  COMPLETED = "COMPLETED", // Đã khám xong (Sinh ra đơn thuốc / cập nhật phác đồ)

  // --- Hủy bỏ ---
  CANCELLED = "CANCELLED",
}

export enum BookingType {
  MANUAL = "manual", // Đặt lịch thủ công (Admin tạo)
  AUTOMATIC = "automatic", // Đặt lịch tự động (Hệ thống tạo)
}

export enum FundTypeEnum {
  CASH = "cash",
  BANK = "bank",
}

export enum FundTransactionTypeEnum {
  INCREASE = "increase",
  DECREASE = "decrease",
}

export enum FundTransactionRefTypeEnum {
  INCOME = "income",
  EXPENSE = "expense",
  TRANSFER = "transfer",
  ADJUSTMENT = "adjustment",
  MEDICAL_EXAMINATION_LINE = "medical_examination_line", // Phiếu khám
}

export enum InventoryDocumentStatusEnum {
  PENDING = "PENDING", // Đơn hàng đã tạo nhưng chưa đặt hàng (chưa gửi yêu cầu đến nhà cung cấp)
  COMPLETED = "COMPLETED", // Đơn hàng đã hoàn tất (đã nhận hàng đầy đủ)
  CANCELLED = "CANCELLED", // Đơn hàng đã bị hủy (không còn hiệu lực)
}

export enum InventoryTransactionTypeEnum {
  IMPORT = "IMPORT", // Nhập kho (tăng tồn)
  EXPORT = "EXPORT", // Xuất kho (giảm tồn)
}

export enum InventoryTransactionRefTypeEnum {
  TRANSFER = "transfer",
  ADJUST = "adjust",
  IN = "in",
  OUT = "out",
  OPENING_BALANCE = "opening_balance",
  PRESCRIPTION = "prescription",
}
