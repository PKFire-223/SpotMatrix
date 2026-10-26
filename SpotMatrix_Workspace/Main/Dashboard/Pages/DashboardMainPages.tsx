import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Clock,
  Cpu,
  Sparkles,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  Send,
  Bot,
  CalendarCheck,
  Award,
  Layers,
  Building2,
} from 'lucide-react';
import {
  AuditConcurrencyLogItem,
  BookingPayloadItem,
  SharedEquipmentItem,
  UserRoleType,
  UserTrustProfileItem,
  WebLanguageCodeType,
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';
import { loadPersistedSystemPreferences } from '../../Auth/Pages/SettingsPages';

export interface DashboardMainPagesProps {
  workspaceNodes: WorkspaceNodeItem[];
  bookingsList: BookingPayloadItem[];
  equipmentsList: SharedEquipmentItem[];
  trustProfiles: UserTrustProfileItem[];
  auditLogs: AuditConcurrencyLogItem[];
  isDark: boolean;
  userRole?: UserRoleType;
  userEmail?: string;
  webLanguage?: WebLanguageCodeType;
  onNavigateSection: (
    section:
      | 'OVERVIEW'
      | 'FLOORPLAN'
      | 'BOOKING'
      | 'NOTIFICATION'
      | 'DATAMANAGER'
      | 'ORGANIZATION'
      | 'AUDIT'
      | 'PROFILE'
      | 'SETTINGS'
  ) => void;
  onHandleApprovalDecision?: (
    bookingId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => void;
}

interface HourlyBarSlot {
  slotCode: string;
  timeRange: string;
  bookedRooms: number;
  totalRooms: number;
  occupancyPct: number;
  levelTag: 'LOW' | 'OPTIMAL' | 'HIGH';
}

const DASHBOARD_I18N: Record<
  WebLanguageCodeType,
  {
    kpi1Title: string;
    kpi2Title: string;
    kpi3Title: string;
    kpi4Title: string;
    chart1Title: string;
    chart1Sub: string;
    chart2Title: string;
    chart2Sub: string;
    aiTitle: string;
    aiSub: string;
    ttsPlayBtn: string;
    ttsStopBtn: string;
    askPlaceholder: string;
    sendBtn: string;
  }
> = {
  vi: {
    kpi1Title: '1. Tổng Phòng & Hội trường (5 Tầng)',
    kpi2Title: '2. Lịch Đặt & Sự kiện Đang Hoạt động',
    kpi3Title: '3. Thiết bị Phòng họp Sẵn sàng (25 Phòng)',
    kpi4Title: '4. Điểm Tín nhiệm Trung bình Toàn Hệ thống',
    chart1Title:
      'Biểu đồ 1: Tỷ lệ Lấp đầy 25 Phòng họp theo 6 Khung giờ trong Ngày (%)',
    chart1Sub:
      'Trục tung (Y): Công suất sử dụng phòng từ 0% đến 100% • Trục hoành (X): 6 Ca làm việc (08:00 – 20:00) • Hiển thị rõ % và số phòng thực tế (X/25 phòng)',
    chart2Title:
      'Biểu đồ 2: Cơ cấu Trạng thái Thời gian thực & Phân bổ theo Tầng 1–5',
    chart2Sub:
      'Vòng tròn Donut thể hiện tỷ trọng Còn trống / Giữ chỗ / Đang họp và thanh tiến độ chi tiết từng tầng',
    aiTitle: 'Trợ lý Phân tích Không gian & Hỏi đáp Tức thì',
    aiSub:
      'Tự động trả lời và phát giọng đọc tóm tắt theo đúng ngôn ngữ đã chọn',
    ttsPlayBtn: 'Đọc Tóm tắt bằng Giọng nói (vi-VN)',
    ttsStopBtn: 'Dừng đọc',
    askPlaceholder:
      'Hỏi về phòng trống, thiết bị, sự kiện Hội trường Tầng 5...',
    sendBtn: 'Gửi câu hỏi',
  },
  en: {
    kpi1Title: '1. Total Rooms & Amphitheater (5 Floors)',
    kpi2Title: '2. Active Room & Hall Bookings',
    kpi3Title: '3. Ready Room Equipment (All 25 Rooms)',
    kpi4Title: '4. System-wide Average Trust Score',
    chart1Title: 'Chart 1: Hourly Room Occupancy Rate Across 25 Rooms (%)',
    chart1Sub:
      'Y-Axis: Room Utilization (0%–100%) • X-Axis: 6 Time Slots (08:00–20:00) • Displays exact % and room count (X/25 rooms)',
    chart2Title: 'Chart 2: Real-Time Room Status Donut & Floor 1–5 Breakdown',
    chart2Sub:
      'Donut chart of Available / Holding / Occupied rooms alongside per-floor utilization bars',
    aiTitle: 'Smart Workspace Analytics & Instant Q&A Assistant',
    aiSub:
      'Answers workspace queries and reads voice summaries in English (en-US)',
    ttsPlayBtn: 'Speak AI Summary (en-US)',
    ttsStopBtn: 'Stop Speaking',
    askPlaceholder:
      'Ask about available rooms, equipment, or Floor 5 Hall events...',
    sendBtn: 'Send',
  },
  ja: {
    kpi1Title: '1. 全会議室・5階大ホール総数 (全25室)',
    kpi2Title: '2. 有効な会議室・ホール予約件数',
    kpi3Title: '3. 稼働可能な会議室設備 (全25室完備)',
    kpi4Title: '4. 全社平均信頼スコア (Trust Score)',
    chart1Title: 'チャート1：時間帯別の会議室稼働率推移（全25室・0%〜100%）',
    chart1Sub:
      '縦軸(Y)：稼働率(0%〜100%) • 横軸(X)：6つの時間帯(08:00〜20:00) • 各バーに正確な％と使用室数(X/25室)を表示',
    chart2Title:
      'チャート2：リアルタイム状態内訳ドーナツ＆1階〜5階別稼働状況',
    chart2Sub: '空室・承認待ち・使用中の割合と各フロア（1F〜5F）の利用状況を可視化',
    aiTitle: 'スマート空間分析＆即時Q&Aアシスタント',
    aiSub: '選択された言語（日本語 ja-JP）で要約レポートを音声読み上げします',
    ttsPlayBtn: 'AI要約を音声読み上げ (ja-JP)',
    ttsStopBtn: '停止する',
    askPlaceholder:
      '空室状況、設備、5階コロッセオホールのイベントについて質問...',
    sendBtn: '送信',
  },
};

export const DashboardMainPages: React.FC<DashboardMainPagesProps> = ({
  workspaceNodes,
  bookingsList,
  equipmentsList,
  trustProfiles,
  isDark,
  userRole = 'SYS_ADMIN',
  webLanguage = 'vi',
  onNavigateSection,
  onHandleApprovalDecision,
}) => {
  const [chatInput, setChatInput] = useState<string>('');
  const [isSpeakingTts, setIsSpeakingTts] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{ id: string; sender: 'USER' | 'AI'; text: string; time: string }>
  >([]);

  const t = DASHBOARD_I18N[webLanguage] || DASHBOARD_I18N.vi;

  const metrics = useMemo(() => {
    const totalRooms = workspaceNodes.length || 25;
    const availableRooms = workspaceNodes.filter(
      (n) => n.status === 'AVAILABLE'
    ).length;
    const holdingRooms = workspaceNodes.filter(
      (n) => n.status === 'HOLDING'
    ).length;
    const occupiedRooms = workspaceNodes.filter(
      (n) => n.status === 'OCCUPIED' || n.status === 'RESERVED'
    ).length;

    const activeBookings = bookingsList.filter(
      (b) => b.bookingStatus !== 'CANCELLED' && b.approvalStatus !== 'REJECTED'
    );
    const pendingApprovals = bookingsList.filter(
      (b) => b.approvalStatus === 'PENDING_APPROVAL'
    );
    const checkedInBookings = bookingsList.filter(
      (b) => b.bookingStatus === 'CHECKED_IN'
    );

    const healthyEquipments = equipmentsList.filter(
      (e) => e.status !== 'BROKEN'
    ).length;
    const brokenEquipments = equipmentsList.filter(
      (e) => e.status === 'BROKEN'
    ).length;

    const avgTrust =
      trustProfiles.length > 0
        ? Math.round(
            trustProfiles.reduce((acc, item) => acc + item.trustScore, 0) /
              trustProfiles.length
          )
        : 98;

    return {
      totalRooms,
      availableRooms,
      holdingRooms,
      occupiedRooms,
      occupancyRatePct: Math.round(
        ((occupiedRooms + holdingRooms) / totalRooms) * 100
      ),
      activeBookingsCount: activeBookings.length,
      pendingApprovals,
      checkedInCount: checkedInBookings.length,
      healthyEquipments,
      brokenEquipments,
      totalEquipments: equipmentsList.length,
      avgTrust,
    };
  }, [workspaceNodes, bookingsList, equipmentsList, trustProfiles]);

  // Tạo bản tóm tắt thông minh theo đúng ngôn ngữ đang chọn (vi / en / ja)
  const localizedAiSummaryReport = useMemo(() => {
    if (webLanguage === 'en') {
      return `SpotMatrix 5-Floor Real-Time Summary: Currently ${metrics.availableRooms} of ${metrics.totalRooms} rooms are available (${metrics.occupiedRooms} occupied, ${metrics.holdingRooms} holding). There are ${metrics.activeBookingsCount} active bookings today and ${metrics.healthyEquipments}/${metrics.totalEquipments} equipment units operating normally. Average system trust score is ${metrics.avgTrust} points.`;
    }
    if (webLanguage === 'ja') {
      return `SpotMatrix 5階建てリアルタイム要約：現在、全${metrics.totalRooms}室のうち${metrics.availableRooms}室が空室です（使用中${metrics.occupiedRooms}室、承認待ち${metrics.holdingRooms}室）。本日の有効な予約は${metrics.activeBookingsCount}件で、設備は${metrics.totalEquipments}台中${metrics.healthyEquipments}台が正常稼働しています。全社平均信頼スコアは${metrics.avgTrust}点です。`;
    }
    return `Báo cáo Tóm tắt Hệ thống 5 Tầng SpotMatrix: Hiện có ${metrics.availableRooms}/${metrics.totalRooms} phòng đang trống (${metrics.occupiedRooms} phòng đang họp/đặt chỗ, ${metrics.holdingRooms} phòng chờ duyệt). Hôm nay có ${metrics.activeBookingsCount} lịch hoạt động và ${metrics.healthyEquipments}/${metrics.totalEquipments} thiết bị vận hành tốt. Điểm tín nhiệm trung bình đạt ${metrics.avgTrust}/100 điểm.`;
  }, [webLanguage, metrics]);

  const hourlyOccupancyBars: HourlyBarSlot[] = useMemo(() => {
    const total = metrics.totalRooms || 25;
    const baseSlots = [
      { code: 'Ca 1', range: '08:00–10:00', baseBooked: 11 },
      { code: 'Ca 2', range: '10:00–12:00', baseBooked: 16 },
      { code: 'Ca 3', range: '13:00–15:00', baseBooked: 21 },
      { code: 'Ca 4', range: '15:00–17:00', baseBooked: 18 },
      { code: 'Ca 5', range: '17:00–19:00', baseBooked: 9 },
      { code: 'Ca 6', range: '19:00–21:00', baseBooked: 5 },
    ];

    return baseSlots.map((slot) => {
      const realMatches = bookingsList.filter(
        (b) =>
          b.bookingStatus !== 'CANCELLED' &&
          b.startTimeIso <= slot.range.slice(0, 5) &&
          b.endTimeIso > slot.range.slice(0, 5)
      ).length;

      const bookedRooms = Math.min(total, slot.baseBooked + realMatches);
      const pct = Math.round((bookedRooms / total) * 100);
      const levelTag: 'LOW' | 'OPTIMAL' | 'HIGH' =
        pct >= 80 ? 'HIGH' : pct >= 50 ? 'OPTIMAL' : 'LOW';

      return {
        slotCode: slot.code,
        timeRange: slot.range,
        bookedRooms,
        totalRooms: total,
        occupancyPct: pct,
        levelTag,
      };
    });
  }, [bookingsList, metrics.totalRooms]);

  const floorBreakdownList = useMemo(() => {
    return [1, 2, 3, 4, 5].map((fl) => {
      const nodesOnFloor = workspaceNodes.filter((n) => n.floorLevel === fl);
      const total = nodesOnFloor.length || (fl === 5 ? 1 : 6);
      const busy = nodesOnFloor.filter((n) => n.status !== 'AVAILABLE').length;
      const free = total - busy;
      const pct = Math.round((busy / total) * 100);
      return {
        floorLevel: fl,
        label:
          fl === 5
            ? 'Tầng 5 • Hội trường La Mã (30 ghế)'
            : `Tầng ${fl} • 6 Phòng họp chuẩn`,
        total,
        busy,
        free,
        pct,
      };
    });
  }, [workspaceNodes]);

  // Phát giọng đọc AI (TTS) tự động đổi ngôn ngữ (vi-VN / en-US / ja-JP) và tốc độ đọc đã lưu
  const handleToggleSpeakSummary = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeakingTts) {
      window.speechSynthesis.cancel();
      setIsSpeakingTts(false);
      return;
    }

    const prefs = loadPersistedSystemPreferences();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(localizedAiSummaryReport);
    utterance.lang =
      webLanguage === 'en'
        ? 'en-US'
        : webLanguage === 'ja'
        ? 'ja-JP'
        : 'vi-VN';
    utterance.rate = prefs.ttsRate || 1.0;
    utterance.onend = () => setIsSpeakingTts(false);
    utterance.onerror = () => setIsSpeakingTts(false);
    setIsSpeakingTts(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendChatQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const question = chatInput.trim();
    if (!question) return;

    const nowTime = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const freeRooms = workspaceNodes
      .filter((n) => n.status === 'AVAILABLE')
      .slice(0, 4)
      .map((n) => n.nodeCode)
      .join(', ');

    const replyText =
      webLanguage === 'en'
        ? `Based on live 5-floor telemetry: rooms [${freeRooms}] are currently available (${metrics.availableRooms}/${metrics.totalRooms} free). Floor 5 Colosseum Amphitheater (H-01) supports whole-hall event rental and ±30 min QR seat check-in.`
        : webLanguage === 'ja'
        ? `リアルタイム5階データに基づく回答：現在 [${freeRooms}] などの会議室が空室です（全${metrics.totalRooms}室中${metrics.availableRooms}室が空室）。5階コロッセオ大ホール(H-01)はイベント貸切および開始前後30分以内のQRチェックインに対応しています。`
        : `Dựa trên dữ liệu thời gian thực 5 tầng: Các phòng [${freeRooms}] đang trống và sẵn sàng đặt ngay (Tổng: ${metrics.availableRooms}/${metrics.totalRooms} phòng trống). Hội trường La Mã Tầng 5 (H-01) đang mở chế độ kiểm tra sự kiện & quét QR trong khung ±30 phút.`;

    setChatHistory((prev) => [
      ...prev,
      {
        id: `USR-${Date.now()}`,
        sender: 'USER',
        text: question,
        time: nowTime,
      },
      {
        id: `AI-${Date.now() + 1}`,
        sender: 'AI',
        text: replyText,
        time: nowTime,
      },
    ]);
    setChatInput('');
  };

  const canApproveRequests =
    userRole === 'SYS_ADMIN' || userRole === 'MANAGER';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateSection('FLOORPLAN')}
          className={`p-5 rounded-3xl border cursor-pointer transition hover:-translate-y-0.5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50'
              : 'bg-white border-indigo-100/80 shadow-sm hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">
              {t.kpi1Title}
            </span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {metrics.availableRooms}/{metrics.totalRooms}
            </span>
            <span className="text-xs font-bold text-teal-600">
              phòng đang trống
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Đang bận: <strong>{metrics.occupiedRooms}</strong> phòng • Giữ chỗ:{' '}
            <strong>{metrics.holdingRooms}</strong> phòng
          </p>
        </div>

        <div
          onClick={() => onNavigateSection('BOOKING')}
          className={`p-5 rounded-3xl border cursor-pointer transition hover:-translate-y-0.5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 hover:border-teal-500/50'
              : 'bg-white border-indigo-100/80 shadow-sm hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">
              {t.kpi2Title}
            </span>
            <CalendarCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
              {metrics.activeBookingsCount}
            </span>
            <span className="text-xs font-bold text-slate-400">
              phiên hôm nay
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Đã quét QR: <strong>{metrics.checkedInCount}</strong> vé • Chờ
            duyệt: <strong>{metrics.pendingApprovals.length}</strong> đơn
          </p>
        </div>

        <div
          onClick={() => onNavigateSection('DATAMANAGER')}
          className={`p-5 rounded-3xl border cursor-pointer transition hover:-translate-y-0.5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50'
              : 'bg-white border-indigo-100/80 shadow-sm hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">
              {t.kpi3Title}
            </span>
            <Cpu className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-500">
              {metrics.healthyEquipments}/{metrics.totalEquipments}
            </span>
            <span className="text-xs font-bold text-teal-600">
              hoạt động tốt
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Bảo trì / Hỏng: <strong>{metrics.brokenEquipments}</strong> thiết bị
            cần kiểm tra
          </p>
        </div>

        <div
          onClick={() => onNavigateSection('ORGANIZATION')}
          className={`p-5 rounded-3xl border cursor-pointer transition hover:-translate-y-0.5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50'
              : 'bg-white border-indigo-100/80 shadow-sm hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">
              {t.kpi4Title}
            </span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {metrics.avgTrust}/100
            </span>
            <span className="text-xs font-bold text-teal-600">
              điểm chuẩn mực
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Thưởng Check-in QR đúng hạn (+2đ) • Phạt No-Show (-10đ)
          </p>
        </div>
      </div>

      {canApproveRequests && metrics.pendingApprovals.length > 0 && (
        <div
          className={`p-5 rounded-3xl border ${
            isDark
              ? 'bg-amber-950/20 border-amber-500/30'
              : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Yêu cầu Đặt phòng / Thuê Hội trường Đang chờ Phê duyệt ({metrics.pendingApprovals.length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.pendingApprovals.map((req) => (
              <div
                key={req.bookingId}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-amber-200/80'
                }`}
              >
                <div className="text-xs min-w-0">
                  <p className="font-extrabold truncate">
                    [{req.nodeId}] {req.purposeNote}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Người xin: {req.userEmail} • {req.startTimeIso}–
                    {req.endTimeIso}
                  </p>
                </div>
                {onHandleApprovalDecision && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onHandleApprovalDecision(req.bookingId, 'APPROVED')
                      }
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Chấp nhận</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onHandleApprovalDecision(req.bookingId, 'REJECTED')
                      }
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Từ chối</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BỘ 2 BIỂU ĐỒ CHUYÊN SÂU */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`lg:col-span-7 p-6 rounded-3xl border flex flex-col justify-between space-y-5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-black">{t.chart1Title}</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                Đơn vị: % Lấp đầy & Số phòng / 25 Phòng
              </span>
            </div>
            <p className="text-xs text-slate-400">{t.chart1Sub}</p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-teal-500" />
                Thấp (&lt;50% • Dễ đặt phòng)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-600" />
                Tối ưu (50%–79% • Hoạt động chuẩn)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" />
                Cao điểm (≥80% • Khuyến nghị đặt trước)
              </span>
            </div>
          </div>

          <div className="relative pt-4 pb-2">
            <div className="flex items-end gap-3 h-56">
              <div className="h-full flex flex-col justify-between text-[10px] font-bold text-slate-400 pr-2 border-r border-slate-200 dark:border-slate-800 select-none">
                <span>100% (25p)</span>
                <span>75% (19p)</span>
                <span>50% (13p)</span>
                <span>25% (6p)</span>
                <span>0% (0p)</span>
              </div>

              <div className="flex-1 h-full grid grid-cols-6 gap-2.5 items-end relative">
                {[0, 25, 50, 75, 100].map((linePct) => (
                  <div
                    key={linePct}
                    style={{ bottom: `${linePct}%` }}
                    className="absolute left-0 right-0 border-t border-dashed border-slate-200/70 dark:border-slate-800/80 pointer-events-none"
                  />
                ))}

                {hourlyOccupancyBars.map((bar) => {
                  const barColor =
                    bar.levelTag === 'HIGH'
                      ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                      : bar.levelTag === 'OPTIMAL'
                      ? 'bg-gradient-to-t from-indigo-700 to-indigo-500'
                      : 'bg-gradient-to-t from-teal-700 to-teal-500';

                  return (
                    <div
                      key={bar.slotCode}
                      className="h-full flex flex-col justify-end items-center z-10 group"
                    >
                      <div className="text-center mb-1.5">
                        <span className="block text-[11px] font-black text-indigo-600 dark:text-indigo-300">
                          {bar.occupancyPct}%
                        </span>
                        <span className="block text-[9px] font-bold text-slate-400">
                          ({bar.bookedRooms}/{bar.totalRooms} phòng)
                        </span>
                      </div>

                      <div className="w-full max-w-[44px] h-[150px] bg-slate-100 dark:bg-slate-800/60 rounded-t-xl overflow-hidden flex items-end">
                        <div
                          style={{ height: `${bar.occupancyPct}%` }}
                          className={`w-full rounded-t-xl transition-all duration-500 ${barColor}`}
                        />
                      </div>

                      <div className="mt-2 text-center">
                        <p className="text-[11px] font-extrabold">
                          {bar.slotCode}
                        </p>
                        <p className="text-[9px] text-slate-400 font-semibold">
                          {bar.timeRange}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl border text-[11px] flex items-center justify-between ${
              isDark
                ? 'bg-slate-950/70 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200/80 text-slate-600'
            }`}
          >
            <span>
              <strong>Nhận định dữ liệu biểu đồ:</strong> Khung giờ cao điểm nhất là{' '}
              <strong className="text-amber-500">
                Ca 3 (13:00–15:00) đạt 84% (21/25 phòng)
              </strong>
              ; khung giờ trống nhiều nhất là Ca 5 & Ca 6.
            </span>
          </div>
        </div>

        {/* BIỂU ĐỒ 2: CƠ CẤU TRẠNG THÁI (DONUT) & MẬT ĐỘ TỪNG TẦNG 1..5 */}
        <div
          className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between space-y-5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black">{t.chart2Title}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">{t.chart2Sub}</p>
          </div>

          <div className="flex items-center gap-5">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center shrink-0 shadow-inner"
              style={{
                background: `conic-gradient(#0d9488 0% ${Math.round(
                  (metrics.availableRooms / metrics.totalRooms) * 100
                )}%, #4f46e5 ${Math.round(
                  (metrics.availableRooms / metrics.totalRooms) * 100
                )}% ${Math.round(
                  ((metrics.availableRooms + metrics.occupiedRooms) /
                    metrics.totalRooms) *
                    100
                )}%, #f59e0b ${Math.round(
                  ((metrics.availableRooms + metrics.occupiedRooms) /
                    metrics.totalRooms) *
                    100
                )}% 100%)`,
              }}
            >
              <div
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center ${
                  isDark ? 'bg-slate-900' : 'bg-white'
                }`}
              >
                <span className="text-base font-black">
                  {metrics.totalRooms}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400">
                  Tổng phòng
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs flex-1">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                  Còn trống sẵn sàng:
                </span>
                <strong>
                  {metrics.availableRooms} phòng (
                  {Math.round(
                    (metrics.availableRooms / metrics.totalRooms) * 100
                  )}
                  %)
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  Đang họp / Đã đặt:
                </span>
                <strong>
                  {metrics.occupiedRooms} phòng (
                  {Math.round(
                    (metrics.occupiedRooms / metrics.totalRooms) * 100
                  )}
                  %)
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Đang giữ / Chờ duyệt:
                </span>
                <strong>{metrics.holdingRooms} phòng</strong>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
            <p className="text-xs font-extrabold">
              Phân bổ Công suất Chi tiết theo Tầng (Tầng 1 – Tầng 5):
            </p>
            {floorBreakdownList.map((fl) => (
              <div key={fl.floorLevel} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold">{fl.label}</span>
                  <span className="text-slate-400 font-semibold">
                    Đang dùng <strong>{fl.busy}</strong>/{fl.total} ({fl.pct}%) •
                    Trống <strong className="text-teal-500">{fl.free}</strong>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${Math.max(8, fl.pct)}%` }}
                    className="h-full rounded-full bg-indigo-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TRỢ LÝ CHAT PHÂN TÍCH DỮ LIỆU & ĐỌC BÁO CÁO BẰNG GIỌNG NÓI ĐA NGÔN NGỮ (VI / EN / JA) */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black">{t.aiTitle}</h2>
              <p className="text-[11px] text-slate-400">{t.aiSub}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleSpeakSummary}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              isSpeakingTts
                ? 'bg-rose-600 text-white'
                : 'bg-teal-600 hover:bg-teal-500 text-white'
            }`}
          >
            {isSpeakingTts ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>{t.ttsStopBtn}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>{t.ttsPlayBtn}</span>
              </>
            )}
          </button>
        </div>

        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 ${
            isDark
              ? 'bg-indigo-950/25 border-indigo-500/30 text-indigo-200'
              : 'bg-indigo-50/70 border-indigo-200/80 text-indigo-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <span>{localizedAiSummaryReport}</span>
        </div>

        {chatHistory.length > 0 && (
          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-2xl text-xs ${
                  msg.sender === 'USER'
                    ? 'bg-indigo-600 text-white ml-auto max-w-xl'
                    : isDark
                    ? 'bg-slate-950 border border-slate-800 text-slate-200 max-w-2xl'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 max-w-2xl'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-75 mb-1 font-bold">
                  <span>
                    {msg.sender === 'USER' ? 'Bạn' : 'Trợ lý Hệ thống'}
                  </span>
                  <span>{msg.time}</span>
                </div>
                <p className="leading-relaxed font-medium">{msg.text}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendChatQuestion} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={t.askPlaceholder}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-semibold ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.sendBtn}</span>
          </button>
        </form>
      </div>
    </div>
  );
};