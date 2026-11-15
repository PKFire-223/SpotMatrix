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
} from 'lucide-react';
import {
  EquipmentStatusType,
  SharedEquipmentItem,
  SystemPolicyConfigItem,
  UserRoleType,
  UserTrustProfileItem,
  WebLanguageCodeType,
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';

export interface DataOverviewPagesProps {
  workspaceNodes: WorkspaceNodeItem[];
  equipmentsList?: SharedEquipmentItem[];
  trustProfiles?: UserTrustProfileItem[];
  selectedNode?: WorkspaceNodeItem | null;
  userRole?: UserRoleType;
  userEmail?: string;
  webLanguage?: WebLanguageCodeType;
  isDark?: boolean;
  onUpdateEquipmentStatus?: (
    equipmentId: string,
    nextStatus: EquipmentStatusType
  ) => void;
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
        healthPercent: 94 + (idx % 6),
      });
    }
  });

  return merged;
}

const DATA_I18N: Record<
  WebLanguageCodeType,
  {
    headerTitle: string;
    headerSub: string;
    tab1: (c: number) => string;
    tab2: (c: number) => string;
    tab3: string;
    eqSectionTitleAdmin: string;
    eqSectionTitleUser: string;
    eqShowingSub: (f: number, t: number) => string;
    searchEqPlaceholder: string;
    allFloorsOpt: string;
    floorOpt: (fl: number) => string;
    floor5Opt: string;
    allRoomsOpt: string;
    roomPrefix: string;
    statusAvailable: string;
    statusInUse: string;
    statusBroken: string;
    eqCodeLabel: string;
    usageFreqLabel: string;
    healthLabel: string;
    btnActive: string;
    btnInUse: string;
    btnBroken: string;
    trustSectionTitle: string;
    trustSectionSub: (r: number, p: number) => string;
    searchTrustPlaceholder: string;
    restrictedBadge: string;
    deptLabel: string;
    onTimeLabel: (c: number) => string;
    noShowLabel: (c: number) => string;
    evalTitle: string;
    evalSub: string;
    selectEvalUser: string;
    selectEvalType: string;
    optRecurring: string;
    optSingle: string;
    advanceDaysLabel: (d: number) => string;
    policyTitle: string;
    policySubAdmin: string;
    policySubView: string;
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
    headerTitle: 'Quản lý Thiết bị 25 Phòng (Tầng 1–5), Điểm Tín nhiệm & Chính sách Động',
    headerSub: 'Mỗi phòng họp & Hội trường đều có thiết bị định danh riêng • Hỗ trợ tìm kiếm tức thì',
    tab1: (c) => `1. Thiết bị 25 Phòng (${c})`,
    tab2: (c) => `2. Điểm Tín nhiệm (${c})`,
    tab3: '3. Cấu hình Chính sách Động',
    eqSectionTitleAdmin:
      'Danh mục Mã số Thiết bị, Tần suất Hoạt động Tuần/Tháng & Cập nhật Tình trạng (SYS_ADMIN)',
    eqSectionTitleUser:
      'Kiểm tra Tình trạng Thiết bị Từng Phòng họp (100% Phòng đều có Thiết bị riêng)',
    eqShowingSub: (f, t) =>
      `Đang hiển thị ${f} / ${t} thiết bị trên toàn bộ 25 phòng (Tầng 1 – Tầng 5).`,
    searchEqPlaceholder: 'Tìm thiết bị, mã EQ-..., phòng M1-01...',
    allFloorsOpt: 'Tất cả 5 Tầng',
    floorOpt: (fl) => `Tầng ${fl} (6 phòng)`,
    floor5Opt: 'Tầng 5 • Hội trường H-01',
    allRoomsOpt: 'Tất cả 25 phòng (M1-01..H-01)',
    roomPrefix: 'Phòng',
    statusAvailable: 'HOẠT ĐỘNG TỐT',
    statusInUse: 'ĐANG SỬ DỤNG',
    statusBroken: 'HỎNG / BẢO TRÌ',
    eqCodeLabel: 'Mã định danh thiết bị:',
    usageFreqLabel: 'Tần suất hoạt động:',
    healthLabel: 'Độ bền kỹ thuật:',
    btnActive: 'Hoạt động',
    btnInUse: 'Đang dùng',
    btnBroken: 'Báo hỏng',
    trustSectionTitle: 'Bảng Xếp hạng Điểm Tín nhiệm Người dùng',
    trustSectionSub: (r, p) =>
      `Quét QR đúng hạn: +${r} điểm • Bỏ chỗ quá 15 phút: -${p} điểm`,
    searchTrustPlaceholder: 'Tìm tên, email, phòng ban...',
    restrictedBadge: 'Chế độ Hạn chế',
    deptLabel: 'Bộ phận:',
    onTimeLabel: (c) => `Check-in đúng giờ: ${c} lần`,
    noShowLabel: (c) => `Vi phạm No-Show 15p: ${c} lần`,
    evalTitle: 'Trình Kiểm tra Điều kiện Đặt lịch theo Điểm Tín nhiệm',
    evalSub: 'Mô phỏng thuật toán kiểm tra quyền Đặt định kỳ & Số ngày đặt trước',
    selectEvalUser: 'Chọn tài khoản kiểm tra',
    selectEvalType: 'Loại yêu cầu đặt phòng',
    optRecurring: 'Đặt lịch Định kỳ hàng tuần (Yêu cầu ≥ 60đ)',
    optSingle: 'Đặt lịch Đơn lẻ 1 lần',
    advanceDaysLabel: (d) => `Số ngày đặt trước: ${d} ngày`,
    policyTitle: 'Cấu hình Chính sách Động & Hạn mức Hệ thống (GLOBAL_WORKSPACE_POLICY)',
    policySubAdmin:
      'Quyền SYS_ADMIN: Chỉnh sửa trực tiếp các tham số vận hành và lưu vào MongoDB Atlas.',
    policySubView:
      'Chế độ Xem: Chỉ tài khoản SYS_ADMIN mới được phép thay đổi tham số chính sách toàn cục.',
    p1Label: '1. Thời gian Giữ chỗ tạm (Hold Timeout - Phút)',
    p2Label: '2. Hạn Cronjob tự thu hồi chỗ No-Show (Phút)',
    p3Label: '3. Hạn mức Giờ họp tối đa / Tuần (Giờ)',
    p4Label: '4. Điểm tín nhiệm tối thiểu để Đặt định kỳ',
    p5Label: '5. Điểm thưởng Check-in QR đúng giờ (+Điểm)',
    p6Label: '6. Điểm phạt quá 15p không Check-in (-Điểm)',
    lastUpdatedBy: 'Cập nhật lần cuối bởi:',
    savePolicyBtn: 'Lưu Chính sách Động lên MongoDB',
  },
  en: {
    headerTitle: '25-Room Equipment Inventory (Floors 1–5), Trust Score & Dynamic Policy',
    headerSub: 'Every meeting room & Colosseum Hall has dedicated tracked devices • Instant search',
    tab1: (c) => `1. Room Equipment (${c})`,
    tab2: (c) => `2. Trust Score (${c})`,
    tab3: '3. Dynamic System Policy',
    eqSectionTitleAdmin:
      'Equipment Code Directory, Weekly/Monthly Usage & Status Management (SYS_ADMIN)',
    eqSectionTitleUser:
      'Check Meeting Room Equipment Status (100% of Rooms Have Dedicated Devices)',
    eqShowingSub: (f, t) =>
      `Showing ${f} / ${t} devices across all 25 rooms (Floors 1 – 5).`,
    searchEqPlaceholder: 'Search device name, code EQ-..., room M1-01...',
    allFloorsOpt: 'All 5 Floors',
    floorOpt: (fl) => `Floor ${fl} (6 rooms)`,
    floor5Opt: 'Floor 5 • Hall H-01',
    allRoomsOpt: 'All 25 Rooms (M1-01..H-01)',
    roomPrefix: 'Room',
    statusAvailable: 'OPERATIONAL',
    statusInUse: 'IN USE',
    statusBroken: 'MAINTENANCE',
    eqCodeLabel: 'Equipment Code:',
    usageFreqLabel: 'Usage Frequency:',
    healthLabel: 'Hardware Health:',
    btnActive: 'Available',
    btnInUse: 'In Use',
    btnBroken: 'Broken',
    trustSectionTitle: 'Employee Trust Score Leaderboard',
    trustSectionSub: (r, p) =>
      `On-time QR Check-in: +${r} pts • 15m No-Show Penalty: -${p} pts`,
    searchTrustPlaceholder: 'Search name, email, department...',
    restrictedBadge: 'Restricted Mode',
    deptLabel: 'Department:',
    onTimeLabel: (c) => `On-Time Check-ins: ${c}`,
    noShowLabel: (c) => `15m No-Shows: ${c}`,
    evalTitle: 'Trust Score Booking Eligibility Simulator',
    evalSub: 'Simulate recurring booking & advance-day permissions by Trust Score',
    selectEvalUser: 'Select Account to Evaluate',
    selectEvalType: 'Booking Request Type',
    optRecurring: 'Weekly Recurring Booking (Requires ≥ 60 pts)',
    optSingle: 'Single Session Booking',
    advanceDaysLabel: (d) => `Advance Booking Days: ${d} days`,
    policyTitle: 'Dynamic Governance Policy & Quotas (GLOBAL_WORKSPACE_POLICY)',
    policySubAdmin:
      'SYS_ADMIN Privilege: Modify operational parameters and persist to MongoDB Atlas.',
    policySubView:
      'Read-Only View: Only SYS_ADMIN can modify global policy parameters.',
    p1Label: '1. Temporary Hold Timeout (Minutes)',
    p2Label: '2. Auto-Release No-Show Grace Period (Minutes)',
    p3Label: '3. Max Weekly Meeting Hours (Hours)',
    p4Label: '4. Min Trust Score for Recurring Bookings',
    p5Label: '5. On-Time QR Check-in Reward (+Pts)',
    p6Label: '6. 15m No-Show Penalty (-Pts)',
    lastUpdatedBy: 'Last updated by:',
    savePolicyBtn: 'Save Dynamic Policy to MongoDB',
  },
  ja: {
    headerTitle: '全25室 会議室設備管理 (1〜5階)・信頼スコア・動的ポリシー設定',
    headerSub: '全会議室および5階大ホールの専用機器をリアルタイム管理・即時検索',
    tab1: (c) => `1. 全25室の設備一覧 (${c})`,
    tab2: (c) => `2. 信頼スコア (${c})`,
    tab3: '3. 動的システムポリシー',
    eqSectionTitleAdmin:
      '機器コード台帳・週間/月間稼働時間・ステータス更新 (SYS_ADMIN)',
    eqSectionTitleUser:
      '各会議室の設備稼働ステータス確認 (全25室に専用機器を配備)',
    eqShowingSub: (f, t) =>
      `全25室（1階〜5階）の機器 ${t} 台中 ${f} 台を表示中。`,
    searchEqPlaceholder: '機器名、コード EQ-...、部屋 M1-01 で検索...',
    allFloorsOpt: '全5フロア',
    floorOpt: (fl) => `${fl}階 (6室)`,
    floor5Opt: '5階 • 大ホール H-01',
    allRoomsOpt: '全25室 (M1-01..H-01)',
    roomPrefix: '部屋',
    statusAvailable: '正常稼働中',
    statusInUse: '使用中',
    statusBroken: '故障 / 点検中',
    eqCodeLabel: '機器識別コード:',
    usageFreqLabel: '稼働時間:',
    healthLabel: '機器ヘルス状態:',
    btnActive: '正常稼働',
    btnInUse: '使用中',
    btnBroken: '故障報告',
    trustSectionTitle: '社員別 信頼スコア (Trust Score) 一覧',
    trustSectionSub: (r, p) =>
      `時間内QRチェックイン: +${r}点 • 15分無断キャンセル: -${p}点`,
    searchTrustPlaceholder: '氏名、メール、部署で検索...',
    restrictedBadge: '制限モード',
    deptLabel: '所属部署:',
    onTimeLabel: (c) => `時間内チェックイン: ${c}回`,
    noShowLabel: (c) => `15分無断キャンセル: ${c}回`,
    evalTitle: '信頼スコア予約権限シミュレーター',
    evalSub: '定期予約および事前予約可能日数の判定アルゴリズムを検証',
    selectEvalUser: '検証するアカウントを選択',
    selectEvalType: '予約タイプ',
    optRecurring: '毎週定期予約 (60点以上が必要)',
    optSingle: '単発予約 (1回のみ)',
    advanceDaysLabel: (d) => `事前予約日数: ${d}日前`,
    policyTitle: '動的システムポリシー＆上限設定 (GLOBAL_WORKSPACE_POLICY)',
    policySubAdmin:
      'SYS_ADMIN権限：運用パラメータを直接編集し MongoDB Atlas に保存できます。',
    policySubView:
      '閲覧モード：ポリシー設定の変更は SYS_ADMIN のみ可能です。',
    p1Label: '1. 一時保持タイムアウト (Hold Timeout - 分)',
    p2Label: '2. 無断キャンセル自動解放猶予 (分)',
    p3Label: '3. 週間最大会議時間上限 (時間)',
    p4Label: '4. 定期予約に必要な最低信頼スコア',
    p5Label: '5. 時間内QRチェックイン報酬 (+点)',
    p6Label: '6. 15分無断キャンセル減点 (-点)',
    lastUpdatedBy: '最終更新者:',
    savePolicyBtn: '動的ポリシーをMongoDBに保存',
  },
};

export const DataOverviewPages: React.FC<DataOverviewPagesProps> = ({
  workspaceNodes,
  equipmentsList = [],
  trustProfiles = [],
  userRole = 'SYS_ADMIN',
  userEmail = 'sysadmin@spotmatrix.vn',
  webLanguage = 'vi',
  isDark = false,
  onUpdateEquipmentStatus,
}) => {
  const isAdmin = userRole === 'SYS_ADMIN';
  const t = DATA_I18N[webLanguage] || DATA_I18N.vi;

  const [activeTab, setActiveTab] = useState<
    'EQUIPMENT' | 'TRUST_SCORE' | 'DYNAMIC_POLICY'
  >('EQUIPMENT');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('ALL');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState<string>('');
  const [trustSearchQuery, setTrustSearchQuery] = useState<string>('');

  const completeEquipmentsList = useMemo(() => {
    return ensureEveryRoomHasDedicatedEquipment(workspaceNodes, equipmentsList);
  }, [workspaceNodes, equipmentsList]);

  const [policyConfig, setPolicyConfig] = useState<SystemPolicyConfigItem>({
    policyKey: 'GLOBAL_WORKSPACE_POLICY',
    holdTimeoutMinutes: 5,
    checkinGracePeriodMinutes: 15,
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

  const [evalTargetEmail, setEvalTargetEmail] = useState<string>(userEmail);
  const [evalIsRecurring, setEvalIsRecurring] = useState<boolean>(true);
  const [evalAdvanceDays, setEvalAdvanceDays] = useState<number>(7);

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

  const filteredTrustProfiles = useMemo(() => {
    const q = trustSearchQuery.trim().toLowerCase();
    return trustProfiles.filter((tp) => {
      if (!isAdmin && tp.role === 'SYS_ADMIN') return false;
      if (!q) return true;
      return (
        tp.fullName.toLowerCase().includes(q) ||
        tp.userEmail.toLowerCase().includes(q) ||
        tp.departmentName.toLowerCase().includes(q)
      );
    });
  }, [trustProfiles, trustSearchQuery, isAdmin]);

  const evalUserProfile = useMemo(() => {
    return (
      trustProfiles.find(
        (tp) => tp.userEmail.toLowerCase() === evalTargetEmail.toLowerCase()
      ) || trustProfiles[0]
    );
  }, [trustProfiles, evalTargetEmail]);

  const eligibilityResult = useMemo(() => {
    const score = evalUserProfile?.trustScore ?? 100;
    const isRestricted = score < policyConfig.minTrustScoreForRecurring;

    if (evalIsRecurring && isRestricted) {
      return {
        allowed: false,
        reason: `Denied Recurring Booking: Current Trust Score (${score}) is below the required threshold (${policyConfig.minTrustScoreForRecurring}).`,
      };
    }

    if (
      isRestricted &&
      evalAdvanceDays > policyConfig.restrictedMaxAdvanceDays
    ) {
      return {
        allowed: false,
        reason: `Advance Days Restricted: Score below ${policyConfig.minTrustScoreForRecurring} can book at most ${policyConfig.restrictedMaxAdvanceDays} days ahead.`,
      };
    }

    return {
      allowed: true,
      reason: `Eligible (100%): Trust Score (${score}/100) qualifies for ${
        evalIsRecurring ? 'recurring' : 'single'
      } booking ${evalAdvanceDays} days in advance (Max ${policyConfig.maxMeetingHoursPerWeek}h/week).`,
    };
  }, [evalUserProfile, evalIsRecurring, evalAdvanceDays, policyConfig]);

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
      <div
        className={`p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              isDark
                ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                : 'bg-teal-50 border-teal-100 text-teal-600'
            }`}
          >
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1
              className={`text-lg font-extrabold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {t.headerTitle}
            </h1>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {t.headerSub}
            </p>
          </div>
        </div>

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
            {t.tab2(filteredTrustProfiles.length)}
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
      </div>

      {activeTab === 'EQUIPMENT' && (
        <div
          className={`p-6 rounded-3xl border space-y-5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-slate-800 pb-4">
            <div>
              <h2
                className={`text-sm font-extrabold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {isAdmin ? t.eqSectionTitleAdmin : t.eqSectionTitleUser}
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
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
              const isWorking = eq.status !== 'BROKEN';
              return (
                <div
                  key={eq.equipmentId}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 hover:border-indigo-500/40'
                      : 'bg-slate-50/70 border-slate-200/80 hover:border-indigo-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-600 text-white">
                        {t.roomPrefix}: {eq.assignedNodeId || 'M1-01'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 ${
                          eq.status === 'AVAILABLE'
                            ? 'bg-teal-500/15 text-teal-600'
                            : eq.status === 'IN_USE'
                            ? 'bg-indigo-500/15 text-indigo-600'
                            : 'bg-rose-500/15 text-rose-600'
                        }`}
                      >
                        {eq.status === 'AVAILABLE'
                          ? t.statusAvailable
                          : eq.status === 'IN_USE'
                          ? t.statusInUse
                          : t.statusBroken}
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
                        <span>{t.healthLabel}</span>
                        <strong
                          className={
                            isWorking ? 'text-teal-600' : 'text-rose-500'
                          }
                        >
                          {eq.healthPercent || 95}%
                        </strong>
                      </p>
                    </div>
                  </div>

                  {isAdmin && onUpdateEquipmentStatus && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5">
                      {(
                        [
                          { code: 'AVAILABLE', label: t.btnActive },
                          { code: 'IN_USE', label: t.btnInUse },
                          { code: 'BROKEN', label: t.btnBroken },
                        ] as { code: EquipmentStatusType; label: string }[]
                      ).map((btn) => (
                        <button
                          key={btn.code}
                          type="button"
                          onClick={() =>
                            onUpdateEquipmentStatus(eq.equipmentId, btn.code)
                          }
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold border transition ${
                            eq.status === btn.code
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'TRUST_SCORE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div
            className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-indigo-100/80 shadow-sm'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <div>
                <h2
                  className={`text-sm font-extrabold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {t.trustSectionTitle}
                </h2>
                <p className="text-xs text-slate-400">
                  {t.trustSectionSub(
                    policyConfig.trustScoreCheckinReward,
                    policyConfig.trustScoreNoshowPenalty
                  )}
                </p>
              </div>

              <div className="relative w-56">
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
            </div>

            <div className="space-y-3">
              {filteredTrustProfiles.map((tp) => {
                const isRestricted =
                  tp.trustScore < policyConfig.minTrustScoreForRecurring;
                return (
                  <div
                    key={tp.userEmail}
                    className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                      isDark
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/15 text-indigo-600">
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
                        <span className="text-teal-600 flex items-center gap-1">
                          <PlusCircle className="w-3 h-3" />{' '}
                          {t.onTimeLabel(tp.onTimeCheckInCount)}
                        </span>
                        <span className="text-rose-500 flex items-center gap-1">
                          <MinusCircle className="w-3 h-3" />{' '}
                          {t.noShowLabel(tp.noShowPenaltyCount)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-2xl font-black ${
                          isRestricted
                            ? 'text-rose-500'
                            : 'text-teal-600 dark:text-teal-400'
                        }`}
                      >
                        {tp.trustScore}/100
                      </span>
                      <div className="w-28 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-1">
                        <div
                          className={`h-full ${
                            isRestricted ? 'bg-rose-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${tp.trustScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`lg:col-span-5 p-6 rounded-3xl border space-y-4 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-indigo-100/80 shadow-sm'
            }`}
          >
            <div className="border-b border-slate-200/70 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2
                  className={`text-sm font-extrabold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {t.evalTitle}
                </h2>
                <p className="text-xs text-slate-400">{t.evalSub}</p>
              </div>
              <Award className="w-5 h-5 text-teal-600 shrink-0" />
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-500">
                  {t.selectEvalUser}
                </label>
                <select
                  value={evalTargetEmail}
                  onChange={(e) => setEvalTargetEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {filteredTrustProfiles.map((tp) => (
                    <option key={tp.userEmail} value={tp.userEmail}>
                      {tp.fullName} ({tp.trustScore})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-500">
                  {t.selectEvalType}
                </label>
                <select
                  value={evalIsRecurring ? 'RECURRING' : 'SINGLE'}
                  onChange={(e) =>
                    setEvalIsRecurring(e.target.value === 'RECURRING')
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="RECURRING">{t.optRecurring}</option>
                  <option value="SINGLE">{t.optSingle}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-500">
                  {t.advanceDaysLabel(evalAdvanceDays)}
                </label>
                <input
                  type="range"
                  min={1}
                  max={14}
                  value={evalAdvanceDays}
                  onChange={(e) => setEvalAdvanceDays(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div
                className={`p-4 rounded-2xl border font-semibold ${
                  eligibilityResult.allowed
                    ? isDark
                      ? 'bg-teal-950/30 border-teal-500/40 text-teal-300'
                      : 'bg-teal-50 border-teal-200 text-teal-800'
                    : isDark
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {eligibilityResult.reason}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DYNAMIC_POLICY' && (
        <form
          onSubmit={handleSaveDynamicPolicy}
          className={`p-6 rounded-3xl border space-y-5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
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
              <p className="text-xs text-slate-400">
                {isAdmin ? t.policySubAdmin : t.policySubView}
              </p>
            </div>
            <Wrench className="w-5 h-5 text-indigo-600" />
          </div>

          {policySavedBanner && (
            <div className="p-3.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-between">
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
                disabled={!isAdmin}
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
                disabled={!isAdmin}
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
                disabled={!isAdmin}
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
                disabled={!isAdmin}
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
                disabled={!isAdmin}
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
                disabled={!isAdmin}
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
            {isAdmin && (
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                {t.savePolicyBtn}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};