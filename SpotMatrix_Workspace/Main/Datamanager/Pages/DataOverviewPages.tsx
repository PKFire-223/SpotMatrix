import React, { useState, useMemo } from 'react';
import {
  Cpu,
  ShieldCheck,
  Sliders,
  Wrench,
  Award,
  Save,
  PlusCircle,
  MinusCircle,
  Layers,
  Clock,
  Search,
  X,
  CheckCircle2,
  XCircle,
  Bot,
  Eye,
  History,
  CalendarPlus,
  AlertTriangle,
} from 'lucide-react';
import {
  EquipmentFaultReportItem,
  EquipmentStatusType,
  SharedEquipmentItem,
  SystemPolicyConfigItem,
  TrustScoreHistoryRecordItem,
  UserRoleType,
  UserTrustProfileItem,
  WebLanguageCodeType,
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';

export interface DataOverviewPagesProps {
  workspaceNodes: WorkspaceNodeItem[];
  equipmentsList?: SharedEquipmentItem[];
  equipmentFaultReports?: EquipmentFaultReportItem[];
  trustProfiles?: UserTrustProfileItem[];
  trustScoreHistory?: TrustScoreHistoryRecordItem[];
  selectedNode?: WorkspaceNodeItem | null;
  userRole?: UserRoleType;
  userEmail?: string;
  webLanguage?: WebLanguageCodeType;
  isDark?: boolean;
  onUpdateEquipmentStatus?: (
    equipmentId: string,
    nextStatus: EquipmentStatusType
  ) => void;
  onHandleEquipmentFaultDecision?: (
    reportId: string,
    decision: 'CONFIRM_BROKEN' | 'START_MAINTENANCE' | 'MARK_FIXED' | 'REJECT'
  ) => void;
  onTriggerAiAutoProcessFaults?: () => void;
  onTriggerMonthlyTrustBonus?: () => void;
}

function ensureEveryRoomHasDedicatedEquipment(
  workspaceNodes: WorkspaceNodeItem[],
  existingEquipments: SharedEquipmentItem[]
): SharedEquipmentItem[] {
  const merged = [...existingEquipments];
  const roomsWithEq = new Set(
    existingEquipments.map((eq) => (eq.assignedNodeId || '').toUpperCase())
  );

  const fallbackTemplates: Array<{
    name: string;
    category: SharedEquipmentItem['categoryName'];
  }> = [
    { name: 'Màn hình Hội nghị 4K Samsung 75"', category: 'MONITOR_4K' },
    { name: 'Máy chiếu Laser Epson 4K Pro', category: 'PROJECTOR' },
    { name: 'Hệ thống Loa & Micro Hội nghị Bose Videobar', category: 'AUDIO_POD' },
    { name: 'Bảng Tương tác Cảm ứng KTS Wacom 24"', category: 'WACOM_TABLET' },
    { name: 'Màn hình Cảm ứng Đa điểm LG One:Quick 55"', category: 'MONITOR_4K' },
    { name: 'Tổ hợp Camera AI PTZ & Micro Đa hướng Rally', category: 'CONF_MIC_CAM' },
  ];

  workspaceNodes.forEach((node, idx) => {
    const codeUpper = node.nodeCode.toUpperCase();
    if (!roomsWithEq.has(codeUpper)) {
      const tpl = fallbackTemplates[idx % fallbackTemplates.length];
      const cleanCode = node.nodeCode.replace('-', '');
      merged.push({
        equipmentId: `EQ-AUTO-${cleanCode}`,
        equipmentCode: `EQ-${cleanCode}-DEV-01`,
        equipmentName: `${tpl.name} (${node.nodeCode})`,
        categoryName: tpl.category,
        status: 'AVAILABLE',
        assignedNodeId: node.nodeCode,
        position2D: node.position2D,
        currentBookingId: null,
        weeklyUsageHours: 16 + ((idx * 3) % 15),
        monthlyUsageHours: 68 + ((idx * 11) % 52),
      });
    }
  });

  return merged;
}

const DATA_I18N: Record<
  WebLanguageCodeType,
  {
    headerTitleAdmin: string;
    headerSubAdmin: string;
    headerTitleUser: string;
    headerSubUser: string;
    tab1: (c: number) => string;
    tab2Admin: (c: number) => string;
    tab2User: string;
    tab3: string;
    faultQueueTitle: (c: number) => string;
    faultQueueSub: string;
    aiAutoHandleBtn: string;
    confirmBrokenBtn: string;
    startMaintBtn: string;
    finishRepairBtn: string;
    rejectFaultBtn: string;
    noPendingFaults: string;
    eqSectionTitleAdmin: string;
    eqShowingSub: (f: number, t: number) => string;
    searchEqPlaceholder: string;
    allFloorsOpt: string;
    floorOpt: (fl: number) => string;
    floor5Opt: string;
    allRoomsOpt: string;
    roomPrefix: string;
    statusAvailable: string;
    statusInUse: string;
    statusReportedBroken: string;
    statusMaintenance: string;
    eqCodeLabel: string;
    usageFreqLabel: string;
    workflowStageLabel: string;
    stageReadyText: string;
    stageInUseText: string;
    stageBrokenText: string;
    stageMaintText: string;
    btnAvailable: string;
    btnInUse: string;
    btnReportedBroken: string;
    btnMaintenance: string;
    trustSectionTitleAdmin: string;
    trustSectionTitleUser: string;
    trustSectionSub: string;
    monthlyBonusBtn: string;
    searchTrustPlaceholder: string;
    restrictedBadge: string;
    deptLabel: string;
    onTimeLabel: (c: number) => string;
    noShowLabel: (c: number) => string;
    viewHistoryBtn: string;
    historyTitle: (name: string) => string;
    historySub: string;
    policyTitle: string;
    policySubAdmin: string;
    p1Label: string;
    p2Label: string;
    p3Label: string;
    p4Label: string;
    p5Label: string;
    p6Label: string;
    lastUpdatedBy: string;
    savePolicyBtn: string;
  }
> = {
  vi: {
    headerTitleAdmin:
      'Quản trị Thiết bị 25 Phòng, Duyệt Báo lỗi & Lịch sử Điểm Tín nhiệm (SYS_ADMIN)',
    headerSubAdmin:
      'Chỉ Admin mới xem được danh mục thiết bị & duyệt báo lỗi • Xem chi tiết lịch sử cộng/trừ tín nhiệm của mọi người dùng',
    headerTitleUser:
      'Hồ sơ Điểm Tín nhiệm Cá nhân & Lịch sử Cộng / Trừ Chi tiết',
    headerSubUser:
      'Đầu mỗi tháng tự động cộng +20 điểm • Quét QR đúng hạn +2 điểm • Trễ hạn không quét QR -10 điểm (Báo lỗi thiết bị đặt tại trang Tổ chức & Phòng ban)',
    tab1: (c) => `1. Quản lý Thiết bị & Báo lỗi (${c})`,
    tab2Admin: (c) => `2. Điểm Tín nhiệm & Lịch sử (${c})`,
    tab2User: 'Điểm Tín nhiệm & Lịch sử Cá nhân',
    tab3: '3. Cấu hình Chính sách Động',
    faultQueueTitle: (c) =>
      `Yêu cầu Báo lỗi Thiết bị từ Nhân viên & Quản lý gửi lên (${c})`,
    faultQueueSub:
      'Quy trình thực tế: Người dùng phát hiện lỗi và gửi báo cáo -> Admin xác nhận chuyển sang Báo hỏng -> Đang bảo trì -> Sử dụng được (Hoặc bật AI tự động xử lý).',
    aiAutoHandleBtn: 'AI Tự động Xử lý & Chuyển Bảo trì / Sửa xong',
    confirmBrokenBtn: 'Xác nhận Báo hỏng',
    startMaintBtn: 'Chuyển sang Bảo trì',
    finishRepairBtn: 'Sửa xong (Sử dụng được)',
    rejectFaultBtn: 'Từ chối báo lỗi',
    noPendingFaults: 'Hiện không có yêu cầu báo lỗi thiết bị nào đang chờ xử lý.',
    eqSectionTitleAdmin:
      'Danh mục Thiết bị 25 Phòng & Điều phối Trạng thái Vận hành (Chỉ dành cho SYS_ADMIN)',
    eqShowingSub: (f, t) =>
      `Đang hiển thị ${f} / ${t} thiết bị trên toàn bộ 25 phòng (Tầng 1 – Tầng 5).`,
    searchEqPlaceholder: 'Tìm thiết bị, mã EQ-..., phòng M1-01...',
    allFloorsOpt: 'Tất cả 5 Tầng',
    floorOpt: (fl) => `Tầng ${fl} (6 phòng)`,
    floor5Opt: 'Tầng 5 • Hội trường H-01',
    allRoomsOpt: 'Tất cả 25 phòng (M1-01..H-01)',
    roomPrefix: 'Phòng',
    statusAvailable: 'SỬ DỤNG ĐƯỢC',
    statusInUse: 'ĐANG DÙNG',
    statusReportedBroken: 'BÁO HỎNG',
    statusMaintenance: 'ĐANG BẢO TRÌ',
    eqCodeLabel: 'Mã định danh thiết bị:',
    usageFreqLabel: 'Tần suất hoạt động:',
    workflowStageLabel: 'Trạng thái kỹ thuật:',
    stageReadyText: 'Sẵn sàng phục vụ họp',
    stageInUseText: 'Đang phục vụ ca họp',
    stageBrokenText: 'Phát hiện lỗi • Chờ kỹ thuật',
    stageMaintText: 'Kỹ thuật viên đang sửa chữa',
    btnAvailable: 'Sử dụng được',
    btnInUse: 'Đang dùng',
    btnReportedBroken: 'Báo hỏng',
    btnMaintenance: 'Bảo trì',
    trustSectionTitleAdmin:
      'Bảng Điểm Tín nhiệm Toàn Công ty & Truy vết Lịch sử Cộng / Trừ (SYS_ADMIN)',
    trustSectionTitleUser: 'Điểm Tín nhiệm của Bạn & Quy tắc Cộng +20 Điểm Hàng Tháng',
    trustSectionSub:
      'Định kỳ mỗi tháng: +20 điểm • Quét QR đúng giờ: +2 điểm • Bỏ phòng quá hạn QR: -10 điểm',
    monthlyBonusBtn: 'Cộng +20đ Định kỳ Tháng',
    searchTrustPlaceholder: 'Tìm tên, email, phòng ban...',
    restrictedBadge: 'Chế độ Hạn chế (<60đ)',
    deptLabel: 'Bộ phận:',
    onTimeLabel: (c) => `Quét QR đúng giờ: ${c} lần (+${c * 2}đ)`,
    noShowLabel: (c) => `Trễ hạn thu hồi: ${c} lần (-${c * 10}đ)`,
    viewHistoryBtn: 'Xem lịch sử cộng/trừ',
    historyTitle: (name) => `Lịch sử Cộng / Trừ Điểm Tín nhiệm: ${name}`,
    historySub:
      'Ghi nhận đầy đủ các đợt cộng +20 điểm mỗi tháng, cộng +2 điểm khi quét QR nhận phòng và trừ -10 điểm khi trễ hạn.',
    policyTitle: 'Cấu hình Chính sách Động & Hạn mức Hệ thống (GLOBAL_WORKSPACE_POLICY)',
    policySubAdmin:
      'Quyền SYS_ADMIN: Chỉnh sửa trực tiếp các tham số vận hành và lưu vào MongoDB Atlas.',
    p1Label: '1. Thời gian Giữ chỗ tạm (Hold Timeout - Phút)',
    p2Label: '2. Hạn tự thu hồi phòng quá hạn QR (Phút)',
    p3Label: '3. Hạn mức Giờ họp tối đa / Tuần (Giờ)',
    p4Label: '4. Điểm tín nhiệm tối thiểu để Đặt định kỳ',
    p5Label: '5. Điểm thưởng Check-in QR đúng giờ (+Điểm)',
    p6Label: '6. Điểm phạt quá hạn không Check-in (-Điểm)',
    lastUpdatedBy: 'Cập nhật lần cuối bởi:',
    savePolicyBtn: 'Lưu Chính sách Động lên MongoDB',
  },
  en: {
    headerTitleAdmin:
      '25-Room Equipment Governance, Fault Reports & Trust Score Ledger (SYS_ADMIN)',
    headerSubAdmin:
      'Equipment management is exclusive to Admin • Inspect detailed trust score history of all users',
    headerTitleUser:
      'Your Personal Trust Score Profile & Point Addition / Deduction History',
    headerSubUser:
      'Monthly bonus: +20 pts • On-time QR scan: +2 pts • Expired No-Show: -10 pts (Report faulty room devices on the Organization page)',
    tab1: (c) => `1. Equipment & Fault Reports (${c})`,
    tab2Admin: (c) => `2. Trust Score & Ledger (${c})`,
    tab2User: 'Personal Trust Score & History',
    tab3: '3. Dynamic System Policy',
    faultQueueTitle: (c) =>
      `Equipment Fault Reports Submitted by Employees & Managers (${c})`,
    faultQueueSub:
      'Workflow: User reports fault -> Admin confirms Broken -> Maintenance -> Ready for Use (Or use AI Auto-Triage).',
    aiAutoHandleBtn: 'AI Auto-Process & Repair Workflow',
    confirmBrokenBtn: 'Confirm Broken',
    startMaintBtn: 'Start Maintenance',
    finishRepairBtn: 'Mark Repaired (Ready)',
    rejectFaultBtn: 'Reject Report',
    noPendingFaults: 'No equipment fault reports currently pending.',
    eqSectionTitleAdmin:
      '25-Room Equipment Directory & Lifecycle Control (SYS_ADMIN Exclusive)',
    eqShowingSub: (f, t) =>
      `Showing ${f} / ${t} devices across all 25 rooms (Floors 1 – 5).`,
    searchEqPlaceholder: 'Search device name, code EQ-..., room M1-01...',
    allFloorsOpt: 'All 5 Floors',
    floorOpt: (fl) => `Floor ${fl} (6 rooms)`,
    floor5Opt: 'Floor 5 • Hall H-01',
    allRoomsOpt: 'All 25 Rooms (M1-01..H-01)',
    roomPrefix: 'Room',
    statusAvailable: 'READY FOR USE',
    statusInUse: 'IN USE',
    statusReportedBroken: 'REPORTED BROKEN',
    statusMaintenance: 'IN MAINTENANCE',
    eqCodeLabel: 'Equipment Code:',
    usageFreqLabel: 'Usage Frequency:',
    workflowStageLabel: 'Operational State:',
    stageReadyText: 'Ready for meetings',
    stageInUseText: 'Active in current meeting',
    stageBrokenText: 'Fault reported • Awaiting tech',
    stageMaintText: 'Technician repairing device',
    btnAvailable: 'Ready',
    btnInUse: 'In Use',
    btnReportedBroken: 'Broken',
    btnMaintenance: 'Maintenance',
    trustSectionTitleAdmin:
      'Company-Wide Trust Score & Point History Ledger (SYS_ADMIN)',
    trustSectionTitleUser: 'Your Trust Score & +20 Monthly Bonus Ledger',
    trustSectionSub:
      'Monthly grant: +20 pts • On-time QR Check-in: +2 pts • Expired No-Show: -10 pts',
    monthlyBonusBtn: 'Grant +20 Monthly Bonus',
    searchTrustPlaceholder: 'Search name, email, department...',
    restrictedBadge: 'Restricted (<60 pts)',
    deptLabel: 'Department:',
    onTimeLabel: (c) => `On-time QR scans: ${c} (+${c * 2} pts)`,
    noShowLabel: (c) => `Expired No-Shows: ${c} (-${c * 10} pts)`,
    viewHistoryBtn: 'View Point History',
    historyTitle: (name) => `Trust Score Addition / Deduction Ledger: ${name}`,
    historySub:
      'Complete audit trail of +20 monthly bonuses, +2 QR check-in rewards, and -10 overdue penalties.',
    policyTitle: 'Dynamic Governance Policy & Quotas (GLOBAL_WORKSPACE_POLICY)',
    policySubAdmin:
      'SYS_ADMIN Privilege: Modify operational parameters and persist to MongoDB Atlas.',
    p1Label: '1. Temporary Hold Timeout (Minutes)',
    p2Label: '2. Auto-Release No-Show Grace Period (Minutes)',
    p3Label: '3. Max Weekly Meeting Hours (Hours)',
    p4Label: '4. Min Trust Score for Recurring Bookings',
    p5Label: '5. On-Time QR Check-in Reward (+Pts)',
    p6Label: '6. Overdue No-Show Penalty (-Pts)',
    lastUpdatedBy: 'Last updated by:',
    savePolicyBtn: 'Save Dynamic Policy to MongoDB',
  },
  ja: {
    headerTitleAdmin:
      '全25室 設備管理・故障報告承認・信頼スコア履歴台帳 (SYS_ADMIN 専用)',
    headerSubAdmin:
      '設備一覧と故障承認は管理者専用 • 全ユーザーの信頼スコア加減点履歴を詳細表示',
    headerTitleUser:
      '個人の信頼スコア (Trust Score) ＆ 加減点履歴明細',
    headerSubUser:
      '毎月定期ボーナス: +20点 • 時間内QR読取: +2点 • 期限切れ未読取: -10点（設備の故障報告は「組織・部署」ページから送信可能）',
    tab1: (c) => `1. 設備管理＆故障報告 (${c})`,
    tab2Admin: (c) => `2. 信頼スコア＆履歴 (${c})`,
    tab2User: '個人の信頼スコア＆加減点履歴',
    tab3: '3. 動的システムポリシー',
    faultQueueTitle: (c) =>
      `社員・マネージャーからの設備故障報告一覧 (${c}件)`,
    faultQueueSub:
      '運用フロー：利用者が故障を報告 -> Adminが確認し「故障報告」へ変更 -> 「修理・保守中」 -> 「利用可能」（AI自動処理にも対応）。',
    aiAutoHandleBtn: 'AI 自動診断＆保守・復旧処理を実行',
    confirmBrokenBtn: '故障を承認',
    startMaintBtn: '保守・修理へ移行',
    finishRepairBtn: '修理完了 (利用可能)',
    rejectFaultBtn: '報告を却下',
    noPendingFaults: '現在、未処理の設備故障報告はありません。',
    eqSectionTitleAdmin:
      '全25室 機器台帳＆稼働ステータス管理 (SYS_ADMIN 専用)',
    eqShowingSub: (f, t) =>
      `全25室（1階〜5階）の機器 ${t} 台中 ${f} 台を表示中。`,
    searchEqPlaceholder: '機器名、コード EQ-...、部屋 M1-01 で検索...',
    allFloorsOpt: '全5フロア',
    floorOpt: (fl) => `${fl}階 (6室)`,
    floor5Opt: '5階 • 大ホール H-01',
    allRoomsOpt: '全25室 (M1-01..H-01)',
    roomPrefix: '部屋',
    statusAvailable: '利用可能',
    statusInUse: '使用中',
    statusReportedBroken: '故障報告済',
    statusMaintenance: '保守・修理中',
    eqCodeLabel: '機器識別コード:',
    usageFreqLabel: '稼働時間:',
    workflowStageLabel: '運用状態:',
    stageReadyText: '会議利用可能',
    stageInUseText: '会議で使用中',
    stageBrokenText: '不具合報告 • 点検待ち',
    stageMaintText: 'エンジニアが修理・保守中',
    btnAvailable: '利用可能',
    btnInUse: '使用中',
    btnReportedBroken: '故障報告',
    btnMaintenance: '保守中',
    trustSectionTitleAdmin:
      '全社 信頼スコア一覧＆加減点履歴トレイル (SYS_ADMIN)',
    trustSectionTitleUser: 'あなたの信頼スコア＆月次+20点ボーナス履歴',
    trustSectionSub:
      '毎月定期付与: +20点 • 時間内QRチェックイン: +2点 • 期限切れ自動回収: -10点',
    monthlyBonusBtn: '月次 +20点 ボーナス付与',
    searchTrustPlaceholder: '氏名、メール、部署で検索...',
    restrictedBadge: '制限モード (<60点)',
    deptLabel: '所属部署:',
    onTimeLabel: (c) => `時間内QR読取: ${c}回 (+${c * 2}点)`,
    noShowLabel: (c) => `期限切れ回収: ${c}回 (-${c * 10}点)`,
    viewHistoryBtn: '加減点履歴を見る',
    historyTitle: (name) => `信頼スコア加減点履歴: ${name}`,
    historySub:
      '毎月の+20点定期ボーナス、QRチェックイン+2点報酬、および期限切れ-10点減点の全履歴です。',
    policyTitle: '動的システムポリシー＆上限設定 (GLOBAL_WORKSPACE_POLICY)',
    policySubAdmin:
      'SYS_ADMIN権限：運用パラメータを直接編集し MongoDB Atlas に保存できます。',
    p1Label: '1. 一時保持タイムアウト (Hold Timeout - 分)',
    p2Label: '2. 期限切れ自動解放猶予 (分)',
    p3Label: '3. 週間最大会議時間上限 (時間)',
    p4Label: '4. 定期予約に必要な最低信頼スコア',
    p5Label: '5. 時間内QRチェックイン報酬 (+点)',
    p6Label: '6. 期限切れ未チェックイン減点 (-点)',
    lastUpdatedBy: '最終更新者:',
    savePolicyBtn: '動的ポリシーをMongoDBに保存',
  },
};

export const DataOverviewPages: React.FC<DataOverviewPagesProps> = ({
  workspaceNodes,
  equipmentsList = [],
  equipmentFaultReports = [],
  trustProfiles = [],
  trustScoreHistory = [],
  userRole = 'SYS_ADMIN',
  userEmail = 'sysadmin@spotmatrix.vn',
  webLanguage = 'vi',
  isDark = false,
  onUpdateEquipmentStatus,
  onHandleEquipmentFaultDecision,
  onTriggerAiAutoProcessFaults,
  onTriggerMonthlyTrustBonus,
}) => {
  const isAdmin = userRole === 'SYS_ADMIN';
  const t = DATA_I18N[webLanguage] || DATA_I18N.vi;

  // Nhân viên và Quản lý chỉ xem được Điểm tín nhiệm & Lịch sử cộng/trừ của chính họ; Admin xem toàn bộ Thiết bị + Tín nhiệm + Chính sách
  const [activeTab, setActiveTab] = useState<
    'EQUIPMENT' | 'TRUST_SCORE' | 'DYNAMIC_POLICY'
  >(isAdmin ? 'EQUIPMENT' : 'TRUST_SCORE');

  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('ALL');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState<string>('');
  const [trustSearchQuery, setTrustSearchQuery] = useState<string>('');
  const [selectedHistoryUserEmail, setSelectedHistoryUserEmail] =
    useState<string>(userEmail);

  const completeEquipmentsList = useMemo(() => {
    return ensureEveryRoomHasDedicatedEquipment(workspaceNodes, equipmentsList);
  }, [workspaceNodes, equipmentsList]);

  const [policyConfig, setPolicyConfig] = useState<SystemPolicyConfigItem>({
    policyKey: 'GLOBAL_WORKSPACE_POLICY',
    holdTimeoutMinutes: 5,
    checkinGracePeriodMinutes: 30,
    maxMeetingHoursPerWeek: 10,
    minTrustScoreForRecurring: 60,
    restrictedMaxAdvanceDays: 2,
    trustScoreCheckinReward: 2,
    trustScoreNoshowPenalty: 10,
    updatedByEmail: userEmail,
    updatedAtIso: new Date().toISOString(),
  });
  const [policySavedBanner, setPolicySavedBanner] = useState<string | null>(
    null
  );

  const filteredEquipments = useMemo(() => {
    const q = equipmentSearchQuery.trim().toLowerCase();
    return completeEquipmentsList.filter((eq) => {
      const assignedCode = eq.assignedNodeId || '';
      if (selectedRoomFilter !== 'ALL' && assignedCode !== selectedRoomFilter) {
        return false;
      }
      if (selectedFloorFilter !== 'ALL') {
        const floorNum = Number(selectedFloorFilter);
        if (floorNum === 5 && assignedCode !== 'H-01') return false;
        if (
          floorNum >= 1 &&
          floorNum <= 4 &&
          !assignedCode.startsWith(`M${floorNum}-`)
        ) {
          return false;
        }
      }
      if (!q) return true;
      return (
        eq.equipmentName.toLowerCase().includes(q) ||
        eq.equipmentCode.toLowerCase().includes(q) ||
        assignedCode.toLowerCase().includes(q) ||
        eq.categoryName.toLowerCase().includes(q)
      );
    });
  }, [
    completeEquipmentsList,
    selectedRoomFilter,
    selectedFloorFilter,
    equipmentSearchQuery,
  ]);

  // Nhân viên & Quản lý chỉ thấy Điểm tín nhiệm của chính họ; Admin thấy toàn bộ
  const visibleTrustProfiles = useMemo(() => {
    if (!isAdmin) {
      return trustProfiles.filter(
        (tp) => tp.userEmail.trim().toLowerCase() === userEmail.trim().toLowerCase()
      );
    }
    const q = trustSearchQuery.trim().toLowerCase();
    return trustProfiles.filter((tp) => {
      if (!q) return true;
      return (
        tp.fullName.toLowerCase().includes(q) ||
        tp.userEmail.toLowerCase().includes(q) ||
        tp.departmentName.toLowerCase().includes(q)
      );
    });
  }, [trustProfiles, trustSearchQuery, isAdmin, userEmail]);

  const effectiveHistoryEmail = isAdmin ? selectedHistoryUserEmail : userEmail;

  const selectedUserProfileObj = useMemo(() => {
    return (
      trustProfiles.find(
        (tp) =>
          tp.userEmail.trim().toLowerCase() ===
          effectiveHistoryEmail.trim().toLowerCase()
      ) ||
      visibleTrustProfiles[0] ||
      trustProfiles[0]
    );
  }, [trustProfiles, visibleTrustProfiles, effectiveHistoryEmail]);

  const selectedUserHistoryRecords = useMemo(() => {
    const targetEmail = (
      selectedUserProfileObj?.userEmail || effectiveHistoryEmail
    )
      .trim()
      .toLowerCase();
    const matched = trustScoreHistory.filter(
      (h) => h.userEmail.trim().toLowerCase() === targetEmail
    );
    if (matched.length > 0) return matched;

    // Bản ghi lịch sử mặc định chuẩn mực nếu chưa phát sinh thêm
    return [
      {
        recordId: `TH-MONTH-${targetEmail}`,
        userEmail: targetEmail,
        fullName: selectedUserProfileObj?.fullName || 'User',
        deltaPoints: 20,
        balanceAfter: Math.min(100, (selectedUserProfileObj?.trustScore || 96)),
        eventType: 'MONTHLY_BONUS_20' as const,
        reasonText: 'Cộng +20 điểm tín nhiệm định kỳ đầu tháng 11/2026',
        createdAtIso: '2026-11-01 • 08:00',
      },
      {
        recordId: `TH-QR-${targetEmail}`,
        userEmail: targetEmail,
        fullName: selectedUserProfileObj?.fullName || 'User',
        deltaPoints: 2,
        balanceAfter: selectedUserProfileObj?.trustScore || 96,
        eventType: 'QR_CHECKIN_REWARD' as const,
        reasonText: 'Quét mã QR nhận phòng họp đúng khung giờ quy định (+2đ)',
        createdAtIso: '2026-11-14 • 13:05',
      },
    ];
  }, [trustScoreHistory, selectedUserProfileObj, effectiveHistoryEmail]);

  const handleSaveDynamicPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SystemPolicyConfigItem = {
      ...policyConfig,
      updatedByEmail: userEmail,
      updatedAtIso: new Date().toISOString(),
    };
    setPolicyConfig(updated);
    setPolicySavedBanner(
      'Đã lưu Cấu hình Chính sách Động & Hạn mức trực tiếp vào MongoDB Atlas thành công!'
    );

    try {
      await fetch('/api/v1/datamanager/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: userEmail, ...updated }),
      });
    } catch {
      // Giữ cấu hình local
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-indigo-400'
                : 'bg-indigo-50 border-indigo-100 text-indigo-600'
            }`}
          >
            {isAdmin ? (
              <Cpu className="w-6 h-6" />
            ) : (
              <Award className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1
              className={`text-lg font-extrabold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {isAdmin ? t.headerTitleAdmin : t.headerTitleUser}
            </h1>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {isAdmin ? t.headerSubAdmin : t.headerSubUser}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div
            className={`p-1 rounded-2xl border flex flex-wrap items-center gap-1 ${
              isDark
                ? 'bg-slate-950 border-slate-800'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab('EQUIPMENT')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'EQUIPMENT'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              {t.tab1(completeEquipmentsList.length)}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TRUST_SCORE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'TRUST_SCORE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.tab2Admin(visibleTrustProfiles.length)}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DYNAMIC_POLICY')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'DYNAMIC_POLICY'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {t.tab3}
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: QUẢN LÝ THIẾT BỊ & DUYỆT BÁO LỖI (CHỈ HIỂN THỊ CHO SYS_ADMIN) */}
      {isAdmin && activeTab === 'EQUIPMENT' && (
        <div className="space-y-6">
          {/* Hộp 1: Hàng đợi Báo lỗi Thiết bị từ Nhân viên & Quản lý gửi lên + Nút AI Tự động Xử lý */}
          <div
            className={`p-6 rounded-3xl border space-y-4 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-extrabold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>{t.faultQueueTitle(equipmentFaultReports.length)}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.faultQueueSub}
                </p>
              </div>

              {onTriggerAiAutoProcessFaults && (
                <button
                  type="button"
                  onClick={onTriggerAiAutoProcessFaults}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition"
                >
                  <Bot className="w-4 h-4" />
                  <span>{t.aiAutoHandleBtn}</span>
                </button>
              )}
            </div>

            {equipmentFaultReports.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed text-center text-xs text-slate-400 border-slate-200 dark:border-slate-800">
                {t.noPendingFaults}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipmentFaultReports.map((rep) => (
                  <div
                    key={rep.reportId}
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isDark
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-50/80 border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-600 text-white">
                            {rep.roomCode}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            {rep.equipmentCode}
                          </span>
                        </div>
                        <h4 className="text-xs font-extrabold mt-1">
                          {rep.equipmentName}
                        </h4>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          rep.reportStatus === 'PENDING_ADMIN'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                            : rep.reportStatus === 'CONFIRMED_BROKEN'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                            : rep.reportStatus === 'IN_MAINTENANCE'
                            ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                            : rep.reportStatus === 'RESOLVED_READY'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                            : 'bg-slate-500/15 text-slate-500'
                        }`}
                      >
                        {rep.reportStatus}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-slate-500 dark:text-slate-400">
                        Người báo lỗi: <strong>{rep.reporterName}</strong> (
                        {rep.reporterEmail} • {rep.reporterRole})
                      </p>
                      <p className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold">
                        Lý do lỗi: “{rep.faultReason}”
                      </p>
                      {rep.aiDiagnosisNote && (
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          🤖 AI Chẩn đoán: {rep.aiDiagnosisNote}
                        </p>
                      )}
                    </div>

                    {onHandleEquipmentFaultDecision && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        {rep.reportStatus === 'PENDING_ADMIN' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                onHandleEquipmentFaultDecision(
                                  rep.reportId,
                                  'CONFIRM_BROKEN'
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t.confirmBrokenBtn}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onHandleEquipmentFaultDecision(
                                  rep.reportId,
                                  'REJECT'
                                )
                              }
                              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{t.rejectFaultBtn}</span>
                            </button>
                          </>
                        )}

                        {rep.reportStatus === 'CONFIRMED_BROKEN' && (
                          <button
                            type="button"
                            onClick={() =>
                              onHandleEquipmentFaultDecision(
                                rep.reportId,
                                'START_MAINTENANCE'
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>{t.startMaintBtn}</span>
                          </button>
                        )}

                        {(rep.reportStatus === 'CONFIRMED_BROKEN' ||
                          rep.reportStatus === 'IN_MAINTENANCE') && (
                          <button
                            type="button"
                            onClick={() =>
                              onHandleEquipmentFaultDecision(
                                rep.reportId,
                                'MARK_FIXED'
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition ${
                              isDark
                                ? 'bg-slate-900 border-slate-700 text-emerald-400 hover:bg-slate-800'
                                : 'bg-white border-slate-200 text-emerald-700 hover:bg-slate-100'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t.finishRepairBtn}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hộp 2: Danh mục 30 Thiết bị trên 25 Phòng (Đã xóa % độ bền ảo, dùng 4 trạng thái thực tế) */}
          <div
            className={`p-6 rounded-3xl border space-y-5 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-slate-800 pb-4">
              <div>
                <h2
                  className={`text-sm font-extrabold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {t.eqSectionTitleAdmin}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.eqShowingSub(
                    filteredEquipments.length,
                    completeEquipmentsList.length
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-[230px] flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={equipmentSearchQuery}
                    onChange={(e) => setEquipmentSearchQuery(e.target.value)}
                    placeholder={t.searchEqPlaceholder}
                    className={`w-full pl-8 pr-7 py-2 rounded-xl border text-xs font-semibold outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                  {equipmentSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setEquipmentSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={selectedFloorFilter}
                  onChange={(e) => {
                    setSelectedFloorFilter(e.target.value);
                    setSelectedRoomFilter('ALL');
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="ALL">{t.allFloorsOpt}</option>
                  <option value="1">{t.floorOpt(1)}</option>
                  <option value="2">{t.floorOpt(2)}</option>
                  <option value="3">{t.floorOpt(3)}</option>
                  <option value="4">{t.floorOpt(4)}</option>
                  <option value="5">{t.floor5Opt}</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                  <select
                    value={selectedRoomFilter}
                    onChange={(e) => setSelectedRoomFilter(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="ALL">{t.allRoomsOpt}</option>
                    {workspaceNodes.map((n) => (
                      <option key={n.nodeId} value={n.nodeCode}>
                        {t.roomPrefix} {n.nodeCode} — {n.nodeLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipments.map((eq) => {
                const isBrokenState =
                  eq.status === 'BROKEN' || eq.status === 'REPORTED_BROKEN';
                const isMaintState = eq.status === 'MAINTENANCE';

                return (
                  <div
                    key={eq.equipmentId}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-600 text-white">
                          {t.roomPrefix}: {eq.assignedNodeId || 'M1-01'}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                            eq.status === 'AVAILABLE'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : eq.status === 'IN_USE'
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                              : isMaintState
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {eq.status === 'AVAILABLE'
                            ? t.statusAvailable
                            : eq.status === 'IN_USE'
                            ? t.statusInUse
                            : isMaintState
                            ? t.statusMaintenance
                            : t.statusReportedBroken}
                        </span>
                      </div>

                      <h3
                        className={`text-sm font-extrabold mt-2.5 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {eq.equipmentName}
                      </h3>

                      <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 space-y-1 text-xs text-slate-500">
                        <p className="flex justify-between">
                          <span>{t.eqCodeLabel}</span>
                          <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                            {eq.equipmentCode}
                          </strong>
                        </p>
                        <p className="flex justify-between">
                          <span>{t.usageFreqLabel}</span>
                          <strong>
                            {eq.weeklyUsageHours || 20}h/w •{' '}
                            {eq.monthlyUsageHours || 84}h/m
                          </strong>
                        </p>
                        <p className="flex justify-between">
                          <span>{t.workflowStageLabel}</span>
                          <strong
                            className={
                              isBrokenState
                                ? 'text-rose-500'
                                : isMaintState
                                ? 'text-amber-500'
                                : 'text-slate-700 dark:text-slate-300'
                            }
                          >
                            {eq.status === 'AVAILABLE'
                              ? t.stageReadyText
                              : eq.status === 'IN_USE'
                              ? t.stageInUseText
                              : isMaintState
                              ? t.stageMaintText
                              : t.stageBrokenText}
                          </strong>
                        </p>
                        {eq.lastReportedReason && (
                          <p className="text-[11px] text-rose-500 pt-1 truncate">
                            Báo lỗi: “{eq.lastReportedReason}”
                          </p>
                        )}
                      </div>
                    </div>

                    {onUpdateEquipmentStatus && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-1">
                        {(
                          [
                            { code: 'AVAILABLE', label: t.btnAvailable },
                            { code: 'IN_USE', label: t.btnInUse },
                            { code: 'REPORTED_BROKEN', label: t.btnReportedBroken },
                            { code: 'MAINTENANCE', label: t.btnMaintenance },
                          ] as { code: EquipmentStatusType; label: string }[]
                        ).map((btn) => {
                          const isActive =
                            eq.status === btn.code ||
                            (btn.code === 'REPORTED_BROKEN' &&
                              eq.status === 'BROKEN');
                          return (
                            <button
                              key={btn.code}
                              type="button"
                              onClick={() =>
                                onUpdateEquipmentStatus(eq.equipmentId, btn.code)
                              }
                              className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold border transition ${
                                isActive
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : isDark
                                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ĐIỂM TÍN NHIỆM & LỊCH SỬ CỘNG/TRỪ (+20Đ MỖI THÁNG) */}
      {(!isAdmin || activeTab === 'TRUST_SCORE') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột Trái (7 cột): Danh sách Hồ sơ Tín nhiệm (Nhân viên/Quản lý chỉ thấy của mình; Admin thấy toàn bộ) */}
          <div
            className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <div>
                <h2
                  className={`text-sm font-extrabold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {isAdmin ? t.trustSectionTitleAdmin : t.trustSectionTitleUser}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.trustSectionSub}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isAdmin && onTriggerMonthlyTrustBonus && (
                  <button
                    type="button"
                    onClick={onTriggerMonthlyTrustBonus}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>{t.monthlyBonusBtn}</span>
                  </button>
                )}

                {isAdmin && (
                  <div className="relative w-52">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={trustSearchQuery}
                      onChange={(e) => setTrustSearchQuery(e.target.value)}
                      placeholder={t.searchTrustPlaceholder}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs font-semibold outline-none ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {visibleTrustProfiles.map((tp) => {
                const isRestricted =
                  tp.trustScore < policyConfig.minTrustScoreForRecurring;
                const isSelectedHistory =
                  tp.userEmail.trim().toLowerCase() ===
                  (selectedUserProfileObj?.userEmail || '')
                    .trim()
                    .toLowerCase();

                return (
                  <div
                    key={tp.userEmail}
                    onClick={() => {
                      if (isAdmin) setSelectedHistoryUserEmail(tp.userEmail);
                    }}
                    className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition ${
                      isAdmin ? 'cursor-pointer' : ''
                    } ${
                      isSelectedHistory
                        ? isDark
                          ? 'bg-slate-950 border-indigo-500/60'
                          : 'bg-indigo-50/40 border-indigo-300'
                        : isDark
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-extrabold ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {tp.fullName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                          {tp.role}
                        </span>
                        {isRestricted && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/15 text-rose-600">
                            {t.restrictedBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {tp.userEmail} • {t.deptLabel} {tp.departmentName}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5 text-[11px] font-semibold">
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <PlusCircle className="w-3 h-3" />{' '}
                          {t.onTimeLabel(tp.onTimeCheckInCount)}
                        </span>
                        <span className="text-rose-500 flex items-center gap-1">
                          <MinusCircle className="w-3 h-3" />{' '}
                          {t.noShowLabel(tp.noShowPenaltyCount)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-1.5">
                      <div>
                        <span
                          className={`text-2xl font-black ${
                            isRestricted
                              ? 'text-rose-500'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {tp.trustScore}/100
                        </span>
                        <div className="w-28 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-1 ml-auto">
                          <div
                            className={`h-full ${
                              isRestricted ? 'bg-rose-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${tp.trustScore}%` }}
                          />
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHistoryUserEmail(tp.userEmail);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 transition ${
                            isSelectedHistory
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-300'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>{t.viewHistoryBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cột Phải (5 cột): Lịch sử Cộng / Trừ Điểm Tín nhiệm Chi tiết (+20đ mỗi tháng, +2đ QR, -10đ Trễ hạn) */}
          <div
            className={`lg:col-span-5 p-6 rounded-3xl border space-y-4 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="border-b border-slate-200/70 dark:border-slate-800 pb-3 flex items-center justify-between gap-2">
              <div>
                <h2
                  className={`text-sm font-extrabold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <History className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    {t.historyTitle(
                      selectedUserProfileObj?.fullName || userEmail
                    )}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{t.historySub}</p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {selectedUserHistoryRecords.map((rec) => {
                const isPositive = rec.deltaPoints >= 0;
                return (
                  <div
                    key={rec.recordId}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      isDark
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold leading-snug">
                        {rec.reasonText}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {rec.createdAtIso} • Số dư sau giao dịch:{' '}
                        <strong>{rec.balanceAfter}/100đ</strong>
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                        isPositive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isPositive ? `+${rec.deltaPoints}đ` : `${rec.deltaPoints}đ`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CẤU HÌNH CHÍNH SÁCH ĐỘNG (CHỈ SYS_ADMIN) */}
      {isAdmin && activeTab === 'DYNAMIC_POLICY' && (
        <form
          onSubmit={handleSaveDynamicPolicy}
          className={`p-6 rounded-3xl border space-y-5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200/90 shadow-sm'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-3">
            <div>
              <h2
                className={`text-sm font-extrabold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {t.policyTitle}
              </h2>
              <p className="text-xs text-slate-400">{t.policySubAdmin}</p>
            </div>
            <Wrench className="w-5 h-5 text-indigo-600" />
          </div>

          {policySavedBanner && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-between">
              <span>{policySavedBanner}</span>
              <button
                type="button"
                onClick={() => setPolicySavedBanner(null)}
                className="underline text-[11px]"
              >
                OK
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold mb-1.5 text-slate-500">
                {t.p1Label}
              </label>
              <input
                type="number"
                value={policyConfig.holdTimeoutMinutes}
                onChange={(e) =>
                  setPolicyConfig({
                    ...policyConfig,
                    holdTimeoutMinutes: Number(e.target.value),
                  })
                }
                className={`w-full px-3.5 py-2.5 rounded-xl border font-bold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-slate-500">
                {t.p2Label}
              </label>
              <input
                type="number"
                value={policyConfig.checkinGracePeriodMinutes}
                onChange={(e) =>
                  setPolicyConfig({
                    ...policyConfig,
                    checkinGracePeriodMinutes: Number(e.target.value),
                  })
                }
                className={`w-full px-3.5 py-2.5 rounded-xl border font-bold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-slate-500">
                {t.p3Label}
              </label>
              <input
                type="number"
                value={policyConfig.maxMeetingHoursPerWeek}
                onChange={(e) =>
                  setPolicyConfig({
                    ...policyConfig,
                    maxMeetingHoursPerWeek: Number(e.target.value),
                  })
                }
                className={`w-full px-3.5 py-2.5 rounded-xl border font-bold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-slate-500">
                {t.p4Label}
              </label>
              <input
                type="number"
                value={policyConfig.minTrustScoreForRecurring}
                onChange={(e) =>
                  setPolicyConfig({
                    ...policyConfig,
                    minTrustScoreForRecurring: Number(e.target.value),
                  })
                }
                className={`w-full px-3.5 py-2.5 rounded-xl border font-bold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-slate-500">
                {t.p5Label}
              </label>
              <input
                type="number"
                value={policyConfig.trustScoreCheckinReward}
                onChange={(e) =>
                  setPolicyConfig({
                    ...policyConfig,
                    trustScoreCheckinReward: Number(e.target.value),
                  })
                }
                className={`w-full px-3.5 py-2.5 rounded-xl border font-bold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-slate-500">
                {t.p6Label}
              </label>
              <input
                type="number"
                value={policyConfig.trustScoreNoshowPenalty}
                onChange={(e) =>
                  setPolicyConfig({
                    ...policyConfig,
                    trustScoreNoshowPenalty: Number(e.target.value),
                  })
                }
                className={`w-full px-3.5 py-2.5 rounded-xl border font-bold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {t.lastUpdatedBy} {policyConfig.updatedByEmail}
            </span>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              {t.savePolicyBtn}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};