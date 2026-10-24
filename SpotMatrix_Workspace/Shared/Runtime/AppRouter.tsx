import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  CalendarCheck,
  Database,
  ShieldAlert,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Sparkles,
  User,
  Settings,
  Mail,
  Building2,
  Award,
  Music,
  VolumeX,
} from 'lucide-react';
import { SpotMatrixLogo } from '../Components/SpotMatrixLogo';
import {
  AuditConcurrencyLogItem,
  BookingPayloadItem,
  EquipmentStatusType,
  NotificationCategoryType,
  NotificationRecordItem,
  SeatStatusType,
  SharedEquipmentItem,
  UserTrustProfileItem,
  WorkspaceNodeItem,
  WorkspaceZoneType,
} from '../Types/GlobalSystemTypes';
import { ErrorBoundaryLayout } from '../../Error/Layout/ErrorBoundaryLayout';
import { DashboardMainPages } from '../../Main/Dashboard/Pages/DashboardMainPages';
import { DataOverviewPages } from '../../Main/Datamanager/Pages/DataOverviewPages';
import { FloorplanMainPages } from '../../Main/Floorplan/Pages/FloorplanMainPages';
import {
  BookingCalendarPages,
  BookingTimeWindowInput,
} from '../../Main/Booking/Pages/BookingCalendarPages';
import { QrCheckinConfirmPages } from '../../Main/Booking/Pages/QrCheckinConfirmPages';
import {
  AuthenticatedUserSession,
  LoginPages,
} from '../../Main/Auth/Pages/LoginPages';
import {
  ProfilePages,
  UserProfileCustomization,
} from '../../Main/Auth/Pages/ProfilePages';
import {
  AUDIO_SETTINGS_STORAGE_KEY,
  LofiTrackStyleType,
  SettingsPages,
  SpotMatrixAudioSettings,
} from '../../Main/Auth/Pages/SettingsPages';
import { NotificationHeaderBell } from '../../Main/Notification/Function/Components/NotificationHeaderBell';
import { RealtimePopupToast } from '../../Main/Notification/Function/Components/RealtimePopupToast';
import { NotificationCenterPages } from '../../Main/Notification/Pages/NotificationCenterPages';
import {
  AuditLogPages,
  ManagedUserAccountItem,
} from '../../Main/Auditlog/Pages/AuditLogPages';

const SESSION_STORAGE_KEY = 'spotmatrix_active_session_v2';
const PROFILE_CUSTOM_STORAGE_KEY = 'spotmatrix_profile_custom_v2';

type ActiveSidebarPage =
  | 'OVERVIEW'
  | 'FLOORPLAN'
  | 'BOOKING'
  | 'NOTIFICATION'
  | 'DATAMANAGER'
  | 'AUDIT'
  | 'PROFILE'
  | 'SETTINGS';

function buildStandardFiveFloorRooms(): WorkspaceNodeItem[] {
  const rooms: WorkspaceNodeItem[] = [];
  const floorTemplates = [
    { codeSuffix: '01', name: 'Phòng Họp Đối tác Nhỏ', zone: 'MEETING_ROOM' as WorkspaceZoneType, cap: 2, posX: 150, posY: 115, status: 'AVAILABLE' as SeatStatusType },
    { codeSuffix: '02', name: 'Phòng Họp Nhóm Sprint', zone: 'MEETING_ROOM' as WorkspaceZoneType, cap: 6, posX: 400, posY: 115, status: 'OCCUPIED' as SeatStatusType },
    { codeSuffix: '03', name: 'Phòng Họp Boardroom Lớn', zone: 'MEETING_ROOM' as WorkspaceZoneType, cap: 10, posX: 650, posY: 115, status: 'AVAILABLE' as SeatStatusType },
    { codeSuffix: '04', name: 'Phòng Họp Bàn Tròn Sáng tạo', zone: 'COLLAB_HUB' as WorkspaceZoneType, cap: 4, posX: 150, posY: 345, status: 'AVAILABLE' as SeatStatusType },
    { codeSuffix: '05', name: 'Phòng Họp Bàn Tròn Thảo luận', zone: 'COLLAB_HUB' as WorkspaceZoneType, cap: 8, posX: 400, posY: 345, status: 'RESERVED' as SeatStatusType },
    { codeSuffix: '06', name: 'Phòng Họp Hội đồng VIP', zone: 'QUIET_POD' as WorkspaceZoneType, cap: 12, posX: 650, posY: 345, status: 'AVAILABLE' as SeatStatusType },
  ];

  for (let floor = 1; floor <= 4; floor++) {
    floorTemplates.forEach((tpl, idx) => {
      const roomCode = `M${floor}-${tpl.codeSuffix}`;
      rooms.push({
        nodeId: `NODE-M${floor}${tpl.codeSuffix}`,
        nodeCode: roomCode,
        nodeLabel: `${tpl.name} ${roomCode} (Tầng ${floor})`,
        zoneType: tpl.zone,
        floorLevel: floor,
        position2D: { posX: tpl.posX, posY: tpl.posY },
        position3D: { coordX: (idx % 3) * 4 - 4, coordY: 0.5, coordZ: idx < 3 ? -3 : 3 },
        capacityCount: tpl.cap,
        status: floor === 1 ? tpl.status : idx === floor % 5 ? 'OCCUPIED' : 'AVAILABLE',
        amenitiesList: ['Bàn họp lớn', `${tpl.cap} ghế tiêu chuẩn`, 'Màn hình 4K', 'Cách âm 40dB'],
        aiScore: 98 - idx * 2,
        lockVersion: 1,
      });
    });
  }

  rooms.push({
    nodeId: 'NODE-H01-COLOSSEUM',
    nodeCode: 'H-01',
    nodeLabel: 'Hội trường Lớn Đấu Trường La Mã (Tầng 5)',
    zoneType: 'MEETING_ROOM',
    floorLevel: 5,
    position2D: { posX: 400, posY: 230 },
    position3D: { coordX: 0, coordY: 0.5, coordZ: 0 },
    capacityCount: 30,
    status: 'AVAILABLE',
    amenitiesList: ['Bục Diễn Giả trung tâm', 'Ghế vòm La Mã H01-A1..B8', 'Màn hình LED Panorama 360°'],
    aiScore: 99,
    lockVersion: 1,
  });

  return rooms;
}

const INITIAL_ROOM_EQUIPMENTS: SharedEquipmentItem[] = [
  { equipmentId: 'EQ-01', equipmentCode: 'EQ-M101-SCREEN-01', equipmentName: 'Màn hình Hội nghị 4K Samsung 75"', categoryName: 'PROJECTOR', status: 'AVAILABLE', assignedNodeId: 'M1-01', position2D: { posX: 150, posY: 115 }, currentBookingId: null, weeklyUsageHours: 24, monthlyUsageHours: 96, healthPercent: 98 },
  { equipmentId: 'EQ-02', equipmentCode: 'EQ-M101-CAM-02', equipmentName: 'Camera AI 360° Poly Studio E70', categoryName: 'AUDIO_POD', status: 'AVAILABLE', assignedNodeId: 'M1-01', position2D: { posX: 150, posY: 115 }, currentBookingId: null, weeklyUsageHours: 18, monthlyUsageHours: 72, healthPercent: 94 },
  { equipmentId: 'EQ-03', equipmentCode: 'EQ-M102-LASER-01', equipmentName: 'Máy chiếu Laser Epson 4K Pro', categoryName: 'PROJECTOR', status: 'IN_USE', assignedNodeId: 'M1-02', position2D: { posX: 400, posY: 115 }, currentBookingId: 'BK-2026-001', weeklyUsageHours: 31, monthlyUsageHours: 124, healthPercent: 86 },
  { equipmentId: 'EQ-04', equipmentCode: 'EQ-M103-HUB-01', equipmentName: 'Trạm Chia tín hiệu HDMI & Type-C 100W', categoryName: 'TYPE_C_HUB', status: 'BROKEN', assignedNodeId: 'M1-03', position2D: { posX: 650, posY: 115 }, currentBookingId: null, weeklyUsageHours: 12, monthlyUsageHours: 54, healthPercent: 45 },
  { equipmentId: 'EQ-05', equipmentCode: 'EQ-M205-WACOM-01', equipmentName: 'Bảng Tương tác Cảm ứng KTS Wacom 24"', categoryName: 'WACOM_TABLET', status: 'AVAILABLE', assignedNodeId: 'M2-05', position2D: { posX: 400, posY: 345 }, currentBookingId: null, weeklyUsageHours: 19, monthlyUsageHours: 78, healthPercent: 95 },
  { equipmentId: 'EQ-06', equipmentCode: 'EQ-H01-PANO-01', equipmentName: 'Màn hình LED Cong Panorama 360° Hội trường', categoryName: 'PROJECTOR', status: 'AVAILABLE', assignedNodeId: 'H-01', position2D: { posX: 400, posY: 230 }, currentBookingId: null, weeklyUsageHours: 28, monthlyUsageHours: 112, healthPercent: 99 },
];

const INITIAL_TRUST_PROFILES: UserTrustProfileItem[] = [
  { userEmail: 'sysadmin@spotmatrix.vn', fullName: 'System Administrator', role: 'SYS_ADMIN', departmentName: 'System Governance', trustScore: 100, onTimeCheckInCount: 32, noShowPenaltyCount: 0, isRestrictedMode: false, updatedAtIso: new Date().toISOString() },
  { userEmail: 'manager.lead@spotmatrix.vn', fullName: 'Lê Thu Hà (Quản lý)', role: 'MANAGER', departmentName: 'Product & Engineering', trustScore: 100, onTimeCheckInCount: 28, noShowPenaltyCount: 0, isRestrictedMode: false, updatedAtIso: new Date().toISOString() },
  { userEmail: 'employee.dev@spotmatrix.vn', fullName: 'Nguyễn Minh Quân (Nhân viên)', role: 'EMPLOYEE', departmentName: 'Product & Engineering', trustScore: 96, onTimeCheckInCount: 18, noShowPenaltyCount: 1, isRestrictedMode: false, updatedAtIso: new Date().toISOString() },
];

const INITIAL_FIVE_FLOOR_ROOMS = buildStandardFiveFloorRooms();

const INITIAL_MANAGED_USERS: ManagedUserAccountItem[] = [
  { accountCode: 'ACC-ADMIN-001', username: 'Systemadmin123', userEmail: 'sysadmin@spotmatrix.vn', fullName: 'System Administrator', departmentName: 'System Governance', role: 'SYS_ADMIN', trustScore: 100, accountStatus: 'ACTIVE', isOnline: false, lastActiveText: 'Chưa đăng nhập' },
  { accountCode: 'ACC-MGR-002', username: 'Managerlead123', userEmail: 'manager.lead@spotmatrix.vn', fullName: 'Lê Thu Hà (Quản lý)', departmentName: 'Product & Engineering', role: 'MANAGER', trustScore: 100, accountStatus: 'ACTIVE', isOnline: false, lastActiveText: 'Chưa đăng nhập' },
  { accountCode: 'ACC-EMP-003', username: 'Employeedev123', userEmail: 'employee.dev@spotmatrix.vn', fullName: 'Nguyễn Minh Quân (Nhân viên)', departmentName: 'Product & Engineering', role: 'EMPLOYEE', trustScore: 96, accountStatus: 'ACTIVE', isOnline: false, lastActiveText: 'Chưa đăng nhập' },
];

const LOFI_CHORD_PROGRESSIONS: Record<LofiTrackStyleType, number[][]> = {
  CHILL_RHODES: [
    [174.61, 220.0, 261.63, 329.63],
    [164.81, 196.0, 246.94, 293.66],
    [146.83, 174.61, 220.0, 261.63],
    [130.81, 164.81, 196.0, 246.94],
  ],
  AMBIENT_SPACE: [
    [220.0, 261.63, 329.63, 392.0],
    [174.61, 220.0, 261.63, 329.63],
    [130.81, 196.0, 246.94, 329.63],
    [196.0, 246.94, 293.66, 329.63],
  ],
  RAINY_CAFE: [
    [146.83, 220.0, 261.63, 329.63],
    [196.0, 246.94, 293.66, 349.23],
    [130.81, 164.81, 246.94, 293.66],
    [220.0, 277.18, 329.63, 392.0],
  ],
};

const MainWorkspaceRoutes: React.FC = () => {
  const navigate = useNavigate();
  const avatarDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState<boolean>(false);
  const [isSyncingMongo, setIsSyncingMongo] = useState<boolean>(false);

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('spotmatrix_theme_mode');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const isDark = themeMode === 'dark';

  const [audioSettings, setAudioSettings] = useState<SpotMatrixAudioSettings>(() => {
    try {
      const raw = localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          lofiEnabled: Boolean(parsed.lofiEnabled),
          sfxEnabled: parsed.sfxEnabled !== false,
          lofiVolume: typeof parsed.lofiVolume === 'number' ? parsed.lofiVolume : 0.35,
          lofiTrackStyle: parsed.lofiTrackStyle || 'CHILL_RHODES',
        };
      }
    } catch {
      // Bỏ qua
    }
    return {
      lofiEnabled: false,
      sfxEnabled: true,
      lofiVolume: 0.35,
      lofiTrackStyle: 'CHILL_RHODES',
    };
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lofiIntervalRef = useRef<number | null>(null);
  const chordStepRef = useRef<number>(0);

  const getOrInitAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const playUiSoundEffect = useCallback(
    (type: 'CLICK' | 'SUCCESS' | 'ERROR' | 'NOTIFICATION', forcePlay = false) => {
      if (!audioSettings.sfxEnabled && !forcePlay) return;
      const ctx = getOrInitAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'CLICK') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.045);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.055);
        return;
      }

      if (type === 'SUCCESS') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.065);
          gain.gain.setValueAtTime(0.11, now + idx * 0.065);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.065);
          osc.stop(now + idx * 0.065 + 0.24);
        });
        return;
      }

      if (type === 'ERROR') {
        [240, 180].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.11);
          gain.gain.setValueAtTime(0.09, now + idx * 0.11);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.11);
          osc.stop(now + idx * 0.11 + 0.18);
        });
        return;
      }

      if (type === 'NOTIFICATION') {
        [880, 1318.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.1, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.32);
        });
      }
    },
    [audioSettings.sfxEnabled, getOrInitAudioContext]
  );

  useEffect(() => {
    if (lofiIntervalRef.current) {
      window.clearInterval(lofiIntervalRef.current);
      lofiIntervalRef.current = null;
    }
    if (!audioSettings.lofiEnabled) return;

    const playSingleLofiBar = () => {
      const ctx = getOrInitAudioContext();
      if (!ctx) return;
      const progression =
        LOFI_CHORD_PROGRESSIONS[audioSettings.lofiTrackStyle] ||
        LOFI_CHORD_PROGRESSIONS.CHILL_RHODES;
      const chord = progression[chordStepRef.current % progression.length];
      chordStepRef.current += 1;

      const now = ctx.currentTime;
      const masterVol = Math.max(0.02, Math.min(1, audioSettings.lofiVolume)) * 0.12;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(
        audioSettings.lofiTrackStyle === 'AMBIENT_SPACE' ? 750 : 1050,
        now
      );
      filter.connect(ctx.destination);

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = audioSettings.lofiTrackStyle === 'AMBIENT_SPACE' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq + (idx % 2 === 0 ? 0.4 : -0.4), now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(masterVol / chord.length, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 2.9);
        osc.connect(gain);
        gain.connect(filter);
        osc.start(now);
        osc.stop(now + 2.95);
      });

      if (audioSettings.lofiTrackStyle === 'CHILL_RHODES') {
        [0, 1.5].forEach((beatOffset) => {
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(115, now + beatOffset);
          kickOsc.frequency.exponentialRampToValueAtTime(42, now + beatOffset + 0.14);
          kickGain.gain.setValueAtTime(masterVol * 0.85, now + beatOffset);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + beatOffset + 0.18);
          kickOsc.connect(kickGain);
          kickGain.connect(ctx.destination);
          kickOsc.start(now + beatOffset);
          kickOsc.stop(now + beatOffset + 0.2);
        });
      }
    };

    playSingleLofiBar();
    lofiIntervalRef.current = window.setInterval(playSingleLofiBar, 3000);

    return () => {
      if (lofiIntervalRef.current) {
        window.clearInterval(lofiIntervalRef.current);
        lofiIntervalRef.current = null;
      }
    };
  }, [
    audioSettings.lofiEnabled,
    audioSettings.lofiVolume,
    audioSettings.lofiTrackStyle,
    getOrInitAudioContext,
  ]);

  useEffect(() => {
    const handleAudioEvent = (ev: Event) => {
      const customEv = ev as CustomEvent<SpotMatrixAudioSettings>;
      if (customEv.detail) {
        setAudioSettings(customEv.detail);
      }
    };
    window.addEventListener('spotmatrix-audio-settings-changed', handleAudioEvent);
    return () =>
      window.removeEventListener('spotmatrix-audio-settings-changed', handleAudioEvent);
  }, []);

  const persistAudioSettings = (next: SpotMatrixAudioSettings) => {
    setAudioSettings(next);
    try {
      localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Bỏ qua
    }
  };

  const toggleThemeMode = () => {
    const next = isDark ? 'light' : 'dark';
    setThemeMode(next);
    localStorage.setItem('spotmatrix_theme_mode', next);
    playUiSoundEffect('CLICK');
  };

  const [userSession, setUserSession] = useState<AuthenticatedUserSession | null>(() => {
    try {
      const savedRaw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return savedRaw ? JSON.parse(savedRaw) : null;
    } catch {
      return null;
    }
  });

  const [profileCustomMap, setProfileCustomMap] = useState<
    Record<
      string,
      {
        avatarUrl: string | null;
        backgroundUrl: string | null;
        phoneNumber: string;
        jobTitle: string;
        bioText: string;
      }
    >
  >(() => {
    try {
      const raw = localStorage.getItem(PROFILE_CUSTOM_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [activePage, setActivePage] = useState<ActiveSidebarPage>('OVERVIEW');
  const [workspaceNodes, setWorkspaceNodes] =
    useState<WorkspaceNodeItem[]>(INITIAL_FIVE_FLOOR_ROOMS);
  const [selectedNode, setSelectedNode] = useState<WorkspaceNodeItem | null>(
    INITIAL_FIVE_FLOOR_ROOMS[0]
  );
  const [preselectedSlot, setPreselectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [bookingsList, setBookingsList] = useState<BookingPayloadItem[]>([
    {
      bookingId: 'BK-2026-001',
      nodeId: 'M1-01',
      userEmail: 'employee.dev@spotmatrix.vn',
      requesterUsername: 'Employeedev123',
      requesterRole: 'EMPLOYEE',
      bookingDateIso: new Date().toISOString().slice(0, 10),
      startTimeIso: '08:00',
      endTimeIso: '10:00',
      purposeNote: 'Họp Kiến trúc Hệ thống 3D (Tầng 1)',
      recurringOption: 'NONE',
      occurrenceDates: [new Date().toISOString().slice(0, 10)],
      lockVersion: 1,
      bookingStatus: 'CONFIRMED',
      approvalStatus: 'APPROVED',
      approvedByUsername: 'Managerlead123',
    },
    {
      bookingId: 'BK-2026-002',
      nodeId: 'H01-A3',
      userEmail: 'manager.lead@spotmatrix.vn',
      requesterUsername: 'Managerlead123',
      requesterRole: 'MANAGER',
      bookingDateIso: new Date().toISOString().slice(0, 10),
      startTimeIso: '13:00',
      endTimeIso: '15:00',
      purposeNote: '[Hội trường Tầng 5 - Ghế H01-A3] Townhall Quý 4',
      recurringOption: 'NONE',
      occurrenceDates: [new Date().toISOString().slice(0, 10)],
      lockVersion: 2,
      bookingStatus: 'CHECKED_IN',
      approvalStatus: 'APPROVED',
      approvedByUsername: 'Systemadmin123',
      checkedInAtIso: '12:45:10 • Hôm nay',
    },
  ]);

  const [equipmentsList, setEquipmentsList] =
    useState<SharedEquipmentItem[]>(INITIAL_ROOM_EQUIPMENTS);
  const [trustProfiles, setTrustProfiles] =
    useState<UserTrustProfileItem[]>(INITIAL_TRUST_PROFILES);
  const [auditLogs, setAuditLogs] = useState<AuditConcurrencyLogItem[]>([
    {
      auditId: 'AUD-INIT-01',
      eventCategory: 'QR_CHECKIN_SUCCESS',
      actorEmail: 'manager.lead@spotmatrix.vn',
      targetNodeId: 'H01-A3',
      outcomeStatus: 'SUCCESS',
      detailMessage:
        'Xác nhận quét QR đúng hạn tại Hội trường H01-A3 lúc 12:45:10 (+2 điểm tín nhiệm).',
      createdAtIso: new Date().toISOString(),
    },
  ]);
  const [managedUsers, setManagedUsers] =
    useState<ManagedUserAccountItem[]>(INITIAL_MANAGED_USERS);

  const [notificationsList, setNotificationsList] = useState<NotificationRecordItem[]>([]);
  const [activePopupNotification, setActivePopupNotification] =
    useState<NotificationRecordItem | null>(null);

  const isSysAdmin = userSession?.userProfile.role === 'SYS_ADMIN';

  // Đồng bộ chính xác trạng thái Online thực tế: Chỉ duy nhất tài khoản đang đăng nhập mới hiện Đang Online
  useEffect(() => {
    const activeUsername = userSession?.userProfile.username?.toLowerCase();
    setManagedUsers((prev) =>
      prev.map((u) =>
        activeUsername && u.username.toLowerCase() === activeUsername
          ? { ...u, isOnline: true, lastActiveText: 'Đang trực tuyến (Phiên hiện tại)' }
          : { ...u, isOnline: false, lastActiveText: 'Chưa đăng nhập' }
      )
    );
  }, [userSession?.userProfile.username]);

  const fetchAccountProfileAndWorkspaceFromMongo = useCallback(async (username: string) => {
    try {
      const [profileRes, bookingsRes, trustRes, auditRes] = await Promise.allSettled([
        fetch(`/api/v1/auth/profile/${encodeURIComponent(username)}`),
        fetch('/api/v1/bookings'),
        fetch('/api/v1/datamanager/trust-scores'),
        fetch('/api/v1/datamanager/audit-logs'),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        const json = await profileRes.value.json();
        if (json?.success && json.data) {
          const p = json.data;
          setProfileCustomMap((prev) => {
            const nextMap = {
              ...prev,
              [username]: {
                avatarUrl: p.avatarUrl ?? prev[username]?.avatarUrl ?? null,
                backgroundUrl: p.backgroundUrl ?? prev[username]?.backgroundUrl ?? null,
                phoneNumber: p.phoneNumber || prev[username]?.phoneNumber || '0908 123 456',
                jobTitle: p.jobTitle || prev[username]?.jobTitle || 'Senior System Member',
                bioText:
                  p.bioText ||
                  prev[username]?.bioText ||
                  'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
              },
            };
            try {
              localStorage.setItem(PROFILE_CUSTOM_STORAGE_KEY, JSON.stringify(nextMap));
            } catch {
              // Bỏ qua
            }
            return nextMap;
          });
        }
      }

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.ok) {
        const bJson = await bookingsRes.value.json();
        if (bJson?.success && Array.isArray(bJson.data) && bJson.data.length > 0) {
          setBookingsList(bJson.data);
        }
      }

      if (trustRes.status === 'fulfilled' && trustRes.value.ok) {
        const tJson = await trustRes.value.json();
        if (tJson?.success && Array.isArray(tJson.data) && tJson.data.length > 0) {
          setTrustProfiles(tJson.data);
        }
      }

      if (auditRes.status === 'fulfilled' && auditRes.value.ok) {
        const aJson = await auditRes.value.json();
        if (aJson?.success && Array.isArray(aJson.data) && aJson.data.length > 0) {
          setAuditLogs(aJson.data);
        }
      }
    } catch {
      // Giữ nguyên state dự phòng
    }
  }, []);

  useEffect(() => {
    if (userSession?.userProfile.username) {
      fetchAccountProfileAndWorkspaceFromMongo(userSession.userProfile.username);
    }
  }, [userSession?.userProfile.username, fetchAccountProfileAndWorkspaceFromMongo]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        avatarDropdownRef.current &&
        !avatarDropdownRef.current.contains(e.target as Node)
      ) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recordRealtimeAuditLog = useCallback(
    (
      eventCategory: AuditConcurrencyLogItem['eventCategory'],
      actorEmail: string,
      targetNodeId: string,
      detailMessage: string,
      outcomeStatus: 'SUCCESS' | 'CONFLICT_BLOCKED' | 'AUTO_REVOKED' = 'SUCCESS',
      lockVersionAttempted?: number
    ) => {
      const newAudit: AuditConcurrencyLogItem = {
        auditId: `AUD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        eventCategory,
        actorEmail,
        targetNodeId,
        lockVersionAttempted,
        outcomeStatus,
        detailMessage,
        createdAtIso: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newAudit, ...prev]);
    },
    []
  );

  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === 'spotmatrix_last_qr_checkin_payload' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setBookingsList((prev) =>
            prev.map((b) =>
              b.bookingId === parsed.bookingId
                ? { ...b, bookingStatus: 'CHECKED_IN', checkedInAtIso: parsed.scannedAtText }
                : b
            )
          );
          recordRealtimeAuditLog(
            'QR_CHECKIN_SUCCESS',
            parsed.userEmail,
            parsed.roomCode,
            `Đã quét QR Check-in đúng hạn cho vé ${parsed.bookingId} tại thời điểm cố định: [${parsed.scannedAtText}].`
          );
        } catch {
          // Bỏ qua
        }
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, [recordRealtimeAuditLog]);

  const pushRealtimeNotification = useCallback(
    async (
      titleText: string,
      contentText: string,
      category: NotificationCategoryType = 'BOOKING_EVENT',
      relatedNodeId?: string,
      extraApproval?: {
        approvalBookingId: string;
        approvalHandledStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
      },
      customRecipientEmail?: string
    ) => {
      if (category === 'FLOORPLAN_UPDATE') return;

      const localItem: NotificationRecordItem = {
        notificationId: `NTF-${Date.now()}-${Math.floor(Math.random() * 99)}`,
        recipientEmail: customRecipientEmail || userSession?.userProfile.userEmail || 'all',
        titleText,
        contentText,
        category,
        isRead: false,
        relatedNodeId,
        approvalBookingId: extraApproval?.approvalBookingId,
        approvalHandledStatus: extraApproval?.approvalHandledStatus,
        createdAtIso: new Date().toISOString(),
      };

      setNotificationsList((prev) => [localItem, ...prev]);
      setActivePopupNotification(localItem);
      playUiSoundEffect('NOTIFICATION');
    },
    [userSession, playUiSoundEffect]
  );

  useEffect(() => {
    if (!activePopupNotification) return;
    const timer = setTimeout(() => {
      setActivePopupNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [activePopupNotification]);

  const handleLoginSuccess = (sessionData: AuthenticatedUserSession) => {
    setUserSession(sessionData);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    setActivePage('OVERVIEW');
    navigate('/dashboard', { replace: true });
    playUiSoundEffect('SUCCESS');

    const incomingProfile = sessionData.userProfile as AuthenticatedUserSession['userProfile'] & {
      avatarUrl?: string | null;
      backgroundUrl?: string | null;
      phoneNumber?: string;
      jobTitle?: string;
      bioText?: string;
    };
    if (incomingProfile.username) {
      setProfileCustomMap((prev) => ({
        ...prev,
        [incomingProfile.username]: {
          avatarUrl: incomingProfile.avatarUrl ?? prev[incomingProfile.username]?.avatarUrl ?? null,
          backgroundUrl:
            incomingProfile.backgroundUrl ?? prev[incomingProfile.username]?.backgroundUrl ?? null,
          phoneNumber:
            incomingProfile.phoneNumber || prev[incomingProfile.username]?.phoneNumber || '0908 123 456',
          jobTitle:
            incomingProfile.jobTitle || prev[incomingProfile.username]?.jobTitle || 'Senior System Member',
          bioText:
            incomingProfile.bioText ||
            prev[incomingProfile.username]?.bioText ||
            'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
        },
      }));
      fetchAccountProfileAndWorkspaceFromMongo(incomingProfile.username);
    }

    setManagedUsers((prev) => {
      const targetUser = sessionData.userProfile.username.toLowerCase();
      return prev.map((u) =>
        u.username.toLowerCase() === targetUser
          ? { ...u, isOnline: true, lastActiveText: 'Đang trực tuyến (Phiên hiện tại)' }
          : { ...u, isOnline: false, lastActiveText: 'Chưa đăng nhập' }
      );
    });
  };

  const handleLogout = () => {
    const loggingOutUsername = userSession?.userProfile.username?.toLowerCase();
    setManagedUsers((prev) =>
      prev.map((u) =>
        loggingOutUsername && u.username.toLowerCase() === loggingOutUsername
          ? { ...u, isOnline: false, lastActiveText: 'Vừa đăng xuất' }
          : u
      )
    );
    setIsAvatarMenuOpen(false);
    setUserSession(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setActivePopupNotification(null);
    navigate('/login', { replace: true });
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotificationsList((prev) =>
      prev.filter((item) => item.notificationId !== notificationId)
    );
  };

  const handleSelectAndNavigateNotification = (notifItem: NotificationRecordItem) => {
    setNotificationsList((prev) =>
      prev.map((n) =>
        n.notificationId === notifItem.notificationId ? { ...n, isRead: true } : n
      )
    );

    if (notifItem.relatedNodeId) {
      const foundNode = workspaceNodes.find(
        (n) =>
          n.nodeId === notifItem.relatedNodeId || n.nodeCode === notifItem.relatedNodeId
      );
      if (foundNode) {
        setSelectedNode(foundNode);
        setActivePage('FLOORPLAN');
        return;
      }
    }
    setActivePage('BOOKING');
  };

  const handleNavigateToBookingWithSlot = (
    nodeItem: WorkspaceNodeItem,
    slotTime: { start: string; end: string }
  ) => {
    setSelectedNode(nodeItem);
    setPreselectedSlot(slotTime);
    setActivePage('BOOKING');
    playUiSoundEffect('CLICK');
  };

  const handleApprovalDecision = (
    bookingId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    const actorUsername = userSession?.userProfile.username || 'Systemadmin123';
    const approvedTimeStr = new Date().toLocaleTimeString('vi-VN');
    playUiSoundEffect(decision === 'APPROVED' ? 'SUCCESS' : 'ERROR');

    setBookingsList((prev) =>
      prev.map((b) =>
        b.bookingId === bookingId
          ? {
              ...b,
              approvalStatus: decision,
              approvedByUsername: actorUsername,
              approvedAtIso: approvedTimeStr,
              bookingStatus: decision === 'REJECTED' ? 'CANCELLED' : 'CONFIRMED',
            }
          : b
      )
    );

    fetch(`/api/v1/bookings/${encodeURIComponent(bookingId)}/approval`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approvalStatus: decision,
        approvedByUsername: actorUsername,
        approvedAtIso: approvedTimeStr,
      }),
    }).catch(() => {});

    setNotificationsList((prev) =>
      prev.map((n) =>
        n.approvalBookingId === bookingId
          ? {
              ...n,
              isRead: true,
              approvalHandledStatus: decision,
              approvalHandledBy: actorUsername,
            }
          : n
      )
    );

    recordRealtimeAuditLog(
      'POLICY_CONFIG_UPDATED',
      actorUsername,
      bookingId,
      `@${actorUsername} đã [${
        decision === 'APPROVED' ? 'CHẤP NHẬN' : 'TỪ CHỐI'
      }] yêu cầu đặt phòng ${bookingId}.`
    );
  };

  // Quyền Tối cao SYS_ADMIN: Xóa lịch đặt phòng tại cửa sổ Xem chi tiết & Gửi thông báo đến người đặt
  const handleAdminDeleteBookingWithNotification = (
    bookingId: string,
    reasonText: string
  ) => {
    const targetBk = bookingsList.find((b) => b.bookingId === bookingId);
    const adminUsername = userSession?.userProfile.username || 'Systemadmin123';

    setBookingsList((prev) => prev.filter((b) => b.bookingId !== bookingId));

    fetch(`/api/v1/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
    }).catch(() => {});

    if (targetBk) {
      const matchedNode = workspaceNodes.find((n) => n.nodeCode === targetBk.nodeId);
      if (matchedNode) {
        setWorkspaceNodes((prev) =>
          prev.map((n) =>
            n.nodeId === matchedNode.nodeId ? { ...n, status: 'AVAILABLE' } : n
          )
        );
      }

      pushRealtimeNotification(
        `[Thông báo từ Admin] Đã xóa lịch đặt phòng ${targetBk.nodeId} (${targetBk.bookingId})`,
        `Quản trị viên (@${adminUsername}) đã xóa lịch đặt vị trí ${targetBk.nodeId} (${targetBk.startTimeIso} – ${targetBk.endTimeIso}, ngày ${
          targetBk.bookingDateIso || 'Hôm nay'
        }) của ${targetBk.userEmail}. Lý do: ${reasonText}`,
        'SYSTEM_POLICY',
        targetBk.nodeId,
        undefined,
        targetBk.userEmail
      );

      recordRealtimeAuditLog(
        'POLICY_CONFIG_UPDATED',
        adminUsername,
        targetBk.nodeId,
        `[Admin Xóa Lịch & Gửi Thông Báo] @${adminUsername} đã xóa vé ${targetBk.bookingId} tại ${targetBk.nodeId} của ${targetBk.userEmail}. Lý do: "${reasonText}".`,
        'AUTO_REVOKED'
      );
    }
  };

  const handleUpdateNodeCoords = async (nodeId: string, posX: number, posY: number) => {
    setWorkspaceNodes((prev) =>
      prev.map((item) =>
        item.nodeId === nodeId ? { ...item, position2D: { posX, posY } } : item
      )
    );
  };

  const handleUpdateNodeStatus = async (nodeId: string, nextStatus: SeatStatusType) => {
    setWorkspaceNodes((prev) =>
      prev.map((item) => (item.nodeId === nodeId ? { ...item, status: nextStatus } : item))
    );
    setSelectedNode((prev) =>
      prev && prev.nodeId === nodeId ? { ...prev, status: nextStatus } : prev
    );
  };

  const handleCreateNewNode = async (payload: {
    nodeCode: string;
    nodeLabel: string;
    zoneType: WorkspaceZoneType;
    floorLevel: number;
    capacityCount: number;
    posX: number;
    posY: number;
    amenitiesList: string[];
  }) => {
    const newNode: WorkspaceNodeItem = {
      nodeId: `NODE-${payload.nodeCode.replace('-', '')}-${Date.now().toString().slice(-3)}`,
      nodeCode: payload.nodeCode,
      nodeLabel: payload.nodeLabel,
      zoneType: payload.zoneType,
      floorLevel: payload.floorLevel,
      position2D: { posX: payload.posX, posY: payload.posY },
      position3D: { coordX: 0, coordY: 0.5, coordZ: 0 },
      capacityCount: Math.max(2, payload.capacityCount),
      status: 'AVAILABLE',
      amenitiesList: payload.amenitiesList,
      aiScore: 95,
      lockVersion: 1,
    };
    setWorkspaceNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
    playUiSoundEffect('SUCCESS');
  };

  const handleQuickBooking = (
    targetNode: WorkspaceNodeItem,
    customEmail?: string,
    note?: string,
    customTargetCode?: string,
    timeWindow?: BookingTimeWindowInput
  ) => {
    const codeToBook = customTargetCode || targetNode.nodeCode;
    const currentRole = userSession?.userProfile.role || 'EMPLOYEE';
    const isEmployeeRequest = currentRole === 'EMPLOYEE';

    handleUpdateNodeStatus(
      targetNode.nodeId,
      isEmployeeRequest ? 'HOLDING' : 'RESERVED'
    );

    const newBookingId = `BK-${Date.now().toString().slice(-4)}`;
    const baseDate = timeWindow?.dateIso || new Date().toISOString().slice(0, 10);
    const newBookingItem: BookingPayloadItem = {
      bookingId: newBookingId,
      nodeId: codeToBook,
      userEmail: customEmail || userSession?.userProfile.userEmail || 'employee@spotmatrix.vn',
      requesterUsername: userSession?.userProfile.username || 'Employeedev123',
      requesterRole: currentRole,
      departmentName: userSession?.userProfile.departmentName || 'Product & Engineering',
      bookingDateIso: baseDate,
      startTimeIso: timeWindow?.start || '08:00',
      endTimeIso: timeWindow?.end || '10:00',
      purposeNote: note || `Đặt lịch ${targetNode.nodeLabel}`,
      recurringOption: timeWindow?.recurringOption || 'NONE',
      occurrenceDates: timeWindow?.occurrenceDates || [baseDate],
      lockVersion: timeWindow?.lockVersion || (targetNode.lockVersion || 1) + 1,
      bookingStatus: 'CONFIRMED',
      approvalStatus: isEmployeeRequest ? 'PENDING_APPROVAL' : 'APPROVED',
      approvedByUsername: isEmployeeRequest
        ? null
        : userSession?.userProfile.username || 'Systemadmin123',
    };

    setBookingsList((prev) => [newBookingItem, ...prev]);
    playUiSoundEffect('SUCCESS');

    recordRealtimeAuditLog(
      'OPTIMISTIC_LOCK_WIN',
      newBookingItem.userEmail,
      codeToBook,
      `[Đặt lịch Thành công - Lock v${newBookingItem.lockVersion}] @${
        newBookingItem.requesterUsername
      } đặt ${codeToBook} (${newBookingItem.startTimeIso}-${
        newBookingItem.endTimeIso
      }, Chu kỳ: ${newBookingItem.recurringOption}, Số kỳ: ${
        newBookingItem.occurrenceDates?.length || 1
      }).`,
      'SUCCESS',
      newBookingItem.lockVersion
    );

    fetch('/api/v1/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBookingItem),
    }).catch(() => {});

    if (isEmployeeRequest) {
      pushRealtimeNotification(
        `[Cần Phê Duyệt] Nhân viên đặt phòng ${codeToBook}`,
        `Nhân viên @${userSession?.userProfile.username} xin đặt phòng ${codeToBook} (${newBookingItem.startTimeIso} - ${newBookingItem.endTimeIso}).`,
        'BOOKING_APPROVAL_REQUEST',
        targetNode.nodeId,
        { approvalBookingId: newBookingId, approvalHandledStatus: 'PENDING' }
      );
    } else {
      pushRealtimeNotification(
        `Đặt lịch thành công: ${codeToBook}`,
        `Đã cấp mã QR Check-in cho "${newBookingItem.purposeNote}" (${newBookingItem.startTimeIso} - ${newBookingItem.endTimeIso}).`,
        'BOOKING_EVENT',
        targetNode.nodeId
      );
    }
  };

  const handleCheckInBooking = (bookingId: string, exactScanTimeText?: string) => {
    const now = new Date();
    const frozenTime =
      exactScanTimeText ||
      `${now.toLocaleTimeString('vi-VN')} • Ngày ${now.toLocaleDateString('vi-VN')}`;

    const targetBk = bookingsList.find((b) => b.bookingId === bookingId);
    const targetEmail = targetBk?.userEmail || userSession?.userProfile.userEmail || '';

    setBookingsList((prev) =>
      prev.map((b) =>
        b.bookingId === bookingId
          ? { ...b, bookingStatus: 'CHECKED_IN', checkedInAtIso: frozenTime }
          : b
      )
    );
    playUiSoundEffect('SUCCESS');

    setTrustProfiles((prev) =>
      prev.map((tp) =>
        tp.userEmail.toLowerCase() === targetEmail.toLowerCase()
          ? {
              ...tp,
              trustScore: Math.min(100, tp.trustScore + 2),
              onTimeCheckInCount: tp.onTimeCheckInCount + 1,
              updatedAtIso: new Date().toISOString(),
            }
          : tp
      )
    );

    fetch(`/api/v1/bookings/${encodeURIComponent(bookingId)}/checkin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkedInAtIso: frozenTime }),
    }).catch(() => {});

    if (targetEmail) {
      fetch('/api/v1/datamanager/trust-scores/adjust', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: targetEmail,
          eventType: 'QR_CHECKIN_ONTIME',
          targetNodeId: targetBk?.nodeId || 'M1-01',
        }),
      }).catch(() => {});
    }

    recordRealtimeAuditLog(
      'QR_CHECKIN_SUCCESS',
      targetEmail || userSession?.userProfile.username || 'User',
      targetBk?.nodeId || bookingId,
      `Xác nhận quét mã QR đúng hạn cho vé ${bookingId} tại thời điểm cố định: [${frozenTime}] (+2 điểm tín nhiệm).`
    );
  };

  const handlePenalizeNoShowBooking = (
    bookingId: string,
    targetUserEmail: string,
    nodeCode: string
  ) => {
    setBookingsList((prev) => prev.filter((b) => b.bookingId !== bookingId));
    playUiSoundEffect('ERROR');

    setTrustProfiles((prev) =>
      prev.map((tp) => {
        if (tp.userEmail.toLowerCase() !== targetUserEmail.toLowerCase()) return tp;
        const nextScore = Math.max(0, tp.trustScore - 10);
        return {
          ...tp,
          trustScore: nextScore,
          noShowPenaltyCount: tp.noShowPenaltyCount + 1,
          isRestrictedMode: nextScore < 60,
          updatedAtIso: new Date().toISOString(),
        };
      })
    );

    pushRealtimeNotification(
      `[Cronjob 15p] Tự động thu hồi chỗ ${nodeCode}`,
      `Vé ${bookingId} quá 15 phút không quét QR Check-in. Đã giải phóng vị trí ${nodeCode} và trừ 10 điểm tín nhiệm của ${targetUserEmail}.`,
      'SYSTEM_POLICY',
      nodeCode
    );
  };

  const handleUpdateEquipmentStatus = (
    equipmentId: string,
    nextStatus: EquipmentStatusType
  ) => {
    setEquipmentsList((prev) =>
      prev.map((eq) =>
        eq.equipmentId === equipmentId ? { ...eq, status: nextStatus } : eq
      )
    );
    playUiSoundEffect('CLICK');

    fetch(`/api/v1/datamanager/equipments/${encodeURIComponent(equipmentId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    }).catch(() => {});
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookingsList((prev) => prev.filter((b) => b.bookingId !== bookingId));
    playUiSoundEffect('CLICK');

    fetch(`/api/v1/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  const handleToggleBlockUser = (username: string) => {
    setManagedUsers((prev) =>
      prev.map((u) =>
        u.username === username
          ? { ...u, accountStatus: u.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' }
          : u
      )
    );
    playUiSoundEffect('CLICK');
  };

  const handleDeleteUserAccount = (username: string) => {
    setManagedUsers((prev) => prev.filter((u) => u.username !== username));
    playUiSoundEffect('ERROR');
  };

  const currentUsernameKey = userSession?.userProfile.username || 'default';
  const currentCustomProfile = profileCustomMap[currentUsernameKey] || {
    avatarUrl: null,
    backgroundUrl: null,
    phoneNumber: '0908 123 456',
    jobTitle: 'Senior System Member',
    bioText: 'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
  };

  const handleSaveProfileCustomization = async (updated: UserProfileCustomization) => {
    const nextMap = {
      ...profileCustomMap,
      [currentUsernameKey]: {
        avatarUrl: updated.avatarUrl,
        backgroundUrl: updated.backgroundUrl,
        phoneNumber: updated.phoneNumber,
        jobTitle: updated.jobTitle,
        bioText: updated.bioText,
      },
    };
    setProfileCustomMap(nextMap);
    playUiSoundEffect('SUCCESS');
    try {
      localStorage.setItem(PROFILE_CUSTOM_STORAGE_KEY, JSON.stringify(nextMap));
    } catch {
      // Bỏ qua
    }

    if (userSession) {
      const nextSession: AuthenticatedUserSession = {
        ...userSession,
        userProfile: {
          ...userSession.userProfile,
          fullName: updated.fullName,
          userEmail: updated.userEmail,
          departmentName: updated.departmentName,
        },
      };
      setUserSession(nextSession);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    }

    setIsSyncingMongo(true);
    try {
      await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: updated.username,
          fullName: updated.fullName,
          userEmail: updated.userEmail,
          departmentName: updated.departmentName,
          phoneNumber: updated.phoneNumber,
          jobTitle: updated.jobTitle,
          bioText: updated.bioText,
          avatarUrl: updated.avatarUrl,
          backgroundUrl: updated.backgroundUrl,
        }),
      });
    } catch {
      // Giữ bản lưu cục bộ
    } finally {
      setIsSyncingMongo(false);
    }
  };

  const sidebarItems = [
    { id: 'OVERVIEW' as ActiveSidebarPage, label: 'Tổng quan (Dashboard)', sub: 'Số liệu thật & Trợ lý Chat', icon: LayoutDashboard, adminOnly: false },
    { id: 'FLOORPLAN' as ActiveSidebarPage, label: 'Sơ đồ Phòng họp', sub: '5 Tầng 3D/2D & Hội trường', icon: Map, adminOnly: false },
    { id: 'BOOKING' as ActiveSidebarPage, label: 'Đặt lịch Phòng họp', sub: 'Giữ 5p, Lock & QR Check-in', icon: CalendarCheck, adminOnly: false },
    { id: 'DATAMANAGER' as ActiveSidebarPage, label: 'Thiết bị & Tín nhiệm', sub: 'Mã số thiết bị & Điểm số', icon: Database, adminOnly: false },
    { id: 'AUDIT' as ActiveSidebarPage, label: 'Nhật ký & Quản trị User', sub: 'Chỉ dành cho SYS_ADMIN', icon: ShieldAlert, adminOnly: true },
  ].filter((item) => !item.adminOnly || isSysAdmin);

  return (
    <Routes>
      <Route
        path="/qr-checkin"
        element={
          <QrCheckinConfirmPages
            isDark={isDark}
            onConfirmCheckinFromUrl={handleCheckInBooking}
          />
        }
      />

      <Route
        path="/login"
        element={
          userSession ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPages onLoginSuccess={handleLoginSuccess} />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          !userSession ? (
            <Navigate to="/login" replace />
          ) : (
            <div
              className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-200 ${
                isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#F4F7FB] text-slate-800'
              }`}
            >
              <aside
                className={`w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col justify-between p-4 sm:p-5 transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
                }`}
              >
                <div className="space-y-6">
                  <SpotMatrixLogo theme={isDark ? 'dark' : 'light'} variant="full" />

                  <nav className="space-y-1.5">
                    <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                      Danh mục Chức năng
                    </p>
                    {sidebarItems.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = activePage === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActivePage(item.id);
                            playUiSoundEffect('CLICK');
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all ${
                            isActive
                              ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                              : isDark
                              ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <IconComponent
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                              }`}
                            />
                            <div className="truncate">
                              <p className="text-xs font-bold leading-tight">{item.label}</p>
                              <p
                                className={`text-[10px] truncate mt-0.5 ${
                                  isActive ? 'text-indigo-100' : 'text-slate-400'
                                }`}
                              >
                                {item.sub}
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'opacity-100' : 'opacity-25'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="hidden lg:block pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  SpotMatrix 5-Floor 3D v4.8 (Lofi & Multi-Guard)
                </div>
              </aside>

              <div className="flex-1 flex flex-col min-w-0">
                <header
                  className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 sm:px-8 py-3 flex items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800'
                      : 'bg-white/95 border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <NotificationHeaderBell
                      notifications={notificationsList}
                      userRole={userSession.userProfile.role}
                      isDark={isDark}
                      onSelectAndNavigateNotification={handleSelectAndNavigateNotification}
                      onHandleApprovalDecision={handleApprovalDecision}
                      onMarkAllRead={() =>
                        setNotificationsList((prev) =>
                          prev.map((item) => ({ ...item, isRead: true }))
                        )
                      }
                      onNavigateNotificationPage={() => setActivePage('NOTIFICATION')}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const bestNode = workspaceNodes.find((n) => n.status === 'AVAILABLE');
                        if (bestNode) {
                          setSelectedNode(bestNode);
                          setActivePage('FLOORPLAN');
                          pushRealtimeNotification(
                            `Gợi ý Phòng họp Tối ưu: ${bestNode.nodeCode}`,
                            `"${bestNode.nodeLabel}" đang trống và phù hợp nhất.`,
                            'BOOKING_EVENT',
                            bestNode.nodeId
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Gợi ý Phòng họp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const nextLofi = !audioSettings.lofiEnabled;
                        persistAudioSettings({ ...audioSettings, lofiEnabled: nextLofi });
                        playUiSoundEffect('CLICK');
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                        audioSettings.lofiEnabled
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                      title="Bật/Tắt Nhạc nền Lofi Chill (Không bản quyền)"
                    >
                      {audioSettings.lofiEnabled ? (
                        <>
                          <Music className="w-3.5 h-3.5 animate-bounce" />
                          <span className="hidden md:inline">Nhạc Lofi: Đang bật</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Bật Nhạc Lofi</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative ml-auto" ref={avatarDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAvatarMenuOpen(!isAvatarMenuOpen);
                        playUiSoundEffect('CLICK');
                      }}
                      className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center font-extrabold text-sm transition shadow-sm overflow-hidden ${
                        isDark
                          ? 'bg-indigo-950 border-indigo-500/60 text-indigo-200'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      }`}
                    >
                      {currentCustomProfile.avatarUrl ? (
                        <img
                          src={currentCustomProfile.avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (userSession.userProfile.fullName || 'U').charAt(0).toUpperCase()
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-teal-500 border border-white dark:border-slate-900" />
                    </button>

                    {isAvatarMenuOpen && (
                      <div
                        className={`absolute right-0 mt-2.5 w-72 rounded-2xl border shadow-2xl z-50 overflow-hidden transition-all ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 text-slate-100'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div
                          className={`p-4 border-b ${
                            isDark
                              ? 'bg-slate-950/70 border-slate-800'
                              : 'bg-slate-50/80 border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {currentCustomProfile.avatarUrl ? (
                              <img
                                src={currentCustomProfile.avatarUrl}
                                alt="Avatar"
                                className="w-11 h-11 rounded-full object-cover shrink-0 border border-indigo-500/30"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-base shrink-0">
                                {(userSession.userProfile.fullName || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-extrabold truncate">
                                {userSession.userProfile.fullName}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                @{userSession.userProfile.username}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
                            <p className="flex items-center justify-between">
                              <span className="text-slate-400 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" /> Email:
                              </span>
                              <strong className="font-semibold truncate max-w-[155px]">
                                {userSession.userProfile.userEmail}
                              </strong>
                            </p>
                            <p className="flex items-center justify-between">
                              <span className="text-slate-400 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5" /> Vai trò:
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                                {userSession.userProfile.role}
                              </span>
                            </p>
                            <p className="flex items-center justify-between">
                              <span className="text-slate-400 flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5" /> Điểm tín nhiệm:
                              </span>
                              <strong className="font-extrabold text-teal-600 dark:text-teal-400">
                                {userSession.userProfile.trustScore} điểm
                              </strong>
                            </p>
                          </div>
                        </div>

                        <div className="p-2 space-y-1 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAvatarMenuOpen(false);
                              setActivePage('PROFILE');
                              playUiSoundEffect('CLICK');
                            }}
                            className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
                              isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                            }`}
                          >
                            <User className="w-4 h-4 text-indigo-600" />
                            <span>Hồ sơ Cá nhân & Ảnh đại diện</span>
                          </button>

                          <button
                            type="button"
                            onClick={toggleThemeMode}
                            className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition ${
                              isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              {isDark ? (
                                <Sun className="w-4 h-4 text-amber-400" />
                              ) : (
                                <Moon className="w-4 h-4 text-indigo-600" />
                              )}
                              <span>Chế độ Sáng / Tối</span>
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">
                              {isDark ? 'Đang bật Tối' : 'Đang bật Sáng'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsAvatarMenuOpen(false);
                              setActivePage('SETTINGS');
                              playUiSoundEffect('CLICK');
                            }}
                            className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
                              isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                            }`}
                          >
                            <Settings className="w-4 h-4 text-teal-600" />
                            <span>Cài đặt Nhạc Lofi, SFX & Hệ thống</span>
                          </button>

                          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-rose-600 hover:bg-rose-500/10 font-bold transition"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Đăng xuất tài khoản</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </header>

                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
                  {activePage === 'OVERVIEW' && (
                    <>
                      <DashboardMainPages
                        workspaceNodes={workspaceNodes}
                        bookingsList={bookingsList}
                        equipmentsList={equipmentsList}
                        trustProfiles={trustProfiles}
                        auditLogs={auditLogs}
                        isDark={isDark}
                        userRole={userSession.userProfile.role}
                        userEmail={userSession.userProfile.userEmail}
                        onNavigateSection={(sec) => {
                          setActivePage(sec);
                          playUiSoundEffect('CLICK');
                        }}
                        onHandleApprovalDecision={handleApprovalDecision}
                      />

                      <FloorplanMainPages
                        workspaceNodes={workspaceNodes}
                        bookingsList={bookingsList}
                        selectedNode={selectedNode}
                        userRole={userSession.userProfile.role}
                        isDark={isDark}
                        onSelectNode={(n) => {
                          setSelectedNode(n);
                          playUiSoundEffect('CLICK');
                        }}
                        onNavigateToBookingWithSlot={handleNavigateToBookingWithSlot}
                        onUpdateNodeCoords={handleUpdateNodeCoords}
                        onUpdateNodeStatus={handleUpdateNodeStatus}
                        onCreateNewNode={handleCreateNewNode}
                      />
                    </>
                  )}

                  {activePage === 'FLOORPLAN' && (
                    <FloorplanMainPages
                      workspaceNodes={workspaceNodes}
                      bookingsList={bookingsList}
                      selectedNode={selectedNode}
                      userRole={userSession.userProfile.role}
                      isDark={isDark}
                      onSelectNode={(n) => {
                        setSelectedNode(n);
                        playUiSoundEffect('CLICK');
                      }}
                      onNavigateToBookingWithSlot={handleNavigateToBookingWithSlot}
                      onUpdateNodeCoords={handleUpdateNodeCoords}
                      onUpdateNodeStatus={handleUpdateNodeStatus}
                      onCreateNewNode={handleCreateNewNode}
                    />
                  )}

                  {activePage === 'BOOKING' && (
                    <BookingCalendarPages
                      bookingsList={bookingsList}
                      workspaceNodes={workspaceNodes}
                      selectedNode={selectedNode}
                      preselectedSlot={preselectedSlot}
                      userEmail={userSession.userProfile.userEmail}
                      userRole={userSession.userProfile.role}
                      isDark={isDark}
                      onCreateNewBooking={(
                        email: string,
                        purpose: string,
                        targetCode?: string,
                        timeWin?: BookingTimeWindowInput
                      ) => {
                        const matchedNode =
                          workspaceNodes.find((n) => n.nodeCode === targetCode) ||
                          selectedNode ||
                          workspaceNodes[0];
                        if (matchedNode) {
                          handleQuickBooking(matchedNode, email, purpose, targetCode, timeWin);
                        }
                      }}
                      onCheckInBooking={handleCheckInBooking}
                      onCancelBooking={handleCancelBooking}
                      onUpdateNodeStatus={handleUpdateNodeStatus}
                      onRecordConcurrencyAudit={recordRealtimeAuditLog}
                      onPenalizeNoShowBooking={handlePenalizeNoShowBooking}
                    />
                  )}

                  {activePage === 'NOTIFICATION' && (
                    <NotificationCenterPages
                      notifications={notificationsList}
                      userRole={userSession.userProfile.role}
                      isDark={isDark}
                      onSelectAndNavigateNotification={handleSelectAndNavigateNotification}
                      onHandleApprovalDecision={handleApprovalDecision}
                      onMarkAllRead={() =>
                        setNotificationsList((prev) =>
                          prev.map((item) => ({ ...item, isRead: true }))
                        )
                      }
                      onDeleteNotification={handleDeleteNotification}
                      onTriggerTestNotification={(title, content) =>
                        pushRealtimeNotification(title, content, 'BOOKING_EVENT', 'NODE-M101')
                      }
                    />
                  )}

                  {activePage === 'DATAMANAGER' && (
                    <DataOverviewPages
                      workspaceNodes={workspaceNodes}
                      equipmentsList={equipmentsList}
                      trustProfiles={trustProfiles}
                      selectedNode={selectedNode}
                      userRole={userSession.userProfile.role}
                      userEmail={userSession.userProfile.userEmail}
                      isDark={isDark}
                      onUpdateEquipmentStatus={handleUpdateEquipmentStatus}
                    />
                  )}

                  {activePage === 'AUDIT' && isSysAdmin && (
                    <AuditLogPages
                      auditLogs={auditLogs}
                      managedUsers={managedUsers}
                      bookingsList={bookingsList}
                      isDark={isDark}
                      onToggleBlockUser={handleToggleBlockUser}
                      onDeleteUserAccount={handleDeleteUserAccount}
                      onAdminOverrideBookingApproval={handleApprovalDecision}
                      onAdminDeleteBookingWithNotification={
                        handleAdminDeleteBookingWithNotification
                      }
                    />
                  )}

                  {activePage === 'PROFILE' && (
                    <ProfilePages
                      profileData={{
                        fullName: userSession.userProfile.fullName,
                        userEmail: userSession.userProfile.userEmail,
                        username: userSession.userProfile.username,
                        role: userSession.userProfile.role,
                        departmentName: userSession.userProfile.departmentName,
                        accountCode: userSession.userProfile.accountCode,
                        trustScore: userSession.userProfile.trustScore,
                        phoneNumber: currentCustomProfile.phoneNumber,
                        jobTitle: currentCustomProfile.jobTitle,
                        bioText: currentCustomProfile.bioText,
                        avatarUrl: currentCustomProfile.avatarUrl,
                        backgroundUrl: currentCustomProfile.backgroundUrl,
                      }}
                      userBookings={bookingsList}
                      isDark={isDark}
                      isSyncingMongo={isSyncingMongo}
                      onSaveProfileCustomization={handleSaveProfileCustomization}
                    />
                  )}

                  {activePage === 'SETTINGS' && (
                    <SettingsPages
                      isDark={isDark}
                      userRole={userSession.userProfile.role}
                      onToggleTheme={toggleThemeMode}
                      lofiEnabled={audioSettings.lofiEnabled}
                      sfxEnabled={audioSettings.sfxEnabled}
                      lofiVolume={audioSettings.lofiVolume}
                      lofiTrackStyle={audioSettings.lofiTrackStyle}
                      onToggleLofi={(nextVal) =>
                        persistAudioSettings({ ...audioSettings, lofiEnabled: nextVal })
                      }
                      onToggleSfx={(nextVal) =>
                        persistAudioSettings({ ...audioSettings, sfxEnabled: nextVal })
                      }
                      onChangeLofiVolume={(nextVol) =>
                        persistAudioSettings({ ...audioSettings, lofiVolume: nextVol })
                      }
                      onChangeLofiTrackStyle={(nextStyle) =>
                        persistAudioSettings({
                          ...audioSettings,
                          lofiTrackStyle: nextStyle,
                          lofiEnabled: true,
                        })
                      }
                      onPlayPreviewSfx={(type) => playUiSoundEffect(type, true)}
                    />
                  )}
                </main>
              </div>

              <RealtimePopupToast
                activePopup={activePopupNotification}
                isDark={isDark}
                onDismissPopup={() => setActivePopupNotification(null)}
                onOpenNotificationPage={() => {
                  if (activePopupNotification) {
                    handleSelectAndNavigateNotification(activePopupNotification);
                  } else {
                    setActivePage('NOTIFICATION');
                  }
                }}
              />
            </div>
          )
        }
      />

      <Route
        path="*"
        element={<Navigate to={userSession ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <ErrorBoundaryLayout>
      <BrowserRouter>
        <MainWorkspaceRoutes />
      </BrowserRouter>
    </ErrorBoundaryLayout>
  );
};