import { Router } from 'express';
import { handleCreateBooking, handleListBookings } from '../Controllers/BookingController';

export const bookingRouter = Router();

bookingRouter.get('/', handleListBookings);
bookingRouter.post('/', handleCreateBooking);
