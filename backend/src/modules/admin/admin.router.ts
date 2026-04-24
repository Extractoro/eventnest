import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateRoleSchema, createVenueSchema } from './admin.schema';
import * as adminController from './admin.controller';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/users',              adminController.getUsers);
router.patch('/users/:id/role',   validate(updateRoleSchema),  adminController.updateRole);
router.get('/statistics',         adminController.getStatistics);
router.get('/venues',             adminController.getVenues);
router.post('/venues',            validate(createVenueSchema), adminController.createVenue);
router.get('/categories',         adminController.getCategories);

export default router;
