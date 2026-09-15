import { z } from "zod";
import { ActionTypeEnum, NotificationTypeEnum } from "@/database/models/Notification";

export const SendNotificationSchema = z.object({
  userIds: z.array(z.uuid()).min(1).max(500),
  title: z.string().trim().min(1).max(255),
  content: z.string().trim().min(1),
  type: z.enum(NotificationTypeEnum).default(NotificationTypeEnum.SYSTEM),
  action: z.enum(ActionTypeEnum).default(ActionTypeEnum.NOTIFICATION),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SendNotificationDto = z.infer<typeof SendNotificationSchema>;
