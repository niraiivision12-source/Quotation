import { Request, Response } from 'express';
import { syncService } from './sync.service';

export class SyncController {
  static async syncStockGroups(req: Request, res: Response) {
    const result = await syncService.syncStockGroups(req.body);
    return res.status(200).json(result);
  }

  static async syncUnits(req: Request, res: Response) {
    const result = await syncService.syncUnits(req.body);
    return res.status(200).json(result);
  }

  static async syncProducts(req: Request, res: Response) {
    const result = await syncService.syncProducts(req.body);
    return res.status(200).json(result);
  }
}

export const syncController = SyncController;
