import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createEventSchema, updateEventSchema } from './events.schema';
import * as eventsController from './events.controller';

const router = Router();

router.get('/',     authMiddleware,                               eventsController.getAll);
router.get('/:id',  authMiddleware,                               eventsController.getById);
router.post('/',    authMiddleware, adminMiddleware, validate(createEventSchema), eventsController.create);
router.patch('/:id', authMiddleware, adminMiddleware, validate(updateEventSchema), eventsController.update);
router.delete('/:id', authMiddleware, adminMiddleware,            eventsController.remove);

export default router;
