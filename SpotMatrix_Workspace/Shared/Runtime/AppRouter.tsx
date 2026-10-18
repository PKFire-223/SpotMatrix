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
  SeatStatusType,
  SharedEquipmentItem,
  UserTrustProfileItem,
  WorkspaceNodeItem,
  WorkspaceZoneType,
} from '../Types/GlobalSystemTypes';
import { ErrorBoundaryLayout } from '../../Error/Layout/ErrorBoundaryLayout';
import { ToastAlertBanner } from '../../Error/Function/Components/ToastAlertBanner';
import { DataOverviewPages } from '../../Main/Datamanager/Pages/DataOverviewPages';
import { FloorplanMainPages } from '../../Main/Floorplan/Pages/FloorplanMainPages';
import { BookingCalendarPages } from '../../Main/Booking/Pages/BookingCalendarPages';
import { AuthenticatedUserSession, LoginPages } from '../../Main/Auth/Pages/LoginPages';

const SESSION_STORAGE_KEY = 'spotmatrix_active_session_v2';

type ActiveSidebarPage = 'OVERVIEW' | 'FLOORPLAN' | 'BOOKING' | 'DATAMANAGER' | 'AUDIT';

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
  {
    nodeId: 'NODE-B01',
    nodeCode: 'B-01',
    nodeLabel: 'Bàn Nghiên cứu AI B01 (Tầng 2)',
    zoneType: 'DESK_POD',
    floorLevel: 2,
    position2D: { posX: 160, posY: 130 },
    position3D: { coordX: -1.5, coordY: 1.4, coordZ: -0.9 },
    capacityCount: 2,
    status: 'AVAILABLE',
    amenitiesList: ['Màn hình 4K', 'Bảng vẽ Wacom'],
    aiScore: 97,
  },
  {
    nodeId: 'NODE-M02',
    nodeCode: 'M-02',
    nodeLabel: 'Phòng Hội thảo M02 (Tầng 2)',
    zoneType: 'MEETING_ROOM',
    floorLevel: 2,
    position2D: { posX: 430, posY: 210 },
    position3D: { coordX: 1.4, coordY: 1.6, coordZ: 0.6 },
    capacityCount: 12,
    status: 'MAINTENANCE',
    amenitiesList: ['Máy chiếu Laser', 'Camera AI 360', 'Cách âm 40dB'],
    aiScore: 82,
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchAllSyncedData = useCallback(async () => {
    try {
      const [nodesRes, eqRes, trustRes, auditRes] = await Promise.all([
        fetch('/api/v1/floorplan/nodes').then((r) => r.json()),
        fetch('/api/v1/datamanager/equipments').then((r) => r.json()),
        fetch('/api/v1/datamanager/trust-scores').then((r) => r.json()),
        fetch('/api/v1/datamanager/audit-logs').then((r) => r.json()),
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
    } catch {
      // Su dung du lieu khoi tao neu mang tam ngat
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
    setToastMessage(
      `Chào mừng ${sessionData.userProfile.fullName} (${sessionData.userProfile.role}) đến với Bảng Tổng quan!`
    );
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    setUserSession(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setToastMessage(null);
    navigate('/login', { replace: true });
  };

  // Cap nhat toa do keo tha cua Admin len MongoDB & dong bo ngay voi Dashboard
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
      setToastMessage(`Đã lưu tọa độ mới (${posX}, ${posY}) của ${nodeId} vào MongoDB!`);
      fetchAllSyncedData();
    } catch {
      setToastMessage(`Đã cập nhật tọa độ (${posX}, ${posY}) trên sơ đồ.`);
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
      setToastMessage(`Đã chuyển trạng thái ${nodeId} sang [${nextStatus}].`);
      fetchAllSyncedData();
    } catch {
      // Giu trang thai local
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
        setToastMessage(data.message);
        fetchAllSyncedData();
      }
    } catch {
      setToastMessage('Không thể tạo vị trí mới lúc này.');
    }
  };

  const handleQuickBooking = (
    targetNode: WorkspaceNodeItem,
    customEmail?: string,
    note?: string
  ) => {
    if (targetNode.status !== 'AVAILABLE') {
      setToastMessage(`Vị trí ${targetNode.nodeCode} hiện không còn trống!`);
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
    setToastMessage(
      `Đã đặt thành công vị trí ${targetNode.nodeCode} (${targetNode.nodeLabel})! Số liệu Tổng quan đã tự động cập nhật.`
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
      sub: 'Biểu đồ & AI So sánh',
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
                isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
              }`}
            >
              {/* =========================================================
                  THANH DIEU HUONG BEN TRAI (LEFT SIDEBAR)
                 ========================================================= */}
              <aside
                className={`w-full lg:w-68 xl:w-72 shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col justify-between p-4 sm:p-5 transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
                }`}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <SpotMatrixLogo theme={isDark ? 'dark' : 'light'} variant="full" />
                  </div>

                  {/* Danh sach Duong dan Dieu huong */}
                  <nav className="space-y-1.5">
                    <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                      Phân hệ Chức năng
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
                              ? 'bg-blue-600 text-white shadow-sm'
                              : isDark
                              ? 'text-slate-300 hover:bg-slate-800/80'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <IconComponent
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                              }`}
                            />
                            <div className="truncate">
                              <p className="text-xs font-bold leading-tight">{item.label}</p>
                              <p
                                className={`text-[10px] truncate mt-0.5 ${
                                  isActive ? 'text-blue-100' : 'text-slate-400'
                                }`}
                              >
                                {item.sub}
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'opacity-100' : 'opacity-30'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Thong tin Nguoi dung & Chuyen Sang/Toi o cuoi Sidebar */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold truncate">{userSession.userProfile.fullName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                        {userSession.userProfile.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      @{userSession.userProfile.username} • Tín nhiệm:{' '}
                      <strong className="text-teal-600 dark:text-teal-400">
                        {userSession.userProfile.trustScore}đ
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleThemeMode}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-amber-300'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      {isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white transition flex items-center gap-1"
                      title="Đăng xuất"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Thoát
                    </button>
                  </div>
                </div>
              </aside>

              {/* =========================================================
                  KHU VUC NOI DUNG CHINH BEN PHAI
                 ========================================================= */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Thanh Header Nhe nhang */}
                <header
                  className={`sticky top-0 z-20 backdrop-blur-md border-b px-5 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-slate-950/85 border-slate-800'
                      : 'bg-white/85 border-slate-200/90'
                  }`}
                >
                  <div>
                    <h1 className="text-base sm:text-lg font-extrabold">
                      {sidebarItems.find((i) => i.id === activePage)?.label}
                    </h1>
                    <p className="text-xs text-slate-400">
                      Phòng ban: {userSession.userProfile.departmentName} • Mã định danh:{' '}
                      {userSession.userProfile.accountCode}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const bestNode = workspaceNodes.find((n) => n.status === 'AVAILABLE');
                        if (bestNode) {
                          setSelectedNode(bestNode);
                          setActivePage('FLOORPLAN');
                          setToastMessage(
                            `AI đề xuất vị trí trống tốt nhất: ${bestNode.nodeLabel} (Điểm AI: ${bestNode.aiScore}%)`
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Gợi ý Chỗ ngồi Tối ưu
                    </button>
                  </div>
                </header>

                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
                  {activePage === 'OVERVIEW' && (
                    <>
                      <DataOverviewPages
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

                  {activePage === 'DATAMANAGER' && (
                    <DataOverviewPages
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
                      <h2 className="text-base font-extrabold">
                        Nhật ký Xung đột & Truy vết Hệ thống (Real-time Audit Logs)
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
                              <span className="font-extrabold text-blue-600 dark:text-blue-400">
                                [{log.eventCategory}]
                              </span>{' '}
                              <span className="font-semibold">{log.detailMessage}</span>
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

              <ToastAlertBanner
                alertMessage={toastMessage}
                alertType="success"
                onDismissAlert={() => setToastMessage(null)}
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