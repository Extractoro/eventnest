import cors from 'cors';
import { env } from './env';

const ALLOWED_ORIGINS = new Set([
  env.CLIENT_URL,
  'http://localhost:5173',
]);

// Pattern: Strategy — origin validation strategy injected into cors middleware
export const corsOptions = cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) and listed origins
    if (!origin || ALLOWED_ORIGINS.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
});
