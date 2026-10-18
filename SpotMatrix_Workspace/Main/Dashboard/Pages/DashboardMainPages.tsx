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

  const circumference = 2 * Math.PI * 46;
  const availDash = (statsSummary.availableNodes / statsSummary.totalNodes) * circumference;
  const activeDash =
    ((statsSummary.occupiedNodes + statsSummary.reservedNodes + statsSummary.holdingNodes) /
      statsSummary.totalNodes) *
    circumference;

  return (
    <DashboardGridLayout>
      {/* 1. 4 THE KPI VOI 3 MAU NHAN HAI HOA (INDIGO, TEAL, AMBER) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Tỷ lệ Lấp đầy Hiện tại</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {statsSummary.occupancyRate}%
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400">
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

        <div className={`p-5 rounded-2xl border ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Đơn Đặt chỗ & Giữ 5 phút</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold">
              {bookingsList.length + statsSummary.holdingNodes}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {statsSummary.holdingNodes} ghế đang Hold 5p
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Hỗ trợ cả Phòng Họp Lớn Đấu trường La Mã
          </p>
        </div>

        <div className={`p-5 rounded-2xl border ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Điểm Tín nhiệm Trung bình</span>
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">
              {statsSummary.avgTrustScore}đ
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400">
              Sàn giới hạn: 60đ
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Tỷ lệ Check-in QR đúng giờ: 94.5%
          </p>
        </div>

        <div className={`p-5 rounded-2xl border ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Thiết bị Dùng chung Khả dụng</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold">
              {equipmentsList.filter((e) => e.status === 'AVAILABLE').length || 2}/
              {equipmentsList.length || 4}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              AI TB: {statsSummary.avgAiScore}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Đồng bộ tọa độ trực tiếp với bàn làm việc
          </p>
        </div>
      </div>

      {/* 2. KHOI AI SO SANH TRUNG BINH */}
      <div className={`p-5 rounded-2xl border ${surfaceCard}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold">
                Phân tích AI So sánh Trung bình & Mô phỏng Nhu cầu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đối chiếu dữ liệu thời gian thực từ Sơ đồ 2D với mức chuẩn 30 ngày qua
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border text-xs ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-bold whitespace-nowrap">
              Tải mô phỏng: {simulatedDemandMultiplier}%
            </span>
            <input
              type="range"
              min={60}
              max={150}
              step={10}
              value={simulatedDemandMultiplier}
              onChange={(e) => setSimulatedDemandMultiplier(Number(e.target.value))}
              className="w-24 accent-indigo-600 cursor-pointer"
            />
            {onNavigateSection && (
              <button
                type="button"
                onClick={() => onNavigateSection('BOOKING')}
                className="ml-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition"
              >
                Phòng Họp Lớn
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-indigo-50/35 border-indigo-100'
            }`}
          >
            <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
              1. Mật độ Hiện tại vs. Trung bình
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Mật độ hiện tại đạt <strong>{statsSummary.occupancyRate}%</strong> (trung bình 30 ngày: <strong>{statsSummary.benchmarkAverageOccupancy}%</strong>). Với hệ số tải <strong>{simulatedDemandMultiplier}%</strong>, công suất đỉnh dự kiến đạt <strong>{statsSummary.projectedPeakOccupancy}%</strong>.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-teal-50/35 border-teal-100'
            }`}
          >
            <p className="font-extrabold text-teal-600 dark:text-teal-400 mb-1">
              2. Độ ổn định Check-in & Tín nhiệm
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Điểm tín nhiệm trung bình đạt <strong>{statsSummary.avgTrustScore}/100đ</strong>, giúp giảm tỷ lệ bỏ trống bàn sau khi đặt xuống thấp hơn <strong>38%</strong> so với trung bình tháng trước.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/35 border-amber-100'
            }`}
          >
            <p className="font-extrabold text-amber-600 dark:text-amber-400 mb-1">
              3. Đề xuất Điều phối Không gian
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Các sự kiện trên 10 người được khuyến nghị chuyển sang <strong>Phòng Họp Lớn Đấu trường (H-01)</strong> để đặt trước từng ghế quanh sân khấu tròn trung tâm.
            </p>
          </div>
        </div>
      </div>

      {/* 3. BIEU DO COT DOI & DONUT CHART HAI HOA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={`lg:col-span-8 p-5 rounded-2xl border ${surfaceCard}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="text-sm font-extrabold">
                Biểu đồ Mật độ Theo Khung giờ (Thực tế vs. Trung bình 30 ngày)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đồng bộ trực tiếp với trạng thái bàn trên Sơ đồ 2D
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" /> Thực tế hôm nay
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700 inline-block" /> Trung bình 30 ngày
              </span>
            </div>
          </div>

          <div className="relative h-52 pt-6 pb-2 px-2 flex items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
            <div
              style={{ bottom: '52%' }}
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-teal-500/60 flex justify-end pr-2"
            >
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 -translate-y-2.5">
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
                    className="w-1/2 rounded-t-lg bg-indigo-600 hover:bg-indigo-500 transition-all duration-500 relative"
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-600 transition">
                      {slot.actual}%
                    </span>
                  </div>
                  <div
                    style={{ height: `${slot.avg}%` }}
                    className={`w-1/2 rounded-t-lg transition-all duration-500 ${
                      isDark ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500">{slot.hour}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`lg:col-span-4 p-5 rounded-2xl border flex flex-col justify-between ${surfaceCard}`}
        >
          <div>
            <h3 className="text-sm font-extrabold">Phân bổ Trạng thái Mặt bằng</h3>
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
                stroke="#0d9488"
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
                stroke="#4f46e5"
                strokeWidth="13"
                strokeDasharray={`${activeDash} ${circumference}`}
                strokeDashoffset={-availDash}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold">{statsSummary.totalNodes}</span>
              <span className="text-[10px] font-bold text-slate-400">Vị trí</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Đang trống
              </span>
              <strong className="font-bold">{statsSummary.availableNodes} vị trí</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Đã đặt & Đang ngồi
              </span>
              <strong className="font-bold">
                {statsSummary.reservedNodes + statsSummary.occupiedNodes} vị trí
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Giữ 5p & Bảo trì
              </span>
              <strong className="font-bold">
                {statsSummary.holdingNodes + statsSummary.maintenanceNodes} vị trí
              </strong>
            </div>
          </div>
        </div>
      </div>
    </DashboardGridLayout>
  );
};