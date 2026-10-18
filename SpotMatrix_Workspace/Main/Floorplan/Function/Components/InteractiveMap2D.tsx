import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import {
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Flame,
  AlertTriangle,
  Box,
  Layers,
  RotateCw,
  LayoutGrid,
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
  onAutoArrangeLayout?: () => void;
}

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

// ============================================================================
// COMPONENT VE NOI THAT 2.5D CHI TIET (BAN, GHE XOAY, MAN HINH, PHONG HOP 8 GHE)
// ============================================================================
const MemoizedFurnitureNode: React.FC<SpotNodeRenderProps> = memo(
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
    // Bang mau kien truc diu mat (Neutral Slate & Soft Accent)
    const resolveStatusColors = (status: WorkspaceNodeItem['status']) => {
      if (isColliding) {
        return {
          chairFill: '#dc2626',
          chairStroke: '#991b1b',
          tableTop: isDark ? '#450a0a' : '#fef2f2',
          tableEdge: '#ef4444',
          badgeBg: isDark ? '#7f1d1d' : '#fee2e2',
          badgeText: isDark ? '#fecaca' : '#991b1b',
          statusLabel: 'Trùng chỗ!',
          ledColor: '#ef4444',
        };
      }
      switch (status) {
        case 'AVAILABLE':
          return {
            chairFill: isDark ? '#0d9488' : '#14b8a6',
            chairStroke: isDark ? '#5eead4' : '#0f766e',
            tableTop: isDark ? '#1e293b' : '#ffffff',
            tableEdge: isDark ? '#0d9488' : '#99f6e4',
            badgeBg: isDark ? '#064e3b' : '#f0fdfa',
            badgeText: isDark ? '#a7f3d0' : '#115e59',
            statusLabel: 'Trống',
            ledColor: '#10b981',
          };
        case 'HOLDING':
          return {
            chairFill: isDark ? '#d97706' : '#f59e0b',
            chairStroke: isDark ? '#fcd34d' : '#b45309',
            tableTop: isDark ? '#1e293b' : '#fffbeb',
            tableEdge: isDark ? '#d97706' : '#fde68a',
            badgeBg: isDark ? '#78350f' : '#fef3c7',
            badgeText: isDark ? '#fde68a' : '#92400e',
            statusLabel: 'Giữ 5p',
            ledColor: '#f59e0b',
          };
        case 'RESERVED':
          return {
            chairFill: isDark ? '#2563eb' : '#3b82f6',
            chairStroke: isDark ? '#93c5fd' : '#1d4ed8',
            tableTop: isDark ? '#1e293b' : '#f8fafc',
            tableEdge: isDark ? '#3b82f6' : '#bfdbfe',
            badgeBg: isDark ? '#1e3a8a' : '#eff6ff',
            badgeText: isDark ? '#bfdbfe' : '#1e40af',
            statusLabel: 'Đã đặt',
            ledColor: '#3b82f6',
          };
        case 'OCCUPIED':
          return {
            chairFill: isDark ? '#be123c' : '#e11d48',
            chairStroke: isDark ? '#fda4af' : '#9f1239',
            tableTop: isDark ? '#1e293b' : '#fff1f2',
            tableEdge: isDark ? '#f43f5e' : '#fecdd3',
            badgeBg: isDark ? '#881337' : '#ffe4e6',
            badgeText: isDark ? '#fecdd3' : '#9f1239',
            statusLabel: 'Đang ngồi',
            ledColor: '#f43f5e',
          };
        default:
          return {
            chairFill: '#64748b',
            chairStroke: '#475569',
            tableTop: isDark ? '#0f172a' : '#f1f5f9',
            tableEdge: '#64748b',
            badgeBg: isDark ? '#334155' : '#e2e8f0',
            badgeText: isDark ? '#cbd5e1' : '#475569',
            statusLabel: 'Bảo trì',
            ledColor: '#94a3b8',
          };
      }
    };

    const colors = resolveStatusColors(nodeItem.status);
    const safeAiScore = Number.isFinite(nodeItem.aiScore) ? Number(nodeItem.aiScore) : 90;

    const formatCountdown = (totalSec: number) => {
      const m = Math.floor(totalSec / 60)
        .toString()
        .padStart(2, '0');
      const s = (totalSec % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    // Ham ve 1 chiec ghe van phong 2.5D (co dem ngoi + tua lung cong)
    const renderChair25D = (
      cx: number,
      cy: number,
      rotationDeg = 0,
      key?: string | number
    ) => (
      <g key={key} transform={`translate(${cx}, ${cy}) rotate(${rotationDeg})`}>
        {/* Bong do 2.5D cua ghe */}
        <rect
          x="-9"
          y="-6"
          width="18"
          height="14"
          rx="5"
          fill="rgba(15, 23, 42, 0.16)"
        />
        {/* Tay vin 2 ben */}
        <rect
          x="-11"
          y="-5"
          width="22"
          height="8"
          rx="2"
          fill={colors.chairStroke}
          opacity="0.7"
        />
        {/* Dem ngoi */}
        <rect
          x="-8"
          y="-7"
          width="16"
          height="12"
          rx="4"
          fill={colors.chairFill}
          stroke={colors.chairStroke}
          strokeWidth="1"
        />
        {/* Tua lung cong phia sau */}
        <rect
          x="-9"
          y="3"
          width="18"
          height="4.5"
          rx="2.2"
          fill={colors.chairStroke}
        />
      </g>
    );

    return (
      <g
        transform={`translate(${renderX}, ${renderY})`}
        onPointerDown={(e) => onPointerDownNode(e, nodeItem)}
        style={{ willChange: isBeingDragged ? 'transform' : 'auto' }}
        className={isAdminDragMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
      >
        {/* Lop phu Ban do Nhiet AI */}
        {showAiHeatmap && (
          <circle
            cx="0"
            cy="0"
            r={nodeItem.zoneType === 'MEETING_ROOM' ? 88 : 58}
            fill={
              safeAiScore >= 94
                ? 'rgba(13, 148, 136, 0.14)'
                : 'rgba(100, 116, 139, 0.12)'
            }
            stroke={safeAiScore >= 94 ? 'rgba(13, 148, 136, 0.35)' : 'rgba(100, 116, 139, 0.25)'}
            strokeDasharray="4 3"
          />
        )}

        {/* =================================================================
            KIEU 1: PHONG HOP (MEETING_ROOM) — BAN HOP DAI + 8 GHE QUANH BAN + TV
           ================================================================= */}
        {nodeItem.zoneType === 'MEETING_ROOM' && (
          <g>
            {/* Thảm lót sàn phòng họp */}
            <rect
              x="-82"
              y="-54"
              width="164"
              height="108"
              rx="12"
              fill={isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)'}
              stroke={isSelected ? '#3b82f6' : isDark ? '#334155' : '#cbd5e1'}
              strokeWidth={isSelected ? 2.5 : 1.5}
            />
            {/* Man hinh TV 85 inch gan tren vach trai */}
            <rect
              x="-78"
              y="-22"
              width="5"
              height="44"
              rx="2"
              fill={isDark ? '#38bdf8' : '#0284c7'}
            />
            {/* 3 Ghe phia tren (xoay 180 do huong xuong ban) */}
            {[-34, 0, 34].map((gx, i) => renderChair25D(gx, -34, 180, `top-${i}`))}
            {/* 3 Ghe phia duoi (huong len ban) */}
            {[-34, 0, 34].map((gx, i) => renderChair25D(gx, 34, 0, `bot-${i}`))}
            {/* 1 Ghe Chu toa ben trai & 1 Ghe ben phai */}
            {renderChair25D(-60, 0, 90, 'left-head')}
            {renderChair25D(60, 0, -90, 'right-head')}

            {/* Độ dày cạnh bàn 2.5D (Extruded Shadow) */}
            <rect
              x="-48"
              y="-17"
              width="96"
              height="40"
              rx="10"
              fill={isDark ? '#0f172a' : '#cbd5e1'}
            />
            {/* Mặt bàn họp chính */}
            <rect
              x="-48"
              y="-21"
              width="96"
              height="38"
              rx="10"
              fill={colors.tableTop}
              stroke={colors.tableEdge}
              strokeWidth="2"
            />
            {/* Thiết bị Hội nghị AI 360 giữa bàn */}
            <rect
              x="-16"
              y="-6"
              width="32"
              height="8"
              rx="4"
              fill={isDark ? '#334155' : '#e2e8f0'}
            />
            <circle cx="0" cy="-2" r="2.5" fill={colors.ledColor} />
          </g>
        )}

        {/* =================================================================
            KIEU 2: KHU THAO LUAN NHOM (COLLAB_HUB) — BAN OVAL + 6 GHE XOAY QUANH
           ================================================================= */}
        {nodeItem.zoneType === 'COLLAB_HUB' && (
          <g>
            {/* Thảm tròn khu sáng tạo */}
            <rect
              x="-68"
              y="-48"
              width="136"
              height="96"
              rx="20"
              fill={isDark ? 'rgba(30, 41, 59, 0.55)' : 'rgba(241, 245, 249, 0.85)'}
              stroke={isSelected ? '#3b82f6' : isDark ? '#334155' : '#cbd5e1'}
              strokeWidth={isSelected ? 2.5 : 1.2}
              strokeDasharray="5 3"
            />
            {/* 6 ghế xung quanh bàn thảo luận */}
            {renderChair25D(-24, -30, 180, 'c1')}
            {renderChair25D(24, -30, 180, 'c2')}
            {renderChair25D(-24, 30, 0, 'c3')}
            {renderChair25D(24, 30, 0, 'c4')}
            {renderChair25D(-50, 0, 90, 'c5')}
            {renderChair25D(50, 0, -90, 'c6')}

            {/* Độ dày mặt bàn 2.5D */}
            <rect
              x="-38"
              y="-15"
              width="76"
              height="36"
              rx="16"
              fill={isDark ? '#0f172a' : '#cbd5e1'}
            />
            {/* Mặt bàn Oval */}
            <rect
              x="-38"
              y="-19"
              width="76"
              height="34"
              rx="16"
              fill={colors.tableTop}
              stroke={colors.tableEdge}
              strokeWidth="2"
            />
            <circle cx="-12" cy="-2" r="3" fill={colors.ledColor} />
            <rect
              x="-2"
              y="-5"
              width="18"
              height="6"
              rx="2"
              fill={isDark ? '#334155' : '#cbd5e1'}
            />
          </g>
        )}

        {/* =================================================================
            KIEU 3: BOT CACH AM (FOCUS_BOOTH) — BUONG KIN CACH AM + CUA KINH
           ================================================================= */}
        {nodeItem.zoneType === 'FOCUS_BOOTH' && (
          <g>
            {/* Vách buồng cách âm 2 lớp */}
            <rect
              x="-44"
              y="-38"
              width="88"
              height="76"
              rx="10"
              fill={isDark ? '#0f172a' : '#e2e8f0'}
              stroke={isSelected ? '#3b82f6' : isDark ? '#475569' : '#94a3b8'}
              strokeWidth={isSelected ? 2.5 : 2}
            />
            <rect
              x="-38"
              y="-32"
              width="76"
              height="64"
              rx="7"
              fill={isDark ? '#1e293b' : '#f8fafc'}
            />
            {/* Cung mở cửa kính */}
            <path
              d="M 14 32 A 22 22 0 0 1 36 10"
              fill="none"
              stroke={isDark ? '#64748b' : '#94a3b8'}
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
            {/* Ghế đơn bên trong bốt */}
            {renderChair25D(0, 14, 0)}
            {/* Bàn âm tường & Màn hình */}
            <rect
              x="-28"
              y="-26"
              width="56"
              height="22"
              rx="4"
              fill={colors.tableTop}
              stroke={colors.tableEdge}
              strokeWidth="1.5"
            />
            <rect
              x="-14"
              y="-22"
              width="28"
              height="4"
              rx="1.5"
              fill={isDark ? '#94a3b8' : '#475569'}
            />
            <circle cx="20" cy="-15" r="2.5" fill={colors.ledColor} />
          </g>
        )}

        {/* =================================================================
            KIEU 4: BAN CA NHAN (DESK_POD) — BAN 2.5D + MAN HINH KEP + GHE XOAY
           ================================================================= */}
        {nodeItem.zoneType === 'DESK_POD' && (
          <g>
            {/* Khung viền chọn */}
            {isSelected && (
              <rect
                x="-46"
                y="-34"
                width="92"
                height="74"
                rx="12"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}

            {/* Ghế công thái học đặt phía dưới bàn */}
            {renderChair25D(0, 21, 0)}

            {/* Cạnh bàn 2.5D đổ bóng */}
            <rect
              x="-38"
              y="-22"
              width="76"
              height="34"
              rx="7"
              fill={isDark ? '#0f172a' : '#cbd5e1'}
            />
            {/* Mặt bàn làm việc */}
            <rect
              x="-38"
              y="-26"
              width="76"
              height="32"
              rx="7"
              fill={colors.tableTop}
              stroke={colors.tableEdge}
              strokeWidth="2"
            />

            {/* Cặp màn hình kép 4K (Dual Monitors) nghiêng nhẹ */}
            <rect
              x="-26"
              y="-21"
              width="22"
              height="4"
              rx="1.5"
              transform="rotate(-6 -15 -19)"
              fill={isDark ? '#94a3b8' : '#334155'}
            />
            <rect
              x="4"
              y="-21"
              width="22"
              height="4"
              rx="1.5"
              transform="rotate(6 15 -19)"
              fill={isDark ? '#94a3b8' : '#334155'}
            />

            {/* Bàn phím & Chuột trên mặt bàn */}
            <rect
              x="-10"
              y="-9"
              width="18"
              height="7"
              rx="1.5"
              fill={isDark ? '#334155' : '#e2e8f0'}
            />
            <rect
              x="12"
              y="-8"
              width="4"
              height="6"
              rx="2"
              fill={isDark ? '#475569' : '#cbd5e1'}
            />

            {/* Đèn LED báo trạng thái góc bàn */}
            <circle cx="-29" cy="-9" r="3" fill={colors.ledColor} />
          </g>
        )}

        {/* =================================================================
            NHAN THONG TIN NHO GON DAT NGAY TREN / DUOI NOI THAT (KHONG CHE HINH)
           ================================================================= */}
        <g
          transform={`translate(0, ${
            nodeItem.zoneType === 'MEETING_ROOM'
              ? 0
              : nodeItem.zoneType === 'COLLAB_HUB'
              ? 0
              : -8
          })`}
        >
          <rect
            x="-40"
            y="-9"
            width="80"
            height="18"
            rx="5"
            fill={colors.badgeBg}
            stroke={colors.tableEdge}
            strokeWidth="1"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill={colors.badgeText}
            fontSize="9.5"
            fontWeight="800"
          >
            {nodeItem.status === 'HOLDING'
              ? `${nodeItem.nodeCode} • ${formatCountdown(holdSecondsLeft)}`
              : `${nodeItem.nodeCode} • ${colors.statusLabel}`}
          </text>
        </g>
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
  onAutoArrangeLayout,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Cho phep chuyen doi giua Mat bang Kien truc 2.5D va Phoi canh Khong gian 3D Isometric
  const [perspectiveMode, setPerspectiveMode] = useState<'2.5D_TOP' | '3D_ISO'>('2.5D_TOP');
  const [isoRotationDeg, setIsoRotationDeg] = useState<number>(-18);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [showAiHeatmap, setShowAiHeatmap] = useState<boolean>(false);

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [liveDragPosition, setLiveDragPosition] = useState<{ posX: number; posY: number } | null>(
    null
  );
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number>(275);

  useEffect(() => {
    const timer = setInterval(() => {
      setHoldSecondsLeft((prev) => (prev > 1 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkCoordinateCollision = useCallback(
    (movingNodeId: string, candidateX: number, candidateY: number): boolean => {
      return workspaceNodes.some((other) => {
        if (other.nodeId === movingNodeId || other.floorLevel !== activeFloor) return false;
        const otherX = Number.isFinite(other.position2D?.posX) ? other.position2D.posX : 0;
        const otherY = Number.isFinite(other.position2D?.posY) ? other.position2D.posY : 0;
        return Math.abs(candidateX - otherX) < 95 && Math.abs(candidateY - otherY) < 75;
      });
    },
    [workspaceNodes, activeFloor]
  );

  const convertClientToSvgCoords = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 120, y: 120 };
    const rect = svgRef.current.getBoundingClientRect();
    const safeWidth = rect.width > 0 ? rect.width : 800;
    const safeHeight = rect.height > 0 ? rect.height : 460;
    const rawX = (clientX - rect.left) * (800 / safeWidth);
    const rawY = (clientY - rect.top) * (460 / safeHeight);
    const snappedX = Math.max(70, Math.min(730, Math.round(rawX / 10) * 10));
    const snappedY = Math.max(80, Math.min(395, Math.round(rawY / 10) * 10));
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
        // Bo qua
      }
      setDraggingNodeId(nodeItem.nodeId);
      setLiveDragPosition({
        posX: Number.isFinite(nodeItem.position2D?.posX) ? nodeItem.position2D.posX : 120,
        posY: Number.isFinite(nodeItem.position2D?.posY) ? nodeItem.position2D.posY : 120,
      });
    },
    [isAdminDragMode, onSelectWorkspaceNode]
  );

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
        `Chặn va chạm nội thất: Vị trí (${finalX}, ${finalY}) chồng lên bàn/phòng khác. Hệ thống đã giữ lại tọa độ cũ.`
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
      {/* THANH DIEU KHIEN CHE DO XEM 2.5D / 3D ISOMETRIC & SAP XEP PHONG */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Chuyen doi 2.5D Top-down vs 3D Isometric */}
          <div
            className={`inline-flex rounded-xl p-1 border text-xs ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setPerspectiveMode('2.5D_TOP')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                perspectiveMode === '2.5D_TOP'
                  ? isDark
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Mặt bằng Nội thất 2.5D
            </button>
            <button
              type="button"
              onClick={() => setPerspectiveMode('3D_ISO')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                perspectiveMode === '3D_ISO'
                  ? isDark
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              Phối cảnh Phòng 3D
            </button>
          </div>

          {perspectiveMode === '3D_ISO' && (
            <button
              type="button"
              onClick={() => setIsoRotationDeg((prev) => (prev === -18 ? 18 : prev === 18 ? 0 : -18))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              Đổi góc nghiêng 3D ({isoRotationDeg}°)
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAiHeatmap(!showAiHeatmap)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              showAiHeatmap
                ? isDark
                  ? 'bg-slate-200 text-slate-900 border-slate-200'
                  : 'bg-slate-900 text-white border-slate-900'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Nhiệt độ AI
          </button>

          {onAutoArrangeLayout && (
            <button
              type="button"
              onClick={onAutoArrangeLayout}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70'
              }`}
              title="Căn chỉnh lại vị trí bàn và phòng họp chuẩn kiến trúc, không đè lên vách ngăn"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Sắp xếp Chuẩn Kiến trúc
            </button>
          )}
        </div>

        {/* Chu thich mau trang thai diu mat */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Trống
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Giữ 5p
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Đã đặt
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Đang ngồi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> Bảo trì
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
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

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

      {/* =====================================================================
          KHUNG KHONG GIAN KIEN TRUC (HO TRO NGHIENG 3D ISOMETRIC MUOT MA)
         ===================================================================== */}
      <div
        className={`w-full overflow-hidden rounded-2xl border p-2 sm:p-4 transition-all duration-500 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100/70 border-slate-200/80'
        }`}
        style={{
          perspective: perspectiveMode === '3D_ISO' ? '1200px' : 'none',
        }}
      >
        <div
          className="transition-transform duration-500 ease-out"
          style={{
            transform:
              perspectiveMode === '3D_ISO'
                ? `scale(${zoomScale * 0.94}) rotateX(42deg) rotateZ(${isoRotationDeg}deg)`
                : `scale(${zoomScale})`,
            transformStyle: 'preserve-3d',
            boxShadow:
              perspectiveMode === '3D_ISO'
                ? isDark
                  ? '0 28px 50px -12px rgba(0, 0, 0, 0.7), 0 12px 0 0 #1e293b'
                  : '0 28px 50px -12px rgba(15, 23, 42, 0.18), 0 12px 0 0 #cbd5e1'
                : 'none',
            borderRadius: '16px',
          }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 800 460"
            onPointerMove={handlePointerMoveSvg}
            onPointerUp={handlePointerUpSvg}
            onPointerLeave={handlePointerUpSvg}
            className={`w-full h-auto min-h-[360px] rounded-xl select-none ${
              isDark ? 'bg-slate-900' : 'bg-white'
            } ${isAdminDragMode ? 'cursor-crosshair' : 'cursor-default'}`}
          >
            <defs>
              <pattern id="floorTileGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke={isDark ? 'rgba(148, 163, 184, 0.06)' : 'rgba(100, 116, 139, 0.08)'}
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            {/* Nen Gach San Kien Truc */}
            <rect width="800" height="460" fill="url(#floorTileGrid)" />

            {/* TUONG BAO NGOAI VAN PHONG (Co do day kien truc) */}
            <rect
              x="16"
              y="16"
              width="768"
              height="428"
              rx="18"
              fill="none"
              stroke={isDark ? '#334155' : '#cbd5e1'}
              strokeWidth="4"
            />

            {/* ===============================================================
                PHAN KHU 1 (GOC TREN BEN TRAI): KHU BAN LAM VIEC CA NHAN (OPEN DESK ZONE)
               =============================================================== */}
            <rect
              x="28"
              y="28"
              width="445"
              height="185"
              rx="12"
              fill={isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(248, 250, 252, 0.9)'}
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              strokeWidth="1.5"
            />
            <rect
              x="40"
              y="36"
              width="215"
              height="20"
              rx="5"
              fill={isDark ? '#1e293b' : '#f1f5f9'}
            />
            <text
              x="50"
              y="49"
              fill={isDark ? '#94a3b8' : '#475569'}
              fontSize="9.5"
              fontWeight="800"
            >
              ZONE A • KHU BÀN CÁ NHÂN (DESK PODS)
            </text>

            {/* ===============================================================
                PHAN KHU 2 (GOC TREN BEN PHAI): PHONG HOP KINH BOARDROOM (CO VACH KINH & CUA)
               =============================================================== */}
            <rect
              x="488"
              y="28"
              width="282"
              height="215"
              rx="14"
              fill={isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(241, 245, 249, 0.65)'}
              stroke={isDark ? '#475569' : '#94a3b8'}
              strokeWidth="2.5"
            />
            {/* Ký hiệu cửa kính trượt vào phòng họp */}
            <line
              x1="488"
              y1="175"
              x2="488"
              y2="215"
              stroke={isDark ? '#0f172a' : '#ffffff'}
              strokeWidth="4"
            />
            <path
              d="M 488 175 A 32 32 0 0 0 456 207"
              fill="none"
              stroke={isDark ? '#64748b' : '#94a3b8'}
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <rect
              x="502"
              y="36"
              width="225"
              height="20"
              rx="5"
              fill={isDark ? '#1e293b' : '#e2e8f0'}
            />
            <text
              x="512"
              y="49"
              fill={isDark ? '#cbd5e1' : '#334155'}
              fontSize="9.5"
              fontWeight="800"
            >
              ZONE M • PHÒNG HỌP KÍNH (BOARDROOM 8P)
            </text>

            {/* ===============================================================
                HANH LANG DI CHUYEN CHINH GIUA SAN (MAIN CORRIDOR)
               =============================================================== */}
            <text
              x="245"
              y="232"
              textAnchor="middle"
              fill={isDark ? '#475569' : '#94a3b8'}
              fontSize="9"
              fontWeight="700"
              letterSpacing="2"
            >
              ─── HÀNH LANG DI CHUYỂN TRUNG TÂM ───
            </text>

            {/* ===============================================================
                PHAN KHU 3 (GOC DUOI BEN TRAI): KHU BOT CACH AM (FOCUS BOOTH ZONE)
               =============================================================== */}
            <rect
              x="28"
              y="248"
              width="215"
              height="182"
              rx="12"
              fill={isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(248, 250, 252, 0.9)'}
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              strokeWidth="1.5"
            />
            <rect
              x="40"
              y="256"
              width="190"
              height="20"
              rx="5"
              fill={isDark ? '#1e293b' : '#f1f5f9'}
            />
            <text
              x="48"
              y="269"
              fill={isDark ? '#94a3b8' : '#475569'}
              fontSize="9.5"
              fontWeight="800"
            >
              ZONE F • BỐT YÊN TĨNH (FOCUS)
            </text>

            {/* ===============================================================
                PHAN KHU 4 (GOC DUOI GIUA): KHU THAO LUAN NHOM (COLLABORATION HUB)
               =============================================================== */}
            <rect
              x="256"
              y="248"
              width="335"
              height="182"
              rx="12"
              fill={isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(248, 250, 252, 0.9)'}
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              strokeWidth="1.5"
            />
            <rect
              x="268"
              y="256"
              width="225"
              height="20"
              rx="5"
              fill={isDark ? '#1e293b' : '#f1f5f9'}
            />
            <text
              x="278"
              y="269"
              fill={isDark ? '#94a3b8' : '#475569'}
              fontSize="9.5"
              fontWeight="800"
            >
              ZONE C • KHU THẢO LUẬN (COLLAB HUB 6P)
            </text>

            {/* ===============================================================
                PHAN KHU 5 (GOC DUOI BEN PHAI): SANH VAO, QUAY CHECK-IN QR & PANTRY
               =============================================================== */}
            <rect
              x="604"
              y="258"
              width="166"
              height="172"
              rx="12"
              fill={isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.6)'}
              stroke={isDark ? '#334155' : '#cbd5e1'}
              strokeDasharray="4 4"
            />
            <text
              x="687"
              y="282"
              textAnchor="middle"
              fill={isDark ? '#94a3b8' : '#64748b'}
              fontSize="9.5"
              fontWeight="800"
            >
              SẢNH & QUẦY QR CHECK-IN
            </text>
            {/* Quầy Lễ tân / Kiosk Quét QR */}
            <rect
              x="637"
              y="305"
              width="100"
              height="34"
              rx="8"
              fill={isDark ? '#1e293b' : '#e2e8f0'}
              stroke={isDark ? '#475569' : '#94a3b8'}
            />
            <text
              x="687"
              y="325"
              textAnchor="middle"
              fill={isDark ? '#cbd5e1' : '#475569'}
              fontSize="9"
              fontWeight="700"
            >
              KIOSK QUÉT MÃ QR
            </text>
            {/* Cửa chính ra vào */}
            <text
              x="687"
              y="412"
              textAnchor="middle"
              fill={isDark ? '#64748b' : '#94a3b8'}
              fontSize="9"
              fontWeight="700"
            >
              ▲ LỐI VÀO THANG MÁY
            </text>

            {/* ===============================================================
                VE TUNG VI TRI BAN / PHONG HOP 2.5D LEN MAT BANG
               =============================================================== */}
            {workspaceNodes.map((nodeItem) => {
              const isSelected = nodeItem.nodeId === selectedNodeId;
              const isBeingDragged = nodeItem.nodeId === draggingNodeId;
              const safeX = Number.isFinite(nodeItem.position2D?.posX)
                ? nodeItem.position2D.posX
                : 120;
              const safeY = Number.isFinite(nodeItem.position2D?.posY)
                ? nodeItem.position2D.posY
                : 130;

              const renderX =
                isBeingDragged && liveDragPosition ? liveDragPosition.posX : safeX;
              const renderY =
                isBeingDragged && liveDragPosition ? liveDragPosition.posY : safeY;

              return (
                <MemoizedFurnitureNode
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
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>
          Mô hình nội thất 2.5D hiển thị số lượng ghế thực tế quanh từng bàn và màn hình làm việc
        </span>
        <span>
          Bấm nút &ldquo;Sắp xếp Chuẩn Kiến trúc&rdquo; nếu muốn căn chỉnh các bàn vào đúng tâm từng phân khu
        </span>
      </div>
    </div>
  );
};