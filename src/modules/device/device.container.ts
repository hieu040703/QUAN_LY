import { ContainerModule } from "inversify";
import { DEVICE_TYPES } from "./device.types";
import { DeviceRepository } from "./device.repository";
import { DeviceService } from "./device.service";
import { DeviceController } from "./device.controller";
import { DeviceRouter } from "./device.route";
import { UserDeviceRouter } from "./user.route";

const deviceModule = new ContainerModule((bind) => {
  bind<DeviceRepository>(DEVICE_TYPES.DeviceRepository).to(DeviceRepository);
  bind<DeviceService>(DEVICE_TYPES.DeviceService).to(DeviceService);
  bind<DeviceController>(DEVICE_TYPES.DeviceController).to(DeviceController);
  bind<DeviceRouter>(DEVICE_TYPES.DeviceRouter).to(DeviceRouter);
  bind<UserDeviceRouter>(DEVICE_TYPES.UserDeviceRouter).to(UserDeviceRouter);
});

export { deviceModule };
