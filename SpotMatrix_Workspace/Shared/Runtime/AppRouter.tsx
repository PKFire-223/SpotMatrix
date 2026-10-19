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
import { AuthenticatedUserSession, LoginPages } from '../../Main/Auth/Pages/LoginPages';
import {
  ProfilePages,
  UserProfileCustomization,
} from '../../Main/Auth/Pages/ProfilePages';
import { SettingsPages } from '../../Main/Auth/Pages/SettingsPages';
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
    {
      codeSuffix: '01',
      name: 'Phòng Họp Đối tác Nhỏ',
      zone: 'MEETING_ROOM' as WorkspaceZoneType,
      cap: 2,
      posX: 150,
      posY: 115,
      status: 'AVAILABLE' as SeatStatusType,
    },
    {
      codeSuffix: '02',
      name: 'Phòng Họp Nhóm Sprint',
      zone: 'MEETING_ROOM' as WorkspaceZoneType,
      cap: 6,
      posX: 400,
      posY: 115,
      status: 'OCCUPIED' as SeatStatusType,
    },
    {
      codeSuffix: '03',
      name: 'Phòng Họp Boardroom Lớn',
      zone: 'MEETING_ROOM' as WorkspaceZoneType,
      cap: 10,
      posX: 650,
      posY: 115,
      status: 'AVAILABLE' as SeatStatusType,
    },
    {
      codeSuffix: '04',
      name: 'Phòng Thảo luận Chiến lược',
      zone: 'MEETING_ROOM' as WorkspaceZoneType,
      cap: 4,
      posX: 150,
      posY: 345,
      status: 'HOLDING' as SeatStatusType,
    },
    {
      codeSuffix: '05',
      name: 'Phòng Sáng tạo Bàn tròn',
      zone: 'COLLAB_HUB' as WorkspaceZoneType,
      cap: 8,
      posX: 400,
      posY: 345,
      status: 'AVAILABLE' as SeatStatusType,
    },
    {
      codeSuffix: '06',
      name: 'Phòng Họp Hội đồng VIP',
      zone: 'MEETING_ROOM' as WorkspaceZoneType,
      cap: 12,
      posX: 650,
      posY: 345,
      status: 'RESERVED' as SeatStatusType,
    },
  ];

  for (let fl = 1; fl <= 4; fl++) {
    floorTemplates.forEach((tpl) => {
      const code = `M${fl}-${tpl.codeSuffix}`;
      rooms.push({
        nodeId: `NODE-M${fl}${tpl.codeSuffix}`,
        nodeCode: code,
        nodeLabel: `${tpl.name} ${code} (Tầng ${fl})`,
        zoneType: tpl.zone,
        floorLevel: fl,
        position2D: { posX: tpl.posX, posY: tpl.posY },
        position3D: { coordX: 0, coordY: 0.5, coordZ: 0 },
        capacityCount: tpl.cap,
        status: fl % 2 === 0 && tpl.codeSuffix === '02' ? 'AVAILABLE' : tpl.status,
        amenitiesList: ['Màn hình 4K', 'Máy chiếu Laser', 'Camera AI 360', 'Cách âm 40dB'],
        aiScore: 92 + (fl % 6),
        lockVersion: 1,
      });
    });
  }

  rooms.push({
    nodeId: 'NODE-H01',
    nodeCode: 'H-01',
    nodeLabel: 'Hội trường Lớn Đấu Trường La Mã (Tầng 5)',
    zoneType: 'COLLAB_HUB',
    floorLevel: 5,
    position2D: { posX: 400, posY: 230 },
    position3D: { coordX: 0, coordY: 2.5, coordZ: 0 },
    capacityCount: 30,
    status: 'AVAILABLE',
    amenitiesList: ['Sân khấu tròn 360°', 'Màn hình Panorama', '28 Ghế Bậc thềm Vòng cung'],
    aiScore: 99,
    lockVersion: 1,
  });

  return rooms;
}

const INITIAL_ROOM_EQUIPMENTS: SharedEquipmentItem[] = [
  {
    equipmentId: 'EQ-01',
    equipmentCode: 'EQ-M101-TV4K-01',
    equipmentName: 'Màn hình Hội nghị Sony Bravia 4K 75"',
    categoryName: 'MONITOR_4K',
    status: 'AVAILABLE',
    assignedNodeId: 'M1-01',
    position2D: { posX: 150, posY: 115 },
    currentBookingId: null,
    weeklyUsageHours: 24,
    monthlyUsageHours: 96,
    healthPercent: 98,
  },
  {
    equipmentId: 'EQ-02',
    equipmentCode: 'EQ-M101-CAM360-02',
    equipmentName: 'Camera AI Tracking 360° Poly Studio',
    categoryName: 'AUDIO_POD',
    status: 'AVAILABLE',
    assignedNodeId: 'M1-01',
    position2D: { posX: 150, posY: 115 },
    currentBookingId: null,
    weeklyUsageHours: 22,
    monthlyUsageHours: 88,
    healthPercent: 97,
  },
  {
    equipmentId: 'EQ-03',
    equipmentCode: 'EQ-M102-LASER-01',
    equipmentName: 'Máy chiếu Laser Epson 4K Pro',
    categoryName: 'PROJECTOR',
    status: 'IN_USE',
    assignedNodeId: 'M1-02',
    position2D: { posX: 400, posY: 115 },
    currentBookingId: 'BK-2026-001',
    weeklyUsageHours: 31,
    monthlyUsageHours: 124,
    healthPercent: 86,
  },
  {
    equipmentId: 'EQ-04',
    equipmentCode: 'EQ-M103-HUB-01',
    equipmentName: 'Trạm Chia tín hiệu HDMI & Type-C 100W',
    categoryName: 'TYPE_C_HUB',
    status: 'BROKEN',
    assignedNodeId: 'M1-03',
    position2D: { posX: 650, posY: 115 },
    currentBookingId: null,
    weeklyUsageHours: 12,
    monthlyUsageHours: 54,
    healthPercent: 45,
  },
  {
    equipmentId: 'EQ-05',
    equipmentCode: 'EQ-M205-WACOM-01',
    equipmentName: 'Bảng Tương tác Cảm ứng KTS Wacom 24"',
    categoryName: 'WACOM_TABLET',
    status: 'AVAILABLE',
    assignedNodeId: 'M2-05',
    position2D: { posX: 400, posY: 345 },
    currentBookingId: null,
    weeklyUsageHours: 19,
    monthlyUsageHours: 78,
    healthPercent: 95,
  },
  {
    equipmentId: 'EQ-06',
    equipmentCode: 'EQ-H01-PANO-01',
    equipmentName: 'Màn hình LED Cong Panorama 360° Hội trường',
    categoryName: 'PROJECTOR',
    status: 'AVAILABLE',
    assignedNodeId: 'H-01',
    position2D: { posX: 400, posY: 230 },
    currentBookingId: null,
    weeklyUsageHours: 28,
    monthlyUsageHours: 112,
    healthPercent: 99,
  },
];

const INITIAL_TRUST_PROFILES: UserTrustProfileItem[] = [
  {
    userEmail: 'sysadmin@spotmatrix.vn',
    fullName: 'System Administrator',
    role: 'SYS_ADMIN',
    departmentName: 'System Governance',
    trustScore: 100,
    onTimeCheckInCount: 32,
    noShowPenaltyCount: 0,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
  {
    userEmail: 'manager.lead@spotmatrix.vn',
    fullName: 'Lê Thu Hà (Quản lý)',
    role: 'MANAGER',
    departmentName: 'Product & Engineering',
    trustScore: 100,
    onTimeCheckInCount: 28,
    noShowPenaltyCount: 0,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
  {
    userEmail: 'employee.dev@spotmatrix.vn',
    fullName: 'Nguyễn Minh Quân (Nhân viên)',
    role: 'EMPLOYEE',
    departmentName: 'Product & Engineering',
    trustScore: 96,
    onTimeCheckInCount: 18,
    noShowPenaltyCount: 1,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
];

const INITIAL_FIVE_FLOOR_ROOMS = buildStandardFiveFloorRooms();

const INITIAL_MANAGED_USERS: ManagedUserAccountItem[] = [
  {
    accountCode: 'ACC-ADMIN-001',
    username: 'Systemadmin123',
    userEmail: 'sysadmin@spotmatrix.vn',
    fullName: 'System Administrator',
    departmentName: 'System Governance',
    role: 'SYS_ADMIN',
    trustScore: 100,
    accountStatus: 'ACTIVE',
    isOnline: true,
    lastActiveText: 'Đang hoạt động',
  },
  {
    accountCode: 'ACC-MGR-002',
    username: 'Managerlead123',
    userEmail: 'manager.lead@spotmatrix.vn',
    fullName: 'Lê Thu Hà (Quản lý)',
    departmentName: 'Product & Engineering',
    role: 'MANAGER',
    trustScore: 100,
    accountStatus: 'ACTIVE',
    isOnline: true,
    lastActiveText: 'Đang hoạt động',
  },
  {
    accountCode: 'ACC-EMP-003',
    username: 'Employeedev123',
    userEmail: 'employee.dev@spotmatrix.vn',
    fullName: 'Nguyễn Minh Quân (Nhân viên)',
    departmentName: 'Product & Engineering',
    role: 'EMPLOYEE',
    trustScore: 96,
    accountStatus: 'ACTIVE',
    isOnline: true,
    lastActiveText: 'Vừa truy cập',
  },
];

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

  const toggleThemeMode = () => {
    const next = isDark ? 'light' : 'dark';
    setThemeMode(next);
    localStorage.setItem('spotmatrix_theme_mode', next);
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
              // Bỏ qua nếu bộ nhớ đệm đầy
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
      // Giữ nguyên state dự phòng nếu Backend chưa bật
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
                ? {
                    ...b,
                    bookingStatus: 'CHECKED_IN',
                    checkedInAtIso: parsed.scannedAtText,
                  }
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
      }
    ) => {
      if (category === 'FLOORPLAN_UPDATE') return;

      const localItem: NotificationRecordItem = {
        notificationId: `NTF-${Date.now()}-${Math.floor(Math.random() * 99)}`,
        recipientEmail: userSession?.userProfile.userEmail || 'all',
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
    },
    [userSession]
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
          avatarUrl:
            incomingProfile.avatarUrl ?? prev[incomingProfile.username]?.avatarUrl ?? null,
          backgroundUrl:
            incomingProfile.backgroundUrl ??
            prev[incomingProfile.username]?.backgroundUrl ??
            null,
          phoneNumber:
            incomingProfile.phoneNumber ||
            prev[incomingProfile.username]?.phoneNumber ||
            '0908 123 456',
          jobTitle:
            incomingProfile.jobTitle ||
            prev[incomingProfile.username]?.jobTitle ||
            'Senior System Member',
          bioText:
            incomingProfile.bioText ||
            prev[incomingProfile.username]?.bioText ||
            'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
        },
      }));
      fetchAccountProfileAndWorkspaceFromMongo(incomingProfile.username);
    }

    setManagedUsers((prev) => {
      const exists = prev.some(
        (u) => u.username.toLowerCase() === sessionData.userProfile.username.toLowerCase()
      );
      if (exists) {
        return prev.map((u) =>
          u.username.toLowerCase() === sessionData.userProfile.username.toLowerCase()
            ? { ...u, isOnline: true, lastActiveText: 'Vừa đăng nhập' }
            : u
        );
      }
      return [
        {
          accountCode: sessionData.userProfile.accountCode,
          username: sessionData.userProfile.username,
          userEmail: sessionData.userProfile.userEmail,
          fullName: sessionData.userProfile.fullName,
          departmentName: sessionData.userProfile.departmentName,
          role: sessionData.userProfile.role,
          trustScore: sessionData.userProfile.trustScore,
          accountStatus: 'ACTIVE',
          isOnline: true,
          lastActiveText: 'Vừa đăng nhập',
        },
        ...prev,
      ];
    });
  };

  const handleLogout = () => {
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
  };

  const handleApprovalDecision = (
    bookingId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    const actorUsername = userSession?.userProfile.username || 'Systemadmin123';
    const approvedTimeStr = new Date().toLocaleTimeString('vi-VN');

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
        {
          approvalBookingId: newBookingId,
          approvalHandledStatus: 'PENDING',
        }
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

  // Xử lý khi Cronjob 15 phút tự thu hồi chỗ (Auto-Release No-Show) & Trừ 10 điểm tín nhiệm
  const handlePenalizeNoShowBooking = (
    bookingId: string,
    targetUserEmail: string,
    nodeCode: string
  ) => {
    setBookingsList((prev) => prev.filter((b) => b.bookingId !== bookingId));

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

    fetch(`/api/v1/datamanager/equipments/${encodeURIComponent(equipmentId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    }).catch(() => {});
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookingsList((prev) => prev.filter((b) => b.bookingId !== bookingId));

    fetch(`/api/v1/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  const handleToggleBlockUser = (username: string) => {
    setManagedUsers((prev) =>
      prev.map((u) =>
        u.username === username
          ? {
              ...u,
              accountStatus: u.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED',
            }
          : u
      )
    );
  };

  const handleDeleteUserAccount = (username: string) => {
    setManagedUsers((prev) => prev.filter((u) => u.username !== username));
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
    try {
      localStorage.setItem(PROFILE_CUSTOM_STORAGE_KEY, JSON.stringify(nextMap));
    } catch {
      // Bỏ qua nếu vượt dung lượng localStorage
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
      // Giữ bản lưu cục bộ nếu mạng tạm thời gián đoạn
    } finally {
      setIsSyncingMongo(false);
    }
  };

  const sidebarItems = [
    {
      id: 'OVERVIEW' as ActiveSidebarPage,
      label: 'Tổng quan (Dashboard)',
      sub: 'Số liệu thật & AI So sánh',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      id: 'FLOORPLAN' as ActiveSidebarPage,
      label: 'Sơ đồ Phòng họp',
      sub: '5 Tầng 3D/2D & Hội trường',
      icon: Map,
      adminOnly: false,
    },
    {
      id: 'BOOKING' as ActiveSidebarPage,
      label: 'Đặt lịch Phòng họp',
      sub: 'Giữ 5p, Lock & QR Check-in',
      icon: CalendarCheck,
      adminOnly: false,
    },
    {
      id: 'DATAMANAGER' as ActiveSidebarPage,
      label: 'Thiết bị & Tín nhiệm',
      sub: 'Mã số thiết bị & Điểm số',
      icon: Database,
      adminOnly: false,
    },
    {
      id: 'AUDIT' as ActiveSidebarPage,
      label: 'Nhật ký & Quản trị User',
      sub: 'Chỉ dành cho SYS_ADMIN',
      icon: ShieldAlert,
      adminOnly: true,
    },
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
                          onClick={() => setActivePage(item.id)}
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
                  SpotMatrix 5-Floor 3D v4.5 (Phase 3 Lock & Hold)
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
                  <div className="flex items-center gap-2.5">
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
                            `AI Đề xuất Phòng họp: ${bestNode.nodeCode}`,
                            `"${bestNode.nodeLabel}" đang trống và phù hợp nhất.`,
                            'BOOKING_EVENT',
                            bestNode.nodeId
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">AI Gợi ý Phòng họp</span>
                    </button>
                  </div>

                  {/* NGOÀI CÙNG BÊN PHẢI HEADER: NÚT AVATAR TRÒN & POP-UP NHỎ DÍNH BÊN PHẢI */}
                  <div className="relative ml-auto" ref={avatarDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
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
                                {(userSession.userProfile.fullName || 'U')
                                  .charAt(0)
                                  .toUpperCase()}
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
                            }}
                            className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
                              isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                            }`}
                          >
                            <Settings className="w-4 h-4 text-teal-600" />
                            <span>Cài đặt Hệ thống & Tài khoản</span>
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
                        onNavigateSection={(sec) => setActivePage(sec)}
                      />

                      <FloorplanMainPages
                        workspaceNodes={workspaceNodes}
                        bookingsList={bookingsList}
                        selectedNode={selectedNode}
                        userRole={userSession.userProfile.role}
                        isDark={isDark}
                        onSelectNode={(n) => setSelectedNode(n)}
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
                      onSelectNode={(n) => setSelectedNode(n)}
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