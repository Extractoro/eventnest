import { Request, Response } from 'express';
import * as eventService from './events.service';
import { eventQuerySchema } from './events.schema';
import { success } from '../../utils/response';

export const getAll = async (req: Request, res: Response) => {
  const filters = eventQuerySchema.parse(req.query);
  const result  = await eventService.getAll(filters);
  res.status(200).json(success('Events retrieved', result));
};

export const getById = async (req: Request, res: Response) => {
  const event = await eventService.getById(Number(req.params.id));
  res.status(200).json(success('Event retrieved', event));
};

export const create = async (req: Request, res: Response) => {
  const event = await eventService.create(req.body);
  res.status(201).json(success('Event created', event));
};

export const update = async (req: Request, res: Response) => {
  const event = await eventService.update(Number(req.params.id), req.body);
  res.status(200).json(success('Event updated', event));
};

export const remove = async (req: Request, res: Response) => {
  await eventService.remove(Number(req.params.id));
  res.status(200).json(success('Event deleted'));
};
