import React, { useState } from 'react';
import { SpotMatrixLogo } from '../Components/SpotMatrixLogo';
import { fallbackMemoryNodes } from '../Database/MongoConnection';
import { BookingPayloadItem, WorkspaceNodeItem } from '../Types/GlobalSystemTypes';
import { ErrorBoundaryLayout } from '../../Error/Layout/ErrorBoundaryLayout';
import { ToastAlertBanner } from '../../Error/Function/Components/ToastAlertBanner';
import { DataOverviewPages } from '../../Main/Datamanager/Pages/DataOverviewPages';
import { AiAssistantPages } from '../../Ai/Pages/AiAssistantPages';
import { FloorplanMainPages } from '../../Main/Floorplan/Pages/FloorplanMainPages';
import { BookingCalendarPages } from '../../Main/Booking/Pages/BookingCalendarPages';

export const AppRouter: React.FC = () => {
  const [workspaceNodes, setWorkspaceNodes] = useState<WorkspaceNodeItem[]>(fallbackMemoryNodes);
  const [selectedNode, setSelectedNode] = useState<WorkspaceNodeItem | null>(
    fallbackMemoryNodes[0]
  );
  const [bookingsList, setBookingsList] = useState<BookingPayloadItem[]>([
    {
      bookingId: 'BK-2026-001',
      nodeId: 'NODE-F01',
      userEmail: 'architect.lead@smartspace.vn',
      startTimeIso: '09:00',
      endTimeIso: '11:30',
      purposeNote: 'Họp Kiến trúc Hệ thống 2D/3D',
      bookingStatus: 'CONFIRMED',
    },
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleQuickBooking = (targetNode: WorkspaceNodeItem, customEmail?: string, note?: string) => {
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
      userEmail: customEmail || 'personal.portfolio@smartspace.io',
      startTimeIso: '13:30',
      endTimeIso: '17:30',
      purposeNote: note || `Đặt chỗ ${targetNode.nodeLabel}`,
      bookingStatus: 'CONFIRMED',
    };

    setBookingsList((prev) => [newBookingItem, ...prev]);
    setToastMessage(`Đã đặt thành công vị trí ${targetNode.nodeCode} (${targetNode.nodeLabel})!`);
  };

  return (
    <ErrorBoundaryLayout>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/85 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
  <SpotMatrixLogo theme="dark" variant="full" />
  <div className="hidden md:block pl-3 border-l border-slate-800">
    <p className="text-xs font-semibold text-slate-300">
      2D Interactive Floorplan & Workspace Reservation
    </p>
    <p className="text-[10px] text-slate-500">
      Real-Time Matrix State • Concurrency Control • Mobile / iPad / Desktop
    </p>
  </div>
</div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
          <DataOverviewPages workspaceNodes={workspaceNodes} />

          <AiAssistantPages
            workspaceNodes={workspaceNodes}
            onApplyRecommendation={(recommended) => {
              setSelectedNode(recommended);
              setToastMessage(`AI đã chọn giúp bạn vị trí tối ưu: ${recommended.nodeLabel}`);
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
        </main>

        <ToastAlertBanner
          alertMessage={toastMessage}
          alertType="success"
          onDismissAlert={() => setToastMessage(null)}
        />
      </div>
    </ErrorBoundaryLayout>
  );
};
