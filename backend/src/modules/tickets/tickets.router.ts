import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { bookTicketSchema, ticketIdsSchema } from './tickets.schema';
import * as ticketsController from './tickets.controller';

const router = Router();

router.use(authMiddleware);

router.post('/book',   validate(bookTicketSchema),   ticketsController.book);
router.post('/pay',    validate(ticketIdsSchema),     ticketsController.pay);
router.post('/cancel', validate(ticketIdsSchema),     ticketsController.cancel);
router.get('/my',                                     ticketsController.getMyTickets);

export default router;
