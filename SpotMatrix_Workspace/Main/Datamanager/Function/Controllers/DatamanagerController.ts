import { Request, Response, NextFunction } from 'express';
import {
  adjustUserTrustScore,
  calculateZoneOccupancyRate,
  evaluateUserBookingEligibility,
  getActivePolicyConfig,
  listAuditConcurrencyLogs,
  listSharedEquipments,
  listUserTrustProfiles,
  recordAuditConcurrencyLog,
  updateActivePolicyConfig,
  updateEquipmentAttachmentStatus,
} from '../Services/DatamanagerService';
import { createValidationException } from '../../../../Error/Function/Models/AppExceptionModel';
import { EquipmentStatusType } from '../../../../Shared/Types/GlobalSystemTypes';

export function handleGetOccupancySummary(_req: Request, res: Response): void {
  res.json({
    success: true,
    occupancyPercent: calculateZoneOccupancyRate(2, 5),
  });
}

export async function handleGetTrustProfiles(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profiles = await listUserTrustProfiles();
    res.json({ success: true, totalCount: profiles.length, data: profiles });
  } catch (err) {
    next(err);
  }
}

export async function handleAdjustTrustScore(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userEmail, eventType, targetNodeId } = req.body;
    if (!userEmail || !eventType) {
      throw createValidationException(
        'Thiếu userEmail hoặc eventType (QR_CHECKIN_ONTIME | NO_SHOW_EXPIRED).'
      );
    }
    const updatedProfile = await adjustUserTrustScore(
      userEmail,
      eventType,
      targetNodeId
    );
    res.json({ success: true, data: updatedProfile });
  } catch (err) {
    next(err);
  }
}

export async function handleEvaluateBookingEligibility(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userEmail, isRecurringRequest, requestedAdvanceDays } = req.body;
    if (!userEmail) {
      throw createValidationException(
        'Vui lòng cung cấp userEmail để kiểm tra điểm tín nhiệm.'
      );
    }
    const result = await evaluateUserBookingEligibility(
      userEmail,
      Boolean(isRecurringRequest),
      Number(requestedAdvanceDays || 0)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function handleGetSharedEquipments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const statusFilter = req.query.status as EquipmentStatusType | undefined;
    const equipments = await listSharedEquipments(statusFilter);
    res.json({
      success: true,
      totalCount: equipments.length,
      data: equipments,
    });
  } catch (err) {
    next(err);
  }
}

export async function handlePatchEquipmentStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { equipmentId } = req.params;
    const { status, bookingId, assignedNodeId } = req.body;
    if (!equipmentId || !status) {
      throw createValidationException(
        'Thiếu equipmentId hoặc trạng thái status (AVAILABLE | IN_USE | BROKEN).'
      );
    }
    const updatedEq = await updateEquipmentAttachmentStatus(
      equipmentId,
      status,
      bookingId || null,
      assignedNodeId
    );
    res.json({ success: true, data: updatedEq });
  } catch (err) {
    next(err);
  }
}

export async function handleGetPolicyConfig(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const policy = await getActivePolicyConfig();
    res.json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdatePolicyConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { adminEmail, ...policyPayload } = req.body;
    const updatedPolicy = await updateActivePolicyConfig(
      policyPayload,
      adminEmail
    );
    res.json({ success: true, data: updatedPolicy });
  } catch (err) {
    next(err);
  }
}

export async function handleGetAuditLogs(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const logs = await listAuditConcurrencyLogs();
    res.json({ success: true, totalCount: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
}

export async function handleSimulateConcurrencyLock(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { winnerEmail, challengerEmail, targetNodeId } = req.body;
    const nodeCode = targetNodeId || 'M1-01';
    const firstUser = winnerEmail || 'employee.dev@spotmatrix.vn';
    const secondUser = challengerEmail || 'member.warning@spotmatrix.vn';

    const winLog = await recordAuditConcurrencyLog({
      eventCategory: 'OPTIMISTIC_LOCK_WIN',
      actorEmail: firstUser,
      targetNodeId: nodeCode,
      lockVersionAttempted: 2,
      outcomeStatus: 'SUCCESS',
      detailMessage: `User ${firstUser} chiếm Lock thành công tại ${nodeCode} (lockVersion tăng từ 1 -> 2, giữ chỗ 5 phút).`,
    });

    const rejectLog = await recordAuditConcurrencyLog({
      eventCategory: 'OPTIMISTIC_LOCK_REJECTED',
      actorEmail: secondUser,
      targetNodeId: nodeCode,
      lockVersionAttempted: 1,
      outcomeStatus: 'CONFLICT_BLOCKED',
      detailMessage: `User ${secondUser} bị từ chối tại ${nodeCode} do xung đột Optimistic Lock (gửi lockVersion=1 nhưng DB hiện tại là 2).`,
    });

    res.status(201).json({
      success: true,
      simulationSummary: `Đã mô phỏng thành công xung đột đặt chỗ đồng thời tại ${nodeCode}`,
      winnerEvent: winLog,
      rejectedEvent: rejectLog,
    });
  } catch (err) {
    next(err);
  }
}