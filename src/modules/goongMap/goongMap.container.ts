import { ContainerModule } from "inversify";
import { GoongMapCacheService } from "./goongMap.cache.service";
import { GoongMapController } from "./goongMap.controller";
import { GoongMapRepository } from "./goongMap.repository";
import { GoongMapRouter } from "./goongMap.route";
import { GoongMapService } from "./goongMap.service";
import { GOONG_MAP_TYPES } from "./goongMap.types";
import { ManagerGoongMapRouter } from "./manager.route";

export const goongMapModule = new ContainerModule((bind) => {
  bind<GoongMapRepository>(GOONG_MAP_TYPES.GoongMapRepository).to(GoongMapRepository);
  bind<GoongMapCacheService>(GOONG_MAP_TYPES.GoongMapCacheService).to(GoongMapCacheService);
  bind<GoongMapService>(GOONG_MAP_TYPES.GoongMapService).to(GoongMapService);
  bind<GoongMapController>(GOONG_MAP_TYPES.GoongMapController).to(GoongMapController);
  bind<GoongMapRouter>(GOONG_MAP_TYPES.GoongMapRouter).to(GoongMapRouter);
  bind<ManagerGoongMapRouter>(GOONG_MAP_TYPES.ManagerGoongMapRouter).to(ManagerGoongMapRouter);
});
