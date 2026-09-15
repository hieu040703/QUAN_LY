import { ContainerModule } from "inversify";
import { BookingController } from "./booking.controller";
import { BookingRepository } from "./booking.repository";
import { BookingRouter } from "./booking.route";
import { UserBookingRouter } from "./user.route";
import { ManagerBookingRouter } from "./manager.route";
import { BookingService } from "./booking.service";
import { BOOKING_TYPES } from "./booking.types";

export const bookingModule = new ContainerModule((bind) => {
  bind<BookingRepository>(BOOKING_TYPES.BookingRepository).to(BookingRepository);
  bind<BookingService>(BOOKING_TYPES.BookingService).to(BookingService);
  bind<BookingController>(BOOKING_TYPES.BookingController).to(BookingController);
  bind<BookingRouter>(BOOKING_TYPES.BookingRouter).to(BookingRouter);
  bind<UserBookingRouter>(BOOKING_TYPES.UserBookingRouter).to(UserBookingRouter);
  bind<ManagerBookingRouter>(BOOKING_TYPES.ManagerBookingRouter).to(ManagerBookingRouter);
});
