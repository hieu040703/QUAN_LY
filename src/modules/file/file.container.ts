import { ContainerModule } from "inversify";
import { FileController } from "./file.controller";
import { FileService } from "./file.service";
import { FileRepository } from "./file.repository";
import { FileRouter } from "./file.route";
import { FILE_TYPES } from "./file.types";

const fileModule = new ContainerModule((bind) => {
  bind<FileService>(FILE_TYPES.FileService).to(FileService);
  bind<FileController>(FILE_TYPES.FileController).to(FileController);
  bind<FileRepository>(FILE_TYPES.FileRepository).to(FileRepository);
  bind<FileRouter>(FILE_TYPES.FileRouter).to(FileRouter);
});

export { fileModule };
