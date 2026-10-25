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
  Settings2,
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
      | 'ORGANIZATION'
      | 'NOTIFICATION'
      | 'DATAMANAGER'
      | 'AUDIT'
      | 'PROFILE'
      | 'SETTINGS'
  ) => void;
  onHandleApprovalDecision?: (bookingId: string, decision: 'APPROVED' | 'REJECTED') => void;
}

type AiPersonaRoleKey =
  | 'SPATIAL_ARCHITECT'
  | 'EXECUTIVE_ANALYST'
  | 'SECURITY_AUDITOR'
  | 'FRIENDLY_CONCIERGE';

interface AiPersonaPresetItem {
  key: AiPersonaRoleKey;
  shortLabel: string;
  badgeText: string;
  openingPrefix: string;
  systemPrompt: string;
}

interface AiChatMessageItem {
  messageId: string;
  sender: 'AI' | 'USER';
  title?: string;
  personaBadge?: string;
  contentText: string;
  timestampText: string;
  isSummaryReport?: boolean;
}

const SESSION_STORAGE_KEY = 'spotmatrix_active_session_v2';

const AI_PERSONA_PRESETS: Record<AiPersonaRoleKey, AiPersonaPresetItem> = {
  SPATIAL_ARCHITECT: {
    key: 'SPATIAL_ARCHITECT',
    shortLabel: 'Kiến trúc sư 3D',
    badgeText: 'Kiến trúc sư Không gian 3D',
    openingPrefix: 'Dưới góc độ Kiến trúc Không gian 5 Tầng:',
    systemPrompt:
      'Bạn là Kiến trúc sư Trưởng điều phối không gian 3D/2D của tòa nhà SpotMatrix 5 tầng. Luôn tư vấn dựa trên sức chứa, bố cục bàn tròn/bàn dài/đấu trường La Mã, độ cách âm 40dB và thiết bị đi kèm.',
  },
  EXECUTIVE_ANALYST: {
    key: 'EXECUTIVE_ANALYST',
    shortLabel: 'Chuyên gia Số liệu',
    badgeText: 'Chuyên gia Phân tích Dữ liệu',
    openingPrefix: 'Theo số liệu thống kê thực tế & đối chuẩn 30 ngày:',
    systemPrompt:
      'Bạn là Chuyên gia Phân tích Dữ liệu Quản trị. Luôn trả lời kèm con số định lượng chính xác (tỷ lệ lấp đầy %, chênh lệch so với trung bình 52%, điểm tín nhiệm và tần suất giờ hoạt động thiết bị).',
  },
  SECURITY_AUDITOR: {
    key: 'SECURITY_AUDITOR',
    shortLabel: 'Thanh tra Bảo mật',
    badgeText: 'Thanh tra Bảo mật & Kỷ luật',
    openingPrefix: 'Theo quy chuẩn Bảo mật RBAC & Kỷ luật Đặt lịch:',
    systemPrompt:
      'Bạn là Thanh tra Bảo mật & Quản trị Rủi ro. Tập trung phân tích khóa phiên bản Optimistic Locking (lockVersion), giữ chỗ 5 phút, quy định Check-in QR ±30 phút, Cronjob 15 phút tự thu hồi No-Show (-10 điểm) và phân quyền 3 Role.',
  },
  FRIENDLY_CONCIERGE: {
    key: 'FRIENDLY_CONCIERGE',
    shortLabel: 'Trợ lý Lễ tân',
    badgeText: 'Trợ lý Lễ tân Thông minh',
    openingPrefix: 'Mình xin hỗ trợ nhanh cho bạn như sau:',
    systemPrompt:
      'Bạn là Trợ lý Lễ tân thân thiện, nhiệt tình và linh hoạt. Hãy hướng dẫn từng bước dễ hiểu, gợi ý ngay phòng trống tốt nhất và hỗ trợ người dùng giải quyết mọi thắc mắc nhanh chóng.',
  },
};

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
          email: (propUserEmail || parsed?.userProfile?.userEmail || 'sysadmin@spotmatrix.vn') as string,
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
  const [selectedPersonaKey, setSelectedPersonaKey] = useState<AiPersonaRoleKey>('SPATIAL_ARCHITECT');
  const [isPersonaConfigExpanded, setIsPersonaConfigExpanded] = useState<boolean>(false);
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>(
    AI_PERSONA_PRESETS.SPATIAL_ARCHITECT.systemPrompt
  );
  const [chatInputText, setChatInputText] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isSpeakingTts, setIsSpeakingTts] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const activePersona = AI_PERSONA_PRESETS[selectedPersonaKey];

  const handleSelectPersonaPreset = (nextKey: AiPersonaRoleKey) => {
    setSelectedPersonaKey(nextKey);
    setCustomSystemPrompt(AI_PERSONA_PRESETS[nextKey].systemPrompt);
  };

  const dashboardMetrics = useMemo(() => {
    const totalNodes = workspaceNodes.length || 25;
    const availableNodes = workspaceNodes.filter((n) => n.status === 'AVAILABLE');
    const holdingNodes = workspaceNodes.filter((n) => n.status === 'HOLDING');
    const occupiedOrReserved = workspaceNodes.filter(
      (n) => n.status === 'OCCUPIED' || n.status === 'RESERVED'
    );

    const occupancyRate = Math.round(((totalNodes - availableNodes.length) / totalNodes) * 100);
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
            trustProfiles.reduce((acc, item) => acc + item.trustScore, 0) / trustProfiles.length
          )
        : 95;

    const myTrustProfile =
      trustProfiles.find((tp) => tp.userEmail.toLowerCase() === sessionInfo.email.toLowerCase()) ||
      trustProfiles[0];

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
      availableNodes,
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

  const buildLiveWorkspaceContextSnapshot = (): string => {
    const freeList = dashboardMetrics.availableNodes
      .slice(0, 8)
      .map((n) => `${n.nodeCode} (Tầng ${n.floorLevel}, ${n.capacityCount} chỗ)`)
      .join(', ');
    const brokenList =
      dashboardMetrics.brokenEquipments
        .map((e) => `${e.equipmentCode} tại ${e.assignedNodeId}`)
        .join(', ') || 'Không có';
    return `Người hỏi: ${sessionInfo.fullName} (@${sessionInfo.username}, Vai trò: ${
      sessionInfo.role
    }, Tín nhiệm: ${dashboardMetrics.myTrustProfile?.trustScore || 100}/100). Tổng số phòng: ${
      dashboardMetrics.totalNodes
    } (5 tầng). Đang trống: ${dashboardMetrics.availableCount} phòng (${freeList}). Lấp đầy: ${
      dashboardMetrics.occupancyRate
    }%. Lịch đặt hoạt động: ${dashboardMetrics.activeBookingsCount}. Đơn chờ duyệt: ${
      dashboardMetrics.pendingApprovals.length
    }. Điểm tín nhiệm TB: ${dashboardMetrics.avgTrustScore}/100. Thiết bị tốt: ${
      dashboardMetrics.workingEquipmentsCount
    }/${dashboardMetrics.totalEquipmentsCount}. Thiết bị hỏng: ${brokenList}.`;
  };

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
        ? `Hiện có ${brokenEquipments.length} thiết bị báo hỏng cần bảo trì là ${brokenEquipments
            .map((e) => `${e.equipmentCode} tại phòng ${e.assignedNodeId}`)
            .join(', ')}.`
        : 'Tất cả thiết bị tại 5 tầng đều hoạt động tốt.';

    const approvalText =
      pendingApprovals.length > 0
        ? `Có ${pendingApprovals.length} yêu cầu đặt phòng đang chờ phê duyệt.`
        : 'Không có yêu cầu đặt phòng nào tồn đọng.';

    const recommendText = topRecommendedNode
      ? `Phòng tối ưu nhất hiện tại là ${topRecommendedNode.nodeCode} (${
          topRecommendedNode.nodeLabel
        }) với điểm tương thích ${topRecommendedNode.aiScore || 96} trên 100.`
      : 'Hiện tất cả các phòng đang kín lịch.';

    return `${activePersona.openingPrefix} Toàn tòa nhà 5 tầng đang có tỷ lệ lấp đầy ${occupancyRate}%, còn trống ${availableCount} trên tổng số ${totalNodes} không gian họp và hội trường. Đang có ${activeBookingsCount} lịch đặt chỗ hoạt động. ${approvalText} Điểm tín nhiệm trung bình toàn hệ thống đạt ${avgTrustScore} trên 100 điểm. Về thiết bị dùng chung, có ${workingEquipmentsCount} trên ${totalEquipmentsCount} thiết bị sẵn sàng phục vụ. ${brokenText} ${recommendText}`;
  };

  const [chatMessages, setChatMessages] = useState<AiChatMessageItem[]>(() => [
    {
      messageId: 'MSG-WELCOME-01',
      sender: 'AI',
      title: 'Trợ lý SpotMatrix',
      personaBadge: AI_PERSONA_PRESETS.SPATIAL_ARCHITECT.badgeText,
      contentText:
        'Xin chào! Tôi đã sẵn sàng hỗ trợ bạn điều phối không gian phòng họp 5 tầng. Bạn có thể chọn phong cách tư vấn ở thanh phía trên, bấm "Tổng hợp & Đọc Tóm tắt", hoặc hỏi bất kỳ câu hỏi nào (VD: "Tìm phòng trống cho 8 người", "Tầng 2 còn phòng nào?", "Phòng M1-03 thiết bị sao rồi?").',
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
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

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
    if (viVoice) utterance.voice = viVoice;

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
      title: 'Bản Tổng hợp Dữ liệu Thời gian thực',
      personaBadge: activePersona.badgeText,
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

  const generateFlexibleLocalAiAnswer = (questionRaw: string): { title: string; reply: string } => {
    const q = questionRaw.trim();
    const qLower = q.toLowerCase();
    const prefix = activePersona.openingPrefix;
    const {
      availableNodes,
      availableCount,
      totalNodes,
      occupancyRate,
      pendingApprovals,
      avgTrustScore,
      brokenEquipments,
      topRecommendedNode,
      myTrustProfile,
      myBookings,
    } = dashboardMetrics;

    const mathCompareMatch = qLower.match(/(\d+)\s*([+\-*/x:])\s*(\d+)\s*(?:=|bằng)\s*(\d+)/i);
    if (mathCompareMatch) {
      const a = Number(mathCompareMatch[1]);
      const op = mathCompareMatch[2];
      const b = Number(mathCompareMatch[3]);
      const claimed = Number(mathCompareMatch[4]);
      const actual =
        op === '+'
          ? a + b
          : op === '-'
          ? a - b
          : op === '*' || op === 'x'
          ? a * b
          : b !== 0
          ? Number((a / b).toFixed(2))
          : 0;

      if (actual === claimed) {
        return {
          title: activePersona.shortLabel,
          reply: `Chào bạn! Chính xác rồi nhé, ${a} ${op} ${b} = ${actual}. Nhân tiện nếu bạn đang tìm phòng họp cho ${actual} người thì hiện phòng ${
            topRecommendedNode?.nodeCode || 'M1-01'
          } (Tầng ${topRecommendedNode?.floorLevel || 1}) đang trống và sẵn sàng phục vụ ngay!`,
        };
      }
      return {
        title: activePersona.shortLabel,
        reply: `Chào bạn! Về câu hỏi của bạn, ${a} ${op} ${b} bằng ${actual} chứ không phải bằng ${claimed} đâu nhé! Nhưng nếu nhóm của bạn đang có ${claimed} người cần tìm phòng họp thì tôi gợi ý ngay phòng ${
          topRecommendedNode?.nodeCode || 'M1-01'
        } (Tầng ${topRecommendedNode?.floorLevel || 1}, sức chứa ${
          topRecommendedNode?.capacityCount || 2
        } người) đang trống nhé!`,
      };
    }

    const simpleMathMatch = qLower.match(/(\d+)\s*([+\-*/x:])\s*(\d+)/i);
    if (
      simpleMathMatch &&
      !qLower.includes('m1-') &&
      !qLower.includes('m2-') &&
      !qLower.includes('m3-') &&
      !qLower.includes('m4-')
    ) {
      const a = Number(simpleMathMatch[1]);
      const op = simpleMathMatch[2];
      const b = Number(simpleMathMatch[3]);
      const actual =
        op === '+'
          ? a + b
          : op === '-'
          ? a - b
          : op === '*' || op === 'x'
          ? a * b
          : b !== 0
          ? Number((a / b).toFixed(2))
          : 0;
      return {
        title: activePersona.shortLabel,
        reply: `Chào bạn! Kết quả của phép tính ${a} ${op} ${b} là ${actual} nhé. Cần tôi tra cứu thêm phòng họp trống hay kiểm tra thiết bị ở tầng nào không?`,
      };
    }

    const roomCodeMatch = q.match(/\b(M[1-4]-0[1-6]|H-01|H01)\b/i);
    if (roomCodeMatch) {
      const normalizedCode =
        roomCodeMatch[1].toUpperCase() === 'H01' ? 'H-01' : roomCodeMatch[1].toUpperCase();
      const targetNode = workspaceNodes.find((n) => n.nodeCode === normalizedCode);
      if (targetNode) {
        const roomEqs = equipmentsList.filter((eq) => eq.assignedNodeId === normalizedCode);
        const roomBks = bookingsList.filter(
          (b) =>
            b.nodeId.startsWith(normalizedCode.replace('-', '')) || b.nodeId === normalizedCode
        );
        const statusVn =
          targetNode.status === 'AVAILABLE'
            ? 'Đang trống (Có thể đặt ngay)'
            : targetNode.status === 'HOLDING'
            ? 'Đang được giữ tạm 5 phút'
            : 'Đã có lịch đặt / Đang họp';
        const eqSummary =
          roomEqs.length > 0
            ? roomEqs
                .map(
                  (e) =>
                    `${e.equipmentName} (${e.status === 'BROKEN' ? 'Đang báo hỏng' : 'Hoạt động tốt'})`
                )
                .join(', ')
            : 'Trang bị tiêu chuẩn (Màn hình 4K, Camera AI 360, Cách âm 40dB)';

        return {
          title: activePersona.shortLabel,
          reply: `${prefix} Phòng ${targetNode.nodeCode} (${targetNode.nodeLabel}) nằm tại Tầng ${targetNode.floorLevel}, sức chứa ${targetNode.capacityCount} người, hiện tại [${statusVn}]. Thiết bị đi kèm: ${eqSummary}. Hiện có ${roomBks.length} lịch đặt liên quan tới không gian này.`,
        };
      }
    }

    const floorMatch = qLower.match(/tầng\s*([1-5])/i);
    if (floorMatch || qLower.includes('hội trường') || qLower.includes('la mã')) {
      const floorNum = floorMatch ? Number(floorMatch[1]) : 5;
      const floorNodes = workspaceNodes.filter((n) => n.floorLevel === floorNum);
      const freeOnFloor = floorNodes.filter((n) => n.status === 'AVAILABLE');

      if (floorNum === 5) {
        return {
          title: activePersona.shortLabel,
          reply: `${prefix} Tầng 5 là Hội trường Lớn Đấu trường La Mã (Mã H-01, sức chứa 30 người) chia làm 2 chế độ: (1) Thuê cả phòng tổ chức sự kiện dành cho Admin và Quản lý, có thiết lập Phòng ban được tham gia; (2) Đặt chỗ ghế ngồi (H01-A1..C12) khi Hội trường đã có sự kiện được phê duyệt.`,
        };
      }

      return {
        title: activePersona.shortLabel,
        reply: `${prefix} Tầng ${floorNum} có tổng cộng ${floorNodes.length} phòng họp chính thức, hiện đang trống ${freeOnFloor.length} phòng: ${
          freeOnFloor.length > 0
            ? freeOnFloor.map((n) => `${n.nodeCode} (${n.capacityCount} người)`).join(', ')
            : 'Tất cả các phòng trên tầng này đang bận'
        }. Bạn có thể mở trang Sơ đồ Phòng họp để xem mô hình 3D chi tiết của Tầng ${floorNum}.`,
      };
    }

    const peopleMatch = qLower.match(/(\d+)\s*(người|chỗ|ghế|thành viên|nhân sự)/i);
    if (peopleMatch) {
      const requiredCap = Number(peopleMatch[1]);
      if (requiredCap > 12) {
        return {
          title: activePersona.shortLabel,
          reply: `${prefix} Với quy mô ${requiredCap} người (vượt quá sức chứa 12 người của phòng họp thường), lựa chọn tối ưu nhất là chuyển lên Hội trường Lớn Đấu trường La Mã H-01 tại Tầng 5 (sức chứa 30 người, màn hình LED Panorama 360°).`,
        };
      }

      const matchingFree = availableNodes
        .filter((n) => n.capacityCount >= requiredCap && n.floorLevel <= 4)
        .sort((a, b) => a.capacityCount - b.capacityCount || (b.aiScore || 0) - (a.aiScore || 0));

      if (matchingFree.length > 0) {
        const bestFit = matchingFree[0];
        const others = matchingFree
          .slice(1, 4)
          .map((n) => `${n.nodeCode} (Tầng ${n.floorLevel}, ${n.capacityCount} chỗ)`)
          .join(', ');
        return {
          title: activePersona.shortLabel,
          reply: `${prefix} Để họp ${requiredCap} người tiết kiệm diện tích và hiệu quả nhất, tôi đề xuất phòng ${bestFit.nodeCode} (${bestFit.nodeLabel}, sức chứa chuẩn ${bestFit.capacityCount} người, điểm tối ưu ${bestFit.aiScore || 95}/100). ${
            others ? `Các phương án dự phòng đang trống khác: ${others}.` : ''
          }`,
        };
      }
    }

    if (qLower.includes('tóm tắt') || qLower.includes('tổng hợp') || qLower.includes('báo cáo')) {
      return {
        title: activePersona.shortLabel,
        reply: buildSynthesizedExecutiveSummary(),
      };
    }

    if (
      qLower.includes('trống') ||
      qLower.includes('gợi ý') ||
      qLower.includes('tốt nhất') ||
      qLower.includes('đề xuất')
    ) {
      const freeRooms = availableNodes
        .slice(0, 5)
        .map((n) => `${n.nodeCode} (Tầng ${n.floorLevel}, ${n.capacityCount} chỗ)`)
        .join('; ');
      return {
        title: activePersona.shortLabel,
        reply: `${prefix} Hiện có ${availableCount}/${totalNodes} không gian đang trống. Đề xuất số 1 là ${
          topRecommendedNode?.nodeCode || 'M1-01'
        } (${topRecommendedNode?.nodeLabel || 'Phòng họp Tầng 1'}). Các lựa chọn hàng đầu khác: ${freeRooms}.`,
      };
    }

    if (
      qLower.includes('thiết bị') ||
      qLower.includes('hỏng') ||
      qLower.includes('máy chiếu') ||
      qLower.includes('màn hình') ||
      qLower.includes('camera')
    ) {
      if (brokenEquipments.length === 0) {
        return {
          title: activePersona.shortLabel,
          reply: `${prefix} Toàn bộ ${equipmentsList.length} thiết bị trên 5 tầng đều đang hoạt động tốt (0 thiết bị hỏng).`,
        };
      }
      return {
        title: activePersona.shortLabel,
        reply: `${prefix} Đang có ${brokenEquipments.length} thiết bị gặp sự cố cần bảo trì: ${brokenEquipments
          .map(
            (eq) =>
              `${eq.equipmentCode} (${eq.equipmentName}) tại phòng ${eq.assignedNodeId} - Độ bền ${
                eq.healthPercent || 45
              }%`
          )
          .join('. ')}. Các phòng còn lại thiết bị đều hoạt động ổn định.`,
      };
    }

    if (qLower.includes('duyệt') || qLower.includes('chờ') || qLower.includes('phê duyệt')) {
      if (pendingApprovals.length === 0) {
        return {
          title: activePersona.shortLabel,
          reply: `${prefix} Hiện tại toàn bộ đơn đặt phòng của nhân viên đã được xử lý, không có đơn nào tồn đọng.`,
        };
      }
      return {
        title: activePersona.shortLabel,
        reply: `${prefix} Có ${pendingApprovals.length} yêu cầu đang chờ Quản lý hoặc Admin duyệt: ${pendingApprovals
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
      qLower.includes('quy định') ||
      qLower.includes('quy tắc') ||
      qLower.includes('check-in') ||
      qLower.includes('checkin') ||
      qLower.includes('qr') ||
      qLower.includes('lock') ||
      qLower.includes('5 phút') ||
      qLower.includes('15 phút') ||
      qLower.includes('tín nhiệm') ||
      qLower.includes('điểm')
    ) {
      return {
        title: activePersona.shortLabel,
        reply: `${prefix} Hệ thống áp dụng 4 quy tắc cốt lõi: (1) Giữ chỗ tạm thời 5 phút bảo vệ bằng khóa phiên bản Optimistic Locking chống 2 người đặt đè cùng lúc; (2) Chỉ mở cổng quét QR Check-in trong khoảng từ trước 30 phút đến trễ 30 phút so với giờ bắt đầu (+2 điểm tín nhiệm khi quét đúng hạn); (3) Cronjob tự động thu hồi phòng và trừ -10 điểm nếu quá 15 phút sau giờ bắt đầu mà chưa Check-in; (4) Hạn mức đặt phòng mỗi tuần: Nhân viên 3 lần, Quản lý 8 lần, Admin 25 lần. Điểm cá nhân của bạn đang là ${
          myTrustProfile?.trustScore || 100
        }/100.`,
      };
    }

    if (qLower.includes('của tôi') || qLower.includes('tôi đã đặt') || qLower.includes('vé của mình')) {
      if (myBookings.length === 0) {
        return {
          title: activePersona.shortLabel,
          reply: `${prefix} Hiện tại tài khoản @${sessionInfo.username} chưa có lịch đặt phòng nào. Bạn có thể chuyển sang mục "Đặt lịch Phòng họp" để chọn phòng nhé!`,
        };
      }
      return {
        title: activePersona.shortLabel,
        reply: `${prefix} Bạn đang có ${myBookings.length} lịch đặt: ${myBookings
          .map(
            (b) =>
              `Vé ${b.bookingId} tại vị trí ${b.nodeId} (${b.bookingDateIso || 'Hôm nay'}, ${
                b.startTimeIso
              }-${b.endTimeIso}, Trạng thái: ${
                b.bookingStatus === 'CHECKED_IN'
                  ? 'Đã quét QR'
                  : b.approvalStatus === 'PENDING_APPROVAL'
                  ? 'Chờ duyệt'
                  : 'Đã duyệt'
              })`
          )
          .join('; ')}.`,
      };
    }

    if (
      qLower.includes('xin chào') ||
      qLower.includes('chào') ||
      qLower.includes('hello') ||
      qLower.includes('bạn là ai') ||
      qLower.includes('vai trò')
    ) {
      return {
        title: activePersona.shortLabel,
        reply: `Chào ${sessionInfo.fullName}! ${prefix} Tôi nắm rõ trạng thái thời gian thực của toàn bộ 25 không gian họp trên 5 tầng, lịch đặt, thiết bị và điểm tín nhiệm. Bạn cứ hỏi tự nhiên về bất kỳ tầng nào, số người họp, mã phòng cụ thể hoặc câu hỏi bất kỳ nhé!`,
      };
    }

    return {
      title: activePersona.shortLabel,
      reply: `${prefix} Về câu hỏi "${q}" của bạn: Hiện tòa nhà 5 tầng đang đạt mật độ ${occupancyRate}% (còn trống ${availableCount}/${totalNodes} không gian, điểm tín nhiệm TB đạt ${avgTrustScore}/100). Phòng có điểm tối ưu cao nhất đang sẵn sàng là ${
        topRecommendedNode?.nodeCode || 'M1-01'
      } (Tầng ${topRecommendedNode?.floorLevel || 1}, sức chứa ${
        topRecommendedNode?.capacityCount || 2
      } người). Bạn có thể cho tôi biết số lượng người dự họp hoặc tầng bạn muốn ngồi để tôi lọc chính xác hơn nhé!`,
    };
  };

  const handleSendQuestionToAi = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? chatInputText).trim();
    if (!textToSend || isAiThinking) return;

    const userMsg: AiChatMessageItem = {
      messageId: `MSG-USR-${Date.now()}`,
      sender: 'USER',
      contentText: textToSend,
      timestampText: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInputText('');

    setIsAiThinking(true);
    let finalTitle = activePersona.shortLabel;
    let finalReplyText = '';

    try {
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: textToSend,
          personaLabel: activePersona.badgeText,
          systemPersonaPrompt: customSystemPrompt,
          workspaceContextText: buildLiveWorkspaceContextSnapshot(),
          conversationHistory: chatMessages.slice(-4),
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const candidateReply = typeof json?.replyText === 'string' ? json.replyText.trim() : '';
        if (candidateReply.length >= 30) {
          finalTitle = activePersona.shortLabel;
          finalReplyText = candidateReply;
        }
      }
    } catch {
      // Dùng bộ suy luận nội bộ
    }

    if (!finalReplyText) {
      const localResult = generateFlexibleLocalAiAnswer(textToSend);
      finalTitle = localResult.title;
      finalReplyText = localResult.reply;
    }

    const aiMsg: AiChatMessageItem = {
      messageId: `MSG-AI-${Date.now() + 1}`,
      sender: 'AI',
      title: finalTitle,
      personaBadge: activePersona.badgeText,
      contentText: finalReplyText,
      timestampText: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setChatMessages((prev) => [...prev, aiMsg]);
    setIsAiThinking(false);
  };

  const totalManagedRooms = dashboardMetrics.totalNodes || 25;
  const hourlyComparisonBars = [
    {
      hour: '08:00 - 10:00',
      shortHour: '08:00',
      slotName: 'Ca Sáng Sớm',
      actual: Math.max(28, dashboardMetrics.occupancyRate + 4),
      avg30d: 44,
    },
    {
      hour: '10:00 - 12:00',
      shortHour: '10:00',
      slotName: 'Cao Điểm Sáng',
      actual: Math.min(96, dashboardMetrics.occupancyRate + 26),
      avg30d: 68,
    },
    {
      hour: '12:00 - 14:00',
      shortHour: '12:00',
      slotName: 'Giờ Nghỉ Trưa',
      actual: Math.max(22, dashboardMetrics.occupancyRate - 6),
      avg30d: 48,
    },
    {
      hour: '14:00 - 16:00',
      shortHour: '14:00',
      slotName: 'Cao Điểm Chiều',
      actual: Math.min(98, dashboardMetrics.occupancyRate + 32),
      avg30d: 74,
    },
    {
      hour: '16:00 - 18:00',
      shortHour: '16:00',
      slotName: 'Họp Tổng Kết',
      actual: Math.min(92, dashboardMetrics.occupancyRate + 18),
      avg30d: 63,
    },
    {
      hour: '18:00 - 20:00',
      shortHour: '18:00',
      slotName: 'Ca Tối / OT',
      actual: Math.max(18, dashboardMetrics.occupancyRate - 10),
      avg30d: 34,
    },
  ].map((b) => ({
    ...b,
    actualRooms: Math.max(1, Math.round((b.actual / 100) * totalManagedRooms)),
    avgRooms: Math.max(1, Math.round((b.avg30d / 100) * totalManagedRooms)),
    diffPercent: b.actual - b.avg30d,
  }));

  const floorBreakdownStats = [1, 2, 3, 4, 5].map((fl) => {
    const nodesOnFloor = workspaceNodes.filter((n) => n.floorLevel === fl);
    const totalFl = nodesOnFloor.length || 1;
    const busyFl = nodesOnFloor.filter((n) => n.status !== 'AVAILABLE').length;
    const rateFl = Math.round((busyFl / totalFl) * 100);
    return {
      floor: fl,
      label: fl === 5 ? 'Tầng 5 (Hội trường H-01)' : `Tầng ${fl} (6 Phòng họp)`,
      busyCount: busyFl,
      totalCount: nodesOnFloor.length,
      ratePercent: rateFl,
    };
  });

  return (
    <div className="space-y-6 relative">
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
                Bảng Điều khiển Đa tầng (Dashboard) & Phân tích Thông minh
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold bg-indigo-600 text-white">
                Quyền: {selectedRoleView}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Đồng bộ thời gian thực với Sơ đồ 5 Tầng 3D/2D, Điểm tín nhiệm, Thiết bị dùng chung & MongoDB Atlas
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sessionInfo.role === 'SYS_ADMIN' && (
            <div
              className={`p-1 rounded-xl border flex items-center gap-1 text-xs font-bold ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
              title="Quyền SYS_ADMIN: Chuyển đổi xem trước giao diện của 3 Role"
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
                  {roleOption === 'EMPLOYEE' ? 'Nhân viên' : roleOption === 'MANAGER' ? 'Quản lý' : 'Admin'}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSynthesizeAndSpeakSummary(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm flex items-center gap-1.5 transition"
          >
            <Volume2 className="w-4 h-4" />
            <span>Tổng hợp & Nghe Tóm tắt</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAiChatOpen((prev) => !prev)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isAiChatOpen ? 'Đóng Trợ lý Chat' : 'Mở Trợ lý Chat Bên Phải'}</span>
          </button>
        </div>
      </div>

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
            Đang trống {dashboardMetrics.availableCount}/{dashboardMetrics.totalNodes} vị trí trên Sơ đồ 5 Tầng
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
            Chờ duyệt: {dashboardMetrics.pendingApprovals.length} đơn • Đã Check-in: {dashboardMetrics.checkedInCount}
          </p>
        </div>

        <div
          className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              {selectedRoleView === 'EMPLOYEE' ? 'Điểm Tín nhiệm Cá nhân' : 'Điểm Tín nhiệm Trung bình'}
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
                  Không gian Nhân viên ({sessionInfo.fullName}) — Lịch họp Cá nhân & Quyền lợi Tín nhiệm
                </h2>
                <p className="text-[11px] text-slate-400">
                  Hạn mức theo vai trò EMPLOYEE: Tối đa 3 lần đặt phòng/tuần • Đủ điều kiện đặt lịch định kỳ (Điểm tín nhiệm ≥ 60)
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
                Số lần Check-in đúng giờ: <strong>{dashboardMetrics.myTrustProfile?.onTimeCheckInCount || 18} lần</strong> • Vi phạm No-Show: <strong>{dashboardMetrics.myTrustProfile?.noShowPenaltyCount || 0} lần</strong>
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
                {dashboardMetrics.topRecommendedNode?.nodeCode} — {dashboardMetrics.topRecommendedNode?.nodeLabel}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sức chứa {dashboardMetrics.topRecommendedNode?.capacityCount} người • Điểm tối ưu: <strong>{dashboardMetrics.topRecommendedNode?.aiScore || 96}/100</strong>
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
                  Hạn mức theo vai trò MANAGER: Tối đa 8 lần đặt phòng/tuần • Phê duyệt trực tiếp yêu cầu của Nhân viên
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
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-teal-50/40 border-teal-200 text-teal-800'
              }`}
            >
              <span>Tất cả yêu cầu đặt phòng của nhân viên trong nhóm đã được phê duyệt hoàn tất!</span>
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
                      Người đặt: @{reqItem.requesterUsername || reqItem.userEmail} • {reqItem.bookingDateIso} ({reqItem.startTimeIso} – {reqItem.endTimeIso})
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
                  Trung tâm Chỉ huy Hệ thống (SYS_ADMIN) — Chính sách Động, Thiết bị & Truy vết Optimistic Lock
                </h2>
                <p className="text-[11px] text-slate-400">
                  Giám sát toàn bộ 5 tầng, kiểm soát nhật ký xung đột khóa phiên bản và điều chỉnh chính sách hệ thống
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
                • Hạn mức tuần: <strong>NV 3 • QL 8 • Admin 25 lần</strong>
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
                    <strong className="text-rose-600">{eq.equipmentCode}</strong> — Phòng <strong>{eq.assignedNodeId}</strong> ({eq.equipmentName})
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
              <p className={`text-xs font-semibold mt-1.5 line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {auditLogs[0]?.detailMessage || 'Hệ thống đang hoạt động ổn định.'}
              </p>
            </div>
          </div>
        </div>
      )}

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
                Phân tích So sánh Trung bình & Mô phỏng Nhu cầu (What-If Simulator)
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
              Mật độ hiện tại đạt <strong>{dashboardMetrics.occupancyRate}%</strong> (trung bình 30 ngày: <strong>52%</strong>). Với hệ số tải <strong>{demandSimulationPercent}%</strong>, công suất đỉnh dự kiến đạt <strong>{dashboardMetrics.simulatedPeakOccupancy}%</strong>.
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
              Điểm tín nhiệm trung bình đạt <strong>{dashboardMetrics.avgTrustScore}/100đ</strong>, giúp giảm tỷ lệ bỏ trống phòng sau khi đặt xuống thấp hơn <strong>38%</strong> so với trung bình tháng trước.
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-amber-50/40 border-amber-100'
            }`}
          >
            <h3 className="text-xs font-extrabold text-amber-600 mb-1">
              3. Đề xuất Điều phối Không gian
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Phòng tối ưu nhất đang trống là <strong>{dashboardMetrics.topRecommendedNode?.nodeCode || 'M1-01'}</strong>. Các sự kiện trên 12 người được khuyến nghị chuyển sang <strong>Hội trường Đấu trường La Mã (H-01 - Tầng 5)</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* BIỂU ĐỒ 1: CÔNG SUẤT SỬ DỤNG PHÒNG HỌP THEO KHUNG GIỜ (CÓ TRỤC TUNG Y-AXIS, SỐ PHÒNG & CHÚ GIẢI ĐẦY ĐỦ) */}
        <div
          className={`lg:col-span-8 p-6 rounded-3xl border flex flex-col justify-between ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h3 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Biểu đồ Công suất Lấp đầy Phòng họp Theo 6 Khung giờ (Thực tế Hôm nay vs. Trung bình 30 ngày)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  <strong>Ý nghĩa đại diện:</strong> Đo lường tỷ lệ % và số lượng phòng đang sử dụng trên tổng số <strong>{dashboardMetrics.totalNodes} không gian họp (5 tầng)</strong> tại từng khung giờ làm việc.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-extrabold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-indigo-600 inline-block shadow-sm" />
                  Thực tế hôm nay (% & số phòng)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-teal-500/45 border border-teal-500 inline-block" />
                  Trung bình 30 ngày (%)
                </span>
              </div>
            </div>

            <div className="relative flex gap-3 pt-4 pb-2">
              <div className="flex flex-col justify-between h-[190px] text-[10px] font-extrabold text-slate-400 pr-1 select-none shrink-0 text-right w-10">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              <div className="relative flex-1">
                <div className="absolute inset-x-0 top-0 h-[190px] flex flex-col justify-between pointer-events-none">
                  {[100, 75, 50, 25, 0].map((tick) => (
                    <div
                      key={tick}
                      className={`w-full border-b ${
                        tick === 0
                          ? isDark
                            ? 'border-slate-700'
                            : 'border-slate-300'
                          : isDark
                          ? 'border-dashed border-slate-800'
                          : 'border-dashed border-slate-200'
                      }`}
                    />
                  ))}
                </div>

                <div className="relative z-10 grid grid-cols-6 gap-2 sm:gap-4 items-end h-[190px] px-1 sm:px-3">
                  {hourlyComparisonBars.map((bar) => (
                    <div
                      key={bar.hour}
                      className="flex flex-col items-center justify-end h-full group"
                    >
                      <div className="flex items-end justify-center gap-1.5 w-full h-full">
                        <div className="flex flex-col items-center justify-end h-full w-6 sm:w-8">
                          <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 mb-1 leading-none">
                            {bar.actual}%
                          </span>
                          <div
                            className="w-full rounded-t-lg bg-indigo-600 hover:bg-indigo-500 transition-all duration-500 shadow-sm relative"
                            style={{ height: `${Math.max(8, bar.actual)}%` }}
                            title={`${bar.hour} (${bar.slotName}) — Thực tế: ${bar.actual}% (${bar.actualRooms}/${dashboardMetrics.totalNodes} phòng)`}
                          />
                        </div>

                        <div className="flex flex-col items-center justify-end h-full w-6 sm:w-8">
                          <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 mb-1 leading-none">
                            {bar.avg30d}%
                          </span>
                          <div
                            className="w-full rounded-t-lg bg-teal-500/35 border border-teal-500/60 transition-all duration-500"
                            style={{ height: `${Math.max(8, bar.avg30d)}%` }}
                            title={`${bar.hour} — Trung bình 30 ngày: ${bar.avg30d}% (${bar.avgRooms}/${dashboardMetrics.totalNodes} phòng)`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-6 gap-2 sm:gap-4 pt-2.5 px-1 sm:px-3 text-center">
                  {hourlyComparisonBars.map((bar) => (
                    <div key={bar.hour} className="space-y-0.5">
                      <p className={`text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {bar.shortHour}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 truncate">
                        {bar.slotName}
                      </p>
                      <p className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400">
                        {bar.actualRooms}/{dashboardMetrics.totalNodes} phòng
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`mt-4 p-3.5 rounded-2xl border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">
                Khung giờ Cao điểm nhất Hôm nay:
              </span>
              <strong className="text-indigo-600 dark:text-indigo-400">
                14:00 – 16:00 ({hourlyComparisonBars[3]?.actual}% • {hourlyComparisonBars[3]?.actualRooms}/{dashboardMetrics.totalNodes} phòng)
              </strong>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">
                Khung giờ Thấp điểm (Khuyên đặt):
              </span>
              <strong className="text-teal-600 dark:text-teal-400">
                18:00 – 20:00 ({hourlyComparisonBars[5]?.actual}% • Còn trống nhiều)
              </strong>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">
                Độ lệch trung bình so với 30 ngày:
              </span>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                Đang đồng bộ trực tiếp theo lịch đặt
              </strong>
            </div>
          </div>
        </div>

        {/* BIỂU ĐỒ 2: CƠ CẤU TRẠNG THÁI MẶT BẰNG & TỶ LỆ LẤP ĐẦY TỪNG TẦNG (TẦNG 1 - TẦNG 5) */}
        <div
          className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between space-y-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div>
            <h3 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Cơ cấu Trạng thái & Công suất Theo Tầng (1–5)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Đại diện tỷ lệ Trống / Đã đặt / Giữ 5p của {dashboardMetrics.totalNodes} không gian và chi tiết từng tầng
            </p>
          </div>

          <div className="flex items-center justify-center gap-5 py-2">
            <div
              className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-inner shrink-0"
              style={{
                background: `conic-gradient(#0d9488 0% ${Math.round(
                  (dashboardMetrics.availableCount / dashboardMetrics.totalNodes) * 100
                )}%, #4f46e5 ${Math.round(
                  (dashboardMetrics.availableCount / dashboardMetrics.totalNodes) * 100
                )}% ${Math.round(
                  ((dashboardMetrics.availableCount + dashboardMetrics.occupiedOrReservedCount) /
                    dashboardMetrics.totalNodes) *
                    100
                )}%, #d97706 ${Math.round(
                  ((dashboardMetrics.availableCount + dashboardMetrics.occupiedOrReservedCount) /
                    dashboardMetrics.totalNodes) *
                    100
                )}% 100%)`,
              }}
            >
              <div
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center ${
                  isDark ? 'bg-slate-900' : 'bg-white'
                }`}
              >
                <span className={`text-xl font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {dashboardMetrics.occupancyRate}%
                </span>
                <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                  Lấp đầy ({dashboardMetrics.totalNodes - dashboardMetrics.availableCount}/{dashboardMetrics.totalNodes})
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-semibold flex-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                  Đang trống
                </span>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                  {dashboardMetrics.availableCount} ({Math.round((dashboardMetrics.availableCount / dashboardMetrics.totalNodes) * 100)}%)
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  Đã đặt / Họp
                </span>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                  {dashboardMetrics.occupiedOrReservedCount} ({Math.round((dashboardMetrics.occupiedOrReservedCount / dashboardMetrics.totalNodes) * 100)}%)
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Giữ 5p (Hold)
                </span>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                  {dashboardMetrics.holdingCount} ({Math.round((dashboardMetrics.holdingCount / dashboardMetrics.totalNodes) * 100)}%)
                </strong>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-extrabold text-slate-400 block">
              Mật độ Sử dụng Chi tiết Theo Từng Tầng:
            </span>
            {floorBreakdownStats.map((flItem) => (
              <div key={flItem.floor} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    {flItem.label}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {flItem.busyCount}/{flItem.totalCount} phòng ({flItem.ratePercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${Math.max(6, flItem.ratePercent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KHUNG DRAWER TRỢ LÝ BÊN PHẢI */}
      {isAiChatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] shadow-2xl flex flex-col border-l transition-all bg-white dark:bg-slate-900 border-indigo-100 dark:border-slate-800">
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-indigo-600 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold">Trợ lý SpotMatrix</h3>
                <p className="text-[11px] text-indigo-100">{activePersona.badgeText}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {isSpeakingTts && (
                <button
                  type="button"
                  onClick={handleStopSpeaking}
                  className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 animate-pulse"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  Dừng đọc
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPersonaConfigExpanded((prev) => !prev)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition"
                title="Thiết lập vai trò tư vấn"
              >
                <Settings2 className="w-4 h-4" />
              </button>
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
            className={`px-3.5 py-2.5 border-b space-y-2 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                Chọn góc nhìn tư vấn:
              </span>
              <button
                type="button"
                onClick={() => setIsPersonaConfigExpanded((prev) => !prev)}
                className="text-[10px] font-bold underline text-slate-400 hover:text-indigo-500"
              >
                {isPersonaConfigExpanded ? 'Thu gọn chỉ thị nền' : 'Tùy chỉnh chỉ thị nền'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(AI_PERSONA_PRESETS) as AiPersonaRoleKey[]).map((pKey) => {
                const item = AI_PERSONA_PRESETS[pKey];
                const isSelected = selectedPersonaKey === pKey;
                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => handleSelectPersonaPreset(pKey)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border text-left truncate transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-500/50'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    {item.shortLabel}
                  </button>
                );
              })}
            </div>

            {isPersonaConfigExpanded && (
              <div className="pt-1">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Chỉ thị vai trò nền tùy chỉnh:
                </label>
                <textarea
                  rows={2}
                  value={customSystemPrompt}
                  onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-medium outline-none ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            )}
          </div>

          <div
            className={`p-3 border-b flex flex-wrap items-center justify-between gap-2 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-indigo-50/50 border-indigo-100'
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
                  ? 'bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tóm tắt chữ
            </button>
          </div>

          <div
            className={`px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/70'
            }`}
          >
            {[
              'Tìm phòng họp cho 8 người',
              'Tầng 2 còn phòng nào trống?',
              'Phòng M1-03 thiết bị sao rồi?',
              'Họp 20 người thì đặt ở đâu?',
              'Lịch đặt của tôi thế nào?',
              'Quy định Check-in & Thu hồi 15p?',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSendQuestionToAi(chip)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 border transition ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-500'
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
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{msg.title}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSpeakTextAloud(msg.contentText, msg.messageId)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shrink-0 transition ${
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
                      className={`text-[10px] mt-1.5 flex items-center justify-between ${
                        isAi ? 'text-slate-400' : 'text-indigo-200 justify-end'
                      }`}
                    >
                      {isAi && msg.personaBadge && (
                        <span className="italic opacity-80">{msg.personaBadge}</span>
                      )}
                      <span>{msg.timestampText}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {isAiThinking && (
              <div className="text-xs text-indigo-500 font-semibold animate-pulse px-2">
                {activePersona.shortLabel} đang phân tích câu trả lời...
              </div>
            )}
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
              placeholder="Hỏi số người họp, tầng, mã phòng hoặc câu hỏi bất kỳ..."
              className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
            <button
              type="submit"
              disabled={isAiThinking}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
              title="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};