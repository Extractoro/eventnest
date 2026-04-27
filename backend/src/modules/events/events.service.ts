import { Prisma } from '@prisma/client';
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

  const data: Prisma.EventUpdateInput = {};

  if (dto.event_name     !== undefined) data.event_name     = dto.event_name;
  if (dto.event_date     !== undefined) data.event_date     = new Date(dto.event_date);
  if (dto.description    !== undefined) data.description    = dto.description;
  if (dto.ticket_price   !== undefined) data.ticket_price   = dto.ticket_price;
  if (dto.capacity_event !== undefined) data.capacity_event = dto.capacity_event;
  if (dto.isAvailable    !== undefined) data.isAvailable    = dto.isAvailable;

  if (dto.venue_name) {
    const venue = await venueService.getOrCreate({
      venue_name: dto.venue_name,
      address:    dto.address  ?? existing.venue.address,
      city:       dto.city     ?? existing.venue.city,
      capacity:   dto.capacity ?? existing.venue.capacity,
    });
    data.venue = { connect: { venue_id: venue.venue_id } };
  }

  if (dto.category) {
    const category = await categoryService.getByName(dto.category);
    data.category = { connect: { category_id: category.category_id } };
  }

  if (dto.isRecurring !== undefined) {
    data.is_recurring = dto.isRecurring;

    const turningOn  = dto.isRecurring && !existing.is_recurring;
    const turningOff = !dto.isRecurring && existing.is_recurring;
    const updating   = dto.isRecurring && existing.is_recurring;

    if (turningOn && dto.start_date && dto.end_date && dto.frequency) {
      data.recurringEvent = {
        create: {
          frequency:       dto.frequency,
          repeat_interval: dto.repeat_interval ?? 1,
          start_date:      new Date(dto.start_date),
          end_date:        new Date(dto.end_date),
        },
      };
    } else if (turningOff) {
      data.recurringEvent = { disconnect: true };
    } else if (updating) {
      data.recurringEvent = {
        update: {
          ...(dto.frequency       !== undefined && { frequency:       dto.frequency }),
          ...(dto.repeat_interval !== undefined && { repeat_interval: dto.repeat_interval }),
          ...(dto.start_date      !== undefined && { start_date:      new Date(dto.start_date) }),
          ...(dto.end_date        !== undefined && { end_date:        new Date(dto.end_date) }),
        },
      };
    }
  }

  return eventRepo.update(event_id, data);
};

export const remove = async (event_id: number) => {
  const existing = await eventRepo.findById(event_id);
  if (!existing) throw new NotFoundError('Event not found');
  return eventRepo.remove(event_id);
};
