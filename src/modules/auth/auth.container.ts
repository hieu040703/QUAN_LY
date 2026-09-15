import { ContainerModule } from "inversify";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { AuthRouter } from "./auth.route";
import { AUTH_TYPES } from "./auth.types";

const authModule = new ContainerModule((bind) => {
  bind<AuthController>(AUTH_TYPES.AuthController).to(AuthController);
  bind<AuthService>(AUTH_TYPES.AuthService).to(AuthService);
  bind<AuthRepository>(AUTH_TYPES.AuthRepository).to(AuthRepository);
  bind<AuthRouter>(AUTH_TYPES.AuthRouter).to(AuthRouter);
});

export { authModule };
