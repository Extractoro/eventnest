import bcrypt from 'bcrypt';
import { NotFoundError, UnauthorizedError } from '../../utils/errors';
import * as userRepo from './users.repository';
import type { z } from 'zod';
import type { updateMeSchema, changePasswordSchema } from './users.schema';

type UpdateMeDto       = z.infer<typeof updateMeSchema>;
type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const getMe = async (userId: number) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const updateMe = async (userId: number, dto: UpdateMeDto) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  return userRepo.update(userId, {
    ...(dto.firstName !== undefined && { user_firstname: dto.firstName }),
    ...(dto.lastName  !== undefined && { user_lastname:  dto.lastName }),
    ...(dto.phone     !== undefined && { phone:          dto.phone }),
  });
};

export const changePassword = async (userId: number, dto: ChangePasswordDto) => {
  const user = await userRepo.findByIdWithPassword(userId);
  if (!user) throw new NotFoundError('User not found');

  const valid = await bcrypt.compare(dto.currentPassword, user.password);
  if (!valid) throw new UnauthorizedError('Current password is incorrect');

  const hashed = await bcrypt.hash(dto.newPassword, 12);
  await userRepo.update(userId, { password: hashed });
};
