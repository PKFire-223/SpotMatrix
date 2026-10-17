import React, { useState } from 'react';
import { WorkspaceNodeItem } from '../../../Shared/Types/GlobalSystemTypes';
import { InteractiveMap2D } from '../Function/Components/InteractiveMap2D';
import { InteractiveSpace3D } from '../Function/Components/InteractiveSpace3D';
import { FloorplanCanvasLayout } from '../Layout/FloorplanCanvasLayout';

interface FloorplanMainPagesProps {
  workspaceNodes: WorkspaceNodeItem[];
  selectedNode: WorkspaceNodeItem | null;
  onSelectNode: (nodeItem: WorkspaceNodeItem) => void;
  onTriggerQuickBooking: (nodeItem: WorkspaceNodeItem) => void;
}

export const FloorplanMainPages: React.FC<FloorplanMainPagesProps> = ({
  workspaceNodes,
  selectedNode,
  onSelectNode,
  onTriggerQuickBooking,
}) => {
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [cameraAngleDeg, setCameraAngleDeg] = useState<number>(-28);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 sm:p-4 rounded-2xl">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            Bản đồ Không gian Làm việc Trực quan (2D / 3D Spatial Twin)
          </h2>
          <p className="text-xs text-slate-400">
            Chạm hoặc click vào từng vị trí bàn / phòng họp để xem thông số & đặt chỗ tức thì
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('2D')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === '2D'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Mặt bằng 2D
          </button>
          <button
            onClick={() => setViewMode('3D')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === '3D'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Không gian 3D
          </button>
          {viewMode === '3D' && (
            <button
              onClick={() => setCameraAngleDeg((prev) => (prev + 45) % 360)}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-amber-300 hover:bg-slate-700"
            >
              Xoay 45°
            </button>
          )}
        </div>
      </div>

      <FloorplanCanvasLayout
        mapViewportSlot={
          viewMode === '2D' ? (
            <InteractiveMap2D
              workspaceNodes={workspaceNodes}
              selectedNodeId={selectedNode?.nodeId || null}
              onSelectWorkspaceNode={onSelectNode}
            />
          ) : (
            <InteractiveSpace3D
              workspaceNodes={workspaceNodes}
              selectedNodeId={selectedNode?.nodeId || null}
              cameraAngleDeg={cameraAngleDeg}
              onSelectWorkspaceNode={onSelectNode}
            />
          )
        }
        sideControlSlot={
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
              Thông tin Chi tiết Vị trí
            </h3>
            {selectedNode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-white">{selectedNode.nodeLabel}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                    Mã: {selectedNode.nodeCode}
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <p>• Phân khu: {selectedNode.zoneType}</p>
                  <p>• Sức chứa tối đa: {selectedNode.capacityCount} người</p>
                  <p>• Điểm tương thích AI: {selectedNode.aiScore}/100</p>
                  <p>• Trạng thái hiện tại: {selectedNode.status}</p>
                </div>
                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-400 mb-1.5">Tiện ích đi kèm:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.amenitiesList.map((item) => (
                      <span
                        key={item}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 text-slate-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  disabled={selectedNode.status !== 'AVAILABLE'}
                  onClick={() => onTriggerQuickBooking(selectedNode)}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition"
                >
                  {selectedNode.status === 'AVAILABLE'
                    ? 'Đặt chỗ Ngay Vị trí Này'
                    : 'Vị trí Đã Được Đặt / Đang Bận'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Hãy chọn một bàn hoặc phòng họp trên bản đồ 2D/3D để xem thông số kỹ thuật và đặt lịch.
              </p>
            )}
          </div>
        }
      />
    </div>
  );
};
