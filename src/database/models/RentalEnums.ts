// Trạng thái hoạt động của khu trọ.
export enum PropertyStatus {
  ACTIVE = "active", // Khu trọ đang được sử dụng.
  INACTIVE = "inactive", // Khu trọ tạm ngừng sử dụng.
}

// Trạng thái hiện tại của phòng.
export enum RoomStatus {
  AVAILABLE = "available", // Phòng đang trống.
  RESERVED = "reserved", // Phòng đã được giữ chỗ.
  OCCUPIED = "occupied", // Phòng đang có người thuê.
  MAINTENANCE = "maintenance", // Phòng đang sửa chữa.
  INACTIVE = "inactive", // Phòng không còn kinh doanh.
}

// Mục đích của tin đăng.
export enum ListingType {
  RENT = "rent", // Tin cho thuê.
  SALE = "sale", // Tin bán.
}

// Trạng thái duyệt và hiển thị tin đăng.
export enum ListingStatus {
  DRAFT = "draft", // Tin đang soạn.
  PENDING = "pending", // Chờ duyệt.
  PUBLISHED = "published", // Đang hiển thị.
  REJECTED = "rejected", // Bị từ chối.
  EXPIRED = "expired", // Đã hết hạn.
  CLOSED = "closed", // Đã đóng tin.
}

// Trạng thái yêu cầu liên hệ.
export enum InquiryStatus {
  NEW = "new", // Yêu cầu mới.
  CONTACTED = "contacted", // Đã liên hệ.
  CLOSED = "closed", // Đã xử lý xong.
}

// Trạng thái lịch hẹn xem phòng.
export enum ViewingAppointmentStatus {
  PENDING = "pending", // Chờ xác nhận.
  CONFIRMED = "confirmed", // Đã xác nhận.
  COMPLETED = "completed", // Đã xem phòng.
  CANCELLED = "cancelled", // Đã hủy.
}

// Trạng thái hợp đồng thuê.
export enum ContractStatus {
  DRAFT = "draft", // Hợp đồng đang soạn.
  ACTIVE = "active", // Hợp đồng đang có hiệu lực.
  EXPIRED = "expired", // Hợp đồng hết hạn.
  TERMINATED = "terminated", // Hợp đồng chấm dứt trước hạn.
}

// Cách tính phí dịch vụ.
export enum FeeCalculationType {
  FIXED = "fixed", // Tính cố định mỗi kỳ.
  PER_UNIT = "per_unit", // Tính theo số lượng sử dụng.
  PER_PERSON = "per_person", // Tính theo số người.
}

// Loại chỉ số tiện ích.
export enum UtilityType {
  ELECTRICITY = "electricity", // Điện.
  WATER = "water", // Nước.
}

// Trạng thái hóa đơn.
export enum InvoiceStatus {
  DRAFT = "draft", // Hóa đơn đang soạn.
  ISSUED = "issued", // Đã phát hành.
  PARTIAL = "partial", // Đã thanh toán một phần.
  PAID = "paid", // Đã thanh toán đủ.
  OVERDUE = "overdue", // Đã quá hạn.
  CANCELLED = "cancelled", // Đã hủy.
}

// Phương thức thanh toán.
export enum PaymentMethod {
  CASH = "cash", // Tiền mặt.
  BANK_TRANSFER = "bank_transfer", // Chuyển khoản.
  ONLINE = "online", // Cổng thanh toán trực tuyến.
}

// Trạng thái giao dịch thanh toán.
export enum PaymentStatus {
  PENDING = "pending", // Chờ xử lý.
  COMPLETED = "completed", // Thanh toán thành công.
  FAILED = "failed", // Thanh toán thất bại.
  REFUNDED = "refunded", // Đã hoàn tiền.
}
