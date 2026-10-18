import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import { WorkspaceNodeItem, UserRoleType } from '../../../Shared/Types/GlobalSystemTypes';
import { SpotMatrixLogo } from '../../../Shared/Components/SpotMatrixLogo';

export interface BookingScheduleRecord {
  bookingId: string;
  nodeCode: string;
  nodeLabel: string;
  floorLevel: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purposeTitle: string;
  attendeeCount: number;
  recurringOption: string;
  status: 'CONFIRMED' | 'CHECKED_IN';
  approvalStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdByUsername?: string;
  createdByRole?: UserRoleType;
  approvedByUsername?: string;
  checkedInAtText?: string;
}

interface BookingCalendarPagesProps {
  themeMode: 'light' | 'dark';
  nodesList: WorkspaceNodeItem[];
  bookingsList: BookingScheduleRecord[];
  currentUser: {
    username: string;
    fullName: string;
    userEmail: string;
    role: UserRoleType;
  };
  onCreateNewBooking: (newItem: BookingScheduleRecord) => void;
  onCancelBooking: (bookingId: string) => void;
  onConfirmCheckinBooking: (bookingId: string) => void;
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

const formatTodayIsoDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const BookingCalendarPages: React.FC<BookingCalendarPagesProps> = ({
  themeMode,
  nodesList,
  bookingsList,
  currentUser,
  onCreateNewBooking,
  onCancelBooking,
  onConfirmCheckinBooking,
}) => {
  const isDark = themeMode === 'dark';
  const [searchParams] = useSearchParams();

  const [selectedRoomCode, setSelectedRoomCode] = useState<string>('M1-01');
  const [selectedAmphitheaterSeat, setSelectedAmphitheaterSeat] = useState<string>('H01-A1');
  const [selectedDate, setSelectedDate] = useState<string>(formatTodayIsoDate);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [purposeTitle, setPurposeTitle] = useState<string>(
    'Họp triển khai dự án & Review Kiến trúc Hệ thống'
  );
  const [recurringOption, setRecurringOption] = useState<string>('NONE');
  const [selectedBookingForQr, setSelectedBookingForQr] = useState<string>(
    bookingsList[0]?.bookingId || ''
  );
  const [checkinErrorAlert, setCheckinErrorAlert] = useState<string | null>(null);
  const [bookingFormError, setBookingFormError] = useState<string | null>(null);
  const [bookingSuccessBanner, setBookingSuccessBanner] = useState<string | null>(null);

  // Đồng bộ tham số URL (?room=...&slot=...) hoặc localStorage khi chuyển từ trang Sơ đồ Phòng họp sang
  useEffect(() => {
    const queryRoom = searchParams.get('room');
    const querySlot = searchParams.get('slot');

    if (queryRoom && nodesList.some((item) => item.nodeCode === queryRoom)) {
      setSelectedRoomCode(queryRoom);
    }
    if (querySlot && querySlot.includes('-')) {
      const [slotStart, slotEnd] = querySlot.split('-').map((s) => s.trim());
      if (slotStart && slotEnd) {
        setStartTime(slotStart);
        setEndTime(slotEnd);
      }
    }

    try {
      const rawPreselect = localStorage.getItem('spotmatrix_preselect_booking');
      if (rawPreselect) {
        const parsed = JSON.parse(rawPreselect);
        if (parsed.nodeCode && nodesList.some((item) => item.nodeCode === parsed.nodeCode)) {
          setSelectedRoomCode(parsed.nodeCode);
        }
        if (parsed.startTime && parsed.endTime) {
          setStartTime(parsed.startTime);
          setEndTime(parsed.endTime);
        }
        localStorage.removeItem('spotmatrix_preselect_booking');
      }
    } catch {
      // Bỏ qua nếu dữ liệu tạm không hợp lệ
    }
  }, [searchParams, nodesList]);

  // Đảm bảo luôn có 1 vé hợp lệ được chọn khi danh sách thay đổi (thêm mới hoặc xóa vé)
  useEffect(() => {
    if (bookingsList.length === 0) {
      setSelectedBookingForQr('');
      return;
    }
    const stillExists = bookingsList.some((item) => item.bookingId === selectedBookingForQr);
    if (!selectedBookingForQr || !stillExists) {
      setSelectedBookingForQr(bookingsList[0].bookingId);
    }
  }, [bookingsList, selectedBookingForQr]);

  const currentRoomNode = useMemo(() => {
    return nodesList.find((item) => item.nodeCode === selectedRoomCode) || nodesList[0];
  }, [nodesList, selectedRoomCode]);

  const isAmphitheaterSelected =
    currentRoomNode?.floorLevel === 5 || currentRoomNode?.nodeCode === 'H-01';

  // Chuẩn hóa thời gian Bắt đầu & Kết thúc thành đối tượng Date chính xác (Xử lý ca họp qua nửa đêm & nhầm lẫn 12h/24h)
  const buildNormalizedMeetingDateRange = (
    bookingDateStr: string,
    startTimeStr: string,
    endTimeStr: string
  ): { startDateObj: Date; endDateObj: Date; earliestCheckinTime: Date } => {
    const now = new Date();
    const dateParts = (bookingDateStr || formatTodayIsoDate()).split('-').map(Number);
    const year = dateParts[0] || now.getFullYear();
    const month = (dateParts[1] || now.getMonth() + 1) - 1;
    const day = dateParts[2] || now.getDate();

    const [rawStartHour = 8, rawStartMin = 0] = (startTimeStr || '08:00').split(':').map(Number);
    const [rawEndHour = 10, rawEndMin = 0] = (endTimeStr || '10:00').split(':').map(Number);

    let normalizedStartHour = rawStartHour;
    // Khắc phục trường hợp người dùng gõ 12:xx (ý là 00:xx sáng hôm sau) và kết thúc lúc 01:xx - 05:xx sáng
    if (rawStartHour === 12 && rawEndHour >= 1 && rawEndHour <= 5) {
      normalizedStartHour = 0;
    }

    const startDateObj = new Date(year, month, day, normalizedStartHour, rawStartMin, 0, 0);
    const endDateObj = new Date(year, month, day, rawEndHour, rawEndMin, 0, 0);

    // Nếu người dùng đặt lịch vào buổi đêm (21:00 - 23:59) cho ca họp rạng sáng (00:00 - 05:59) nhưng giữ nguyên ngày hôm nay
    const isSameDayAsNow =
      now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
    if (isSameDayAsNow && now.getHours() >= 21 && normalizedStartHour < 6) {
      startDateObj.setDate(startDateObj.getDate() + 1);
      endDateObj.setDate(endDateObj.getDate() + 1);
    }

    // Nếu giờ kết thúc nhỏ hơn hoặc bằng giờ bắt đầu (ví dụ: 23:56 -> 01:56), tự động cộng thêm 1 ngày cho giờ kết thúc
    if (endDateObj <= startDateObj) {
      endDateObj.setDate(endDateObj.getDate() + 1);
    }

    // Mở cổng Check-in sớm tối đa 2 tiếng (120 phút) trước giờ bắt đầu
    const earliestCheckinTime = new Date(startDateObj.getTime() - 2 * 60 * 60 * 1000);

    return { startDateObj, endDateObj, earliestCheckinTime };
  };

  // Kiểm tra điều kiện Check-in sớm tối đa 2 tiếng trước giờ bắt đầu
  const validateCheckinTimeWindow = (
    booking: BookingScheduleRecord
  ): {
    allowed: boolean;
    reason: string;
    windowLabel: string;
  } => {
    const now = new Date();
    const { startDateObj, endDateObj, earliestCheckinTime } = buildNormalizedMeetingDateRange(
      booking.bookingDate,
      booking.startTime,
      booking.endTime
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
    const windowLabel = `${earliestStr} – ${endStr}`;

    if (now < earliestCheckinTime) {
      return {
        allowed: false,
        reason: `Chưa đến giờ mở Check-in! Quy định chỉ nhận Check-in sớm tối đa 2 tiếng trước giờ bắt đầu (Mở cổng từ ${earliestStr} đến ${startStr}).`,
        windowLabel,
      };
    }

    if (now > endDateObj) {
      return {
        allowed: false,
        reason: `Ca họp (${booking.startTime} - ${booking.endTime}) đã kết thúc, không thể Check-in.`,
        windowLabel,
      };
    }

    return {
      allowed: true,
      reason: `Đang trong khung giờ Check-in hợp lệ (${earliestStr} – ${endStr}).`,
      windowLabel,
    };
  };

  // Kiểm tra xung đột trùng lịch phòng/ghế trong cùng khung giờ và ngày
  const checkScheduleConflict = (
    targetNodeCode: string,
    targetDate: string,
    candidateStartStr: string,
    candidateEndStr: string
  ): BookingScheduleRecord | null => {
    const candidateRange = buildNormalizedMeetingDateRange(
      targetDate,
      candidateStartStr,
      candidateEndStr
    );

    for (const existing of bookingsList) {
      if (existing.approvalStatus === 'REJECTED') continue;
      if (existing.nodeCode !== targetNodeCode || existing.bookingDate !== targetDate) continue;

      const existingRange = buildNormalizedMeetingDateRange(
        existing.bookingDate,
        existing.startTime,
        existing.endTime
      );

      // Hai khoảng thời gian giao nhau khi StartA < EndB và EndA > StartB
      if (
        candidateRange.startDateObj < existingRange.endDateObj &&
        candidateRange.endDateObj > existingRange.startDateObj
      ) {
        return existing;
      }
    }
    return null;
  };

  // Danh sách các ghế Hội trường đã có người đặt trong khung giờ đang chọn (để hiển thị trực quan trên bản xem trước)
  const occupiedAmphitheaterSeatsInSlot = useMemo(() => {
    const occupiedSet = new Set<string>();
    if (!isAmphitheaterSelected) return occupiedSet;

    const candidateRange = buildNormalizedMeetingDateRange(selectedDate, startTime, endTime);
    for (const item of bookingsList) {
      if (item.approvalStatus === 'REJECTED') continue;
      if (item.bookingDate !== selectedDate) continue;
      if (!AMPHITHEATER_SEATS.includes(item.nodeCode)) continue;

      const existingRange = buildNormalizedMeetingDateRange(
        item.bookingDate,
        item.startTime,
        item.endTime
      );
      if (
        candidateRange.startDateObj < existingRange.endDateObj &&
        candidateRange.endDateObj > existingRange.startDateObj
      ) {
        occupiedSet.add(item.nodeCode);
      }
    }
    return occupiedSet;
  }, [isAmphitheaterSelected, selectedDate, startTime, endTime, bookingsList]);

  // Nút điền nhanh khung giờ hợp lệ (Bắt đầu sau 30 phút tính từ hiện tại) để test Check-in QR ngay lập tức
  const handleFillQuickCheckinSlot = () => {
    const now = new Date();
    const startCandidate = new Date(now.getTime() + 30 * 60 * 1000);
    const endCandidate = new Date(now.getTime() + 90 * 60 * 1000);

    const year = startCandidate.getFullYear();
    const month = String(startCandidate.getMonth() + 1).padStart(2, '0');
    const day = String(startCandidate.getDate()).padStart(2, '0');

    const startStr = `${String(startCandidate.getHours()).padStart(2, '0')}:${String(
      startCandidate.getMinutes()
    ).padStart(2, '0')}`;
    const endStr = `${String(endCandidate.getHours()).padStart(2, '0')}:${String(
      endCandidate.getMinutes()
    ).padStart(2, '0')}`;

    setSelectedDate(`${year}-${month}-${day}`);
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

    const finalCode = isAmphitheaterSelected ? selectedAmphitheaterSeat : currentRoomNode.nodeCode;
    const finalLabel = isAmphitheaterSelected
      ? `[Hội trường Tầng 5 - Ghế ${selectedAmphitheaterSeat}] ${purposeTitle}`
      : purposeTitle;

    // Kiểm tra trùng lịch trước khi tạo
    const conflictItem = checkScheduleConflict(finalCode, selectedDate, startTime, endTime);
    if (conflictItem) {
      setBookingFormError(
        `Vị trí ${finalCode} đã có lịch đặt trong khung giờ (${conflictItem.startTime} – ${conflictItem.endTime}) bởi @${
          conflictItem.createdByUsername || 'System'
        }. Vui lòng chọn khung giờ hoặc vị trí khác.`
      );
      return;
    }

    // Quy tắc phân quyền: EMPLOYEE đặt phải chờ MANAGER hoặc SYS_ADMIN duyệt; MANAGER/ADMIN được duyệt tự động
    const isEmployeeRole = currentUser.role === 'EMPLOYEE';
    const newBookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: BookingScheduleRecord = {
      bookingId: newBookingId,
      nodeCode: finalCode,
      nodeLabel: finalLabel,
      floorLevel: currentRoomNode.floorLevel,
      bookingDate: selectedDate,
      startTime,
      endTime,
      purposeTitle,
      attendeeCount: isAmphitheaterSelected ? 1 : currentRoomNode.capacityCount,
      recurringOption,
      status: 'CONFIRMED',
      approvalStatus: isEmployeeRole ? 'PENDING_APPROVAL' : 'APPROVED',
      createdByUsername: currentUser.username,
      createdByRole: currentUser.role,
      approvedByUsername: isEmployeeRole ? undefined : currentUser.username,
    };

    onCreateNewBooking(newRecord);
    // Tự động chuyển khung QR sang đúng vé vừa đặt để tránh quét nhầm vé cũ
    setSelectedBookingForQr(newBookingId);
    setBookingSuccessBanner(
      isEmployeeRole
        ? `Đã gửi yêu cầu đặt phòng ${finalCode} (${startTime} – ${endTime}). Hệ thống đã gửi thông báo tới Quản lý & Admin để phê duyệt.`
        : `Đã tạo và phê duyệt vé ${newBookingId} cho vị trí ${finalCode} (${startTime} – ${endTime}).`
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
  }, [activeQrBooking]);

  const qrTargetCheckinUrl = useMemo(() => {
    if (!activeQrBooking) return `${window.location.origin}/qr-checkin`;
    const params = new URLSearchParams({
      bookingId: activeQrBooking.bookingId,
      room: activeQrBooking.nodeCode,
      floor: String(activeQrBooking.floorLevel),
      slot: `${activeQrBooking.startTime}-${activeQrBooking.endTime}`,
      date: activeQrBooking.bookingDate,
      title: activeQrBooking.nodeLabel,
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

    onConfirmCheckinBooking(activeQrBooking.bookingId);
    window.open(qrTargetCheckinUrl, '_blank', 'noopener,noreferrer');
  };

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
              Đặt lịch Phòng họp, Xem trước Bố cục & Cấp Mã QR Check-in
            </h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Quy tắc: Check-in mở trước giờ họp tối đa 2 tiếng • Nhân viên đặt phòng cần Quản lý
              hoặc Admin xác nhận
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFillQuickCheckinSlot}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isDark
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            }`}
            title="Tự động điền giờ bắt đầu sau 30 phút tính từ bây giờ để kiểm thử Quét QR ngay lập tức"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Điền nhanh Giờ Test Check-in Ngay
          </button>

          <span
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${
              isDark
                ? 'bg-teal-500/10 border-teal-500/20 text-teal-300'
                : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}
          >
            Đang chọn: {currentRoomNode?.nodeCode} ({currentRoomNode?.capacityCount} người)
          </span>
        </div>
      </div>

      {/* Main Grid: Left Booking & Layout Preview (7 cols) | Right QR Check-in & Ticket List (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: FORM ĐẶT PHÒNG & BẢN XEM TRƯỚC BỐ CỤC TƯƠNG ỨNG */}
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
                      {nodesList
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
                  2. Ngày họp
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
                  Lặp định kỳ
                </label>
                <select
                  value={recurringOption}
                  onChange={(e) => setRecurringOption(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="NONE">Đặt đơn lẻ (1 lần)</option>
                  <option value="WEEKLY">Lặp hàng tuần (Weekly)</option>
                </select>
              </div>
            </div>

            {/* BẢN XEM TRƯỚC BỐ CỤC PHÒNG TƯƠNG ỨNG */}
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
                  {/* Sơ đồ 2D thu nhỏ mô phỏng đúng hình dáng bàn và số lượng ghế */}
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
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                {currentUser.role === 'EMPLOYEE'
                  ? `Gửi Yêu cầu Đặt ${
                      isAmphitheaterSelected ? selectedAmphitheaterSeat : currentRoomNode?.nodeCode
                    }`
                  : `Xác nhận Đặt Phòng ${
                      isAmphitheaterSelected ? selectedAmphitheaterSeat : currentRoomNode?.nodeCode
                    }`}
              </button>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI: MÃ QR THẬT QUÉT ĐƯỢC CÓ LOGO Ở GIỮA & NÚT DEMO NHẢY TAB MỚI */}
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
                  Mã QR Check-in Thực tế & Danh sách Vé
                </h2>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Mở nhận Check-in sớm tối đa 2 tiếng trước giờ bắt đầu
                </p>
              </div>
            </div>

            {checkinErrorAlert && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{checkinErrorAlert}</span>
              </div>
            )}

            {/* KHUNG HIỂN THỊ MÃ QR THẬT CÓ LOGO SPOTMATRIX Ở CHÍNH GIỮA */}
            {activeQrBooking ? (
              <div
                className={`p-5 rounded-2xl border text-center mb-4 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#F8FAFC] border-indigo-100'
                }`}
              >
                <div className="text-xs font-extrabold text-indigo-600 mb-1">
                  Vé: {activeQrBooking.bookingId} • Phòng: {activeQrBooking.nodeCode} •{' '}
                  {activeQrBooking.startTime} – {activeQrBooking.endTime}
                </div>

                {/* Badge báo trạng thái khung giờ thực tế của vé đang chọn */}
                {activeBookingTimeValidation && (
                  <div className="mb-2.5 flex items-center justify-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        activeQrBooking.status === 'CHECKED_IN'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : activeBookingTimeValidation.allowed
                          ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {activeQrBooking.status === 'CHECKED_IN' ? (
                        <>
                          <Check className="w-3 h-3" />
                          Đã Check-in lúc: {activeQrBooking.checkedInAtText || 'Đúng hạn'}
                        </>
                      ) : activeBookingTimeValidation.allowed ? (
                        <>
                          <Check className="w-3 h-3" />
                          Sẵn sàng quét QR (Khung giờ mở: {activeBookingTimeValidation.windowLabel})
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          Khung giờ mở Check-in: {activeBookingTimeValidation.windowLabel} (Ngày{' '}
                          {activeQrBooking.bookingDate})
                        </>
                      )}
                    </span>
                  </div>
                )}

                <div className="relative inline-block p-3 bg-white rounded-2xl border-2 border-indigo-100 shadow-md">
                  <img
                    src={realQrImageSrc}
                    alt="SpotMatrix Check-in QR Code"
                    className={`w-44 h-44 object-contain rounded-lg ${
                      activeQrBooking.approvalStatus !== 'APPROVED' ? 'opacity-25 blur-[2px]' : ''
                    }`}
                  />
                  {/* Ô nhỏ ở chính giữa chứa Logo SpotMatrix */}
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
                          {item.nodeCode}
                        </span>
                        <span
                          className={`text-xs font-bold truncate max-w-[165px] ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {item.nodeLabel}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.status === 'CHECKED_IN'
                              ? 'bg-teal-500/15 text-teal-600'
                              : item.approvalStatus === 'PENDING_APPROVAL'
                              ? 'bg-amber-500/15 text-amber-600'
                              : item.approvalStatus === 'REJECTED'
                              ? 'bg-rose-500/15 text-rose-600'
                              : 'bg-indigo-500/15 text-indigo-600'
                          }`}
                        >
                          {item.status === 'CHECKED_IN'
                            ? `ĐÃ QUÉT (${item.checkedInAtText || 'Đúng hạn'})`
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
                          {item.bookingDate} • {item.startTime} – {item.endTime}
                        </span>
                        {item.approvedByUsername && (
                          <span>• Duyệt bởi: @{item.approvedByUsername}</span>
                        )}
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
              Vé đang chọn hiển thị khung viền xanh tím. Bấm vào bất kỳ vé nào bên dưới để đổi mã
              QR tương ứng.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};