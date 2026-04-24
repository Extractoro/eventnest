import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import * as userRepo from './auth.repository';
import * as emailService from '../../emails/email.service';
import { ConflictError, UnauthorizedError, BadRequestError, NotFoundError } from '../../utils/errors';
import type { RegisterDto, LoginDto, ResetPasswordDto, AccessTokenPayload, RefreshTokenPayload } from './auth.types';
import { Role } from '@prisma/client';

const BCRYPT_ROUNDS = 12;

const signAccess = (userId: number, role: Role) =>
  jwt.sign({ userId, role } satisfies AccessTokenPayload, env.JWT_SECRET, { expiresIn: '15m' });

const signRefresh = (userId: number) =>
  jwt.sign({ userId } satisfies RefreshTokenPayload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

export const register = async (dto: RegisterDto): Promise<void> => {
  const existing = await userRepo.findByEmail(dto.email);
  if (existing) throw new ConflictError('Email already in use');

  const hashed = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
  const token  = randomUUID();

  await userRepo.create({
    user_firstname:    dto.firstName,
    user_lastname:     dto.lastName,
    email:             dto.email,
    password:          hashed,
    phone:             dto.phone,
    verificationToken: token,
  });

  // Email failure is non-fatal: user is created, can resend verification later
  emailService.sendVerification(dto.email, dto.firstName, token).catch(err =>
    console.error('[auth.service] sendVerification failed:', err),
  );
};

export const verifyEmail = async (token: string): Promise<void> => {
  const user = await userRepo.findByVerificationToken(token);
  if (!user) throw new BadRequestError('Invalid or expired verification token');

  await userRepo.update(user.user_id, { verify: true, verificationToken: null });
  await emailService.sendWelcome(user.email, user.user_firstname);
};

export const resendVerification = async (email: string): Promise<void> => {
  const user = await userRepo.findByEmail(email);
  if (!user) return; // silent — don't leak whether email exists
  if (user.verify) throw new BadRequestError('Email is already verified');

  const token = randomUUID();
  await userRepo.update(user.user_id, { verificationToken: token });
  await emailService.sendVerification(user.email, user.user_firstname, token);
};

export const login = async (dto: LoginDto) => {
  const user = await userRepo.findByEmail(dto.email);
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  if (!user.verify) throw new UnauthorizedError('Please verify your email before logging in');

  const accessToken  = signAccess(user.user_id, user.role);
  const refreshToken = signRefresh(user.user_id);

  return { accessToken, refreshToken, role: user.role, userId: user.user_id };
};

export const refresh = async (token: string | undefined) => {
  if (!token) throw new UnauthorizedError('No refresh token');

  let payload: RefreshTokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await userRepo.findById(payload.userId);
  if (!user) throw new UnauthorizedError('User not found');

  return { accessToken: signAccess(user.user_id, user.role) };
};

export const logout = (): void => {
  // refresh token cleared via cookie on the controller
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await userRepo.findByEmail(email);
  if (!user) return; // silent

  const token = randomUUID();
  await userRepo.update(user.user_id, { resetPasswordToken: token });
  await emailService.sendPasswordReset(user.email, user.user_firstname, token);
};

export const resetPassword = async (token: string, dto: ResetPasswordDto): Promise<void> => {
  const user = await userRepo.findByResetToken(token);
  if (!user) throw new BadRequestError('Invalid or expired reset token');

  const hashed = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
  await userRepo.update(user.user_id, { password: hashed, resetPasswordToken: null });
};
