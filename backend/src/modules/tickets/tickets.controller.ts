import { Request, Response } from 'express';
import * as ticketsService from './tickets.service';
import { success } from '../../utils/response';

export const book = async (req: Request, res: Response) => {
  const ticket = await ticketsService.book(req.userId!, req.body);
  res.status(201).json(success('Ticket booked', ticket));
};

export const pay = async (req: Request, res: Response) => {
  const result = await ticketsService.pay(req.userId!, req.body);
  res.status(200).json(success('Tickets paid', result));
};

export const cancel = async (req: Request, res: Response) => {
  const result = await ticketsService.cancel(req.userId!, req.body);
  res.status(200).json(success('Tickets cancelled', result));
};

export const getMyTickets = async (req: Request, res: Response) => {
  const tickets = await ticketsService.getUserTickets(req.userId!);
  res.status(200).json(success('Tickets retrieved', tickets));
};
