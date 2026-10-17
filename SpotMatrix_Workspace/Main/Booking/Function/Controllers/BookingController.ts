import { Request, Response, NextFunction } from 'express';
import { createWorkspaceBooking, listAllWorkspaceBookings } from '../Services/BookingService';
import { createValidationException } from '../../../../Error/Function/Models/AppExceptionModel';

export async function handleListBookings(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const records = await listAllWorkspaceBookings();
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { nodeId, userEmail, startTimeIso, endTimeIso, purposeNote } = req.body;
    if (!nodeId || !userEmail) {
      throw createValidationException('Vui long cung cap day du nodeId va userEmail khi dat cho.');
    }
    const createdBooking = await createWorkspaceBooking(
      nodeId,
      userEmail,
      startTimeIso || '09:00',
      endTimeIso || '17:00',
      purposeNote || 'Đặt chỗ qua bản đồ tương tác'
    );
    res.status(201).json({ success: true, data: createdBooking });
  } catch (err) {
    next(err);
  }
}
