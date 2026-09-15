import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachClubIsMiddleware, clubPermissionMiddleware } from "@/shared/middleware/clubPermission.middleware";
import { BookingController } from "./booking.controller";
import { BOOKING_TYPES } from "./booking.types";
import { BookingParamsSchema, BookingQuerySchema, CreateBookingSchema } from "./booking.validator";

@injectable()
export class ManagerBookingRouter {
  private readonly router: Router;

  constructor(@inject(BOOKING_TYPES.BookingController) private readonly controller: BookingController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      clubPermissionMiddleware("booking", "read"),
      zodValidate(BookingQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );
    this.router.get("/stats/timeslots", clubPermissionMiddleware("booking", "read"), this.controller.getTimeslotStats);
    this.router.post(
      "/",
      clubPermissionMiddleware("booking", "create"),
      zodValidate(CreateBookingSchema, "body"),
      this.controller.create,
    );
    this.router.put(
      "/:id/confirm",
      clubPermissionMiddleware("booking", "approve", { verifyResourceClub: true }),
      zodValidate(BookingParamsSchema, "params"),
      this.controller.confirm,
    );
    this.router.put(
      "/:id/cancel",
      clubPermissionMiddleware("booking", "approve", { verifyResourceClub: true }),
      zodValidate(BookingParamsSchema, "params"),
      this.controller.cancel,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
