import {
  BookingPayloadItem,
  RecurringOptionType,
} from '../../../../Shared/Types/GlobalSystemTypes';

export interface OccurrenceCollisionCheckItem {
  occurrenceIndex: number;
  dateIso: string;
  hasConflict: boolean;
  conflictBooking: BookingPayloadItem | null;
}

export interface ScheduleCollisionValidationResult {
  isValid: boolean;
  hasCollision: boolean;
  occurrenceDates: string[];
  occurrenceChecks: OccurrenceCollisionCheckItem[];
  firstConflictMessage: string | null;
}

export function formatIsoDateString(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function validateBookingTimeWindow(startTimeIso: string, endTimeIso: string): boolean {
  return Boolean(startTimeIso && endTimeIso);
}

// Sinh danh sách các ngày diễn ra cuộc họp theo chu kỳ Đơn lẻ (1 lần) hoặc Định kỳ (Hàng ngày / Hàng tuần / Hàng tháng)
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

// Chuẩn hóa khoảng thời gian họp (Hỗ trợ ca họp qua nửa đêm 23:56 -> 01:56 và 12:56 -> 01:56)
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
  const dateParts = (bookingDateStr || formatIsoDateString(now)).split('-').map(Number);
  const year = dateParts[0] || now.getFullYear();
  const month = (dateParts[1] || now.getMonth() + 1) - 1;
  const day = dateParts[2] || now.getDate();

  const [rawStartHour = 8, rawStartMin = 0] = (startTimeStr || '08:00').split(':').map(Number);
  const [rawEndHour = 10, rawEndMin = 0] = (endTimeStr || '10:00').split(':').map(Number);

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

  // Mở cổng Check-in sớm tối đa 2 tiếng (120 phút) trước giờ bắt đầu
  const earliestCheckinTime = new Date(startDateObj.getTime() - 2 * 60 * 60 * 1000);
  // Hạn chót Cronjob 15 phút sau giờ bắt đầu nếu chưa Check-in sẽ tự động thu hồi chỗ
  const noShowDeadlineTime = new Date(startDateObj.getTime() + 15 * 60 * 1000);

  return { startDateObj, endDateObj, earliestCheckinTime, noShowDeadlineTime };
}

// Kiểm tra va chạm lịch cho cả Đặt đơn lẻ (Single) & Đặt định kỳ (Recurring)
export function validateSingleAndRecurringCollision(
  targetNodeId: string,
  baseDateIso: string,
  startTimeIso: string,
  endTimeIso: string,
  recurringOption: RecurringOptionType,
  existingBookings: BookingPayloadItem[]
): ScheduleCollisionValidationResult {
  const occurrenceDates = generateRecurringOccurrenceDates(baseDateIso, recurringOption);
  const occurrenceChecks: OccurrenceCollisionCheckItem[] = [];
  let firstConflictMessage: string | null = null;

  occurrenceDates.forEach((candidateDate, idx) => {
    const candidateRange = buildNormalizedMeetingDateRange(
      candidateDate,
      startTimeIso,
      endTimeIso
    );
    let matchedConflict: BookingPayloadItem | null = null;

    for (const existing of existingBookings) {
      if (existing.bookingStatus === 'CANCELLED' || existing.approvalStatus === 'REJECTED') {
        continue;
      }
      if (existing.nodeId !== targetNodeId) continue;

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

      if (
        candidateRange.startDateObj < existingRange.endDateObj &&
        candidateRange.endDateObj > existingRange.startDateObj
      ) {
        matchedConflict = existing;
        break;
      }
    }

    if (matchedConflict && !firstConflictMessage) {
      firstConflictMessage = `Va chạm lịch tại kỳ #${idx + 1} (Ngày ${candidateDate}): Vị trí ${targetNodeId} đã được đặt trong khung giờ (${matchedConflict.startTimeIso} – ${matchedConflict.endTimeIso}) bởi @${
        matchedConflict.requesterUsername || matchedConflict.userEmail
      } (Mã vé: ${matchedConflict.bookingId}).`;
    }

    occurrenceChecks.push({
      occurrenceIndex: idx + 1,
      dateIso: candidateDate,
      hasConflict: Boolean(matchedConflict),
      conflictBooking: matchedConflict,
    });
  });

  const hasCollision = occurrenceChecks.some((item) => item.hasConflict);

  return {
    isValid: !hasCollision,
    hasCollision,
    occurrenceDates,
    occurrenceChecks,
    firstConflictMessage,
  };
}