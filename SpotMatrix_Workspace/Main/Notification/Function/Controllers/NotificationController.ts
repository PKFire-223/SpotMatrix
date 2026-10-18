import { Request, Response, NextFunction } from 'express';
import {
  createSystemNotification,
  deleteNotificationById,
  listUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../Services/NotificationService';
import { createValidationException } from '../../../../Error/Function/Models/AppExceptionModel';

export async function handleGetNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const email = req.query.email as string | undefined;
    const list = await listUserNotifications(email);
    res.json({
      success: true,
      unreadCount: list.filter((i) => !i.isRead).length,
      data: list,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { recipientEmail, titleText, contentText, category, relatedNodeId } = req.body;
    if (!titleText || !contentText) {
      throw createValidationException('Vui lòng nhập tiêu đề và nội dung thông báo.');
    }
    const created = await createSystemNotification({
      recipientEmail,
      titleText,
      contentText,
      category,
      relatedNodeId,
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

export async function handleMarkOneRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { notificationId } = req.params;
    const updated = await markNotificationAsRead(notificationId);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleMarkAllRead(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await markAllNotificationsAsRead();
    res.json({ success: true, message: 'Đã đánh dấu đọc tất cả thông báo.' });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { notificationId } = req.params;
    await deleteNotificationById(notificationId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}