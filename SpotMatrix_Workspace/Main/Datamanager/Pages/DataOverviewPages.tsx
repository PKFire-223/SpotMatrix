import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Cpu,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sliders,
} from 'lucide-react';
import {
  AuditConcurrencyLogItem,
  BookingPayloadItem,
  SharedEquipmentItem,
  UserTrustProfileItem,
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';

interface DataOverviewPagesProps {
  workspaceNodes: WorkspaceNodeItem[];
  bookingsList?: BookingPayloadItem[];
  equipmentsList?: SharedEquipmentItem[];
  trustProfiles?: UserTrustProfileItem[];
  auditLogs?: AuditConcurrencyLogItem[];
  isDark?: boolean;
  onNavigateSection?: (section: 'FLOORPLAN' | 'BOOKING' | 'DATAMANAGER' | 'AUDIT') => void;
}

export const DataOverviewPages: React.FC<DataOverviewPagesProps> = ({
  workspaceNodes = [],
  bookingsList = [],
  equipmentsList = [],
  trustProfiles = [],
  auditLogs = [],
  isDark = false,
  onNavigateSection,
}) => {
  // Thanh truot Mo phong AI What-If (Gia lap tang/giam nhu cau nhan su di lam tu 60% -> 150%)
  const [simulatedDemandMultiplier, setSimulatedDemandMultiplier] = useState<number>(100);

  // Tinh toan so lieu an toan (Co lop chan NaN & chia cho 0)
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
      {
        hour: '08:00',
        actual: Math.min(98, Math.round((36 * baseRatio + 12) * simFactor)),
        avg: 35,
      },
      {
        hour: '10:00',
        actual: Math.min(99, Math.round((66 * baseRatio + 16) * simFactor)),
        avg: 62,
      },
      {
        hour: '12:00',
        actual: Math.min(95, Math.round((44 * baseRatio + 10) * simFactor)),
        avg: 48,
      },
      {
        hour: '14:00',
        actual: Math.min(99, Math.round((72 * baseRatio + 15) * simFactor)),
        avg: 65,
      },
      {
        hour: '16:00',
        actual: Math.min(98, Math.round((62 * baseRatio + 14) * simFactor)),
        avg: 58,
      },
      {
        hour: '18:00',
        actual: Math.min(92, Math.round((28 * baseRatio + 10) * simFactor)),
        avg: 28,
      },
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
    <div className="space-y-5">
      {/* 1. 4 THE KPI CHINH DONG BO TRUC TIEP VOI SO DO 2D */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Tỷ lệ Lấp đầy Hiện tại</span>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black">{statsSummary.occupancyRate}%</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                statsSummary.diffVsAverage >= 0
                  ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                  : 'bg-slate-500/10 text-slate-500'
              }`}
            >
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

        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Đơn Đặt chỗ & Giữ 5 phút</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black">
              {bookingsList.length + statsSummary.holdingNodes}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {statsSummary.holdingNodes} ghế đang Hold 5p
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Thời gian xác nhận trung bình: 2.1 phút (Giới hạn: 5.0 phút)
          </p>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Điểm Tín nhiệm Trung bình</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black">{statsSummary.avgTrustScore}đ</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400">
              An toàn (+{Math.max(0, statsSummary.avgTrustScore - 60)}đ)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Ngưỡng khóa đặt lịch định kỳ: 60đ • Tỷ lệ đúng giờ: 94.5%
          </p>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${surfaceCard}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Thiết bị Dùng chung Khả dụng</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black">
              {equipmentsList.filter((e) => e.status === 'AVAILABLE').length || 2}/
              {equipmentsList.length || 4}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              AI Match TB: {statsSummary.avgAiScore}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Đồng bộ tọa độ trực tiếp với bàn làm việc & phòng họp
          </p>
        </div>
      </div>

      {/* 2. KHOI AI SO SANH TRUNG BINH & THANH TRUOT MO PHONG TAI "WHAT-IF" */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark
            ? 'bg-slate-900/95 border-blue-500/30'
            : 'bg-gradient-to-r from-slate-50 via-blue-50/40 to-teal-50/30 border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-600 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold">
                Trợ lý AI Phân tích Chuẩn Trung bình & Mô phỏng Công suất (What-If Simulator)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                So sánh dữ liệu thật từ Sơ đồ 2D với trung bình 30 ngày và dự báo tải giờ cao điểm
              </p>
            </div>
          </div>

          {/* Thanh truot Mo phong Tang/Giam Nhan su di lam */}
          <div
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border text-xs ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200/90'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-bold whitespace-nowrap">
              Mô phỏng Nhu cầu: {simulatedDemandMultiplier}%
            </span>
            <input
              type="range"
              min={60}
              max={150}
              step={10}
              value={simulatedDemandMultiplier}
              onChange={(e) => setSimulatedDemandMultiplier(Number(e.target.value))}
              className="w-24 accent-blue-600 cursor-pointer"
            />
            {onNavigateSection && (
              <button
                type="button"
                onClick={() => onNavigateSection('FLOORPLAN')}
                className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white transition"
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
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              So sánh Mật độ & Dự báo Đỉnh
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Mật độ thực tế đạt <strong>{statsSummary.occupancyRate}%</strong> (chuẩn trung bình 30 ngày: <strong>{statsSummary.benchmarkAverageOccupancy}%</strong>). Với mức mô phỏng <strong>{simulatedDemandMultiplier}%</strong>, công suất đỉnh dự kiến đạt <strong>{statsSummary.projectedPeakOccupancy}%</strong>.
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-teal-600 dark:text-teal-400 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Hiệu quả Điểm Tín nhiệm & QR
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Điểm tín nhiệm trung bình đạt <strong>{statsSummary.avgTrustScore}/100đ</strong>, cao hơn mức sàn phạt <strong>+{Math.max(0, statsSummary.avgTrustScore - 60)}đ</strong>, giúp giảm tỷ lệ bỏ ghế trống (No-Show) xuống thấp hơn <strong>38%</strong> so với trung bình.
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Khuyến nghị Điều phối Không gian
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {statsSummary.projectedPeakOccupancy >= 85
                ? 'Cảnh báo: Công suất mô phỏng vượt 85%! AI khuyến nghị Admin mở khóa bảo trì phòng M-02 trên Tầng 2 để giải tỏa tải.'
                : `Các vị trí gắn Màn hình 4K đạt điểm tương thích AI trung bình ${statsSummary.avgAiScore}% và luôn được ưu tiên chọn sớm nhất.`}
            </p>
          </div>
        </div>
      </div>

      {/* 3. KHU VUC 2 BIEU DO HINH HOC CO HIEU UNG DONG BO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={`lg:col-span-8 p-5 rounded-2xl border ${surfaceCard}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="text-sm font-extrabold">
                Biểu đồ Mật độ Theo Khung giờ (Thực tế & Mô phỏng vs. Trung bình 30 ngày)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cột màu xanh lam tự động co giãn theo dữ liệu Sơ đồ 2D và thanh trượt mô phỏng AI
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" /> Thực tế / Dự báo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-700 inline-block" /> Trung bình 30 ngày
              </span>
            </div>
          </div>

          <div className="relative h-56 pt-6 pb-2 px-2 flex items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
            <div
              style={{ bottom: '52%' }}
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-teal-500/60 flex justify-end pr-2"
            >
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 -translate-y-2.5">
                Chuẩn TB 30 ngày: 52%
              </span>
            </div>

            {hourlyComparisonSeries.map((slot) => (
              <div
                key={slot.hour}
                className="flex-1 h-full flex flex-col justify-end items-center gap-2 group"
              >
                <div className="w-full max-w-[54px] h-full flex items-end justify-center gap-1.5">
                  <div
                    style={{ height: `${slot.actual}%` }}
                    className="w-1/2 bg-blue-600 hover:bg-blue-500 rounded-t-lg transition-all duration-500 relative"
                    title={`Thực tế ${slot.hour}: ${slot.actual}%`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600 dark:text-blue-400 transition">
                      {slot.actual}%
                    </span>
                  </div>
                  <div
                    style={{ height: `${slot.avg}%` }}
                    className={`w-1/2 rounded-t-lg transition-all duration-500 ${
                      isDark ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                    title={`Trung bình ${slot.hour}: ${slot.avg}%`}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-500">{slot.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bieu do Vong (Donut Chart) */}
        <div className={`lg:col-span-4 p-5 rounded-2xl border flex flex-col justify-between ${surfaceCard}`}>
          <div>
            <h3 className="text-sm font-extrabold">Cơ cấu Trạng thái Không gian</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đồng bộ tức thì từ {statsSummary.totalNodes} vị trí trên Sơ đồ 2D
            </p>
          </div>

          <div className="my-4 flex items-center justify-center relative">
            <svg viewBox="0 0 120 120" className="w-40 h-40 -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke={isDark ? '#1e293b' : '#f1f5f9'}
                strokeWidth="14"
              />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="#0d9488"
                strokeWidth="14"
                strokeDasharray={`${availDash} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="#2563eb"
                strokeWidth="14"
                strokeDasharray={`${activeDash} ${circumference}`}
                strokeDashoffset={-availDash}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black">{statsSummary.totalNodes}</span>
              <span className="text-[10px] font-bold uppercase text-slate-400">Tổng vị trí</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Đang trống (Available)
              </span>
              <strong className="font-bold">{statsSummary.availableNodes} vị trí</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Đã đặt & Đang ngồi
              </span>
              <strong className="font-bold">
                {statsSummary.reservedNodes + statsSummary.occupiedNodes} vị trí
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Đang giữ 5p & Bảo trì
              </span>
              <strong className="font-bold">
                {statsSummary.holdingNodes + statsSummary.maintenanceNodes} vị trí
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BANG DONG BO NHANH: THIET BI DUNG CHUNG & NHAT KY AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={`p-5 rounded-2xl border space-y-3 ${surfaceCard}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Trạng thái Thiết bị Dùng chung theo Tọa độ
            </h3>
            {onNavigateSection && (
              <button
                type="button"
                onClick={() => onNavigateSection('DATAMANAGER')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Xem toàn bộ →
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(equipmentsList.length > 0
              ? equipmentsList.slice(0, 3)
              : [
                  {
                    equipmentId: 'EQ-4K-01',
                    equipmentCode: 'MON-4K-01',
                    equipmentName: 'Màn hình phụ Dell UltraSharp 4K 27"',
                    assignedNodeId: 'NODE-A01',
                    status: 'AVAILABLE',
                  },
                  {
                    equipmentId: 'EQ-WACOM-02',
                    equipmentCode: 'WAC-PRO-02',
                    equipmentName: 'Bảng vẽ Wacom Cintiq Pro 16',
                    assignedNodeId: 'NODE-A02',
                    status: 'IN_USE',
                  },
                  {
                    equipmentId: 'EQ-PROJ-03',
                    equipmentCode: 'PRJ-LASER-03',
                    equipmentName: 'Máy chiếu di động Sony Laser 4K',
                    assignedNodeId: 'NODE-M01',
                    status: 'AVAILABLE',
                  },
                ]
            ).map((eq) => (
              <div
                key={eq.equipmentId}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/70'
                }`}
              >
                <div>
                  <p className="font-bold">{eq.equipmentName}</p>
                  <p className="text-[11px] text-slate-400">
                    Mã: {eq.equipmentCode} • Gắn tại: {eq.assignedNodeId || 'Linh hoạt'}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-md font-bold text-[11px] ${
                    eq.status === 'AVAILABLE'
                      ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                      : eq.status === 'IN_USE'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {eq.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-5 rounded-2xl border space-y-3 ${surfaceCard}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Nhật ký Đồng bộ & Truy vết Thời gian thực (Audit Logs)
            </h3>
            {onNavigateSection && (
              <button
                type="button"
                onClick={() => onNavigateSection('AUDIT')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Chi tiết nhật ký →
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(auditLogs.length > 0
              ? auditLogs.slice(0, 3)
              : [
                  {
                    auditId: 'AUD-1',
                    eventCategory: 'OPTIMISTIC_LOCK_REJECTED',
                    targetNodeId: 'NODE-A01',
                    detailMessage:
                      'Từ chối giữ chỗ do xung đột Optimistic Lock (chênh lệch 18ms).',
                  },
                  {
                    auditId: 'AUD-2',
                    eventCategory: 'AUTO_RELEASE_NO_SHOW',
                    targetNodeId: 'NODE-F01',
                    detailMessage:
                      'Tự động thu hồi ghế F-01 sau 15 phút quá hạn Check-in QR (-10đ).',
                  },
                ]
            ).map((logItem) => (
              <div
                key={logItem.auditId}
                className={`p-3 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">
                    {logItem.eventCategory}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {logItem.targetNodeId}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{logItem.detailMessage}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};