import React from 'react';
import { WorkspaceNodeItem } from '../../../Shared/Types/GlobalSystemTypes';
import { recommendOptimalSeat } from '../Services/SeatRecommendationService';

interface SmartSeatRecommenderProps {
  workspaceNodes: WorkspaceNodeItem[];
  onApplyRecommendation: (nodeItem: WorkspaceNodeItem) => void;
}

export const SmartSeatRecommender: React.FC<SmartSeatRecommenderProps> = ({
  workspaceNodes,
  onApplyRecommendation,
}) => {
  const bestCandidate = recommendOptimalSeat(workspaceNodes, 1);

  return (
    <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-cyan-950/80 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
          AI Spatial Co-Pilot • Gợi ý Chỗ ngồi Tối ưu
        </span>
        <p className="text-sm font-semibold text-white mt-0.5">
          {bestCandidate
            ? `Đề xuất tốt nhất hiện tại: ${bestCandidate.nodeLabel} (Điểm AI: ${bestCandidate.aiScore}/100)`
            : 'Tất cả vị trí đang được sử dụng'}
        </p>
      </div>
      {bestCandidate && (
        <button
          onClick={() => onApplyRecommendation(bestCandidate)}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shrink-0"
        >
          Chọn theo Gợi ý AI
        </button>
      )}
    </div>
  );
};
