import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { SpotMatrixLogo } from '../Components/SpotMatrixLogo';
import { fallbackMemoryNodes } from '../Database/MongoConnection';
import { BookingPayloadItem, WorkspaceNodeItem } from '../Types/GlobalSystemTypes';
import { ErrorBoundaryLayout } from '../../Error/Layout/ErrorBoundaryLayout';
import { ToastAlertBanner } from '../../Error/Function/Components/ToastAlertBanner';
import { DataOverviewPages } from '../../Main/Datamanager/Pages/DataOverviewPages';
import { AiAssistantPages } from '../../Ai/Pages/AiAssistantPages';
import { FloorplanMainPages } from '../../Main/Floorplan/Pages/FloorplanMainPages';
import { BookingCalendarPages } from '../../Main/Booking/Pages/BookingCalendarPages';
import { AuthenticatedUserSession, LoginPages } from '../../Main/Auth/Pages/LoginPages';

// Dung sessionStorage de moi lan mo trinh duyet moi se luon bat dau tu trang /login
const SESSION_STORAGE_KEY = 'spotmatrix_active_session_v2';

const MainWorkspaceRoutes: React.FC = () => {
  const navigate = useNavigate();

  const [userSession, setUserSession] = useState<AuthenticatedUserSession | null>(() => {
    try {
      const savedRaw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return savedRaw ? JSON.parse(savedRaw) : null;
    } catch {
      return null;
    }
  });

  const [activeDashboardSection, setActiveDashboardSection] = useState<
    'OVERVIEW' | 'FLOORPLAN' | 'BOOKING'
  >('OVERVIEW');

  const [workspaceNodes, setWorkspaceNodes] = useState<WorkspaceNodeItem[]>(fallbackMemoryNodes);
  const [selectedNode, setSelectedNode] = useState<WorkspaceNodeItem | null>(
    fallbackMemoryNodes[0]
  );
  const [bookingsList, setBookingsList] = useState<BookingPayloadItem[]>([
    {
      bookingId: 'BK-2026-001',
      nodeId: 'NODE-F01',
      userEmail: 'architect.lead@spotmatrix.vn',
      startTimeIso: '09:00',
      endTimeIso: '11:30',
      purposeNote: 'Họp Kiến trúc Hệ thống 2D/3D',
      bookingStatus: 'CONFIRMED',
    },
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLoginSuccess = (sessionData: AuthenticatedUserSession) => {
    setUserSession(sessionData);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    setToastMessage(
      `Đăng nhập thành công! Chào mừng ${sessionData.userProfile.fullName} (${sessionData.userProfile.role}) đến với Bảng Tổng quan.`
    );
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    setUserSession(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setToastMessage(null);
    navigate('/login', { replace: true });
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

    const updatedList = workspaceNodes.map((item) =>
      item.nodeId === targetNode.nodeId ? { ...item, status: 'RESERVED' as const } : item
    );
    setWorkspaceNodes(updatedList);
    setSelectedNode({ ...targetNode, status: 'RESERVED' });

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
    setToastMessage(`Đã đặt thành công vị trí ${targetNode.nodeCode} (${targetNode.nodeLabel})!`);
  };

  const roleBadgeColorMap = {
    SYS_ADMIN: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    MANAGER: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    EMPLOYEE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  };

  return (
    <Routes>
      {/* 1. TRANG MO DAU TIEN: /login */}
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

      {/* 2. TRANG TONG QUAN SAU KHI DANG NHAP: /dashboard */}
      <Route
        path="/dashboard"
        element={
          !userSession ? (
            <Navigate to="/login" replace />
          ) : (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
              <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/90 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <SpotMatrixLogo theme="dark" variant="full" />

                  <nav className="hidden md:flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 ml-2">
                    <button
                      onClick={() => setActiveDashboardSection('OVERVIEW')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeDashboardSection === 'OVERVIEW'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Tổng quan (Dashboard)
                    </button>
                    <button
                      onClick={() => setActiveDashboardSection('FLOORPLAN')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeDashboardSection === 'FLOORPLAN'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Bản đồ 2D/3D
                    </button>
                    <button
                      onClick={() => setActiveDashboardSection('BOOKING')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeDashboardSection === 'BOOKING'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Lịch Đặt chỗ
                    </button>
                  </nav>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="font-bold text-white">
                      {userSession.userProfile.fullName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      @{userSession.userProfile.username} • Tín nhiệm:{' '}
                      <strong className="text-emerald-400">
                        {userSession.userProfile.trustScore}đ
                      </strong>
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full border font-bold text-[11px] ${
                      roleBadgeColorMap[userSession.userProfile.role]
                    }`}
                  >
                    {userSession.userProfile.role}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600/80 text-slate-200 hover:text-white font-semibold transition"
                  >
                    Đăng xuất
                  </button>
                </div>
              </header>

              <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
                {/* Banner Chao mung tren Trang Tong Quan */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                      SpotMatrix Command Center • {userSession.userProfile.departmentName}
                    </span>
                    <h1 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                      Bảng Tổng Quan Hệ Thống (Xin chào, {userSession.userProfile.fullName})
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                      Mã định danh: <strong className="text-white">{userSession.userProfile.accountCode}</strong>
                    </span>
                  </div>
                </div>

                {activeDashboardSection === 'OVERVIEW' && (
                  <>
                    <DataOverviewPages workspaceNodes={workspaceNodes} />
                    <AiAssistantPages
                      workspaceNodes={workspaceNodes}
                      onApplyRecommendation={(recommended) => {
                        setSelectedNode(recommended);
                        setToastMessage(
                          `AI đã chọn giúp bạn vị trí tối ưu: ${recommended.nodeLabel}`
                        );
                      }}
                    />
                    <FloorplanMainPages
                      workspaceNodes={workspaceNodes}
                      selectedNode={selectedNode}
                      onSelectNode={(nodeItem) => setSelectedNode(nodeItem)}
                      onTriggerQuickBooking={(nodeItem) => handleQuickBooking(nodeItem)}
                    />
                    <BookingCalendarPages
                      bookingsList={bookingsList}
                      onCreateNewBooking={(email, purpose) => {
                        if (selectedNode) {
                          handleQuickBooking(selectedNode, email, purpose);
                        }
                      }}
                    />
                  </>
                )}

                {activeDashboardSection === 'FLOORPLAN' && (
                  <FloorplanMainPages
                    workspaceNodes={workspaceNodes}
                    selectedNode={selectedNode}
                    onSelectNode={(nodeItem) => setSelectedNode(nodeItem)}
                    onTriggerQuickBooking={(nodeItem) => handleQuickBooking(nodeItem)}
                  />
                )}

                {activeDashboardSection === 'BOOKING' && (
                  <BookingCalendarPages
                    bookingsList={bookingsList}
                    onCreateNewBooking={(email, purpose) => {
                      if (selectedNode) {
                        handleQuickBooking(selectedNode, email, purpose);
                      }
                    }}
                  />
                )}
              </main>

              <ToastAlertBanner
                alertMessage={toastMessage}
                alertType="success"
                onDismissAlert={() => setToastMessage(null)}
              />
            </div>
          )
        }
      />

      {/* 3. MAC DINH MOI DUONG DAN GOC (/) SE CHUYEN VE /login NEU CHUA DANG NHAP */}
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