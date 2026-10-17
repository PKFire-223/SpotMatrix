import React from 'react';
import { WorkspaceNodeItem } from '../../../../Shared/Types/GlobalSystemTypes';

interface InteractiveSpace3DProps {
  workspaceNodes: WorkspaceNodeItem[];
  selectedNodeId: string | null;
  cameraAngleDeg: number;
  onSelectWorkspaceNode: (nodeItem: WorkspaceNodeItem) => void;
}

export const InteractiveSpace3D: React.FC<InteractiveSpace3DProps> = ({
  workspaceNodes,
  selectedNodeId,
  cameraAngleDeg,
  onSelectWorkspaceNode,
}) => {
  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Mô hình Phối cảnh 3D Isometric / Three.js Spatial View
        </span>
        <span className="text-xs text-slate-400">
          Góc xoay Camera: {cameraAngleDeg}° (Hỗ trợ cảm ứng iPad & Mobile)
        </span>
      </div>

      <div className="relative h-[340px] w-full bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/40 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
        <div
          className="relative w-72 h-72 sm:w-80 sm:h-80 transition-transform duration-500"
          style={{
            transform: `perspective(800px) rotateX(55deg) rotateZ(${cameraAngleDeg}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="absolute inset-0 bg-slate-800/70 border-2 border-indigo-500/40 rounded-2xl shadow-2xl" />

          {workspaceNodes.map((nodeItem) => {
            const isSelected = nodeItem.nodeId === selectedNodeId;
            const leftPercent = ((nodeItem.position2D.posX - 50) / 400) * 80 + 10;
            const topPercent = ((nodeItem.position2D.posY - 60) / 240) * 75 + 12;

            const cubeColor =
              nodeItem.status === 'AVAILABLE'
                ? 'bg-emerald-500 border-emerald-200'
                : nodeItem.status === 'RESERVED'
                ? 'bg-amber-500 border-amber-200'
                : 'bg-rose-500 border-rose-200';

            return (
              <button
                key={nodeItem.nodeId}
                onClick={() => onSelectWorkspaceNode(nodeItem)}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  transform: isSelected ? 'translateZ(26px) scale(1.15)' : 'translateZ(14px)',
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-2 rounded-lg border-2 text-white font-bold text-xs shadow-lg transition-all ${cubeColor} ${
                  isSelected ? 'ring-4 ring-white/60' : ' opacity-90 hover:opacity-100'
                }`}
              >
                <div>{nodeItem.nodeCode}</div>
                <div className="text-[9px] font-normal opacity-90">{nodeItem.capacityCount}P</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
