import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  updateRoleSchema, createVenueSchema, updateVenueSchema,
  adminUpdateEventSchema, adminSetTicketStatusSchema,
} from './admin.schema';
import * as adminController from './admin.controller';

// Pattern: Chain of Responsibility (Middleware)
// authMiddleware + adminMiddleware guard every route in this router.
const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/users',              adminController.getUsers);
router.patch('/users/:id/role',   validate(updateRoleSchema),        adminController.updateRole);
router.get('/statistics',         adminController.getStatistics);

router.get('/events',             adminController.getEvents);
router.patch('/events/:id',       validate(adminUpdateEventSchema),   adminController.updateEvent);
router.delete('/events/:id',      adminController.deleteEvent);

router.get('/venues',             adminController.getVenues);
router.post('/venues',            validate(createVenueSchema),        adminController.createVenue);
router.patch('/venues/:id',       validate(updateVenueSchema),        adminController.updateVenue);
router.delete('/venues/:id',      adminController.deleteVenue);

router.get('/tickets',                adminController.getTickets);
router.patch('/tickets/:id/status',   validate(adminSetTicketStatusSchema), adminController.updateTicketStatus);

router.get('/categories',         adminController.getCategories);

export default router;
