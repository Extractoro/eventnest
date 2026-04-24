import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateMeSchema, changePasswordSchema } from './users.schema';
import * as usersController from './users.controller';

const router = Router();

router.use(authMiddleware);

router.get('/me',              usersController.getMe);
router.patch('/me',            validate(updateMeSchema),       usersController.updateMe);
router.post('/change-password', validate(changePasswordSchema), usersController.changePassword);

export default router;
