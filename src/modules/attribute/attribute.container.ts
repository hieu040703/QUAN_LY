import { ContainerModule } from "inversify";
import { AttributeController } from "./attribute.controller";
import { AttributeService } from "./attribute.service";
import { AttributeRepository } from "./attribute.repository";
import { AttributeRouter } from "./attribute.route";
import { ATTRIBUTE_TYPES } from "./attribute.types";

const attributeModule = new ContainerModule((bind) => {
  bind<AttributeService>(ATTRIBUTE_TYPES.AttributeService).to(AttributeService);
  bind<AttributeController>(ATTRIBUTE_TYPES.AttributeController).to(
    AttributeController,
  );
  bind<AttributeRepository>(ATTRIBUTE_TYPES.AttributeRepository).to(
    AttributeRepository,
  );
  bind<AttributeRouter>(ATTRIBUTE_TYPES.AttributeRouter).to(AttributeRouter);
});

export { attributeModule };
