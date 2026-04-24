import { NotFoundError } from '../../utils/errors';
import * as eventRepo from './events.repository';
import * as venueService from '../venues/venues.service';
import * as categoryService from '../categories/categories.service';
import type { CreateEventDto, UpdateEventDto, EventFilters } from './events.types';

export const getAll = (filters: EventFilters) => eventRepo.findAll(filters);

export const getById = async (event_id: number) => {
  const event = await eventRepo.findById(event_id);
  if (!event) throw new NotFoundError('Event not found');
  return event;
};

export const create = async (dto: CreateEventDto) => {
  const venue    = await venueService.getOrCreate({
    venue_name: dto.venue_name,
    address:    dto.address,
    city:       dto.city,
    capacity:   dto.capacity,
  });
  const category = await categoryService.getByName(dto.category);

  const eventData = {
    event_name:     dto.event_name,
    event_date:     new Date(dto.event_date),
    description:    dto.description,
    ticket_price:   dto.ticket_price,
    capacity_event: dto.capacity_event,
    isAvailable:    dto.isAvailable,
    is_recurring:   dto.isRecurring,
    venue:     { connect: { venue_id: venue.venue_id } },
    category:  { connect: { category_id: category.category_id } },
    ...(dto.isRecurring && dto.start_date && dto.end_date && dto.frequency
      ? {
          recurringEvent: {
            create: {
              frequency:       dto.frequency,
              repeat_interval: dto.repeat_interval,
              start_date:      new Date(dto.start_date),
              end_date:        new Date(dto.end_date),
            },
          },
        }
      : {}),
  };

  return eventRepo.create(eventData);
};

export const update = async (event_id: number, dto: UpdateEventDto) => {
  const existing = await eventRepo.findById(event_id);
  if (!existing) throw new NotFoundError('Event not found');

  const data = {
    ...(dto.event_name     !== undefined && { event_name:     dto.event_name }),
    ...(dto.event_date     !== undefined && { event_date:     new Date(dto.event_date) }),
    ...(dto.description    !== undefined && { description:    dto.description }),
    ...(dto.ticket_price   !== undefined && { ticket_price:   dto.ticket_price }),
    ...(dto.capacity_event !== undefined && { capacity_event: dto.capacity_event }),
    ...(dto.isAvailable    !== undefined && { isAvailable:    dto.isAvailable }),
  };

  return eventRepo.update(event_id, data);
};

export const remove = async (event_id: number) => {
  const existing = await eventRepo.findById(event_id);
  if (!existing) throw new NotFoundError('Event not found');
  return eventRepo.remove(event_id);
};
