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
  Bell,
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

const SESSION_STORAGE_KEY = 'spotmatrix_active_session_v2';

type ActiveSidebarPage =
  | 'OVERVIEW'
  | 'FLOORPLAN'
  | 'BOOKING'
  | 'NOTIFICATION'
  | 'DATAMANAGER'
  | 'AUDIT';

const INITIAL_BROWSER_NODES: WorkspaceNodeItem[] = [
  {
    nodeId: 'NODE-A01',
    nodeCode: 'A-01',
    nodeLabel: 'Bàn Lập trình Dual-4K A01',
    zoneType: 'DESK_POD',
    floorLevel: 1,
    position2D: { posX: 110, posY: 110 },
    position3D: { coordX: -2.2, coordY: 0.4, coordZ: -1.2 },
    capacityCount: 1,
    status: 'AVAILABLE',
    amenitiesList: ['Màn hình 4K', 'Cổng Type-C 100W', 'Ghế Công thái học'],
    aiScore: 96,
  },
  {
    nodeId: 'NODE-A02',
    nodeCode: 'A-02',
    nodeLabel: 'Bàn Đồ họa Wacom A02',
    zoneType: 'DESK_POD',
    floorLevel: 1,
    position2D: { posX: 250, posY: 110 },
    position3D: { coordX: 0, coordY: 0.4, coordZ: -1.2 },
    capacityCount: 1,
    status: 'OCCUPIED',
    amenitiesList: ['Màn hình 4K', 'Bảng vẽ Wacom'],
    aiScore: 84,
  },
  {
    nodeId: 'NODE-A03',
    nodeCode: 'A-03',
    nodeLabel: 'Bàn Tiêu chuẩn A03',
    zoneType: 'DESK_POD',
    floorLevel: 1,
    position2D: { posX: 390, posY: 110 },
    position3D: { coordX: 0.8, coordY: 0.4, coordZ: -1.2 },
    capacityCount: 1,
    status: 'HOLDING',
    amenitiesList: ['Cổng Type-C 100W', 'Ghế Công thái học'],
    aiScore: 91,
  },
  {
    nodeId: 'NODE-M01',
    nodeCode: 'M-01',
    nodeLabel: 'Phòng Họp Boardroom M01',
    zoneType: 'MEETING_ROOM',
    floorLevel: 1,
    position2D: { posX: 560, posY: 125 },
    position3D: { coordX: 2.2, coordY: 0.6, coordZ: -0.8 },
    capacityCount: 8,
    status: 'AVAILABLE',
    amenitiesList: ['Máy chiếu Laser', 'Camera AI 360', 'Bảng trắng KTS'],
    aiScore: 95,
  },
  {
    nodeId: 'NODE-F01',
    nodeCode: 'F-01',
    nodeLabel: 'Bốt Cách âm Focus F01',
    zoneType: 'FOCUS_BOOTH',
    floorLevel: 1,
    position2D: { posX: 140, posY: 270 },
    position3D: { coordX: -1.4, coordY: 0.5, coordZ: 1.4 },
    capacityCount: 1,
    status: 'RESERVED',
    amenitiesList: ['Cách âm 40dB', 'Đèn chống mỏi mắt'],
    aiScore: 89,
  },
  {
    nodeId: 'NODE-C01',
    nodeCode: 'C-01',
    nodeLabel: 'Không gian Thảo luận Collab C01',
    zoneType: 'COLLAB_HUB',
    floorLevel: 1,
    position2D: { posX: 350, posY: 270 },
    position3D: { coordX: 1.5, coordY: 0.45, coordZ: 1.4 },
    capacityCount: 6,
    status: 'AVAILABLE',
    amenitiesList: ['Máy chiếu Laser', 'Màn hình 4K', 'Ổ cắm âm sàn'],
    aiScore: 94,
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
  const [bookingsList, setBookingsList] = useState<BookingPayloadItem[]>([
    {
      bookingId: 'BK-2026-001',
      nodeId: 'F-01',
      userEmail: 'architect.lead@spotmatrix.vn',
      startTimeIso: '09:00',
      endTimeIso: '11:30',
      purposeNote: 'Họp Kiến trúc Hệ thống 2D',
      bookingStatus: 'CONFIRMED',
    },
  ]);
  const [equipmentsList, setEquipmentsList] = useState<SharedEquipmentItem[]>([]);
  const [trustProfiles, setTrustProfiles] = useState<UserTrustProfileItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditConcurrencyLogItem[]>([]);

  // State cho phan he Thong bao Realtime (Main/Notification)
  const [notificationsList, setNotificationsList] = useState<NotificationRecordItem[]>([]);
  const [activePopupNotification, setActivePopupNotification] =
    useState<NotificationRecordItem | null>(null);

  const pushRealtimeNotification = useCallback(
    async (
      titleText: string,
      contentText: string,
      category: NotificationCategoryType = 'BOOKING_EVENT',
      relatedNodeId?: string
    ) => {
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
        const res = await fetch('/api/v1/notifications', {
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
        const data = await res.json();
        if (data?.success && data.data) {
          setNotificationsList((prev) => [
            data.data,
            ...prev.filter((i) => i.notificationId !== localItem.notificationId),
          ]);
        }
      } catch {
        // Giu thong bao local neu mang ban
      }
    },
    [userSession]
  );

  // Tu dong dong Pop-up sau 4.5 giay
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
        setWorkspaceNodes(nodesRes.data);
        setSelectedNode((prev) =>
          prev
            ? nodesRes.data.find((n: WorkspaceNodeItem) => n.nodeId === prev.nodeId) ||
              nodesRes.data[0]
            : nodesRes.data[0]
        );
      }
      if (eqRes?.success && Array.isArray(eqRes.data)) setEquipmentsList(eqRes.data);
      if (trustRes?.success && Array.isArray(trustRes.data)) setTrustProfiles(trustRes.data);
      if (auditRes?.success && Array.isArray(auditRes.data)) setAuditLogs(auditRes.data);
      if (notifRes?.success && Array.isArray(notifRes.data)) setNotificationsList(notifRes.data);
    } catch {
      // Su dung du lieu local neu mang tam ngat
    }
  }, []);

  useEffect(() => {
    if (userSession) {
      fetchAllSyncedData();
    }
  }, [userSession, fetchAllSyncedData]);

  const handleLoginSuccess = (sessionData: AuthenticatedUserSession) => {
    setUserSession(sessionData);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    setActivePage('OVERVIEW');
    navigate('/dashboard', { replace: true });
    setTimeout(() => {
      pushRealtimeNotification(
        `Chào mừng ${sessionData.userProfile.fullName}`,
        `Bạn đã đăng nhập với quyền [${sessionData.userProfile.role}]. Dữ liệu Sơ đồ 2D đã được đồng bộ.`,
        'SYSTEM_SECURITY'
      );
    }, 300);
  };

  const handleLogout = () => {
    setUserSession(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setActivePopupNotification(null);
    navigate('/login', { replace: true });
  };

  const handleMarkOneNotificationRead = async (notificationId: string) => {
    setNotificationsList((prev) =>
      prev.map((item) =>
        item.notificationId === notificationId ? { ...item, isRead: true } : item
      )
    );
    try {
      await fetch(`/api/v1/notifications/${notificationId}/read`, { method: 'PATCH' });
    } catch {
      // Bo qua
    }
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
      pushRealtimeNotification(
        `Cập nhật tọa độ ${nodeId}`,
        `Đã lưu vị trí mới (X=${posX}, Y=${posY}) vào MongoDB.`,
        'FLOORPLAN_UPDATE',
        nodeId
      );
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
      pushRealtimeNotification(
        `Đổi trạng thái vị trí ${nodeId}`,
        `Vị trí ${nodeId} vừa chuyển sang trạng thái [${nextStatus}].`,
        'FLOORPLAN_UPDATE',
        nodeId
      );
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
        pushRealtimeNotification(
          `Thêm mới vị trí ${data.data.nodeCode}`,
          `Đã bổ sung "${data.data.nodeLabel}" vào mặt bằng Tầng ${data.data.floorLevel}.`,
          'FLOORPLAN_UPDATE',
          data.data.nodeId
        );
        fetchAllSyncedData();
      }
    } catch {
      // Bo qua
    }
  };

  const handleQuickBooking = (
    targetNode: WorkspaceNodeItem,
    customEmail?: string,
    note?: string
  ) => {
    if (targetNode.status !== 'AVAILABLE') {
      pushRealtimeNotification(
        `Vị trí ${targetNode.nodeCode} đang bận`,
        'Vui lòng chọn một bàn hoặc phòng họp khác đang ở trạng thái Trống.',
        'BOOKING_EVENT'
      );
      return;
    }

    handleUpdateNodeStatus(targetNode.nodeId, 'RESERVED');

    const newBookingItem: BookingPayloadItem = {
      bookingId: `BK-${Date.now().toString().slice(-4)}`,
      nodeId: targetNode.nodeCode,
      userEmail: customEmail || userSession?.userProfile.userEmail || 'member@spotmatrix.vn',
      startTimeIso: '13:30',
      endTimeIso: '17:30',
      purposeNote: note || `Đặt chỗ ${targetNode.nodeLabel}`,
      bookingStatus: 'CONFIRMED',
    };

    setBookingsList((prev) => [newBookingItem, ...prev]);
    pushRealtimeNotification(
      `Đặt chỗ thành công: ${targetNode.nodeCode}`,
      `Đã xác nhận lịch đặt "${targetNode.nodeLabel}". Vui lòng quét mã QR đúng giờ để nhận +2 điểm tín nhiệm.`,
      'BOOKING_EVENT',
      targetNode.nodeId
    );
  };

  const sidebarItems: Array<{
    id: ActiveSidebarPage;
    label: string;
    sub: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      id: 'OVERVIEW',
      label: 'Tổng quan (Dashboard)',
      sub: 'Thống kê & So sánh TB',
      icon: LayoutDashboard,
    },
    {
      id: 'FLOORPLAN',
      label: 'Sơ đồ Mặt bằng 2D',
      sub: 'Tương tác & Kéo thả tọa độ',
      icon: Map,
    },
    {
      id: 'BOOKING',
      label: 'Lịch Đặt chỗ & QR',
      sub: 'Giữ chỗ 5p & Check-in',
      icon: CalendarCheck,
    },
    {
      id: 'NOTIFICATION',
      label: 'Trung tâm Thông báo',
      sub: 'Cảnh báo & Tin nhắn hệ thống',
      icon: Bell,
    },
    {
      id: 'DATAMANAGER',
      label: 'Thiết bị & Tín nhiệm',
      sub: 'Trust Score & Quotas',
      icon: Database,
    },
    {
      id: 'AUDIT',
      label: 'Nhật ký Hệ thống',
      sub: 'Concurrency & Audit Logs',
      icon: ShieldAlert,
    },
  ];

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
                isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-800'
              }`}
            >
              {/* =========================================================
                  SIDEBAR BEN TRAI: CHI CHUA LOGO & MENU DIEU HUONG GON GANG
                 ========================================================= */}
              <aside
                className={`w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col justify-between p-4 sm:p-5 transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
                }`}
              >
                <div className="space-y-6">
                  <SpotMatrixLogo theme={isDark ? 'dark' : 'light'} variant="full" />

                  <nav className="space-y-1">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Danh mục Chức năng
                    </p>
                    {sidebarItems.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = activePage === item.id;
                      const unreadBadge =
                        item.id === 'NOTIFICATION'
                          ? notificationsList.filter((n) => !n.isRead).length
                          : 0;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActivePage(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                            isActive
                              ? isDark
                                ? 'bg-slate-800 text-white font-semibold'
                                : 'bg-slate-900 text-white font-semibold shadow-sm'
                              : isDark
                              ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <IconComponent className="w-4 h-4 shrink-0 opacity-85" />
                            <div className="truncate">
                              <p className="text-xs font-bold leading-tight">{item.label}</p>
                              <p
                                className={`text-[10px] truncate mt-0.5 ${
                                  isActive ? 'opacity-80' : 'text-slate-400'
                                }`}
                              >
                                {item.sub}
                              </p>
                            </div>
                          </div>
                          {unreadBadge > 0 ? (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isActive
                                  ? 'bg-white text-slate-900'
                                  : isDark
                                  ? 'bg-slate-800 text-slate-200'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {unreadBadge}
                            </span>
                          ) : (
                            <ChevronRight
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'opacity-90' : 'opacity-25'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="hidden lg:block pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  SpotMatrix Architecture v2.0
                </div>
              </aside>

              {/* =========================================================
                  KHU VUC CHINH BEN PHAI (HEADER DAT CUM TAI KHOAN O BEN TRAI TREN CUNG)
                 ========================================================= */}
              <div className="flex-1 flex flex-col min-w-0">
                <header
                  className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-slate-950/90 border-slate-800'
                      : 'bg-white/95 border-slate-200/90'
                  }`}
                >
                  {/* CUM BEN TRAI TREN CUNG HEADER: THONG TIN USER + CHUONG THONG BAO + SANG/TOI + THOAT */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-200/90 text-slate-800'
                      }`}
                    >
                      <span className="font-bold">{userSession.userProfile.fullName}</span>
                      <span className="text-slate-400">
                        @{userSession.userProfile.username} • Tín nhiệm:{' '}
                        <strong className="text-slate-700 dark:text-slate-200">
                          {userSession.userProfile.trustScore}đ
                        </strong>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-300'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {userSession.userProfile.role}
                      </span>
                    </div>

                    {/* Chuong Thong bao + Dropdown xem nhanh */}
                    <NotificationHeaderBell
                      notifications={notificationsList}
                      isDark={isDark}
                      onMarkOneRead={handleMarkOneNotificationRead}
                      onMarkAllRead={handleMarkAllNotificationsRead}
                      onNavigateNotificationPage={() => setActivePage('NOTIFICATION')}
                    />

                    {/* Nut chuyen Giao dien Sang / Toi diu mat */}
                    <button
                      type="button"
                      onClick={toggleThemeMode}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                          : 'bg-slate-100/80 border-slate-200/90 text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      <span>{isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
                    </button>

                    {/* Nut Thoat diu mat */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                          : 'bg-slate-100/80 border-slate-200/90 text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Thoát</span>
                    </button>
                  </div>

                  {/* BEN PHAI HEADER: TEN TRANG HIEN TAI & GOI Y AI */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const bestNode = workspaceNodes.find((n) => n.status === 'AVAILABLE');
                        if (bestNode) {
                          setSelectedNode(bestNode);
                          setActivePage('FLOORPLAN');
                          pushRealtimeNotification(
                            `AI Đề xuất Vị trí: ${bestNode.nodeCode}`,
                            `Bàn "${bestNode.nodeLabel}" đang trống và đạt độ tương thích ${bestNode.aiScore}%.`,
                            'BOOKING_EVENT',
                            bestNode.nodeId
                          );
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        isDark
                          ? 'bg-slate-100 text-slate-900 border-slate-100 hover:bg-white'
                          : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Gợi ý Chỗ ngồi
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
                        selectedNode={selectedNode}
                        userRole={userSession.userProfile.role}
                        isDark={isDark}
                        onSelectNode={(n) => setSelectedNode(n)}
                        onTriggerQuickBooking={(n) => handleQuickBooking(n)}
                        onUpdateNodeCoords={handleUpdateNodeCoords}
                        onUpdateNodeStatus={handleUpdateNodeStatus}
                        onCreateNewNode={handleCreateNewNode}
                      />
                    </>
                  )}

                  {activePage === 'FLOORPLAN' && (
                    <FloorplanMainPages
                      workspaceNodes={workspaceNodes}
                      selectedNode={selectedNode}
                      userRole={userSession.userProfile.role}
                      isDark={isDark}
                      onSelectNode={(n) => setSelectedNode(n)}
                      onTriggerQuickBooking={(n) => handleQuickBooking(n)}
                      onUpdateNodeCoords={handleUpdateNodeCoords}
                      onUpdateNodeStatus={handleUpdateNodeStatus}
                      onCreateNewNode={handleCreateNewNode}
                    />
                  )}

                  {activePage === 'BOOKING' && (
                    <BookingCalendarPages
                      bookingsList={bookingsList}
                      onCreateNewBooking={(email, purpose) => {
                        if (selectedNode) {
                          handleQuickBooking(selectedNode, email, purpose);
                        }
                      }}
                    />
                  )}

                  {activePage === 'NOTIFICATION' && (
                    <NotificationCenterPages
                      notifications={notificationsList}
                      isDark={isDark}
                      onMarkOneRead={handleMarkOneNotificationRead}
                      onMarkAllRead={handleMarkAllNotificationsRead}
                      onDeleteNotification={handleDeleteNotification}
                      onTriggerTestNotification={(title, content) =>
                        pushRealtimeNotification(title, content, 'BOOKING_EVENT')
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

                  {activePage === 'AUDIT' && (
                    <div
                      className={`p-5 rounded-2xl border space-y-3 ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <h2 className="text-base font-bold">
                        Nhật ký Xung đột & Truy vết Hệ thống (Audit Logs)
                      </h2>
                      <div className="space-y-2">
                        {auditLogs.map((log) => (
                          <div
                            key={log.auditId}
                            className={`p-3.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                              isDark
                                ? 'bg-slate-950 border-slate-800'
                                : 'bg-slate-50 border-slate-200/80'
                            }`}
                          >
                            <div>
                              <span className="font-bold">[{log.eventCategory}]</span>{' '}
                              <span className="text-slate-600 dark:text-slate-300">
                                {log.detailMessage}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Thực hiện bởi: {log.actorEmail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </main>
              </div>

              {/* Pop-up Thong bao Realtime diu mat o goc duoi ben phai */}
              <RealtimePopupToast
                activePopup={activePopupNotification}
                isDark={isDark}
                onDismissPopup={() => setActivePopupNotification(null)}
                onOpenNotificationPage={() => setActivePage('NOTIFICATION')}
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