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

// 1. Controllers cho Diem Tin Nhiem (Trust Score)
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
      throw createValidationException('Thieu userEmail hoac eventType (QR_CHECKIN_ONTIME | NO_SHOW_EXPIRED).');
    }
    const updatedProfile = await adjustUserTrustScore(userEmail, eventType, targetNodeId);
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
      throw createValidationException('Vui long cung cap userEmail de kiem tra diem tin nhiem.');
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

// 2. Controllers cho Thiet Bi Dung Chung (Shared Equipment Inventory)
export async function handleGetSharedEquipments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const statusFilter = req.query.status as EquipmentStatusType | undefined;
    const equipments = await listSharedEquipments(statusFilter);
    res.json({ success: true, totalCount: equipments.length, data: equipments });
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
      throw createValidationException('Thieu equipmentId hoac trang thai status (AVAILABLE | IN_USE | BROKEN).');
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

// 3. Controllers cho Chinh Sach & Han Muc (Quota & Policy Config)
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
    const updatedPolicy = await updateActivePolicyConfig(policyPayload, adminEmail);
    res.json({ success: true, data: updatedPolicy });
  } catch (err) {
    next(err);
  }
}

// 4. Controllers cho Nhat Ky Xung Dot & Truy Vet (Concurrency & Audit Logs)
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
    const nodeCode = targetNodeId || 'NODE-A01';
    const firstUser = winnerEmail || 'employee.dev@spotmatrix.vn';
    const secondUser = challengerEmail || 'member.warning@spotmatrix.vn';

    const winLog = await recordAuditConcurrencyLog({
      eventCategory: 'OPTIMISTIC_LOCK_WIN',
      actorEmail: firstUser,
      targetNodeId: nodeCode,
      lockVersionAttempted: 2,
      outcomeStatus: 'SUCCESS',
      detailMessage: `User ${firstUser} chiem Lock thanh cong tai ${nodeCode} (lockVersion tang tu 1 -> 2, giu cho 5 phut).`,
    });

    const rejectLog = await recordAuditConcurrencyLog({
      eventCategory: 'OPTIMISTIC_LOCK_REJECTED',
      actorEmail: secondUser,
      targetNodeId: nodeCode,
      lockVersionAttempted: 1,
      outcomeStatus: 'CONFLICT_BLOCKED',
      detailMessage: `User ${secondUser} bi tu choi tai ${nodeCode} do xung dot Optimistic Lock (gui lockVersion=1 nhung DB hien tai la 2).`,
    });

    res.status(201).json({
      success: true,
      simulationSummary: `Da mo phong thanh cong xung dot dat cho dong thoi tai ${nodeCode}`,
      winnerEvent: winLog,
      rejectedEvent: rejectLog,
    });
  } catch (err) {
    next(err);
  }
}
