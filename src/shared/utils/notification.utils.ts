import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { config } from "@/config/env";
import { ActionTypeEnum, NotificationTypeEnum } from "@/database/models/Notification";
import logger from "./logger";

dayjs.extend(utc);
dayjs.extend(timezone);

const DAY_HOUR_FORMAT = "DD/MM/YY HH:mm";

const formatDateValue = (value: any): any => {
  if (value === null || value === undefined || value === "") return value;
  const tz = config.DEFAULT_TIMEZONE || "Asia/Ho_Chi_Minh";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;
  return parsed.tz(tz).format(DAY_HOUR_FORMAT);
};

type NotificationContentKey = `${NotificationTypeEnum}.${ActionTypeEnum}`;

type NotificationContent = {
  [key in NotificationContentKey]?: string;
};

const NotificationTitleMap: Partial<Record<NotificationTypeEnum, Partial<Record<ActionTypeEnum, string>>>> = {
  [NotificationTypeEnum.BOOKING]: {
    [ActionTypeEnum.BOOKING_PENDING]: "Có lịch đặt mới",
    [ActionTypeEnum.BOOKING_CONFIRMED]: "Lịch đặt đã được xác nhận",
    [ActionTypeEnum.BOOKING_CANCEL]: "Lịch đặt đã bị hủy",
  },

  [NotificationTypeEnum.CLUB_MEMBER]: {
    [ActionTypeEnum.MEMBER_ACTIVE]: "Tham gia CLB thành công",
    [ActionTypeEnum.MEMBER_BLOCK]: "Bị chặn CLB",
    [ActionTypeEnum.MEMBER_OUT]: "Thành viên rời CLB",
    [ActionTypeEnum.MEMBER_PENDING]: "Có yêu cầu tham gia CLB",
  },

  [NotificationTypeEnum.CHECK_IN]: {
    [ActionTypeEnum.SUCCESS]: "Check-in thành công",
    [ActionTypeEnum.COLLECTED]: "Đã thu tiền check-in",
    [ActionTypeEnum.FAILED]: "Check-in thất bại",
    [ActionTypeEnum.QUOTA_EXCEEDED]: "Đã hết lượt check-in",
    [ActionTypeEnum.PACKET_EXPIRED]: "Gói tập đã hết hạn",
    [ActionTypeEnum.QUOTA_LOW]: "Sắp hết lượt check-in",
    [ActionTypeEnum.NO_BOOKING]: "Check-in không có lịch đặt trước",
    [ActionTypeEnum.OUT_OF_SLOT]: "Check-in ngoài khung giờ đã đặt",
  },

  [NotificationTypeEnum.CLUB]: {
    [ActionTypeEnum.OPENING_DAY]: "Câu lạc bộ mới khai trương",
    [ActionTypeEnum.CLOSED]: "Câu lạc bộ tạm ngừng hoạt động",
    [ActionTypeEnum.REOPENED]: "Câu lạc bộ hoạt động trở lại",
    [ActionTypeEnum.LEADER_CHANGED]: "Câu lạc bộ đã đổi quản lý",
    [ActionTypeEnum.INFO_UPDATED]: "Thông tin câu lạc bộ được cập nhật",
    [ActionTypeEnum.SCHEDULE_UPDATED]: "Lịch hoạt động câu lạc bộ đã thay đổi",
    [ActionTypeEnum.CAPACITY_FULL]: "Câu lạc bộ đã đạt giới hạn hội viên",
  },

  [NotificationTypeEnum.USER_PACKET]: {
    [ActionTypeEnum.SUCCESS]: "Đăng ký mua gói tập thành công",
    [ActionTypeEnum.PACKET_EXPIRING]: "Gói tập sắp hết hạn",
    [ActionTypeEnum.PACKET_EXPIRED]: "Gói tập đã hết hạn",
    [ActionTypeEnum.PACKET_LOW_QUOTA]: "Gói tập sắp hết lượt sử dụng",
  },
};

const notificationContent: NotificationContent = {
  [`${NotificationTypeEnum.BOOKING}.${ActionTypeEnum.BOOKING_PENDING}`]:
    "Hội viên ${} đã đặt lịch chơi tại ${} của bạn lúc ${}",
  [`${NotificationTypeEnum.BOOKING}.${ActionTypeEnum.BOOKING_CONFIRMED}`]:
    "Lịch đặt chơi của bạn tại ${} vào lúc ${} đã được xác nhận",
  [`${NotificationTypeEnum.BOOKING}.${ActionTypeEnum.BOOKING_CANCEL}`]:
    "Hội viên ${} đã hủy lịch đặt chơi tại ${} của bạn lúc ${}",

  [`${NotificationTypeEnum.CLUB_MEMBER}.${ActionTypeEnum.MEMBER_ACTIVE}`]:
    "Yêu cầu tham gia ${} của bạn đã được phê duyệt",
  [`${NotificationTypeEnum.CLUB_MEMBER}.${ActionTypeEnum.MEMBER_BLOCK}`]: "Bạn đã bị chặn tại ${}",
  [`${NotificationTypeEnum.CLUB_MEMBER}.${ActionTypeEnum.MEMBER_OUT}`]: "Thành viên ${} đã rời khỏi ${}",
  [`${NotificationTypeEnum.CLUB_MEMBER}.${ActionTypeEnum.MEMBER_PENDING}`]:
    "Thành viên ${} vừa yêu cầu tham gia ${} của bạn",

  [`${NotificationTypeEnum.CHECK_IN}.${ActionTypeEnum.SUCCESS}`]: "Bạn đã check-in thành công tại ${} ngày ${}",
  [`${NotificationTypeEnum.CHECK_IN}.${ActionTypeEnum.COLLECTED}`]:
    "Hội viên ${} đã sử dụng gói ${} tại ${}; số tiền ${} đã được thu",
  [`${NotificationTypeEnum.CHECK_IN}.${ActionTypeEnum.FAILED}`]: "Check-in của bạn tại ${} lúc ${} không thành công",
  [`${NotificationTypeEnum.CHECK_IN}.${ActionTypeEnum.QUOTA_EXCEEDED}`]:
    "Gói tập của bạn đã hết lượt, vui lòng gia hạn để tiếp tục check-in",
  [`${NotificationTypeEnum.CHECK_IN}.${ActionTypeEnum.PACKET_EXPIRED}`]:
    "Gói tập của bạn đã hết hạn, vui lòng gia hạn để tiếp tục sử dụng",
  [`${NotificationTypeEnum.CHECK_IN}.${ActionTypeEnum.QUOTA_LOW}`]:
    "Gói tập của bạn sắp hết lượt check-in, hãy cân nhắc gia hạn sớm",
  [`${NotificationTypeEnum.CHECK_IN}.${ActionTypeEnum.NO_BOOKING}`]:
    "Bạn đã check-in tại ${} lúc ${} mà không có lịch đặt trước",
  [`${NotificationTypeEnum.CHECK_IN}.${ActionTypeEnum.OUT_OF_SLOT}`]:
    "Bạn đã check-in tại ${} lúc ${}, ngoài khung giờ đã đặt",

  [`${NotificationTypeEnum.CLUB}.${ActionTypeEnum.OPENING_DAY}`]:
    "${} vừa chính thức khai trương ngày hôm nay, cùng khám phá ngay!",
  [`${NotificationTypeEnum.CLUB}.${ActionTypeEnum.CLOSED}`]:
    "${} tạm ngừng hoạt động, vui lòng theo dõi thông báo tiếp theo",
  [`${NotificationTypeEnum.CLUB}.${ActionTypeEnum.REOPENED}`]: "${} đã hoạt động trở lại, hẹn gặp lại bạn",
  [`${NotificationTypeEnum.CLUB}.${ActionTypeEnum.LEADER_CHANGED}`]: "${} vừa thay đổi quản lý, xem chi tiết tại đây",
  [`${NotificationTypeEnum.CLUB}.${ActionTypeEnum.INFO_UPDATED}`]: "${} vừa được cập nhật thông tin",
  [`${NotificationTypeEnum.CLUB}.${ActionTypeEnum.SCHEDULE_UPDATED}`]:
    "Lịch hoạt động của ${} vừa có thay đổi, kiểm tra ngay để không bỏ lỡ",
  [`${NotificationTypeEnum.CLUB}.${ActionTypeEnum.CAPACITY_FULL}`]:
    "${} đã đạt giới hạn hội viên, tạm dừng nhận đăng ký mới",
  [`${NotificationTypeEnum.CLUB}.${ActionTypeEnum.LEADER_ASSIGNED}`]: "${} vừa được thành lập",

  [`${NotificationTypeEnum.USER_PACKET}.${ActionTypeEnum.SUCCESS}`]: "Bạn đã đăng ký thành công gói ${} tại ${}",
  [`${NotificationTypeEnum.USER_PACKET}.${ActionTypeEnum.PACKET_EXPIRING}`]:
    "Gói ${} của bạn sẽ hết hạn vào ${}, hãy gia hạn để tiếp tục sử dụng",
  [`${NotificationTypeEnum.USER_PACKET}.${ActionTypeEnum.PACKET_EXPIRED}`]:
    "Gói ${} của bạn đã hết hạn, vui lòng gia hạn để tiếp tục tập luyện",
  [`${NotificationTypeEnum.USER_PACKET}.${ActionTypeEnum.PACKET_LOW_QUOTA}`]:
    "Gói ${} của bạn chỉ còn ${} lượt sử dụng, hãy cân nhắc gia hạn sớm",
};

export const getNotificationData = (data: any, type: NotificationTypeEnum, action: ActionTypeEnum) => {
  try {
    const highlightValueMap: any = {
      [NotificationTypeEnum.BOOKING]: {
        [ActionTypeEnum.BOOKING_PENDING]: [data.name, data.clubName, formatDateValue(data.timeAt)],
        [ActionTypeEnum.BOOKING_CONFIRMED]: [data.clubName, formatDateValue(data.timeAt)],
        [ActionTypeEnum.BOOKING_CANCEL]: [data.name, data.clubName, formatDateValue(data.timeAt)],
      },

      [NotificationTypeEnum.CLUB_MEMBER]: {
        [ActionTypeEnum.MEMBER_ACTIVE]: [data.clubName],
        [ActionTypeEnum.MEMBER_BLOCK]: [data.clubName],
        [ActionTypeEnum.MEMBER_OUT]: [data.name, data.clubName],
        [ActionTypeEnum.MEMBER_PENDING]: [data.name, data.clubName],
      },

      [NotificationTypeEnum.CHECK_IN]: {
        [ActionTypeEnum.SUCCESS]: [data.clubName, formatDateValue(data.timeAt)],
        [ActionTypeEnum.COLLECTED]: [data.userName, data.packetName, data.clubName, data.amount],
        [ActionTypeEnum.FAILED]: [data.clubName, formatDateValue(data.timeAt)],
        [ActionTypeEnum.NO_BOOKING]: [data.clubName, formatDateValue(data.timeAt)],
        [ActionTypeEnum.OUT_OF_SLOT]: [data.clubName, formatDateValue(data.timeAt)],
        // QUOTA_EXCEEDED, PACKET_EXPIRED, QUOTA_LOW: không có placeholder → không cần entry
      },

      [NotificationTypeEnum.CLUB]: {
        [ActionTypeEnum.OPENING_DAY]: [data.clubName],
        [ActionTypeEnum.CLOSED]: [data.clubName],
        [ActionTypeEnum.REOPENED]: [data.clubName],
        [ActionTypeEnum.LEADER_CHANGED]: [data.clubName],
        [ActionTypeEnum.INFO_UPDATED]: [data.clubName],
        [ActionTypeEnum.SCHEDULE_UPDATED]: [data.clubName],
        [ActionTypeEnum.CAPACITY_FULL]: [data.clubName],
        [ActionTypeEnum.LEADER_ASSIGNED]: [data.clubName],
      },

      [NotificationTypeEnum.USER_PACKET]: {
        [ActionTypeEnum.SUCCESS]: [data.packetName, data.clubName],
        [ActionTypeEnum.PACKET_EXPIRING]: [data.packetName, formatDateValue(data.expiredAt)],
        [ActionTypeEnum.PACKET_EXPIRED]: [data.packetName],
        [ActionTypeEnum.PACKET_LOW_QUOTA]: [data.packetName, data.remainingQuota],
      },
    };

    let content = getNotificationContent(type, action) + (data?.plannedEndDate ? " Hạn hoàn thành: ${}" : "");

    return {
      title: NotificationTitleMap[type]?.[action] || "Thông báo hệ thống",
      content,
      metadata: {
        highlightValues: highlightValueMap[type]?.[action] || highlightValueMap[type] || [],
        data,
      },
      oId: data?.id || null,
      type,
      action,
    };
  } catch (error) {
    logger.error("Error generating notification data:", error);
    throw error;
  }
};

const getNotificationContent = (type: NotificationTypeEnum, action: ActionTypeEnum): string => {
  return notificationContent[`${type}.${action}`] || "";
};

/**
 * Thay thế lần lượt các placeholder `${}` trong content bằng các giá trị highlightValues.
 * VD: content = "Khách hàng ${} đã đến khám", highlightValues = ["Nguyễn Văn A"]
 *   → "Khách hàng Nguyễn Văn A đã đến khám"
 */
export const mapHighlightValues = (content: string, highlightValues: any[] = []): string => {
  if (!content) return content;
  let index = 0;
  return content.replace(/\$\{\}/g, () => {
    const value = highlightValues[index];
    index += 1;
    return value !== undefined && value !== null ? String(value) : "";
  });
};
