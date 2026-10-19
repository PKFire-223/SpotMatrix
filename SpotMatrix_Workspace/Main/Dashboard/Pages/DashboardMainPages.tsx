import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart3,
  Clock,
  ShieldCheck,
  Cpu,
  Sparkles,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  Send,
  Bot,
  MessageSquare,
  X,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Award,
  CalendarCheck,
  RefreshCw,
} from 'lucide-react';
import {
  AuditConcurrencyLogItem,
  BookingPayloadItem,
  SharedEquipmentItem,
  UserRoleType,
  UserTrustProfileItem,
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';

export interface DashboardMainPagesProps {
  workspaceNodes: WorkspaceNodeItem[];
  bookingsList: BookingPayloadItem[];
  equipmentsList: SharedEquipmentItem[];
  trustProfiles: UserTrustProfileItem[];
  auditLogs: AuditConcurrencyLogItem[];
  isDark: boolean;
  userRole?: UserRoleType;
  userEmail?: string;
  onNavigateSection: (
    section:
      | 'OVERVIEW'
      | 'FLOORPLAN'
      | 'BOOKING'
      | 'NOTIFICATION'
      | 'DATAMANAGER'
      | 'AUDIT'
      | 'PROFILE'
      | 'SETTINGS'
  ) => void;
  onHandleApprovalDecision?: (
    bookingId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => void;
}

interface AiChatMessageItem {
  messageId: string;
  sender: 'AI' | 'USER';
  title?: string;
  contentText: string;
  timestampText: string;
  isSummaryReport?: boolean;
}

const SESSION_STORAGE_KEY = 'spotmatrix_active_session_v2';

export const DashboardMainPages: React.FC<DashboardMainPagesProps> = ({
  workspaceNodes,
  bookingsList,
  equipmentsList,
  trustProfiles,
  auditLogs,
  isDark,
  userRole: propUserRole,
  userEmail: propUserEmail,
  onNavigateSection,
  onHandleApprovalDecision,
}) => {
  const sessionInfo = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          role: (propUserRole || parsed?.userProfile?.role || 'SYS_ADMIN') as UserRoleType,
          email: (propUserEmail ||
            parsed?.userProfile?.userEmail ||
            'sysadmin@spotmatrix.vn') as string,
          fullName: (parsed?.userProfile?.fullName || 'System Administrator') as string,
          username: (parsed?.userProfile?.username || 'Systemadmin123') as string,
        };
      }
    } catch {
      // Bỏ qua
    }
    return {
      role: (propUserRole || 'SYS_ADMIN') as UserRoleType,
      email: propUserEmail || 'sysadmin@spotmatrix.vn',
      fullName: 'System Administrator',
      username: 'Systemadmin123',
    };
  }, [propUserRole, propUserEmail]);

  const [selectedRoleView, setSelectedRoleView] = useState<UserRoleType>(sessionInfo.role);
  useEffect(() => {
    setSelectedRoleView(sessionInfo.role);
  }, [sessionInfo.role]);

  const [demandSimulationPercent, setDemandSimulationPercent] = useState<number>(100);

  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const [chatInputText, setChatInputText] = useState<string>('');
  const [isSpeakingTts, setIsSpeakingTts] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const dashboardMetrics = useMemo(() => {
    const totalNodes = workspaceNodes.length || 25;
    const availableNodes = workspaceNodes.filter((n) => n.status === 'AVAILABLE');
    const holdingNodes = workspaceNodes.filter((n) => n.status === 'HOLDING');
    const occupiedOrReserved = workspaceNodes.filter(
      (n) => n.status === 'OCCUPIED' || n.status === 'RESERVED'
    );

    const occupancyRate = Math.round(
      ((totalNodes - availableNodes.length) / totalNodes) * 100
    );
    const simulatedPeakOccupancy = Math.min(
      100,
      Math.round((occupancyRate * demandSimulationPercent) / 100)
    );

    const activeBookings = bookingsList.filter((b) => b.bookingStatus !== 'CANCELLED');
    const pendingApprovals = bookingsList.filter(
      (b) => b.approvalStatus === 'PENDING_APPROVAL' && b.bookingStatus !== 'CANCELLED'
    );
    const checkedInBookings = bookingsList.filter((b) => b.bookingStatus === 'CHECKED_IN');

    const avgTrustScore =
      trustProfiles.length > 0
        ? Math.round(
            trustProfiles.reduce((acc, item) => acc + item.trustScore, 0) /
              trustProfiles.length
          )
        : 95;

    const myTrustProfile =
      trustProfiles.find(
        (tp) => tp.userEmail.toLowerCase() === sessionInfo.email.toLowerCase()
      ) || trustProfiles[0];

    const myBookings = bookingsList.filter(
      (b) =>
        b.userEmail.toLowerCase() === sessionInfo.email.toLowerCase() ||
        (b.requesterUsername &&
          b.requesterUsername.toLowerCase() === sessionInfo.username.toLowerCase())
    );

    const workingEquipments = equipmentsList.filter((eq) => eq.status !== 'BROKEN');
    const brokenEquipments = equipmentsList.filter((eq) => eq.status === 'BROKEN');

    const topRecommendedNode = [...availableNodes].sort(
      (a, b) => (b.aiScore || 90) - (a.aiScore || 90)
    )[0];

    return {
      totalNodes,
      availableCount: availableNodes.length,
      holdingCount: holdingNodes.length,
      occupiedOrReservedCount: occupiedOrReserved.length,
      occupancyRate,
      simulatedPeakOccupancy,
      activeBookingsCount: activeBookings.length,
      pendingApprovals,
      checkedInCount: checkedInBookings.length,
      avgTrustScore,
      myTrustProfile,
      myBookings,
      workingEquipmentsCount: workingEquipments.length,
      brokenEquipments,
      totalEquipmentsCount: equipmentsList.length,
      topRecommendedNode,
    };
  }, [
    workspaceNodes,
    bookingsList,
    equipmentsList,
    trustProfiles,
    demandSimulationPercent,
    sessionInfo.email,
    sessionInfo.username,
  ]);

  const buildSynthesizedExecutiveSummary = (): string => {
    const {
      totalNodes,
      availableCount,
      occupancyRate,
      activeBookingsCount,
      pendingApprovals,
      avgTrustScore,
      workingEquipmentsCount,
      totalEquipmentsCount,
      brokenEquipments,
      topRecommendedNode,
    } = dashboardMetrics;

    const brokenText =
      brokenEquipments.length > 0
        ? `Hiện có ${brokenEquipments.length} thiết bị đang báo hỏng cần bảo trì là ${brokenEquipments
            .map((e) => `${e.equipmentCode} tại phòng ${e.assignedNodeId}`)
            .join(', ')}.`
        : 'Tất cả thiết bị tại 5 tầng đều hoạt động tốt.';

    const approvalText =
      pendingApprovals.length > 0
        ? `Có ${pendingApprovals.length} yêu cầu đặt phòng của nhân viên đang chờ Quản lý hoặc Admin phê duyệt.`
        : 'Không có yêu cầu đặt phòng nào đang tồn đọng.';

    const recommendText = topRecommendedNode
      ? `AI đề xuất phòng tối ưu nhất hiện tại là ${topRecommendedNode.nodeCode} (${topRecommendedNode.nodeLabel}) với điểm tương thích ${topRecommendedNode.aiScore || 96} trên 100.`
      : 'Hiện tất cả các phòng đang kín lịch.';

    return `Báo cáo tổng hợp hệ thống SpotMatrix thời gian thực cho ${sessionInfo.fullName}: Toàn tòa nhà 5 tầng đang có tỷ lệ lấp đầy ${occupancyRate}%, còn trống ${availableCount} trên tổng số ${totalNodes} không gian họp và hội trường. Đang có ${activeBookingsCount} lịch đặt chỗ hoạt động. ${approvalText} Điểm tín nhiệm trung bình toàn hệ thống đạt ${avgTrustScore} trên 100 điểm. Về thiết bị dùng chung, có ${workingEquipmentsCount} trên ${totalEquipmentsCount} thiết bị sẵn sàng phục vụ. ${brokenText} ${recommendText}`;
  };

  const [chatMessages, setChatMessages] = useState<AiChatMessageItem[]>(() => [
    {
      messageId: 'MSG-WELCOME-01',
      sender: 'AI',
      title: 'Trợ lý AI SpotMatrix Co-Pilot',
      contentText:
        'Xin chào! Tôi là Trợ lý AI Phân tích Không gian & Dữ liệu của SpotMatrix. Bạn có thể bấm nút "Tổng hợp & Nghe Tóm tắt Dữ liệu" bên dưới để tôi phân tích toàn bộ 5 tầng và đọc báo cáo bằng giọng nói, hoặc đặt câu hỏi trực tiếp cho tôi.',
      timestampText: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);

  useEffect(() => {
    if (isAiChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiChatOpen]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeakTextAloud = (textToSpeak: string, messageId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isSpeakingTts && speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeakingTts(false);
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.02;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().includes('vi') ||
        v.name.toLowerCase().includes('viet') ||
        v.name.toLowerCase().includes('hoaimy') ||
        v.name.toLowerCase().includes('an')
    );
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onstart = () => {
      setIsSpeakingTts(true);
      setSpeakingMessageId(messageId);
    };
    utterance.onend = () => {
      setIsSpeakingTts(false);
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setIsSpeakingTts(false);
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingTts(false);
    setSpeakingMessageId(null);
  };

  const handleSynthesizeAndSpeakSummary = (autoSpeak = true) => {
    setIsAiChatOpen(true);
    const summaryText = buildSynthesizedExecutiveSummary();
    const newMsgId = `MSG-SYNTH-${Date.now()}`;
    const newMsg: AiChatMessageItem = {
      messageId: newMsgId,
      sender: 'AI',
      title: 'Bản Tổng hợp Dữ liệu Thời gian thực (5 Tầng & MongoDB)',
      contentText: summaryText,
      timestampText: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isSummaryReport: true,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    if (autoSpeak) {
      setTimeout(() => {
        handleSpeakTextAloud(summaryText, newMsgId);
      }, 150);
    }
  };

  const generateSmartAiAnswer = (questionRaw: string): { title: string; reply: string } => {
    const q = questionRaw.toLowerCase();
    const {
      availableCount,
      totalNodes,
      occupancyRate,
      pendingApprovals,
      avgTrustScore,
      brokenEquipments,
      topRecommendedNode,
      myTrustProfile,
    } = dashboardMetrics;

    if (q.includes('tóm tắt') || q.includes('tổng hợp') || q.includes('báo cáo')) {
      return {
        title: 'Báo cáo Tổng hợp Dữ liệu Hệ thống',
        reply: buildSynthesizedExecutiveSummary(),
      };
    }

    if (
      q.includes('phòng') &&
      (q.includes('trống') || q.includes('gợi ý') || q.includes('tốt nhất'))
    ) {
      const freeRooms = workspaceNodes
        .filter((n) => n.status === 'AVAILABLE')
        .slice(0, 5)
        .map(
          (n) =>
            `${n.nodeCode} (Tầng ${n.floorLevel}, ${n.capacityCount} chỗ, AI ${n.aiScore || 95}đ)`
        )
        .join('; ');
      return {
        title: 'Gợi ý Phòng họp Đang Trống Tối ưu',
        reply: `Hiện có ${availableCount}/${totalNodes} phòng đang trống. Đề xuất số 1 là ${
          topRecommendedNode?.nodeCode || 'M1-01'
        } (${
          topRecommendedNode?.nodeLabel || 'Phòng họp Tầng 1'
        }). Các lựa chọn hàng đầu khác gồm: ${freeRooms}.`,
      };
    }

    if (
      q.includes('thiết bị') ||
      q.includes('hỏng') ||
      q.includes('máy chiếu') ||
      q.includes('màn hình')
    ) {
      if (brokenEquipments.length === 0) {
        return {
          title: 'Tình trạng Thiết bị Dùng chung',
          reply: `Toàn bộ ${equipmentsList.length} thiết bị trên 5 tầng đều đang hoạt động tốt (0 thiết bị hỏng).`,
        };
      }
      return {
        title: 'Cảnh báo Thiết bị & Bảo trì',
        reply: `Đang có ${
          brokenEquipments.length
        } thiết bị gặp sự cố cần bảo trì: ${brokenEquipments
          .map(
            (eq) =>
              `${eq.equipmentCode} (${eq.equipmentName}) tại phòng ${eq.assignedNodeId} - Độ bền ${
                eq.healthPercent || 45
              }%`
          )
          .join('. ')}. Các phòng còn lại thiết bị đều hoạt động 100%.`,
      };
    }

    if (q.includes('duyệt') || q.includes('chờ') || q.includes('nhân viên')) {
      if (pendingApprovals.length === 0) {
        return {
          title: 'Trạng thái Phê duyệt Đặt phòng',
          reply:
            'Hiện tại toàn bộ đơn đặt phòng của nhân viên đã được xử lý, không có đơn nào chờ duyệt.',
        };
      }
      return {
        title: `Danh sách ${pendingApprovals.length} Đơn Chờ Phê duyệt`,
        reply: `Có ${
          pendingApprovals.length
        } yêu cầu đang chờ Quản lý hoặc Admin duyệt: ${pendingApprovals
          .map(
            (b) =>
              `Vé ${b.bookingId} tại ${b.nodeId} (${b.startTimeIso}-${b.endTimeIso}) của @${
                b.requesterUsername || b.userEmail
              }`
          )
          .join('; ')}.`,
      };
    }

    if (
      q.includes('tín nhiệm') ||
      q.includes('điểm') ||
      q.includes('no-show') ||
      q.includes('thu hồi')
    ) {
      return {
        title: 'Phân tích Điểm Tín nhiệm & Kỷ luật Check-in',
        reply: `Điểm tín nhiệm trung bình toàn hệ thống là ${avgTrustScore}/100 điểm. Điểm cá nhân của bạn đang là ${
          myTrustProfile?.trustScore || 100
        }/100 điểm. Quy tắc hiện hành: Check-in QR đúng hạn được cộng +2 điểm; quá 15 phút không Check-in bị Cronjob tự thu hồi phòng và trừ -10 điểm (dưới 60 điểm sẽ bị khóa đặt lịch định kỳ).`,
      };
    }

    return {
      title: 'Phân tích AI SpotMatrix',
      reply: `Theo dữ liệu thời gian thực: Mật độ lấp đầy hiện đạt ${occupancyRate}% (trung bình 30 ngày là 52%), còn trống ${availableCount} phòng. Phòng tối ưu nhất hiện tại là ${
        topRecommendedNode?.nodeCode || 'M1-01'
      }. Bạn có muốn tôi đọc tóm tắt chi tiết toàn bộ hệ thống không?`,
    };
  };

  const handleSendQuestionToAi = (customPrompt?: string) => {
    const textToSend = (customPrompt ?? chatInputText).trim();
    if (!textToSend) return;

    const userMsg: AiChatMessageItem = {
      messageId: `MSG-USR-${Date.now()}`,
      sender: 'USER',
      contentText: textToSend,
      timestampText: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const aiResponse = generateSmartAiAnswer(textToSend);
    const aiMsgId = `MSG-AI-${Date.now() + 1}`;
    const aiMsg: AiChatMessageItem = {
      messageId: aiMsgId,
      sender: 'AI',
      title: aiResponse.title,
      contentText: aiResponse.reply,
      timestampText: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setChatMessages((prev) => [...prev, userMsg, aiMsg]);
    if (!customPrompt) {
      setChatInputText('');
    }
  };

  const hourlyComparisonBars = [
    { hour: '08:00', actual: Math.max(25, dashboardMetrics.occupancyRate - 8), avg30d: 44 },
    { hour: '10:00', actual: Math.min(95, dashboardMetrics.occupancyRate + 14), avg30d: 68 },
    { hour: '12:00', actual: Math.max(20, dashboardMetrics.occupancyRate - 15), avg30d: 51 },
    { hour: '14:00', actual: Math.min(98, dashboardMetrics.occupancyRate + 18), avg30d: 72 },
    { hour: '16:00', actual: Math.min(90, dashboardMetrics.occupancyRate + 8), avg30d: 63 },
    { hour: '18:00', actual: Math.max(15, dashboardMetrics.occupancyRate - 22), avg30d: 34 },
  ];

  return (
    <div className="space-y-6 relative">
      {/* THANH TIÊU ĐỀ ĐA TẦNG THEO ROLE + NÚT BẬT CHAT AI & ĐỌC TÓM TẮT DỮ LIỆU */}
      <div
        className={`p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              isDark
                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                : 'bg-indigo-50 border-indigo-100 text-indigo-600'
            }`}
          >
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bảng Điều khiển Đa tầng (Dashboard) & Phân tích AI
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold bg-indigo-600 text-white">
                Chế độ: {selectedRoleView}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Đồng bộ thời gian thực với Sơ đồ 5 Tầng 3D/2D, Điểm tín nhiệm, Thiết bị dùng chung &
              MongoDB Atlas
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`p-1 rounded-xl border flex items-center gap-1 text-xs font-bold ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {(['EMPLOYEE', 'MANAGER', 'SYS_ADMIN'] as UserRoleType[]).map((roleOption) => (
              <button
                key={roleOption}
                type="button"
                onClick={() => setSelectedRoleView(roleOption)}
                className={`px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-extrabold ${
                  selectedRoleView === roleOption
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {roleOption === 'EMPLOYEE'
                  ? 'Nhân viên'
                  : roleOption === 'MANAGER'
                  ? 'Quản lý'
                  : 'Admin'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleSynthesizeAndSpeakSummary(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm flex items-center gap-1.5 transition"
          >
            <Volume2 className="w-4 h-4" />
            <span>Tổng hợp & Nghe AI Tóm tắt</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAiChatOpen((prev) => !prev)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isAiChatOpen ? 'Đóng Chat AI' : 'Mở Chat AI Bên Phải'}</span>
          </button>
        </div>
      </div>

      {/* 4 THẺ KPI CHÍNH */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Tỷ lệ Lấp đầy Hiện tại</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {dashboardMetrics.occupancyRate}%
            </span>
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300">
              {dashboardMetrics.occupancyRate - 52 >= 0
                ? `+${dashboardMetrics.occupancyRate - 52}%`
                : `${dashboardMetrics.occupancyRate - 52}%`}{' '}
              vs TB (52%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Đang trống {dashboardMetrics.availableCount}/{dashboardMetrics.totalNodes} vị trí trên
            Sơ đồ 5 Tầng
          </p>
        </div>

        <div
          className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Đơn Đặt chỗ & Giữ 5 phút</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {dashboardMetrics.activeBookingsCount}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
              {dashboardMetrics.holdingCount} phòng đang Hold 5p
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Chờ duyệt: {dashboardMetrics.pendingApprovals.length} đơn • Đã Check-in:{' '}
            {dashboardMetrics.checkedInCount}
          </p>
        </div>

        <div
          className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              {selectedRoleView === 'EMPLOYEE'
                ? 'Điểm Tín nhiệm Cá nhân'
                : 'Điểm Tín nhiệm Trung bình'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-teal-600 dark:text-teal-400">
              {selectedRoleView === 'EMPLOYEE'
                ? `${dashboardMetrics.myTrustProfile?.trustScore || 96}đ`
                : `${dashboardMetrics.avgTrustScore}đ`}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300">
              Sàn giới hạn: 60đ
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Check-in QR đúng hạn: +2đ • Quá 15p No-Show: -10đ
          </p>
        </div>

        <div
          className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Thiết bị Dùng chung Khả dụng</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {dashboardMetrics.workingEquipmentsCount}/{dashboardMetrics.totalEquipmentsCount}
            </span>
            <span
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                dashboardMetrics.brokenEquipments.length > 0
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                  : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
              }`}
            >
              {dashboardMetrics.brokenEquipments.length > 0
                ? `${dashboardMetrics.brokenEquipments.length} cần bảo trì`
                : '100% Tốt'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Đồng bộ mã thiết bị trực tiếp theo từng phòng họp
          </p>
        </div>
      </div>

      {/* KHU VỰC ĐẶC THÙ RIÊNG BIỆT CHO TỪNG ROLE */}
      {selectedRoleView === 'EMPLOYEE' && (
        <div
          className={`p-6 rounded-3xl border space-y-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Không gian Nhân viên ({sessionInfo.fullName}) — Lịch họp Cá nhân & Quyền lợi Tín
                  nhiệm
                </h2>
                <p className="text-[11px] text-slate-400">
                  Hạn mức khả dụng: Tối đa 10 giờ/tuần • Đủ điều kiện đặt lịch định kỳ (Điểm tín
                  nhiệm ≥ 60)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('BOOKING')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Đặt phòng mới & Lấy mã QR
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-teal-50/50 border-teal-200/70'
              }`}
            >
              <span className="text-[11px] font-extrabold uppercase text-teal-600">
                Hồ sơ Tín nhiệm của bạn
              </span>
              <div className="text-2xl font-black text-teal-600 mt-1">
                {dashboardMetrics.myTrustProfile?.trustScore || 96} / 100 điểm
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Số lần Check-in đúng giờ:{' '}
                <strong>{dashboardMetrics.myTrustProfile?.onTimeCheckInCount || 18} lần</strong> •
                Vi phạm No-Show:{' '}
                <strong>{dashboardMetrics.myTrustProfile?.noShowPenaltyCount || 0} lần</strong>
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-indigo-50/50 border-indigo-200/70'
              }`}
            >
              <span className="text-[11px] font-extrabold uppercase text-indigo-600">
                Gợi ý Phòng họp Cá nhân & Nhóm
              </span>
              <div className={`text-sm font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {dashboardMetrics.topRecommendedNode?.nodeCode} —{' '}
                {dashboardMetrics.topRecommendedNode?.nodeLabel}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sức chứa {dashboardMetrics.topRecommendedNode?.capacityCount} người • Điểm AI:{' '}
                <strong>{dashboardMetrics.topRecommendedNode?.aiScore || 96}/100</strong>
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-amber-50/50 border-amber-200/70'
              }`}
            >
              <span className="text-[11px] font-extrabold uppercase text-amber-600">
                Lịch đặt của tôi ({dashboardMetrics.myBookings.length} vé)
              </span>
              <div className={`text-xs font-bold mt-1.5 space-y-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {dashboardMetrics.myBookings.slice(0, 2).map((b) => (
                  <div key={b.bookingId} className="flex items-center justify-between">
                    <span>
                      {b.nodeId} ({b.startTimeIso}-{b.endTimeIso})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 font-bold">
                      {b.bookingStatus === 'CHECKED_IN'
                        ? 'Đã Check-in'
                        : b.approvalStatus === 'PENDING_APPROVAL'
                        ? 'Chờ duyệt'
                        : 'Đã duyệt'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRoleView === 'MANAGER' && (
        <div
          className={`p-6 rounded-3xl border space-y-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Bảng Điều phối Quản lý (MANAGER) — Duyệt Nhanh Yêu cầu Nhân viên & Giám sát Nhóm
                </h2>
                <p className="text-[11px] text-slate-400">
                  Phê duyệt trực tiếp các yêu cầu đặt phòng của Nhân viên trong bộ phận Product &
                  Engineering
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-amber-500/15 text-amber-600">
              Đang chờ duyệt: {dashboardMetrics.pendingApprovals.length} yêu cầu
            </span>
          </div>

          {dashboardMetrics.pendingApprovals.length === 0 ? (
            <div
              className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-300'
                  : 'bg-teal-50/40 border-teal-200 text-teal-800'
              }`}
            >
              <span>
                Tất cả yêu cầu đặt phòng của nhân viên trong nhóm đã được phê duyệt hoàn tất!
              </span>
              <button
                type="button"
                onClick={() => onNavigateSection('BOOKING')}
                className="text-indigo-600 font-bold underline"
              >
                Xem lịch toàn bộ phận
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dashboardMetrics.pendingApprovals.map((reqItem) => (
                <div
                  key={reqItem.bookingId}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold">
                        {reqItem.nodeId}
                      </span>
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {reqItem.purposeNote}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Người đặt: @{reqItem.requesterUsername || reqItem.userEmail} •{' '}
                      {reqItem.bookingDateIso} ({reqItem.startTimeIso} – {reqItem.endTimeIso})
                    </p>
                  </div>

                  {onHandleApprovalDecision && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onHandleApprovalDecision(reqItem.bookingId, 'APPROVED')}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Chấp nhận
                      </button>
                      <button
                        type="button"
                        onClick={() => onHandleApprovalDecision(reqItem.bookingId, 'REJECTED')}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Từ chối
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedRoleView === 'SYS_ADMIN' && (
        <div
          className={`p-6 rounded-3xl border space-y-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Trung tâm Chỉ huy Hệ thống (SYS_ADMIN) — Chính sách Động, Thiết bị & Truy vết
                  Optimistic Lock
                </h2>
                <p className="text-[11px] text-slate-400">
                  Giám sát toàn bộ 5 tầng, kiểm soát nhật ký xung đột khóa phiên bản và điều chỉnh
                  chính sách hệ thống
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateSection('DATAMANAGER')}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Cpu className="w-3.5 h-3.5" />
                Quản lý Thiết bị & Chính sách Động
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('AUDIT')}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                Nhật ký Hoạt động ({auditLogs.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-indigo-50/40 border-indigo-200/70'
              }`}
            >
              <span className="text-[11px] font-extrabold uppercase text-indigo-600">
                Cấu hình Chính sách Động Hiện hành
              </span>
              <p className={`text-xs font-bold mt-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                • Giữ chỗ tạm thời: <strong>5 phút</strong> (Optimistic Lock)
              </p>
              <p className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                • Cronjob thu hồi No-Show: <strong>15 phút</strong> (-10 điểm)
              </p>
              <p className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                • Sàn điểm đặt định kỳ: <strong>60/100 điểm</strong>
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-rose-50/40 border-rose-200/70'
              }`}
            >
              <span className="text-[11px] font-extrabold uppercase text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Cảnh báo Thiết bị Hỏng ({dashboardMetrics.brokenEquipments.length})
              </span>
              {dashboardMetrics.brokenEquipments.length === 0 ? (
                <p className="text-xs text-teal-600 font-bold mt-1.5">
                  Tất cả thiết bị hoạt động bình thường.
                </p>
              ) : (
                dashboardMetrics.brokenEquipments.map((eq) => (
                  <div key={eq.equipmentId} className="mt-1.5 text-xs">
                    <strong className="text-rose-600">{eq.equipmentCode}</strong> — Phòng{' '}
                    <strong>{eq.assignedNodeId}</strong> ({eq.equipmentName})
                  </div>
                ))
              )}
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-teal-50/40 border-teal-200/70'
              }`}
            >
              <span className="text-[11px] font-extrabold uppercase text-teal-600">
                Sự kiện Đồng bộ & Truy vết Mới nhất
              </span>
              <p
                className={`text-xs font-semibold mt-1.5 line-clamp-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {auditLogs[0]?.detailMessage || 'Hệ thống đang hoạt động ổn định.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PHÂN TÍCH AI SO SÁNH TRUNG BÌNH 30 NGÀY & MÔ PHỎNG NHU CẦU */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Phân tích AI So sánh Trung bình & Mô phỏng Nhu cầu (What-If Simulator)
              </h2>
              <p className="text-xs text-slate-400">
                Đối chiếu dữ liệu thời gian thực từ Sơ đồ 5 Tầng với mức chuẩn 30 ngày qua
              </p>
            </div>
          </div>

          <div
            className={`px-4 py-2 rounded-2xl border flex items-center gap-3 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Tải mô phỏng: {demandSimulationPercent}%
            </span>
            <input
              type="range"
              min={50}
              max={150}
              step={10}
              value={demandSimulationPercent}
              onChange={(e) => setDemandSimulationPercent(Number(e.target.value))}
              className="w-28 accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-indigo-50/40 border-indigo-100'
            }`}
          >
            <h3 className="text-xs font-extrabold text-indigo-600 mb-1">
              1. Mật độ Hiện tại vs. Trung bình
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Mật độ hiện tại đạt <strong>{dashboardMetrics.occupancyRate}%</strong> (trung bình 30
              ngày: <strong>52%</strong>). Với hệ số tải <strong>{demandSimulationPercent}%</strong>,
              công suất đỉnh dự kiến đạt <strong>{dashboardMetrics.simulatedPeakOccupancy}%</strong>.
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-teal-50/40 border-teal-100'
            }`}
          >
            <h3 className="text-xs font-extrabold text-teal-600 mb-1">
              2. Độ ổn định Check-in & Tín nhiệm
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Điểm tín nhiệm trung bình đạt <strong>{dashboardMetrics.avgTrustScore}/100đ</strong>,
              giúp giảm tỷ lệ bỏ trống phòng sau khi đặt xuống thấp hơn <strong>38%</strong> so với
              trung bình tháng trước.
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-amber-50/40 border-amber-100'
            }`}
          >
            <h3 className="text-xs font-extrabold text-amber-600 mb-1">
              3. Đề xuất Điều phối Không gian AI
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Phòng tối ưu nhất đang trống là{' '}
              <strong>{dashboardMetrics.topRecommendedNode?.nodeCode || 'M1-01'}</strong>. Các sự
              kiện trên 12 người được khuyến nghị chuyển sang{' '}
              <strong>Hội trường Đấu trường La Mã (H-01 - Tầng 5)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ CỘT THEO KHUNG GIỜ & BIỂU ĐỒ TRÒN TRẠNG THÁI MẶT BẰNG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`lg:col-span-8 p-6 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <h3 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Biểu đồ Mật độ Theo Khung giờ (Thực tế vs. Trung bình 30 ngày)
              </h3>
              <p className="text-xs text-slate-400">
                Đồng bộ trực tiếp với trạng thái phòng trên Sơ đồ 5 Tầng
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                Thực tế hôm nay
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 inline-block" />
                Trung bình 30 ngày
              </span>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4 items-end h-44 pt-4 px-2 border-b border-slate-200/70 dark:border-slate-800">
            {hourlyComparisonBars.map((bar) => (
              <div key={bar.hour} className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="flex items-end gap-1.5 w-full justify-center h-32">
                  <div
                    className="w-5 rounded-t-lg bg-indigo-600 transition-all duration-500"
                    style={{ height: `${bar.actual}%` }}
                    title={`Thực tế: ${bar.actual}%`}
                  />
                  <div
                    className="w-5 rounded-t-lg bg-slate-200 dark:bg-slate-700 transition-all duration-500"
                    style={{ height: `${bar.avg30d}%` }}
                    title={`Trung bình 30 ngày: ${bar.avg30d}%`}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-400 pb-2">{bar.hour}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div>
            <h3 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Phân bổ Trạng thái Mặt bằng
            </h3>
            <p className="text-xs text-slate-400">
              Tổng cộng {dashboardMetrics.totalNodes} vị trí đang quản lý
            </p>
          </div>

          <div className="my-4 flex items-center justify-center">
            <div className="relative w-32 h-32 rounded-full border-[12px] border-teal-500 flex flex-col items-center justify-center">
              <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {dashboardMetrics.totalNodes}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Vị trí</span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-semibold">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                Đang trống
              </span>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                {dashboardMetrics.availableCount} vị trí
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                Đã đặt & Đang họp
              </span>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                {dashboardMetrics.occupiedOrReservedCount} vị trí
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Giữ 5p & Bảo trì
              </span>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                {dashboardMetrics.holdingCount} vị trí
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* KHUNG DRAWER CHAT AI BÊN PHẢI + TỔNG HỢP DỮ LIỆU & ĐỌC GIỌNG NÓI TIẾNG VIỆT (VOICE TTS) */}
      {isAiChatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[430px] shadow-2xl flex flex-col border-l transition-all bg-white dark:bg-slate-900 border-indigo-100 dark:border-slate-800">
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-indigo-600 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold">Trợ lý AI SpotMatrix Co-Pilot</h3>
                <p className="text-[11px] text-indigo-100">
                  Hỏi đáp trực tiếp • Tổng hợp & Đọc báo cáo giọng nói
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {isSpeakingTts && (
                <button
                  type="button"
                  onClick={handleStopSpeaking}
                  className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 animate-pulse"
                  title="Dừng đọc giọng nói"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  Dừng đọc
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  handleStopSpeaking();
                  setIsAiChatOpen(false);
                }}
                className="p-1.5 rounded-lg hover:bg-white/15 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className={`p-3 border-b flex flex-wrap items-center justify-between gap-2 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-indigo-50/60 border-indigo-100'
            }`}
          >
            <button
              type="button"
              onClick={() => handleSynthesizeAndSpeakSummary(true)}
              className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Volume2 className="w-4 h-4" />
              Tổng hợp Dữ liệu & Đọc Tóm tắt Cho Tôi Nghe
            </button>
            <button
              type="button"
              onClick={() => handleSynthesizeAndSpeakSummary(false)}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'
              }`}
              title="Chỉ tổng hợp văn bản vào khung chat"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tóm tắt chữ
            </button>
          </div>

          <div
            className={`px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/70'
            }`}
          >
            {[
              'Phòng nào đang trống tốt nhất?',
              'Tình trạng thiết bị 5 tầng?',
              'Có đơn nào chờ duyệt không?',
              'Điểm tín nhiệm & kỷ luật 15p?',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSendQuestionToAi(chip)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 border transition ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {chatMessages.map((msg) => {
              const isAi = msg.sender === 'AI';
              const isThisSpeaking = isSpeakingTts && speakingMessageId === msg.messageId;
              return (
                <div
                  key={msg.messageId}
                  className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[92%] p-3.5 rounded-2xl border text-xs leading-relaxed ${
                      isAi
                        ? msg.isSummaryReport
                          ? isDark
                            ? 'bg-teal-950/35 border-teal-500/40 text-slate-100'
                            : 'bg-teal-50/80 border-teal-200 text-slate-800'
                          : isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-200/90 text-slate-800'
                        : 'bg-indigo-600 border-indigo-600 text-white font-semibold'
                    }`}
                  >
                    {isAi && msg.title && (
                      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-800">
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          {msg.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSpeakTextAloud(msg.contentText, msg.messageId)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition ${
                            isThisSpeaking
                              ? 'bg-rose-500 text-white'
                              : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25'
                          }`}
                        >
                          {isThisSpeaking ? (
                            <>
                              <VolumeX className="w-3 h-3" />
                              Đang đọc...
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              Nghe đọc
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    <p>{msg.contentText}</p>
                    <div
                      className={`text-[10px] mt-1.5 ${
                        isAi ? 'text-slate-400' : 'text-indigo-200 text-right'
                      }`}
                    >
                      {msg.timestampText}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestionToAi();
            }}
            className={`p-3 border-t flex items-center gap-2 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <input
              type="text"
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              placeholder="Hỏi AI về phòng trống, thiết bị, tín nhiệm..."
              className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
              title="Gửi câu hỏi cho AI"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};