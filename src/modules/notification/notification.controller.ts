import { inject, injectable } from "inversify";
import { Request, Response, NextFunction } from "express";
import { NotificationService } from "./notification.service";
import { NOTIFICATION_TYPES } from "./notification.types";

@injectable()
export class NotificationController {
  constructor(
    @inject(NOTIFICATION_TYPES.NotificationService)
    private notificationService: NotificationService,
  ) {}

  send = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userIds, title, content, type, action, metadata } = req.body;
      await this.notificationService.createNotification(
        { title, content, type, action, metadata },
        userIds,
      );
      res.status(201).json({
        success: true,
        message: "Notification sent successfully",
        data: { recipientCount: new Set(userIds).size },
        statusCode: 201,
      });
    } catch (error) {
      next(error);
    }
  };
}
