import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { Chat, ConversationTypeEnum } from "@/database/models/Chat";
import { ChatService } from "./chat.service";
import { CHAT_TYPES } from "./chat.types";
import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "@/shared/types/errors";
import DatabaseConfig from "@/config/database";
import { Booking } from "@/database/models/Booking";
import { CheckIn } from "@/database/models/CheckIn";

@injectable()
export class ChatController extends BaseController<Chat> {
  protected service: ChatService;

  constructor(
    @inject(CHAT_TYPES.ChatService)
    service: ChatService,
  ) {
    super();
    this.service = service;
  }
  markBookingMessagesSeen = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userContext?.userId || req.user?.userId;
      if (!userId) throw new BadRequestError("Chưa xác định được người dùng");

      const refId = req.body.refId || req.body.bookingId;
      const data = await this.service.markMessagesSeen(refId, userId);
      return res.json({
        success: true,
        data,
        message: "Đã cập nhật thời gian xem tin nhắn",
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllWithPagination = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query;
      const result = await this.service.findAllWithPagination(query);
      const type = query.type as ConversationTypeEnum;
      const userId = req.userContext?.userId || req.user?.userId;
      const unreadMessageCount = userId
        ? await this.service.getUnreadMessageCount(query.refId as string, type, userId)
        : 0;
      const repo = DatabaseConfig.manager;
      const moreData = await repo
        .getRepository(type === "booking" ? Booking : CheckIn)
        .findOne({ where: { id: query.refId as string } });

      return res
        .status(result.statusCode)
        .json({ ...result, data: result.data.reverse(), moreData, unreadMessageCount });
    } catch (error) {
      next(error);
    }
  };
}
