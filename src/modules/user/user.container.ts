import { ContainerModule } from "inversify";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { USER_TYPES } from "./user.types";
import { UserRouter } from "./user.route";
import { UserRouter as ManagerUserRouter } from "./manager.route";

const userModule = new ContainerModule((bind) => {
  bind<UserController>(USER_TYPES.UserController).to(UserController);
  bind<UserService>(USER_TYPES.UserService).to(UserService);
  bind<UserRepository>(USER_TYPES.UserRepository).to(UserRepository);
  bind<UserRouter>(USER_TYPES.UserRouter).to(UserRouter);
  bind<ManagerUserRouter>(USER_TYPES.ManagerUserRouter).to(ManagerUserRouter);
});

export { userModule };
