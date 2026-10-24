import {
  BookingPayloadItem,
  RecurringOptionType,
  UserRoleType,
} from '../../../../Shared/Types/GlobalSystemTypes';
import { BookingRecordModel } from '../Models/BookingRecordModel';
import {
  buildNormalizedMeetingDateRange,
  formatIsoDateString,
  generateRecurringOccurrenceDates,
  validateSingleAndRecurringCollision,
} from '../Validators/BookingValidator';
import { getMongoConnectionState } from '../../../../Shared/Database/MongoConnection';
import {
  adjustUserTrustScore,
  recordAuditConcurrencyLog,
} from '../../../Datamanager/Function/Services/DatamanagerService';
import { createConflictException } from '../../../../Error/Function/Models/AppExceptionModel';

export interface RoomHoldLockState {
  nodeId: string;
  lockVersion: number;
  heldByEmail: string | null;
  heldByUsername: string | null;
  holdStartedAtIso: string | null;
  holdExpiresAtIso: string | null;
}

const roomOptimisticLockMap = new Map<string, RoomHoldLockState>();

const memoryBookingsFallback: BookingPayloadItem[] = [
  {
    bookingId: 'BK-2026-001',
    nodeId: 'M1-01',
    userEmail: 'employee.dev@spotmatrix.vn',
    requesterUsername: 'Employeedev123',
    requesterRole: 'EMPLOYEE',
    bookingDateIso: formatIsoDateString(new Date()),
    startTimeIso: '08:00',
    endTimeIso: '10:00',
    purposeNote: 'Họp Kiến trúc Hệ thống 3D (Tầng 1)',
    recurringOption: 'NONE',
    occurrenceDates: [formatIsoDateString(new Date())],
    lockVersion: 1,
    bookingStatus: 'CONFIRMED',
    approvalStatus: 'APPROVED',
    approvedByUsername: 'Managerlead123',
  },
  {
    bookingId: 'BK-2026-002',
    nodeId: 'H01-A3',
    userEmail: 'manager.lead@spotmatrix.vn',
    requesterUsername: 'Managerlead123',
    requesterRole: 'MANAGER',
    bookingDateIso: formatIsoDateString(new Date()),
    startTimeIso: '13:00',
    endTimeIso: '15:00',
    purposeNote: '[Hội trường Tầng 5 - Ghế H01-A3] Townhall Quý 4',
    recurringOption: 'NONE',
    occurrenceDates: [formatIsoDateString(new Date())],
    lockVersion: 2,
    bookingStatus: 'CHECKED_IN',
    approvalStatus: 'APPROVED',
    approvedByUsername: 'Systemadmin123',
    checkedInAtIso: '12:45:10 • Hôm nay',
  },
];

// 1. Lấy hoặc khởi tạo trạng thái Optimistic Lock + Hold 5 phút của 1 phòng/ghế
export function getOrInitRoomLockState(nodeId: string): RoomHoldLockState {
  const existing = roomOptimisticLockMap.get(nodeId);
  const nowMs = Date.now();

  if (existing) {
    if (
      existing.holdExpiresAtIso &&
      new Date(existing.holdExpiresAtIso).getTime() <= nowMs
    ) {
      const released: RoomHoldLockState = {
        ...existing,
        lockVersion: existing.lockVersion + 1,
        heldByEmail: null,
        heldByUsername: null,
        holdStartedAtIso: null,
        holdExpiresAtIso: null,
      };
      roomOptimisticLockMap.set(nodeId, released);
      return released;
    }
    return existing;
  }

  const initial: RoomHoldLockState = {
    nodeId,
    lockVersion: 1,
    heldByEmail: null,
    heldByUsername: null,
    holdStartedAtIso: null,
    holdExpiresAtIso: null,
  };
  roomOptimisticLockMap.set(nodeId, initial);
  return initial;
}

export function listAllRoomLockStates(): Record<string, RoomHoldLockState> {
  const result: Record<string, RoomHoldLockState> = {};
  roomOptimisticLockMap.forEach((_val, key) => {
    result[key] = getOrInitRoomLockState(key);
  });
  return result;
}

// 2. Giữ chỗ tạm thời 5 phút (Optimistic Locking: Kiểm tra lockVersion trước khi cấp quyền giữ chỗ)
export async function acquireFiveMinuteRoomHold(
  nodeId: string,
  userEmail: string,
  username: string,
  expectedLockVersion?: number
): Promise<RoomHoldLockState> {
  const currentLock = getOrInitRoomLockState(nodeId);

  if (
    expectedLockVersion !== undefined &&
    expectedLockVersion !== currentLock.lockVersion
  ) {
    await recordAuditConcurrencyLog({
      eventCategory: 'OPTIMISTIC_LOCK_REJECTED',
      actorEmail: userEmail,
      targetNodeId: nodeId,
      lockVersionAttempted: expectedLockVersion,
      outcomeStatus: 'CONFLICT_BLOCKED',
      detailMessage: `[Optimistic Lock Rejected] @${username} (${userEmail}) gửi lockVersion=${expectedLockVersion} nhưng vị trí ${nodeId} đã ở lockVersion=${currentLock.lockVersion}. Chặn ghi đè đồng thời!`,
    });
    throw createConflictException(
      `Xung đột Optimistic Locking! Vị trí ${nodeId} vừa được người khác cập nhật (Version hiện tại: v${currentLock.lockVersion}, Version bạn gửi: v${expectedLockVersion}).`
    );
  }

  if (
    currentLock.heldByEmail &&
    currentLock.heldByEmail.toLowerCase() !== userEmail.toLowerCase()
  ) {
    await recordAuditConcurrencyLog({
      eventCategory: 'OPTIMISTIC_LOCK_REJECTED',
      actorEmail: userEmail,
      targetNodeId: nodeId,
      lockVersionAttempted: currentLock.lockVersion,
      outcomeStatus: 'CONFLICT_BLOCKED',
      detailMessage: `[Hold 5p Blocked] @${username} không thể giữ chỗ ${nodeId} vì đang được giữ 5 phút bởi ${currentLock.heldByEmail}.`,
    });
    throw createConflictException(
      `Vị trí ${nodeId} đang được giữ chỗ tạm 5 phút bởi ${currentLock.heldByEmail}.`
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  const nextVersion = currentLock.lockVersion + 1;

  const updatedLock: RoomHoldLockState = {
    nodeId,
    lockVersion: nextVersion,
    heldByEmail: userEmail,
    heldByUsername: username,
    holdStartedAtIso: now.toISOString(),
    holdExpiresAtIso: expiresAt.toISOString(),
  };

  roomOptimisticLockMap.set(nodeId, updatedLock);

  await recordAuditConcurrencyLog({
    eventCategory: 'OPTIMISTIC_LOCK_WIN',
    actorEmail: userEmail,
    targetNodeId: nodeId,
    lockVersionAttempted: nextVersion,
    outcomeStatus: 'SUCCESS',
    detailMessage: `[Hold 5 Phút Thành Công] @${username} chiếm quyền giữ chỗ 5 phút tại ${nodeId} (lockVersion tăng từ v${currentLock.lockVersion} -> v${nextVersion}, hết hạn lúc ${expiresAt.toLocaleTimeString(
      'vi-VN'
    )}).`,
  });

  return updatedLock;
}

export async function releaseFiveMinuteRoomHold(
  nodeId: string,
  actorEmail: string,
  reason = 'USER_MANUAL_RELEASE'
): Promise<RoomHoldLockState> {
  const currentLock = getOrInitRoomLockState(nodeId);
  const nextVersion = currentLock.lockVersion + 1;

  const released: RoomHoldLockState = {
    nodeId,
    lockVersion: nextVersion,
    heldByEmail: null,
    heldByUsername: null,
    holdStartedAtIso: null,
    holdExpiresAtIso: null,
  };
  roomOptimisticLockMap.set(nodeId, released);

  await recordAuditConcurrencyLog({
    eventCategory: 'POLICY_CONFIG_UPDATED',
    actorEmail,
    targetNodeId: nodeId,
    lockVersionAttempted: nextVersion,
    outcomeStatus: 'SUCCESS',
    detailMessage: `[Nhả Giữ Chỗ 5 Phút] Đã giải phóng trạng thái Hold 5p tại ${nodeId} (Lý do: ${reason}, lockVersion -> v${nextVersion}).`,
  });

  return released;
}

// 3. Mô phỏng trực tiếp 2 người bấm đặt cùng 1 phòng tại cùng 1 mili-giây (Optimistic Locking Race)
export async function simulateConcurrentOptimisticRace(
  nodeId: string,
  winnerEmail: string,
  challengerEmail: string
): Promise<{
  nodeId: string;
  initialLockVersion: number;
  finalLockVersion: number;
  winnerEmail: string;
  challengerEmail: string;
  holdExpiresAtIso: string;
  summaryMessage: string;
}> {
  const currentLock = getOrInitRoomLockState(nodeId);
  const baseVersion = currentLock.lockVersion;

  const winnerLock = await acquireFiveMinuteRoomHold(
    nodeId,
    winnerEmail,
    winnerEmail.split('@')[0],
    baseVersion
  );

  await recordAuditConcurrencyLog({
    eventCategory: 'OPTIMISTIC_LOCK_REJECTED',
    actorEmail: challengerEmail,
    targetNodeId: nodeId,
    lockVersionAttempted: baseVersion,
    outcomeStatus: 'CONFLICT_BLOCKED',
    detailMessage: `[Chặn Đặt Trùng Đồng Thời - HTTP 409] ${challengerEmail} gửi lockVersion=v${baseVersion} cùng lúc nhưng ${winnerEmail} đã nâng khóa ${nodeId} lên v${winnerLock.lockVersion}.`,
  });

  return {
    nodeId,
    initialLockVersion: baseVersion,
    finalLockVersion: winnerLock.lockVersion,
    winnerEmail,
    challengerEmail,
    holdExpiresAtIso:
      winnerLock.holdExpiresAtIso || new Date(Date.now() + 300000).toISOString(),
    summaryMessage: `Optimistic Locking tại ${nodeId}: ${winnerEmail} thắng khóa (v${baseVersion} -> v${winnerLock.lockVersion}, giữ chỗ 5 phút). ${challengerEmail} gửi cùng v${baseVersion} bị từ chối (HTTP 409 Conflict)!`,
  };
}

export async function listAllWorkspaceBookings(): Promise<
  BookingPayloadItem[]
> {
  if (getMongoConnectionState()) {
    const count = await BookingRecordModel.countDocuments();
    if (count === 0) {
      await BookingRecordModel.insertMany(memoryBookingsFallback);
    }
    const docs = await BookingRecordModel.find().sort({ createdAt: -1 }).lean();
    return docs as unknown as BookingPayloadItem[];
  }
  return memoryBookingsFallback;
}

// 4. Tạo đơn đặt phòng mới (Hỗ trợ Đơn lẻ & Định kỳ + Kiểm tra Optimistic Lock + Va chạm lịch & Hạn mức tuần theo Role)
export async function createWorkspaceBooking(
  nodeId: string,
  userEmail: string,
  startTimeIso: string,
  endTimeIso: string,
  purposeNote: string,
  extraOptions?: {
    bookingId?: string;
    requesterUsername?: string;
    requesterRole?: UserRoleType;
    departmentName?: string;
    bookingDateIso?: string;
    recurringOption?: RecurringOptionType;
    expectedLockVersion?: number;
    approvalStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
    approvedByUsername?: string | null;
  }
): Promise<BookingPayloadItem> {
  const currentLock = getOrInitRoomLockState(nodeId);

  if (
    extraOptions?.expectedLockVersion !== undefined &&
    extraOptions.expectedLockVersion !== currentLock.lockVersion
  ) {
    await recordAuditConcurrencyLog({
      eventCategory: 'OPTIMISTIC_LOCK_REJECTED',
      actorEmail: userEmail,
      targetNodeId: nodeId,
      lockVersionAttempted: extraOptions.expectedLockVersion,
      outcomeStatus: 'CONFLICT_BLOCKED',
      detailMessage: `[Optimistic Lock Conflict] Đặt phòng ${nodeId} thất bại do lệch phiên bản khóa (Client gửi v${extraOptions.expectedLockVersion}, Server đang ở v${currentLock.lockVersion}).`,
    });
    throw createConflictException(
      `Xung đột Optimistic Locking tại ${nodeId}: Phiên bản dữ liệu đã thay đổi (v${currentLock.lockVersion}). Vui lòng thử lại.`
    );
  }

  const allExisting = await listAllWorkspaceBookings();
  const baseDateIso =
    extraOptions?.bookingDateIso || formatIsoDateString(new Date());
  const recurringOption: RecurringOptionType =
    extraOptions?.recurringOption || 'NONE';

  const collisionResult = validateSingleAndRecurringCollision(
    nodeId,
    baseDateIso,
    startTimeIso,
    endTimeIso,
    recurringOption,
    allExisting,
    userEmail,
    extraOptions?.requesterRole || 'EMPLOYEE'
  );

  if (collisionResult.hasCollision) {
    throw createConflictException(
      collisionResult.firstConflictMessage ||
        `Vị trí ${nodeId} bị trùng lịch đặt hoặc vượt hạn mức tuần trong khung giờ ${startTimeIso} - ${endTimeIso}.`
    );
  }

  const nextVersion = currentLock.lockVersion + 1;
  roomOptimisticLockMap.set(nodeId, {
    nodeId,
    lockVersion: nextVersion,
    heldByEmail: null,
    heldByUsername: null,
    holdStartedAtIso: null,
    holdExpiresAtIso: null,
  });

  const { noShowDeadlineTime } = buildNormalizedMeetingDateRange(
    baseDateIso,
    startTimeIso,
    endTimeIso
  );
  const occurrenceDates = generateRecurringOccurrenceDates(
    baseDateIso,
    recurringOption
  );

  const createdRecord: BookingPayloadItem = {
    bookingId:
      extraOptions?.bookingId || `BK-${Date.now().toString().slice(-4)}`,
    nodeId,
    userEmail,
    requesterUsername:
      extraOptions?.requesterUsername || userEmail.split('@')[0],
    requesterRole: extraOptions?.requesterRole || 'EMPLOYEE',
    departmentName: extraOptions?.departmentName || 'Product & Engineering',
    bookingDateIso: baseDateIso,
    startTimeIso,
    endTimeIso,
    purposeNote,
    recurringOption,
    recurringSeriesId:
      recurringOption !== 'NONE'
        ? `SERIES-${Date.now().toString().slice(-5)}`
        : null,
    occurrenceDates,
    lockVersion: nextVersion,
    holdExpiresAtIso: null,
    noShowDeadlineIso: noShowDeadlineTime.toISOString(),
    autoReleasedReason: null,
    bookingStatus: 'CONFIRMED',
    approvalStatus: extraOptions?.approvalStatus || 'APPROVED',
    approvedByUsername: extraOptions?.approvedByUsername ?? null,
  };

  if (getMongoConnectionState()) {
    await BookingRecordModel.findOneAndUpdate(
      { bookingId: createdRecord.bookingId },
      { $set: createdRecord },
      { upsert: true, new: true }
    );
  } else {
    memoryBookingsFallback.unshift(createdRecord);
  }

  await recordAuditConcurrencyLog({
    eventCategory: 'OPTIMISTIC_LOCK_WIN',
    actorEmail: userEmail,
    targetNodeId: nodeId,
    lockVersionAttempted: nextVersion,
    outcomeStatus: 'SUCCESS',
    detailMessage: `[Đặt Lịch Thành Công - Lock v${nextVersion}] @${createdRecord.requesterUsername} đặt ${nodeId} (${startTimeIso}-${endTimeIso}, Chu kỳ: ${recurringOption}, Số buổi: ${occurrenceDates.length}).`,
  });

  return createdRecord;
}

// 5. Cronjob quét tự động thu hồi phòng quá 15 phút không Check-in QR (No-Show Auto-Release)
export async function runFifteenMinuteNoShowCronSweep(options?: {
  forceTargetBookingId?: string;
}): Promise<{
  sweptAtIso: string;
  revokedCount: number;
  revokedBookingIds: string[];
  revokedBookings: BookingPayloadItem[];
}> {
  const now = new Date();
  const allBookings = await listAllWorkspaceBookings();
  const revokedBookings: BookingPayloadItem[] = [];

  for (const booking of allBookings) {
    if (booking.bookingStatus !== 'CONFIRMED') continue;
    if (booking.approvalStatus === 'REJECTED') continue;

    const isForcedTarget =
      options?.forceTargetBookingId &&
      booking.bookingId === options.forceTargetBookingId;

    const { noShowDeadlineTime } = buildNormalizedMeetingDateRange(
      booking.bookingDateIso || formatIsoDateString(now),
      booking.startTimeIso,
      booking.endTimeIso
    );

    if (isForcedTarget || now > noShowDeadlineTime) {
      const releaseReason = isForcedTarget
        ? 'CRON_15M_MANUAL_DEMO_SWEEP'
        : 'CRON_15M_NOSHOW_AUTO_RELEASE';

      if (getMongoConnectionState()) {
        await BookingRecordModel.findOneAndUpdate(
          { bookingId: booking.bookingId },
          {
            $set: {
              bookingStatus: 'CANCELLED',
              autoReleasedReason: releaseReason,
            },
          }
        );
      }

      const memItem = memoryBookingsFallback.find(
        (b) => b.bookingId === booking.bookingId
      );
      if (memItem) {
        memItem.bookingStatus = 'CANCELLED';
        memItem.autoReleasedReason = releaseReason;
      }

      const lockState = getOrInitRoomLockState(booking.nodeId);
      roomOptimisticLockMap.set(booking.nodeId, {
        ...lockState,
        lockVersion: lockState.lockVersion + 1,
        heldByEmail: null,
        heldByUsername: null,
        holdStartedAtIso: null,
        holdExpiresAtIso: null,
      });

      try {
        await adjustUserTrustScore(
          booking.userEmail,
          'NO_SHOW_EXPIRED',
          booking.nodeId
        );
      } catch {
        // Bỏ qua nếu email chưa có trong bảng trust profile
      }

      await recordAuditConcurrencyLog({
        eventCategory: 'AUTO_RELEASE_NO_SHOW',
        actorEmail: booking.userEmail,
        targetNodeId: booking.nodeId,
        lockVersionAttempted: lockState.lockVersion + 1,
        outcomeStatus: 'AUTO_REVOKED',
        detailMessage: `[Cronjob 15p Tự Thu Hồi Chỗ] Vé ${booking.bookingId} (${booking.nodeId}, ca ${booking.startTimeIso}-${booking.endTimeIso}) quá 15 phút không quét QR Check-in. Đã tự động hủy vé, mở trống phòng và trừ 10 điểm tín nhiệm của ${booking.userEmail}.`,
      });

      revokedBookings.push({
        ...booking,
        bookingStatus: 'CANCELLED',
        autoReleasedReason: releaseReason,
      });
    }
  }

  return {
    sweptAtIso: now.toISOString(),
    revokedCount: revokedBookings.length,
    revokedBookingIds: revokedBookings.map((b) => b.bookingId),
    revokedBookings,
  };
}

let cronIntervalHandle: ReturnType<typeof setInterval> | null = null;

export function startBookingBackgroundCronJobs(): void {
  if (cronIntervalHandle) return;
  cronIntervalHandle = setInterval(() => {
    runFifteenMinuteNoShowCronSweep().catch(() => {});
  }, 30 * 1000);
}