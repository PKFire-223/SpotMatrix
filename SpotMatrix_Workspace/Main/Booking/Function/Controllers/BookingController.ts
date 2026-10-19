import { Request, Response, NextFunction } from 'express';
import { BookingRecordModel } from '../Models/BookingRecordModel';
import { getMongoConnectionState } from '../../../../Shared/Database/MongoConnection';
import { BookingPayloadItem } from '../../../../Shared/Types/GlobalSystemTypes';
import {
  acquireFiveMinuteRoomHold,
  createWorkspaceBooking,
  listAllRoomLockStates,
  listAllWorkspaceBookings,
  releaseFiveMinuteRoomHold,
  runFifteenMinuteNoShowCronSweep,
  simulateConcurrentOptimisticRace,
} from '../Services/BookingService';

export async function handleListBookings(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await listAllWorkspaceBookings();
    const roomLocks = listAllRoomLockStates();
    res.json({ success: true, data, roomLocks });
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
    const payload = req.body as BookingPayloadItem & { expectedLockVersion?: number };
    const created = await createWorkspaceBooking(
      payload.nodeId || 'M1-01',
      payload.userEmail || 'employee.dev@spotmatrix.vn',
      payload.startTimeIso || '08:00',
      payload.endTimeIso || '10:00',
      payload.purposeNote || 'Đặt lịch phòng họp',
      {
        bookingId: payload.bookingId,
        requesterUsername: payload.requesterUsername,
        requesterRole: payload.requesterRole,
        departmentName: payload.departmentName,
        bookingDateIso: payload.bookingDateIso,
        recurringOption: payload.recurringOption,
        expectedLockVersion: payload.expectedLockVersion,
        approvalStatus: payload.approvalStatus,
        approvedByUsername: payload.approvedByUsername,
      }
    );
    res.status(201).json({
      success: true,
      data: created,
      roomLocks: listAllRoomLockStates(),
    });
  } catch (err) {
    next(err);
  }
}

export async function handleAcquireFiveMinuteHold(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { nodeId, userEmail, username, expectedLockVersion } = req.body;
    const holdState = await acquireFiveMinuteRoomHold(
      nodeId || 'M1-01',
      userEmail || 'employee.dev@spotmatrix.vn',
      username || 'Employeedev123',
      expectedLockVersion !== undefined ? Number(expectedLockVersion) : undefined
    );
    res.status(201).json({
      success: true,
      data: holdState,
      roomLocks: listAllRoomLockStates(),
    });
  } catch (err) {
    next(err);
  }
}

export async function handleReleaseFiveMinuteHold(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { nodeId } = req.params;
    const actorEmail = String(req.body?.userEmail || 'sysadmin@spotmatrix.vn');
    const reason = String(req.body?.reason || 'USER_MANUAL_RELEASE');
    const released = await releaseFiveMinuteRoomHold(nodeId, actorEmail, reason);
    res.json({
      success: true,
      data: released,
      roomLocks: listAllRoomLockStates(),
    });
  } catch (err) {
    next(err);
  }
}

export async function handleSimulateOptimisticRace(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { nodeId, winnerEmail, challengerEmail } = req.body;
    const result = await simulateConcurrentOptimisticRace(
      nodeId || 'M1-01',
      winnerEmail || 'employee.dev@spotmatrix.vn',
      challengerEmail || 'challenger.concurrent@spotmatrix.vn'
    );
    res.status(201).json({
      success: true,
      data: result,
      roomLocks: listAllRoomLockStates(),
    });
  } catch (err) {
    next(err);
  }
}

export async function handleRunCronNoShowSweep(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { forceTargetBookingId } = req.body || {};
    const sweepResult = await runFifteenMinuteNoShowCronSweep({
      forceTargetBookingId,
    });
    res.json({
      success: true,
      data: sweepResult,
    });
  } catch (err) {
    next(err);
  }
}

export async function handlePatchBookingApproval(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { bookingId } = req.params;
    const { approvalStatus, approvedByUsername, approvedAtIso } = req.body;
    const nextBookingStatus = approvalStatus === 'REJECTED' ? 'CANCELLED' : 'CONFIRMED';

    if (getMongoConnectionState()) {
      const updated = await BookingRecordModel.findOneAndUpdate(
        { bookingId },
        {
          $set: {
            approvalStatus,
            approvedByUsername,
            approvedAtIso: approvedAtIso || new Date().toLocaleTimeString('vi-VN'),
            bookingStatus: nextBookingStatus,
          },
        },
        { new: true }
      ).lean();
      res.json({ success: true, data: updated });
      return;
    }

    res.json({
      success: true,
      data: { bookingId, approvalStatus, approvedByUsername, bookingStatus: nextBookingStatus },
    });
  } catch (err) {
    next(err);
  }
}

export async function handlePatchBookingCheckin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { bookingId } = req.params;
    const { checkedInAtIso } = req.body;

    if (getMongoConnectionState()) {
      const updated = await BookingRecordModel.findOneAndUpdate(
        { bookingId },
        {
          $set: {
            bookingStatus: 'CHECKED_IN',
            checkedInAtIso: checkedInAtIso || new Date().toLocaleString('vi-VN'),
          },
        },
        { new: true }
      ).lean();
      res.json({ success: true, data: updated });
      return;
    }

    res.json({
      success: true,
      data: { bookingId, bookingStatus: 'CHECKED_IN', checkedInAtIso },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { bookingId } = req.params;
    if (getMongoConnectionState()) {
      await BookingRecordModel.deleteOne({ bookingId });
    }
    res.json({ success: true, deletedId: bookingId });
  } catch (err) {
    next(err);
  }
}