import { Request, Response } from 'express';
import * as authService from './auth.service';
import { success } from '../../utils/response';

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

export const register = async (req: Request, res: Response) => {
  await authService.register(req.body);
  res.status(200).json(success('Registration successful. Check your email.'));
};

export const verifyEmail = async (req: Request, res: Response) => {
  await authService.verifyEmail(req.params.token as string);
  res.status(200).json(success('Email verified successfully.'));
};

export const resendVerification = async (req: Request, res: Response) => {
  await authService.resendVerification(req.body.email);
  res.status(200).json(success('If that email is registered and unverified, a new link has been sent.'));
};

export const login = async (req: Request, res: Response) => {
  const { accessToken, refreshToken, role, userId } = await authService.login(req.body);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
  res.status(200).json(success('Login successful', { accessToken, role, userId }));
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  const result = await authService.refresh(token);
  res.status(200).json(success('Token refreshed', result));
};

export const logout = (_req: Request, res: Response) => {
  authService.logout();
  res.clearCookie('refreshToken');
  res.status(200).json(success('Logged out'));
};

export const forgotPassword = async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res.status(200).json(success('If that email is registered, a reset link has been sent.'));
};

export const resetPassword = async (req: Request, res: Response) => {
  await authService.resetPassword(req.params.token as string, req.body);
  res.status(200).json(success('Password reset successfully.'));
};
