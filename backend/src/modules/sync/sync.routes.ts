import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { checkPermission } from '../../middlewares/permission.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { syncController } from './sync.controller';

const router = Router();

router.use(authenticate);

// Since sync involves managing products/system, 'manageProducts' permission seems appropriate.
router.post('/stock-groups', checkPermission('manageProducts'), asyncHandler(syncController.syncStockGroups));
router.post('/units', checkPermission('manageProducts'), asyncHandler(syncController.syncUnits));
router.post('/products', checkPermission('manageProducts'), asyncHandler(syncController.syncProducts));

export default router;
