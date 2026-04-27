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

/**
 * Updates an existing venue by id.
 * @throws {NotFoundError} if venue does not exist
 * @throws {ConflictError} if the new venue_name is already taken by another venue
 */
export const update = async (venue_id: number, dto: Partial<CreateVenueDto>) => {
  const existing = await venueRepo.findById(venue_id);
  if (!existing) throw new NotFoundError('Venue not found');

  if (dto.venue_name && dto.venue_name !== existing.venue_name) {
    const taken = await venueRepo.findByName(dto.venue_name);
    if (taken) throw new ConflictError('Venue name already exists');
  }

  return venueRepo.update(venue_id, dto);
};

/**
 * Deletes a venue.
 * @throws {NotFoundError} if venue does not exist
 */
export const deleteById = async (venue_id: number) => {
  const existing = await venueRepo.findById(venue_id);
  if (!existing) throw new NotFoundError('Venue not found');
  return venueRepo.deleteById(venue_id);
};
