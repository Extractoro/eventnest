import { Request, Response } from 'express';
import * as adminService from './admin.service';
import { adminUsersQuerySchema } from './admin.schema';
import { success } from '../../utils/response';

export const getUsers = async (req: Request, res: Response) => {
  const query  = adminUsersQuerySchema.parse(req.query);
  const result = await adminService.getUsers(query);
  res.status(200).json(success('Users retrieved', result));
};

export const updateRole = async (req: Request, res: Response) => {
  const user = await adminService.updateRole(Number(req.params.id), req.body.role);
  res.status(200).json(success('Role updated', user));
};

export const getStatistics = async (_req: Request, res: Response) => {
  const stats = await adminService.getStatistics();
  res.status(200).json(success('Statistics retrieved', stats));
};

export const getVenues = async (_req: Request, res: Response) => {
  const venues = await adminService.getVenues();
  res.status(200).json(success('Venues retrieved', venues));
};

export const createVenue = async (req: Request, res: Response) => {
  const venue = await adminService.createVenue(req.body);
  res.status(201).json(success('Venue created', venue));
};

export const getCategories = async (_req: Request, res: Response) => {
  const categories = await adminService.getCategories();
  res.status(200).json(success('Categories retrieved', categories));
};
