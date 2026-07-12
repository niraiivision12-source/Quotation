import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { syncService } from './sync.service';
import { AppError } from '../../utils/app-error';

export class SyncController {
  private static formatError(error: unknown): string {
    if (error instanceof ZodError) {
      const details = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return `Validation failed: ${details}`;
    }
    if (error instanceof AppError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }

  static async syncStockGroups(req: Request, res: Response) {
    try {
      const result = await syncService.syncStockGroups(req.body);
      return res.status(200).json(result);
    } catch (error) {
      const status = error instanceof ZodError || (error instanceof AppError && error.statusCode === 400) ? 400 : 500;
      return res.status(status).json({
        success: false,
        error: SyncController.formatError(error)
      });
    }
  }

  static async syncUnits(req: Request, res: Response) {
    try {
      const result = await syncService.syncUnits(req.body);
      return res.status(200).json(result);
    } catch (error) {
      const status = error instanceof ZodError || (error instanceof AppError && error.statusCode === 400) ? 400 : 500;
      return res.status(status).json({
        success: false,
        error: SyncController.formatError(error)
      });
    }
  }

  static async syncProducts(req: Request, res: Response) {
    try {
      const result = await syncService.syncProducts(req.body);
      return res.status(200).json(result);
    } catch (error) {
      const status = error instanceof ZodError || (error instanceof AppError && error.statusCode === 400) ? 400 : 500;
      return res.status(status).json({
        success: false,
        error: SyncController.formatError(error)
      });
    }
  }
}

export const syncController = SyncController;
