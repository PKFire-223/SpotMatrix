import React, { useState, useMemo, useRef } from 'react';
import {
  CalendarCheck,
  Clock,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Building2,
  Users,
  Trash2,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BookingPayloadItem,
  HallBookingModeType,
  OrganizationDepartmentItem,
  RecurringOptionType,
  SeatStatusType,
  UserRoleType,
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';
import {
  findApprovedHallEventInSlot,
  formatIsoDateString,
  generateRecurringOccurrenceDates,
  getRoleWeeklyQuotaConfig,
  validateQrCheckinTimeWindow,
  validateSingleAndRecurringCollision,
} from '../Function/Validators/BookingValidator';

export interface BookingTimeWindowInput {
  dateIso: string;
  start: string;
  end: string;
  recurringOption: RecurringOptionType;
  occurrenceDates: string[];
  lockVersion: number;
  bookingMode?: HallBookingModeType;
  allowedDepartments?: string[];
  parentHallEventBookingId?: string | null;
}

export interface BookingCalendarPagesProps {
  bookingsList: BookingPayloadItem[];
  workspaceNodes: WorkspaceNodeItem[];
  departmentsList?: OrganizationDepartmentItem[];
  selectedNode: WorkspaceNodeItem | null;
  preselectedSlot?: {
    start: string;
    end: string;
    seatCode?: string;
    hallMode?: 'HALL_EVENT_RENTAL' | 'HALL_SEAT_BOOKING';
  } | null;
  userEmail: string;
  userRole?: UserRoleType;
  userDepartment?: string;
  isDark?: boolean;
  onCreateNewBooking: (
    userEmail: string,
    purposeNote: string,
    customTargetCode?: string,
    timeWindow?: BookingTimeWindowInput
  ) => void;
  onCheckInBooking?: (bookingId: string, exactScanTimeText?: string) => void;
  onCancelBooking?: (bookingId: string) => void;
  onUpdateNodeStatus?: (nodeId: string, nextStatus: SeatStatusType) => void;
  onRecordConcurrencyAudit?: (
    eventCategory:
      | 'OPTIMISTIC_LOCK_WIN'
      | 'OPTIMISTIC_LOCK_REJECTED'
      | 'AUTO_RELEASE_NO_SHOW'
      | 'QR_CHECKIN_SUCCESS',
    actorEmail: string,
    targetNodeId: string,
    detailMessage: string,
    outcomeStatus?: 'SUCCESS' | 'CONFLICT_BLOCKED' | 'AUTO_REVOKED',
    lockVersionAttempted?: number
  ) => void;
  onPenalizeNoShowBooking?: (
    bookingId: string,
    targetUserEmail: string,
    nodeCode: string
  ) => void;
}

const HALL_SEAT_CODES = [
  'H01-A1',
  'H01-A2',
  'H01-A3',
  'H01-A4',
  'H01-A5',
  'H01-A6',
  'H01-A7',
  'H01-B1',
  'H01-B2',
  'H01-B3',
  'H01-B4',
  'H01-B5',
  'H01-B6',
  'H01-B7',
  'H01-B8',
  'H01-B9',
  'H01-C1',
  'H01-C2',
  'H01-C3',
  'H01-C4',
  'H01-C5',
  'H01-C6',
  'H01-C7',
  'H01-C8',
  'H01-C9',
  'H01-C10',
  'H01-C11',
  'H01-C12',
];

export const BookingCalendarPages: React.FC<BookingCalendarPagesProps> = ({
  bookingsList,
  workspaceNodes,
  departmentsList = [],
  selectedNode,
  preselectedSlot,
  userEmail,
  userRole = 'SYS_ADMIN',
  userDepartment = 'Product & Engineering',
  isDark = false,
  onCreateNewBooking,
  onCheckInBooking,
  onCancelBooking,
}) => {
  const todayIso = useMemo(() => formatIsoDateString(new Date()), []);
  const bookingScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [selectedRoomCode, setSelectedRoomCode] = useState<string>(
    selectedNode?.nodeCode || 'M1-01'
  );
  const [hallBookingMode, setHallBookingMode] = useState<
    'HALL_EVENT_RENTAL' | 'HALL_SEAT_BOOKING'
  >(
    preselectedSlot?.hallMode ||
      (userRole === 'EMPLOYEE' ? 'HALL_SEAT_BOOKING' : 'HALL_EVENT_RENTAL')
  );
  const [selectedHallSeat, setSelectedHallSeat] = useState<string>(
    preselectedSlot?.seatCode && preselectedSlot.seatCode !== 'H-01'
      ? preselectedSlot.seatCode
      : 'H01-A4'
  );

  const [bookingDateIso, setBookingDateIso] = useState<string>(todayIso);
  const [startTimeIso, setStartTimeIso] = useState<string>(
    preselectedSlot?.start || '13:00'
  );
  const [endTimeIso, setEndTimeIso] = useState<string>(
    preselectedSlot?.end || '15:00'
  );
  const [recurringOption, setRecurringOption] =
    useState<RecurringOptionType>('NONE');
  const [purposeNote, setPurposeNote] = useState<string>(
    'Họp triển khai dự án & Review kiến trúc 3D'
  );

  const allDepartmentNames = useMemo(() => {
    if (departmentsList.length > 0) {
      return departmentsList.map(
        (d: OrganizationDepartmentItem) => d.departmentName
      );
    }
    return [
      'System Governance',
      'Product & Engineering',
      'Product Design & UX',
      'AI & Data Science',
    ];
  }, [departmentsList]);

  const [allowedDepartments, setAllowedDepartments] =
    useState<string[]>(allDepartmentNames);

  const [validationBanner, setValidationBanner] = useState<{
    type: 'SUCCESS' | 'ERROR';
    message: string;
  } | null>(null);

  const isFloor5HallSelected =
    selectedRoomCode === 'H-01' || /^H01-[A-C]\d+$/i.test(selectedRoomCode);

  const activeHallEventLookup = useMemo(() => {
    return findApprovedHallEventInSlot(
      bookingDateIso,
      startTimeIso,
      endTimeIso,
      bookingsList
    );
  }, [bookingDateIso, startTimeIso, endTimeIso, bookingsList]);

  const quotaInfo = useMemo(() => {
    const config = getRoleWeeklyQuotaConfig(userRole);
    const activeMyBookings = bookingsList.filter(
      (b: BookingPayloadItem) =>
        b.userEmail.toLowerCase() === userEmail.toLowerCase() &&
        b.bookingStatus !== 'CANCELLED' &&
        b.approvalStatus !== 'REJECTED'
    );
    return {
      ...config,
      usedBookings: activeMyBookings.length,
    };
  }, [userRole, userEmail, bookingsList]);

  const handleToggleAllowedDepartment = (deptName: string) => {
    setAllowedDepartments((prev: string[]) =>
      prev.includes(deptName)
        ? prev.filter((d: string) => d !== deptName)
        : [...prev, deptName]
    );
  };

  const handleScrollBookingList = (direction: 'DOWN' | 'TOP') => {
    if (!bookingScrollContainerRef.current) return;
    if (direction === 'TOP') {
      bookingScrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } else {
      bookingScrollContainerRef.current.scrollBy({
        top: 180,
        behavior: 'smooth',
      });
    }
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationBanner(null);

    const effectiveMode: HallBookingModeType = isFloor5HallSelected
      ? hallBookingMode
      : 'STANDARD_ROOM';

    const targetCode = isFloor5HallSelected
      ? hallBookingMode === 'HALL_EVENT_RENTAL'
        ? 'H-01'
        : selectedHallSeat
      : selectedRoomCode;

    const collisionCheck = validateSingleAndRecurringCollision(
      targetCode,
      userEmail,
      bookingDateIso,
      startTimeIso,
      endTimeIso,
      recurringOption,
      bookingsList,
      userRole,
      effectiveMode,
      userDepartment
    );

    if (!collisionCheck.isValid) {
      setValidationBanner({
        type: 'ERROR',
        message:
          collisionCheck.errorMessage ||
          'Không thể đặt phòng do vi phạm quy tắc hoặc trùng lịch.',
      });
      return;
    }

    const occurrences = generateRecurringOccurrenceDates(
      bookingDateIso,
      recurringOption
    );

    onCreateNewBooking(userEmail, purposeNote, targetCode, {
      dateIso: bookingDateIso,
      start: startTimeIso,
      end: endTimeIso,
      recurringOption,
      occurrenceDates: occurrences,
      lockVersion: 1,
      bookingMode: effectiveMode,
      allowedDepartments:
        effectiveMode === 'HALL_EVENT_RENTAL' ? allowedDepartments : [],
      parentHallEventBookingId:
        effectiveMode === 'HALL_SEAT_BOOKING'
          ? activeHallEventLookup.approvedEvent?.bookingId || null
          : null,
    });

    setValidationBanner({
      type: 'SUCCESS',
      message:
        effectiveMode === 'HALL_EVENT_RENTAL'
          ? userRole === 'SYS_ADMIN'
            ? `Đã thuê cả Hội trường H-01 thành công (Tự động duyệt cho Admin)! Các phòng ban [${allowedDepartments.join(
                ', '
              )}] đã có thể vào đặt ghế ngồi.`
            : `Đã gửi yêu cầu thuê cả Hội trường H-01 chờ System Admin phê duyệt!`
          : `Đã đặt lịch thành công cho vị trí ${targetCode} (${startTimeIso} – ${endTimeIso}, ngày ${bookingDateIso})!`,
    });
  };

  const handleVerifyAndScanQr = (booking: BookingPayloadItem) => {
    const check = validateQrCheckinTimeWindow(booking, new Date());
    if (!check.canScan) {
      setValidationBanner({
        type: 'ERROR',
        message: check.reasonText,
      });
      return;
    }

    if (onCheckInBooking) {
      const nowStr = `${new Date().toLocaleTimeString(
        'vi-VN'
      )} • Ngày ${new Date().toLocaleDateString('vi-VN')}`;
      onCheckInBooking(booking.bookingId, nowStr);
      setValidationBanner({
        type: 'SUCCESS',
        message: `Quét mã QR hợp lệ cho vé ${booking.bookingId} (${booking.nodeId})! ${check.reasonText}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Thông tin Hạn mức Role & Quy tắc Hội trường Tầng 5 */}
      <div
        className={`p-6 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-black tracking-tight">
              Đặt lịch Phòng họp (Tầng 1–4) & Điều phối Hội trường La Mã (Tầng 5)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-600 text-white">
              {quotaInfo.roleLabelVi}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Phòng ban của bạn:{' '}
            <strong className="text-indigo-500">{userDepartment}</strong> • Khung
            giờ cho phép quét mã QR Check-in:{' '}
            <strong>Trước 30 phút đến Trễ tối đa 30 phút</strong> so với giờ bắt
            đầu.
          </p>
        </div>

        <div
          className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
            isDark
              ? 'bg-slate-950 border-slate-800'
              : 'bg-indigo-50/70 border-indigo-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <div>
            <p className="text-[10px] uppercase text-slate-400 font-extrabold">
              Hạn mức Đặt lịch Tuần ({userRole})
            </p>
            <p className="font-extrabold">
              Đã dùng {quotaInfo.usedBookings} /{' '}
              {quotaInfo.maxBookingsPerWeek >= 999
                ? 'Không giới hạn'
                : `${quotaInfo.maxBookingsPerWeek} lần/tuần`}
            </p>
          </div>
        </div>
      </div>

      {validationBanner && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-bold ${
            validationBanner.type === 'ERROR'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
              : 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300'
          }`}
        >
          {validationBanner.type === 'ERROR' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="leading-relaxed">{validationBanner.message}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Form Đặt lịch (7 cột) */}
        <form
          onSubmit={handleSubmitBooking}
          className={`lg:col-span-7 p-6 rounded-3xl border space-y-5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-extrabold">
                Biểu mẫu Đăng ký Phòng họp & Hội trường Tầng 5
              </h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Optimistic Lock v1 • Chống trùng đa chiều
            </span>
          </div>

          {/* Hàng 1: Đã chuẩn hóa chiều cao nhãn không bao giờ bị rớt chữ "(Tầng 5)" xuống dòng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-xs font-bold block mb-1.5 whitespace-nowrap truncate">
                1. Chọn Phòng (Tầng 1–4) / Hội trường (Tầng 5)
              </label>
              <select
                value={isFloor5HallSelected ? 'H-01' : selectedRoomCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedRoomCode(val);
                  setValidationBanner(null);
                  if (val === 'H-01' && userRole === 'EMPLOYEE') {
                    setHallBookingMode('HALL_SEAT_BOOKING');
                  }
                }}
                className={`w-full h-[42px] px-3.5 rounded-xl border text-xs font-bold ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <optgroup label="Tầng 5 — Hội trường Đấu Trường La Mã (2 Chế độ)">
                  <option value="H-01">
                    H-01 — Hội trường Lớn Đấu Trường La Mã (Tầng 5 • 30 chỗ)
                  </option>
                </optgroup>
                {[1, 2, 3, 4].map((fl: number) => (
                  <optgroup key={fl} label={`Tầng ${fl} — 6 Phòng Họp Chuẩn`}>
                    {workspaceNodes
                      .filter((n: WorkspaceNodeItem) => n.floorLevel === fl)
                      .map((room: WorkspaceNodeItem) => (
                        <option key={room.nodeCode} value={room.nodeCode}>
                          [{`Tầng ${fl}`}] {room.nodeCode} — {room.nodeLabel} (
                          {room.capacityCount}P)
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1.5 whitespace-nowrap truncate">
                2. Ngày bắt đầu họp / sự kiện
              </label>
              <input
                type="date"
                value={bookingDateIso}
                onChange={(e) => setBookingDateIso(e.target.value)}
                className={`w-full h-[42px] px-3.5 rounded-xl border text-xs font-bold ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
          </div>

          {isFloor5HallSelected && (
            <div
              className={`p-4 rounded-2xl border space-y-4 ${
                isDark
                  ? 'bg-indigo-950/25 border-indigo-500/30'
                  : 'bg-indigo-50/60 border-indigo-200/80'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Chế độ Sử dụng Hội trường Tầng 5 (Phân quyền theo Role:{' '}
                  {userRole})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={userRole === 'EMPLOYEE'}
                  onClick={() => setHallBookingMode('HALL_EVENT_RENTAL')}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    hallBookingMode === 'HALL_EVENT_RENTAL'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : userRole === 'EMPLOYEE'
                      ? 'opacity-50 cursor-not-allowed bg-slate-200/60 dark:bg-slate-900 border-slate-300 dark:border-slate-800'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/40'
                      : 'bg-white border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold">
                      Dạng 1: Thuê Cả Hội Trường (H-01)
                    </span>
                    {userRole === 'EMPLOYEE' && (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <p
                    className={`text-[11px] mt-1 ${
                      hallBookingMode === 'HALL_EVENT_RENTAL'
                        ? 'text-indigo-100'
                        : 'text-slate-400'
                    }`}
                  >
                    {userRole === 'SYS_ADMIN'
                      ? 'Admin thuê tổ chức sự kiện ngay không cần cấp phép'
                      : userRole === 'MANAGER'
                      ? 'Quản lý được thuê cả phòng nhưng cần Admin chấp nhận'
                      : 'Nhân viên không có quyền thuê cả Hội trường'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setHallBookingMode('HALL_SEAT_BOOKING')}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    hallBookingMode === 'HALL_SEAT_BOOKING'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 hover:border-teal-500/40'
                      : 'bg-white border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold">
                      Dạng 2: Đặt Chỗ Ghế Ngồi (H01-A1..C12)
                    </span>
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <p
                    className={`text-[11px] mt-1 ${
                      hallBookingMode === 'HALL_SEAT_BOOKING'
                        ? 'text-teal-100'
                        : 'text-slate-400'
                    }`}
                  >
                    Chỉ mở đặt ghế khi Hội trường đã có sự kiện được duyệt &
                    đúng phòng ban
                  </p>
                </button>
              </div>

              {hallBookingMode === 'HALL_EVENT_RENTAL' ? (
                <div className="space-y-2 pt-2 border-t border-indigo-200/50 dark:border-slate-800">
                  <label className="text-xs font-extrabold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    Chọn các Phòng ban được phép tham gia & đặt ghế tại sự kiện
                    này:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allDepartmentNames.map((dept: string) => {
                      const checked = allowedDepartments.includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => handleToggleAllowedDepartment(dept)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                            checked
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-400'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{dept}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    * Nhân sự thuộc phòng ban được tick mới có thể đặt ghế ngồi;
                    các phòng ban không được chọn sẽ bị chặn đặt ghế (System
                    Admin luôn có toàn quyền).
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-indigo-200/50 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold">
                      Chọn Mã Ghế Vòm La Mã (H01-A1 .. H01-C12):
                    </label>
                    <select
                      value={selectedHallSeat}
                      onChange={(e) => setSelectedHallSeat(e.target.value)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-teal-300'
                          : 'bg-white border-slate-300 text-teal-700'
                      }`}
                    >
                      {HALL_SEAT_CODES.map((sc: string) => (
                        <option key={sc} value={sc}>
                          Ghế {sc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeHallEventLookup.approvedEvent ? (
                    <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs">
                      <p className="font-extrabold text-teal-700 dark:text-teal-300">
                        Sự kiện đang mở: “
                        {activeHallEventLookup.approvedEvent.purposeNote}”
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Phòng ban được tham gia:{' '}
                        <strong>
                          {activeHallEventLookup.approvedEvent.allowedDepartments?.join(
                            ', '
                          ) || 'Tất cả'}
                        </strong>
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 font-bold">
                      Hiện khung giờ ({startTimeIso} – {endTimeIso}) ngày{' '}
                      {bookingDateIso} KHÔNG CÓ SỰ KIỆN NÀO ĐƯỢC DUYỆT tại Hội
                      trường! Nếu bấm đặt ghế, hệ thống sẽ chặn và thông báo
                      phòng hiện không có sự kiện để tham gia.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold block mb-1.5">
                Giờ bắt đầu (24h)
              </label>
              <input
                type="time"
                value={startTimeIso}
                onChange={(e) => setStartTimeIso(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1.5">
                Giờ kết thúc (24h)
              </label>
              <input
                type="time"
                value={endTimeIso}
                onChange={(e) => setEndTimeIso(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1.5">
                Chu kỳ đặt lịch (Đơn lẻ / Định kỳ)
              </label>
              <select
                value={recurringOption}
                onChange={(e) =>
                  setRecurringOption(e.target.value as RecurringOptionType)
                }
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="NONE">Đơn lẻ (1 buổi duy nhất)</option>
                <option value="DAILY">Hàng ngày (5 ngày liên tiếp)</option>
                <option value="WEEKLY">Hàng tuần (4 tuần liên tiếp)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1.5">
              Mục đích cuộc họp / Tên sự kiện Hội trường
            </label>
            <input
              type="text"
              value={purposeNote}
              onChange={(e) => setPurposeNote(e.target.value)}
              placeholder="Nhập tên cuộc họp hoặc sự kiện..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isFloor5HallSelected
                ? hallBookingMode === 'HALL_EVENT_RENTAL'
                  ? userRole === 'SYS_ADMIN'
                    ? 'Xác nhận Thuê Cả Hội Trường H-01 (Duyệt ngay)'
                    : 'Gửi Yêu cầu Thuê Cả Hội Trường H-01 (Chờ Admin duyệt)'
                  : `Xác nhận Đặt Ghế Hội Trường ${selectedHallSeat}`
                : `Xác nhận Đặt Phòng ${selectedRoomCode}`}
            </span>
          </button>
        </form>

        {/* Cột Phải: Danh sách Vé Đặt phòng & Quét Mã QR Check-in (Đúng khung ±30 phút) */}
        <div
          className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between space-y-4 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-600" />
                <h2 className="text-sm font-extrabold">
                  Vé Đặt lịch & Quét Mã QR (Cửa sổ ±30 Phút)
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-400">
                {bookingsList.length} lịch hoạt động
              </span>
            </div>

            {/* Khung cuộn có trang trí Gradient Fade-out & Thanh điều hướng thẩm mỹ ở đáy */}
            <div className="relative">
              <div
                ref={bookingScrollContainerRef}
                className="space-y-3 max-h-[390px] overflow-y-auto pr-1 pb-12 scroll-smooth"
              >
                {bookingsList.map((bk: BookingPayloadItem) => {
                  const qrWindowStatus = validateQrCheckinTimeWindow(
                    bk,
                    new Date()
                  );
                  const isCheckedIn = bk.bookingStatus === 'CHECKED_IN';
                  const isPending = bk.approvalStatus === 'PENDING_APPROVAL';

                  return (
                    <div
                      key={bk.bookingId}
                      className={`p-4 rounded-2xl border space-y-2.5 transition ${
                        isDark
                          ? 'bg-slate-950/75 border-slate-800 hover:border-indigo-500/40'
                          : 'bg-slate-50/90 border-slate-200/90 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-indigo-600 text-white">
                              {bk.nodeId}
                            </span>
                            {bk.bookingMode === 'HALL_EVENT_RENTAL' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-300">
                                SỰ KIỆN HỘI TRƯỜNG
                              </span>
                            )}
                            <span className="text-xs font-extrabold truncate max-w-[180px]">
                              {bk.purposeNote}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                            <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>
                              {bk.bookingDateIso || todayIso} •{' '}
                              <strong>
                                {bk.startTimeIso} – {bk.endTimeIso}
                              </strong>
                            </span>
                            <span>
                              • {bk.departmentName || 'Product & Engineering'}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isCheckedIn
                                ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                                : isPending
                                ? 'bg-amber-500/15 text-amber-600'
                                : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {isCheckedIn
                              ? `ĐÃ QUÉT (${bk.checkedInAtIso || 'Hôm nay'})`
                              : isPending
                              ? 'CHỜ ADMIN DUYỆT'
                              : 'ĐÃ DUYỆT • CHỜ QUÉT QR'}
                          </span>

                          {onCancelBooking && (
                            <button
                              type="button"
                              onClick={() => onCancelBooking(bk.bookingId)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition"
                              title="Hủy lịch đặt này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {bk.bookingMode === 'HALL_EVENT_RENTAL' &&
                        bk.allowedDepartments &&
                        bk.allowedDepartments.length > 0 && (
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-1.5 rounded-lg">
                            Phòng ban được đặt ghế:{' '}
                            <strong>{bk.allowedDepartments.join(', ')}</strong>
                          </div>
                        )}

                      {!isCheckedIn && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                          <span
                            className={`text-[11px] font-semibold ${
                              qrWindowStatus.canScan
                                ? 'text-teal-600 dark:text-teal-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {qrWindowStatus.canScan
                              ? 'Đang trong khung ±30 phút: Có thể quét QR ngay!'
                              : 'Chỉ mở quét QR từ trước 30p đến trễ 30p so với giờ bắt đầu'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleVerifyAndScanQr(bk)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shrink-0 ${
                              qrWindowStatus.canScan
                                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500/20'
                            }`}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Quét mã QR</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Thanh Trang trí Kính mờ (Decorative Footer Dock) che phần cắt ngang ở đáy khung cuộn */}
              {bookingsList.length > 2 && (
                <div
                  className={`pointer-events-none absolute bottom-0 inset-x-0 h-14 rounded-b-2xl flex items-end justify-between px-3 pb-1.5 bg-gradient-to-t ${
                    isDark
                      ? 'from-slate-900 via-slate-900/90 to-transparent'
                      : 'from-white via-white/95 to-transparent'
                  }`}
                >
                  <span className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 backdrop-blur-md">
                    <Sparkles className="w-3 h-3" />
                    Đang bảo vệ {bookingsList.length} phiên bằng Optimistic Lock
                  </span>

                  <div className="pointer-events-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleScrollBookingList('DOWN')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border flex items-center gap-1 shadow-sm transition ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      title="Cuộn xuống xem tiếp lịch bên dưới"
                    >
                      <span>Xem tiếp</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScrollBookingList('TOP')}
                      className={`p-1 rounded-full border shadow-sm transition ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      title="Lên đầu danh sách"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};