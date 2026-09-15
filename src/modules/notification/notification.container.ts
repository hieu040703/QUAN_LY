import { ContainerModule } from "inversify";
import { NotificationService } from "./notification.service";
import { NotificationRepository } from "./notification.repository";
import { NOTIFICATION_TYPES } from "./notification.types";
import { NotificationController } from "./notification.controller";
import { NotificationRouter } from "./notification.route";

const notificationModule = new ContainerModule((bind) => {
  bind<NotificationService>(NOTIFICATION_TYPES.NotificationService).to(
    NotificationService,
  );
  bind<NotificationRepository>(NOTIFICATION_TYPES.NotificationRepository).to(
    NotificationRepository,
  );
  bind<NotificationController>(NOTIFICATION_TYPES.NotificationController).to(NotificationController);
  bind<NotificationRouter>(NOTIFICATION_TYPES.NotificationRouter).to(NotificationRouter);
});

export { notificationModule };
