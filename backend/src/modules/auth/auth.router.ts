import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema';
import * as authController from './auth.controller';

const router = Router();

router.post('/register',            validate(registerSchema),            authController.register);
router.get('/verify/:token',                                             authController.verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema),  authController.resendVerification);
router.post('/login',               validate(loginSchema),               authController.login);
router.post('/refresh',                                                  authController.refreshToken);
router.post('/logout',              authMiddleware,                      authController.logout);
router.post('/forgot-password',     validate(forgotPasswordSchema),      authController.forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema),     authController.resetPassword);

export default router;
