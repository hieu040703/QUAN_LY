import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { UserPacket } from "@/database/models/UserPacket";
import { UserPacketService } from "./userPacket.service";
import { USER_PACKET_TYPES } from "./userPacket.types";
import { Request, Response, NextFunction } from "express";

@injectable()
export class UserPacketController extends BaseController<UserPacket> {
  protected service: UserPacketService;

  constructor(
    @inject(USER_PACKET_TYPES.UserPacketService)
    service: UserPacketService,
  ) {
    super();
    this.service = service;
  }

  getByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const userPackets = await this.service.findByUserId(userId);
      return res.status(userPackets.statusCode).json(userPackets);
    } catch (error) {
      next(error);
    }
  };
}
