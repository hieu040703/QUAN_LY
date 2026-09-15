import { ContainerModule } from "inversify";
import { NotificationService } from "./notification.service";
import { NotificationRepository } from "./notification.repository";
import { NOTIFICATION_TYPES } from "./notification.types";

const notificationModule = new ContainerModule((bind) => {
  bind<NotificationService>(NOTIFICATION_TYPES.NotificationService).to(
    NotificationService,
  );
  bind<NotificationRepository>(NOTIFICATION_TYPES.NotificationRepository).to(
    NotificationRepository,
  );
});

export { notificationModule };
