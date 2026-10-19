import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Clock,
  QrCode,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Layers,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Check,
  Lock,
  Timer,
  Repeat,
  Zap,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import {
  AuditEventCategoryType,
  BookingPayloadItem,
  RecurringOptionType,
  SeatStatusType,
  UserRoleType,
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';
import { SpotMatrixLogo } from '../../../Shared/Components/SpotMatrixLogo';
import {
  buildNormalizedMeetingDateRange,
  formatIsoDateString,
  validateSingleAndRecurringCollision,
} from '../Function/Validators/BookingValidator';

export interface BookingTimeWindowInput {
  start: string;
  end: string;
  dateIso?: string;
  recurringOption?: RecurringOptionType;
  occurrenceDates?: string[];
  lockVersion?: number;
}

export interface BookingCalendarPagesProps {
  bookingsList: BookingPayloadItem[];
  workspaceNodes: WorkspaceNodeItem[];
  selectedNode: WorkspaceNodeItem | null;
  preselectedSlot?: { start: string; end: string } | null;
  userEmail: string;
  userRole: UserRoleType;
  isDark: boolean;
  onCreateNewBooking: (
    email: string,
    purpose: string,
    targetCode?: string,
    timeWindow?: BookingTimeWindowInput
  ) => void;
  onCheckInBooking: (bookingId: string, exactScanTimeText?: string) => void;
  onCancelBooking: (bookingId: string) => void;
  onUpdateNodeStatus?: (nodeId: string, nextStatus: SeatStatusType) => void;
  onRecordConcurrencyAudit?: (
    eventCategory: AuditEventCategoryType,
    actorEmail: string,
    targetNodeId: string,
    detailMessage: string,
    outcomeStatus?: 'SUCCESS' | 'CONFLICT_BLOCKED' | 'AUTO_REVOKED',
    lockVersionAttempted?: number
  ) => void;
  onPenalizeNoShowBooking?: (bookingId: string, userEmail: string, nodeCode: string) => void;
}

interface ActiveHoldTimerState {
  nodeCode: string;
  nodeId: string;
  heldByEmail: string;
  lockVersion: number;
  expiresAtMs: number;
}

interface RaceSimulationBannerState {
  nodeCode: string;
  initialVersion: number;
  finalVersion: number;
  winnerEmail: string;
  challengerEmail: string;
  timestampText: string;
}

const AMPHITHEATER_SEATS = [
  'H01-A1',
  'H01-A2',
  'H01-A3',
  'H01-A4',
  'H01-A5',
  'H01-A6',
  'H01-B1',
  'H01-B2',
  'H01-B3',
  'H01-B4',
  'H01-B5',
  'H01-B6',
  'H01-B7',
  'H01-B8',
];

export const BookingCalendarPages: React.FC<BookingCalendarPagesProps> = ({
  bookingsList,
  workspaceNodes,
  selectedNode,
  preselectedSlot,
  userEmail,
  userRole,
  isDark,
  onCreateNewBooking,
  onCheckInBooking,
  onCancelBooking,
  onUpdateNodeStatus,
  onRecordConcurrencyAudit,
  onPenalizeNoShowBooking,
}) => {
  const [selectedRoomCode, setSelectedRoomCode] = useState<string>(
    selectedNode?.nodeCode || workspaceNodes[0]?.nodeCode || 'M1-01'
  );
  const [selectedAmphitheaterSeat, setSelectedAmphitheaterSeat] = useState<string>('H01-A1');
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatIsoDateString(new Date())
  );
  const [startTime, setStartTime] = useState<string>(preselectedSlot?.start || '08:00');
  const [endTime, setEndTime] = useState<string>(preselectedSlot?.end || '10:00');
  const [purposeTitle, setPurposeTitle] = useState<string>(
    'Họp triển khai dự án & Review Kiến trúc Hệ thống'
  );
  const [recurringOption, setRecurringOption] = useState<RecurringOptionType>('NONE');
  const [selectedBookingForQr, setSelectedBookingForQr] = useState<string>(
    bookingsList[0]?.bookingId || ''
  );

  const [roomLockVersions, setRoomLockVersions] = useState<Record<string, number>>({
    'M1-01': 1,
    'M1-02': 2,
    'H-01': 1,
  });
  const [activeHoldMap, setActiveHoldMap] = useState<Record<string, ActiveHoldTimerState>>({});
  const [nowTickMs, setNowTickMs] = useState<number>(() => Date.now());
  const [raceSimResult, setRaceSimResult] = useState<RaceSimulationBannerState | null>(null);
  const [cronSweepBanner, setCronSweepBanner] = useState<string | null>(null);

  const [checkinErrorAlert, setCheckinErrorAlert] = useState<string | null>(null);
  const [bookingFormError, setBookingFormError] = useState<string | null>(null);
  const [bookingSuccessBanner, setBookingSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    if (selectedNode?.nodeCode) {
      setSelectedRoomCode(selectedNode.nodeCode);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (preselectedSlot?.start && preselectedSlot?.end) {
      setStartTime(preselectedSlot.start);
      setEndTime(preselectedSlot.end);
    }
  }, [preselectedSlot]);

  const bookingsCount = bookingsList.length;
  const newestBookingId = bookingsList[0]?.bookingId || '';
  useEffect(() => {
    if (bookingsCount === 0) {
      setSelectedBookingForQr('');
      return;
    }
    if (newestBookingId) {
      setSelectedBookingForQr(newestBookingId);
    }
  }, [bookingsCount, newestBookingId]);

  const currentRoomNode = useMemo(() => {
    return (
      workspaceNodes.find((item) => item.nodeCode === selectedRoomCode) ||
      selectedNode ||
      workspaceNodes[0]
    );
  }, [workspaceNodes, selectedRoomCode, selectedNode]);

  const isAmphitheaterSelected =
    currentRoomNode?.floorLevel === 5 || currentRoomNode?.nodeCode === 'H-01';

  const targetBookableCode = isAmphitheaterSelected
    ? selectedAmphitheaterSeat
    : currentRoomNode?.nodeCode || 'M1-01';

  const currentTargetLockVersion = roomLockVersions[targetBookableCode] || 1;
  const activeHoldForTarget = activeHoldMap[targetBookableCode] || null;

  const handleReleaseHoldInternal = useCallback(
    (codeToRelease: string, reasonText: string) => {
      const holdItem = activeHoldMap[codeToRelease];
      if (!holdItem) return;

      const nextVer = (roomLockVersions[codeToRelease] || 1) + 1;
      setRoomLockVersions((prev) => ({ ...prev, [codeToRelease]: nextVer }));
      setActiveHoldMap((prev) => {
        const clone = { ...prev };
        delete clone[codeToRelease];
        return clone;
      });

      if (onUpdateNodeStatus && holdItem.nodeId) {
        onUpdateNodeStatus(holdItem.nodeId, 'AVAILABLE');
      }

      onRecordConcurrencyAudit?.(
        'POLICY_CONFIG_UPDATED',
        holdItem.heldByEmail,
        codeToRelease,
        `[Hết hạn / Nhả Giữ chỗ 5 Phút] Vị trí ${codeToRelease} đã tự động chuyển về Trống (${reasonText}, lockVersion -> v${nextVer}).`,
        'SUCCESS',
        nextVer
      );

      fetch(`/api/v1/bookings/hold/${encodeURIComponent(codeToRelease)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: holdItem.heldByEmail, reason: reasonText }),
      }).catch(() => {});
    },
    [activeHoldMap, roomLockVersions, onUpdateNodeStatus, onRecordConcurrencyAudit]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const currentMs = Date.now();
      setNowTickMs(currentMs);

      Object.values(activeHoldMap).forEach((holdItem) => {
        if (holdItem.expiresAtMs <= currentMs) {
          handleReleaseHoldInternal(holdItem.nodeCode, 'TIMEOUT_5_MINUTES_EXPIRED');
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeHoldMap, handleReleaseHoldInternal]);

  // 1. Bắt đầu Giữ chỗ 5 phút (Hold 5p) kèm Optimistic Locking
  const handleStartFiveMinuteHold = async () => {
    if (!currentRoomNode) return;
    setBookingFormError(null);
    setBookingSuccessBanner(null);

    const expectedVersion = currentTargetLockVersion;
    const nextVersion = expectedVersion + 1;
    const expiresAtMs = Date.now() + 5 * 60 * 1000;

    setRoomLockVersions((prev) => ({
      ...prev,
      [targetBookableCode]: nextVersion,
    }));

    setActiveHoldMap((prev) => ({
      ...prev,
      [targetBookableCode]: {
        nodeCode: targetBookableCode,
        nodeId: currentRoomNode.nodeId,
        heldByEmail: userEmail,
        lockVersion: nextVersion,
        expiresAtMs,
      },
    }));

    onUpdateNodeStatus?.(currentRoomNode.nodeId, 'HOLDING');
    onRecordConcurrencyAudit?.(
      'OPTIMISTIC_LOCK_WIN',
      userEmail,
      targetBookableCode,
      `[Giữ chỗ 5 Phút - Optimistic Lock] ${userEmail} khóa tạm 5 phút vị trí ${targetBookableCode} thành công (lockVersion: v${expectedVersion} -> v${nextVersion}).`,
      'SUCCESS',
      nextVersion
    );

    setBookingSuccessBanner(
      `Đã kích hoạt giữ chỗ 5 phút (Hold 5p) cho vị trí ${targetBookableCode} (Lock Version: v${expectedVersion} → v${nextVersion}). Bạn có 05:00 để hoàn tất đặt lịch.`
    );

    try {
      await fetch('/api/v1/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: targetBookableCode,
          userEmail,
          username: userEmail.split('@')[0],
          expectedLockVersion: expectedVersion,
        }),
      });
    } catch {
      // Giữ trạng thái local
    }
  };

  // 2. Mô phỏng 2 người bấm đặt cùng 1 vị trí tại cùng 1 thời điểm (Test Optimistic Locking)
  const handleSimulateOptimisticLockRace = async () => {
    if (!currentRoomNode) return;
    setBookingFormError(null);

    const baseVer = currentTargetLockVersion;
    const winnerVer = baseVer + 1;
    const challengerEmail = 'challenger.concurrent@spotmatrix.vn';
    const expiresAtMs = Date.now() + 5 * 60 * 1000;

    setRoomLockVersions((prev) => ({
      ...prev,
      [targetBookableCode]: winnerVer,
    }));

    setActiveHoldMap((prev) => ({
      ...prev,
      [targetBookableCode]: {
        nodeCode: targetBookableCode,
        nodeId: currentRoomNode.nodeId,
        heldByEmail: userEmail,
        lockVersion: winnerVer,
        expiresAtMs,
      },
    }));

    onUpdateNodeStatus?.(currentRoomNode.nodeId, 'HOLDING');

    onRecordConcurrencyAudit?.(
      'OPTIMISTIC_LOCK_WIN',
      userEmail,
      targetBookableCode,
      `[Optimistic Lock WIN] Request #1 từ ${userEmail} gửi lockVersion=v${baseVer} khớp DB -> Nâng khóa ${targetBookableCode} lên v${winnerVer} và giữ chỗ 5 phút.`,
      'SUCCESS',
      winnerVer
    );

    onRecordConcurrencyAudit?.(
      'OPTIMISTIC_LOCK_REJECTED',
      challengerEmail,
      targetBookableCode,
      `[Optimistic Lock REJECTED - HTTP 409] Request #2 từ ${challengerEmail} gửi cùng lockVersion=v${baseVer} nhưng DB đã ở v${winnerVer}. Hệ thống tự động chặn đặt trùng!`,
      'CONFLICT_BLOCKED',
      baseVer
    );

    setRaceSimResult({
      nodeCode: targetBookableCode,
      initialVersion: baseVer,
      finalVersion: winnerVer,
      winnerEmail: userEmail,
      challengerEmail,
      timestampText: new Date().toLocaleTimeString('vi-VN'),
    });

    try {
      await fetch('/api/v1/bookings/simulate-race', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: targetBookableCode,
          winnerEmail: userEmail,
          challengerEmail,
        }),
      });
    } catch {
      // Giữ kết quả mô phỏng trên giao diện
    }
  };

  // 3. Kiểm tra va chạm lịch Đơn lẻ (Single) & Định kỳ (Recurring)
  const liveCollisionValidation = useMemo(() => {
    return validateSingleAndRecurringCollision(
      targetBookableCode,
      selectedDate,
      startTime,
      endTime,
      recurringOption,
      bookingsList
    );
  }, [
    targetBookableCode,
    selectedDate,
    startTime,
    endTime,
    recurringOption,
    bookingsList,
  ]);

  const validateCheckinTimeWindow = (
    booking: BookingPayloadItem
  ): {
    allowed: boolean;
    reason: string;
    windowLabel: string;
    noShowDeadlineLabel: string;
    secondsUntilNoShowRevoke: number;
  } => {
    const now = new Date(nowTickMs);
    const bookingDateStr = booking.bookingDateIso || formatIsoDateString(now);
    const {
      startDateObj,
      endDateObj,
      earliestCheckinTime,
      noShowDeadlineTime,
    } = buildNormalizedMeetingDateRange(
      bookingDateStr,
      booking.startTimeIso,
      booking.endTimeIso
    );

    const earliestStr = `${String(earliestCheckinTime.getHours()).padStart(2, '0')}:${String(
      earliestCheckinTime.getMinutes()
    ).padStart(2, '0')}`;
    const startStr = `${String(startDateObj.getHours()).padStart(2, '0')}:${String(
      startDateObj.getMinutes()
    ).padStart(2, '0')}`;
    const endStr = `${String(endDateObj.getHours()).padStart(2, '0')}:${String(
      endDateObj.getMinutes()
    ).padStart(2, '0')}`;
    const deadlineStr = `${String(noShowDeadlineTime.getHours()).padStart(2, '0')}:${String(
      noShowDeadlineTime.getMinutes()
    ).padStart(2, '0')}`;

    const windowLabel = `${earliestStr} – ${endStr}`;
    const secondsUntilNoShowRevoke = Math.floor(
      (noShowDeadlineTime.getTime() - now.getTime()) / 1000
    );

    if (now < earliestCheckinTime) {
      return {
        allowed: false,
        reason: `Chưa đến giờ mở Check-in! Quy định chỉ nhận Check-in sớm tối đa 2 tiếng trước giờ bắt đầu (Mở cổng từ ${earliestStr} đến ${startStr}).`,
        windowLabel,
        noShowDeadlineLabel: deadlineStr,
        secondsUntilNoShowRevoke,
      };
    }

    if (now > endDateObj) {
      return {
        allowed: false,
        reason: `Ca họp (${booking.startTimeIso} - ${booking.endTimeIso}) đã kết thúc, không thể Check-in.`,
        windowLabel,
        noShowDeadlineLabel: deadlineStr,
        secondsUntilNoShowRevoke,
      };
    }

    return {
      allowed: true,
      reason: `Đang trong khung giờ Check-in hợp lệ (${earliestStr} – ${endStr}).`,
      windowLabel,
      noShowDeadlineLabel: deadlineStr,
      secondsUntilNoShowRevoke,
    };
  };

  // 4. Thực thi Cronjob 15 phút tự thu hồi chỗ đối với vé quá hạn không Check-in
  const handleRunFifteenMinuteCronSweep = async (forceBookingId?: string) => {
    const targetBooking = forceBookingId
      ? bookingsList.find((b) => b.bookingId === forceBookingId)
      : bookingsList.find((b) => {
          if (b.bookingStatus !== 'CONFIRMED' || b.approvalStatus === 'REJECTED') return false;
          const check = validateCheckinTimeWindow(b);
          return check.secondsUntilNoShowRevoke <= 0;
        }) ||
        bookingsList.find(
          (b) => b.bookingId === selectedBookingForQr && b.bookingStatus === 'CONFIRMED'
        );

    if (!targetBooking) {
      setCronSweepBanner(
        'Cronjob 15p đã quét toàn bộ danh sách: Hiện không có vé nào vi phạm quá hạn 15 phút chưa Check-in.'
      );
      return;
    }

    if (targetBooking.bookingStatus === 'CHECKED_IN') {
      setCronSweepBanner(
        `Vé ${targetBooking.bookingId} (${targetBooking.nodeId}) đã quét QR Check-in đúng hạn nên được bảo toàn vị trí!`
      );
      return;
    }

    const nextVer = (roomLockVersions[targetBooking.nodeId] || 1) + 1;
    setRoomLockVersions((prev) => ({
      ...prev,
      [targetBooking.nodeId]: nextVer,
    }));

    if (onPenalizeNoShowBooking) {
      onPenalizeNoShowBooking(
        targetBooking.bookingId,
        targetBooking.userEmail,
        targetBooking.nodeId
      );
    } else {
      onCancelBooking(targetBooking.bookingId);
    }

    const matchedRoom = workspaceNodes.find((n) => n.nodeCode === targetBooking.nodeId);
    if (matchedRoom && onUpdateNodeStatus) {
      onUpdateNodeStatus(matchedRoom.nodeId, 'AVAILABLE');
    }

    onRecordConcurrencyAudit?.(
      'AUTO_RELEASE_NO_SHOW',
      targetBooking.userEmail,
      targetBooking.nodeId,
      `[Cronjob 15 Phút Tự Thu Hồi Chỗ] Vé ${targetBooking.bookingId} tại ${targetBooking.nodeId} (${targetBooking.startTimeIso}-${targetBooking.endTimeIso}) quá 15 phút không Check-in QR. Đã tự động thu hồi phòng, tăng Lock lên v${nextVer} và trừ 10 điểm tín nhiệm của ${targetBooking.userEmail}.`,
      'AUTO_REVOKED',
      nextVer
    );

    setCronSweepBanner(
      `[Cronjob 15p Tự Thu Hồi Thành Công] Đã thu hồi vé ${targetBooking.bookingId} (${targetBooking.nodeId}) do quá 15 phút không quét QR Check-in, giải phóng phòng về Trống (Lock v${nextVer}) và trừ 10 điểm tín nhiệm của ${targetBooking.userEmail}!`
    );

    try {
      await fetch('/api/v1/bookings/cron/sweep-noshow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceTargetBookingId: targetBooking.bookingId }),
      });
    } catch {
      // Giữ kết quả trên client
    }
  };

  const occupiedAmphitheaterSeatsInSlot = useMemo(() => {
    const occupiedSet = new Set<string>();
    if (!isAmphitheaterSelected) return occupiedSet;

    const candidateRange = buildNormalizedMeetingDateRange(selectedDate, startTime, endTime);
    for (const item of bookingsList) {
      if (item.approvalStatus === 'REJECTED' || item.bookingStatus === 'CANCELLED') continue;
      const itemDate = item.bookingDateIso || formatIsoDateString(new Date());
      if (itemDate !== selectedDate) continue;
      if (!AMPHITHEATER_SEATS.includes(item.nodeId)) continue;

      const existingRange = buildNormalizedMeetingDateRange(
        itemDate,
        item.startTimeIso,
        item.endTimeIso
      );
      if (
        candidateRange.startDateObj < existingRange.endDateObj &&
        candidateRange.endDateObj > existingRange.startDateObj
      ) {
        occupiedSet.add(item.nodeId);
      }
    }
    return occupiedSet;
  }, [isAmphitheaterSelected, selectedDate, startTime, endTime, bookingsList]);

  const handleFillQuickCheckinSlot = () => {
    const now = new Date();
    const startCandidate = new Date(now.getTime() + 30 * 60 * 1000);
    const endCandidate = new Date(now.getTime() + 90 * 60 * 1000);

    const startStr = `${String(startCandidate.getHours()).padStart(2, '0')}:${String(
      startCandidate.getMinutes()
    ).padStart(2, '0')}`;
    const endStr = `${String(endCandidate.getHours()).padStart(2, '0')}:${String(
      endCandidate.getMinutes()
    ).padStart(2, '0')}`;

    setSelectedDate(formatIsoDateString(startCandidate));
    setStartTime(startStr);
    setEndTime(endStr);
    setBookingFormError(null);
    setCheckinErrorAlert(null);
  };

  const handleCreateBookingSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentRoomNode) return;

    setBookingFormError(null);
    setBookingSuccessBanner(null);
    setCheckinErrorAlert(null);

    const finalCode = targetBookableCode;
    const finalLabel = isAmphitheaterSelected
      ? `[Hội trường Tầng 5 - Ghế ${selectedAmphitheaterSeat}] ${purposeTitle}`
      : purposeTitle;

    const existingHold = activeHoldMap[finalCode];
    if (
      existingHold &&
      existingHold.heldByEmail.toLowerCase() !== userEmail.toLowerCase() &&
      existingHold.expiresAtMs > Date.now()
    ) {
      setBookingFormError(
        `[Optimistic Lock Blocked] Vị trí ${finalCode} đang được giữ chỗ 5 phút bởi ${existingHold.heldByEmail} (Lock v${existingHold.lockVersion}).`
      );
      return;
    }

    if (liveCollisionValidation.hasCollision) {
      setBookingFormError(
        liveCollisionValidation.firstConflictMessage ||
          `Phát hiện va chạm lịch tại vị trí ${finalCode}. Vui lòng chọn khung giờ khác.`
      );
      return;
    }

    const nextLockVer = currentTargetLockVersion + 1;
    setRoomLockVersions((prev) => ({
      ...prev,
      [finalCode]: nextLockVer,
    }));

    if (activeHoldMap[finalCode]) {
      setActiveHoldMap((prev) => {
        const clone = { ...prev };
        delete clone[finalCode];
        return clone;
      });
    }

    onCreateNewBooking(userEmail, finalLabel, finalCode, {
      start: startTime,
      end: endTime,
      dateIso: selectedDate,
      recurringOption,
      occurrenceDates: liveCollisionValidation.occurrenceDates,
      lockVersion: nextLockVer,
    });

    const cycleLabel =
      recurringOption === 'NONE'
        ? 'Đơn lẻ (1 buổi)'
        : recurringOption === 'DAILY'
        ? `Định kỳ Hàng ngày (${liveCollisionValidation.occurrenceDates.length} buổi)`
        : recurringOption === 'WEEKLY'
        ? `Định kỳ Hàng tuần (${liveCollisionValidation.occurrenceDates.length} tuần)`
        : `Định kỳ Hàng tháng (${liveCollisionValidation.occurrenceDates.length} tháng)`;

    setBookingSuccessBanner(
      userRole === 'EMPLOYEE'
        ? `Đã gửi yêu cầu đặt vị trí ${finalCode} (${startTime} – ${endTime}, ${cycleLabel}, Lock v${nextLockVer}) lên MongoDB. Đang chờ Quản lý hoặc Admin phê duyệt.`
        : `Đã xác nhận đặt vị trí ${finalCode} (${startTime} – ${endTime}, ${cycleLabel}, Lock v${nextLockVer}) và đồng bộ lên MongoDB.`
    );
  };

  const activeQrBooking = useMemo(() => {
    return (
      bookingsList.find((item) => item.bookingId === selectedBookingForQr) || bookingsList[0]
    );
  }, [bookingsList, selectedBookingForQr]);

  const activeBookingTimeValidation = useMemo(() => {
    if (!activeQrBooking) return null;
    return validateCheckinTimeWindow(activeQrBooking);
  }, [activeQrBooking, nowTickMs]);

  const qrTargetCheckinUrl = useMemo(() => {
    if (!activeQrBooking) return `${window.location.origin}/qr-checkin`;
    const params = new URLSearchParams({
      bookingId: activeQrBooking.bookingId,
      room: activeQrBooking.nodeId,
      slot: `${activeQrBooking.startTimeIso} - ${activeQrBooking.endTimeIso}`,
      date: activeQrBooking.bookingDateIso || formatIsoDateString(new Date()),
      email: activeQrBooking.userEmail,
      title: activeQrBooking.purposeNote,
    });
    return `${window.location.origin}/qr-checkin?${params.toString()}`;
  }, [activeQrBooking]);

  const realQrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&ecc=H&margin=2&data=${encodeURIComponent(
    qrTargetCheckinUrl
  )}`;

  const handleAttemptDemoQrScan = () => {
    if (!activeQrBooking) return;
    setCheckinErrorAlert(null);

    if (activeQrBooking.approvalStatus === 'PENDING_APPROVAL') {
      setCheckinErrorAlert(
        'Yêu cầu đặt phòng này đang chờ Quản lý (Manager) hoặc Admin phê duyệt. Chưa thể quét mã Check-in!'
      );
      return;
    }

    if (activeQrBooking.approvalStatus === 'REJECTED') {
      setCheckinErrorAlert('Yêu cầu đặt phòng này đã bị từ chối. Mã QR đã bị vô hiệu hóa!');
      return;
    }

    const timeCheck = validateCheckinTimeWindow(activeQrBooking);
    if (!timeCheck.allowed) {
      setCheckinErrorAlert(timeCheck.reason);
      return;
    }

    const now = new Date();
    const frozenTime = `${now.toLocaleTimeString('vi-VN')} • Ngày ${now.toLocaleDateString('vi-VN')}`;
    onCheckInBooking(activeQrBooking.bookingId, frozenTime);
    window.open(qrTargetCheckinUrl, '_blank', 'noopener,noreferrer');
  };

  const holdRemainingSeconds = activeHoldForTarget
    ? Math.max(0, Math.ceil((activeHoldForTarget.expiresAtMs - nowTickMs) / 1000))
    : 0;
  const holdMinutesPart = String(Math.floor(holdRemainingSeconds / 60)).padStart(2, '0');
  const holdSecondsPart = String(holdRemainingSeconds % 60).padStart(2, '0');
  const holdProgressPercent = Math.min(100, Math.round((holdRemainingSeconds / 300) * 100));

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div
        className={`p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              isDark
                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                : 'bg-indigo-50 border-indigo-100 text-indigo-600'
            }`}
          >
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Giai đoạn 3 — Đặt chỗ Thời gian thực, Giữ chỗ 5 phút & Chống trùng lịch
            </h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Optimistic Locking (v{currentTargetLockVersion}) • Đếm ngược 5 phút giữ chỗ • Kiểm tra
              va chạm Đơn lẻ & Định kỳ • Cronjob 15 phút tự thu hồi No-Show
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleFillQuickCheckinSlot}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isDark
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Điền nhanh Giờ Test Check-in Ngay
          </button>

          <span
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              isDark
                ? 'bg-teal-500/10 border-teal-500/20 text-teal-300'
                : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            {targetBookableCode} • Lock v{currentTargetLockVersion}
          </span>
        </div>
      </div>

      {/* THANH CÔNG CỤ GIAI ĐOẠN 3: GIỮ CHỖ 5 PHÚT, OPTIMISTIC LOCKING & CRONJOB 15 PHÚT */}
      <div
        className={`p-5 rounded-3xl border space-y-4 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-indigo-600 text-white flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Optimistic Lock: v{currentTargetLockVersion}
            </span>
            <span
              className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
            >
              Điều khiển Giữ chỗ 5 phút (Hold 5p), Chống đặt trùng đồng thời & Cronjob 15 phút
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!activeHoldForTarget ? (
              <button
                type="button"
                onClick={handleStartFiveMinuteHold}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5 transition"
              >
                <Timer className="w-3.5 h-3.5" />
                Giữ chỗ tạm 5 phút ({targetBookableCode})
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleReleaseHoldInternal(targetBookableCode, 'DEMO_FAST_FORWARD_5M_TIMEOUT')
                  }
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 hover:bg-amber-500/25 flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tua hết 5p (Test Tự Nhả Chỗ)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleReleaseHoldInternal(targetBookableCode, 'USER_MANUAL_RELEASE')
                  }
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 hover:bg-rose-500/25 transition"
                >
                  Nhả giữ chỗ
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleSimulateOptimisticLockRace}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                isDark
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Mô phỏng 2 Người Đặt Cùng Lúc (Optimistic Lock)
            </button>

            <button
              type="button"
              onClick={() => handleRunFifteenMinuteCronSweep(activeQrBooking?.bookingId)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                isDark
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
                  : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Chạy Cronjob 15p Thu Hồi No-Show Ngay
            </button>
          </div>
        </div>

        {activeHoldForTarget && (
          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? 'bg-amber-950/25 border-amber-500/30 text-amber-200'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>
                  Đang giữ chỗ tạm thời 5 phút cho vị trí{' '}
                  <strong>{activeHoldForTarget.nodeCode}</strong> • Người giữ:{' '}
                  <strong>{activeHoldForTarget.heldByEmail}</strong> (Lock v
                  {activeHoldForTarget.lockVersion})
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-xs font-extrabold tracking-wider">
                Còn lại: {holdMinutesPart}:{holdSecondsPart}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-amber-200/60 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-700"
                style={{ width: `${holdProgressPercent}%` }}
              />
            </div>
          </div>
        )}

        {raceSimResult && (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark
                ? 'bg-indigo-950/30 border-indigo-500/30 text-slate-200'
                : 'bg-indigo-50/70 border-indigo-200 text-slate-800'
            }`}
          >
            <div className="space-y-1 text-xs">
              <div className="font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Kết quả Kiểm thử Optimistic Locking tại {raceSimResult.nodeCode} (Lúc{' '}
                {raceSimResult.timestampText}):
              </div>
              <p>
                • <strong>Request #1 ({raceSimResult.winnerEmail})</strong> gửi{' '}
                <code>expectedLockVersion=v{raceSimResult.initialVersion}</code> →{' '}
                <span className="text-teal-600 dark:text-teal-400 font-bold">
                  THÀNH CÔNG (Nâng khóa lên v{raceSimResult.finalVersion} & giữ chỗ 5 phút)
                </span>
              </p>
              <p>
                • <strong>Request #2 ({raceSimResult.challengerEmail})</strong> gửi cùng{' '}
                <code>expectedLockVersion=v{raceSimResult.initialVersion}</code> →{' '}
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  BỊ CHẶN (HTTP 409 Conflict do DB đã ở v{raceSimResult.finalVersion})
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRaceSimResult(null)}
              className="text-xs font-bold underline opacity-75 hover:opacity-100 self-end sm:self-center shrink-0"
            >
              Đóng
            </button>
          </div>
        )}

        {cronSweepBanner && (
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold ${
              isDark
                ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{cronSweepBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setCronSweepBanner(null)}
              className="text-[11px] underline shrink-0"
            >
              Đóng
            </button>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`lg:col-span-7 p-6 rounded-3xl border flex flex-col justify-between ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <form onSubmit={handleCreateBookingSubmit} className="space-y-5">
            {bookingFormError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{bookingFormError}</span>
              </div>
            )}

            {bookingSuccessBanner && (
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-semibold flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
                  <span>{bookingSuccessBanner}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingSuccessBanner(null)}
                  className="text-[11px] underline opacity-75 hover:opacity-100"
                >
                  Đóng
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  1. Chọn Phòng họp (Tầng 1–4) hoặc Hội trường (Tầng 5)
                </label>
                <select
                  value={selectedRoomCode}
                  onChange={(e) => {
                    setSelectedRoomCode(e.target.value);
                    setBookingFormError(null);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {[1, 2, 3, 4, 5].map((floorNum) => (
                    <optgroup
                      key={floorNum}
                      label={
                        floorNum === 5
                          ? 'Tầng 5 — Hội trường Lớn Đấu Trường La Mã'
                          : `Tầng ${floorNum} — Khu Phòng họp Chính thức`
                      }
                    >
                      {workspaceNodes
                        .filter((n) => n.floorLevel === floorNum)
                        .map((room) => (
                          <option key={room.nodeId} value={room.nodeCode}>
                            [Tầng {room.floorLevel}] {room.nodeCode} — {room.nodeLabel} (
                            {room.capacityCount} chỗ)
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  2. Ngày bắt đầu họp
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setBookingFormError(null);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Giờ bắt đầu (24h)
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setBookingFormError(null);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Giờ kết thúc (24h)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setBookingFormError(null);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Chu kỳ đặt lịch (Đơn lẻ / Định kỳ)
                </label>
                <select
                  value={recurringOption}
                  onChange={(e) =>
                    setRecurringOption(e.target.value as RecurringOptionType)
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="NONE">Đặt đơn lẻ (1 lần duy nhất)</option>
                  <option value="DAILY">Lặp hàng ngày (5 ngày liên tiếp)</option>
                  <option value="WEEKLY">Lặp hàng tuần (4 tuần cùng thứ)</option>
                  <option value="MONTHLY">Lặp hàng tháng (3 tháng liên tiếp)</option>
                </select>
              </div>
            </div>

            {/* MA TRẬN KIỂM TRA VA CHẠM LỊCH ĐƠN LẺ & ĐỊNH KỲ */}
            <div
              className={`p-4 rounded-2xl border ${
                liveCollisionValidation.hasCollision
                  ? isDark
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-rose-50/70 border-rose-200'
                  : isDark
                  ? 'bg-slate-950/90 border-slate-800'
                  : 'bg-teal-50/40 border-teal-200/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <Repeat
                    className={`w-4 h-4 ${
                      liveCollisionValidation.hasCollision ? 'text-rose-500' : 'text-teal-600'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}
                  >
                    Kiểm tra Va chạm Lịch ({liveCollisionValidation.occurrenceChecks.length} buổi):
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                    liveCollisionValidation.hasCollision
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                      : 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                  }`}
                >
                  {liveCollisionValidation.hasCollision
                    ? 'PHÁT HIỆN TRÙNG LỊCH'
                    : 'TẤT CẢ CÁC KỲ ĐỀU TRỐNG'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {liveCollisionValidation.occurrenceChecks.map((occ) => (
                  <div
                    key={occ.dateIso}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 ${
                      occ.hasConflict
                        ? isDark
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-white border-rose-300 text-rose-700'
                        : isDark
                        ? 'bg-slate-900 border-slate-700 text-teal-300'
                        : 'bg-white border-teal-200 text-teal-800'
                    }`}
                  >
                    <span>
                      Kỳ #{occ.occurrenceIndex}: {occ.dateIso}
                    </span>
                    {occ.hasConflict ? (
                      <span className="text-[10px] font-extrabold text-rose-500">
                        (Trùng {occ.conflictBooking?.bookingId})
                      </span>
                    ) : (
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* BẢN XEM TRƯỚC BỐ CỤC PHÒNG */}
            <div
              className={`p-5 rounded-2xl border ${
                isDark
                  ? 'bg-slate-950/90 border-slate-800'
                  : 'bg-[#F8FAFC] border-indigo-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span
                    className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}
                  >
                    Xem trước Bố cục Phòng: {currentRoomNode?.nodeLabel}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  Tầng {currentRoomNode?.floorLevel} • Sức chứa: {currentRoomNode?.capacityCount}{' '}
                  người
                </span>
              </div>

              {isAmphitheaterSelected ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-amber-600 font-semibold">
                    Hội trường Đấu trường La Mã (Tầng 5): Chọn trước ghế ngồi quanh Bục Diễn Giả
                    trung tâm:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AMPHITHEATER_SEATS.map((seatCode) => {
                      const isTaken = occupiedAmphitheaterSeatsInSlot.has(seatCode);
                      const isSelected = selectedAmphitheaterSeat === seatCode;
                      return (
                        <button
                          key={seatCode}
                          type="button"
                          onClick={() => {
                            setSelectedAmphitheaterSeat(seatCode);
                            setBookingFormError(null);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : isTaken
                              ? isDark
                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                : 'bg-rose-50 border-rose-200 text-rose-600'
                              : isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500/50'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                          }`}
                        >
                          <span>{seatCode}</span>
                          {isTaken && (
                            <span className="text-[9px] uppercase opacity-80">(Đã đặt)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-3">
                  <div
                    className={`relative w-72 h-36 rounded-2xl border-2 flex items-center justify-center ${
                      isDark
                        ? 'bg-slate-900 border-indigo-500/40'
                        : 'bg-white border-indigo-200 shadow-inner'
                    }`}
                  >
                    {currentRoomNode?.zoneType === 'COLLAB_HUB' ? (
                      <div className="relative w-24 h-24 rounded-full border-2 border-teal-500 bg-teal-500/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-teal-600">
                          BÀN TRÒN {currentRoomNode.capacityCount} NGƯỜI
                        </span>
                        {Array.from({ length: currentRoomNode.capacityCount }).map((_, idx) => {
                          const angle = (idx / currentRoomNode.capacityCount) * Math.PI * 2;
                          const cx = Math.cos(angle) * 38;
                          const cy = Math.sin(angle) * 38;
                          return (
                            <span
                              key={idx}
                              style={{ transform: `translate(${cx}px, ${cy}px)` }}
                              className="absolute w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white"
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2.5 flex flex-col items-center">
                        <div className="flex gap-3">
                          {Array.from({
                            length: Math.ceil((currentRoomNode?.capacityCount || 4) / 2),
                          }).map((_, idx) => (
                            <span
                              key={idx}
                              className="w-5 h-2.5 rounded-t-md bg-indigo-600 inline-block"
                            />
                          ))}
                        </div>
                        <div className="w-48 h-12 rounded-xl bg-amber-600/20 border-2 border-amber-600 flex items-center justify-center">
                          <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
                            BÀN HỌP {currentRoomNode?.nodeCode} ({currentRoomNode?.capacityCount}{' '}
                            GHẾ)
                          </span>
                        </div>
                        <div className="flex gap-3">
                          {Array.from({
                            length: Math.floor((currentRoomNode?.capacityCount || 4) / 2),
                          }).map((_, idx) => (
                            <span
                              key={idx}
                              className="w-5 h-2.5 rounded-b-md bg-indigo-600 inline-block"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  3. Nội dung cuộc họp
                </label>
                <input
                  type="text"
                  required
                  value={purposeTitle}
                  onChange={(e) => setPurposeTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={liveCollisionValidation.hasCollision}
                className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 shrink-0 transition ${
                  liveCollisionValidation.hasCollision
                    ? 'bg-slate-400 cursor-not-allowed opacity-70'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {userRole === 'EMPLOYEE'
                  ? `Gửi Yêu cầu Đặt ${targetBookableCode}`
                  : `Xác nhận Đặt Phòng ${targetBookableCode}`}
              </button>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI: MÃ QR THẬT QUÉT ĐƯỢC, CRONJOB 15P & DANH SÁCH VÉ */}
        <div
          className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/70 dark:border-slate-800">
              <div>
                <h2
                  className={`text-sm font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-teal-600" />
                  Mã QR Check-in Thực tế & Giám sát Cronjob 15p
                </h2>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Mở Check-in trước 2 tiếng • Quá 15 phút sau giờ bắt đầu tự động thu hồi chỗ
                </p>
              </div>
            </div>

            {checkinErrorAlert && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{checkinErrorAlert}</span>
              </div>
            )}

            {activeQrBooking ? (
              <div
                className={`p-5 rounded-2xl border text-center mb-4 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#F8FAFC] border-indigo-100'
                }`}
              >
                <div className="text-xs font-extrabold text-indigo-600 mb-1">
                  Vé: {activeQrBooking.bookingId} • Phòng: {activeQrBooking.nodeId} •{' '}
                  {activeQrBooking.startTimeIso} – {activeQrBooking.endTimeIso}
                </div>

                {activeBookingTimeValidation && (
                  <div className="mb-2.5 flex flex-wrap items-center justify-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        activeQrBooking.bookingStatus === 'CHECKED_IN'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : activeBookingTimeValidation.allowed
                          ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {activeQrBooking.bookingStatus === 'CHECKED_IN' ? (
                        <>
                          <Check className="w-3 h-3" />
                          Đã Check-in lúc: {activeQrBooking.checkedInAtIso || 'Đúng hạn'}
                        </>
                      ) : activeBookingTimeValidation.allowed ? (
                        <>
                          <Check className="w-3 h-3" />
                          Sẵn sàng quét QR (Mở: {activeBookingTimeValidation.windowLabel})
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          Khung giờ mở Check-in: {activeBookingTimeValidation.windowLabel}
                        </>
                      )}
                    </span>

                    {activeQrBooking.bookingStatus !== 'CHECKED_IN' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        <Timer className="w-3 h-3" />
                        Hạn Cronjob 15p thu hồi: {activeBookingTimeValidation.noShowDeadlineLabel}
                      </span>
                    )}
                  </div>
                )}

                <div className="relative inline-block p-3 bg-white rounded-2xl border-2 border-indigo-100 shadow-md">
                  <img
                    src={realQrImageSrc}
                    alt="SpotMatrix Check-in QR Code"
                    className={`w-44 h-44 object-contain rounded-lg ${
                      activeQrBooking.approvalStatus === 'PENDING_APPROVAL' ||
                      activeQrBooking.approvalStatus === 'REJECTED'
                        ? 'opacity-25 blur-[2px]'
                        : ''
                    }`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-md border border-slate-200 flex items-center justify-center">
                      <SpotMatrixLogo variant="icon" theme="light" className="scale-90" />
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={handleAttemptDemoQrScan}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    Demo Quét QR (Kiểm tra Giờ & Mở Tab Xác Nhận)
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Chưa có vé đặt phòng nào. Hãy đặt phòng ở khung bên trái để tạo mã QR.
              </div>
            )}

            {/* DANH SÁCH VÉ ĐÃ ĐẶT */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {bookingsList.map((item) => {
                const isSelected = activeQrBooking?.bookingId === item.bookingId;
                const occCount = item.occurrenceDates?.length || 1;
                return (
                  <div
                    key={item.bookingId}
                    onClick={() => {
                      setSelectedBookingForQr(item.bookingId);
                      setCheckinErrorAlert(null);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? isDark
                          ? 'bg-indigo-950/40 border-indigo-500/60'
                          : 'bg-indigo-50/70 border-indigo-400'
                        : isDark
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white">
                          {item.nodeId}
                        </span>
                        <span
                          className={`text-xs font-bold truncate max-w-[150px] ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {item.purposeNote}
                        </span>
                        {occCount > 1 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/15 text-amber-600">
                            Lặp {occCount} kỳ
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.bookingStatus === 'CHECKED_IN'
                              ? 'bg-teal-500/15 text-teal-600'
                              : item.approvalStatus === 'PENDING_APPROVAL'
                              ? 'bg-amber-500/15 text-amber-600'
                              : item.approvalStatus === 'REJECTED'
                              ? 'bg-rose-500/15 text-rose-600'
                              : 'bg-indigo-500/15 text-indigo-600'
                          }`}
                        >
                          {item.bookingStatus === 'CHECKED_IN'
                            ? `ĐÃ QUÉT (${item.checkedInAtIso || 'Đúng hạn'})`
                            : item.approvalStatus === 'PENDING_APPROVAL'
                            ? 'CHỜ QUẢN LÝ/ADMIN DUYỆT'
                            : item.approvalStatus === 'REJECTED'
                            ? 'BỊ TỪ CHỐI'
                            : 'ĐÃ DUYỆT • CHỜ QUÉT QR'}
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-3 mt-1 text-[11px] ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          {item.bookingDateIso || formatIsoDateString(new Date())} •{' '}
                          {item.startTimeIso} – {item.endTimeIso}
                        </span>
                        {item.lockVersion && <span>• Lock v{item.lockVersion}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelBooking(item.bookingId);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                      title="Xóa vé đặt phòng này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
              isDark
                ? 'bg-slate-950/90 border-slate-800 text-slate-300'
                : 'bg-indigo-50/50 border-indigo-100 text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Mọi thao tác Giữ chỗ 5p, Optimistic Lock và Thu hồi No-Show 15p đều tự động ghi vết vào
              Nhật ký Quản trị & MongoDB Atlas.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};