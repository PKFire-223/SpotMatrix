import React from 'react';
import { WorkspaceNodeItem } from '../../../Shared/Types/GlobalSystemTypes';
import { MetricStatCard } from '../Function/Components/MetricStatCard';
import { DataDashboardLayout } from '../Layout/DataDashboardLayout';

export const DataOverviewPages: React.FC<{ workspaceNodes: WorkspaceNodeItem[] }> = ({
  workspaceNodes,
}) => {
  const availableCount = workspaceNodes.filter((n) => n.status === 'AVAILABLE').length;
  const totalCapacity = workspaceNodes.reduce((acc, item) => acc + item.capacityCount, 0);

  return (
    <DataDashboardLayout>
      <MetricStatCard
        metricTitle="Tổng Phân khu 2D/3D"
        metricValue={workspaceNodes.length}
        metricTrend="Đồng bộ thời gian thực"
      />
      <MetricStatCard
        metricTitle="Vị trí Đang Trống"
        metricValue={availableCount}
        metricTrend="Sẵn sàng đặt chỗ ngay"
      />
      <MetricStatCard
        metricTitle="Tổng Sức chứa (Chỗ)"
        metricValue={totalCapacity}
        metricTrend="Hỗ trợ cá nhân & nhóm"
      />
      <MetricStatCard
        metricTitle="Độ chính xác AI Gợi ý"
        metricValue="94.5%"
        metricTrend="Tối ưu hóa mật độ ngồi"
      />
    </DataDashboardLayout>
  );
};
