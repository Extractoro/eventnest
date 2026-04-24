import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { corsOptions } from './config/cors';
import { errorMiddleware } from './middleware/error.middleware';
import authRouter   from './modules/auth/auth.router';
import eventsRouter from './modules/events/events.router';
import ticketsRouter from './modules/tickets/tickets.router';
import usersRouter  from './modules/users/users.router';
import adminRouter  from './modules/admin/admin.router';

const app = express();

app.use(corsOptions);
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth',    authRouter);
app.use('/events',  eventsRouter);
app.use('/tickets', ticketsRouter);
app.use('/users',   usersRouter);
app.use('/admin',   adminRouter);

app.use(errorMiddleware);

export default app;
