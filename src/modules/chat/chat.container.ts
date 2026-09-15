import { ContainerModule } from "inversify";
import { ChatController } from "./chat.controller";
import { ChatRepository } from "./chat.repository";
import { ChatRouter } from "./chat.route";
import { ChatService } from "./chat.service";
import { CHAT_TYPES } from "./chat.types";

export const chatModule = new ContainerModule((bind) => {
  bind<ChatRepository>(CHAT_TYPES.ChatRepository).to(ChatRepository);
  bind<ChatService>(CHAT_TYPES.ChatService).to(ChatService);
  bind<ChatController>(CHAT_TYPES.ChatController).to(ChatController);
  bind<ChatRouter>(CHAT_TYPES.ChatRouter).to(ChatRouter);
});
