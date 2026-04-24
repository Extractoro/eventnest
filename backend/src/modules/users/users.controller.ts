import { Request, Response } from 'express';
import * as usersService from './users.service';
import { success } from '../../utils/response';

export const getMe = async (req: Request, res: Response) => {
  const user = await usersService.getMe(req.userId!);
  res.status(200).json(success('Profile retrieved', user));
};

export const updateMe = async (req: Request, res: Response) => {
  const user = await usersService.updateMe(req.userId!, req.body);
  res.status(200).json(success('Profile updated', user));
};

export const changePassword = async (req: Request, res: Response) => {
  await usersService.changePassword(req.userId!, req.body);
  res.status(200).json(success('Password changed successfully'));
};
