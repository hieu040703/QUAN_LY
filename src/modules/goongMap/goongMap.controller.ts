import { inject, injectable } from "inversify";
import { NextFunction, Request, Response } from "express";
import { GOONG_MAP_TYPES } from "./goongMap.types";
import { GoongMapService } from "./goongMap.service";

@injectable()
export class GoongMapController {
  constructor(@inject(GOONG_MAP_TYPES.GoongMapService) private readonly goongMapService: GoongMapService) {}

  private handle = async (
    handler: () => Promise<{ statusCode: number }>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | undefined> => {
    try {
      const result = await handler();
      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  autocomplete = (req: Request, res: Response, next: NextFunction) =>
    this.handle(() => this.goongMapService.autocomplete(req.query as any), res, next);

  placeChildren = (req: Request, res: Response, next: NextFunction) =>
    this.handle(() => this.goongMapService.placeChildren(req.query as any), res, next);

  placeDetail = (req: Request, res: Response, next: NextFunction) =>
    this.handle(() => this.goongMapService.placeDetail(req.query as any), res, next);

  geocode = (req: Request, res: Response, next: NextFunction) =>
    this.handle(() => this.goongMapService.geocode(req.query as any), res, next);

  reverseGeocode = (req: Request, res: Response, next: NextFunction) =>
    this.handle(() => this.goongMapService.reverseGeocode(req.query as any), res, next);

  geocodeStreet = (req: Request, res: Response, next: NextFunction) =>
    this.handle(() => this.goongMapService.geocodeStreet(req.query as any), res, next);

  directions = (req: Request, res: Response, next: NextFunction) =>
    this.handle(() => this.goongMapService.directions(req.query as any), res, next);

  distanceMatrix = (req: Request, res: Response, next: NextFunction) =>
    this.handle(() => this.goongMapService.distanceMatrix(req.query as any), res, next);

  trip = (req: Request, res: Response, next: NextFunction) =>
    this.handle(() => this.goongMapService.trip(req.query as any), res, next);

  getClubsForMap = (req: Request, res: Response, next: NextFunction) =>
    this.handle(() => this.goongMapService.getClubsForMap(req.query as any), res, next);

  getMapTileKey = (req: Request, res: Response, next: NextFunction) =>
    this.handle(() => Promise.resolve(this.goongMapService.getMapTileKey()), res, next);
}

