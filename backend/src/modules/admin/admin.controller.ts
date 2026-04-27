import { Request, Response } from 'express';
import * as adminService from './admin.service';
import { adminUsersQuerySchema, adminEventsQuerySchema, adminTicketsQuerySchema } from './admin.schema';
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

// ── Events ───────────────────────────────────────────────────────────────────

export const getEvents = async (req: Request, res: Response) => {
  const query  = adminEventsQuerySchema.parse(req.query);
  const result = await adminService.getEvents(query);
  res.status(200).json(success('Events retrieved', result));
};

export const updateEvent = async (req: Request, res: Response) => {
  const event = await adminService.updateEvent(Number(req.params.id), req.body);
  res.status(200).json(success('Event updated', event));
};

export const deleteEvent = async (req: Request, res: Response) => {
  await adminService.deleteEvent(Number(req.params.id));
  res.status(200).json(success('Event deleted'));
};

// ── Venues ───────────────────────────────────────────────────────────────────

export const getVenues = async (_req: Request, res: Response) => {
  const venues = await adminService.getVenues();
  res.status(200).json(success('Venues retrieved', venues));
};

export const createVenue = async (req: Request, res: Response) => {
  const venue = await adminService.createVenue(req.body);
  res.status(201).json(success('Venue created', venue));
};

export const updateVenue = async (req: Request, res: Response) => {
  const venue = await adminService.updateVenue(Number(req.params.id), req.body);
  res.status(200).json(success('Venue updated', venue));
};

export const deleteVenue = async (req: Request, res: Response) => {
  await adminService.deleteVenue(Number(req.params.id));
  res.status(200).json(success('Venue deleted'));
};

// ── Tickets ───────────────────────────────────────────────────────────────────

export const getTickets = async (req: Request, res: Response) => {
  const query  = adminTicketsQuerySchema.parse(req.query);
  const result = await adminService.getTickets(query);
  res.status(200).json(success('Tickets retrieved', result));
};

export const updateTicketStatus = async (req: Request, res: Response) => {
  const ticket = await adminService.setTicketStatus(Number(req.params.id), req.body.status);
  res.status(200).json(success('Ticket status updated', ticket));
};

// ── Categories ───────────────────────────────────────────────────────────────

export const getCategories = async (_req: Request, res: Response) => {
  const categories = await adminService.getCategories();
  res.status(200).json(success('Categories retrieved', categories));
};
