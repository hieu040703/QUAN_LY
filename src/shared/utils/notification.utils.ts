import { ActionTypeEnum, NotificationTypeEnum } from "@/database/models/Notification";
import logger from "./logger";

type NotificationContentKey = `${NotificationTypeEnum}.${ActionTypeEnum}`;

const titleMap: Partial<Record<NotificationTypeEnum, Partial<Record<ActionTypeEnum, string>>>> = {
  [NotificationTypeEnum.LISTING]: {
    [ActionTypeEnum.CREATED]: "Tin đăng đã được tạo",
    [ActionTypeEnum.APPROVED]: "Tin đăng đã được duyệt",
    [ActionTypeEnum.REJECTED]: "Tin đăng bị từ chối",
  },
  [NotificationTypeEnum.INQUIRY]: {
    [ActionTypeEnum.CREATED]: "Có yêu cầu liên hệ mới",
    [ActionTypeEnum.UPDATED]: "Yêu cầu liên hệ đã được cập nhật",
  },
  [NotificationTypeEnum.CONTRACT]: {
    [ActionTypeEnum.CREATED]: "Hợp đồng thuê mới",
    [ActionTypeEnum.UPDATED]: "Hợp đồng thuê đã được cập nhật",
  },
  [NotificationTypeEnum.INVOICE]: {
    [ActionTypeEnum.CREATED]: "Hóa đơn tiền trọ mới",
    [ActionTypeEnum.DUE]: "Hóa đơn sắp đến hạn",
  },
  [NotificationTypeEnum.PAYMENT]: {
    [ActionTypeEnum.PAID]: "Thanh toán đã được ghi nhận",
  },
  [NotificationTypeEnum.SYSTEM]: {
    [ActionTypeEnum.NOTIFICATION]: "Thông báo hệ thống",
  },
};

const contentMap: Partial<Record<NotificationContentKey, string>> = {
  [`${NotificationTypeEnum.LISTING}.${ActionTypeEnum.CREATED}`]: "Tin đăng ${} đã được tạo",
  [`${NotificationTypeEnum.LISTING}.${ActionTypeEnum.APPROVED}`]: "Tin đăng ${} đã được duyệt",
  [`${NotificationTypeEnum.LISTING}.${ActionTypeEnum.REJECTED}`]: "Tin đăng ${} bị từ chối",
  [`${NotificationTypeEnum.INQUIRY}.${ActionTypeEnum.CREATED}`]: "Có yêu cầu liên hệ mới cho tin ${}",
  [`${NotificationTypeEnum.INQUIRY}.${ActionTypeEnum.UPDATED}`]: "Yêu cầu liên hệ cho tin ${} đã được cập nhật",
  [`${NotificationTypeEnum.CONTRACT}.${ActionTypeEnum.CREATED}`]: "Hợp đồng thuê ${} đã được tạo",
  [`${NotificationTypeEnum.CONTRACT}.${ActionTypeEnum.UPDATED}`]: "Hợp đồng thuê ${} đã được cập nhật",
  [`${NotificationTypeEnum.INVOICE}.${ActionTypeEnum.CREATED}`]: "Hóa đơn ${} đã được tạo",
  [`${NotificationTypeEnum.INVOICE}.${ActionTypeEnum.DUE}`]: "Hóa đơn ${} sắp đến hạn",
  [`${NotificationTypeEnum.PAYMENT}.${ActionTypeEnum.PAID}`]: "Thanh toán hóa đơn ${} đã được ghi nhận",
};

export const getNotificationData = (
  data: any,
  type: NotificationTypeEnum,
  action: ActionTypeEnum,
) => {
  try {
    const title = titleMap[type]?.[action] || "Thông báo hệ thống";
    const content = contentMap[`${type}.${action}`] || data?.content || title;
    const highlightValues = [data?.title || data?.code || data?.name || data?.id].filter(
      (value) => value !== undefined && value !== null,
    );

    return {
      title: data?.title || title,
      content: mapHighlightValues(content, highlightValues),
      metadata: { highlightValues, data },
      oId: data?.id || null,
      type,
      action,
    };
  } catch (error) {
    logger.error("Error generating notification data:", error);
    throw error;
  }
};

export const mapHighlightValues = (content: string, highlightValues: any[] = []): string => {
  if (!content) return content;
  let index = 0;
  return content.replace(/\$\{\}/g, () => {
    const value = highlightValues[index++];
    return value === undefined || value === null ? "" : String(value);
  });
};
