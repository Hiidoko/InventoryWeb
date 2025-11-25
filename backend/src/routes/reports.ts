import { Router, Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/InventoryService';

const asyncHandler = (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };

export function reportsRouter(inventory: InventoryService) {
  const router = Router();

  router.get('/', asyncHandler(async (_req, res) => {
    const payload = await inventory.report();
    res.json(payload);
  }));

  router.get('/advanced', asyncHandler(async (_req, res) => {
    const payload = await inventory.advancedReport();
    res.json(payload);
  }));

  return router;
}
