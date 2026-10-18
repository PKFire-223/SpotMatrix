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

const INITIAL_BROWSER_NODES: WorkspaceNodeItem[] = [
  // TANG 1: KHU PHONG HOP TIEU CHUAN & BAN LAM VIEC
  {
    nodeId: 'NODE-M01',
    nodeCode: 'M-01',
    nodeLabel: 'Phòng Họp Boardroom M01 (Tầng 1)',
    zoneType: 'MEETING_ROOM',
    floorLevel: 1,
    position2D: { posX: 630, posY: 145 },
    position3D: { coordX: 2.2, coordY: 0.6, coordZ: -0.8 },
    capacityCount: 8,
    status: 'AVAILABLE',
    amenitiesList: ['Máy chiếu Laser', 'Camera AI 360', 'Bảng trắng KTS'],
    aiScore: 96,
  },
  {
    nodeId: 'NODE-C01',
    nodeCode: 'C-01',
    nodeLabel: 'Phòng Thảo luận Nhóm C01 (Tầng 1)',
    zoneType: 'COLLAB_HUB',
    floorLevel: 1,
    position2D: { posX: 425, posY: 350 },
    position3D: { coordX: 1.5, coordY: 0.45, coordZ: 1.4 },
    capacityCount: 6,
    status: 'AVAILABLE',
    amenitiesList: ['Màn hình 4K', 'Máy chiếu Laser', 'Ổ cắm âm sàn'],
    aiScore: 94,
  },
  {
    nodeId: 'NODE-A01',
    nodeCode: 'A-01',
    nodeLabel: 'Trạm Làm việc Dual-4K A01 (Tầng 1)',
    zoneType: 'DESK_POD',
    floorLevel: 1,
    position2D: { posX: 110, posY: 125 },
    position3D: { coordX: -2.2, coordY: 0.4, coordZ: -1.2 },
    capacityCount: 1,
    status: 'AVAILABLE',
    amenitiesList: ['Màn hình 4K', 'Cổng Type-C 100W', 'Ghế Công thái học'],
    aiScore: 95,
  },
  {
    nodeId: 'NODE-A02',
    nodeCode: 'A-02',
    nodeLabel: 'Trạm Đồ họa Wacom A02 (Tầng 1)',
    zoneType: 'DESK_POD',
    floorLevel: 1,
    position2D: { posX: 250, posY: 125 },
    position3D: { coordX: 0, coordY: 0.4, coordZ: -1.2 },
    capacityCount: 1,
    status: 'OCCUPIED',
    amenitiesList: ['Màn hình 4K', 'Bảng vẽ Wacom'],
    aiScore: 84,
  },
  {
    nodeId: 'NODE-F01',
    nodeCode: 'F-01',
    nodeLabel: 'Bốt Họp Kín Focus F01 (Tầng 1)',
    zoneType: 'FOCUS_BOOTH',
    floorLevel: 1,
    position2D: { posX: 135, posY: 350 },
    position3D: { coordX: -1.4, coordY: 0.5, coordZ: 1.4 },
    capacityCount: 1,
    status: 'RESERVED',
    amenitiesList: ['Cách âm 40dB', 'Đèn chống mỏi mắt'],
    aiScore: 89,
  },
  // TANG 2: KHU PHONG HOP CHIEN LUOC & SANG TAO
  {
    nodeId: 'NODE-M02',
    nodeCode: 'M-02',
    nodeLabel: 'Phòng Họp Chiến lược M02 (Tầng 2)',
    zoneType: 'MEETING_ROOM',
    floorLevel: 2,
    position2D: { posX: 600, posY: 160 },
    position3D: { coordX: 1.4, coordY: 1.6, coordZ: 0.6 },
    capacityCount: 12,
    status: 'AVAILABLE',
    amenitiesList: ['Máy chiếu Laser', 'Camera AI 360', 'Cách âm 40dB'],
    aiScore: 95,
  },
  {
    nodeId: 'NODE-B01',
    nodeCode: 'B-01',
    nodeLabel: 'Phòng Nghiên cứu AI B01 (Tầng 2)',
    zoneType: 'DESK_POD',
    floorLevel: 2,
    position2D: { posX: 200, posY: 150 },
    position3D: { coordX: -1.5, coordY: 1.4, coordZ: -0.9 },
    capacityCount: 2,
    status: 'OCCUPIED',
    amenitiesList: ['Màn hình 4K', 'Bảng vẽ Wacom'],
    aiScore: 97,
  },
  // TANG 3 (TANG TREN CUNG): HOI TRUONG LON DAU TRUONG LA MA
  {
    nodeId: 'NODE-H01',
    nodeCode: 'H-01',
    nodeLabel: 'Hội trường Lớn Đấu Trường La Mã (Tầng 3)',
    zoneType: 'COLLAB_HUB',
    floorLevel: 3,
    position2D: { posX: 400, posY: 230 },
    position3D: { coordX: 0, coordY: 2.5, coordZ: 0 },
    capacityCount: 26,
    status: 'AVAILABLE',
    amenitiesList: ['Sân khấu tròn 360°', 'Màn hình Panorama', '26 Ghế Vòng cung'],
    aiScore: 99,
  },
];

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
    useState<WorkspaceNodeItem[]>(INITIAL_BROWSER_NODES);
  const [selectedNode, setSelectedNode] = useState<WorkspaceNodeItem | null>(
    INITIAL_BROWSER_NODES[0]
  );
  const [preselectedSlot, setPreselectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [bookingsList, setBookingsList] = useState<BookingPayloadItem[]>([
    {
      bookingId: 'BK-2026-001',
      nodeId: 'F-01',
      userEmail: 'architect.lead@spotmatrix.vn',
      startTimeIso: '08:00',
      endTimeIso: '10:00',
      purposeNote: 'Họp Kiến trúc Hệ thống 3D',
      bookingStatus: 'CONFIRMED',
    },
    {
      bookingId: 'BK-2026-002',
      nodeId: 'H01-A3',
      userEmail: 'manager.lead@spotmatrix.vn',
      startTimeIso: '13:00',
      endTimeIso: '15:00',
      purposeNote: '[Hội trường Tầng 3 - Ghế H01-A3] Townhall Quý 4',
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
      const [nodesRes, eqRes, trustRes, auditRes, notifRes] = await Promise.all([
        fetch('/api/v1/floorplan/nodes').then((r) => r.json()),
        fetch('/api/v1/datamanager/equipments').then((r) => r.json()),
        fetch('/api/v1/datamanager/trust-scores').then((r) => r.json()),
        fetch('/api/v1/datamanager/audit-logs').then((r) => r.json()),
        fetch('/api/v1/notifications').then((r) => r.json()),
      ]);
      if (nodesRes?.success && Array.isArray(nodesRes.data) && nodesRes.data.length > 0) {
        const hasFloor3Hall = nodesRes.data.some((n: WorkspaceNodeItem) => n.floorLevel === 3);
        const mergedNodes = hasFloor3Hall
          ? nodesRes.data
          : [
              ...nodesRes.data,
              INITIAL_BROWSER_NODES.find((n) => n.floorLevel === 3)!,
            ];
        setWorkspaceNodes(mergedNodes);
      }
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
      // Giu INITIAL_BROWSER_NODES
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
    fetch(`/api/v1/notifications/${notifItem.notificationId}/read`, { method: 'PATCH' }).catch(
      () => {}
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

  // Chuyen tu Trang So do Phong hop sang Trang Dat lich kem Phong & Slot da chon
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
        `Bạn đã đăng nhập với quyền [${sessionData.userProfile.role}]. Bấm để mở Sơ đồ Phòng họp 3D.`,
        'SYSTEM_SECURITY',
        'NODE-M01'
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
    try {
      await fetch('/api/v1/notifications/read-all', { method: 'PATCH' });
    } catch {
      // Bo qua
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setNotificationsList((prev) => prev.filter((i) => i.notificationId !== notificationId));
    try {
      await fetch(`/api/v1/notifications/${notificationId}`, { method: 'DELETE' });
    } catch {
      // Bo qua
    }
  };

  const handleUpdateNodeCoords = async (nodeId: string, posX: number, posY: number) => {
    setWorkspaceNodes((prev) =>
      prev.map((item) =>
        item.nodeId === nodeId ? { ...item, position2D: { posX, posY } } : item
      )
    );
    setSelectedNode((prev) =>
      prev && prev.nodeId === nodeId ? { ...prev, position2D: { posX, posY } } : prev
    );

    try {
      await fetch(`/api/v1/floorplan/nodes/${nodeId}/coordinates`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posX,
          posY,
          actorEmail: userSession?.userProfile.username || 'Systemadmin123',
        }),
      });
      fetchAllSyncedData();
    } catch {
      // Giu state
    }
  };

  const handleUpdateNodeStatus = async (nodeId: string, nextStatus: SeatStatusType) => {
    setWorkspaceNodes((prev) =>
      prev.map((item) => (item.nodeId === nodeId ? { ...item, status: nextStatus } : item))
    );
    setSelectedNode((prev) =>
      prev && prev.nodeId === nodeId ? { ...prev, status: nextStatus } : prev
    );

    try {
      await fetch(`/api/v1/floorplan/nodes/${nodeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          actorEmail: userSession?.userProfile.username || 'Systemadmin123',
        }),
      });
      fetchAllSyncedData();
    } catch {
      // Giu state
    }
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
    try {
      const res = await fetch('/api/v1/floorplan/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          actorEmail: userSession?.userProfile.username || 'Systemadmin123',
        }),
      });
      const data = await res.json();
      if (data?.success && data.data) {
        setWorkspaceNodes((prev) => [...prev, data.data]);
        setSelectedNode(data.data);
        fetchAllSyncedData();
      }
    } catch {
      // Bo qua
    }
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
      startTimeIso: timeWindow?.start || '09:00',
      endTimeIso: timeWindow?.end || '11:00',
      purposeNote: note || `Đặt lịch ${targetNode.nodeLabel}`,
      bookingStatus: 'CONFIRMED',
    };

    setBookingsList((prev) => [newBookingItem, ...prev]);
    pushRealtimeNotification(
      `Đặt lịch thành công: ${codeToBook}`,
      `Đã xác nhận lịch "${newBookingItem.purposeNote}" (${newBookingItem.startTimeIso} - ${newBookingItem.endTimeIso}).`,
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
      `Bạn đã xác nhận có mặt đúng giờ cho mã vé ${bookingId}.`,
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
      sub: 'Mô hình 3D & Tầng Hội trường',
      icon: Map,
      adminOnly: false,
    },
    {
      id: 'BOOKING' as ActiveSidebarPage,
      label: 'Đặt lịch Phòng họp',
      sub: 'Chọn giờ & Xem trước bố cục',
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
                  SpotMatrix 3D Engine v3.0
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
                            `AI Đề xuất Phòng: ${bestNode.nodeCode}`,
                            `"${bestNode.nodeLabel}" đang trống và đạt độ tương thích ${bestNode.aiScore}%.`,
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
                        pushRealtimeNotification(title, content, 'BOOKING_EVENT', 'NODE-M01')
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