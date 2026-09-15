import { EntityManager, DeepPartial } from "typeorm";
import { inject, injectable } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { SeenMessage } from "@/database/models/SeenMessage";
import { SEEN_MESSAGE_TYPES } from "./seenMessage.types";
import { SeenMessageRepository } from "./seenMessage.repository";

@injectable()
export class SeenMessageService extends BaseService<SeenMessage> {
  protected repository: SeenMessageRepository;
  protected timeField = "seenAt" as keyof SeenMessage & string;

  constructor(@inject(SEEN_MESSAGE_TYPES.SeenMessageRepository) repository: SeenMessageRepository) {
    super();
    this.repository = repository;
  }

  protected async validateBeforeCreate(data: DeepPartial<SeenMessage>, _manager: EntityManager): Promise<void> {
    data.seenAt ??= new Date();
  }
}
