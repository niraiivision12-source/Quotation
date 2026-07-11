import { Router } from 'express';
import { syncApiKeyMiddleware } from '../../middlewares/syncApiKey.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { syncController } from './sync.controller';

const router = Router();

router.use(syncApiKeyMiddleware);

router.post('/stock-groups', asyncHandler(syncController.syncStockGroups));
router.post('/units', asyncHandler(syncController.syncUnits));
router.post('/products', asyncHandler(syncController.syncProducts));

export default router;
