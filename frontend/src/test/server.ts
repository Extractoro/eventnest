import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Pattern: Singleton
 * A single MSW server instance shared across all test files.
 * Handlers are the default set; individual tests may override via server.use().
 */
export const server = setupServer(...handlers);
