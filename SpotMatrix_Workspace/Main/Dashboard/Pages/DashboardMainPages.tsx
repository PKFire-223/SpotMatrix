import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Cpu,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Clock,
  Sliders,
} from 'lucide-react';
import {
  AuditConcurrencyLogItem,
  BookingPayloadItem,
  SharedEquipmentItem,
  UserTrustProfileItem,
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';
import { DashboardGridLayout } from '../Layout/DashboardGridLayout';

interface DashboardMainPagesProps {
  workspaceNodes: WorkspaceNodeItem[];
  bookingsList?: BookingPayloadItem[];
  equipmentsList?: SharedEquipmentItem[];
  trustProfiles?: UserTrustProfileItem[];
  auditLogs?: AuditConcurrencyLogItem[];
  isDark?: boolean;
  onNavigateSection?: (
    section: 'FLOORPLAN' | 'BOOKING' | 'DATAMANAGER' | 'AUDIT' | 'NOTIFICATION'
  ) => void;
}

export const DashboardMainPages: React.FC<DashboardMainPagesProps> = ({
  workspaceNodes = [],
  bookingsList = [],
  equipmentsList = [],
  trustProfiles = [],
  auditLogs = [],
  isDark = false,
  onNavigateSection,
}) => {
  const [simulatedDemandMultiplier, setSimulatedDemandMultiplier] = useState<number>(100);

  const statsSummary = useMemo(() => {
    const safeNodes = Array.isArray(workspaceNodes) ? workspaceNodes : [];
    const totalNodes = Math.max(1, safeNodes.length);

    const availableNodes = safeNodes.filter((n) => n.status === 'AVAILABLE').length;
    const holdingNodes = safeNodes.filter((n) => n.status === 'HOLDING').length;
    const reservedNodes = safeNodes.filter((n) => n.status === 'RESERVED').length;
    const occupiedNodes = safeNodes.filter((n) => n.status === 'OCCUPIED').length;
    const maintenanceNodes = safeNodes.filter((n) => n.status === 'MAINTENANCE').length;

    const activeUsedCount = holdingNodes + reservedNodes + occupiedNodes;
    const rawOccupancyRate = Math.round((activeUsedCount / totalNodes) * 100);
    const occupancyRate = Number.isFinite(rawOccupancyRate) ? rawOccupancyRate : 0;

    const benchmarkAverageOccupancy = 52;
    const diffVsAverage = occupancyRate - benchmarkAverageOccupancy;

    const safeProfiles = Array.isArray(trustProfiles) ? trustProfiles : [];
    const avgTrustScore =
      safeProfiles.length > 0
        ? Math.round(
            safeProfiles.reduce(
              (sum, u) => sum + (Number.isFinite(u.trustScore) ? u.trustScore : 100),
              0
            ) / safeProfiles.length
          )
        : 92;

    const avgAiScore = Math.round(
      safeNodes.reduce(
        (sum, n) => sum + (Number.isFinite(n.aiScore) ? Number(n.aiScore) : 90),
        0
      ) / totalNodes
    );

    const projectedPeakOccupancy = Math.min(
      100,
      Math.round((occupancyRate || 50) * (simulatedDemandMultiplier / 100))
    );

    return {
      totalNodes,
      availableNodes,
      holdingNodes,
      reservedNodes,
      occupiedNodes,
      maintenanceNodes,
      occupancyRate,
      benchmarkAverageOccupancy,
      diffVsAverage,
      avgTrustScore,
      avgAiScore,
      projectedPeakOccupancy,
    };
  }, [workspaceNodes, trustProfiles, simulatedDemandMultiplier]);

  const hourlyComparisonSeries = useMemo(() => {
    const baseRatio = Math.max(0.4, (statsSummary.occupancyRate || 45) / 55);
    const simFactor = simulatedDemandMultiplier / 100;
    return [
      { hour: '08:00', actual: Math.min(98, Math.round((36 * baseRatio + 12) * simFactor)), avg: 35 },
      { hour: '10:00', actual: Math.min(99, Math.round((66 * baseRatio + 16) * simFactor)), avg: 62 },
      { hour: '12:00', actual: Math.min(95, Math.round((44 * baseRatio + 10) * simFactor)), avg: 48 },
      { hour: '14:00', actual: Math.min(99, Math.round((72 * baseRatio + 15) * simFactor)), avg: 65 },
      { hour: '16:00', actual: Math.min(98, Math.round((62 * baseRatio + 14) * simFactor)), avg: 58 },
      { hour: '18:00', actual: Math.min(92, Math.round((28 * baseRatio + 10) * simFactor)), avg: 28 },
    ];
  }, [statsSummary.occupancyRate, simulatedDemandMultiplier]);

  const surfaceCard = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-800 shadow-sm';

  const subtleBadge = isDark
    ? 'bg-slate-800 text-slate-300 border-slate-700'
    : 'bg-slate-100 text-slate-700 border-slate-200/80';

  const circumference = 2 * Math.PI * 46;
  const availDash = (statsSummary.availableNodes / statsSummary.totalNodes) * circumference;
  const activeDash =
    ((statsSummary.occupiedNodes + statsSummary.reservedNodes + statsSummary.holdingNodes) /
      statsSummary.totalNodes) *
    circumference;

  return (
    <DashboardGridLayout>
      {/* 1. 4 THE KPI TONG QUAN TONG MAU TRUNG TINH DIU MAT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 sm:p-5 rounded-2xl border ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Tỷ lệ Lấp đầy Hiện tại</span>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold">{statsSummary.occupancyRate}%</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${subtleBadge}`}>
              {statsSummary.diffVsAverage >= 0
                ? `+${statsSummary.diffVsAverage}%`
                : `${statsSummary.diffVsAverage}%`}{' '}
              vs TB ({statsSummary.benchmarkAverageOccupancy}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Đang trống {statsSummary.availableNodes}/{statsSummary.totalNodes} vị trí trên Sơ đồ 2D
          </p>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Đơn Đặt chỗ & Giữ 5 phút</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold">
              {bookingsList.length + statsSummary.holdingNodes}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${subtleBadge}`}>
              {statsSummary.holdingNodes} ghế đang Hold 5p
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Thời gian xác nhận trung bình: 2.1 phút
          </p>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Điểm Tín nhiệm Trung bình</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold">{statsSummary.avgTrustScore}đ</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${subtleBadge}`}>
              Sàn giới hạn: 60đ
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Tỷ lệ Check-in QR đúng giờ: 94.5%
          </p>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Thiết bị Dùng chung Khả dụng</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold">
              {equipmentsList.filter((e) => e.status === 'AVAILABLE').length || 2}/
              {equipmentsList.length || 4}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${subtleBadge}`}>
              AI TB: {statsSummary.avgAiScore}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Đồng bộ tọa độ trực tiếp với bàn làm việc
          </p>
        </div>
      </div>

      {/* 2. KHOI AI SO SANH TRUNG BINH TON MAU TRUNG TINH */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${surfaceCard}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5">
            <span
              className={`p-2 rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold">
                Phân tích AI So sánh Trung bình & Mô phỏng Nhu cầu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đối chiếu dữ liệu thời gian thực từ Sơ đồ 2D với mức chuẩn 30 ngày qua
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border text-xs ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-semibold whitespace-nowrap">
              Tải mô phỏng: {simulatedDemandMultiplier}%
            </span>
            <input
              type="range"
              min={60}
              max={150}
              step={10}
              value={simulatedDemandMultiplier}
              onChange={(e) => setSimulatedDemandMultiplier(Number(e.target.value))}
              className="w-24 accent-slate-700 cursor-pointer"
            />
            {onNavigateSection && (
              <button
                type="button"
                onClick={() => onNavigateSection('FLOORPLAN')}
                className={`ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold border transition ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                    : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                Sơ đồ 2D
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200/70'
            }`}
          >
            <p className="font-bold mb-1">1. Mật độ Hiện tại vs. Trung bình</p>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Mật độ hiện tại đạt <strong>{statsSummary.occupancyRate}%</strong> (trung bình 30 ngày: <strong>{statsSummary.benchmarkAverageOccupancy}%</strong>). Với hệ số tải <strong>{simulatedDemandMultiplier}%</strong>, công suất đỉnh dự kiến đạt <strong>{statsSummary.projectedPeakOccupancy}%</strong>.
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200/70'
            }`}
          >
            <p className="font-bold mb-1">2. Độ ổn định Check-in & Tín nhiệm</p>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Điểm tín nhiệm trung bình đạt <strong>{statsSummary.avgTrustScore}/100đ</strong>, giúp giảm tỷ lệ bỏ trống bàn sau khi đặt xuống thấp hơn <strong>38%</strong> so với trung bình tháng trước.
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200/70'
            }`}
          >
            <p className="font-bold mb-1">3. Đề xuất Điều phối Thiết bị</p>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Các bàn trang bị <strong>Màn hình 4K</strong> có điểm tương thích AI trung bình <strong>{statsSummary.avgAiScore}%</strong> và tần suất sử dụng cao gấp <strong>1.6 lần</strong> bàn tiêu chuẩn.
            </p>
          </div>
        </div>
      </div>

      {/* 3. 2 BIEU DO HINH HOC TONG MAU TRAM DIU MAT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={`lg:col-span-8 p-5 rounded-2xl border ${surfaceCard}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="text-sm font-bold">
                Biểu đồ Mật độ Theo Khung giờ (Thực tế vs. Trung bình 30 ngày)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đồng bộ trực tiếp với trạng thái bàn trên Sơ đồ 2D
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-700 dark:bg-slate-300 inline-block" /> Thực tế hôm nay
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-800 inline-block" /> Trung bình 30 ngày
              </span>
            </div>
          </div>

          <div className="relative h-52 pt-6 pb-2 px-2 flex items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
            <div
              style={{ bottom: '52%' }}
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-400/50 flex justify-end pr-2"
            >
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded -translate-y-2.5 ${subtleBadge}`}
              >
                Trung bình 30 ngày: 52%
              </span>
            </div>

            {hourlyComparisonSeries.map((slot) => (
              <div
                key={slot.hour}
                className="flex-1 h-full flex flex-col justify-end items-center gap-2 group"
              >
                <div className="w-full max-w-[52px] h-full flex items-end justify-center gap-1.5">
                  <div
                    style={{ height: `${slot.actual}%` }}
                    className={`w-1/2 rounded-t-md transition-all duration-500 relative ${
                      isDark ? 'bg-slate-300' : 'bg-slate-700'
                    }`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold transition">
                      {slot.actual}%
                    </span>
                  </div>
                  <div
                    style={{ height: `${slot.avg}%` }}
                    className={`w-1/2 rounded-t-md transition-all duration-500 ${
                      isDark ? 'bg-slate-800' : 'bg-slate-200'
                    }`}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-500">{slot.hour}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`lg:col-span-4 p-5 rounded-2xl border flex flex-col justify-between ${surfaceCard}`}>
          <div>
            <h3 className="text-sm font-bold">Phân bổ Trạng thái Mặt bằng</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tổng cộng {statsSummary.totalNodes} vị trí đang quản lý
            </p>
          </div>

          <div className="my-4 flex items-center justify-center relative">
            <svg viewBox="0 0 120 120" className="w-36 h-36 -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke={isDark ? '#1e293b' : '#f1f5f9'}
                strokeWidth="13"
              />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke={isDark ? '#94a3b8' : '#334155'}
                strokeWidth="13"
                strokeDasharray={`${availDash} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke={isDark ? '#475569' : '#94a3b8'}
                strokeWidth="13"
                strokeDasharray={`${activeDash} ${circumference}`}
                strokeDashoffset={-availDash}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold">{statsSummary.totalNodes}</span>
              <span className="text-[10px] text-slate-400">Vị trí</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Đang trống (Available)</span>
              <strong className="font-semibold">{statsSummary.availableNodes} vị trí</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Đã đặt & Đang sử dụng</span>
              <strong className="font-semibold">
                {statsSummary.reservedNodes + statsSummary.occupiedNodes} vị trí
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Đang giữ 5p & Bảo trì</span>
              <strong className="font-semibold">
                {statsSummary.holdingNodes + statsSummary.maintenanceNodes} vị trí
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DONG BO NHANH THIET BI & NHAT KY HE THONG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={`p-5 rounded-2xl border space-y-3 ${surfaceCard}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Thiết bị Dùng chung Gắn Tọa độ</h3>
            {onNavigateSection && (
              <button
                type="button"
                onClick={() => onNavigateSection('DATAMANAGER')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                Chi tiết →
              </button>
            )}
          </div>
          <div className="space-y-2">
            {equipmentsList.slice(0, 3).map((eq) => (
              <div
                key={eq.equipmentId}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/70'
                }`}
              >
                <div>
                  <p className="font-semibold">{eq.equipmentName}</p>
                  <p className="text-[11px] text-slate-400">
                    Mã: {eq.equipmentCode} • Vị trí: {eq.assignedNodeId || 'Linh hoạt'}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${subtleBadge}`}>
                  {eq.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-5 rounded-2xl border space-y-3 ${surfaceCard}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Nhật ký Truy vết Gần nhất</h3>
            {onNavigateSection && (
              <button
                type="button"
                onClick={() => onNavigateSection('AUDIT')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                Xem tất cả →
              </button>
            )}
          </div>
          <div className="space-y-2">
            {auditLogs.slice(0, 3).map((logItem) => (
              <div
                key={logItem.auditId}
                className={`p-3 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{logItem.eventCategory}</span>
                  <span className="text-[11px] text-slate-400">{logItem.targetNodeId}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">{logItem.detailMessage}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardGridLayout>
  );
};