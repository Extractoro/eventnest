import { ConflictError, NotFoundError } from '../../utils/errors';
import * as venueRepo from './venues.repository';

export interface CreateVenueDto {
  venue_name: string;
  address: string;
  city: string;
  capacity: number;
}

export const getAll = () => venueRepo.findAll();

export const getOrCreate = async (dto: CreateVenueDto) => {
  const existing = await venueRepo.findByName(dto.venue_name);
  if (existing) return existing;
  return venueRepo.create(dto);
};

export const create = async (dto: CreateVenueDto) => {
  const existing = await venueRepo.findByName(dto.venue_name);
  if (existing) throw new ConflictError('Venue name already exists');
  return venueRepo.create(dto);
};

export const getById = async (venue_id: number) => {
  const venue = await venueRepo.findById(venue_id);
  if (!venue) throw new NotFoundError('Venue not found');
  return venue;
};
