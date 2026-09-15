import { BaseRepository } from "@/shared/base/BaseRepository";
import { Device } from "@/database/models/Device";
import { DeviceSelectFull, DeviceRelations } from "./device.select";

export class DeviceRepository extends BaseRepository<Device> {
  protected entityClass = Device;
  protected selectedFields = DeviceSelectFull;
  protected relations = DeviceRelations;
}
