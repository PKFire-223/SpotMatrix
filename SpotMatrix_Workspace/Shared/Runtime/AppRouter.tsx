import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { SpotMatrixLogo } from '../Components/SpotMatrixLogo';
import {
  AuditConcurrencyLogItem,
  BookingPayloadItem,
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
import { FloorplanMainPages } from '../../Main/Floorplan/Pages/FloorplanMainPages';
import { BookingCalendarPages } from '../../Main/Booking/Pages/BookingCalendarPages';
import { QrCheckinConfirmPages } from '../../Main/Booking/Pages/QrCheckinConfirmPages';
import { AuthenticatedUserSession, LoginPages } from '../../Main/Auth/Pages/LoginPages';
import { NotificationHeaderBell } from '../../Main/Notification/Function/Components/NotificationHeaderBell';
import { RealtimePopupToast } from '../../Main/Notification/Function/Components/RealtimePopupToast';
import { NotificationCenterPages } from '../../Main/Notification/Pages/NotificationCenterPages';
import {
  AuditLogPages,
  ManagedUserAccountItem,
} from '../../Main/Auditlog/Pages/AuditLogPages';

const SESSION_STORAGE_KEY = 'spotmatrix_active_session_v2';

type ActiveSidebarPage =
  | 'OVERVIEW'
  | 'FLOORPLAN'
  | 'BOOKING'
  | 'NOTIFICATION'
  | 'DATAMANAGER'
  | 'AUDIT';

// Ham sinh du lieu 5 Tang (Tang 1..4: Moi tang 6 Phong hop chinh thuc >= 2 nguoi; Tang 5: Hoi truong 30 cho)
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
      });
    });
  }

  // TANG 5: HOI TRUONG LON DAU TRUONG LA MA (30 NGUOI)
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
  });

  return rooms;
}

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
    departmentName: 'Workspace Operations',
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
    fullName: 'Nguyễn Minh Quân (Backend Dev)',
    departmentName: 'Platform Engineering',
    role: 'EMPLOYEE',
    trustScore: 96,
    accountStatus: 'ACTIVE',
    isOnline: false,
    lastActiveText: '14 phút trước',
  },
  {
    accountCode: 'ACC-EMP-004',
    username: 'Quang',
    userEmail: 'quang@spotmatrix.vn',
    fullName: 'Nguyễn Văn Quang',
    departmentName: 'Product & Engineering',
    role: 'MANAGER',
    trustScore: 100,
    accountStatus: 'ACTIVE',
    isOnline: true,
    lastActiveText: 'Đang hoạt động',
  },
];

const MainWorkspaceRoutes: React.FC = () => {
  const navigate = useNavigate();

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
      userEmail: 'architect.lead@spotmatrix.vn',
      startTimeIso: '08:00',
      endTimeIso: '10:00',
      purposeNote: 'Họp Kiến trúc Hệ thống 3D (Tầng 1)',
      bookingStatus: 'CONFIRMED',
    },
    {
      bookingId: 'BK-2026-002',
      nodeId: 'H01-A3',
      userEmail: 'manager.lead@spotmatrix.vn',
      startTimeIso: '13:00',
      endTimeIso: '15:00',
      purposeNote: '[Hội trường Tầng 5 - Ghế H01-A3] Townhall Quý 4',
      bookingStatus: 'CHECKED_IN',
    },
  ]);
  const [equipmentsList, setEquipmentsList] = useState<SharedEquipmentItem[]>([]);
  const [trustProfiles, setTrustProfiles] = useState<UserTrustProfileItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditConcurrencyLogItem[]>([]);
  const [managedUsers, setManagedUsers] =
    useState<ManagedUserAccountItem[]>(INITIAL_MANAGED_USERS);

  const [notificationsList, setNotificationsList] = useState<NotificationRecordItem[]>([]);
  const [activePopupNotification, setActivePopupNotification] =
    useState<NotificationRecordItem | null>(null);

  const isSysAdmin = userSession?.userProfile.role === 'SYS_ADMIN';

  // Lang nghe su kien Check-in QR tu Tab moi (/qr-checkin)
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === 'spotmatrix_last_qr_checkin_id' && e.newValue) {
        setBookingsList((prev) =>
          prev.map((b) =>
            b.bookingId === e.newValue ? { ...b, bookingStatus: 'CHECKED_IN' } : b
          )
        );
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  const pushRealtimeNotification = useCallback(
    async (
      titleText: string,
      contentText: string,
      category: NotificationCategoryType = 'BOOKING_EVENT',
      relatedNodeId?: string
    ) => {
      if (category === 'FLOORPLAN_UPDATE') return;

      const localItem: NotificationRecordItem = {
        notificationId: `NTF-${Date.now()}`,
        recipientEmail: userSession?.userProfile.userEmail || 'all',
        titleText,
        contentText,
        category,
        isRead: false,
        relatedNodeId,
        createdAtIso: new Date().toISOString(),
      };

      setNotificationsList((prev) => [localItem, ...prev]);
      setActivePopupNotification(localItem);

      try {
        await fetch('/api/v1/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: localItem.recipientEmail,
            titleText,
            contentText,
            category,
            relatedNodeId,
          }),
        });
      } catch {
        // Giu local
      }
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

  const fetchAllSyncedData = useCallback(async () => {
    try {
      const [eqRes, trustRes, auditRes, notifRes] = await Promise.all([
        fetch('/api/v1/datamanager/equipments').then((r) => r.json()),
        fetch('/api/v1/datamanager/trust-scores').then((r) => r.json()),
        fetch('/api/v1/datamanager/audit-logs').then((r) => r.json()),
        fetch('/api/v1/notifications').then((r) => r.json()),
      ]);
      if (eqRes?.success && Array.isArray(eqRes.data)) setEquipmentsList(eqRes.data);
      if (trustRes?.success && Array.isArray(trustRes.data)) setTrustProfiles(trustRes.data);
      if (auditRes?.success && Array.isArray(auditRes.data)) setAuditLogs(auditRes.data);
      if (notifRes?.success && Array.isArray(notifRes.data)) {
        setNotificationsList(
          notifRes.data.filter(
            (n: NotificationRecordItem) => n.category !== 'FLOORPLAN_UPDATE'
          )
        );
      }
    } catch {
      // Su dung INITIAL_FIVE_FLOOR_ROOMS
    }
  }, []);

  useEffect(() => {
    if (userSession) {
      fetchAllSyncedData();
    }
  }, [userSession, fetchAllSyncedData]);

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
      if (notifItem.relatedNodeId.startsWith('H01-')) {
        setActivePage('BOOKING');
        return;
      }
    }

    if (notifItem.category === 'BOOKING_EVENT') {
      setActivePage('BOOKING');
    } else {
      setActivePage('FLOORPLAN');
    }
  };

  const handleNavigateToBookingWithSlot = (
    nodeItem: WorkspaceNodeItem,
    slotTime: { start: string; end: string }
  ) => {
    setSelectedNode(nodeItem);
    setPreselectedSlot(slotTime);
    setActivePage('BOOKING');
  };

  const handleLoginSuccess = (sessionData: AuthenticatedUserSession) => {
    setUserSession(sessionData);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    setActivePage('OVERVIEW');
    navigate('/dashboard', { replace: true });
    setTimeout(() => {
      pushRealtimeNotification(
        `Xin chào ${sessionData.userProfile.fullName}`,
        `Hệ thống 5 Tầng Phòng họp 3D & Hội trường đã sẵn sàng.`,
        'SYSTEM_SECURITY',
        'NODE-M101'
      );
    }, 300);
  };

  const handleLogout = () => {
    setUserSession(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setActivePopupNotification(null);
    navigate('/login', { replace: true });
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotificationsList((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setNotificationsList((prev) => prev.filter((i) => i.notificationId !== notificationId));
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
      nodeId: `NODE-${payload.nodeCode}-${Date.now().toString().slice(-3)}`,
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
    };
    setWorkspaceNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
  };

  const handleQuickBooking = (
    targetNode: WorkspaceNodeItem,
    customEmail?: string,
    note?: string,
    customTargetCode?: string,
    timeWindow?: { start: string; end: string }
  ) => {
    const codeToBook = customTargetCode || targetNode.nodeCode;

    if (!customTargetCode || !customTargetCode.startsWith('H01-')) {
      handleUpdateNodeStatus(targetNode.nodeId, 'RESERVED');
    }

    const newBookingItem: BookingPayloadItem = {
      bookingId: `BK-${Date.now().toString().slice(-4)}`,
      nodeId: codeToBook,
      userEmail: customEmail || userSession?.userProfile.userEmail || 'member@spotmatrix.vn',
      startTimeIso: timeWindow?.start || '08:00',
      endTimeIso: timeWindow?.end || '10:00',
      purposeNote: note || `Đặt lịch ${targetNode.nodeLabel}`,
      bookingStatus: 'CONFIRMED',
    };

    setBookingsList((prev) => [newBookingItem, ...prev]);
    pushRealtimeNotification(
      `Đặt lịch thành công: ${codeToBook}`,
      `Đã tạo mã QR Check-in cho "${newBookingItem.purposeNote}" (${newBookingItem.startTimeIso} - ${newBookingItem.endTimeIso}).`,
      'BOOKING_EVENT',
      codeToBook.startsWith('H01-') ? codeToBook : targetNode.nodeId
    );
  };

  const handleCheckInBooking = (bookingId: string) => {
    setBookingsList((prev) =>
      prev.map((b) =>
        b.bookingId === bookingId ? { ...b, bookingStatus: 'CHECKED_IN' } : b
      )
    );
    pushRealtimeNotification(
      `Check-in QR Thành công (+2 điểm)`,
      `Vé ${bookingId} đã được xác nhận đúng hạn. Điểm tín nhiệm +2đ.`,
      'TRUST_SCORE_ALERT'
    );
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookingsList((prev) => prev.filter((b) => b.bookingId !== bookingId));
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

  const sidebarItems = [
    {
      id: 'OVERVIEW' as ActiveSidebarPage,
      label: 'Tổng quan (Dashboard)',
      sub: 'Biểu đồ & AI So sánh',
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
      sub: 'Xem bố cục & Mã QR Check-in',
      icon: CalendarCheck,
      adminOnly: false,
    },
    {
      id: 'DATAMANAGER' as ActiveSidebarPage,
      label: 'Thiết bị & Tín nhiệm',
      sub: 'Trust Score & Quotas',
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
      {/* TRANG XAC NHAN KHI QUET MA QR CHECK-IN (MO O TAB MOI HOAC DIEN THOAI) */}
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
                  SpotMatrix 5-Floor 3D v3.5
                </div>
              </aside>

              <div className="flex-1 flex flex-col min-w-0">
                <header
                  className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800'
                      : 'bg-white/95 border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div
                      className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-200/90 text-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-teal-500" title="Đang Online" />
                      <span className="font-extrabold">{userSession.userProfile.fullName}</span>
                      <span className="text-slate-400">
                        @{userSession.userProfile.username} • Tín nhiệm:{' '}
                        <strong className="text-teal-600 dark:text-teal-400">
                          {userSession.userProfile.trustScore}đ
                        </strong>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        {userSession.userProfile.role}
                      </span>
                    </div>

                    <NotificationHeaderBell
                      notifications={notificationsList}
                      isDark={isDark}
                      onSelectAndNavigateNotification={handleSelectAndNavigateNotification}
                      onMarkAllRead={handleMarkAllNotificationsRead}
                      onNavigateNotificationPage={() => setActivePage('NOTIFICATION')}
                    />

                    <button
                      type="button"
                      onClick={toggleThemeMode}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-amber-300'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      <span>{isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-rose-400 hover:bg-rose-950/50'
                          : 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50 shadow-sm'
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Thoát</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Gợi ý Phòng họp
                    </button>
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
                      isDark={isDark}
                      onCreateNewBooking={(email, purpose, targetCode, timeWin) => {
                        if (selectedNode) {
                          handleQuickBooking(selectedNode, email, purpose, targetCode, timeWin);
                        }
                      }}
                      onCheckInBooking={handleCheckInBooking}
                      onCancelBooking={handleCancelBooking}
                    />
                  )}

                  {activePage === 'NOTIFICATION' && (
                    <NotificationCenterPages
                      notifications={notificationsList}
                      isDark={isDark}
                      onSelectAndNavigateNotification={handleSelectAndNavigateNotification}
                      onMarkAllRead={handleMarkAllNotificationsRead}
                      onDeleteNotification={handleDeleteNotification}
                      onTriggerTestNotification={(title, content) =>
                        pushRealtimeNotification(title, content, 'BOOKING_EVENT', 'NODE-M101')
                      }
                    />
                  )}

                  {activePage === 'DATAMANAGER' && (
                    <DashboardMainPages
                      workspaceNodes={workspaceNodes}
                      bookingsList={bookingsList}
                      equipmentsList={equipmentsList}
                      trustProfiles={trustProfiles}
                      auditLogs={auditLogs}
                      isDark={isDark}
                    />
                  )}

                  {activePage === 'AUDIT' && isSysAdmin && (
                    <AuditLogPages
                      auditLogs={auditLogs}
                      managedUsers={managedUsers}
                      isDark={isDark}
                      onToggleBlockUser={handleToggleBlockUser}
                      onDeleteUserAccount={handleDeleteUserAccount}
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