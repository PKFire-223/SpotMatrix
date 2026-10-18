import React, { useState, useMemo } from 'react';
import {
  Cpu,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Activity,
  Award,
  Filter,
} from 'lucide-react';
import {
  EquipmentStatusType,
  SharedEquipmentItem,
  UserRoleType,
  UserTrustProfileItem,
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';

interface DataOverviewPagesProps {
  workspaceNodes: WorkspaceNodeItem[];
  equipmentsList?: SharedEquipmentItem[];
  trustProfiles?: UserTrustProfileItem[];
  selectedNode?: WorkspaceNodeItem | null;
  userRole?: UserRoleType;
  userEmail?: string;
  isDark?: boolean;
  onUpdateEquipmentStatus?: (equipmentId: string, nextStatus: EquipmentStatusType) => void;
}

export const DataOverviewPages: React.FC<DataOverviewPagesProps> = ({
  workspaceNodes = [],
  equipmentsList = [],
  trustProfiles = [],
  selectedNode,
  userRole = 'EMPLOYEE',
  userEmail = 'employee.dev@spotmatrix.vn',
  isDark = false,
  onUpdateEquipmentStatus,
}) => {
  const [selectedRoomCodeFilter, setSelectedRoomCodeFilter] = useState<string>(
    selectedNode?.nodeCode || 'M1-01'
  );
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('ALL');
  const [adminSearch, setAdminSearch] = useState<string>('');

  const isSysAdmin = userRole === 'SYS_ADMIN';

  // Tinh toan so lieu THUC TE 100% tu danh sach thiet bi va ho so tin nhiem
  const realMetrics = useMemo(() => {
    const totalEq = equipmentsList.length;
    const activeEq = equipmentsList.filter((e) => e.status === 'AVAILABLE').length;
    const repairingEq = equipmentsList.filter((e) => e.status === 'IN_USE').length;
    const brokenEq = equipmentsList.filter((e) => e.status === 'BROKEN').length;

    const totalWeeklyHours = equipmentsList.reduce(
      (sum, e) => sum + (e.weeklyUsageHours || 0),
      0
    );
    const totalMonthlyHours = equipmentsList.reduce(
      (sum, e) => sum + (e.monthlyUsageHours || 0),
      0
    );

    const avgTrust =
      trustProfiles.length > 0
        ? Math.round(
            trustProfiles.reduce((s, u) => s + u.trustScore, 0) / trustProfiles.length
          )
        : 100;

    return {
      totalEq,
      activeEq,
      repairingEq,
      brokenEq,
      totalWeeklyHours,
      totalMonthlyHours,
      avgTrust,
    };
  }, [equipmentsList, trustProfiles]);

  // Danh sach thiet bi loc theo quyen
  const visibleEquipments = useMemo(() => {
    if (!isSysAdmin) {
      // Role tru ADMIN: Chi thay thiet bi cua phong minh chon
      return equipmentsList.filter((eq) => eq.assignedNodeId === selectedRoomCodeFilter);
    }
    return equipmentsList.filter((eq) => {
      if (adminStatusFilter !== 'ALL' && eq.status !== adminStatusFilter) return false;
      if (adminSearch.trim() !== '') {
        const kw = adminSearch.toLowerCase();
        return (
          eq.equipmentCode.toLowerCase().includes(kw) ||
          eq.equipmentName.toLowerCase().includes(kw) ||
          (eq.assignedNodeId || '').toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [equipmentsList, isSysAdmin, selectedRoomCodeFilter, adminStatusFilter, adminSearch]);

  const cardSurface = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-800 shadow-sm';

  return (
    <div className="space-y-6">
      {/* 1. 4 THE THONG KE THUC TE (TINH TU DU LIEU THAT 100%) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${cardSurface}`}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Thiết bị Hoạt động Tốt</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">
            {realMetrics.activeEq}/{realMetrics.totalEq}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Đang sửa chữa: {realMetrics.repairingEq} • Đang hỏng: {realMetrics.brokenEq}
          </p>
        </div>

        <div className={`p-5 rounded-2xl border ${cardSurface}`}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Tần suất Hoạt động Tuần</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold mt-2">
            {realMetrics.totalWeeklyHours} giờ
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Tổng tần suất trong tháng: {realMetrics.totalMonthlyHours} giờ
          </p>
        </div>

        <div className={`p-5 rounded-2xl border ${cardSurface}`}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Điểm Tín nhiệm Trung bình</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
            {realMetrics.avgTrust}đ
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Tính trực tiếp từ {trustProfiles.length} hồ sơ tài khoản
          </p>
        </div>

        <div className={`p-5 rounded-2xl border ${cardSurface}`}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Phân quyền Quan sát Thiết bị</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-base font-extrabold mt-2">
            {isSysAdmin ? 'Toàn quyền ADMIN (Chi tiết)' : `Theo phòng (${userRole})`}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {isSysAdmin
              ? 'Xem đủ Mã số, Tần suất & Đổi trạng thái'
              : 'Chỉ hiển thị thiết bị phòng bạn có chạy được không'}
          </p>
        </div>
      </div>

      {/* 2. KHU VUC QUAN LY THIET BI PHAN QUYEN THEO ROLE */}
      <div className={`p-5 rounded-2xl border space-y-4 ${cardSurface}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              {isSysAdmin
                ? 'Danh mục Mã số Thiết bị, Tần suất Hoạt động & Tình trạng Toàn Tòa nhà (ADMIN)'
                : `Kiểm tra Tình trạng Thiết bị của Phòng (${selectedRoomCodeFilter})`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isSysAdmin
                ? 'Định dạng chuẩn MongoDB: EQ-<MÃ PHÒNG>-<LOẠI>-<SỐ THỨ TỰ> • Cập nhật trực tiếp tình trạng Hoạt động / Sửa chữa / Hỏng'
                : 'Hiển thị tình trạng hiện tại của thiết bị trong phòng bạn chọn có sẵn sàng hoạt động hay không'}
            </p>
          </div>

          {!isSysAdmin ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-500">Chọn phòng của bạn:</span>
              <select
                value={selectedRoomCodeFilter}
                onChange={(e) => setSelectedRoomCodeFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl border font-bold ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                {workspaceNodes.map((n) => (
                  <option key={n.nodeId} value={n.nodeCode}>
                    Phòng {n.nodeCode} — {n.nodeLabel}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã thiết bị (EQ-M101...), phòng..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className={`pl-8 pr-3 py-2 rounded-xl border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <select
                value={adminStatusFilter}
                onChange={(e) => setAdminStatusFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl border font-bold ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">Tất cả tình trạng</option>
                <option value="AVAILABLE">Đang hoạt động tốt</option>
                <option value="IN_USE">Đang sửa chữa / Bảo trì</option>
                <option value="BROKEN">Đang hỏng</option>
              </select>
            </div>
          )}
        </div>

        {/* HIEN THI CHO NHAN VIEN / QUAN LY (CHI HIEN THI THIET BI PHONG MINH CHAY DUOC HAY KHONG) */}
        {!isSysAdmin ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {visibleEquipments.map((eq) => {
              const isWorking = eq.status === 'AVAILABLE';
              return (
                <div
                  key={eq.equipmentId}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-slate-950/80 border-slate-800'
                      : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div>
                    <p className="text-xs font-extrabold">{eq.equipmentName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Lắp đặt tại: Phòng <strong>{eq.assignedNodeId}</strong>
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold shrink-0 flex items-center gap-1.5 ${
                      isWorking
                        ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isWorking ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Chạy tốt
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Không dùng được
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* HIEN THI CHI TIET TOAN DIEN CHO ADMIN (MA SO, PHONG, TAN SUAT TUAN/THANG, DOI TINH TRANG) */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b text-[11px] uppercase text-slate-400 ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <th className="py-3 px-3">Mã số Thiết bị (MongoDB ID)</th>
                  <th className="py-3 px-3">Tên Thiết bị & Chủng loại</th>
                  <th className="py-3 px-3">Phòng Lắp đặt</th>
                  <th className="py-3 px-3">Tần suất Tuần / Tháng</th>
                  <th className="py-3 px-3">Tình trạng Kỹ thuật</th>
                  <th className="py-3 px-3 text-right">Cập nhật Tình trạng (Admin)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleEquipments.map((eq) => (
                  <tr key={eq.equipmentId}>
                    <td className="py-3 px-3 font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                      {eq.equipmentCode}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold">{eq.equipmentName}</p>
                      <p className="text-[11px] text-slate-400">{eq.categoryName}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                        Phòng {eq.assignedNodeId}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold">{eq.weeklyUsageHours || 18}h / tuần</span>
                      <p className="text-[11px] text-slate-400">
                        {eq.monthlyUsageHours || 74}h / tháng • Độ bền: {eq.healthPercent || 96}%
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      {eq.status === 'AVAILABLE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400 font-extrabold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Đang hoạt động
                        </span>
                      )}
                      {eq.status === 'IN_USE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">
                          <Wrench className="w-3 h-3" /> Đang sửa chữa
                        </span>
                      )}
                      {eq.status === 'BROKEN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold text-[11px]">
                          <AlertTriangle className="w-3 h-3" /> Đang hỏng
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {onUpdateEquipmentStatus && (
                        <div className="inline-flex items-center gap-1">
                          {(
                            [
                              { st: 'AVAILABLE', label: 'Hoạt động' },
                              { st: 'IN_USE', label: 'Sửa chữa' },
                              { st: 'BROKEN', label: 'Báo hỏng' },
                            ] as Array<{ st: EquipmentStatusType; label: string }>
                          ).map((btn) => (
                            <button
                              key={btn.st}
                              type="button"
                              onClick={() => onUpdateEquipmentStatus(eq.equipmentId, btn.st)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                eq.status === btn.st
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : isDark
                                  ? 'bg-slate-950 border-slate-800 text-slate-400'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. BANG DIEM TIN NHIEM THUC TE CUA NGUOI DUNG */}
      <div className={`p-5 rounded-2xl border space-y-4 ${cardSurface}`}>
        <div>
          <h3 className="text-base font-extrabold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Bảng Điểm Tín nhiệm & Lịch sử Check-in Đúng hạn
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mỗi lần quét QR đúng hạn được cộng +2 điểm • Quá hạn 15 phút không nhận phòng bị trừ -10 điểm
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trustProfiles.map((profile) => (
            <div
              key={profile.userEmail}
              className={`p-4 rounded-2xl border space-y-2 text-xs ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm">{profile.fullName}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                  {profile.role}
                </span>
              </div>
              <p className="text-slate-400">{profile.userEmail}</p>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <span>
                  Đúng giờ: <strong className="text-teal-600">{profile.onTimeCheckInCount} lần</strong> • Quá hạn:{' '}
                  <strong className="text-rose-500">{profile.noShowPenaltyCount} lần</strong>
                </span>
                <span
                  className={`text-sm font-black ${
                    profile.trustScore >= 80
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-amber-600'
                  }`}
                >
                  {profile.trustScore}đ
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};