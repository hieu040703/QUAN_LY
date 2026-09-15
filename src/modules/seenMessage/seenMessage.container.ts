import { ContainerModule } from "inversify";
import { SeenMessageController } from "./seenMessage.controller";
import { SeenMessageRepository } from "./seenMessage.repository";
import { SeenMessageRouter } from "./seenMessage.route";
import { SeenMessageService } from "./seenMessage.service";
import { SEEN_MESSAGE_TYPES } from "./seenMessage.types";

export const seenMessageModule = new ContainerModule((bind) => {
  bind<SeenMessageRepository>(SEEN_MESSAGE_TYPES.SeenMessageRepository).to(SeenMessageRepository);
  bind<SeenMessageService>(SEEN_MESSAGE_TYPES.SeenMessageService).to(SeenMessageService);
  bind<SeenMessageController>(SEEN_MESSAGE_TYPES.SeenMessageController).to(SeenMessageController);
  bind<SeenMessageRouter>(SEEN_MESSAGE_TYPES.SeenMessageRouter).to(SeenMessageRouter);
});
