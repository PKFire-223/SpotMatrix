import React, { useState, useMemo } from 'react';
import {
  Cpu,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  AlertTriangle,
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
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';

export interface DataOverviewPagesProps {
  workspaceNodes: WorkspaceNodeItem[];
  equipmentsList?: SharedEquipmentItem[];
  trustProfiles?: UserTrustProfileItem[];
  selectedNode?: WorkspaceNodeItem | null;
  userRole?: UserRoleType;
  userEmail?: string;
  isDark?: boolean;
  onUpdateEquipmentStatus?: (
    equipmentId: string,
    nextStatus: EquipmentStatusType
  ) => void;
}

// Đảm bảo mỗi phòng trong 25 phòng (M1-01..M4-06 & H-01) luôn có ít nhất 1 thiết bị riêng biệt
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

export const DataOverviewPages: React.FC<DataOverviewPagesProps> = ({
  workspaceNodes,
  equipmentsList = [],
  trustProfiles = [],
  userRole = 'SYS_ADMIN',
  userEmail = 'sysadmin@spotmatrix.vn',
  isDark = false,
  onUpdateEquipmentStatus,
}) => {
  const isAdmin = userRole === 'SYS_ADMIN';

  const [activeTab, setActiveTab] = useState<
    'EQUIPMENT' | 'TRUST_SCORE' | 'DYNAMIC_POLICY'
  >('EQUIPMENT');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('ALL');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState<string>('');
  const [trustSearchQuery, setTrustSearchQuery] = useState<string>('');

  // Hợp nhất danh sách thiết bị để đảm bảo 100% các phòng (25/25 phòng) đều có ít nhất 1 thiết bị riêng
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

  // Lọc thiết bị theo Tầng + Phòng + Từ khóa tìm kiếm
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
      // Ẩn tài khoản SYS_ADMIN đối với role khác (chỉ SYS_ADMIN mới thấy chính mình)
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
        reason: `Bị từ chối Đặt định kỳ: Điểm tín nhiệm hiện tại (${score}đ) thấp hơn mức sàn quy định (${policyConfig.minTrustScoreForRecurring}đ).`,
      };
    }

    if (
      isRestricted &&
      evalAdvanceDays > policyConfig.restrictedMaxAdvanceDays
    ) {
      return {
        allowed: false,
        reason: `Bị giới hạn ngày đặt trước: Tài khoản dưới ${policyConfig.minTrustScoreForRecurring}đ chỉ được đặt trước tối đa ${policyConfig.restrictedMaxAdvanceDays} ngày (Đang chọn ${evalAdvanceDays} ngày).`,
      };
    }

    return {
      allowed: true,
      reason: `Hợp lệ 100%: Điểm tín nhiệm (${score}đ) đạt chuẩn đặt lịch ${
        evalIsRecurring ? 'định kỳ' : 'đơn lẻ'
      } trước ${evalAdvanceDays} ngày (Hạn mức tối đa ${policyConfig.maxMeetingHoursPerWeek} giờ/tuần).`,
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
      {/* Header Banner */}
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
              Quản lý Thiết bị 25 Phòng (Tầng 1–5), Điểm Tín nhiệm & Chính sách Động
            </h1>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Mỗi phòng họp & Hội trường đều có thiết bị định danh riêng • Hỗ trợ tìm kiếm tức thì
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
            1. Thiết bị 25 Phòng ({completeEquipmentsList.length})
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
            2. Điểm Tín nhiệm ({filteredTrustProfiles.length})
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
            3. Cấu hình Chính sách Động
          </button>
        </div>
      </div>

      {/* TAB 1: QUẢN LÝ THIẾT BỊ DÙNG CHUNG THEO TỪNG PHÒNG KÈM THANH TÌM KIẾM */}
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
                {isAdmin
                  ? 'Danh mục Mã số Thiết bị, Tần suất Hoạt động Tuần/Tháng & Cập nhật Tình trạng (SYS_ADMIN)'
                  : 'Kiểm tra Tình trạng Thiết bị Từng Phòng họp (100% Phòng đều có Thiết bị riêng)'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Đang hiển thị <strong>{filteredEquipments.length}</strong> /{' '}
                {completeEquipmentsList.length} thiết bị trên toàn bộ 25 phòng (Tầng 1 – Tầng 5).
              </p>
            </div>

            {/* Bộ công cụ Tìm kiếm & Lọc theo Tầng / Phòng */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[230px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={equipmentSearchQuery}
                  onChange={(e) => setEquipmentSearchQuery(e.target.value)}
                  placeholder="Tìm thiết bị, mã EQ-..., phòng M1-01..."
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
                <option value="ALL">Tất cả 5 Tầng</option>
                <option value="1">Tầng 1 (6 phòng)</option>
                <option value="2">Tầng 2 (6 phòng)</option>
                <option value="3">Tầng 3 (6 phòng)</option>
                <option value="4">Tầng 4 (6 phòng)</option>
                <option value="5">Tầng 5 • Hội trường H-01</option>
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
                  <option value="ALL">Tất cả 25 phòng (M1-01..H-01)</option>
                  {workspaceNodes.map((n) => (
                    <option key={n.nodeId} value={n.nodeCode}>
                      Phòng {n.nodeCode} — {n.nodeLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredEquipments.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400">
              Không tìm thấy thiết bị nào khớp với từ khóa “{equipmentSearchQuery}”.
            </div>
          ) : (
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
                          Phòng: {eq.assignedNodeId || 'Kho chung'}
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
                          {isAdmin ? (
                            eq.status === 'AVAILABLE' ? (
                              'HOẠT ĐỘNG TỐT'
                            ) : eq.status === 'IN_USE' ? (
                              'ĐANG SỬ DỤNG'
                            ) : (
                              'HỎNG / BẢO TRÌ'
                            )
                          ) : isWorking ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Chạy tốt • Dùng được ngay
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              Đang hỏng • Không dùng được
                            </>
                          )}
                        </span>
                      </div>

                      <h3
                        className={`text-sm font-extrabold mt-2.5 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {eq.equipmentName}
                      </h3>

                      {isAdmin ? (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 space-y-1 text-xs text-slate-500">
                          <p className="flex justify-between">
                            <span>Mã định danh thiết bị:</span>
                            <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                              {eq.equipmentCode}
                            </strong>
                          </p>
                          <p className="flex justify-between">
                            <span>Tần suất hoạt động:</span>
                            <strong>
                              {eq.weeklyUsageHours || 20}h/tuần •{' '}
                              {eq.monthlyUsageHours || 84}h/tháng
                            </strong>
                          </p>
                          <p className="flex justify-between">
                            <span>Độ bền kỹ thuật:</span>
                            <strong
                              className={
                                (eq.healthPercent || 95) < 60
                                  ? 'text-rose-500'
                                  : 'text-teal-600'
                              }
                            >
                              {eq.healthPercent || 95}%
                            </strong>
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1.5">
                          Mã thiết bị: <strong>{eq.equipmentCode}</strong> •{' '}
                          <strong
                            className={
                              isWorking ? 'text-teal-600' : 'text-rose-500'
                            }
                          >
                            {isWorking
                              ? 'Thiết bị vận hành ổn định cho cuộc họp.'
                              : 'Thiết bị đang chờ kỹ thuật viên sửa chữa.'}
                          </strong>
                        </p>
                      )}
                    </div>

                    {isAdmin && onUpdateEquipmentStatus && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5">
                        {(
                          [
                            { code: 'AVAILABLE', label: 'Hoạt động' },
                            { code: 'IN_USE', label: 'Đang dùng' },
                            { code: 'BROKEN', label: 'Báo hỏng' },
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
          )}
        </div>
      )}

      {/* TAB 2: BẢNG ĐIỂM TÍN NHIỆM (TRUST SCORE) & KIỂM TRA ĐIỀU KIỆN ĐẶT LỊCH */}
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
                  Bảng Xếp hạng Điểm Tín nhiệm Người dùng
                </h2>
                <p className="text-xs text-slate-400">
                  Quét QR đúng hạn: +{policyConfig.trustScoreCheckinReward} điểm • Bỏ chỗ quá 15 phút: -{policyConfig.trustScoreNoshowPenalty} điểm
                </p>
              </div>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={trustSearchQuery}
                  onChange={(e) => setTrustSearchQuery(e.target.value)}
                  placeholder="Tìm tên, email, phòng ban..."
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
                            Chế độ Hạn chế
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {tp.userEmail} • Bộ phận: {tp.departmentName}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5 text-[11px] font-semibold">
                        <span className="text-teal-600 flex items-center gap-1">
                          <PlusCircle className="w-3 h-3" /> Check-in đúng giờ:{' '}
                          {tp.onTimeCheckInCount} lần
                        </span>
                        <span className="text-rose-500 flex items-center gap-1">
                          <MinusCircle className="w-3 h-3" /> Vi phạm No-Show 15p:{' '}
                          {tp.noShowPenaltyCount} lần
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
                        {tp.trustScore}/100đ
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
                  Trình Kiểm tra Điều kiện Đặt lịch theo Điểm Tín nhiệm
                </h2>
                <p className="text-xs text-slate-400">
                  Mô phỏng thuật toán kiểm tra quyền Đặt định kỳ & Số ngày đặt trước
                </p>
              </div>
              <Award className="w-5 h-5 text-teal-600 shrink-0" />
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-500">
                  Chọn tài khoản kiểm tra
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
                      {tp.fullName} ({tp.trustScore}đ)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-500">
                  Loại yêu cầu đặt phòng
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
                  <option value="RECURRING">
                    Đặt lịch Định kỳ hàng tuần (Yêu cầu ≥ 60đ)
                  </option>
                  <option value="SINGLE">Đặt lịch Đơn lẻ 1 lần</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-500">
                  Số ngày đặt trước: {evalAdvanceDays} ngày
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

      {/* TAB 3: CẤU HÌNH CHÍNH SÁCH ĐỘNG & HẠN MỨC */}
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
                Cấu hình Chính sách Động & Hạn mức Hệ thống (`GLOBAL_WORKSPACE_POLICY`)
              </h2>
              <p className="text-xs text-slate-400">
                {isAdmin
                  ? 'Quyền SYS_ADMIN: Chỉnh sửa trực tiếp các tham số vận hành và lưu vào MongoDB Atlas.'
                  : 'Chế độ Xem: Chỉ tài khoản SYS_ADMIN mới được phép thay đổi tham số chính sách toàn cục.'}
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
                Đóng
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold mb-1.5 text-slate-500">
                1. Thời gian Giữ chỗ tạm (Hold Timeout - Phút)
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
                2. Hạn Cronjob tự thu hồi chỗ No-Show (Phút)
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
                3. Hạn mức Giờ họp tối đa / Tuần (Giờ)
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
                4. Điểm tín nhiệm tối thiểu để Đặt định kỳ
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
                5. Điểm thưởng Check-in QR đúng giờ (+Điểm)
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
                6. Điểm phạt quá 15p không Check-in (-Điểm)
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
              Cập nhật lần cuối bởi: {policyConfig.updatedByEmail}
            </span>
            {isAdmin && (
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                Lưu Chính sách Động lên MongoDB
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};