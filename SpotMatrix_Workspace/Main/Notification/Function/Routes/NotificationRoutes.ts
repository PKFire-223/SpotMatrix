import { Router } from 'express';
import {
  handleCreateNotification,
  handleDeleteNotification,
  handleGetNotifications,
  handleMarkAllRead,
  handleMarkOneRead,
} from '../Controllers/NotificationController';

export const notificationRouter = Router();

notificationRouter.get('/', handleGetNotifications);
notificationRouter.post('/', handleCreateNotification);
notificationRouter.patch('/read-all', handleMarkAllRead);
notificationRouter.patch('/:notificationId/read', handleMarkOneRead);
notificationRouter.delete('/:notificationId', handleDeleteNotification);