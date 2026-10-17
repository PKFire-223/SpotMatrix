import React from 'react';
import { WorkspaceNodeItem } from '../../../../Shared/Types/GlobalSystemTypes';

interface InteractiveMap2DProps {
  workspaceNodes: WorkspaceNodeItem[];
  selectedNodeId: string | null;
  onSelectWorkspaceNode: (nodeItem: WorkspaceNodeItem) => void;
}

export const InteractiveMap2D: React.FC<InteractiveMap2DProps> = ({
  workspaceNodes,
  selectedNodeId,
  onSelectWorkspaceNode,
}) => {
  const resolveStatusColor = (status: WorkspaceNodeItem['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'fill-emerald-500/80 stroke-emerald-300';
      case 'OCCUPIED':
        return 'fill-rose-500/80 stroke-rose-300';
      case 'RESERVED':
        return 'fill-amber-500/80 stroke-amber-300';
      default:
        return 'fill-slate-600 stroke-slate-400';
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Bản đồ Mặt bằng Vector 2D Tương tác (Touch & Mouse Ready)
        </span>
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Trống
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Đã đặt
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Đang ngồi
          </span>
        </div>
      </div>

      <svg
        viewBox="0 0 520 340"
        className="w-full h-auto max-h-[380px] bg-slate-950 rounded-xl border border-slate-800/80 select-none"
      >
        <defs>
          <pattern id="floorGrid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path
              d="M 26 0 L 0 0 0 26"
              fill="none"
              stroke="rgba(148, 163, 184, 0.08)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="520" height="340" fill="url(#floorGrid)" />

        <rect
          x="20"
          y="20"
          width="480"
          height="300"
          rx="16"
          fill="none"
          stroke="rgba(99, 102, 241, 0.3)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <text x="35" y="45" fill="#94a3b8" fontSize="11" fontWeight="600">
          TẦNG 1 — KHÔNG GIAN LÀM VIỆC THÔNG MINH SMARTSPACE
        </text>

        {workspaceNodes.map((nodeItem) => {
          const isSelected = nodeItem.nodeId === selectedNodeId;
          const boxWidth = nodeItem.zoneType === 'MEETING_ROOM' ? 110 : 92;
          const boxHeight = nodeItem.zoneType === 'MEETING_ROOM' ? 76 : 62;

          return (
            <g
              key={nodeItem.nodeId}
              transform={`translate(${nodeItem.position2D.posX}, ${nodeItem.position2D.posY})`}
              onClick={() => onSelectWorkspaceNode(nodeItem)}
              className="cursor-pointer transition-transform duration-150 hover:opacity-95"
            >
              <rect
                x={-boxWidth / 2}
                y={-boxHeight / 2}
                width={boxWidth}
                height={boxHeight}
                rx={12}
                strokeWidth={isSelected ? 3.5 : 1.5}
                className={`${resolveStatusColor(nodeItem.status)} ${
                  isSelected ? 'stroke-white filter drop-shadow' : ''
                }`}
              />
              <text
                x="0"
                y="-4"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="700"
              >
                {nodeItem.nodeCode}
              </text>
              <text x="0" y="13" textAnchor="middle" fill="#e2e8f0" fontSize="9">
                {nodeItem.capacityCount} chỗ • AI {nodeItem.aiScore}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
