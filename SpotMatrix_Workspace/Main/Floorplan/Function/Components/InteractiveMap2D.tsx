import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Layers } from 'lucide-react';
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

const AMPHITHEATER_2D_SEATS = [
  ...[200, 224, 248, 270, 292, 316, 340].map((ang, i) => ({
    code: `A${i + 1}`,
    ang,
    r: 86,
  })),
  ...[190, 210, 230, 250, 270, 290, 310, 330, 350].map((ang, i) => ({
    code: `B${i + 1}`,
    ang,
    r: 130,
  })),
  ...[182, 198, 214, 230, 246, 262, 278, 294, 310, 326, 342, 358].map((ang, i) => ({
    code: `C${i + 1}`,
    ang,
    r: 174,
  })),
];

export const InteractiveMap2D: React.FC<InteractiveMap2DProps> = ({
  workspaceNodes,
  selectedNodeId,
  isDark,
  activeFloor,
  onSelectWorkspaceNode,
}) => {
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [selectedHallSeat, setSelectedHallSeat] = useState<string>('A1');

  const resolveColors = (status: WorkspaceNodeItem['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return { fill: '#0d9488', bg: isDark ? '#064e3b' : '#f0fdfa', label: 'Còn trống' };
      case 'HOLDING':
        return { fill: '#d97706', bg: isDark ? '#78350f' : '#fffbeb', label: 'Giữ 5p' };
      case 'RESERVED':
        return { fill: '#4f46e5', bg: isDark ? '#1e1b4b' : '#eef2ff', label: 'Đã đặt' };
      case 'OCCUPIED':
        return { fill: '#e11d48', bg: isDark ? '#881337' : '#fff1f2', label: 'Đang họp' };
      default:
        return { fill: '#64748b', bg: isDark ? '#334155' : '#f1f5f9', label: 'Bảo trì' };
    }
  };

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-teal-600 text-white">
            <Layers className="w-3.5 h-3.5" />
            {activeFloor === 5
              ? 'Bản vẽ Mặt bằng 2D — Tầng 5 (Hội trường Đấu trường La Mã)'
              : `Bản vẽ Mặt bằng 2D — Tầng ${activeFloor} (6 Phòng họp Chính thức)`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomScale((z) => Math.max(0.85, Number((z - 0.1).toFixed(2))))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomScale(1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomScale((z) => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        className={`w-full overflow-hidden rounded-xl border ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
        }`}
      >
        <svg
          viewBox="0 0 800 460"
          style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
          className="w-full h-auto min-h-[380px] select-none transition-transform duration-200"
        >
          <defs>
            <pattern id="archGrid2D" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke={isDark ? 'rgba(148,163,184,0.06)' : 'rgba(100,116,139,0.08)'}
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="800" height="460" fill="url(#archGrid2D)" />

          {/* Khung Tuong Bao Chinh */}
          <rect
            x="20"
            y="16"
            width="760"
            height="428"
            rx="14"
            fill={isDark ? '#0f172a' : '#ffffff'}
            stroke={isDark ? '#475569' : '#94a3b8'}
            strokeWidth="4"
          />

          {/* =================================================================
              NEU LA TANG 5: VE SO DO MAT BANG 2D HOI TRUONG DAU TRUONG LA MA
             ================================================================= */}
          {activeFloor === 5 ? (
            <g
              onClick={() => {
                if (workspaceNodes[0]) onSelectWorkspaceNode(workspaceNodes[0]);
              }}
              className="cursor-pointer"
            >
              {/* Vach Tieu am Hoi truong */}
              <rect
                x="45"
                y="32"
                width="710"
                height="396"
                rx="22"
                fill={isDark ? '#1e293b' : '#f8fafc'}
                stroke="#4f46e5"
                strokeWidth="2.5"
              />
              <text
                x="400"
                y="56"
                textAnchor="middle"
                fill={isDark ? '#e2e8f0' : '#1e293b'}
                fontSize="12"
                fontWeight="800"
              >
                MẶT BẰNG 2D HỘI TRƯỜNG ĐẤU TRƯỜNG LA MÃ (TẦNG 5 — 30 CHỖ)
              </text>

              {/* 3 Vong Cung Bac thang Dong Tam */}
              {[86, 130, 174].map((r) => (
                <path
                  key={r}
                  d={`M ${400 - r} 310 A ${r} ${r} 0 0 1 ${400 + r} 310`}
                  fill="none"
                  stroke={isDark ? '#334155' : '#e2e8f0'}
                  strokeWidth="26"
                  strokeLinecap="round"
                />
              ))}

              {/* San khau Tron Trung tam (Tâm Diễn Giả) */}
              <circle
                cx="400"
                cy="315"
                r="46"
                fill={isDark ? '#312e81' : '#eef2ff'}
                stroke="#4f46e5"
                strokeWidth="3"
              />
              <text
                x="400"
                y="312"
                textAnchor="middle"
                fill={isDark ? '#ffffff' : '#312e81'}
                fontSize="10"
                fontWeight="800"
              >
                SÂN KHẤU TRÒN
              </text>
              <text
                x="400"
                y="326"
                textAnchor="middle"
                fill="#10b981"
                fontSize="8.5"
                fontWeight="700"
              >
                SPEAKER 360°
              </text>

              {/* Man hinh Cong Panorama */}
              <path
                d="M 275 385 Q 400 415 525 385"
                fill="none"
                stroke="#0d9488"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <text
                x="400"
                y="418"
                textAnchor="middle"
                fill={isDark ? '#94a3b8' : '#64748b'}
                fontSize="9.5"
                fontWeight="700"
              >
                MÀN HÌNH LED CONG PANORAMA 360°
              </text>

              {/* Cac Ghe Ngoi Vong Cung */}
              {AMPHITHEATER_2D_SEATS.map((seat, idx) => {
                const rad = (seat.ang * Math.PI) / 180;
                const cx = Math.round(400 + Math.cos(rad) * seat.r);
                const cy = Math.round(310 + Math.sin(rad) * seat.r);
                const isBooked = idx === 3 || idx === 11;
                const isSelected = selectedHallSeat === seat.code;

                return (
                  <g
                    key={seat.code}
                    transform={`translate(${cx}, ${cy})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHallSeat(seat.code);
                      if (workspaceNodes[0]) onSelectWorkspaceNode(workspaceNodes[0]);
                    }}
                  >
                    <circle
                      r={isSelected ? 13 : 11}
                      fill={isBooked ? '#4f46e5' : '#0d9488'}
                      stroke={isSelected ? '#ffffff' : 'none'}
                      strokeWidth="2"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="800"
                    >
                      {seat.code}
                    </text>
                  </g>
                );
              })}
            </g>
          ) : (
            /* =================================================================
               TANG 1, 2, 3, 4: 6 PHONG HOP CHINH THUC CO VACH NGAN, CUA & HANH LANG
               ================================================================= */
            <g>
              {/* HANH LANG TRUNG TAM CHIA 2 DAY PHONG HOP */}
              <rect
                x="24"
                y="196"
                width="752"
                height="68"
                fill={isDark ? '#1e293b' : '#f1f5f9'}
              />
              <line
                x1="30"
                y1="230"
                x2="770"
                y2="230"
                stroke={isDark ? '#475569' : '#cbd5e1'}
                strokeWidth="1.5"
                strokeDasharray="8 6"
              />
              <text
                x="400"
                y="234"
                textAnchor="middle"
                fill={isDark ? '#94a3b8' : '#64748b'}
                fontSize="10"
                fontWeight="800"
                letterSpacing="2"
              >
                ◀ SẢNH THANG MÁY ─── HÀNH LANG CHÍNH TẦNG {activeFloor} ─── KIOSK QUÉT QR ▶
              </text>

              {/* Ve 6 Phong Hop Chinh Thuc (3 Phong Day Bac + 3 Phong Day Nam) */}
              {workspaceNodes.slice(0, 6).map((roomNode, index) => {
                const colIdx = index % 3;
                const isNorth = index < 3;
                const roomX = 24 + colIdx * 252;
                const roomY = isNorth ? 20 : 264;
                const roomW = 248;
                const roomH = 176;
                const centerX = roomX + roomW / 2;
                const centerY = roomY + roomH / 2;

                const isSelected = roomNode.nodeId === selectedNodeId;
                const palette = resolveColors(roomNode.status);
                const cap = Math.max(2, roomNode.capacityCount || 4);

                return (
                  <g
                    key={roomNode.nodeId}
                    onClick={() => onSelectWorkspaceNode(roomNode)}
                    className="cursor-pointer"
                  >
                    {/* Tuong Vach Ngan Bao Quanh Tung Phong Hop */}
                    <rect
                      x={roomX}
                      y={roomY}
                      width={roomW}
                      height={roomH}
                      fill={palette.bg}
                      stroke={isSelected ? '#2563eb' : isDark ? '#475569' : '#94a3b8'}
                      strokeWidth={isSelected ? 3 : 2.5}
                    />

                    {/* Khe Cua Ra Vao & Cung Mo Cua Kien Truc Giap Hanh Lang */}
                    {isNorth ? (
                      <g>
                        <line
                          x1={roomX + 185}
                          y1={roomY + roomH}
                          x2={roomX + 225}
                          y2={roomY + roomH}
                          stroke={palette.bg}
                          strokeWidth="5"
                        />
                        <path
                          d={`M ${roomX + 185} ${roomY + roomH} A 36 36 0 0 1 ${roomX + 221} ${
                            roomY + roomH - 36
                          }`}
                          fill="none"
                          stroke={palette.fill}
                          strokeWidth="1.5"
                          strokeDasharray="3 2"
                        />
                      </g>
                    ) : (
                      <g>
                        <line
                          x1={roomX + 185}
                          y1={roomY}
                          x2={roomX + 225}
                          y2={roomY}
                          stroke={palette.bg}
                          strokeWidth="5"
                        />
                        <path
                          d={`M ${roomX + 185} ${roomY} A 36 36 0 0 0 ${roomX + 221} ${
                            roomY + 36
                          }`}
                          fill="none"
                          stroke={palette.fill}
                          strokeWidth="1.5"
                          strokeDasharray="3 2"
                        />
                      </g>
                    )}

                    {/* Man hinh TV Treo Vach Trai cua Phong Hop */}
                    <rect
                      x={roomX + 6}
                      y={centerY - 26}
                      width="6"
                      height="52"
                      rx="2"
                      fill="#2563eb"
                    />

                    {/* Ban Hop & Ghe Ngoi Ben Trong Phong (Tuy theo Suc chua >= 2 nguoi) */}
                    {roomNode.zoneType === 'COLLAB_HUB' ? (
                      <g>
                        <circle
                          cx={centerX}
                          cy={centerY}
                          r="34"
                          fill={isDark ? '#1e293b' : '#ffffff'}
                          stroke={palette.fill}
                          strokeWidth="2"
                        />
                        {Array.from({ length: Math.min(8, cap) }).map((_, ci) => {
                          const ang = (ci * Math.PI * 2) / Math.min(8, cap);
                          const gx = centerX + Math.cos(ang) * 48;
                          const gy = centerY + Math.sin(ang) * 48;
                          return (
                            <circle key={ci} cx={gx} cy={gy} r="7.5" fill={palette.fill} />
                          );
                        })}
                      </g>
                    ) : (
                      <g>
                        <rect
                          x={centerX - 62}
                          y={centerY - 24}
                          width="124"
                          height="48"
                          rx="8"
                          fill={isDark ? '#1e293b' : '#ffffff'}
                          stroke={palette.fill}
                          strokeWidth="2"
                        />
                        {cap === 2 ? (
                          <>
                            <rect
                              x={centerX - 10}
                              y={centerY - 40}
                              width="20"
                              height="11"
                              rx="3"
                              fill={palette.fill}
                            />
                            <rect
                              x={centerX - 10}
                              y={centerY + 29}
                              width="20"
                              height="11"
                              rx="3"
                              fill={palette.fill}
                            />
                          </>
                        ) : (
                          <>
                            {[-38, 0, 38].map((dx) => (
                              <g key={dx}>
                                <rect
                                  x={centerX + dx - 9}
                                  y={centerY - 39}
                                  width="18"
                                  height="10"
                                  rx="3"
                                  fill={palette.fill}
                                />
                                <rect
                                  x={centerX + dx - 9}
                                  y={centerY + 29}
                                  width="18"
                                  height="10"
                                  rx="3"
                                  fill={palette.fill}
                                />
                              </g>
                            ))}
                            <rect
                              x={centerX - 78}
                              y={centerY - 9}
                              width="11"
                              height="18"
                              rx="3"
                              fill={palette.fill}
                            />
                            <rect
                              x={centerX + 67}
                              y={centerY - 9}
                              width="11"
                              height="18"
                              rx="3"
                              fill={palette.fill}
                            />
                          </>
                        )}
                      </g>
                    )}

                    {/* Nhan Ma Phong & Suc Chua */}
                    <text
                      x={centerX}
                      y={centerY - 2}
                      textAnchor="middle"
                      fill={isDark ? '#f8fafc' : '#0f172a'}
                      fontSize="11"
                      fontWeight="800"
                    >
                      {roomNode.nodeCode} ({cap} người)
                    </text>
                    <text
                      x={centerX}
                      y={centerY + 12}
                      textAnchor="middle"
                      fill={palette.fill}
                      fontSize="9.5"
                      fontWeight="700"
                    >
                      {palette.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};