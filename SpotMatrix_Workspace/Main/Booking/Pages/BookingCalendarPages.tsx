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
  FileText,
} from 'lucide-react';
import {
  BookingPayloadItem,
  HallBookingModeType,
  OrganizationDepartmentItem,
  RecurringOptionType,
  SeatStatusType,
  UserRoleType,
  WebLanguageCodeType,
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
  approvalRequestReason?: string;
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
  webLanguage?: WebLanguageCodeType;
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

interface BookingPageTranslationPack {
  pageTitle: string;
  yourDeptLabel: string;
  qrRuleText: string;
  qrRuleBold: string;
  weeklyQuotaTitle: (role: string) => string;
  weeklyQuotaUsed: (used: number, max: number) => string;
  formHeaderTitle: string;
  formHeaderBadge: string;
  field1RoomLabel: string;
  hallOptGroupLabel: string;
  hallOptionText: string;
  floorOptGroupLabel: (fl: number) => string;
  field2DateLabel: string;
  hallModeHeader: (role: string) => string;
  mode1Title: string;
  mode1SubAdmin: string;
  mode1SubManager: string;
  mode1SubEmployee: string;
  mode2Title: string;
  mode2Sub: string;
  selectAllowedDeptsLabel: string;
  allowedDeptsHint: string;
  selectHallSeatLabel: string;
  seatOptionPrefix: string;
  activeEventLabel: string;
  allowedDeptsShort: string;
  noActiveEventWarning: (s: string, e: string, d: string) => string;
  startTimeLabel: string;
  endTimeLabel: string;
  recurringLabel: string;
  recNone: string;
  recDaily: string;
  recWeekly: string;
  purposeLabel: string;
  purposePlaceholder: string;
  approvalReasonLabel: string;
  approvalReasonBadge: string;
  approvalReasonPlaceholder: string;
  approvalReasonRequiredError: string;
  submitRentHallAdmin: string;
  submitRentHallManager: string;
  submitHallSeat: (seat: string) => string;
  submitRoomApproved: (code: string) => string;
  submitRoomPendingApproval: (code: string) => string;
  ticketListHeader: string;
  activeCountBadge: (count: number) => string;
  hallEventBadge: string;
  statusCheckedIn: (time: string) => string;
  statusPendingApproval: string;
  statusApprovedWaitQr: string;
  reasonTagLabel: string;
  qrWindowReadyText: string;
  qrWindowWaitText: string;
  scanQrBtn: string;
  lockFooterText: (count: number) => string;
  scrollMoreBtn: string;
}

const BOOKING_I18N: Record<WebLanguageCodeType, BookingPageTranslationPack> = {
  vi: {
    pageTitle: 'Đặt lịch Phòng họp (Tầng 1–4) & Điều phối Hội trường La Mã (Tầng 5)',
    yourDeptLabel: 'Phòng ban của bạn:',
    qrRuleText: 'Khung giờ cho phép quét mã QR Check-in:',
    qrRuleBold: 'Trước 30 phút đến Trễ tối đa 30 phút so với giờ bắt đầu.',
    weeklyQuotaTitle: (role) => `Hạn mức Đặt lịch Tuần (${role})`,
    weeklyQuotaUsed: (used, max) =>
      `Đã dùng ${used} / ${max >= 999 ? 'Không giới hạn' : `${max} lần/tuần`}`,
    formHeaderTitle: 'Biểu mẫu Đăng ký Phòng họp & Hội trường Tầng 5',
    formHeaderBadge: 'Optimistic Lock • Chống trùng đa chiều',
    field1RoomLabel: '1. Chọn Phòng (Tầng 1–4) / Hội trường (Tầng 5)',
    hallOptGroupLabel: 'Tầng 5 — Hội trường Đấu Trường La Mã (2 Chế độ)',
    hallOptionText: 'H-01 — Hội trường Lớn Đấu Trường La Mã (Tầng 5 • 30 chỗ)',
    floorOptGroupLabel: (fl) => `Tầng ${fl} — 6 Phòng Họp Chuẩn`,
    field2DateLabel: '2. Ngày bắt đầu họp / sự kiện',
    hallModeHeader: (role) => `Chế độ Sử dụng Hội trường Tầng 5 (Phân quyền Role: ${role})`,
    mode1Title: 'Dạng 1: Thuê Cả Hội Trường (H-01)',
    mode1SubAdmin: 'Admin thuê tổ chức sự kiện ngay không cần cấp phép',
    mode1SubManager: 'Quản lý được thuê cả phòng nhưng cần Admin chấp nhận',
    mode1SubEmployee: 'Nhân viên không có quyền thuê cả Hội trường',
    mode2Title: 'Dạng 2: Đặt Chỗ Ghế Ngồi (H01-A1..C12)',
    mode2Sub: 'Chỉ mở đặt ghế khi Hội trường đã có sự kiện được duyệt & đúng phòng ban',
    selectAllowedDeptsLabel: 'Chọn các Phòng ban được phép tham gia & đặt ghế tại sự kiện này:',
    allowedDeptsHint:
      '* Nhân sự thuộc phòng ban được tick mới có thể đặt ghế ngồi; các phòng ban không được chọn sẽ bị chặn đặt ghế (System Admin luôn có toàn quyền).',
    selectHallSeatLabel: 'Chọn Mã Ghế Vòm La Mã (H01-A1 .. H01-C12):',
    seatOptionPrefix: 'Ghế',
    activeEventLabel: 'Sự kiện đang mở:',
    allowedDeptsShort: 'Phòng ban được tham gia:',
    noActiveEventWarning: (s, e, d) =>
      `Hiện khung giờ (${s} – ${e}) ngày ${d} KHÔNG CÓ SỰ KIỆN NÀO ĐƯỢC DUYỆT tại Hội trường! Nếu bấm đặt ghế, hệ thống sẽ chặn và thông báo phòng hiện không có sự kiện để tham gia.`,
    startTimeLabel: 'Giờ bắt đầu (24h)',
    endTimeLabel: 'Giờ kết thúc (24h)',
    recurringLabel: 'Chu kỳ đặt lịch (Đơn lẻ / Định kỳ)',
    recNone: 'Đơn lẻ (1 buổi duy nhất)',
    recDaily: 'Hàng ngày (5 ngày liên tiếp)',
    recWeekly: 'Hàng tuần (4 tuần liên tiếp)',
    purposeLabel: 'Mục đích cuộc họp / Tên sự kiện Hội trường',
    purposePlaceholder: 'Nhập tên cuộc họp hoặc sự kiện...',
    approvalReasonLabel: 'Lý do xin phép đặt phòng / thuê Hội trường (Gửi Quản lý & Admin duyệt)',
    approvalReasonBadge: 'Bắt buộc khi chờ xác nhận',
    approvalReasonPlaceholder:
      'Nêu rõ lý do cần sử dụng phòng, số lượng thành viên tham dự và yêu cầu thiết bị để Quản lý/Admin xét duyệt nhanh...',
    approvalReasonRequiredError:
      'Vui lòng nhập Lý do xin phép đặt phòng để Quản lý / Admin xem xét phê duyệt!',
    submitRentHallAdmin: 'Xác nhận Thuê Cả Hội Trường H-01 (Duyệt ngay)',
    submitRentHallManager: 'Gửi Yêu cầu Thuê Hội Trường H-01 Kèm Lý Do (Chờ Admin duyệt)',
    submitHallSeat: (seat) => `Xác nhận Đặt Ghế Hội Trường ${seat}`,
    submitRoomApproved: (code) => `Xác nhận Đặt Phòng ${code} (Duyệt ngay)`,
    submitRoomPendingApproval: (code) => `Gửi Yêu cầu Xin Phép Đặt Phòng ${code} (Chờ duyệt)`,
    ticketListHeader: 'Vé Đặt lịch & Quét Mã QR (Cửa sổ ±30 Phút)',
    activeCountBadge: (c) => `${c} lịch hoạt động`,
    hallEventBadge: 'SỰ KIỆN HỘI TRƯỜNG',
    statusCheckedIn: (t) => `ĐÃ QUÉT (${t})`,
    statusPendingApproval: 'CHỜ PHÊ DUYỆT',
    statusApprovedWaitQr: 'ĐÃ DUYỆT • CHỜ QUÉT QR',
    reasonTagLabel: 'Lý do xin phép:',
    qrWindowReadyText: 'Đang trong khung ±30 phút: Có thể quét QR ngay!',
    qrWindowWaitText: 'Chỉ mở quét QR từ trước 30p đến trễ 30p so với giờ bắt đầu',
    scanQrBtn: 'Quét mã QR',
    lockFooterText: (c) => `Đang bảo vệ ${c} phiên bằng Optimistic Lock`,
    scrollMoreBtn: 'Xem tiếp',
  },
  en: {
    pageTitle: 'Meeting Room Booking (Floors 1–4) & Colosseum Hall Governance (Floor 5)',
    yourDeptLabel: 'Your Department:',
    qrRuleText: 'QR Check-in Window:',
    qrRuleBold: 'From 30 minutes before to 30 minutes after start time.',
    weeklyQuotaTitle: (role) => `Weekly Booking Quota (${role})`,
    weeklyQuotaUsed: (used, max) =>
      `Used ${used} / ${max >= 999 ? 'Unlimited' : `${max} per week`}`,
    formHeaderTitle: 'Room & Floor 5 Amphitheater Reservation Form',
    formHeaderBadge: 'Optimistic Lock • Conflict Guard',
    field1RoomLabel: '1. Select Room (Floors 1–4) / Amphitheater (Floor 5)',
    hallOptGroupLabel: 'Floor 5 — Colosseum Amphitheater (2 Modes)',
    hallOptionText: 'H-01 — Colosseum Main Amphitheater (Floor 5 • 30 seats)',
    floorOptGroupLabel: (fl) => `Floor ${fl} — 6 Standard Meeting Rooms`,
    field2DateLabel: '2. Meeting / Event Date',
    hallModeHeader: (role) => `Floor 5 Hall Mode (Role Permission: ${role})`,
    mode1Title: 'Mode 1: Rent Entire Hall (H-01)',
    mode1SubAdmin: 'Admin books whole-hall events with instant approval',
    mode1SubManager: 'Manager requests whole-hall rental (requires Admin approval)',
    mode1SubEmployee: 'Employees cannot rent the entire Hall',
    mode2Title: 'Mode 2: Book Individual Seat (H01-A1..C12)',
    mode2Sub: 'Open only when an approved event exists for your department',
    selectAllowedDeptsLabel: 'Select Departments Allowed to Join & Reserve Seats:',
    allowedDeptsHint:
      '* Only members of checked departments can book seats; unchecked departments will be blocked (System Admin always has full access).',
    selectHallSeatLabel: 'Select Colosseum Tiered Seat (H01-A1 .. H01-C12):',
    seatOptionPrefix: 'Seat',
    activeEventLabel: 'Active Approved Event:',
    allowedDeptsShort: 'Eligible Departments:',
    noActiveEventWarning: (s, e, d) =>
      `Time slot (${s} – ${e}) on ${d} currently has NO APPROVED EVENT in the Hall! Seat booking is locked until an event is approved.`,
    startTimeLabel: 'Start Time (24h)',
    endTimeLabel: 'End Time (24h)',
    recurringLabel: 'Recurrence Cycle (Single / Recurring)',
    recNone: 'Single (1 session only)',
    recDaily: 'Daily (5 consecutive days)',
    recWeekly: 'Weekly (4 consecutive weeks)',
    purposeLabel: 'Meeting Purpose / Hall Event Title',
    purposePlaceholder: 'Enter meeting subject or event title...',
    approvalReasonLabel: 'Booking Permission Reason (Sent to Manager / Admin for Approval)',
    approvalReasonBadge: 'Required for approval request',
    approvalReasonPlaceholder:
      'State why you need this room, expected attendees, and equipment requirements for fast approval...',
    approvalReasonRequiredError:
      'Please provide a booking permission reason for Manager / Admin review!',
    submitRentHallAdmin: 'Confirm Whole-Hall Rental H-01 (Instant Approval)',
    submitRentHallManager: 'Submit Hall Rental Request H-01 with Reason (Pending Admin)',
    submitHallSeat: (seat) => `Confirm Hall Seat Reservation ${seat}`,
    submitRoomApproved: (code) => `Confirm Room Booking ${code} (Instant Approval)`,
    submitRoomPendingApproval: (code) => `Submit Room Request ${code} with Reason (Pending Approval)`,
    ticketListHeader: 'Active Passes & QR Check-in (±30m Window)',
    activeCountBadge: (c) => `${c} active bookings`,
    hallEventBadge: 'HALL EVENT',
    statusCheckedIn: (t) => `CHECKED IN (${t})`,
    statusPendingApproval: 'PENDING APPROVAL',
    statusApprovedWaitQr: 'APPROVED • AWAITING QR',
    reasonTagLabel: 'Permission Reason:',
    qrWindowReadyText: 'Within ±30m window: Ready for QR scan now!',
    qrWindowWaitText: 'QR scan opens 30m before until 30m after start time',
    scanQrBtn: 'Scan QR Pass',
    lockFooterText: (c) => `Protecting ${c} sessions via Optimistic Lock`,
    scrollMoreBtn: 'More',
  },
  ja: {
    pageTitle: '会議室予約 (1〜4階) ＆ コロッセオ大ホール管理 (5階)',
    yourDeptLabel: '所属部署:',
    qrRuleText: 'QRチェックイン可能時間:',
    qrRuleBold: '開始時刻の30分前から開始後30分まで受付。',
    weeklyQuotaTitle: (role) => `週間予約上限 (${role})`,
    weeklyQuotaUsed: (used, max) =>
      `利用済 ${used} / ${max >= 999 ? '無制限' : `週${max}回まで`}`,
    formHeaderTitle: '会議室・5階大ホール予約申請フォーム',
    formHeaderBadge: '楽観的ロック • 重複防止',
    field1RoomLabel: '1. 会議室 (1〜4階) / 大ホール (5階) を選択',
    hallOptGroupLabel: '5階 — コロッセオ大ホール (2モード制御)',
    hallOptionText: 'H-01 — コロッセオ大ホール (5階 • 30席)',
    floorOptGroupLabel: (fl) => `${fl}階 — 標準ガラス会議室 6室`,
    field2DateLabel: '2. 会議・イベント開催日',
    hallModeHeader: (role) => `5階大ホール利用モード (権限ロール: ${role})`,
    mode1Title: 'モード1: ホール全体貸切 (H-01)',
    mode1SubAdmin: '管理者は承認なしで即時イベント貸切が可能',
    mode1SubManager: 'マネージャーは全体貸切を申請可能 (Admin承認が必要)',
    mode1SubEmployee: '一般社員はホール全体の貸切はできません',
    mode2Title: 'モード2: 個別座席予約 (H01-A1..C12)',
    mode2Sub: '承認済イベントがあり、対象部署に所属している場合のみ予約可能',
    selectAllowedDeptsLabel: '参加・座席予約を許可する部署を選択:',
    allowedDeptsHint:
      '* 選択された部署の社員のみ座席を予約できます（System Adminは常に全権限を保持）。',
    selectHallSeatLabel: 'コロッセオ円弧座席を選択 (H01-A1 .. H01-C12):',
    seatOptionPrefix: '座席',
    activeEventLabel: '開催中の承認済イベント:',
    allowedDeptsShort: '参加対象部署:',
    noActiveEventWarning: (s, e, d) =>
      `時間帯 (${s} – ${e})・日付 ${d} には承認済みのホールイベントがありません！イベントが承認されるまで座席予約はブロックされます。`,
    startTimeLabel: '開始時刻 (24h)',
    endTimeLabel: '終了時刻 (24h)',
    recurringLabel: '予約サイクル (単発 / 定期)',
    recNone: '単発予約 (1回のみ)',
    recDaily: '毎日 (5日間連続)',
    recWeekly: '毎週 (4週間連続)',
    purposeLabel: '会議の目的 / ホールイベント名',
    purposePlaceholder: '会議の件名やイベント名を入力...',
    approvalReasonLabel: '予約申請理由 (マネージャー / Admin 承認用)',
    approvalReasonBadge: '承認待ち申請では必須',
    approvalReasonPlaceholder:
      '利用目的、参加人数、必要な設備など、承認者が判断しやすい理由を記入してください...',
    approvalReasonRequiredError:
      'マネージャー・管理者の承認を受けるため、予約申請理由を入力してください！',
    submitRentHallAdmin: 'ホール全体 H-01 貸切を確定 (即時承認)',
    submitRentHallManager: '申請理由を添えてホール貸切 H-01 を申請 (Admin承認待ち)',
    submitHallSeat: (seat) => `ホール座席 ${seat} の予約を確定`,
    submitRoomApproved: (code) => `会議室 ${code} の予約を確定 (即時承認)`,
    submitRoomPendingApproval: (code) => `申請理由を添えて会議室 ${code} を予約申請 (承認待ち)`,
    ticketListHeader: '予約チケット＆QRチェックイン (前後30分枠)',
    activeCountBadge: (c) => `${c} 件の有効予約`,
    hallEventBadge: 'ホール全体イベント',
    statusCheckedIn: (t) => `QR読取済 (${t})`,
    statusPendingApproval: '承認待ち',
    statusApprovedWaitQr: '承認済 • QR待機中',
    reasonTagLabel: '申請理由:',
    qrWindowReadyText: '前後30分枠内です：今すぐQRチェックイン可能！',
    qrWindowWaitText: 'QR読取は開始30分前〜開始30分後のみ有効です',
    scanQrBtn: 'QR読取',
    lockFooterText: (c) => `${c} 件の予約を楽観的ロックで保護中`,
    scrollMoreBtn: '続きを見る',
  },
};

export const BookingCalendarPages: React.FC<BookingCalendarPagesProps> = ({
  bookingsList,
  workspaceNodes,
  departmentsList = [],
  selectedNode,
  preselectedSlot,
  userEmail,
  userRole = 'SYS_ADMIN',
  userDepartment = 'Product & Engineering',
  webLanguage = 'vi',
  isDark = false,
  onCreateNewBooking,
  onCheckInBooking,
  onCancelBooking,
}) => {
  const todayIso = useMemo(() => formatIsoDateString(new Date()), []);
  const bookingScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const t = BOOKING_I18N[webLanguage] || BOOKING_I18N.vi;

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
  const [approvalRequestReason, setApprovalRequestReason] = useState<string>(
    'Cần phòng có màn hình 4K để họp nhóm đánh giá tiến độ Sprint tuần này cùng các thành viên bộ phận.'
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

  // Xác định khi nào đơn đặt phòng cần xin phép phê duyệt (Nhân viên đặt phòng chuẩn Tầng 1-4, hoặc Quản lý thuê cả Hội trường Tầng 5)
  const requiresApprovalPermission = useMemo(() => {
    if (isFloor5HallSelected) {
      return hallBookingMode === 'HALL_EVENT_RENTAL' && userRole !== 'SYS_ADMIN';
    }
    return userRole === 'EMPLOYEE';
  }, [isFloor5HallSelected, hallBookingMode, userRole]);

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

    if (requiresApprovalPermission && !approvalRequestReason.trim()) {
      setValidationBanner({
        type: 'ERROR',
        message: t.approvalReasonRequiredError,
      });
      return;
    }

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
      approvalRequestReason: requiresApprovalPermission
        ? approvalRequestReason.trim()
        : undefined,
    });

    setValidationBanner({
      type: 'SUCCESS',
      message:
        effectiveMode === 'HALL_EVENT_RENTAL'
          ? userRole === 'SYS_ADMIN'
            ? `Đã thuê cả Hội trường H-01 thành công (Tự động duyệt cho Admin)! Các phòng ban [${allowedDepartments.join(
                ', '
              )}] đã có thể vào đặt ghế ngồi.`
            : `Đã gửi yêu cầu thuê cả Hội trường H-01 kèm lý do "${approvalRequestReason.trim()}" chờ System Admin phê duyệt!`
          : requiresApprovalPermission
          ? `Đã gửi yêu cầu đặt phòng ${targetCode} (${startTimeIso} – ${endTimeIso}) kèm lý do xin phép: "${approvalRequestReason.trim()}". Vui lòng chờ Quản lý / Admin xác nhận!`
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
            <h1 className="text-lg font-black tracking-tight">{t.pageTitle}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-600 text-white">
              {quotaInfo.roleLabelVi}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.yourDeptLabel}{' '}
            <strong className="text-indigo-500">{userDepartment}</strong> •{' '}
            {t.qrRuleText} <strong>{t.qrRuleBold}</strong>
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
              {t.weeklyQuotaTitle(userRole)}
            </p>
            <p className="font-extrabold">
              {t.weeklyQuotaUsed(
                quotaInfo.usedBookings,
                quotaInfo.maxBookingsPerWeek
              )}
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
              <h2 className="text-sm font-extrabold">{t.formHeaderTitle}</h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {t.formHeaderBadge}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-xs font-bold block mb-1.5 whitespace-nowrap truncate">
                {t.field1RoomLabel}
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
                <optgroup label={t.hallOptGroupLabel}>
                  <option value="H-01">{t.hallOptionText}</option>
                </optgroup>
                {[1, 2, 3, 4].map((fl: number) => (
                  <optgroup key={fl} label={t.floorOptGroupLabel(fl)}>
                    {workspaceNodes
                      .filter((n: WorkspaceNodeItem) => n.floorLevel === fl)
                      .map((room: WorkspaceNodeItem) => (
                        <option key={room.nodeCode} value={room.nodeCode}>
                          [{`F${fl}`}] {room.nodeCode} — {room.nodeLabel} (
                          {room.capacityCount}P)
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1.5 whitespace-nowrap truncate">
                {t.field2DateLabel}
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
                  {t.hallModeHeader(userRole)}
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
                    <span className="text-xs font-extrabold">{t.mode1Title}</span>
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
                      ? t.mode1SubAdmin
                      : userRole === 'MANAGER'
                      ? t.mode1SubManager
                      : t.mode1SubEmployee}
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
                    <span className="text-xs font-extrabold">{t.mode2Title}</span>
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <p
                    className={`text-[11px] mt-1 ${
                      hallBookingMode === 'HALL_SEAT_BOOKING'
                        ? 'text-teal-100'
                        : 'text-slate-400'
                    }`}
                  >
                    {t.mode2Sub}
                  </p>
                </button>
              </div>

              {hallBookingMode === 'HALL_EVENT_RENTAL' ? (
                <div className="space-y-2 pt-2 border-t border-indigo-200/50 dark:border-slate-800">
                  <label className="text-xs font-extrabold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    {t.selectAllowedDeptsLabel}
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
                    {t.allowedDeptsHint}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-indigo-200/50 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold">
                      {t.selectHallSeatLabel}
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
                          {t.seatOptionPrefix} {sc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeHallEventLookup.approvedEvent ? (
                    <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs">
                      <p className="font-extrabold text-teal-700 dark:text-teal-300">
                        {t.activeEventLabel} “
                        {activeHallEventLookup.approvedEvent.purposeNote}”
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {t.allowedDeptsShort}{' '}
                        <strong>
                          {activeHallEventLookup.approvedEvent.allowedDepartments?.join(
                            ', '
                          ) || 'ALL'}
                        </strong>
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 font-bold">
                      {t.noActiveEventWarning(
                        startTimeIso,
                        endTimeIso,
                        bookingDateIso
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold block mb-1.5">
                {t.startTimeLabel}
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
                {t.endTimeLabel}
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
                {t.recurringLabel}
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
                <option value="NONE">{t.recNone}</option>
                <option value="DAILY">{t.recDaily}</option>
                <option value="WEEKLY">{t.recWeekly}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1.5">
              {t.purposeLabel}
            </label>
            <input
              type="text"
              value={purposeNote}
              onChange={(e) => setPurposeNote(e.target.value)}
              placeholder={t.purposePlaceholder}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          {/* Ô NHẬP LÝ DO XIN PHÉP ĐẶT PHÒNG KHI NHÂN VIÊN ĐẶT PHÒNG HOẶC QUẢN LÝ THUÊ HỘI TRƯỜNG CHỜ XÁC NHẬN */}
          {requiresApprovalPermission && (
            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                isDark
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-amber-50/80 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>{t.approvalReasonLabel}</span>
                </label>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
                  {t.approvalReasonBadge}
                </span>
              </div>
              <textarea
                rows={2}
                value={approvalRequestReason}
                onChange={(e) => setApprovalRequestReason(e.target.value)}
                placeholder={t.approvalReasonPlaceholder}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium leading-relaxed ${
                  isDark
                    ? 'bg-slate-950 border-amber-500/30 text-slate-100'
                    : 'bg-white border-amber-200 text-slate-800'
                }`}
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isFloor5HallSelected
                ? hallBookingMode === 'HALL_EVENT_RENTAL'
                  ? userRole === 'SYS_ADMIN'
                    ? t.submitRentHallAdmin
                    : t.submitRentHallManager
                  : t.submitHallSeat(selectedHallSeat)
                : requiresApprovalPermission
                ? t.submitRoomPendingApproval(selectedRoomCode)
                : t.submitRoomApproved(selectedRoomCode)}
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
                <h2 className="text-sm font-extrabold">{t.ticketListHeader}</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-400">
                {t.activeCountBadge(bookingsList.length)}
              </span>
            </div>

            <div className="relative">
              <div
                ref={bookingScrollContainerRef}
                className="space-y-3 max-h-[410px] overflow-y-auto pr-1 pb-12 scroll-smooth"
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
                                {t.hallEventBadge}
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
                              ? t.statusCheckedIn(bk.checkedInAtIso || todayIso)
                              : isPending
                              ? t.statusPendingApproval
                              : t.statusApprovedWaitQr}
                          </span>

                          {onCancelBooking && (
                            <button
                              type="button"
                              onClick={() => onCancelBooking(bk.bookingId)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition"
                              title="Cancel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {bk.approvalRequestReason && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl">
                          <strong>{t.reasonTagLabel}</strong> “{bk.approvalRequestReason}”
                        </div>
                      )}

                      {bk.bookingMode === 'HALL_EVENT_RENTAL' &&
                        bk.allowedDepartments &&
                        bk.allowedDepartments.length > 0 && (
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-1.5 rounded-lg">
                            {t.allowedDeptsShort}{' '}
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
                              ? t.qrWindowReadyText
                              : t.qrWindowWaitText}
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
                            <span>{t.scanQrBtn}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

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
                    {t.lockFooterText(bookingsList.length)}
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
                    >
                      <span>{t.scrollMoreBtn}</span>
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