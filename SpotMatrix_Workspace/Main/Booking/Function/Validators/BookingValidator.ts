import {
  BookingPayloadItem,
  HallBookingModeType,
  RecurringOptionType,
  UserRoleType,
} from '../../../../Shared/Types/GlobalSystemTypes';

export type BookingConflictCategoryType =
  | 'NONE'
  | 'INVALID_TIME_WINDOW'
  | 'ROOM_OCCUPIED_BY_OTHER'
  | 'ROOM_ALREADY_BOOKED_BY_SELF'
  | 'USER_BUSY_IN_OTHER_ROOM'
  | 'HALL_NO_APPROVED_EVENT'
  | 'HALL_DEPARTMENT_NOT_ALLOWED'
  | 'HALL_RENTAL_FORBIDDEN_FOR_EMPLOYEE';

export interface OccurrenceCollisionCheckItem {
  occurrenceIndex: number;
  dateIso: string;
  hasConflict: boolean;
  conflictCategory: BookingConflictCategoryType;
  conflictBooking: BookingPayloadItem | null;
  conflictReasonText: string | null;
}

export interface RoleWeeklyBookingQuotaResult {
  role: UserRoleType;
  maxWeeklyBookingsAllowed: number;
  usedBookingsInWeekCount: number;
  requestedOccurrencesInWeekCount: number;
  remainingBookingsInWeekCount: number;
  isQuotaExceeded: boolean;
  quotaExceededReasonText: string | null;
  weekRangeLabel: string;
}

export interface RoleWeeklyQuotaConfig {
  role: UserRoleType;
  roleLabelVi: string;
  maxBookingsPerWeek: number;
}

export interface QrCheckinTimeWindowCheckResult {
  canScan: boolean;
  statusCode:
    | 'OPEN_WINDOW'
    | 'TOO_EARLY'
    | 'TOO_LATE_EXPIRED'
    | 'PENDING_APPROVAL'
    | 'ALREADY_CHECKED_IN';
  reasonText: string;
  earliestCheckinTime: Date;
  latestCheckinTime: Date;
}

export interface ScheduleCollisionValidationResult {
  isValid: boolean;
  hasCollision: boolean;
  occurrenceDates: string[];
  occurrenceChecks: OccurrenceCollisionCheckItem[];
  firstConflictMessage: string | null;
  errorMessage?: string;
  allConflictMessages: string[];
  weeklyQuotaCheck?: RoleWeeklyBookingQuotaResult;
  matchedHallEvent?: BookingPayloadItem | null;
}

export const ROLE_WEEKLY_BOOKING_LIMITS: Record<UserRoleType, number> = {
  EMPLOYEE: 3,
  MANAGER: 8,
  SYS_ADMIN: 25,
};

// Hằng số giờ hoạt động chuẩn của tòa nhà: 07:00 sáng (420 phút) đến 23:00 đêm (1380 phút)
export const BUILDING_OPEN_MINUTES = 7 * 60; // 07:00
export const BUILDING_CLOSE_MINUTES = 23 * 60; // 23:00
export const THREE_DAYS_RETENTION_MS = 3 * 24 * 60 * 60 * 1000; // 3 ngày

export function parseTimeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return -1;
  const parts = timeStr.trim().split(':').map(Number);
  const h = parts[0];
  const m = parts[1];
  if (
    typeof h !== 'number' ||
    typeof m !== 'number' ||
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return -1;
  }
  return h * 60 + m;
}

export function validateOperatingHoursAndOrder(
  startTimeIso: string,
  endTimeIso: string
): {
  isValid: boolean;
  errorReasonVi: string | null;
  errorReasonEn: string | null;
  errorReasonJa: string | null;
  startMinutes: number;
  endMinutes: number;
} {
  const startMinutes = parseTimeStringToMinutes(startTimeIso);
  const endMinutes = parseTimeStringToMinutes(endTimeIso);

  if (startMinutes < 0 || endMinutes < 0) {
    return {
      isValid: false,
      errorReasonVi: 'Định dạng giờ đặt phòng không hợp lệ (chuẩn HH:mm).',
      errorReasonEn: 'Invalid booking time format (expected HH:mm).',
      errorReasonJa: '予約時刻の形式が無効です (HH:mm)。',
      startMinutes,
      endMinutes,
    };
  }

  if (
    startMinutes < BUILDING_OPEN_MINUTES ||
    startMinutes > BUILDING_CLOSE_MINUTES ||
    endMinutes < BUILDING_OPEN_MINUTES ||
    endMinutes > BUILDING_CLOSE_MINUTES
  ) {
    return {
      isValid: false,
      errorReasonVi: `Giờ đặt phòng không hợp lệ (${startTimeIso} – ${endTimeIso})! Tòa nhà chỉ cho phép đặt phòng từ 07:00 sáng đến 23:00 đêm.`,
      errorReasonEn: `Invalid booking hours (${startTimeIso} – ${endTimeIso})! Reservations are only allowed between 07:00 AM and 23:00 PM.`,
      errorReasonJa: `予約時間が無効です (${startTimeIso} – ${endTimeIso})！会議室の予約可能時間は 07:00 から 23:00 までです。`,
      startMinutes,
      endMinutes,
    };
  }

  if (startMinutes >= endMinutes) {
    return {
      isValid: false,
      errorReasonVi: `Sai logic thời gian: Giờ bắt đầu (${startTimeIso}) không được lớn hơn hoặc bằng giờ kết thúc (${endTimeIso})!`,
      errorReasonEn: `Invalid time logic: Start time (${startTimeIso}) must be strictly earlier than end time (${endTimeIso})!`,
      errorReasonJa: `時間設定エラー：開始時刻 (${startTimeIso}) は終了時刻 (${endTimeIso}) より前でなければなりません！`,
      startMinutes,
      endMinutes,
    };
  }

  if (endMinutes - startMinutes < 30) {
    return {
      isValid: false,
      errorReasonVi: `Thời lượng đặt phòng tối thiểu là 30 phút (Hiện tại: ${startTimeIso} – ${endTimeIso}).`,
      errorReasonEn: `Minimum booking duration is 30 minutes (Current: ${startTimeIso} – ${endTimeIso}).`,
      errorReasonJa: `最小予約時間は30分です（現在: ${startTimeIso} – ${endTimeIso}）。`,
      startMinutes,
      endMinutes,
    };
  }

  return {
    isValid: true,
    errorReasonVi: null,
    errorReasonEn: null,
    errorReasonJa: null,
    startMinutes,
    endMinutes,
  };
}

// Kiểm tra xem vé có hiển thị trong khung "Vé Đặt lịch & Quét Mã QR" (Hình 3) hay đã chuyển hẳn sang Lịch sử
export function isBookingVisibleInActivePassBox(
  booking: BookingPayloadItem,
  nowMs: number = Date.now()
): boolean {
  // 1. Đơn xin phép bị từ chối hoặc đã hủy sẽ biến mất ngay khỏi khung vé hoạt động
  if (
    booking.approvalStatus === 'REJECTED' ||
    booking.bookingStatus === 'CANCELLED'
  ) {
    return false;
  }

  // 2. Đơn đã quét QR (CHECKED_IN) sẽ biến mất khỏi khung này sau 3 ngày
  if (booking.bookingStatus === 'CHECKED_IN') {
    const checkInMs = booking.checkedInTimestampMs || nowMs;
    return nowMs - checkInMs < THREE_DAYS_RETENTION_MS;
  }

  // 3. Đơn trễ hạn bị thu hồi (EXPIRED_NO_SHOW / AUTO_RELEASED) sẽ hiện ở trạng thái 3 (Trễ hạn) và biến mất sau 3 ngày
  if (
    booking.bookingStatus === 'EXPIRED_NO_SHOW' ||
    booking.bookingStatus === 'AUTO_RELEASED'
  ) {
    const expiredMs = booking.expiredAtTimestampMs || nowMs;
    return nowMs - expiredMs < THREE_DAYS_RETENTION_MS;
  }

  return true;
}

export function getRoleWeeklyQuotaConfig(
  userRole: UserRoleType = 'EMPLOYEE'
): RoleWeeklyQuotaConfig {
  if (userRole === 'SYS_ADMIN') {
    return {
      role: 'SYS_ADMIN',
      roleLabelVi: 'System Admin (Toàn quyền • 25 lần/tuần)',
      maxBookingsPerWeek: ROLE_WEEKLY_BOOKING_LIMITS.SYS_ADMIN,
    };
  }
  if (userRole === 'MANAGER') {
    return {
      role: 'MANAGER',
      roleLabelVi: 'Quản lý (Tối đa 8 lần/tuần)',
      maxBookingsPerWeek: ROLE_WEEKLY_BOOKING_LIMITS.MANAGER,
    };
  }
  return {
    role: 'EMPLOYEE',
    roleLabelVi: 'Nhân viên (Tối đa 3 lần/tuần)',
    maxBookingsPerWeek: ROLE_WEEKLY_BOOKING_LIMITS.EMPLOYEE,
  };
}

export function formatIsoDateString(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function validateBookingTimeWindow(
  startTimeIso: string,
  endTimeIso: string
): boolean {
  return validateOperatingHoursAndOrder(startTimeIso, endTimeIso).isValid;
}

export function getIsoWeekRangeForDate(dateIso: string): {
  mondayIso: string;
  sundayIso: string;
  weekRangeLabel: string;
} {
  const [year = 2026, month = 11, day = 15] = (
    dateIso || formatIsoDateString(new Date())
  )
    .split('-')
    .map(Number);
  const target = new Date(year, month - 1, day, 12, 0, 0);
  const dayOfWeek = target.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(target);
  monday.setDate(target.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayIso = formatIsoDateString(monday);
  const sundayIso = formatIsoDateString(sunday);

  return {
    mondayIso,
    sundayIso,
    weekRangeLabel: `${mondayIso} đến ${sundayIso}`,
  };
}

export function validateWeeklyRoleBookingQuota(
  userEmail: string,
  userRole: UserRoleType,
  baseDateIso: string,
  candidateOccurrenceDates: string[],
  existingBookings: BookingPayloadItem[]
): RoleWeeklyBookingQuotaResult {
  const maxWeeklyBookingsAllowed = ROLE_WEEKLY_BOOKING_LIMITS[userRole] || 3;
  const { mondayIso, sundayIso, weekRangeLabel } =
    getIsoWeekRangeForDate(baseDateIso);
  const normalizedUserEmail = (userEmail || '').trim().toLowerCase();

  let usedBookingsInWeekCount = 0;

  for (const existing of existingBookings) {
    if (
      existing.bookingStatus === 'CANCELLED' ||
      existing.bookingStatus === 'EXPIRED_NO_SHOW' ||
      existing.bookingStatus === 'AUTO_RELEASED' ||
      existing.approvalStatus === 'REJECTED'
    ) {
      continue;
    }
    if (
      (existing.userEmail || '').trim().toLowerCase() !== normalizedUserEmail
    ) {
      continue;
    }

    const datesOfBooking =
      existing.occurrenceDates && existing.occurrenceDates.length > 0
        ? existing.occurrenceDates
        : [existing.bookingDateIso || formatIsoDateString(new Date())];

    for (const d of datesOfBooking) {
      if (d >= mondayIso && d <= sundayIso) {
        usedBookingsInWeekCount += 1;
      }
    }
  }

  const requestedOccurrencesInWeekCount = candidateOccurrenceDates.filter(
    (d: string) => d >= mondayIso && d <= sundayIso
  ).length;

  const remainingBookingsInWeekCount = Math.max(
    0,
    maxWeeklyBookingsAllowed - usedBookingsInWeekCount
  );

  const isQuotaExceeded =
    usedBookingsInWeekCount + requestedOccurrencesInWeekCount >
    maxWeeklyBookingsAllowed;

  const roleNameVi =
    userRole === 'EMPLOYEE'
      ? 'Nhân viên (EMPLOYEE)'
      : userRole === 'MANAGER'
      ? 'Quản lý (MANAGER)'
      : 'Quản trị viên (SYS_ADMIN)';

  const quotaExceededReasonText = isQuotaExceeded
    ? `Vượt giới hạn đặt phòng trong tuần của vai trò ${roleNameVi}: Tối đa ${maxWeeklyBookingsAllowed} lần/tuần (Tuần ${weekRangeLabel} bạn đã đặt ${usedBookingsInWeekCount}/${maxWeeklyBookingsAllowed} lần, yêu cầu này cần thêm ${requestedOccurrencesInWeekCount} lần).`
    : null;

  return {
    role: userRole,
    maxWeeklyBookingsAllowed,
    usedBookingsInWeekCount,
    requestedOccurrencesInWeekCount,
    remainingBookingsInWeekCount,
    isQuotaExceeded,
    quotaExceededReasonText,
    weekRangeLabel,
  };
}

export function generateRecurringOccurrenceDates(
  baseDateIso: string,
  recurringOption: RecurringOptionType = 'NONE'
): string[] {
  const safeBase = baseDateIso || formatIsoDateString(new Date());
  const [year = 2026, month = 11, day = 15] = safeBase.split('-').map(Number);
  const baseDate = new Date(year, month - 1, day, 12, 0, 0);

  if (recurringOption === 'NONE') {
    return [formatIsoDateString(baseDate)];
  }

  const dates: string[] = [];
  if (recurringOption === 'DAILY') {
    for (let i = 0; i < 5; i++) {
      const next = new Date(baseDate);
      next.setDate(baseDate.getDate() + i);
      dates.push(formatIsoDateString(next));
    }
    return dates;
  }

  if (recurringOption === 'WEEKLY') {
    for (let i = 0; i < 4; i++) {
      const next = new Date(baseDate);
      next.setDate(baseDate.getDate() + i * 7);
      dates.push(formatIsoDateString(next));
    }
    return dates;
  }

  if (recurringOption === 'MONTHLY') {
    for (let i = 0; i < 3; i++) {
      const next = new Date(baseDate);
      next.setMonth(baseDate.getMonth() + i);
      dates.push(formatIsoDateString(next));
    }
    return dates;
  }

  return [safeBase];
}

// Chuẩn hóa khoảng thời gian họp & Khung giờ Quét mã QR Check-in chuẩn xác (Trong cùng ngày 07:00 – 23:00)
export function buildNormalizedMeetingDateRange(
  bookingDateStr: string,
  startTimeStr: string,
  endTimeStr: string
): {
  startDateObj: Date;
  endDateObj: Date;
  earliestCheckinTime: Date;
  latestCheckinTime: Date;
  noShowDeadlineTime: Date;
} {
  const now = new Date();
  const dateParts = (bookingDateStr || formatIsoDateString(now))
    .split('-')
    .map(Number);
  const year = dateParts[0] || now.getFullYear();
  const month = (dateParts[1] || now.getMonth() + 1) - 1;
  const day = dateParts[2] || now.getDate();

  const [rawStartHour = 8, rawStartMin = 0] = (startTimeStr || '08:00')
    .split(':')
    .map(Number);
  const [rawEndHour = 10, rawEndMin = 0] = (endTimeStr || '10:00')
    .split(':')
    .map(Number);

  const safeStartHour = Math.max(7, Math.min(23, rawStartHour));
  const safeEndHour = Math.max(7, Math.min(23, rawEndHour));

  const startDateObj = new Date(
    year,
    month,
    day,
    safeStartHour,
    rawStartMin,
    0,
    0
  );
  const endDateObj = new Date(year, month, day, safeEndHour, rawEndMin, 0, 0);

  const earliestCheckinTime = new Date(
    startDateObj.getTime() - 30 * 60 * 1000
  );
  const latestCheckinTime = new Date(
    startDateObj.getTime() + 30 * 60 * 1000
  );
  const noShowDeadlineTime = new Date(
    startDateObj.getTime() + 30 * 60 * 1000
  );

  return {
    startDateObj,
    endDateObj,
    earliestCheckinTime,
    latestCheckinTime,
    noShowDeadlineTime,
  };
}

// Kiểm tra cửa sổ thời gian quét mã QR Check-in: Trước 30 phút đến Trễ 30 phút so với giờ bắt đầu
export function validateQrCheckinTimeWindow(
  booking: BookingPayloadItem,
  referenceNow: Date = new Date()
): QrCheckinTimeWindowCheckResult {
  const dateStr = booking.bookingDateIso || formatIsoDateString(referenceNow);
  const { earliestCheckinTime, latestCheckinTime } =
    buildNormalizedMeetingDateRange(
      dateStr,
      booking.startTimeIso,
      booking.endTimeIso
    );

  if (booking.bookingStatus === 'CHECKED_IN') {
    return {
      canScan: false,
      statusCode: 'ALREADY_CHECKED_IN',
      reasonText: `Vé ${booking.bookingId} (${booking.nodeId}) đã được quét QR Check-in trước đó.`,
      earliestCheckinTime,
      latestCheckinTime,
    };
  }

  if (
    booking.bookingStatus === 'EXPIRED_NO_SHOW' ||
    booking.bookingStatus === 'AUTO_RELEASED'
  ) {
    return {
      canScan: false,
      statusCode: 'TOO_LATE_EXPIRED',
      reasonText: `Vé ${booking.bookingId} (${booking.nodeId}) đã quá hạn quét QR và bị hệ thống tự động thu hồi phòng!`,
      earliestCheckinTime,
      latestCheckinTime,
    };
  }

  if (booking.approvalStatus === 'PENDING_APPROVAL') {
    return {
      canScan: false,
      statusCode: 'PENDING_APPROVAL',
      reasonText: `Yêu cầu đặt vị trí ${booking.nodeId} đang chờ Quản lý / Admin phê duyệt, chưa thể quét mã QR Check-in!`,
      earliestCheckinTime,
      latestCheckinTime,
    };
  }

  const nowMs = referenceNow.getTime();
  const earliestMs = earliestCheckinTime.getTime();
  const latestMs = latestCheckinTime.getTime();

  const earliestTimeFormatted = earliestCheckinTime.toLocaleTimeString(
    'vi-VN',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );
  const latestTimeFormatted = latestCheckinTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (nowMs < earliestMs) {
    const waitMinutes = Math.ceil((earliestMs - nowMs) / 60000);
    return {
      canScan: false,
      statusCode: 'TOO_EARLY',
      reasonText: `Chưa tới giờ mở quét QR cho vị trí ${booking.nodeId}! Chỉ được quét mã QR từ trước 30 phút (${earliestTimeFormatted}) đến trễ 30 phút (${latestTimeFormatted}) so với giờ bắt đầu (${booking.startTimeIso}). Còn ${waitMinutes} phút nữa mở quét.`,
      earliestCheckinTime,
      latestCheckinTime,
    };
  }

  if (nowMs > latestMs) {
    return {
      canScan: false,
      statusCode: 'TOO_LATE_EXPIRED',
      reasonText: `Đã quá hạn 30 phút quét mã QR cho vị trí ${booking.nodeId} (khung cho phép: ${earliestTimeFormatted} – ${latestTimeFormatted})! Hệ thống tự động thu hồi phòng và trừ điểm tín nhiệm.`,
      earliestCheckinTime,
      latestCheckinTime,
    };
  }

  return {
    canScan: true,
    statusCode: 'OPEN_WINDOW',
    reasonText: `Đã xác thực Check-in đúng khung giờ quy định (${earliestTimeFormatted} – ${latestTimeFormatted}) và cộng +2 điểm Tín nhiệm!`,
    earliestCheckinTime,
    latestCheckinTime,
  };
}

export function findApprovedHallEventInSlot(
  candidateDateIso: string,
  startTimeIso: string,
  endTimeIso: string,
  existingBookings: BookingPayloadItem[]
): {
  approvedEvent: BookingPayloadItem | null;
  pendingEvent: BookingPayloadItem | null;
} {
  const candidateRange = buildNormalizedMeetingDateRange(
    candidateDateIso,
    startTimeIso,
    endTimeIso
  );

  let approvedEvent: BookingPayloadItem | null = null;
  let pendingEvent: BookingPayloadItem | null = null;

  for (const existing of existingBookings) {
    if (
      existing.bookingStatus === 'CANCELLED' ||
      existing.bookingStatus === 'EXPIRED_NO_SHOW' ||
      existing.bookingStatus === 'AUTO_RELEASED' ||
      existing.approvalStatus === 'REJECTED'
    ) {
      continue;
    }

    const isHallRental =
      existing.nodeId === 'H-01' ||
      existing.bookingMode === 'HALL_EVENT_RENTAL';
    if (!isHallRental) continue;

    const existingDates =
      existing.occurrenceDates && existing.occurrenceDates.length > 0
        ? existing.occurrenceDates
        : [existing.bookingDateIso || formatIsoDateString(new Date())];

    if (!existingDates.includes(candidateDateIso)) continue;

    const existingRange = buildNormalizedMeetingDateRange(
      candidateDateIso,
      existing.startTimeIso,
      existing.endTimeIso
    );

    const isOverlapping =
      candidateRange.startDateObj < existingRange.endDateObj &&
      candidateRange.endDateObj > existingRange.startDateObj;

    if (!isOverlapping) continue;

    if (existing.approvalStatus === 'APPROVED') {
      approvedEvent = existing;
      break;
    } else if (existing.approvalStatus === 'PENDING_APPROVAL') {
      pendingEvent = existing;
    }
  }

  return { approvedEvent, pendingEvent };
}

export function generateQrCheckinToken(
  roomCode: string,
  userOrMode: string = 'QR'
): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const cleanTag = String(userOrMode)
    .replace(/[^A-Z0-9-]/gi, '')
    .slice(0, 8)
    .toUpperCase();
  return `QR-SMX-${roomCode.toUpperCase()}-${cleanTag}-${rand}`;
}

export function validateSingleAndRecurringCollision(
  targetNodeId: string,
  baseDateIso: string,
  startTimeIso: string,
  endTimeIso: string,
  recurringOption: RecurringOptionType,
  existingBookings: BookingPayloadItem[],
  currentUserEmail?: string,
  currentUserRole?: UserRoleType,
  currentUserDepartment?: string
): ScheduleCollisionValidationResult;

export function validateSingleAndRecurringCollision(
  targetNodeId: string,
  userEmail: string,
  baseDateIso: string,
  startTimeIso: string,
  endTimeIso: string,
  recurringOption: RecurringOptionType,
  existingBookings: BookingPayloadItem[],
  currentUserRole?: UserRoleType,
  bookingMode?: HallBookingModeType,
  currentUserDepartment?: string
): ScheduleCollisionValidationResult;

export function validateSingleAndRecurringCollision(
  targetNodeId: string,
  arg2: string,
  arg3: string,
  arg4: string,
  arg5: RecurringOptionType | string,
  arg6: BookingPayloadItem[] | RecurringOptionType,
  arg7?: string | BookingPayloadItem[],
  arg8: UserRoleType = 'EMPLOYEE',
  arg9?: string,
  arg10?: string
): ScheduleCollisionValidationResult {
  const isNineArgSignature = Array.isArray(arg6);

  const baseDateIso: string = isNineArgSignature ? arg2 : arg3;
  const startTimeIso: string = isNineArgSignature ? arg3 : arg4;
  const endTimeIso: string = isNineArgSignature ? arg4 : String(arg5);
  const recurringOption: RecurringOptionType = isNineArgSignature
    ? (arg5 as RecurringOptionType)
    : (arg6 as RecurringOptionType);
  const existingBookings: BookingPayloadItem[] = isNineArgSignature
    ? (arg6 as BookingPayloadItem[])
    : Array.isArray(arg7)
    ? arg7
    : [];
  const currentUserEmail: string = isNineArgSignature
    ? typeof arg7 === 'string'
      ? arg7
      : ''
    : arg2;
  const currentUserRole: UserRoleType = arg8 || 'EMPLOYEE';
  const explicitMode: HallBookingModeType | undefined = !isNineArgSignature
    ? (arg9 as HallBookingModeType | undefined)
    : undefined;
  const currentUserDepartment: string = isNineArgSignature
    ? arg9 || 'Product & Engineering'
    : arg10 || 'Product & Engineering';

  // BƯỚC 1: KIỂM TRA KHUNG GIỜ HOẠT ĐỘNG (07:00 – 23:00) VÀ LOGIC GIỜ ĐẶT < GIỜ TRẢ
  const timeValidation = validateOperatingHoursAndOrder(startTimeIso, endTimeIso);
  if (!timeValidation.isValid) {
    const errMsg =
      timeValidation.errorReasonVi ||
      'Giờ đặt phòng phải nằm trong khoảng 07:00 – 23:00 và giờ bắt đầu phải nhỏ hơn giờ kết thúc!';
    return {
      isValid: false,
      hasCollision: true,
      occurrenceDates: [baseDateIso],
      occurrenceChecks: [
        {
          occurrenceIndex: 1,
          dateIso: baseDateIso,
          hasConflict: true,
          conflictCategory: 'INVALID_TIME_WINDOW',
          conflictBooking: null,
          conflictReasonText: errMsg,
        },
      ],
      firstConflictMessage: errMsg,
      errorMessage: errMsg,
      allConflictMessages: [errMsg],
    };
  }

  const occurrenceDates = generateRecurringOccurrenceDates(
    baseDateIso,
    recurringOption
  );
  const occurrenceChecks: OccurrenceCollisionCheckItem[] = [];
  const allConflictMessages: string[] = [];
  let firstConflictMessage: string | null = null;
  const normalizedCurrentEmail = (currentUserEmail || '').trim().toLowerCase();

  const isHallWholeRoomRental =
    targetNodeId === 'H-01' || explicitMode === 'HALL_EVENT_RENTAL';
  const isHallSeatBooking =
    /^H01-[A-C]\d+$/i.test(targetNodeId) ||
    explicitMode === 'HALL_SEAT_BOOKING';

  let matchedHallEventForFirstDate: BookingPayloadItem | null = null;

  if (isHallWholeRoomRental && currentUserRole === 'EMPLOYEE') {
    const msg =
      'Vai trò Nhân viên (EMPLOYEE) chỉ có quyền hạn đặt chỗ ghế ngồi (H01-A1..C12) khi Hội trường có sự kiện, không có quyền thuê cả phòng Hội trường (H-01)!';
    allConflictMessages.push(msg);
    firstConflictMessage = msg;
  }

  occurrenceDates.forEach((candidateDate: string, idx: number) => {
    const candidateRange = buildNormalizedMeetingDateRange(
      candidateDate,
      startTimeIso,
      endTimeIso
    );
    let matchedConflict: BookingPayloadItem | null = null;
    let conflictCategory: BookingConflictCategoryType = 'NONE';
    let conflictReasonText: string | null = null;

    if (isHallSeatBooking) {
      const { approvedEvent, pendingEvent } = findApprovedHallEventInSlot(
        candidateDate,
        startTimeIso,
        endTimeIso,
        existingBookings
      );

      if (idx === 0) {
        matchedHallEventForFirstDate = approvedEvent;
      }

      if (!approvedEvent) {
        conflictCategory = 'HALL_NO_APPROVED_EVENT';
        conflictReasonText = pendingEvent
          ? `Kỳ #${idx + 1} (${candidateDate}): Hội trường Tầng 5 đang có yêu cầu thuê sự kiện "${
              pendingEvent.purposeNote
            }" của Quản lý @${
              pendingEvent.requesterUsername || pendingEvent.userEmail
            } nhưng CHƯA ĐƯỢC ADMIN CHẤP NHẬN. Chỉ khi Admin phê duyệt thuê Hội trường thì mới có thể đặt ghế ngồi!`
          : `Kỳ #${idx + 1} (${candidateDate}): Phòng Hội trường hiện đang không có sự kiện gì để tham gia trong khung giờ (${startTimeIso} – ${endTimeIso})! Chỉ có thể đặt ghế ngồi khi Hội trường đã được Admin hoặc Quản lý thuê tổ chức hoạt động thành công.`;
      } else {
        const allowedDepts = approvedEvent.allowedDepartments || [];
        const isDeptAllowed =
          currentUserRole === 'SYS_ADMIN' ||
          allowedDepts.length === 0 ||
          allowedDepts.includes('ALL') ||
          allowedDepts.some(
            (d: string) =>
              d.trim().toLowerCase() ===
              (currentUserDepartment || '').trim().toLowerCase()
          );

        if (!isDeptAllowed) {
          conflictCategory = 'HALL_DEPARTMENT_NOT_ALLOWED';
          conflictReasonText = `Kỳ #${idx + 1} (${candidateDate}): Sự kiện Hội trường "${
            approvedEvent.purposeNote
          }" chỉ dành cho các phòng ban: [${allowedDepts.join(
            ', '
          )}]. Phòng ban hiện tại của bạn (${currentUserDepartment}) không nằm trong danh sách được tham gia sự kiện này!`;
        }
      }
    }

    if (conflictCategory === 'NONE') {
      for (const existing of existingBookings) {
        if (
          existing.bookingStatus === 'CANCELLED' ||
          existing.bookingStatus === 'EXPIRED_NO_SHOW' ||
          existing.bookingStatus === 'AUTO_RELEASED' ||
          existing.approvalStatus === 'REJECTED'
        ) {
          continue;
        }

        const existingDatesList =
          existing.occurrenceDates && existing.occurrenceDates.length > 0
            ? existing.occurrenceDates
            : [existing.bookingDateIso || formatIsoDateString(new Date())];

        if (!existingDatesList.includes(candidateDate)) continue;

        const existingRange = buildNormalizedMeetingDateRange(
          candidateDate,
          existing.startTimeIso,
          existing.endTimeIso
        );

        const isTimeOverlapping =
          candidateRange.startDateObj < existingRange.endDateObj &&
          candidateRange.endDateObj > existingRange.startDateObj;

        if (!isTimeOverlapping) continue;

        const isSameRoom = existing.nodeId === targetNodeId;
        const isSameUser =
          normalizedCurrentEmail !== '' &&
          (existing.userEmail || '').trim().toLowerCase() ===
            normalizedCurrentEmail;

        if (isSameRoom) {
          matchedConflict = existing;
          if (isSameUser) {
            conflictCategory = 'ROOM_ALREADY_BOOKED_BY_SELF';
            conflictReasonText = `Kỳ #${idx + 1} (${candidateDate}): Chính bạn đã đăng ký vị trí ${targetNodeId} trong khung giờ (${existing.startTimeIso} – ${existing.endTimeIso}, Mã vé: ${existing.bookingId} - "${existing.purposeNote}").`;
          } else {
            conflictCategory = 'ROOM_OCCUPIED_BY_OTHER';
            conflictReasonText = `Kỳ #${idx + 1} (${candidateDate}): Vị trí ${targetNodeId} đã có người khác (@${
              existing.requesterUsername || existing.userEmail
            }) đặt trong khung giờ (${existing.startTimeIso} – ${existing.endTimeIso}, Mã vé: ${existing.bookingId} - "${existing.purposeNote}").`;
          }
          break;
        }

        const isOrganizerBookingSeatInOwnHallEvent =
          isHallSeatBooking && existing.nodeId === 'H-01' && isSameUser;

        if (!isSameRoom && isSameUser && !isOrganizerBookingSeatInOwnHallEvent) {
          matchedConflict = existing;
          conflictCategory = 'USER_BUSY_IN_OTHER_ROOM';
          conflictReasonText = `Kỳ #${idx + 1} (${candidateDate}): Trùng lịch cá nhân ở phòng khác! Bạn đã đăng ký vị trí [${existing.nodeId}] trong khung giờ trùng lặp (${existing.startTimeIso} – ${existing.endTimeIso}, Mã vé: ${existing.bookingId}). Một người không thể đặt và sử dụng 2 phòng/ghế cùng lúc!`;
          break;
        }
      }
    }

    if (conflictReasonText) {
      allConflictMessages.push(conflictReasonText);
      if (!firstConflictMessage) {
        firstConflictMessage = conflictReasonText;
      }
    }

    occurrenceChecks.push({
      occurrenceIndex: idx + 1,
      dateIso: candidateDate,
      hasConflict: conflictCategory !== 'NONE',
      conflictCategory,
      conflictBooking: matchedConflict,
      conflictReasonText,
    });
  });

  const weeklyQuotaCheck = validateWeeklyRoleBookingQuota(
    currentUserEmail,
    currentUserRole,
    baseDateIso,
    occurrenceDates,
    existingBookings
  );

  if (
    weeklyQuotaCheck.isQuotaExceeded &&
    weeklyQuotaCheck.quotaExceededReasonText
  ) {
    allConflictMessages.push(weeklyQuotaCheck.quotaExceededReasonText);
    if (!firstConflictMessage) {
      firstConflictMessage = weeklyQuotaCheck.quotaExceededReasonText;
    }
  }

  const hasCollision =
    (isHallWholeRoomRental && currentUserRole === 'EMPLOYEE') ||
    occurrenceChecks.some(
      (item: OccurrenceCollisionCheckItem) => item.hasConflict
    ) ||
    weeklyQuotaCheck.isQuotaExceeded;

  return {
    isValid: !hasCollision,
    hasCollision,
    occurrenceDates,
    occurrenceChecks,
    firstConflictMessage,
    errorMessage: firstConflictMessage || undefined,
    allConflictMessages,
    weeklyQuotaCheck,
    matchedHallEvent: matchedHallEventForFirstDate,
  };
}
