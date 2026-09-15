import { ContainerModule } from "inversify";
import { RoleController } from "./role.controller";
import { RoleService } from "./role.service";
import { RoleRepository } from "./role.repository";
import { RoleRouter } from "./role.route";
import { ROLE_TYPES } from "./role.types";

const roleModule = new ContainerModule((bind) => {
  bind<RoleService>(ROLE_TYPES.RoleService).to(RoleService);
  bind<RoleController>(ROLE_TYPES.RoleController).to(RoleController);
  bind<RoleRepository>(ROLE_TYPES.RoleRepository).to(RoleRepository);
  bind<RoleRouter>(ROLE_TYPES.RoleRouter).to(RoleRouter);
});

export { roleModule };
