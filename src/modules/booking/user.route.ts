import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { BookingController } from "./booking.controller";
import { BOOKING_TYPES } from "./booking.types";
import { BookingParamsSchema, BookingQuerySchema, CreateBookingSchema, UpdateBookingSchema } from "./booking.validator";

@injectable()
export class UserBookingRouter {
  private router: Router;

  constructor(
    @inject(BOOKING_TYPES.BookingController)
    private controller: BookingController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", zodValidate(BookingQuerySchema, "query"), this.controller.getAllWithPagination);
    this.router.post("/", zodValidate(CreateBookingSchema, "body"), this.controller.create);
    this.router.put("/:id/cancel", zodValidate(BookingParamsSchema, "params"), this.controller.cancel);
    this.router.put(
      "/:id",
      zodValidate(BookingParamsSchema, "params"),
      zodValidate(UpdateBookingSchema, "body"),
      this.controller.update,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
