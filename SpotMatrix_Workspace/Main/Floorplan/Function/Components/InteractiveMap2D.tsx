import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import {
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Flame,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { WorkspaceNodeItem } from '../../../../Shared/Types/GlobalSystemTypes';

interface InteractiveMap2DProps {
  workspaceNodes: WorkspaceNodeItem[];
  selectedNodeId: string | null;
  isDark: boolean;
  isAdminDragMode: boolean;
  activeFloor: number;
  onSelectWorkspaceNode: (nodeItem: WorkspaceNodeItem) => void;
  onCommitNodeCoordinates: (nodeId: string, newX: number, newY: number) => void;
}

// Hạt nhân hiển thị từng vị trí được bọc React.memo để chống re-render thừa
interface SpotNodeRenderProps {
  nodeItem: WorkspaceNodeItem;
  renderX: number;
  renderY: number;
  isSelected: boolean;
  isBeingDragged: boolean;
  isColliding: boolean;
  isDark: boolean;
  isAdminDragMode: boolean;
  showAiHeatmap: boolean;
  holdSecondsLeft: number;
  onPointerDownNode: (e: React.PointerEvent<SVGGElement>, nodeItem: WorkspaceNodeItem) => void;
}

const MemoizedSpotNode: React.FC<SpotNodeRenderProps> = memo(
  ({
    nodeItem,
    renderX,
    renderY,
    isSelected,
    isBeingDragged,
    isColliding,
    isDark,
    isAdminDragMode,
    showAiHeatmap,
    holdSecondsLeft,
    onPointerDownNode,
  }) => {
    const resolveNodePalette = (status: WorkspaceNodeItem['status']) => {
      if (isColliding) {
        return {
          bg: isDark ? '#7f1d1d' : '#fee2e2',
          border: '#ef4444',
          text: isDark ? '#fecaca' : '#991b1b',
          badge: 'Trùng vị trí!',
        };
      }
      if (isDark) {
        switch (status) {
          case 'AVAILABLE':
            return { bg: '#064e3b', border: '#10b981', text: '#ecfdf5', badge: 'Trống' };
          case 'HOLDING':
            return { bg: '#78350f', border: '#f59e0b', text: '#fef3c7', badge: 'Giữ chỗ' };
          case 'RESERVED':
            return { bg: '#1e3a8a', border: '#3b82f6', text: '#eff6ff', badge: 'Đã đặt' };
          case 'OCCUPIED':
            return { bg: '#881337', border: '#f43f5e', text: '#ffe4e6', badge: 'Đang ngồi' };
          default:
            return { bg: '#334155', border: '#94a3b8', text: '#f1f5f9', badge: 'Bảo trì' };
        }
      } else {
        switch (status) {
          case 'AVAILABLE':
            return { bg: '#ecfdf5', border: '#0d9488', text: '#134e4a', badge: 'Trống' };
          case 'HOLDING':
            return { bg: '#fffbeb', border: '#d97706', text: '#78350f', badge: 'Giữ chỗ' };
          case 'RESERVED':
            return { bg: '#eff6ff', border: '#2563eb', text: '#1e3a8a', badge: 'Đã đặt' };
          case 'OCCUPIED':
            return { bg: '#fff1f2', border: '#e11d48', text: '#881337', badge: 'Đang ngồi' };
          default:
            return { bg: '#f1f5f9', border: '#64748b', text: '#334155', badge: 'Bảo trì' };
        }
      }
    };

    const palette = resolveNodePalette(nodeItem.status);
    const boxW =
      nodeItem.zoneType === 'MEETING_ROOM'
        ? 132
        : nodeItem.zoneType === 'COLLAB_HUB'
        ? 122
        : 104;
    const boxH =
      nodeItem.zoneType === 'MEETING_ROOM' || nodeItem.zoneType === 'COLLAB_HUB' ? 76 : 64;

    const formatCountdown = (totalSec: number) => {
      const m = Math.floor(totalSec / 60)
        .toString()
        .padStart(2, '0');
      const s = (totalSec % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    const safeAiScore = Number.isFinite(nodeItem.aiScore) ? Number(nodeItem.aiScore) : 90;

    return (
      <g
        transform={`translate(${renderX}, ${renderY})`}
        onPointerDown={(e) => onPointerDownNode(e, nodeItem)}
        style={{ willChange: isBeingDragged ? 'transform' : 'auto' }}
        className={isAdminDragMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
      >
        {/* Lớp phủ Nhiệt AI (AI Demand Aura) khi bật chế độ Heatmap */}
        {showAiHeatmap && (
          <circle
            cx="0"
            cy="0"
            r={boxW * 0.72}
            fill={
              safeAiScore >= 94
                ? 'rgba(13, 148, 136, 0.16)'
                : safeAiScore >= 88
                ? 'rgba(37, 99, 235, 0.14)'
                : 'rgba(100, 116, 139, 0.12)'
            }
            stroke={safeAiScore >= 94 ? 'rgba(13, 148, 136, 0.35)' : 'rgba(37, 99, 235, 0.25)'}
            strokeDasharray="3 3"
          />
        )}

        {/* Viền đánh dấu vị trí đang được chọn */}
        {isSelected && (
          <rect
            x={-boxW / 2 - 5}
            y={-boxH / 2 - 5}
            width={boxW + 10}
            height={boxH + 10}
            rx={15}
            fill="none"
            stroke={isColliding ? '#ef4444' : isDark ? '#60a5fa' : '#2563eb'}
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        )}

        {/* Khung chính của Bàn / Phòng họp */}
        <rect
          x={-boxW / 2}
          y={-boxH / 2}
          width={boxW}
          height={boxH}
          rx={11}
          fill={palette.bg}
          stroke={palette.border}
          strokeWidth={isSelected || isBeingDragged ? 2.5 : 1.5}
        />

        {/* Mã bàn & Nhãn trạng thái */}
        <text
          x="0"
          y="-9"
          textAnchor="middle"
          fill={palette.text}
          fontSize="11.5"
          fontWeight="800"
        >
          {nodeItem.nodeCode} • {palette.badge}
        </text>

        {/* Đồng hồ đếm ngược 5 phút nếu ghế đang HOLDING, ngược lại hiện sức chứa & điểm AI */}
        <text
          x="0"
          y="8"
          textAnchor="middle"
          fill={palette.text}
          fontSize="9.5"
          fontWeight="700"
          opacity="0.9"
        >
          {nodeItem.status === 'HOLDING'
            ? `⏱ Nhả sau: ${formatCountdown(holdSecondsLeft)}`
            : `${nodeItem.capacityCount || 1} chỗ • AI ${safeAiScore}%`}
        </text>

        {/* Tọa độ thực tế (X, Y) */}
        <text
          x="0"
          y="22"
          textAnchor="middle"
          fill={palette.text}
          fontSize="8.5"
          opacity="0.7"
        >
          ({renderX}, {renderY})
        </text>
      </g>
    );
  }
);

export const InteractiveMap2D: React.FC<InteractiveMap2DProps> = ({
  workspaceNodes,
  selectedNodeId,
  isDark,
  isAdminDragMode,
  activeFloor,
  onSelectWorkspaceNode,
  onCommitNodeCoordinates,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [zoomScale, setZoomScale] = useState<number>(1);
  const [showAiHeatmap, setShowAiHeatmap] = useState<boolean>(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [liveDragPosition, setLiveDragPosition] = useState<{ posX: number; posY: number } | null>(
    null
  );
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number>(285); // 04:45 dem nguoc

  // Bo dem nguoc thoi gian giu cho 5 phut (300s) tren ban do 2D
  useEffect(() => {
    const timer = setInterval(() => {
      setHoldSecondsLeft((prev) => (prev > 1 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Kiem tra va cham (Bounding Box Collision) de ngan Admin keo 2 ban de len nhau
  const checkCoordinateCollision = useCallback(
    (movingNodeId: string, candidateX: number, candidateY: number): boolean => {
      return workspaceNodes.some((other) => {
        if (other.nodeId === movingNodeId || other.floorLevel !== activeFloor) return false;
        const otherX = Number.isFinite(other.position2D?.posX) ? other.position2D.posX : 0;
        const otherY = Number.isFinite(other.position2D?.posY) ? other.position2D.posY : 0;
        const minDistanceX = 95;
        const minDistanceY = 65;
        return (
          Math.abs(candidateX - otherX) < minDistanceX &&
          Math.abs(candidateY - otherY) < minDistanceY
        );
      });
    },
    [workspaceNodes, activeFloor]
  );

  const convertClientToSvgCoords = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 100, y: 100 };
    const rect = svgRef.current.getBoundingClientRect();
    const safeWidth = rect.width > 0 ? rect.width : 720;
    const safeHeight = rect.height > 0 ? rect.height : 420;
    const rawX = (clientX - rect.left) * (720 / safeWidth);
    const rawY = (clientY - rect.top) * (420 / safeHeight);
    const snappedX = Math.max(60, Math.min(660, Math.round(rawX / 10) * 10));
    const snappedY = Math.max(70, Math.min(365, Math.round(rawY / 10) * 10));
    return { x: snappedX, y: snappedY };
  };

  const handlePointerDownNode = useCallback(
    (e: React.PointerEvent<SVGGElement>, nodeItem: WorkspaceNodeItem) => {
      e.stopPropagation();
      setCollisionWarning(null);
      onSelectWorkspaceNode(nodeItem);
      if (!isAdminDragMode) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Bo qua neu trinh duyet khong ho tro pointer capture
      }
      setDraggingNodeId(nodeItem.nodeId);
      setLiveDragPosition({
        posX: Number.isFinite(nodeItem.position2D?.posX) ? nodeItem.position2D.posX : 120,
        posY: Number.isFinite(nodeItem.position2D?.posY) ? nodeItem.position2D.posY : 120,
      });
    },
    [isAdminDragMode, onSelectWorkspaceNode]
  );

  // Su dung requestAnimationFrame de dam bao keo tha muot 60 FPS khong gay giat lag
  const handlePointerMoveSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isAdminDragMode || !draggingNodeId) return;
    const { clientX, clientY } = e;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const { x, y } = convertClientToSvgCoords(clientX, clientY);
      setLiveDragPosition({ posX: x, posY: y });
    });
  };

  const handlePointerUpSvg = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (!isAdminDragMode || !draggingNodeId || !liveDragPosition) return;

    const targetId = draggingNodeId;
    const finalX = liveDragPosition.posX;
    const finalY = liveDragPosition.posY;
    const hasCollision = checkCoordinateCollision(targetId, finalX, finalY);

    setDraggingNodeId(null);
    setLiveDragPosition(null);

    if (hasCollision) {
      setCollisionWarning(
        `Đã chặn thao tác: Vị trí (${finalX}, ${finalY}) bị chồng lấp với một bàn khác. Hệ thống đã tự động giữ lại tọa độ an toàn ban đầu.`
      );
      return;
    }

    setCollisionWarning(null);
    onCommitNodeCoordinates(targetId, finalX, finalY);
  };

  const isCurrentDragColliding =
    Boolean(draggingNodeId && liveDragPosition) &&
    checkCoordinateCollision(draggingNodeId!, liveDragPosition!.posX, liveDragPosition!.posY);

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
      }`}
    >
      {/* Thanh trang thai & Cong cu Dac biet tren So do 2D */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Mặt bằng Tầng {activeFloor} ({workspaceNodes.length} vị trí)
          </span>

          {/* Nut Bat/Tat Lop phu Ban do Nhiet AI */}
          <button
            type="button"
            onClick={() => setShowAiHeatmap(!showAiHeatmap)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition ${
              showAiHeatmap
                ? 'bg-teal-600 text-white border-teal-600'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            {showAiHeatmap ? 'Đang bật Nhiệt độ AI' : 'Bản đồ Nhiệt AI'}
          </button>

          {isAdminDragMode && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              <Move className="w-3.5 h-3.5" />
              Chế độ Kéo thả Chống va chạm (Snap 10px)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" /> Trống
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> Giữ 5p
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Đã đặt
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Đang ngồi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" /> Bảo trì
          </span>

          <div
            className={`flex items-center gap-1 pl-2 border-l ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.max(0.85, Number((z - 0.1).toFixed(2))))}
              className={`p-1.5 rounded-lg border ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(1)}
              className={`p-1.5 rounded-lg border ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="100%"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.min(1.25, Number((z + 0.1).toFixed(2))))}
              className={`p-1.5 rounded-lg border ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Canh bao tu dong neu Admin keo ban de len vi tri khac */}
      {collisionWarning && (
        <div
          className={`mb-3 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            isDark
              ? 'bg-rose-950/70 border-rose-500/40 text-rose-200'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            {collisionWarning}
          </span>
          <button onClick={() => setCollisionWarning(null)} className="font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Khung Canvas SVG Mat bang Kien truc 2D */}
      <div
        className={`w-full overflow-auto rounded-xl border ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
        }`}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 720 420"
          onPointerMove={handlePointerMoveSvg}
          onPointerUp={handlePointerUpSvg}
          onPointerLeave={handlePointerUpSvg}
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: 'center center',
            transition: draggingNodeId ? 'none' : 'transform 0.2s ease-out',
          }}
          className={`w-full h-auto min-h-[340px] select-none ${
            isAdminDragMode ? 'cursor-crosshair' : 'cursor-default'
          }`}
        >
          <defs>
            <pattern id="archGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke={isDark ? 'rgba(148, 163, 184, 0.07)' : 'rgba(100, 116, 139, 0.09)'}
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect width="720" height="420" fill="url(#archGrid)" />

          {/* Khung Tuong Bao Kien Truc & Phan Khu */}
          <rect
            x="20"
            y="20"
            width="680"
            height="380"
            rx="16"
            fill="none"
            stroke={isDark ? '#334155' : '#cbd5e1'}
            strokeWidth="2"
          />

          {/* Khu Phong hop ben phai */}
          <rect
            x="475"
            y="32"
            width="210"
            height="175"
            rx="12"
            fill={isDark ? 'rgba(30, 41, 59, 0.35)' : 'rgba(241, 245, 249, 0.7)'}
            stroke={isDark ? '#334155' : '#cbd5e1'}
            strokeDasharray="5 4"
          />
          <text
            x="490"
            y="52"
            fill={isDark ? '#94a3b8' : '#64748b'}
            fontSize="10"
            fontWeight="700"
          >
            KHU PHÒNG HỌP & HỘI THẢO
          </text>

          <text
            x="38"
            y="48"
            fill={isDark ? '#94a3b8' : '#64748b'}
            fontSize="10"
            fontWeight="700"
          >
            KHU BÀN CÁ NHÂN (DESK PODS) — TẦNG {activeFloor}
          </text>

          <line
            x1="35"
            y1="215"
            x2="685"
            y2="215"
            stroke={isDark ? '#1e293b' : '#e2e8f0'}
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <text
            x="38"
            y="236"
            fill={isDark ? '#94a3b8' : '#64748b'}
            fontSize="10"
            fontWeight="700"
          >
            KHU TẬP TRUNG (FOCUS BOOTH) & THẢO LUẬN NHÓM (COLLAB HUB)
          </text>

          {workspaceNodes.map((nodeItem) => {
            const isSelected = nodeItem.nodeId === selectedNodeId;
            const isBeingDragged = nodeItem.nodeId === draggingNodeId;
            const safeX = Number.isFinite(nodeItem.position2D?.posX)
              ? nodeItem.position2D.posX
              : 120;
            const safeY = Number.isFinite(nodeItem.position2D?.posY)
              ? nodeItem.position2D.posY
              : 120;

            const renderX =
              isBeingDragged && liveDragPosition ? liveDragPosition.posX : safeX;
            const renderY =
              isBeingDragged && liveDragPosition ? liveDragPosition.posY : safeY;

            return (
              <MemoizedSpotNode
                key={nodeItem.nodeId}
                nodeItem={nodeItem}
                renderX={renderX}
                renderY={renderY}
                isSelected={isSelected}
                isBeingDragged={isBeingDragged}
                isColliding={isBeingDragged && isCurrentDragColliding}
                isDark={isDark}
                isAdminDragMode={isAdminDragMode}
                showAiHeatmap={showAiHeatmap}
                holdSecondsLeft={holdSecondsLeft}
                onPointerDownNode={handlePointerDownNode}
              />
            );
          })}
        </svg>
      </div>

      {/* Thanh ghi chu nho phia duoi */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          Bảo vệ chống chồng lấp tọa độ (Anti-Collision Guard) đang hoạt động
        </span>
        <span>Hỗ trợ thao tác chạm trên iPad/Mobile & Chuột máy tính</span>
      </div>
    </div>
  );
};