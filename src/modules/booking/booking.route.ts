import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { BookingController } from "./booking.controller";
import { BOOKING_TYPES } from "./booking.types";
import { BookingParamsSchema, BookingQuerySchema, CreateBookingSchema, UpdateBookingSchema } from "./booking.validator";
import { attachUserIdFromAuth } from "@/shared/middleware/userId.middleware";

@injectable()
export class BookingRouter {
  private router: Router;

  constructor(
    @inject(BOOKING_TYPES.BookingController)
    private controller: BookingController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(BookingQuerySchema, "query"),
      attachUserIdFromAuth("booking", "read", "query", { attachUserIdWhenHasPermission: false }),
      this.controller.getAllWithPagination,
    );
    this.router.get("/stats/timeslots", permissionMiddleware("booking", "read"), this.controller.getTimeslotStats);
    this.router.post(
      "/",
      zodValidate(CreateBookingSchema, "body"),
      permissionMiddleware("booking", "create"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(BookingParamsSchema, "params"),
      permissionMiddleware("booking", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id/confirm",
      zodValidate(BookingParamsSchema, "params"),
      permissionMiddleware("booking", "approve"),
      this.controller.confirm,
    );
    this.router.put(
      "/:id/cancel",
      zodValidate(BookingParamsSchema, "params"),
      permissionMiddleware("booking", "approve"),
      this.controller.cancel,
    );
    this.router.put(
      "/:id",
      zodValidate(BookingParamsSchema, "params"),
      zodValidate(UpdateBookingSchema, "body"),
      permissionMiddleware("booking", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(BookingParamsSchema, "params"),
      permissionMiddleware("booking", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
