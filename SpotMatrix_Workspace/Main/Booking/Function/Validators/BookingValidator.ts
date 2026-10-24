import {
  BookingPayloadItem,
  RecurringOptionType,
  UserRoleType,
} from '../../../../Shared/Types/GlobalSystemTypes';

export type BookingConflictCategoryType =
  | 'NONE'
  | 'ROOM_OCCUPIED_BY_OTHER'
  | 'ROOM_ALREADY_BOOKED_BY_SELF'
  | 'USER_BUSY_IN_OTHER_ROOM';

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

export interface ScheduleCollisionValidationResult {
  isValid: boolean;
  hasCollision: boolean;
  occurrenceDates: string[];
  occurrenceChecks: OccurrenceCollisionCheckItem[];
  firstConflictMessage: string | null;
  allConflictMessages: string[];
  weeklyQuotaCheck?: RoleWeeklyBookingQuotaResult;
}

export const ROLE_WEEKLY_BOOKING_LIMITS: Record<UserRoleType, number> = {
  EMPLOYEE: 3,
  MANAGER: 8,
  SYS_ADMIN: 25,
};

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
  return Boolean(startTimeIso && endTimeIso);
}

export function getIsoWeekRangeForDate(dateIso: string): {
  mondayIso: string;
  sundayIso: string;
  weekRangeLabel: string;
} {
  const [year = 2026, month = 10, day = 20] = (
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
      existing.approvalStatus === 'REJECTED'
    ) {
      continue;
    }
    if ((existing.userEmail || '').trim().toLowerCase() !== normalizedUserEmail) {
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
    (d) => d >= mondayIso && d <= sundayIso
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
  const [year = 2026, month = 10, day = 19] = safeBase.split('-').map(Number);
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

export function buildNormalizedMeetingDateRange(
  bookingDateStr: string,
  startTimeStr: string,
  endTimeStr: string
): {
  startDateObj: Date;
  endDateObj: Date;
  earliestCheckinTime: Date;
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

  let normalizedStartHour = rawStartHour;
  if (rawStartHour === 12 && rawEndHour >= 1 && rawEndHour <= 5) {
    normalizedStartHour = 0;
  }

  const startDateObj = new Date(year, month, day, normalizedStartHour, rawStartMin, 0, 0);
  const endDateObj = new Date(year, month, day, rawEndHour, rawEndMin, 0, 0);

  const isSameDayAsNow =
    now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
  if (isSameDayAsNow && now.getHours() >= 21 && normalizedStartHour < 6) {
    startDateObj.setDate(startDateObj.getDate() + 1);
    endDateObj.setDate(endDateObj.getDate() + 1);
  }

  if (endDateObj <= startDateObj) {
    endDateObj.setDate(endDateObj.getDate() + 1);
  }

  const earliestCheckinTime = new Date(startDateObj.getTime() - 2 * 60 * 60 * 1000);
  const noShowDeadlineTime = new Date(startDateObj.getTime() + 15 * 60 * 1000);

  return { startDateObj, endDateObj, earliestCheckinTime, noShowDeadlineTime };
}

export function validateSingleAndRecurringCollision(
  targetNodeId: string,
  baseDateIso: string,
  startTimeIso: string,
  endTimeIso: string,
  recurringOption: RecurringOptionType,
  existingBookings: BookingPayloadItem[],
  currentUserEmail = '',
  currentUserRole: UserRoleType = 'EMPLOYEE'
): ScheduleCollisionValidationResult {
  const occurrenceDates = generateRecurringOccurrenceDates(baseDateIso, recurringOption);
  const occurrenceChecks: OccurrenceCollisionCheckItem[] = [];
  const allConflictMessages: string[] = [];
  let firstConflictMessage: string | null = null;
  const normalizedCurrentEmail = (currentUserEmail || '').trim().toLowerCase();

  occurrenceDates.forEach((candidateDate, idx) => {
    const candidateRange = buildNormalizedMeetingDateRange(
      candidateDate,
      startTimeIso,
      endTimeIso
    );
    let matchedConflict: BookingPayloadItem | null = null;
    let conflictCategory: BookingConflictCategoryType = 'NONE';
    let conflictReasonText: string | null = null;

    for (const existing of existingBookings) {
      if (
        existing.bookingStatus === 'CANCELLED' ||
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
        (existing.userEmail || '').trim().toLowerCase() === normalizedCurrentEmail;

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

      if (!isSameRoom && isSameUser) {
        matchedConflict = existing;
        conflictCategory = 'USER_BUSY_IN_OTHER_ROOM';
        conflictReasonText = `Kỳ #${idx + 1} (${candidateDate}): Trùng lịch cá nhân ở phòng khác! Bạn đã đăng ký vị trí [${existing.nodeId}] trong khung giờ trùng lặp (${existing.startTimeIso} – ${existing.endTimeIso}, Mã vé: ${existing.bookingId}). Một người không thể đặt và sử dụng 2 phòng cùng lúc!`;
        break;
      }
    }

    if (matchedConflict && conflictReasonText) {
      allConflictMessages.push(conflictReasonText);
      if (!firstConflictMessage) {
        firstConflictMessage = conflictReasonText;
      }
    }

    occurrenceChecks.push({
      occurrenceIndex: idx + 1,
      dateIso: candidateDate,
      hasConflict: Boolean(matchedConflict),
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

  if (weeklyQuotaCheck.isQuotaExceeded && weeklyQuotaCheck.quotaExceededReasonText) {
    allConflictMessages.push(weeklyQuotaCheck.quotaExceededReasonText);
    if (!firstConflictMessage) {
      firstConflictMessage = weeklyQuotaCheck.quotaExceededReasonText;
    }
  }

  const hasCollision =
    occurrenceChecks.some((item) => item.hasConflict) ||
    weeklyQuotaCheck.isQuotaExceeded;

  return {
    isValid: !hasCollision,
    hasCollision,
    occurrenceDates,
    occurrenceChecks,
    firstConflictMessage,
    allConflictMessages,
    weeklyQuotaCheck,
  };
}