import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { SpotMatrixLogo } from '../../../Shared/Components/SpotMatrixLogo';
import { BookingPayloadItem, WorkspaceNodeItem } from '../../../Shared/Types/GlobalSystemTypes';

interface BookingCalendarPagesProps {
  bookingsList: BookingPayloadItem[];
  workspaceNodes?: WorkspaceNodeItem[];
  selectedNode?: WorkspaceNodeItem | null;
  preselectedSlot?: { start: string; end: string } | null;
  userEmail?: string;
  isDark?: boolean;
  onCreateNewBooking: (
    userEmail: string,
    purposeNote: string,
    customTargetCode?: string,
    timeWindow?: { start: string; end: string }
  ) => void;
  onCheckInBooking?: (bookingId: string) => void;
  onCancelBooking?: (bookingId: string) => void;
}

const COLOSSEUM_SEAT_LIST = [
  ...[200, 224, 248, 270, 292, 316, 340].map((ang, idx) => ({
    seatId: `H01-A${idx + 1}`,
    angleDeg: ang,
    radiusPx: 74,
  })),
  ...[190, 210, 230, 250, 270, 290, 310, 330, 350].map((ang, idx) => ({
    seatId: `H01-B${idx + 1}`,
    angleDeg: ang,
    radiusPx: 112,
  })),
  ...[182, 198, 214, 230, 246, 262, 278, 294, 310, 326, 342, 358].map((ang, idx) => ({
    seatId: `H01-C${idx + 1}`,
    angleDeg: ang,
    radiusPx: 148,
  })),
];

export const BookingCalendarPages: React.FC<BookingCalendarPagesProps> = ({
  bookingsList,
  workspaceNodes = [],
  selectedNode,
  preselectedSlot,
  userEmail = 'employee.dev@spotmatrix.vn',
  isDark = false,
  onCreateNewBooking,
  onCheckInBooking,
  onCancelBooking,
}) => {
  const [targetRoomId, setTargetRoomId] = useState<string>(
    selectedNode?.nodeId || workspaceNodes[0]?.nodeId || 'NODE-M101'
  );
  const [selectedHallSeatId, setSelectedHallSeatId] = useState<string>('H01-A1');
  const [activeQrBookingId, setActiveQrBookingId] = useState<string | null>(
    bookingsList[0]?.bookingId || null
  );

  const [bookingDate, setBookingDate] = useState<string>('2026-10-19');
  const [startTime, setStartTime] = useState<string>(preselectedSlot?.start || '08:00');
  const [endTime, setEndTime] = useState<string>(preselectedSlot?.end || '10:00');
  const [repeatMode, setRepeatMode] = useState<'NONE' | 'WEEKLY' | 'MONTHLY'>('NONE');
  const [purposeNote, setPurposeNote] = useState<string>(
    'Họp triển khai dự án & Review Kiến trúc Hệ thống'
  );

  useEffect(() => {
    if (selectedNode) {
      setTargetRoomId(selectedNode.nodeId);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (preselectedSlot) {
      setStartTime(preselectedSlot.start);
      setEndTime(preselectedSlot.end);
    }
  }, [preselectedSlot]);

  const currentRoom = useMemo(
    () =>
      workspaceNodes.find((n) => n.nodeId === targetRoomId) ||
      selectedNode ||
      workspaceNodes[0],
    [workspaceNodes, targetRoomId, selectedNode]
  );

  const isGrandHallSelected =
    currentRoom?.floorLevel === 5 || currentRoom?.nodeCode === 'H-01';

  const handleConfirmBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom) return;

    const finalTargetCode = isGrandHallSelected
      ? selectedHallSeatId
      : currentRoom.nodeCode;

    const finalNote = isGrandHallSelected
      ? `[Hội trường Tầng 5 - Ghế ${selectedHallSeatId}] ${purposeNote}`
      : `[${currentRoom.nodeLabel}] ${purposeNote}`;

    onCreateNewBooking(userEmail, finalNote, finalTargetCode, {
      start: startTime,
      end: endTime,
    });
  };

  // Xay dung URL xac nhan that cho Ma QR
  const buildQrConfirmUrl = (item: BookingPayloadItem) => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      bookingId: item.bookingId,
      room: item.nodeId,
      user: item.userEmail,
      time: `${item.startTimeIso} - ${item.endTimeIso}`,
      purpose: item.purposeNote,
    });
    return `${baseUrl}/qr-checkin?${params.toString()}`;
  };

  const handleDemoScanQrOpenNewTab = (item: BookingPayloadItem) => {
    if (onCheckInBooking) {
      onCheckInBooking(item.bookingId);
    }
    const targetUrl = buildQrConfirmUrl(item);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const cardSurface = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-800 shadow-sm';

  const inputSurface = isDark
    ? 'bg-slate-950 border-slate-800 text-slate-100'
    : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white';

  const activeQrItem =
    bookingsList.find((b) => b.bookingId === activeQrBookingId) || bookingsList[0];

  return (
    <div className="space-y-6">
      <div
        className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardSurface}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold">
              Đặt lịch Phòng họp & Cấp Mã QR Check-in
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn phòng từ 5 tầng • Xem trước bố cục phòng định đặt • Quét mã QR thật có gắn Logo SpotMatrix
            </p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400">
          Đang chọn: {currentRoom?.nodeCode} ({currentRoom?.capacityCount} người)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COT TRAI: FORM CHON PHONG, GIO DAT & XEM TRUOC BO CUC PHONG */}
        <div className={`lg:col-span-7 p-5 rounded-2xl border space-y-5 ${cardSurface}`}>
          <form onSubmit={handleConfirmBookingSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-extrabold mb-1.5">
                  1. Chọn Phòng họp (Tầng 1–4) hoặc Hội trường (Tầng 5)
                </label>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${inputSurface}`}
                >
                  {workspaceNodes.map((node) => (
                    <option key={node.nodeId} value={node.nodeId}>
                      [Tầng {node.floorLevel}] {node.nodeCode} — {node.nodeLabel} ({node.capacityCount} người)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5">
                  2. Ngày họp
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${inputSurface}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Giờ bắt đầu
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${inputSurface}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Giờ kết thúc
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${inputSurface}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Lặp định kỳ
                </label>
                <select
                  value={repeatMode}
                  onChange={(e) =>
                    setRepeatMode(e.target.value as 'NONE' | 'WEEKLY' | 'MONTHLY')
                  }
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${inputSurface}`}
                >
                  <option value="NONE">Đặt đơn lẻ (1 lần)</option>
                  <option value="WEEKLY">Hàng tuần (Weekly)</option>
                  <option value="MONTHLY">Hàng tháng (Monthly)</option>
                </select>
              </div>
            </div>

            {/* KHUNG XEM TRUOC BO CUC PHONG DINH DAT */}
            {currentRoom && (
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-extrabold">
                      Xem trước Bố cục Phòng: {currentRoom.nodeLabel}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    Tầng {currentRoom.floorLevel} • Sức chứa: {currentRoom.capacityCount} người
                  </span>
                </div>

                {isGrandHallSelected ? (
                  <div className="flex flex-col items-center">
                    <svg viewBox="0 0 400 280" className="w-full max-w-[380px] h-auto select-none">
                      {[74, 112, 148].map((r) => (
                        <path
                          key={r}
                          d={`M ${200 - r} 210 A ${r} ${r} 0 0 1 ${200 + r} 210`}
                          fill="none"
                          stroke={isDark ? '#1e293b' : '#e2e8f0'}
                          strokeWidth="18"
                          strokeLinecap="round"
                        />
                      ))}

                      <circle
                        cx="200"
                        cy="215"
                        r="38"
                        fill={isDark ? '#1e1b4b' : '#eef2ff'}
                        stroke="#4f46e5"
                        strokeWidth="2"
                      />
                      <text
                        x="200"
                        y="213"
                        textAnchor="middle"
                        fill={isDark ? '#e0e7ff' : '#312e81'}
                        fontSize="8.5"
                        fontWeight="800"
                      >
                        SÂN KHẤU TRÒN
                      </text>
                      <text
                        x="200"
                        y="225"
                        textAnchor="middle"
                        fill="#10b981"
                        fontSize="7.5"
                        fontWeight="700"
                      >
                        SPEAKER 360°
                      </text>

                      {COLOSSEUM_SEAT_LIST.map((seat) => {
                        const rad = (seat.angleDeg * Math.PI) / 180;
                        const cx = Math.round(200 + Math.cos(rad) * seat.radiusPx);
                        const cy = Math.round(210 + Math.sin(rad) * seat.radiusPx);
                        const isPicked = seat.seatId === selectedHallSeatId;
                        const isBooked = bookingsList.some((b) => b.nodeId === seat.seatId);

                        return (
                          <g
                            key={seat.seatId}
                            transform={`translate(${cx}, ${cy})`}
                            onClick={() => !isBooked && setSelectedHallSeatId(seat.seatId)}
                            className="cursor-pointer"
                          >
                            <circle
                              r={isPicked ? 12.5 : 10}
                              fill={isBooked ? '#64748b' : isPicked ? '#4f46e5' : '#0d9488'}
                              stroke={isPicked ? '#ffffff' : 'none'}
                              strokeWidth={isPicked ? 2 : 0}
                            />
                            <text
                              x="0"
                              y="3"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="7.5"
                              fontWeight="800"
                            >
                              {seat.seatId.replace('H01-', '')}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Ghế Hội trường đang chọn: {selectedHallSeatId}
                    </p>
                  </div>
                ) : currentRoom.zoneType === 'COLLAB_HUB' ? (
                  <div className="flex flex-col items-center">
                    <svg viewBox="0 0 360 175" className="w-full max-w-[350px] h-auto">
                      <rect
                        x="20"
                        y="12"
                        width="320"
                        height="150"
                        rx="14"
                        fill={isDark ? '#0f172a' : '#ffffff'}
                        stroke="#0d9488"
                        strokeWidth="2"
                      />
                      <circle
                        cx="180"
                        cy="87"
                        r="40"
                        fill={isDark ? '#1e293b' : '#f0fdfa'}
                        stroke="#0d9488"
                        strokeWidth="2"
                      />
                      <text
                        x="180"
                        y="90"
                        textAnchor="middle"
                        fill={isDark ? '#e2e8f0' : '#134e4a'}
                        fontSize="9.5"
                        fontWeight="800"
                      >
                        BÀN TRÒN {currentRoom.capacityCount} NGƯỜI
                      </text>
                      {Array.from({ length: Math.min(8, currentRoom.capacityCount) }).map(
                        (_, idx) => {
                          const ang =
                            (idx * Math.PI * 2) / Math.min(8, currentRoom.capacityCount);
                          const cx = 180 + Math.cos(ang) * 58;
                          const cy = 87 + Math.sin(ang) * 58;
                          return <circle key={idx} cx={cx} cy={cy} r="9" fill="#0d9488" />;
                        }
                      )}
                    </svg>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg viewBox="0 0 380 180" className="w-full max-w-[370px] h-auto">
                      <rect
                        x="15"
                        y="12"
                        width="350"
                        height="156"
                        rx="14"
                        fill={isDark ? '#0f172a' : '#ffffff'}
                        stroke="#4f46e5"
                        strokeWidth="2.5"
                      />
                      <rect x="24" y="55" width="7" height="70" rx="3" fill="#0d9488" />
                      <rect
                        x="95"
                        y="56"
                        width="195"
                        height="68"
                        rx="10"
                        fill={isDark ? '#1e293b' : '#f1f5f9'}
                        stroke="#6366f1"
                        strokeWidth="2"
                      />
                      <text
                        x="192"
                        y="93"
                        textAnchor="middle"
                        fill={isDark ? '#e2e8f0' : '#1e293b'}
                        fontSize="10"
                        fontWeight="800"
                      >
                        {currentRoom.nodeCode} • PHÒNG HỌP {currentRoom.capacityCount} NGƯỜI
                      </text>
                      {currentRoom.capacityCount === 2 ? (
                        <>
                          <rect x="178" y="34" width="28" height="14" rx="4" fill="#0d9488" />
                          <rect x="178" y="132" width="28" height="14" rx="4" fill="#0d9488" />
                        </>
                      ) : (
                        <>
                          {[125, 170, 215, 260]
                            .slice(0, Math.max(1, Math.floor((currentRoom.capacityCount - 2) / 2)))
                            .map((gx) => (
                              <g key={gx}>
                                <rect
                                  x={gx - 11}
                                  y="34"
                                  width="22"
                                  height="14"
                                  rx="4"
                                  fill="#0d9488"
                                />
                                <rect
                                  x={gx - 11}
                                  y="132"
                                  width="22"
                                  height="14"
                                  rx="4"
                                  fill="#0d9488"
                                />
                              </g>
                            ))}
                          <rect x="68" y="79" width="16" height="22" rx="4" fill="#4f46e5" />
                          <rect x="298" y="79" width="16" height="22" rx="4" fill="#0d9488" />
                        </>
                      )}
                    </svg>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  3. Nội dung cuộc họp
                </label>
                <input
                  type="text"
                  required
                  value={purposeNote}
                  onChange={(e) => setPurposeNote(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium ${inputSurface}`}
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isGrandHallSelected
                  ? `Xác nhận Đặt Ghế ${selectedHallSeatId}`
                  : `Xác nhận Đặt Phòng ${currentRoom?.nodeCode}`}
              </button>
            </div>
          </form>
        </div>

        {/* COT PHAI: MA QR THAT CO LOGO O GIUA + NUT DEMO QUET QR NHAY TAB MOI */}
        <div
          className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${cardSurface}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-teal-600" />
                  Mã QR Check-in Thực tế & Danh sách Vé
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quét mã QR bằng điện thoại hoặc bấm nút Demo bên dưới để mở Trang Xác nhận
                </p>
              </div>
            </div>

            {/* KHUNG HIEN THI MA QR THAT CO LOGO SPOTMATRIX O CHINH GIUA */}
            {activeQrItem && (
              <div
                className={`p-4 rounded-2xl border flex flex-col items-center text-center space-y-3 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/90 border-slate-200/90'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                  <span>Vé Điện tử: {activeQrItem.bookingId}</span>
                  <span>•</span>
                  <span>Vị trí: {activeQrItem.nodeId}</span>
                </div>

                {/* Hinh Ma QR That (Quet duoc bang Camera Dien thoai) + Logo SpotMatrix o Tam */}
                <div className="relative p-3 bg-white rounded-2xl border-2 border-indigo-500/30 shadow-md inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=190x190&ecc=H&margin=1&data=${encodeURIComponent(
                      buildQrConfirmUrl(activeQrItem)
                    )}`}
                    alt={`QR Check-in ${activeQrItem.bookingId}`}
                    className="w-44 h-44 block"
                  />
                  {/* O nho o chinh giua chua Logo Trang Web SpotMatrix */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="p-1.5 bg-white rounded-xl shadow-md border border-slate-200">
                      <SpotMatrixLogo variant="icon" theme="light" className="scale-75" />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                  Đưa camera điện thoại vào mã QR trên hoặc bấm nút Demo bên dưới để nhảy sang Tab Xác nhận Check-in:
                </p>

                <button
                  type="button"
                  onClick={() => handleDemoScanQrOpenNewTab(activeQrItem)}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Demo Quét QR (Mở Tab Mới Xác Nhận Đúng Hạn)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Danh sach cac lich dat de chon xem QR */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {bookingsList.map((item) => {
                const isCheckedIn = item.bookingStatus === 'CHECKED_IN';
                const isSelectedQr = activeQrItem?.bookingId === item.bookingId;
                return (
                  <div
                    key={item.bookingId}
                    onClick={() => setActiveQrBookingId(item.bookingId)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelectedQr
                        ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30'
                        : isDark
                        ? 'bg-slate-950/70 border-slate-800'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px] font-extrabold shrink-0">
                          {item.nodeId}
                        </span>
                        <span className="text-xs font-bold truncate">{item.purposeNote}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                          isCheckedIn
                            ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isCheckedIn ? 'ĐÃ CHECK-IN' : 'CHỜ QUÉT QR'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.startTimeIso} – {item.endTimeIso}
                      </span>
                      {onCancelBooking && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelBooking(item.bookingId);
                          }}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              isDark
                ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
                : 'bg-indigo-50/70 border-indigo-200/70 text-indigo-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Click vào bất kỳ lịch đặt nào trong danh sách để hiển thị mã QR tương ứng.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};