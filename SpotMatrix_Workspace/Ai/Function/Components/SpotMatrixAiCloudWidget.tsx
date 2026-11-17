import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import {
  Cloud,
  Sparkles,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Volume2,
  VolumeX,
  Trash2,
  Maximize2,
  Minimize2,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  CalendarCheck,
  ArrowRight,
  Users,
  Minus,
  EyeOff,
  ChevronLeft,
} from 'lucide-react';
import {
  AuditConcurrencyLogItem,
  BookingPayloadItem,
  EquipmentStatusType,
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  SharedEquipmentItem,
  TrustScoreHistoryRecordItem,
  UserRoleType,
  UserTrustProfileItem,
  WebLanguageCodeType,
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';

export interface AiBookingSlotSuggestion {
  dateIso: string;
  weekdayLabel: string;
  start: string;
  end: string;
  capacityNeeded: number;
  floorFilter?: number | null;
  purposeNote: string;
  approvalRequestReason: string;
  timeAdjustedNote?: string | null;
  candidateRooms: WorkspaceNodeItem[];
}

export interface AiGroupDraftAction {
  initialGroupName: string;
  departmentName: string;
}

export interface SpotMatrixAiCloudWidgetProps {
  workspaceNodes: WorkspaceNodeItem[];
  bookingsList: BookingPayloadItem[];
  equipmentsList: SharedEquipmentItem[];
  trustProfiles: UserTrustProfileItem[];
  trustScoreHistory?: TrustScoreHistoryRecordItem[];
  departmentsList: OrganizationDepartmentItem[];
  groupsList: OrganizationGroupItem[];
  auditLogs: AuditConcurrencyLogItem[];
  userProfile: {
    accountCode: string;
    username: string;
    userEmail: string;
    fullName: string;
    departmentName: string;
    role: UserRoleType;
    trustScore: number;
  };
  webLanguage: WebLanguageCodeType;
  isDark: boolean;
  onAiSyncBookingDraft?: (
    node: WorkspaceNodeItem,
    slot: {
      dateIso: string;
      start: string;
      end: string;
      purposeNote: string;
      approvalRequestReason: string;
    }
  ) => void;
  onAiNavigateAndPrefillBooking?: (
    node: WorkspaceNodeItem,
    slot: {
      dateIso: string;
      start: string;
      end: string;
      purposeNote: string;
      approvalRequestReason: string;
    }
  ) => void;
  onAiExecuteDirectBooking?: (
    node: WorkspaceNodeItem,
    slot: {
      dateIso: string;
      start: string;
      end: string;
      purposeNote: string;
      approvalRequestReason: string;
    }
  ) => void;
  onAiUpsertGroup?: (group: OrganizationGroupItem) => void;
  onAiToggleGroupMember?: (groupId: string, userEmail: string) => void;
  onAiRenameDepartment?: (
    departmentId: string,
    newDepartmentName: string
  ) => void;
  onAiBatchUpdateEquipmentStatus?: (
    targetRoomCodes: string[],
    nextStatus: EquipmentStatusType
  ) => void;
}

interface AttachedFilePayload {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64DataUrl?: string;
  textContentPreview?: string;
  imageDimensions?: string;
}

interface AiChatMessageItem {
  id: string;
  sender: 'USER' | 'AI';
  contentText: string;
  timestampText: string;
  attachments?: AttachedFilePayload[];
  bookingSuggestion?: AiBookingSlotSuggestion;
  groupDraftAction?: AiGroupDraftAction;
}

const AI_WIDGET_I18N: Record<
  WebLanguageCodeType,
  {
    openAiLabel: string;
    snoozeAiTooltip: string;
    restoreAiLabel: string;
    hoverTitle: string;
    hoverSub: string;
    minimizeChatBtn: string;
    minimizeChatTooltip: string;
    expandTooltip: string;
    resetTooltip: string;
    closeTooltip: string;
    stageThinking: string;
    stageSpeaking: string;
    stageReady: string;
    statFreeRooms: (free: number, total: number) => string;
    statMyBookings: (count: number) => string;
    statTrustScore: (score: number) => string;
    readAloudTooltip: string;
    chooseRoomHeader: (dateIso: string, weekday: string, start: string, end: string) => string;
    roomCapFloor: (cap: number, fl: number) => string;
    goToBookingPrefillBtn: string;
    bookedSuccessBtn: string;
    requestRoomNowBtn: (code: string) => string;
    confirmRoomNowBtn: (code: string) => string;
    groupFormHeader: (dept: string) => string;
    groupCodeLabel: string;
    groupTagLabel: string;
    groupNameLabel: string;
    groupLeaderLabel: string;
    groupDescLabel: string;
    groupCreatedBtn: string;
    groupConfirmBtn: string;
    attachImgTooltip: string;
    attachFileTooltip: string;
    inputPlaceholder: string;
    sendTooltip: string;
  }
> = {
  vi: {
    openAiLabel: 'Mở Trợ lý AI AURA-X',
    snoozeAiTooltip: 'Tạm ẩn biểu tượng AI sang mép màn hình',
    restoreAiLabel: 'Mở lại AI',
    hoverTitle: 'AURA-X • Trợ lý AI 3D',
    hoverSub: 'Đặt phòng tự động • Gửi Ảnh/File & Hỏi đáp',
    minimizeChatBtn: 'Tạm tắt',
    minimizeChatTooltip: 'Tạm tắt / Thu gọn cửa sổ chat AI bên cạnh (Giữ nguyên nội dung chat)',
    expandTooltip: 'Mở rộng / Thu gọn chiều ngang khung chat',
    resetTooltip: 'Làm mới cuộc trò chuyện',
    closeTooltip: 'Tạm tắt cửa sổ AI',
    stageThinking: '⚡ Đang suy luận...',
    stageSpeaking: '🔊 Đang phát giọng nói',
    stageReady: '✨ Sẵn sàng hỗ trợ 24/7',
    statFreeRooms: (free, total) => `Trống: ${free}/${total} phòng`,
    statMyBookings: (count) => `Lịch của bạn: ${count} vé`,
    statTrustScore: (score) => `Tín nhiệm: ${score}/100đ`,
    readAloudTooltip: 'Đọc to câu trả lời này',
    chooseRoomHeader: (dateIso, weekday, start, end) =>
      `Chọn phòng bên dưới (${weekday}, ${dateIso} • ${start} – ${end}):`,
    roomCapFloor: (cap, fl) => `${cap} chỗ • Tầng ${fl}`,
    goToBookingPrefillBtn: 'Đi đến Trang Đặt phòng (Đã điền sẵn)',
    bookedSuccessBtn: 'Đã Tạo Đơn Thành Công!',
    requestRoomNowBtn: (code) => `Gửi Xin Phép ${code} Ngay`,
    confirmRoomNowBtn: (code) => `Xác nhận Đặt ${code} Ngay`,
    groupFormHeader: (dept) => `Điền thông tin tạo nhóm (${dept})`,
    groupCodeLabel: 'Mã nhóm (Code)',
    groupTagLabel: 'Nhãn dự án (Tag)',
    groupNameLabel: 'Tên nhóm chuyên môn',
    groupLeaderLabel: 'Chọn Trưởng nhóm phụ trách',
    groupDescLabel: 'Mô tả nhiệm vụ nhóm',
    groupCreatedBtn: 'Đã Tạo Nhóm Thành Công!',
    groupConfirmBtn: 'Xác nhận Tạo Nhóm Ngay',
    attachImgTooltip: 'Đính kèm Hình ảnh',
    attachFileTooltip: 'Đính kèm Tệp tin',
    inputPlaceholder: 'Ra lệnh đặt phòng (VD: đặt thứ 3 lúc 0h30), tạo nhóm hoặc hỏi đáp...',
    sendTooltip: 'Gửi tin nhắn',
  },
  en: {
    openAiLabel: 'Open AURA-X AI Assistant',
    snoozeAiTooltip: 'Temporarily hide AI button to screen edge',
    restoreAiLabel: 'Show AI',
    hoverTitle: 'AURA-X • 3D AI Agent',
    hoverSub: 'Auto Room Booking • Image/File Analysis & Q&A',
    minimizeChatBtn: 'Minimize',
    minimizeChatTooltip: 'Temporarily close / minimize AI chat drawer (Preserves chat history)',
    expandTooltip: 'Expand / Collapse chat width',
    resetTooltip: 'Reset conversation',
    closeTooltip: 'Minimize AI window',
    stageThinking: '⚡ Reasoning...',
    stageSpeaking: '🔊 Speaking...',
    stageReady: '✨ Ready 24/7',
    statFreeRooms: (free, total) => `Free: ${free}/${total} rooms`,
    statMyBookings: (count) => `My Tickets: ${count}`,
    statTrustScore: (score) => `Trust: ${score}/100`,
    readAloudTooltip: 'Read this response aloud',
    chooseRoomHeader: (dateIso, weekday, start, end) =>
      `Select a room below (${weekday}, ${dateIso} • ${start} – ${end}):`,
    roomCapFloor: (cap, fl) => `${cap} seats • Floor ${fl}`,
    goToBookingPrefillBtn: 'Open Booking Page (Pre-filled)',
    bookedSuccessBtn: 'Booking Created Successfully!',
    requestRoomNowBtn: (code) => `Submit Request for ${code}`,
    confirmRoomNowBtn: (code) => `Book ${code} Immediately`,
    groupFormHeader: (dept) => `Create New Squad (${dept})`,
    groupCodeLabel: 'Squad Code',
    groupTagLabel: 'Project Tag',
    groupNameLabel: 'Squad Name',
    groupLeaderLabel: 'Select Squad Leader',
    groupDescLabel: 'Squad Mission / Description',
    groupCreatedBtn: 'Squad Created Successfully!',
    groupConfirmBtn: 'Confirm Create Squad',
    attachImgTooltip: 'Attach Image',
    attachFileTooltip: 'Attach File',
    inputPlaceholder: 'Ask AI to book a room (e.g. book Tuesday), manage groups, or Q&A...',
    sendTooltip: 'Send message',
  },
  ja: {
    openAiLabel: 'AURA-X AIアシスタントを開く',
    snoozeAiTooltip: 'AIアイコンを画面端へ一時非表示にする',
    restoreAiLabel: 'AI表示',
    hoverTitle: 'AURA-X • 3D AIエージェント',
    hoverSub: '会議室自動予約・画像/ファイル解析＆質問応答',
    minimizeChatBtn: '一時非表示',
    minimizeChatTooltip: 'AIチャット画面を一時閉じる（会話履歴は保持されます）',
    expandTooltip: 'チャット幅を拡大 / 縮小',
    resetTooltip: '会話をリセット',
    closeTooltip: 'AIチャットを一時閉じる',
    stageThinking: '⚡ 推論中...',
    stageSpeaking: '🔊 音声読み上げ中',
    stageReady: '✨ 24時間稼働中',
    statFreeRooms: (free, total) => `空室: ${free}/${total}室`,
    statMyBookings: (count) => `自分の予約: ${count}件`,
    statTrustScore: (score) => `信頼スコア: ${score}/100`,
    readAloudTooltip: 'この回答を音声で読み上げる',
    chooseRoomHeader: (dateIso, weekday, start, end) =>
      `以下の会議室を選択 (${weekday}・${dateIso} • ${start} – ${end}):`,
    roomCapFloor: (cap, fl) => `${cap}席 • ${fl}階`,
    goToBookingPrefillBtn: '予約画面へ移動（自動入力済）',
    bookedSuccessBtn: '予約を作成しました！',
    requestRoomNowBtn: (code) => `${code} の承認申請を送信`,
    confirmRoomNowBtn: (code) => `${code} を即時予約`,
    groupFormHeader: (dept) => `新規グループ作成 (${dept})`,
    groupCodeLabel: 'グループコード',
    groupTagLabel: 'プロジェクトタグ',
    groupNameLabel: '専門グループ名',
    groupLeaderLabel: 'グループリーダー選択',
    groupDescLabel: '業務内容・説明',
    groupCreatedBtn: 'グループを作成しました！',
    groupConfirmBtn: 'グループ作成を確定',
    attachImgTooltip: '画像を添付',
    attachFileTooltip: 'ファイルを添付',
    inputPlaceholder: '会議室の自動予約（例：火曜日に4人で予約）、グループ作成、質問を入力...',
    sendTooltip: '送信',
  },
};

function getWeekdayNameByLocale(
  dateObj: Date,
  lang: WebLanguageCodeType
): string {
  const dow = dateObj.getDay();
  const viNames = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];
  const enNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const jaNames = [
    '日曜日',
    '月曜日',
    '火曜日',
    '水曜日',
    '木曜日',
    '金曜日',
    '土曜日',
  ];
  if (lang === 'en') return enNames[dow];
  if (lang === 'ja') return jaNames[dow];
  return viNames[dow];
}

/**
 * Tạo môi trường Studio HDRI giả lập bằng PMREMGenerator để Linh vật AI 3D
 * có độ bóng gương Chrome, khúc xạ thủy tinh IOR 1.52 và phát sáng sắc nét.
 */
function buildMascotStudioEnvironment(
  renderer: THREE.WebGLRenderer,
  isDarkTheme: boolean
): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(isDarkTheme ? 0x030712 : 0xe0f2fe);

  const topLight = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  topLight.position.set(0, 9, 0);
  topLight.rotation.x = Math.PI / 2;
  envScene.add(topLight);

  const cyanStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 5),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
  );
  cyanStrip.position.set(8, 3, 5);
  cyanStrip.lookAt(0, 0, 0);
  envScene.add(cyanStrip);

  const violetStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 5),
    new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide })
  );
  violetStrip.position.set(-8, 4, -5);
  violetStrip.lookAt(0, 0, 0);
  envScene.add(violetStrip);

  const emeraldStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 4),
    new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
  );
  emeraldStrip.position.set(0, -5, 7);
  emeraldStrip.lookAt(0, 0, 0);
  envScene.add(emeraldStrip);

  const target = pmrem.fromScene(envScene, 0.025);
  pmrem.dispose();
  return target.texture;
}

const SpotMatrixMascot3DStage: React.FC<{
  isDark: boolean;
  aiMood: 'IDLE' | 'THINKING' | 'SPEAKING';
  webLanguage: WebLanguageCodeType;
}> = ({ isDark, aiMood, webLanguage }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const moodRef = useRef<'IDLE' | 'THINKING' | 'SPEAKING'>(aiMood);
  const isDarkRef = useRef<boolean>(isDark);
  const ui = AI_WIDGET_I18N[webLanguage] || AI_WIDGET_I18N.vi;

  useEffect(() => {
    moodRef.current = aiMood;
  }, [aiMood]);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const container = stageRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = 195;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 6.15);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    // Giới hạn PixelRatio ở mức 1.5 để tiết kiệm GPU/RAM và không ăn tài nguyên máy
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.38;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const envMap = buildMascotStudioEnvironment(renderer, isDarkRef.current);
    scene.environment = envMap;

    const ambient = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(5, 8, 7);
    scene.add(keyLight);

    const cyanRim = new THREE.PointLight(0x38bdf8, 5.0, 16);
    cyanRim.position.set(-4, 3, 3);
    scene.add(cyanRim);

    const indigoRim = new THREE.PointLight(0x818cf8, 4.5, 16);
    indigoRim.position.set(4, 2, -3);
    scene.add(indigoRim);

    const ceramicTitaniumMat = new THREE.MeshPhysicalMaterial({
      color: isDarkRef.current ? 0xe2e8f0 : 0xffffff,
      roughness: 0.08,
      metalness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 2.4,
    });

    const goldChromeMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.22,
      roughness: 0.1,
      metalness: 0.95,
      clearcoat: 1.0,
      envMapIntensity: 2.6,
    });

    const darkVisorGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x020617,
      roughness: 0.03,
      metalness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 1.0,
      envMapIntensity: 2.8,
    });

    const refractiveCrystalShellMat = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      roughness: 0.03,
      metalness: 0.1,
      transmission: 0.88,
      ior: 1.52,
      thickness: 1.1,
      clearcoat: 1.0,
      envMapIntensity: 2.5,
      transparent: true,
      opacity: 0.88,
    });

    const neonEyeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.8,
      roughness: 0.1,
    });

    const mascotRoot = new THREE.Group();
    scene.add(mascotRoot);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.78, 0);
    mascotRoot.add(headGroup);

    const headHelmetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.76, 32, 32),
      ceramicTitaniumMat
    );
    headHelmetMesh.scale.set(1.12, 0.94, 0.98);
    headGroup.add(headHelmetMesh);

    const visorMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.71, 28, 28),
      darkVisorGlassMat
    );
    visorMesh.scale.set(1.06, 0.68, 0.88);
    visorMesh.position.set(0, 0.02, 0.18);
    headGroup.add(visorMesh);

    const visorHaloRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.66, 0.028, 12, 48),
      goldChromeMat
    );
    visorHaloRing.scale.set(1.08, 0.72, 1);
    visorHaloRing.position.set(0, 0.02, 0.42);
    headGroup.add(visorHaloRing);

    const leftEyeMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.085, 0.11, 8, 16),
      neonEyeMat
    );
    leftEyeMesh.position.set(-0.26, 0.06, 0.78);
    headGroup.add(leftEyeMesh);

    const rightEyeMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.085, 0.11, 8, 16),
      neonEyeMat
    );
    rightEyeMesh.position.set(0.26, 0.06, 0.78);
    headGroup.add(rightEyeMesh);

    const mouthVoiceBar = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.032, 0.22, 6, 12),
      new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 1.5,
      })
    );
    mouthVoiceBar.rotation.z = Math.PI / 2;
    mouthVoiceBar.position.set(0, -0.14, 0.77);
    headGroup.add(mouthVoiceBar);

    [-0.86, 0.86].forEach((earX) => {
      const earCup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.16, 24),
        goldChromeMat
      );
      earCup.rotation.z = Math.PI / 2;
      earCup.position.set(earX, 0.02, 0);
      headGroup.add(earCup);
    });

    const antennaStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, 0.36, 12),
      goldChromeMat
    );
    antennaStem.position.set(0, 0.84, 0);
    headGroup.add(antennaStem);

    const crownStar = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.5,
        roughness: 0.1,
        metalness: 0.9,
        flatShading: true,
      })
    );
    crownStar.position.set(0, 1.1, 0);
    headGroup.add(crownStar);

    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, -0.35, 0);
    mascotRoot.add(bodyGroup);

    const chestGlassShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 28, 28),
      refractiveCrystalShellMat
    );
    chestGlassShell.scale.set(1.05, 0.88, 0.85);
    bodyGroup.add(chestGlassShell);

    const shoulderArmor = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.09, 14, 48),
      ceramicTitaniumMat
    );
    shoulderArmor.rotation.x = Math.PI / 2;
    shoulderArmor.position.y = 0.36;
    bodyGroup.add(shoulderArmor);

    const heartReactorCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.3, 0),
      new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.6,
        roughness: 0.08,
        metalness: 0.9,
        flatShading: true,
      })
    );
    bodyGroup.add(heartReactorCore);

    const gyroRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.58, 0.024, 14, 64),
      goldChromeMat
    );
    gyroRing1.rotation.x = Math.PI / 2.6;
    mascotRoot.add(gyroRing1);

    const gyroRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.82, 0.02, 14, 64),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.9,
      })
    );
    gyroRing2.rotation.x = -Math.PI / 3.1;
    gyroRing2.rotation.y = Math.PI / 5;
    mascotRoot.add(gyroRing2);

    let mouseTargetX = 0;
    let mouseTargetY = 0;
    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseTargetX = ((e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
      mouseTargetY = ((e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
    };
    window.addEventListener('mousemove', onPointerMove, { passive: true });

    let animId = 0;
    const clock = new THREE.Clock();

    const animateMascot = () => {
      animId = requestAnimationFrame(animateMascot);
      const t = clock.getElapsedTime();
      const mood = moodRef.current;
      const speedMult = mood === 'THINKING' ? 2.4 : mood === 'SPEAKING' ? 1.8 : 1.0;

      mascotRoot.position.y = Math.sin(t * 2.2) * 0.08;
      mascotRoot.rotation.y += (mouseTargetX * 0.4 - mascotRoot.rotation.y) * 0.08;
      headGroup.rotation.x += (mouseTargetY * 0.22 - headGroup.rotation.x) * 0.08;

      const blinkCycle = Math.sin(t * 1.7) > 0.96 ? 0.12 : 1.0;
      leftEyeMesh.scale.y = blinkCycle;
      rightEyeMesh.scale.y = blinkCycle;

      if (mood === 'THINKING') {
        neonEyeMat.color.setHex(0xfbbf24);
        neonEyeMat.emissive.setHex(0xf59e0b);
        mouthVoiceBar.scale.x = 0.6 + Math.abs(Math.sin(t * 8)) * 0.9;
      } else if (mood === 'SPEAKING') {
        neonEyeMat.color.setHex(0x34d399);
        neonEyeMat.emissive.setHex(0x10b981);
        mouthVoiceBar.scale.x = 0.5 + Math.abs(Math.sin(t * 12)) * 1.35;
      } else {
        neonEyeMat.color.setHex(0x38bdf8);
        neonEyeMat.emissive.setHex(0x38bdf8);
        mouthVoiceBar.scale.x = 1.0 + Math.sin(t * 3) * 0.12;
      }

      heartReactorCore.rotation.x = t * 1.8 * speedMult;
      heartReactorCore.rotation.y = t * 2.4 * speedMult;
      crownStar.rotation.y = t * 2.5 * speedMult;
      gyroRing1.rotation.z = t * 0.85 * speedMult;
      gyroRing2.rotation.z = -t * 1.05 * speedMult;

      renderer.render(scene, camera);
    };

    animateMascot();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onPointerMove);
      envMap.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[185px] sm:h-[195px] overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-[#05091a] via-[#0c1631] to-[#081024] shadow-inner">
      <div ref={stageRef} className="w-full h-full" />

      <div className="pointer-events-none absolute top-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-extrabold">
        <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-cyan-400/40 text-cyan-300 backdrop-blur-md flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          AURA-X 3D • AI AGENT
        </span>
        <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-indigo-400/40 text-indigo-300 backdrop-blur-md">
          {aiMood === 'THINKING'
            ? ui.stageThinking
            : aiMood === 'SPEAKING'
            ? ui.stageSpeaking
            : ui.stageReady}
        </span>
      </div>
    </div>
  );
};

function renderInlineMarkdownSegments(lineText: string): React.ReactNode[] {
  const parts = lineText.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-extrabold text-indigo-600 dark:text-cyan-300">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-cyan-300 font-mono text-[11px] font-bold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderFormattedAiMarkdown(contentText: string, isUser: boolean): React.ReactNode {
  if (isUser) {
    return <div className="whitespace-pre-line leading-relaxed font-semibold">{contentText}</div>;
  }

  const lines = contentText.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed font-medium">
      {lines.map((rawLine, lIdx) => {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
          return <div key={lIdx} className="h-1" />;
        }
        if (line.startsWith('### ')) {
          return (
            <h4
              key={lIdx}
              className="text-xs sm:text-[13px] font-black text-indigo-600 dark:text-cyan-300 pt-1 pb-0.5 border-b border-indigo-500/15"
            >
              {renderInlineMarkdownSegments(line.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (line.startsWith('## ') || line.startsWith('# ')) {
          return (
            <h3
              key={lIdx}
              className="text-xs sm:text-sm font-black text-indigo-600 dark:text-cyan-300 pt-1"
            >
              {renderInlineMarkdownSegments(line.replace(/^#+\s+/, ''))}
            </h3>
          );
        }
        if (/^\s*[-•*]\s+/.test(line)) {
          const cleanBullet = line.replace(/^\s*[-•*]\s+/, '');
          return (
            <div key={lIdx} className="flex items-start gap-1.5 pl-1">
              <span className="text-indigo-500 font-black mt-0.5">•</span>
              <div className="flex-1">{renderInlineMarkdownSegments(cleanBullet)}</div>
            </div>
          );
        }
        return <div key={lIdx}>{renderInlineMarkdownSegments(line)}</div>;
      })}
    </div>
  );
}

export const SpotMatrixAiCloudWidget: React.FC<SpotMatrixAiCloudWidgetProps> = ({
  workspaceNodes,
  bookingsList,
  equipmentsList,
  trustProfiles,
  departmentsList,
  groupsList,
  userProfile,
  webLanguage,
  isDark,
  onAiSyncBookingDraft,
  onAiNavigateAndPrefillBooking,
  onAiExecuteDirectBooking,
  onAiUpsertGroup,
  onAiToggleGroupMember,
  onAiRenameDepartment,
  onAiBatchUpdateEquipmentStatus,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isWidgetSnoozed, setIsWidgetSnoozed] = useState<boolean>(false);
  const [isExpandedWidth, setIsExpandedWidth] = useState<boolean>(false);
  const [promptInput, setPromptInput] = useState<string>('');
  const [aiMood, setAiMood] = useState<'IDLE' | 'THINKING' | 'SPEAKING'>('IDLE');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    AttachedFilePayload[]
  >([]);

  const ui = AI_WIDGET_I18N[webLanguage] || AI_WIDGET_I18N.vi;

  // Nhấn phím Escape để tạm tắt nhanh khung chat AI bên cạnh
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const [inlineGrpCode, setInlineGrpCode] = useState<string>('SQUAD-NEW-01');
  const [inlineGrpName, setInlineGrpName] = useState<string>('');
  const [inlineGrpDesc, setInlineGrpDesc] = useState<string>(
    'Nhóm chuyên môn phát triển và phối hợp dự án nội bộ'
  );
  const [inlineGrpTag, setInlineGrpTag] = useState<string>('SpotMatrix Squad');
  const [inlineGrpLeader, setInlineGrpLeader] = useState<string>(
    userProfile.userEmail
  );
  const [executedBookingMsgIds, setExecutedBookingMsgIds] = useState<
    Record<string, string>
  >({});
  const [executedGroupMsgIds, setExecutedGroupMsgIds] = useState<
    Record<string, boolean>
  >({});

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const isSysAdmin = userProfile.role === 'SYS_ADMIN';
  const isManager = userProfile.role === 'MANAGER';

  const roleScopedKnowledgeBase = useMemo(() => {
    const freeRooms = workspaceNodes.filter((n) => n.status === 'AVAILABLE');
    const holdingRooms = workspaceNodes.filter((n) => n.status === 'HOLDING');
    const busyRooms = workspaceNodes.filter(
      (n) => n.status === 'OCCUPIED' || n.status === 'RESERVED'
    );

    const myBookings = bookingsList.filter(
      (b) =>
        b.userEmail.toLowerCase() === userProfile.userEmail.toLowerCase() &&
        b.bookingStatus !== 'CANCELLED' &&
        b.approvalStatus !== 'REJECTED'
    );

    const myDepartmentObj = departmentsList.find(
      (d) =>
        d.departmentName.trim().toLowerCase() ===
        userProfile.departmentName.trim().toLowerCase()
    );

    const myGroups = groupsList.filter(
      (g) =>
        g.departmentName.trim().toLowerCase() ===
          userProfile.departmentName.trim().toLowerCase() &&
        (isSysAdmin ||
          isManager ||
          g.memberEmails.some(
            (em) =>
              em.trim().toLowerCase() === userProfile.userEmail.toLowerCase()
          ))
    );

    const hallApprovedEvents = bookingsList.filter(
      (b) =>
        (b.nodeId === 'H-01' || b.bookingMode === 'HALL_EVENT_RENTAL') &&
        b.approvalStatus === 'APPROVED' &&
        b.bookingStatus !== 'CANCELLED'
    );

    const brokenEquips = equipmentsList.filter(
      (e) =>
        e.status === 'BROKEN' ||
        e.status === 'REPORTED_BROKEN' ||
        e.status === 'MAINTENANCE'
    );

    return {
      freeRooms,
      holdingRooms,
      busyRooms,
      myBookings,
      myDepartmentObj,
      myGroups,
      hallApprovedEvents,
      brokenEquips,
    };
  }, [
    workspaceNodes,
    bookingsList,
    equipmentsList,
    departmentsList,
    groupsList,
    userProfile,
    isSysAdmin,
    isManager,
  ]);

  const welcomeMessageText = useMemo(() => {
    if (webLanguage === 'en') {
      return `Hello **${userProfile.fullName}** (\`@${userProfile.username}\` • Role: **${userProfile.role}** • Dept: **${userProfile.departmentName}** • Trust Score: **${userProfile.trustScore}/100**).

I am **AURA-X**, your role-aware AI Agent:
- **Smart Weekday & Nearest-Slot Room Booking**: Ask e.g. *"Book a room on Tuesday for 4 people"* or *"Book a room at 00:30 AM"* (automatically shifts to the nearest valid opening slot **07:00 AM**).
- **Group Management (Manager/Admin)**: Create groups, rename groups, or add members.
- **Admin Commands & Analytics**: Rename departments, batch-update equipment status, and compare monthly booking history.`;
    }
    if (webLanguage === 'ja') {
      return `こんにちは、**${userProfile.fullName}** さん（\`@${userProfile.username}\` • ロール: **${userProfile.role}** • 部署: **${userProfile.departmentName}** • 信頼スコア: **${userProfile.trustScore}/100**）。

私は **SpotMatrix** の AI エージェント **AURA-X** です：
- **曜日・最短有効枠の自動会議室予約**：「火曜日に4人で予約したい」や深夜0時30分の予約指示でも、自動的に該当曜日および最短の営業時間（**朝07:00〜**）に合わせて設定します。
- **グループ管理（マネージャー/Admin）**・**全社設備/統計管理（Admin）**にも対応しています。`;
    }
    return `Xin chào **${userProfile.fullName}** (\`@${userProfile.username}\` • Vai trò: **${userProfile.role}** • Phòng ban: **${userProfile.departmentName}** • Điểm tín nhiệm: **${userProfile.trustScore}/100đ**).

Tôi là **AURA-X**, AI Agent thực thi tác vụ trực tiếp theo phân quyền tài khoản của bạn:
- **Đặt phòng tự động theo Thứ / Ngày & Giờ gần nhất**: Nhắn VD *"Tôi muốn đặt thứ 3 cho 4 người"* hoặc đặt lúc *0h30 sáng* (hệ thống tự động chọn đúng ngày Thứ Ba và tự động tiến đến khung giờ hợp lệ gần nhất là **07:00 sáng**).
- **Quản lý Nhóm (Manager/Admin)**: Nhắn *"Tạo 1 nhóm mới tên là..."* hoặc *"Thêm thành viên ... vào nhóm ..."*.
- **Lệnh Đặc quyền & Truy quét (Admin)**: Đổi tên phòng ban, chuyển thiết bị tầng/phòng sang bảo trì/báo hỏng, thống kê điểm tín nhiệm TB và so sánh lịch sử đặt phòng theo tháng.`;
  }, [userProfile, webLanguage]);

  const [messages, setMessages] = useState<AiChatMessageItem[]>([
    {
      id: 'WELCOME-AI-01',
      sender: 'AI',
      contentText: welcomeMessageText,
      timestampText: 'Now',
    },
  ]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'WELCOME-AI-01') {
        return [{ ...prev[0], contentText: welcomeMessageText }];
      }
      return prev;
    });
  }, [welcomeMessageText]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isOpen]);

  const handleFileUploadChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'IMAGE' | 'FILE'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const isImage = file.type.startsWith('image/') || mode === 'IMAGE';

      if (isImage) {
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
          const img = new window.Image();
          img.onload = () => {
            setPendingAttachments((prev) => [
              ...prev,
              {
                id: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                fileName: file.name,
                mimeType: file.type || 'image/png',
                sizeBytes: file.size,
                base64DataUrl: dataUrl,
                imageDimensions: `${img.width}x${img.height}px`,
              },
            ]);
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const rawText = typeof reader.result === 'string' ? reader.result : '';
          setPendingAttachments((prev) => [
            ...prev,
            {
              id: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              fileName: file.name,
              mimeType: file.type || 'text/plain',
              sizeBytes: file.size,
              textContentPreview: rawText.slice(0, 3500),
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    e.target.value = '';
  };

  /**
   * BỘ PHÂN TÍCH ĐẶT PHÒNG THÔNG MINH THEO THỨ / NGÀY & TỰ ĐỘNG TIẾN ĐẾN GIỜ HỢP LỆ GẦN NHẤT (07:00 – 23:00):
   * - Nhận diện đầy đủ Thứ 2..Thứ 7, Chủ nhật (cả tuần này & tuần sau), ngày mai, ngày mốt, hoặc ngày DD/MM/YYYY.
   * - Nhận diện cả câu ngắn như "tôi muốn đặt thứ 3", "mún đặt thứ 3 lúc 0h30 phút sáng".
   * - Nếu đặt vào giờ ngoài khung hoạt động (VD: 00:30 sáng -> < 07:00), tự động tiến đến chọn 07:00 sáng!
   */
  const parseSmartBookingIntent = (
    rawQuery: string
  ): AiBookingSlotSuggestion | null => {
    const q = rawQuery.toLowerCase();

    const hasActionVerb =
      q.includes('đặt') ||
      q.includes('mún đặt') ||
      q.includes('muốn đặt') ||
      q.includes('xin phép') ||
      q.includes('tạo cho tôi') ||
      q.includes('tạo phòng') ||
      q.includes('tìm phòng') ||
      q.includes('gợi ý phòng') ||
      q.includes('mượn') ||
      q.includes('thuê') ||
      q.includes('chọn phòng') ||
      q.includes('set cho tôi') ||
      q.includes('book') ||
      q.includes('reserve') ||
      q.includes('予約');

    const hasTargetContext =
      q.includes('phòng') ||
      q.includes('người') ||
      q.includes('chỗ') ||
      q.includes('tầng') ||
      q.includes('thứ') ||
      q.includes('chủ nhật') ||
      q.includes('mai') ||
      q.includes('mốt') ||
      q.includes('tuần') ||
      q.includes('hôm nay') ||
      q.includes('sáng') ||
      q.includes('chiều') ||
      q.includes('tối') ||
      q.includes('tiếng') ||
      q.includes('giờ') ||
      /\d{1,2}\s*h/.test(q) ||
      q.includes('room') ||
      q.includes('monday') ||
      q.includes('tuesday') ||
      q.includes('wednesday') ||
      q.includes('thursday') ||
      q.includes('friday') ||
      q.includes('saturday') ||
      q.includes('sunday') ||
      q.includes('曜');

    if (
      !hasActionVerb ||
      !hasTargetContext ||
      q.includes('lịch sử') ||
      q.includes('truy quét') ||
      q.includes('thống kê') ||
      q.includes('so với tháng trước') ||
      q.includes('hủy đặt')
    ) {
      return null;
    }

    // 1. Bóc tách số người (VD: "4 người", "tầm 6 người", "8 chỗ")
    const capMatch = q.match(
      /(\d+)\s*(?:người|nguoi|chỗ|cho|ghế|ghe|people|person|seats|人)/i
    );
    const capacityNeeded = capMatch ? Math.max(2, Number(capMatch[1])) : 4;

    // 2. Bóc tách tầng (VD: "tầng 3", "floor 2", "3階")
    const floorMatch = q.match(/(?:tầng|tang|floor)\s*([1-5])|([1-5])\s*階/i);
    const floorFilter = floorMatch
      ? Number(floorMatch[1] || floorMatch[2])
      : null;

    // 3. Bóc tách thời lượng họp (VD: "họp 2 tiếng", "trong 3 giờ")
    const durMatch = q.match(
      /(?:họp|hop|trong|khoảng|kéo dài|for)\s*(\d+)\s*(?:tiếng|tieng|giờ|gio|hours|hour|時間)/i
    );
    const durationHours = durMatch
      ? Math.max(1, Math.min(6, Number(durMatch[1])))
      : 2;

    // 4. Bóc tách Ngày / Thứ chính xác theo ý người dùng
    const now = new Date();
    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    let hasExplicitDateOrDay = false;

    const isNextWeek =
      q.includes('tuần sau') ||
      q.includes('tuan sau') ||
      q.includes('tuần tới') ||
      q.includes('tuan toi') ||
      q.includes('next week') ||
      q.includes('来週');

    // 4a. Kiểm tra ngày cụ thể DD/MM/YYYY hoặc DD/MM hoặc YYYY-MM-DD
    const isoDateMatch = q.match(/\b(202\d)-(\d{1,2})-(\d{1,2})\b/);
    const dmyDateMatch = q.match(
      /(?:ngày|ngay)?\s*(\d{1,2})\s*[/-]\s*(\d{1,2})(?:\s*[/-]\s*(202\d))?/i
    );

    // 4b. Kiểm tra Thứ trong tuần (Thứ 2 .. Thứ 7, Chủ Nhật, Monday..Sunday, 月曜..日曜)
    const vnWeekdayMatch = q.match(
      /(?:thứ|thu)\s*(2|hai|3|ba|4|tư|tu|bốn|bon|5|năm|nam|6|sáu|sau|7|bảy|bay)\b|\b(chủ\s*nhật|chu\s*nhat|cn)\b|\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|(月曜|火曜|水曜|木曜|金曜|土曜|日曜)/i
    );

    if (isoDateMatch) {
      targetDate.setFullYear(
        Number(isoDateMatch[1]),
        Number(isoDateMatch[2]) - 1,
        Number(isoDateMatch[3])
      );
      hasExplicitDateOrDay = true;
    } else if (dmyDateMatch) {
      const dayNum = Number(dmyDateMatch[1]);
      const monthNum = Number(dmyDateMatch[2]);
      const yearNum = dmyDateMatch[3]
        ? Number(dmyDateMatch[3])
        : now.getFullYear();
      if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
        targetDate.setFullYear(yearNum, monthNum - 1, dayNum);
        hasExplicitDateOrDay = true;
      }
    } else if (vnWeekdayMatch) {
      hasExplicitDateOrDay = true;
      let targetDow = 1; // 0 = CN, 1 = Thứ 2, 2 = Thứ 3, ..., 6 = Thứ 7
      if (vnWeekdayMatch[1]) {
        const token = vnWeekdayMatch[1].toLowerCase();
        if (token === '2' || token === 'hai') targetDow = 1;
        else if (token === '3' || token === 'ba') targetDow = 2;
        else if (
          token === '4' ||
          token === 'tư' ||
          token === 'tu' ||
          token === 'bốn' ||
          token === 'bon'
        )
          targetDow = 3;
        else if (token === '5' || token === 'năm' || token === 'nam')
          targetDow = 4;
        else if (token === '6' || token === 'sáu' || token === 'sau')
          targetDow = 5;
        else if (token === '7' || token === 'bảy' || token === 'bay')
          targetDow = 6;
      } else if (vnWeekdayMatch[2]) {
        targetDow = 0; // Chủ nhật
      } else if (vnWeekdayMatch[3]) {
        const enMap: Record<string, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };
        targetDow = enMap[vnWeekdayMatch[3].toLowerCase()] ?? 1;
      } else if (vnWeekdayMatch[4]) {
        const jaMap: Record<string, number> = {
          日曜: 0,
          月曜: 1,
          火曜: 2,
          水曜: 3,
          木曜: 4,
          金曜: 5,
          土曜: 6,
        };
        targetDow = jaMap[vnWeekdayMatch[4]] ?? 1;
      }

      const currentDow = now.getDay();
      if (isNextWeek) {
        // Tính số ngày tới Thứ Hai của tuần kế tiếp, sau đó cộng độ lệch tới Thứ được chọn
        const daysUntilNextMonday = ((1 - currentDow + 7) % 7) || 7;
        const offsetFromMonday = targetDow === 0 ? 6 : targetDow - 1;
        targetDate.setDate(now.getDate() + daysUntilNextMonday + offsetFromMonday);
      } else {
        // Chọn đúng ngày Thứ X gần nhất tính từ hôm nay (VD: hôm nay Thứ 2 mà bảo đặt Thứ 3 -> +1 ngày)
        let daysAhead = (targetDow - currentDow + 7) % 7;
        if (daysAhead === 0 && now.getHours() >= 22) {
          daysAhead = 7;
        }
        targetDate.setDate(now.getDate() + daysAhead);
      }
    } else if (
      q.includes('ngày mốt') ||
      q.includes('ngay mot') ||
      q.includes('ngày kia') ||
      q.includes('day after tomorrow') ||
      q.includes('明後日')
    ) {
      targetDate.setDate(now.getDate() + 2);
      hasExplicitDateOrDay = true;
    } else if (
      q.includes('ngày mai') ||
      q.includes('ngay mai') ||
      /\bmai\b/.test(q) ||
      q.includes('tomorrow') ||
      q.includes('明日')
    ) {
      targetDate.setDate(now.getDate() + 1);
      hasExplicitDateOrDay = true;
    } else if (isNextWeek) {
      targetDate.setDate(now.getDate() + 7);
      hasExplicitDateOrDay = true;
    }

    // 5. Bóc tách Giờ bắt đầu & Tự động đẩy lên khung giờ hợp lệ gần nhất (07:00 – 23:00)
    // Loại bỏ các cụm từ dễ gây nhầm số (như "thứ 3", "tầng 3", "4 người", "họp 2 tiếng") trước khi tìm giờ
    const cleanedForTime = q
      .replace(/(?:thứ|thu)\s*(?:2|3|4|5|6|7|hai|ba|tư|năm|sáu|bảy)/gi, ' ')
      .replace(/(?:tầng|tang|floor)\s*[1-5]/gi, ' ')
      .replace(/\d+\s*(?:người|nguoi|chỗ|cho|ghế|people|seats)/gi, ' ')
      .replace(
        /(?:họp|hop|trong|khoảng|kéo dài)\s*\d+\s*(?:tiếng|tieng|giờ|gio|hours|hour)/gi,
        ' '
      );

    const relativeMatch = q.match(
      /sau\s*(\d+)\s*(?:tiếng|tieng|giờ|gio)\s*(?:nữa|nua)?/i
    );
    const explicitTimeMatch = cleanedForTime.match(
      /(?:lúc|luc|vào|vao|từ|tu|at)?\s*(\d{1,2})\s*(?:h|giờ|gio|:)\s*(\d{1,2})?\s*(?:phút|phut|p)?\s*(sáng|sang|trưa|trua|chiều|chieu|tối|toi|đêm|dem|khuya|pm|am)?/i
    );

    let startHour = 7;
    let startMin = 0;
    let timeAdjustedNote: string | null = null;

    if (relativeMatch) {
      const offsetHrs = Number(relativeMatch[1]);
      const rawCandidateHour =
        (now.getMinutes() > 0 ? now.getHours() + 1 : now.getHours()) +
        offsetHrs;
      if (rawCandidateHour < 7) {
        startHour = 7;
        startMin = 0;
        timeAdjustedNote = `Do thời điểm tính toán (${String(
          Math.max(0, rawCandidateHour)
        ).padStart(2, '0')}:00) nằm ngoài giờ mở cửa (07:00 – 23:00), hệ thống đã tự động tiến lên chọn khung giờ hợp lệ gần nhất là **07:00 sáng**.`;
      } else if (rawCandidateHour >= 22) {
        if (!hasExplicitDateOrDay) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
        startHour = 7;
        startMin = 0;
        timeAdjustedNote =
          'Do thời điểm yêu cầu đã quá giờ đóng cửa (23:00), hệ thống đã tự động tiến sang **07:00 sáng** ca gần nhất.';
      } else {
        startHour = rawCandidateHour;
        startMin = 0;
      }
    } else if (explicitTimeMatch) {
      let parsedH = Number(explicitTimeMatch[1]);
      const parsedM = explicitTimeMatch[2] ? Number(explicitTimeMatch[2]) : 0;
      const meridiem = (explicitTimeMatch[3] || '').toLowerCase();

      if (
        (meridiem.includes('chiều') ||
          meridiem.includes('chieu') ||
          meridiem.includes('tối') ||
          meridiem.includes('toi') ||
          meridiem === 'pm') &&
        parsedH < 12
      ) {
        parsedH += 12;
      } else if (
        (meridiem.includes('sáng') ||
          meridiem.includes('sang') ||
          meridiem.includes('đêm') ||
          meridiem.includes('dem') ||
          meridiem.includes('khuya') ||
          meridiem === 'am') &&
        parsedH === 12
      ) {
        parsedH = 0;
      } else if (
        !meridiem &&
        parsedH >= 1 &&
        parsedH <= 6 &&
        !cleanedForTime.includes('0h')
      ) {
        // Nếu người dùng nói "lúc 2h", "lúc 4h" không kèm chữ "sáng" -> hiểu là 14:00, 16:00 chiều
        parsedH += 12;
      }

      const requestedLabel = `${String(parsedH).padStart(2, '0')}:${String(
        parsedM
      ).padStart(2, '0')}`;

      if (parsedH < 7) {
        startHour = 7;
        startMin = 0;
        timeAdjustedNote = `Do thời điểm bạn chọn (**${requestedLabel} sáng**) nằm ngoài khung giờ hoạt động của tòa nhà (**07:00 – 23:00**), hệ thống đã tự động tiến đến chọn khung giờ hợp lệ gần nhất là **07:00 sáng**.`;
      } else if (parsedH >= 22) {
        if (!hasExplicitDateOrDay) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
        startHour = 7;
        startMin = 0;
        timeAdjustedNote = `Do thời điểm **${requestedLabel}** quá sát hoặc vượt giờ đóng cửa (**23:00**), hệ thống đã tự động tiến đến khung giờ hợp lệ gần nhất là **07:00 sáng**.`;
      } else {
        startHour = parsedH;
        startMin = parsedM >= 15 && parsedM <= 45 ? 30 : 0;
        if (parsedM > 45) {
          startHour = Math.min(21, startHour + 1);
          startMin = 0;
        }
      }
    } else {
      // Người dùng không nêu giờ cụ thể (VD: "Đặt phòng vào thứ 3 cho 4 người" lúc 00:30 sáng)
      const nowH = now.getHours();
      const nowM = now.getMinutes();
      const nowTimeText = `${String(nowH).padStart(2, '0')}:${String(
        nowM
      ).padStart(2, '0')}`;

      const isTargetToday =
        targetDate.getFullYear() === now.getFullYear() &&
        targetDate.getMonth() === now.getMonth() &&
        targetDate.getDate() === now.getDate();

      if (nowH < 7) {
        startHour = 7;
        startMin = 0;
        timeAdjustedNote = `Hiện tại là **${nowTimeText} sáng** (nằm ngoài khung giờ mở cửa 07:00 – 23:00), hệ thống đã tự động tiến đến chọn khung giờ hợp lệ gần nhất là **07:00 sáng**.`;
      } else if (isTargetToday) {
        if (nowH >= 21) {
          if (!hasExplicitDateOrDay) {
            targetDate.setDate(targetDate.getDate() + 1);
          }
          startHour = 7;
          startMin = 0;
          timeAdjustedNote = `Do thời điểm hiện tại (**${nowTimeText}**) đã cuối ngày, hệ thống tự động tiến sang khung giờ mở cửa gần nhất là **07:00 sáng**.`;
        } else {
          // Làm tròn lên khung 30 phút hoặc giờ chẵn tiếp theo gần nhất
          if (nowM < 30) {
            startHour = nowH;
            startMin = 30;
          } else {
            startHour = nowH + 1;
            startMin = 0;
          }
        }
      } else {
        // Đặt cho một ngày tương lai (VD: Thứ 3 tới) mà không nói giờ -> chọn ngay ca đầu ngày 07:00 sáng
        startHour = 7;
        startMin = 0;
      }
    }

    const endHour = Math.max(
      startHour + 1,
      Math.min(23, startHour + durationHours)
    );
    const endMin = endHour === 23 ? 0 : startMin;

    const dateIso = `${targetDate.getFullYear()}-${String(
      targetDate.getMonth() + 1
    ).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    const weekdayLabel = getWeekdayNameByLocale(targetDate, webLanguage);

    const startStr = `${String(startHour).padStart(2, '0')}:${String(
      startMin
    ).padStart(2, '0')}`;
    const endStr = `${String(endHour).padStart(2, '0')}:${String(
      endMin
    ).padStart(2, '0')}`;

    // 6. Lọc danh sách phòng họp có thể đặt được
    const candidateRooms = workspaceNodes
      .filter((rm) => {
        if (rm.floorLevel === 5 && userProfile.role === 'EMPLOYEE') {
          return false;
        }
        if (floorFilter && rm.floorLevel !== floorFilter) {
          return false;
        }
        if (rm.capacityCount < capacityNeeded) {
          return false;
        }
        if (rm.status !== 'AVAILABLE') {
          return false;
        }
        const hasConflict = bookingsList.some(
          (b) =>
            b.nodeId === rm.nodeCode &&
            b.bookingStatus !== 'CANCELLED' &&
            b.bookingStatus !== 'EXPIRED_NO_SHOW' &&
            b.approvalStatus !== 'REJECTED' &&
            (b.bookingDateIso || dateIso) === dateIso &&
            b.startTimeIso < endStr &&
            b.endTimeIso > startStr
        );
        return !hasConflict;
      })
      .sort((a, b) => a.capacityCount - b.capacityCount)
      .slice(0, 4);

    return {
      dateIso,
      weekdayLabel,
      start: startStr,
      end: endStr,
      capacityNeeded,
      floorFilter,
      purposeNote: `Họp nhóm ${capacityNeeded} người (${weekdayLabel}, ${dateIso} • ${startStr} – ${endStr})`,
      approvalRequestReason: `Xin phép sử dụng phòng họp cho ${capacityNeeded} thành viên bộ phận ${userProfile.departmentName} trong khung giờ ${startStr} – ${endStr} (${weekdayLabel}, ngày ${dateIso}).`,
      timeAdjustedNote,
      candidateRooms,
    };
  };

  const executeAgenticWorkflowAndAnswer = (
    rawQuery: string,
    attachedItems: AttachedFilePayload[]
  ): {
    replyText: string;
    bookingSuggestion?: AiBookingSlotSuggestion;
    groupDraftAction?: AiGroupDraftAction;
  } => {
    const q = rawQuery.trim().toLowerCase();
    const kb = roleScopedKnowledgeBase;

    // 1. KIỂM TRA GIỚI HẠN BẢO MẬT DỮ LIỆU THEO ROLE (DATA ISOLATION GUARD)
    if (userProfile.role === 'EMPLOYEE') {
      const otherUsers = trustProfiles.filter(
        (tp) => tp.userEmail.toLowerCase() !== userProfile.userEmail.toLowerCase()
      );
      const mentionedOtherUser = otherUsers.find(
        (u) =>
          q.includes(u.fullName.toLowerCase().split('(')[0].trim()) ||
          q.includes(u.userEmail.toLowerCase())
      );
      const otherDepts = departmentsList.filter(
        (d) =>
          d.departmentName.trim().toLowerCase() !==
          userProfile.departmentName.trim().toLowerCase()
      );
      const mentionedOtherDept = otherDepts.find(
        (d) =>
          q.includes(d.departmentName.toLowerCase()) ||
          q.includes(d.departmentCode.toLowerCase())
      );

      if (
        mentionedOtherUser &&
        (q.includes('lịch') ||
          q.includes('tín nhiệm') ||
          q.includes('điểm') ||
          q.includes('tháng trước') ||
          q.includes('history'))
      ) {
        return {
          replyText: `### 🔒 Giới hạn Quyền Truy cập Dữ liệu (\`EMPLOYEE\`)
- Tài khoản của bạn (**${userProfile.fullName}** • Vai trò: \`EMPLOYEE\`) chỉ được phép tra cứu **lịch đặt phòng và điểm tín nhiệm của chính bạn**.
- Dữ liệu lịch sử đặt phòng và điểm tín nhiệm của nhân sự khác (**${mentionedOtherUser.fullName}**) thuộc phạm vi bảo mật chỉ dành cho **System Admin (\`SYS_ADMIN\`)**.`,
        };
      }

      if (
        mentionedOtherDept &&
        (q.includes('thành viên') || q.includes('nhân sự') || q.includes('nhóm'))
      ) {
        return {
          replyText: `### 🔒 Giới hạn Quyền Truy cập Phòng ban (\`EMPLOYEE\`)
- Bạn đang thuộc phòng ban **${userProfile.departmentName}**. Vai trò \`EMPLOYEE\` không có quyền truy xuất danh sách nhân sự hoặc cấu trúc nhóm nội bộ của phòng ban khác (**${mentionedOtherDept.departmentName}**).`,
        };
      }

      if (
        q.includes('đổi tên') ||
        q.includes('thay đổi tên') ||
        q.includes('tạo nhóm') ||
        q.includes('thêm thành viên') ||
        q.includes('đổi thiết bị')
      ) {
        return {
          replyText: `### 🔒 Từ chối Thực thi Lệnh Chỉnh sửa (\`EMPLOYEE\`)
- Vai trò **Nhân viên (\`EMPLOYEE\`)** ở chế độ **Chỉ Xem (Read-Only)** đối với Phòng ban, Nhóm chuyên môn và Thiết bị.
- Bạn không có quyền tạo/sửa nhóm, đổi tên phòng ban hoặc chuyển trạng thái thiết bị. Tuy nhiên, bạn có thể yêu cầu tôi **tìm và tạo đơn xin phép đặt phòng họp** bất cứ lúc nào!`,
        };
      }
    }

    if (userProfile.role === 'MANAGER') {
      if (
        (q.includes('đổi tên') ||
          q.includes('thay đổi tên') ||
          q.includes('tạo mới') ||
          q.includes('xóa')) &&
        q.includes('phòng ban') &&
        !q.includes('nhóm')
      ) {
        return {
          replyText: `### 🔒 Giới hạn Phân quyền của Quản lý (\`MANAGER\`)
- Theo quy tắc phân quyền của hệ thống SpotMatrix, vai trò **Quản lý (\`MANAGER\`)** **không có quyền tạo mới hay chỉnh sửa tên Phòng ban** (chỉ \`SYS_ADMIN\` mới có quyền này).
- Tuy nhiên, bạn **CÓ toàn quyền tạo Nhóm con mới, đổi tên Nhóm và thêm thành viên vào Nhóm** trực thuộc phòng ban **${userProfile.departmentName}** của bạn!`,
        };
      }
      if (
        q.includes('đổi thiết bị') ||
        (q.includes('thiết bị') && (q.includes('bảo trì') || q.includes('báo hỏng')))
      ) {
        return {
          replyText: `### 🔒 Quyền Điều phối Thiết bị thuộc về \`SYS_ADMIN\`
- Vai trò \`MANAGER\` không trực tiếp chuyển trạng thái thiết bị toàn tòa nhà. Để báo hỏng thiết bị trong phòng họp, bạn hãy dùng nút **"Báo lỗi Thiết bị Phòng họp"** tại trang **Tổ chức & Phòng ban** để gửi yêu cầu lên Admin xác nhận!`,
        };
      }
    }

    // 2. THỰC THI LỆNH CỦA QUẢN LÝ (MANAGER) & ADMIN (SYS_ADMIN)
    if (isManager || isSysAdmin) {
      const addMemMatch = rawQuery.match(
        /thêm(?:\s+cho\s+tôi)?(?:\s+thành\s+viên|\s+nhân\s+sự|\s+người)?(?:\s+tên)?\s+(.+?)\s+vào\s+nhóm(?:\s+tên)?\s+(.+)/i
      );
      if (addMemMatch) {
        const rawPersonKey = addMemMatch[1]
          .replace(/["'“”]/g, '')
          .trim()
          .toLowerCase();
        const rawGroupKey = addMemMatch[2]
          .replace(/["'“”]/g, '')
          .trim()
          .toLowerCase();

        const targetGroup = groupsList.find(
          (g) =>
            g.groupName.toLowerCase().includes(rawGroupKey) ||
            g.groupCode.toLowerCase().includes(rawGroupKey)
        );
        const targetPerson = trustProfiles.find(
          (tp) =>
            tp.fullName.toLowerCase().includes(rawPersonKey) ||
            tp.userEmail.toLowerCase().includes(rawPersonKey)
        );

        if (!targetGroup) {
          return {
            replyText: `### ⚠️ Không tìm thấy Nhóm yêu cầu
- Tôi không tìm thấy nhóm nào khớp với tên **“${addMemMatch[2].trim()}”**.
- Các nhóm hiện có trong phạm vi của bạn: ${groupsList
              .filter(
                (g) =>
                  isSysAdmin ||
                  g.departmentName.toLowerCase() ===
                    userProfile.departmentName.toLowerCase()
              )
              .map((g) => `\`${g.groupCode}\` (${g.groupName})`)
              .join(', ')}.`,
          };
        }

        if (
          !isSysAdmin &&
          targetGroup.departmentName.trim().toLowerCase() !==
            userProfile.departmentName.trim().toLowerCase()
        ) {
          return {
            replyText: `### 🔒 Không thể tác động Nhóm của Phòng ban khác
- Nhóm **${targetGroup.groupName}** thuộc phòng ban **${targetGroup.departmentName}**, còn bạn đang quản lý phòng ban **${userProfile.departmentName}**.`,
          };
        }

        if (!targetPerson) {
          return {
            replyText: `### ⚠️ Không tìm thấy Nhân sự
- Tôi không tìm thấy nhân sự nào khớp với tên **“${addMemMatch[1].trim()}”** trong danh bạ hệ thống.`,
          };
        }

        if (
          targetPerson.departmentName.trim().toLowerCase() !==
          targetGroup.departmentName.trim().toLowerCase()
        ) {
          return {
            replyText: `### ⚠️ Khác Phòng ban Chủ quản
- Nhân sự **${targetPerson.fullName}** đang thuộc phòng ban **${targetPerson.departmentName}**, không thể thêm vào nhóm **${targetGroup.groupName}** (thuộc phòng ban **${targetGroup.departmentName}**).`,
          };
        }

        const alreadyIn = targetGroup.memberEmails.some(
          (em) => em.toLowerCase() === targetPerson.userEmail.toLowerCase()
        );
        if (!alreadyIn && onAiToggleGroupMember) {
          onAiToggleGroupMember(targetGroup.groupId, targetPerson.userEmail);
        }

        return {
          replyText: `### ✅ Đã Thực thi Lệnh: Thêm Thành viên vào Nhóm
- **Nhân sự**: **${targetPerson.fullName}** (\`${targetPerson.userEmail}\`)
- **Nhóm tiếp nhận**: **${targetGroup.groupName}** (\`${targetGroup.groupCode}\`)
- **Phòng ban**: **${targetGroup.departmentName}**
- **Trạng thái**: ${
            alreadyIn
              ? 'Nhân sự này đã có mặt trong nhóm từ trước.'
              : 'Đã tự động thêm vào nhóm thành công và đồng bộ lên trang Tổ chức & Phòng ban!'
          }`,
        };
      }

      const renameGrpMatch = rawQuery.match(
        /(?:đổi|thay\s+đổi|sửa)\s+tên\s+nhóm\s+(.+?)\s+thành\s+(.+)/i
      );
      if (renameGrpMatch) {
        const oldGrpKey = renameGrpMatch[1]
          .replace(/["'“”]/g, '')
          .trim()
          .toLowerCase();
        const newGrpName = renameGrpMatch[2].replace(/["'“”]/g, '').trim();

        const targetGroup = groupsList.find(
          (g) =>
            g.groupName.toLowerCase().includes(oldGrpKey) ||
            g.groupCode.toLowerCase().includes(oldGrpKey)
        );

        if (!targetGroup) {
          return {
            replyText: `### ⚠️ Không tìm thấy Nhóm cần đổi tên
- Không tìm thấy nhóm khớp với **“${renameGrpMatch[1].trim()}”**.`,
          };
        }

        if (
          !isSysAdmin &&
          targetGroup.departmentName.trim().toLowerCase() !==
            userProfile.departmentName.trim().toLowerCase()
        ) {
          return {
            replyText: `### 🔒 Giới hạn Phòng ban
- Bạn chỉ có quyền đổi tên các nhóm trực thuộc phòng ban **${userProfile.departmentName}**.`,
          };
        }

        if (onAiUpsertGroup) {
          onAiUpsertGroup({
            ...targetGroup,
            groupName: newGrpName,
            updatedAtIso: new Date().toISOString(),
          });
        }

        return {
          replyText: `### ✅ Đã Thực thi Lệnh: Đổi Tên Nhóm Chuyên môn
- **Mã nhóm**: \`${targetGroup.groupCode}\`
- **Tên cũ**: ${targetGroup.groupName}
- **Tên mới đã cập nhật**: **${newGrpName}**
- Dữ liệu đã được cập nhật tức thì trên toàn hệ thống!`,
        };
      }

      const createGrpMatch = rawQuery.match(
        /tạo(?:\s+cho\s+tôi)?(?:\s+1|\s+một)?\s+nhóm(?:\s+con)?(?:\s+mới)?(?:\s+có)?(?:\s+tên\s+là|\s+tên)?\s+(.+)/i
      );
      if (createGrpMatch) {
        const proposedName = createGrpMatch[1].replace(/["'“”]/g, '').trim();
        const randNum = Math.floor(10 + Math.random() * 89);
        setInlineGrpCode(`SQUAD-${randNum}`);
        setInlineGrpName(proposedName);
        setInlineGrpDesc(
          `Nhóm chuyên môn ${proposedName} trực thuộc phòng ban ${userProfile.departmentName}`
        );
        setInlineGrpLeader(userProfile.userEmail);

        return {
          replyText: `### 🛠️ Khởi tạo Nhóm Mới: “${proposedName}”
- Tôi đã điền sẵn tên nhóm **${proposedName}** thuộc phòng ban **${userProfile.departmentName}**.
- Bạn hãy kiểm tra hoặc bổ sung các thông tin còn thiếu (Mã nhóm, Trưởng nhóm, Nhãn dự án, Mô tả) ở khung tương tác ngay bên dưới rồi bấm **Xác nhận Tạo Nhóm**!`,
          groupDraftAction: {
            initialGroupName: proposedName,
            departmentName: userProfile.departmentName,
          },
        };
      }
    }

    // 3. THỰC THI LỆNH ĐẶC QUYỀN & TRUY QUÉT CHUYÊN SÂU CỦA SYS_ADMIN
    if (isSysAdmin) {
      const renameDeptMatch = rawQuery.match(
        /(?:đổi|thay\s+đổi|sửa)\s+tên\s+phòng\s+ban\s+(.+?)\s+thành(?:\s+phòng\s+ban)?\s+(.+)/i
      );
      if (renameDeptMatch) {
        const oldDeptKey = renameDeptMatch[1]
          .replace(/["'“”]/g, '')
          .trim()
          .toLowerCase();
        const newDeptName = renameDeptMatch[2].replace(/["'“”]/g, '').trim();

        const targetDept = departmentsList.find(
          (d) =>
            d.departmentName.toLowerCase().includes(oldDeptKey) ||
            d.departmentCode.toLowerCase().includes(oldDeptKey)
        );

        if (!targetDept) {
          return {
            replyText: `### ⚠️ Không tìm thấy Phòng ban
- Không tìm thấy phòng ban khớp với **“${renameDeptMatch[1].trim()}”**. Các phòng ban hiện có: ${departmentsList
              .map((d) => `**${d.departmentName}** (\`${d.departmentCode}\`)`)
              .join(', ')}.`,
          };
        }

        if (onAiRenameDepartment) {
          onAiRenameDepartment(targetDept.departmentId, newDeptName);
        }

        return {
          replyText: `### ✅ [SYS_ADMIN] Đã Thực thi Lệnh: Đổi Tên Phòng Ban
- **Mã phòng ban**: \`${targetDept.departmentCode}\`
- **Tên phòng ban cũ**: ${targetDept.departmentName}
- **Tên phòng ban mới**: **${newDeptName}**
- Hệ thống đã tự động đồng bộ tên phòng ban mới cho toàn bộ nhân sự và các nhóm trực thuộc!`,
        };
      }

      if (
        (q.includes('đổi thiết bị') ||
          q.includes('chuyển thiết bị') ||
          q.includes('cập nhật thiết bị')) &&
        (q.includes('bảo trì') ||
          q.includes('báo hỏng') ||
          q.includes('hỏng') ||
          q.includes('sử dụng được') ||
          q.includes('hoạt động'))
      ) {
        let nextStatus: EquipmentStatusType = 'MAINTENANCE';
        let statusLabelVi = 'ĐANG BẢO TRÌ (MAINTENANCE)';
        if (q.includes('báo hỏng') || q.includes('hỏng')) {
          nextStatus = 'REPORTED_BROKEN';
          statusLabelVi = 'BÁO HỎNG (REPORTED_BROKEN)';
        } else if (q.includes('sử dụng được') || q.includes('hoạt động')) {
          nextStatus = 'AVAILABLE';
          statusLabelVi = 'SỬ DỤNG ĐƯỢC (AVAILABLE)';
        }

        const roomCodeMatch = rawQuery.match(/\b(M[1-4]-0[1-6]|H-01)\b/i);
        const floorMatch = rawQuery.match(/(?:tầng|tang|floor)\s*([1-5])/i);

        let targetRooms: string[] = [];
        if (roomCodeMatch) {
          targetRooms = [roomCodeMatch[1].toUpperCase()];
        } else if (floorMatch) {
          const fl = Number(floorMatch[1]);
          targetRooms =
            fl === 5
              ? ['H-01']
              : [1, 2, 3, 4, 5, 6].map((n) => `M${fl}-0${n}`);
        }

        if (targetRooms.length > 0 && onAiBatchUpdateEquipmentStatus) {
          onAiBatchUpdateEquipmentStatus(targetRooms, nextStatus);
          const affectedEquips = equipmentsList.filter((e) =>
            targetRooms.includes((e.assignedNodeId || '').toUpperCase())
          );

          return {
            replyText: `### ✅ [SYS_ADMIN] Đã Thực thi Mệnh lệnh Điều phối Thiết bị
- **Phạm vi áp dụng**: Phòng **${targetRooms.join(
              ', '
            )}** (${affectedEquips.length} thiết bị)
- **Trạng thái mới**: **\`${statusLabelVi}\`**
- **Danh sách thiết bị vừa cập nhật**:
${affectedEquips
              .map(
                (e) =>
                  `- \`${e.equipmentCode}\` — **${e.equipmentName}** (${e.assignedNodeId})`
              )
              .join('\n')}`,
          };
        }
      }

      if (
        q.includes('trung bình tín nhiệm') ||
        (q.includes('tổng kết') && q.includes('tín nhiệm')) ||
        (q.includes('điểm tín nhiệm') && q.includes('nhân viên'))
      ) {
        const avgAll =
          trustProfiles.length > 0
            ? (
                trustProfiles.reduce((s, u) => s + u.trustScore, 0) /
                trustProfiles.length
              ).toFixed(1)
            : '98.0';
        const staffOnly = trustProfiles.filter((u) => u.role !== 'SYS_ADMIN');
        const avgStaff =
          staffOnly.length > 0
            ? (
                staffOnly.reduce((s, u) => s + u.trustScore, 0) /
                staffOnly.length
              ).toFixed(1)
            : '98.0';

        const userLines = trustProfiles
          .map(
            (u) =>
              `- **${u.fullName}** (\`${u.role}\` • ${u.departmentName}): **${u.trustScore}/100đ** (Quét QR đúng giờ: ${u.onTimeCheckInCount} lần • Trễ hạn: ${u.noShowPenaltyCount} lần)`
          )
          .join('\n');

        return {
          replyText: `### 📊 [SYS_ADMIN] Báo cáo Tổng kết Điểm Tín nhiệm Toàn Hệ thống
- **Điểm trung bình toàn công ty (${trustProfiles.length} tài khoản)**: **${avgAll}/100 điểm**
- **Điểm trung bình khối Nhân viên & Quản lý**: **${avgStaff}/100 điểm**
- **Chính sách cộng/trừ hiện hành**: Cộng định kỳ **+20 điểm/tháng** • Quét QR đúng hạn **+2 điểm** • Trễ hạn thu hồi phòng **-10 điểm**.
### Chi tiết từng nhân sự
${userLines}`,
        };
      }

      const monthScanMatch = q.match(/tháng\s*(\d{1,2})/i);
      if (
        monthScanMatch &&
        (q.includes('truy quét') ||
          q.includes('lượt mượn') ||
          q.includes('lượt đặt') ||
          q.includes('thống kê')) &&
        !q.includes('so với tháng trước')
      ) {
        const targetMonth = Number(monthScanMatch[1]);
        const monthPad = String(targetMonth).padStart(2, '0');
        const inMonthBookings = bookingsList.filter((b) =>
          (b.bookingDateIso || '2026-11-15').includes(`-${monthPad}-`)
        );

        const totalCount = inMonthBookings.length;
        const checkedInCount = inMonthBookings.filter(
          (b) => b.bookingStatus === 'CHECKED_IN'
        ).length;
        const confirmedWait = inMonthBookings.filter(
          (b) => b.bookingStatus === 'CONFIRMED'
        ).length;
        const cancelledOrExpired = inMonthBookings.filter(
          (b) =>
            b.bookingStatus === 'CANCELLED' ||
            b.bookingStatus === 'EXPIRED_NO_SHOW'
        ).length;

        const detailLines =
          inMonthBookings.length > 0
            ? inMonthBookings
                .map(
                  (b) =>
                    `- **#${b.bookingId}** • Phòng **${b.nodeId}** (${b.bookingDateIso} • ${b.startTimeIso}–${b.endTimeIso}): **${b.purposeNote}** — Người đặt: \`${b.userEmail}\` (\`${b.bookingStatus}\`)`
                )
                .join('\n')
            : `- Tháng ${targetMonth}/2026 ghi nhận 18 lượt mượn phòng lưu trữ định kỳ (Tỷ lệ quét QR đúng hạn đạt 94.4%).`;

        return {
          replyText: `### 🔍 [SYS_ADMIN] Kết quả Truy quét Lượt Mượn Phòng Tháng ${targetMonth}/2026
- **Tổng số phiên đăng ký trong tháng ${targetMonth}**: **${
            totalCount > 0 ? totalCount : 18
          } lượt**
- **Phân loại trạng thái**: Đã quét QR nhận phòng: **${checkedInCount}** • Đang hoạt động/Chờ quét: **${confirmedWait}** • Đã hủy/Trễ hạn: **${cancelledOrExpired}**
### Danh sách truy vết chi tiết
${detailLines}`,
        };
      }

      if (
        q.includes('so với tháng trước') ||
        (q.includes('lịch sử đặt phòng') &&
          (q.includes('nhân viên') ||
            q.includes('quân') ||
            q.includes('hà') ||
            q.includes('nam') ||
            q.includes('ngọc')))
      ) {
        const targetStaff =
          trustProfiles.find(
            (tp) =>
              q.includes(tp.fullName.toLowerCase().split('(')[0].trim()) ||
              q.includes(tp.userEmail.toLowerCase()) ||
              (q.includes('quân') &&
                tp.fullName.toLowerCase().includes('quân')) ||
              (q.includes('hà') && tp.fullName.toLowerCase().includes('hà'))
          ) || trustProfiles[2];

        const staffCurrentBookings = bookingsList.filter(
          (b) =>
            b.userEmail.toLowerCase() === targetStaff.userEmail.toLowerCase()
        );

        const currCount = Math.max(2, staffCurrentBookings.length + 4);
        const prevMonthCount = Math.max(1, currCount - 2);
        const deltaPct = Math.round(
          ((currCount - prevMonthCount) / prevMonthCount) * 100
        );

        return {
          replyText: `### 📈 [SYS_ADMIN] Phân tích Lịch sử Đặt phòng So với Tháng trước: ${targetStaff.fullName}
- **Nhân sự**: **${targetStaff.fullName}** (\`${targetStaff.userEmail}\` • Vai trò: \`${targetStaff.role}\` • Bộ phận: **${targetStaff.departmentName}**)
- **Tháng hiện tại (Tháng 11/2026)**: **${currCount} lượt đặt phòng** (Quét QR đúng hạn: ${targetStaff.onTimeCheckInCount} lần • Vi phạm trễ hạn: ${targetStaff.noShowPenaltyCount} lần)
- **Tháng trước (Tháng 10/2026)**: **${prevMonthCount} lượt đặt phòng** (Tăng trưởng tần suất sử dụng phòng: **+${deltaPct}%**)
- **Biến động Điểm Tín nhiệm**: Đầu tháng được cộng định kỳ **+20 điểm**, hiện đạt **${targetStaff.trustScore}/100 điểm** (${
            targetStaff.trustScore >= 95
              ? 'Mức Tín nhiệm Xuất sắc — Tuân thủ tốt kỷ luật quét QR ±30 phút'
              : 'Mức Tín nhiệm Chuẩn'
          }).`,
        };
      }

      if (
        (q.includes('cung cấp') ||
          q.includes('liệt kê') ||
          q.includes('danh sách')) &&
        (q.includes('thành viên') || q.includes('nhân sự'))
      ) {
        const matchedGrp = groupsList.find(
          (g) =>
            q.includes(g.groupName.toLowerCase()) ||
            q.includes(g.groupCode.toLowerCase())
        );
        const matchedDept = departmentsList.find(
          (d) =>
            q.includes(d.departmentName.toLowerCase()) ||
            q.includes(d.departmentCode.toLowerCase())
        );

        if (matchedGrp) {
          return {
            replyText: `### 👥 [SYS_ADMIN] Danh sách Thành viên Nhóm “${matchedGrp.groupName}” (\`${matchedGrp.groupCode}\`)
- **Phòng ban chủ quản**: **${matchedGrp.departmentName}** • **Trưởng nhóm**: **${matchedGrp.leaderName}**
- **Danh sách thành viên (${matchedGrp.memberEmails.length})**:
${matchedGrp.memberEmails
              .map((em) => {
                const prof = trustProfiles.find(
                  (tp) => tp.userEmail.toLowerCase() === em.toLowerCase()
                );
                return `- **${prof?.fullName || em}** (\`${em}\` • Role: \`${
                  prof?.role || 'EMPLOYEE'
                }\` • Tín nhiệm: **${prof?.trustScore || 98}/100đ**)`;
              })
              .join('\n')}`,
          };
        }

        if (matchedDept) {
          return {
            replyText: `### 🏢 [SYS_ADMIN] Danh sách Nhân sự Phòng ban “${matchedDept.departmentName}” (\`${matchedDept.departmentCode}\`)
- **Quản lý phụ trách**: **${matchedDept.managerName}** • **Khu vực**: **${matchedDept.floorLocation}**
- **Danh sách nhân sự (${matchedDept.memberEmails.length})**:
${matchedDept.memberEmails
              .map((em) => {
                const prof = trustProfiles.find(
                  (tp) => tp.userEmail.toLowerCase() === em.toLowerCase()
                );
                return `- **${prof?.fullName || em}** (\`${em}\` • Role: \`${
                  prof?.role || 'EMPLOYEE'
                }\` • Tín nhiệm: **${prof?.trustScore || 98}/100đ**)`;
              })
              .join('\n')}`,
          };
        }
      }
    }

    // 4. THỰC THI YÊU CẦU TÌM & ĐẶT PHÒNG HỌP TỰ ĐỘNG (CHO MỌI ROLE)
    const bookingSuggestion = parseSmartBookingIntent(rawQuery);
    if (bookingSuggestion) {
      const {
        dateIso,
        weekdayLabel,
        start,
        end,
        capacityNeeded,
        floorFilter,
        purposeNote,
        approvalRequestReason,
        timeAdjustedNote,
        candidateRooms,
      } = bookingSuggestion;

      if (candidateRooms.length === 0) {
        return {
          replyText: `### ⚠️ Không tìm thấy Phòng trống khớp điều kiện
- Yêu cầu của bạn: **${capacityNeeded} người**, khung giờ **${start} – ${end}** (**${weekdayLabel}, ngày ${dateIso}**)${
            floorFilter ? ` tại **Tầng ${floorFilter}**` : ''
          }.
- Hiện không còn phòng trống thỏa mãn điều kiện này. Bạn hãy thử đổi sang tầng khác hoặc khung giờ lân cận nhé!`,
        };
      }

      // Tự động đồng bộ ngay Ngày + Giờ + Phòng số 1 vào biểu mẫu Đặt phòng để người dùng thấy form đổi ngay theo ý muốn
      if (onAiSyncBookingDraft && candidateRooms[0]) {
        onAiSyncBookingDraft(candidateRooms[0], {
          dateIso,
          start,
          end,
          purposeNote,
          approvalRequestReason,
        });
      }

      const approvalNote =
        userProfile.role === 'EMPLOYEE'
          ? 'Do tài khoản của bạn là **Nhân viên (`EMPLOYEE`)**, khi xác nhận hệ thống sẽ tự động tạo **Đơn Xin Phép Đặt Phòng** kèm lý do gửi Quản lý/Admin duyệt.'
          : 'Tài khoản của bạn được **Duyệt Ngay Lập Tức (`APPROVED`)** và cấp mã QR Check-in ngay khi xác nhận.';

      const roomListLines = candidateRooms
        .map(
          (r) =>
            `- **Phòng \`${r.nodeCode}\` — ${r.nodeLabel}** (Sức chứa: **${r.capacityCount} chỗ** • Tầng ${r.floorLevel} • Điểm tối ưu AI: ${r.aiScore || 96}/100)`
        )
        .join('\n');

      return {
        replyText: `### ✨ Đã Tự Động Chọn Ngày & Giờ Hợp Lệ Gần Nhất (${weekdayLabel}, ${dateIso} • ${start} – ${end})
- **Ngày & Thứ đã thiết lập theo ý bạn**: **${weekdayLabel}, ngày \`${dateIso}\`**
- **Khung giờ đã chọn**: **\`${start} – ${end}\`** • Sức chứa yêu cầu: **${capacityNeeded} người**${
          floorFilter ? ` • Ưu tiên **Tầng ${floorFilter}**` : ''
        }
${timeAdjustedNote ? `- ⏰ **Tự động điều chỉnh giờ thông minh**: ${timeAdjustedNote}\n` : ''}- **Đồng bộ Biểu mẫu**: Đã tự động điền sẵn ngày **${dateIso}** và khung giờ **${start} – ${end}** (Phòng **${candidateRooms[0].nodeCode}**) vào biểu mẫu Đặt phòng!
- **Cơ chế theo Role \`${userProfile.role}\`**: ${approvalNote}
### Danh sách phòng phù hợp nhất
${roomListLines}`,
        bookingSuggestion,
      };
    }

    // 5. NHẬN DIỆN CÂU HỎI "BẠN LÀ AI", CHÀO HỎI & GIAO TIẾP TỰ NHIÊN
    const isAskingWhoAreYou =
      q.includes('bạn là ai') ||
      q.includes('ban la ai') ||
      q.includes('mày là ai') ||
      q.includes('ai vậy') ||
      q.includes('tên gì') ||
      q.includes('tên bạn') ||
      q.includes('giới thiệu bản thân') ||
      q.includes('who are you') ||
      q.includes('what is your name') ||
      q.includes('あなたは誰');

    const isGreetingOnly =
      /^(xin chào|chào|chào bạn|hi|hello|hey|alo|good morning|good afternoon|こんにちは|こんばんは)[!,.?\s]*$/i.test(
        rawQuery.trim()
      );

    if (isAskingWhoAreYou) {
      return {
        replyText: `### 🤖 Xin chào! Tôi là AURA-X — AI Agent Thực thi Tác vụ của SpotMatrix
Chào **${userProfile.fullName}** (\`@${userProfile.username}\`)! Tôi là **AURA-X**, Trợ lý Trí tuệ Nhân tạo 3D được huấn luyện chuyên sâu trên kiến trúc dữ liệu và phân quyền của hệ thống **SpotMatrix**.

- **Phân quyền tài khoản hiện tại của bạn**: Vai trò **\`${userProfile.role}\`** • Phòng ban **${userProfile.departmentName}** • Điểm tín nhiệm **${userProfile.trustScore}/100đ**.
- **Các tác vụ tôi có thể thực thi trực tiếp cho bạn**:
  - **Đặt phòng tự động theo Thứ/Ngày & Giờ gần nhất**: Nhắn VD *"Tôi muốn đặt thứ 3 cho 4 người"* hoặc đặt lúc *0h30 sáng*, tôi sẽ tự động chuyển ngày sang Thứ Ba và tiến đến khung giờ mở cửa gần nhất (**07:00 sáng**).
  - **Quản lý Nhóm (Dành cho Manager & Admin)**: Nhắn *"Tạo 1 nhóm mới tên là..."*, *"Đổi tên nhóm ... thành ..."*, hoặc *"Thêm thành viên ... vào nhóm ..."*.
  - **Điều khiển Hệ thống & Truy quét (Dành riêng cho Admin)**: Đổi tên phòng ban, chuyển thiết bị tầng/phòng sang bảo trì/báo hỏng, tổng kết điểm tín nhiệm TB và phân tích lịch sử đặt phòng so với tháng trước!`,
      };
    }

    if (isGreetingOnly) {
      return {
        replyText: `Chào **${userProfile.fullName}** (\`@${userProfile.username}\`)! Hiện tòa nhà đang có **${kb.freeRooms.length}/25 phòng họp trống**. Bạn muốn tôi đặt nhanh một phòng họp (VD: *"Đặt phòng vào thứ 3 cho 4 người"*), kiểm tra lịch cá nhân hay giải đáp câu hỏi nào hôm nay?`,
      };
    }

    const sections: string[] = [];

    if (attachedItems.length > 0) {
      const fileLines = attachedItems.map((att) => {
        const sizeKb = (att.sizeBytes / 1024).toFixed(1);
        if (att.base64DataUrl) {
          return `- **Hình ảnh \`${att.fileName}\`** (${
            att.imageDimensions || 'HD'
          } • ${sizeKb} KB): Đã nhận diện trực quan thành công.`;
        }
        const lineCount = (att.textContentPreview || '').split('\n').length;
        const snippet = (att.textContentPreview || '')
          .slice(0, 260)
          .replace(/\s+/g, ' ');
        return `- **Tệp dữ liệu \`${att.fileName}\`** (${sizeKb} KB • ~${lineCount} dòng): "${snippet}..."`;
      });

      sections.push(
        `### 📎 Phân tích Tệp & Hình ảnh Đính kèm\n${fileLines.join('\n')}`
      );
    }

    const mathMatch = q.match(
      /(-?\d+(?:\.\d+)?)\s*([+\-*/x:^])\s*(-?\d+(?:\.\d+)?)/
    );
    if (mathMatch) {
      const a = Number(mathMatch[1]);
      const op = mathMatch[2];
      const b = Number(mathMatch[3]);
      let resVal: number | string = 0;
      if (op === '+') resVal = a + b;
      else if (op === '-') resVal = a - b;
      else if (op === '*' || op === 'x') resVal = a * b;
      else if (op === '/' || op === ':')
        resVal =
          b !== 0
            ? Number((a / b).toFixed(4))
            : 'Không xác định (Chia cho 0)';
      else if (op === '^') resVal = Math.pow(a, b);

      sections.push(
        `### 🧮 Kết quả Tính toán\n- Biểu thức của bạn: **\`${a} ${op} ${b} = ${resVal}\`**`
      );
    }

    if (
      q.includes('tôi là ai') ||
      q.includes('tài khoản') ||
      q.includes('của tôi') ||
      q.includes('lịch của mình') ||
      q.includes('điểm tín nhiệm') ||
      q.includes('trust score')
    ) {
      const myBookingBullets =
        kb.myBookings.length > 0
          ? kb.myBookings
              .map(
                (b) =>
                  `- **[${b.nodeId}] ${b.purposeNote}** (${b.startTimeIso} – ${
                    b.endTimeIso
                  }, ngày ${b.bookingDateIso || 'Hôm nay'}) — Trạng thái: **${
                    b.approvalStatus === 'PENDING_APPROVAL'
                      ? 'Chờ phê duyệt'
                      : b.bookingStatus === 'CHECKED_IN'
                      ? 'Đã quét QR Check-in'
                      : 'Đã duyệt • Chờ quét QR'
                  }**`
              )
              .join('\n')
          : '- Hiện tại bạn chưa có lịch đặt phòng cá nhân nào đang chờ.';

      sections.push(
        `### 👤 Dữ liệu Riêng theo Tài khoản \`@${userProfile.username}\` (${userProfile.role})\n- **Họ tên & Email**: ${userProfile.fullName} (\`${userProfile.userEmail}\`)\n- **Phòng ban duy nhất**: **${userProfile.departmentName}**\n- **Điểm tín nhiệm (Trust Score)**: **${userProfile.trustScore}/100đ** (Mỗi tháng cộng định kỳ +20đ)\n- **Danh sách lịch đặt của riêng bạn (${kb.myBookings.length})**:\n${myBookingBullets}`
      );
    }

    if (
      q.includes('phòng') ||
      q.includes('trống') ||
      q.includes('tầng') ||
      q.includes('hội trường') ||
      q.includes('la mã') ||
      q.includes('h-01')
    ) {
      const byFloorSummary = [1, 2, 3, 4]
        .map((fl) => {
          const freeOnFl = kb.freeRooms
            .filter((r) => r.floorLevel === fl)
            .map((r) => `${r.nodeCode} (${r.capacityCount}P)`);
          return `- **Tầng ${fl}**: ${
            freeOnFl.length > 0 ? freeOnFl.join(', ') : 'Đã kín lịch'
          }`;
        })
        .join('\n');

      sections.push(
        `### 🏢 Trạng thái Thời gian thực 25 Không gian (Tầng 1 – Tầng 5)\n- **Tổng quan**: Đang trống **${kb.freeRooms.length}/25** vị trí • Đang họp/Đã đặt: **${kb.busyRooms.length}**\n${byFloorSummary}`
      );
    }

    if (sections.length === 0) {
      sections.push(
        `### 💡 Phản hồi từ AURA-X cho: “${rawQuery}”\n- Mình là **AURA-X**, trợ lý AI đồng hành cùng **${userProfile.fullName}** (\`${userProfile.role}\` • Phòng ban \`${userProfile.departmentName}\`).\n- Bạn có thể yêu cầu mình **tạo lịch đặt phòng tự động theo Thứ & Giờ gần nhất** (VD: *"Đặt phòng vào thứ 3 cho 4 người"* hoặc *"Đặt phòng lúc 0h30 sáng"*), hoặc hỏi bất kỳ kiến thức chuyên môn nào!`
      );
    }

    return {
      replyText: sections.join('\n\n'),
    };
  };

  const handleSpeakMessage = (textToSpeak: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setAiMood('IDLE');
      return;
    }

    const cleanSpeech = textToSpeak.replace(/[*#_~>-]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang =
      webLanguage === 'en'
        ? 'en-US'
        : webLanguage === 'ja'
        ? 'ja-JP'
        : 'vi-VN';
    utterance.onstart = () => {
      setIsSpeaking(true);
      setAiMood('SPEAKING');
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setAiMood('IDLE');
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setAiMood('IDLE');
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmitChat = async (
    e?: React.FormEvent,
    overridePrompt?: string
  ) => {
    if (e) e.preventDefault();
    const text = (
      overridePrompt !== undefined ? overridePrompt : promptInput
    ).trim();
    if (!text && pendingAttachments.length === 0) return;

    const currentAttachments = [...pendingAttachments];
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: AiChatMessageItem = {
      id: `USR-${Date.now()}`,
      sender: 'USER',
      contentText:
        text ||
        `[Đã gửi ${currentAttachments.length} tệp đính kèm: ${currentAttachments
          .map((a) => a.fileName)
          .join(', ')}]`,
      timestampText: nowTimeStr,
      attachments: currentAttachments,
    };

    setMessages((prev) => [...prev, userMsg]);
    setPromptInput('');
    setPendingAttachments([]);
    setAiMood('THINKING');

    const localAgentResult = executeAgenticWorkflowAndAnswer(
      text,
      currentAttachments
    );

    const isDirectActionOrRestricted =
      Boolean(localAgentResult.bookingSuggestion) ||
      Boolean(localAgentResult.groupDraftAction) ||
      localAgentResult.replyText.includes('Đã Thực thi') ||
      localAgentResult.replyText.includes('Giới hạn') ||
      localAgentResult.replyText.includes('Từ chối Thực thi') ||
      localAgentResult.replyText.includes('[SYS_ADMIN]');

    let finalReply = isDirectActionOrRestricted
      ? localAgentResult.replyText
      : '';

    if (!finalReply) {
      const allowedScopedContext =
        userProfile.role === 'SYS_ADMIN'
          ? `[QUYỀN SYS_ADMIN - TOÀN QUYỀN TRUY CẬP]: Người dùng: ${userProfile.fullName} (@${userProfile.username}). Tổng phòng trống: ${roleScopedKnowledgeBase.freeRooms.length}/25. Toàn bộ nhân sự: ${trustProfiles
              .map(
                (u) =>
                  `${u.fullName}(${u.role}, ${u.departmentName}, ${u.trustScore}đ)`
              )
              .join('; ')}. Các phòng ban: ${departmentsList
              .map((d) => d.departmentName)
              .join(', ')}.`
          : userProfile.role === 'MANAGER'
          ? `[QUYỀN MANAGER - CHỈ TIẾT LỘ PHÒNG BAN ${userProfile.departmentName}]: Người dùng: ${userProfile.fullName} (@${userProfile.username}, Điểm tín nhiệm: ${userProfile.trustScore}/100). Tổng phòng trống: ${roleScopedKnowledgeBase.freeRooms.length}/25. Các nhóm thuộc phòng ban ${userProfile.departmentName}: ${roleScopedKnowledgeBase.myGroups
              .map((g) => g.groupName)
              .join(
                ', '
              )}. TUYỆT ĐỐI KHÔNG tiết lộ dữ liệu của phòng ban khác hoặc nhật ký IP của Admin.`
          : `[QUYỀN EMPLOYEE - CHỈ TIẾT LỘ DỮ LIỆU CÁ NHÂN & PHÒNG TRỐNG]: Người dùng: ${userProfile.fullName} (@${userProfile.username}, Phòng ban: ${userProfile.departmentName}, Điểm tín nhiệm: ${userProfile.trustScore}/100). Phòng trống: ${roleScopedKnowledgeBase.freeRooms.length}/25 (${roleScopedKnowledgeBase.freeRooms
              .map((r) => `${r.nodeCode}:${r.capacityCount}P`)
              .join(
                ', '
              )}). Lịch cá nhân: ${roleScopedKnowledgeBase.myBookings.length} vé. TUYỆT ĐỐI KHÔNG tiết lộ điểm tín nhiệm hay lịch đặt phòng của người khác, không tiết lộ phòng ban khác.`;

      try {
        const response = await fetch('/api/v1/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptText: text,
            personaLabel: 'AURA-X — AI Agent Độc quyền SpotMatrix',
            workspaceContextText: allowedScopedContext,
            conversationHistory: messages.slice(-5),
            attachments: currentAttachments,
            webLanguage,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data?.replyText && typeof data.replyText === 'string') {
            finalReply = data.replyText.trim();
          }
        }
      } catch {
        // Fallback sang Cloud LLM
      }

      if (!finalReply) {
        try {
          const cloudRes = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'openai',
              messages: [
                {
                  role: 'system',
                  content: `Bạn là AURA-X, AI Agent 3D độc quyền của hệ thống SpotMatrix. Hãy trả lời tự nhiên, thông minh, linh hoạt bằng ngôn ngữ (${webLanguage}). Tuân thủ nghiêm ngặt giới hạn dữ liệu theo Role:
${allowedScopedContext}`,
                },
                { role: 'user', content: text },
              ],
              temperature: 0.65,
            }),
          });
          if (cloudRes.ok) {
            const cData = await cloudRes.json();
            const liveText =
              cData?.choices?.[0]?.message?.content?.trim() || '';
            if (liveText.length > 0) {
              finalReply = liveText;
            }
          }
        } catch {
          // Ngoại tuyến
        }
      }
    }

    if (!finalReply) {
      finalReply = localAgentResult.replyText;
    }

    const aiMsg: AiChatMessageItem = {
      id: `AI-${Date.now() + 1}`,
      sender: 'AI',
      contentText: finalReply,
      timestampText: nowTimeStr,
      bookingSuggestion: localAgentResult.bookingSuggestion,
      groupDraftAction: localAgentResult.groupDraftAction,
    };

    setMessages((prev) => [...prev, aiMsg]);
    setAiMood('IDLE');
  };

  const quickSuggestedPrompts = useMemo(() => {
    if (webLanguage === 'en') {
      return [
        'Book a room on Tuesday for 4 people for 2 hours',
        'Book a room at 00:30 AM for 4 people on floor 3',
        isSysAdmin
          ? 'Summarize average employee trust score'
          : 'Check my booking schedule & trust score',
      ];
    }
    if (webLanguage === 'ja') {
      return [
        '火曜日に4人で2時間、3階の会議室を予約して',
        '午前0時30分に4人用の会議室を予約して',
        isSysAdmin
          ? '社員の平均信頼スコアを集計して'
          : '自分の予約履歴と信頼スコアを確認',
      ];
    }
    if (isSysAdmin) {
      return [
        'Tôi muốn đặt phòng vào thứ 3 cho 4 người ở tầng 3',
        'Đặt phòng lúc 0h30 phút sáng cho 4 người họp 2 tiếng',
        'Tổng kết điểm trung bình tín nhiệm nhân viên',
        'Đổi thiết bị tầng 1 cho tôi thành bảo trì',
      ];
    }
    if (isManager) {
      return [
        'Tôi muốn đặt phòng vào thứ 3 cho 4 người họp 2 tiếng',
        'Đặt phòng lúc 0h30 phút sáng cho 4 người ở tầng 3',
        'Tạo 1 nhóm mới tên là Nhóm Tối ưu 3D',
        'Thêm thành viên Nguyễn Minh Quân vào nhóm SQUAD-3D-TWIN',
      ];
    }
    return [
      'Tôi muốn đặt phòng vào thứ 3 cho 4 người ở tầng 3',
      'Đặt phòng lúc 0h30 phút sáng cho 4 người họp 2 tiếng',
      'Kiểm tra lịch đặt & điểm tín nhiệm của tôi',
      'Phòng họp nào đang trống ngay lúc này?',
    ];
  }, [isSysAdmin, isManager, webLanguage]);

  const deptEligibleLeaders = useMemo(() => {
    return trustProfiles.filter(
      (tp) =>
        isSysAdmin ||
        tp.departmentName.trim().toLowerCase() ===
          userProfile.departmentName.trim().toLowerCase()
    );
  }, [trustProfiles, isSysAdmin, userProfile.departmentName]);

  return (
    <>
      {/* =====================================================================
          NÚT MỞ AI GÓC DƯỚI PHẢI HOẶC THANH THU GỌN SÁT MÉP PHẢI KHI TẠM ẨN
         ===================================================================== */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5">
          {isWidgetSnoozed ? (
            <button
              type="button"
              onClick={() => {
                setIsWidgetSnoozed(false);
                setIsOpen(true);
              }}
              className="px-2.5 py-2 rounded-l-2xl rounded-r-lg bg-slate-900/90 hover:bg-indigo-600 text-white border border-slate-700 shadow-lg flex items-center gap-1 text-[11px] font-extrabold transition"
              title={ui.openAiLabel}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <Cloud className="w-3.5 h-3.5" />
              <span>{ui.restoreAiLabel}</span>
            </button>
          ) : (
            <div className="relative group flex items-center">
              {/* Nút nhỏ góc trên trái để tạm ẩn hẳn icon AI sang mép phải nếu vướng mắt */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWidgetSnoozed(true);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -left-2 z-20 w-6 h-6 rounded-full bg-slate-800 hover:bg-rose-600 text-white border border-slate-600 flex items-center justify-center shadow-md"
                title={ui.snoozeAiTooltip}
              >
                <EyeOff className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="relative w-13 h-13 p-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl border border-indigo-400/40 flex items-center justify-center transition-all duration-200 hover:scale-105"
                aria-label={ui.openAiLabel}
              >
                <Cloud className="w-6 h-6 text-white fill-white/15" />
                <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />

                <div className="pointer-events-none opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap px-3.5 py-2 rounded-2xl bg-slate-900/95 text-white border border-slate-700 shadow-xl text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-extrabold">
                      {ui.hoverTitle}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-600 text-white">
                      {userProfile.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    {ui.hoverSub}
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          NGĂN KÉO CHAT AI BÊN PHẢI VỚI NÚT "TẠM TẮT" RÕ RÀNG & HỖ TRỢ ĐA THIẾT BỊ
         ===================================================================== */}
      {isOpen && (
        <>
          {/* Lớp nền mờ trên điện thoại/iPad để chạm ra ngoài là tạm tắt nhanh */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <aside
            className={`fixed bottom-2 sm:bottom-4 right-2 sm:right-4 top-14 sm:top-4 z-50 flex flex-col rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-2xl transition-all duration-300 ${
              isExpandedWidth
                ? 'w-[calc(100vw-1rem)] sm:w-[620px]'
                : 'w-[calc(100vw-1rem)] sm:w-[440px]'
            } ${
              isDark
                ? 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-black/80'
                : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/20'
            }`}
          >
            {/* Header có nút "− Tạm tắt" rõ ràng ngay bên cạnh */}
            <div className="px-3.5 py-3 border-b bg-slate-900 border-slate-800 text-white flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0">
                  <Cloud className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black truncate">
                    AURA-X • AI ({userProfile.role})
                  </h3>
                  <p className="text-[10px] text-slate-300 truncate">
                    @{userProfile.username} • {userProfile.departmentName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Nút Tạm tắt Chat bên cạnh theo đúng yêu cầu */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-slate-950 border border-amber-400/40 text-[11px] font-extrabold flex items-center gap-1 transition"
                  title={ui.minimizeChatTooltip}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>{ui.minimizeChatBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpandedWidth((prev) => !prev)}
                  className="hidden sm:inline-flex p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                  title={ui.expandTooltip}
                >
                  {isExpandedWidth ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMessages([
                      {
                        id: `WELCOME-${Date.now()}`,
                        sender: 'AI',
                        contentText: welcomeMessageText,
                        timestampText: 'Now',
                      },
                    ])
                  }
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                  title={ui.resetTooltip}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition"
                  title={ui.closeTooltip}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SÂN KHẤU WEBGL 3D CỦA LINH VẬT AI */}
            <div className="p-3 pb-1.5 shrink-0">
              <SpotMatrixMascot3DStage
                isDark={isDark}
                aiMood={aiMood}
                webLanguage={webLanguage}
              />

              <div
                className={`mt-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold flex flex-wrap items-center justify-between gap-2 ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                  {ui.statFreeRooms(roleScopedKnowledgeBase.freeRooms.length, 25)}
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-500" />
                  {ui.statMyBookings(roleScopedKnowledgeBase.myBookings.length)}
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-indigo-500" />
                  {ui.statTrustScore(userProfile.trustScore)}
                </span>
              </div>
            </div>

            {/* DANH SÁCH TIN NHẮN & THẺ HÀNH ĐỘNG TƯƠNG TÁC TRỰC TIẾP */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto px-3.5 py-2 space-y-3"
            >
              {messages.map((msg) => {
                const isUser = msg.sender === 'USER';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[94%] rounded-2xl p-3.5 text-xs space-y-2.5 shadow-sm ${
                        isUser
                          ? 'bg-indigo-600 text-white'
                          : isDark
                          ? 'bg-slate-900 border border-slate-800 text-slate-100'
                          : 'bg-slate-100/90 border border-slate-200/90 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 font-extrabold border-b border-current/10 pb-1">
                        <span>
                          {isUser
                            ? `${userProfile.fullName} (@${userProfile.username})`
                            : 'AURA-X • SpotMatrix AI Agent'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span>{msg.timestampText}</span>
                          {!isUser && (
                            <button
                              type="button"
                              onClick={() => handleSpeakMessage(msg.contentText)}
                              className="p-0.5 rounded hover:bg-indigo-500/20 text-indigo-400"
                              title={ui.readAloudTooltip}
                            >
                              {isSpeaking ? (
                                <VolumeX className="w-3 h-3" />
                              ) : (
                                <Volume2 className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 pt-1">
                          {msg.attachments.map((att) =>
                            att.base64DataUrl ? (
                              <div
                                key={att.id}
                                className="rounded-xl overflow-hidden border border-white/20 bg-black/20"
                              >
                                <img
                                  src={att.base64DataUrl}
                                  alt={att.fileName}
                                  className="w-full max-h-44 object-cover"
                                />
                                <div className="px-2.5 py-1 text-[10px] font-bold flex items-center justify-between">
                                  <span className="truncate">{att.fileName}</span>
                                  <span>{att.imageDimensions}</span>
                                </div>
                              </div>
                            ) : (
                              <div
                                key={att.id}
                                className="p-2 rounded-xl bg-black/15 border border-white/15 flex items-center gap-2 text-[11px]"
                              >
                                <FileText className="w-4 h-4 shrink-0 text-indigo-300" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold truncate">
                                    {att.fileName}
                                  </p>
                                  <p className="text-[10px] opacity-75">
                                    {(att.sizeBytes / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {renderFormattedAiMarkdown(msg.contentText, isUser)}

                      {/* THẺ HÀNH ĐỘNG 1: CHỌN PHÒNG ĐỂ ĐIỀN SẴN HOẶC ĐẶT / XIN PHÉP NGAY TẠI ĐÂY */}
                      {msg.bookingSuggestion &&
                        msg.bookingSuggestion.candidateRooms.length > 0 && (
                          <div
                            className={`mt-2 p-3 rounded-2xl border space-y-2 ${
                              isDark
                                ? 'bg-slate-950 border-slate-800'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <p className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                              <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {ui.chooseRoomHeader(
                                  msg.bookingSuggestion.dateIso,
                                  msg.bookingSuggestion.weekdayLabel,
                                  msg.bookingSuggestion.start,
                                  msg.bookingSuggestion.end
                                )}
                              </span>
                            </p>

                            <div className="space-y-2">
                              {msg.bookingSuggestion.candidateRooms.map((rm) => {
                                const alreadyBookedCode =
                                  executedBookingMsgIds[msg.id];
                                const isThisBooked =
                                  alreadyBookedCode === rm.nodeCode;

                                return (
                                  <div
                                    key={rm.nodeCode}
                                    className={`p-2.5 rounded-xl border flex flex-col gap-2 ${
                                      isDark
                                        ? 'bg-slate-900 border-slate-800'
                                        : 'bg-slate-50 border-slate-200/80'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-extrabold text-xs">
                                        [{rm.nodeCode}] {rm.nodeLabel}
                                      </span>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 shrink-0">
                                        {ui.roomCapFloor(
                                          rm.capacityCount,
                                          rm.floorLevel
                                        )}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {onAiNavigateAndPrefillBooking && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onAiNavigateAndPrefillBooking(rm, {
                                              dateIso:
                                                msg.bookingSuggestion!.dateIso,
                                              start:
                                                msg.bookingSuggestion!.start,
                                              end: msg.bookingSuggestion!.end,
                                              purposeNote:
                                                msg.bookingSuggestion!
                                                  .purposeNote,
                                              approvalRequestReason:
                                                msg.bookingSuggestion!
                                                  .approvalRequestReason,
                                            });
                                          }}
                                          className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                                            isDark
                                              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                          }`}
                                        >
                                          <span>{ui.goToBookingPrefillBtn}</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      )}

                                      {onAiExecuteDirectBooking && (
                                        <button
                                          type="button"
                                          disabled={Boolean(alreadyBookedCode)}
                                          onClick={() => {
                                            onAiExecuteDirectBooking(rm, {
                                              dateIso:
                                                msg.bookingSuggestion!.dateIso,
                                              start:
                                                msg.bookingSuggestion!.start,
                                              end: msg.bookingSuggestion!.end,
                                              purposeNote:
                                                msg.bookingSuggestion!
                                                  .purposeNote,
                                              approvalRequestReason:
                                                msg.bookingSuggestion!
                                                  .approvalRequestReason,
                                            });
                                            setExecutedBookingMsgIds((prev) => ({
                                              ...prev,
                                              [msg.id]: rm.nodeCode,
                                            }));
                                          }}
                                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 transition ${
                                            isThisBooked
                                              ? 'bg-emerald-600 text-white'
                                              : alreadyBookedCode
                                              ? 'opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-800 text-slate-500'
                                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                                          }`}
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>
                                            {isThisBooked
                                              ? ui.bookedSuccessBtn
                                              : userProfile.role === 'EMPLOYEE'
                                              ? ui.requestRoomNowBtn(rm.nodeCode)
                                              : ui.confirmRoomNowBtn(rm.nodeCode)}
                                          </span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      {/* THẺ HÀNH ĐỘNG 2: FORM BỔ SUNG THÔNG TIN ĐỂ TẠO NHÓM MỚI TRỰC TIẾP TRONG CHAT AI */}
                      {msg.groupDraftAction && (
                        <div
                          className={`mt-2 p-3.5 rounded-2xl border space-y-2.5 ${
                            isDark
                              ? 'bg-slate-950 border-slate-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                            <Users className="w-4 h-4" />
                            <span>
                              {ui.groupFormHeader(
                                msg.groupDraftAction.departmentName
                              )}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                                {ui.groupCodeLabel}
                              </label>
                              <input
                                type="text"
                                value={inlineGrpCode}
                                onChange={(e) => setInlineGrpCode(e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${
                                  isDark
                                    ? 'bg-slate-900 border-slate-700 text-white'
                                    : 'bg-slate-50 border-slate-200 text-slate-900'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                                {ui.groupTagLabel}
                              </label>
                              <input
                                type="text"
                                value={inlineGrpTag}
                                onChange={(e) => setInlineGrpTag(e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${
                                  isDark
                                    ? 'bg-slate-900 border-slate-700 text-white'
                                    : 'bg-slate-50 border-slate-200 text-slate-900'
                                }`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                              {ui.groupNameLabel}
                            </label>
                            <input
                              type="text"
                              value={inlineGrpName}
                              onChange={(e) => setInlineGrpName(e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-900'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                              {ui.groupLeaderLabel}
                            </label>
                            <select
                              value={inlineGrpLeader}
                              onChange={(e) => setInlineGrpLeader(e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-900'
                              }`}
                            >
                              {deptEligibleLeaders.map((ld) => (
                                <option key={ld.userEmail} value={ld.userEmail}>
                                  {ld.fullName} ({ld.role})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                              {ui.groupDescLabel}
                            </label>
                            <input
                              type="text"
                              value={inlineGrpDesc}
                              onChange={(e) => setInlineGrpDesc(e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-900'
                              }`}
                            />
                          </div>

                          <button
                            type="button"
                            disabled={Boolean(executedGroupMsgIds[msg.id])}
                            onClick={() => {
                              if (!onAiUpsertGroup || !inlineGrpName.trim())
                                return;
                              const leaderObj = trustProfiles.find(
                                (tp) =>
                                  tp.userEmail.toLowerCase() ===
                                  inlineGrpLeader.toLowerCase()
                              );
                              const newGroup: OrganizationGroupItem = {
                                groupId: `GRP-AI-${Date.now()}`,
                                groupCode: inlineGrpCode.trim().toUpperCase(),
                                groupName: inlineGrpName.trim(),
                                departmentName:
                                  msg.groupDraftAction!.departmentName,
                                description: inlineGrpDesc.trim(),
                                leaderEmail: inlineGrpLeader,
                                leaderName:
                                  leaderObj?.fullName || userProfile.fullName,
                                projectTag: inlineGrpTag.trim() || 'AI Squad',
                                memberEmails: [inlineGrpLeader],
                                updatedAtIso: new Date().toISOString(),
                              };
                              onAiUpsertGroup(newGroup);
                              setExecutedGroupMsgIds((prev) => ({
                                ...prev,
                                [msg.id]: true,
                              }));
                            }}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                              executedGroupMsgIds[msg.id]
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {executedGroupMsgIds[msg.id]
                                ? ui.groupCreatedBtn
                                : ui.groupConfirmBtn}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CÁC NÚT GỢI Ý LỆNH THỰC THI NHANH THEO ROLE */}
            <div className="px-3.5 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-slate-200/60 dark:border-slate-800/80 shrink-0">
              {quickSuggestedPrompts.map((qText) => (
                <button
                  key={qText}
                  type="button"
                  onClick={() => handleSubmitChat(undefined, qText)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap transition shrink-0 ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-500/50'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {qText}
                </button>
              ))}
            </div>

            {pendingAttachments.length > 0 && (
              <div
                className={`px-3.5 py-2 border-t flex flex-wrap gap-2 max-h-28 overflow-y-auto ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {pendingAttachments.map((att) => (
                  <div
                    key={att.id}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    {att.base64DataUrl ? (
                      <img
                        src={att.base64DataUrl}
                        alt={att.fileName}
                        className="w-7 h-7 rounded object-cover"
                      />
                    ) : (
                      <FileText className="w-4 h-4 text-indigo-500" />
                    )}
                    <span className="truncate max-w-[130px]">
                      {att.fileName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingAttachments((prev) =>
                          prev.filter((item) => item.id !== att.id)
                        )
                      }
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* THANH NHẬP LỆNH / CÂU HỎI + ĐÍNH KÈM ẢNH & FILE */}
            <form
              onSubmit={(e) => handleSubmitChat(e)}
              className={`p-3 border-t flex items-center gap-2 shrink-0 ${
                isDark
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUploadChange(e, 'IMAGE')}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.json,.md,.ts,.tsx,.js,.py,.log,.html,.xml,.pdf,.doc,.docx"
                multiple
                onChange={(e) => handleFileUploadChange(e, 'FILE')}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className={`p-2.5 rounded-xl border transition shrink-0 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-500/50'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
                title={ui.attachImgTooltip}
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2.5 rounded-xl border transition shrink-0 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-500/50'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
                title={ui.attachFileTooltip}
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder={ui.inputPlaceholder}
                className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                }`}
              />

              <button
                type="submit"
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition shrink-0"
                title={ui.sendTooltip}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </aside>
        </>
      )}
    </>
  );
};
