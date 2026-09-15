import { injectable, inject } from "inversify";
import { Request, Response, NextFunction } from "express";
import { BaseController } from "@/shared/base/BaseController";
import { Booking, BookingStatus } from "@/database/models/Booking";
import { BookingService } from "./booking.service";
import { BOOKING_TYPES } from "./booking.types";

@injectable()
export class BookingController extends BaseController<Booking> {
  protected service: BookingService;

  constructor(
    @inject(BOOKING_TYPES.BookingService)
    service: BookingService,
  ) {
    super();
    this.service = service;
  }
  getTimeslotStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clubId = req.query.clubId as string | undefined;
      const date = req.query.date as Date | undefined;
      const data = await this.service.getTimeslotStats(clubId, date);
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: "OK",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  confirm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const service = await this.service.updateStatusBooking(id, BookingStatus.CONFIRMED);
      return res.status(service.statusCode).json(service);
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const service = await this.service.updateStatusBooking(id, BookingStatus.CANCELED);
      return res.status(service.statusCode).json(service);
    } catch (error) {
      next(error);
    }
  };
}
