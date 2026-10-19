import { Router } from 'express';
import {
  handleAcquireFiveMinuteHold,
  handleCreateBooking,
  handleDeleteBooking,
  handleListBookings,
  handlePatchBookingApproval,
  handlePatchBookingCheckin,
  handleReleaseFiveMinuteHold,
  handleRunCronNoShowSweep,
  handleSimulateOptimisticRace,
} from '../Controllers/BookingController';
import { startBookingBackgroundCronJobs } from '../Services/BookingService';

export const bookingRouter = Router();

// Khởi chạy tiến trình ngầm Cronjob 15 phút tự thu hồi chỗ No-Show
startBookingBackgroundCronJobs();

bookingRouter.get('/', handleListBookings);
bookingRouter.post('/', handleCreateBooking);
bookingRouter.post('/hold', handleAcquireFiveMinuteHold);
bookingRouter.delete('/hold/:nodeId', handleReleaseFiveMinuteHold);
bookingRouter.post('/simulate-race', handleSimulateOptimisticRace);
bookingRouter.post('/cron/sweep-noshow', handleRunCronNoShowSweep);
bookingRouter.patch('/:bookingId/approval', handlePatchBookingApproval);
bookingRouter.patch('/:bookingId/checkin', handlePatchBookingCheckin);
bookingRouter.delete('/:bookingId', handleDeleteBooking);