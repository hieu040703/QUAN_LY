import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { SeenMessage } from "@/database/models/SeenMessage";
import { SeenMessageService } from "./seenMessage.service";
import { SEEN_MESSAGE_TYPES } from "./seenMessage.types";

@injectable()
export class SeenMessageController extends BaseController<SeenMessage> {
  protected service: SeenMessageService;

  constructor(@inject(SEEN_MESSAGE_TYPES.SeenMessageService) service: SeenMessageService) {
    super();
    this.service = service;
  }
}
