import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  Layers,
  MapPin,
  Users,
} from 'lucide-react';
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
  ...[200, 235, 270, 305, 340, 165].map((ang, idx) => ({
    seatId: `H01-A${idx + 1}`,
    ringName: 'Hàng A (Sát Sân khấu)',
    angleDeg: ang,
    radiusPx: 74,
  })),
  ...[155, 180, 205, 230, 255, 280, 305, 330, 355].map((ang, idx) => ({
    seatId: `H01-B${idx + 1}`,
    ringName: 'Hàng B (Vòng Giữa)',
    angleDeg: ang,
    radiusPx: 112,
  })),
  ...[145, 167, 189, 211, 233, 255, 277, 299, 321, 343, 5].map((ang, idx) => ({
    seatId: `H01-C${idx + 1}`,
    ringName: 'Hàng C (Vòng Ngoài)',
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
    selectedNode?.nodeId || workspaceNodes[0]?.nodeId || 'NODE-M01'
  );
  const [selectedHallSeatId, setSelectedHallSeatId] = useState<string>('H01-A1');

  const [bookingDate, setBookingDate] = useState<string>('2026-10-19');
  const [startTime, setStartTime] = useState<string>(preselectedSlot?.start || '09:00');
  const [endTime, setEndTime] = useState<string>(preselectedSlot?.end || '11:00');
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
    currentRoom?.floorLevel === 3 || currentRoom?.nodeCode === 'H-01';

  const handleConfirmBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom) return;

    const finalTargetCode = isGrandHallSelected
      ? selectedHallSeatId
      : currentRoom.nodeCode;

    const finalNote = isGrandHallSelected
      ? `[Hội trường Tầng 3 - Ghế ${selectedHallSeatId}] ${purposeNote}`
      : `[${currentRoom.nodeLabel}] ${purposeNote}`;

    onCreateNewBooking(userEmail, finalNote, finalTargetCode, {
      start: startTime,
      end: endTime,
    });
  };

  const cardSurface = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-800 shadow-sm';

  const inputSurface = isDark
    ? 'bg-slate-950 border-slate-800 text-slate-100'
    : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white';

  return (
    <div className="space-y-6">
      {/* TIEU DE TRANG DAT LICH */}
      <div
        className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardSurface}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold">
              Đặt lịch Phòng họp & Xem trước Bố cục Không gian
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn phòng và khung giờ cần đặt • Hệ thống tự động hiển thị sơ đồ bố cục tương ứng của phòng đó
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            Đang chọn: {currentRoom?.nodeCode} ({currentRoom?.nodeLabel})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ===================================================================
            COT TRAI (7/12): FORM CHON PHONG, GIO DAT & XEM TRUOC BO CUC PHONG
           =================================================================== */}
        <div className={`lg:col-span-7 p-5 rounded-2xl border space-y-5 ${cardSurface}`}>
          <form onSubmit={handleConfirmBookingSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-extrabold mb-1.5">
                  1. Chọn Phòng họp / Không gian cần đặt
                </label>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${inputSurface}`}
                >
                  {workspaceNodes.map((node) => (
                    <option key={node.nodeId} value={node.nodeId}>
                      [Tầng {node.floorLevel}] {node.nodeCode} — {node.nodeLabel} ({node.capacityCount} chỗ)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5">
                  2. Ngày đặt lịch
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
                  Chu kỳ lặp lại
                </label>
                <select
                  value={repeatMode}
                  onChange={(e) =>
                    setRepeatMode(e.target.value as 'NONE' | 'WEEKLY' | 'MONTHLY')
                  }
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${inputSurface}`}
                >
                  <option value="NONE">Đặt đơn lẻ (1 lần)</option>
                  <option value="WEEKLY">Định kỳ Hàng tuần</option>
                  <option value="MONTHLY">Định kỳ Hàng tháng</option>
                </select>
              </div>
            </div>

            {/* ===============================================================
                KHUNG XEM TRUOC BO CUC TUONG UNG VOI PHONG DINH DAT
               =============================================================== */}
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
                    Tầng {currentRoom.floorLevel} • Sức chứa: {currentRoom.capacityCount} ghế
                  </span>
                </div>

                {/* BỐ CỤC 1: NẾU CHỌN HỘI TRƯỜNG TẦNG 3 (H-01 ĐẤU TRƯỜNG LA MÃ - ĐÃ FIX 100% LỖI GIẬT CHUỘT) */}
                {isGrandHallSelected ? (
                  <div className="flex flex-col items-center">
                    <svg viewBox="0 0 400 320" className="w-full max-w-[390px] h-auto select-none">
                      {[74, 112, 148].map((r) => (
                        <circle
                          key={r}
                          cx="200"
                          cy="190"
                          r={r}
                          fill="none"
                          stroke={isDark ? '#1e293b' : '#e2e8f0'}
                          strokeWidth="16"
                        />
                      ))}

                      <circle
                        cx="200"
                        cy="190"
                        r="38"
                        fill={isDark ? '#1e1b4b' : '#eef2ff'}
                        stroke="#4f46e5"
                        strokeWidth="2"
                      />
                      <text
                        x="200"
                        y="188"
                        textAnchor="middle"
                        fill={isDark ? '#e0e7ff' : '#312e81'}
                        fontSize="8.5"
                        fontWeight="800"
                      >
                        SÂN KHẤU TRÒN
                      </text>
                      <text
                        x="200"
                        y="200"
                        textAnchor="middle"
                        fill="#4f46e5"
                        fontSize="7.5"
                        fontWeight="700"
                      >
                        SPEAKER 360°
                      </text>

                      {/* Khong dung hover:scale tren the <g> de tranh loi nhay ve (0,0) */}
                      {COLOSSEUM_SEAT_LIST.map((seat) => {
                        const rad = (seat.angleDeg * Math.PI) / 180;
                        const cx = Math.round(200 + Math.cos(rad) * seat.radiusPx);
                        const cy = Math.round(190 + Math.sin(rad) * seat.radiusPx);
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
                              r={isPicked ? 13 : 10.5}
                              fill={
                                isBooked
                                  ? '#64748b'
                                  : isPicked
                                  ? '#4f46e5'
                                  : '#0d9488'
                              }
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
                      Ghế Hội trường đang chọn: {selectedHallSeatId} (Click vào ghế màu xanh ngọc để đổi ghế)
                    </p>
                  </div>
                ) : currentRoom.zoneType === 'MEETING_ROOM' ? (
                  /* BỐ CỤC 2: NẾU CHỌN PHÒNG HỌP BOARDROOM (M-01, M-02, M-03) */
                  <div className="flex flex-col items-center">
                    <svg viewBox="0 0 380 190" className="w-full max-w-[380px] h-auto">
                      <rect
                        x="15"
                        y="15"
                        width="350"
                        height="160"
                        rx="14"
                        fill={isDark ? '#0f172a' : '#ffffff'}
                        stroke="#4f46e5"
                        strokeWidth="2"
                      />
                      {/* Man hinh TV */}
                      <rect x="24" y="60" width="8" height="70" rx="3" fill="#0d9488" />
                      <text
                        x="42"
                        y="98"
                        fill={isDark ? '#94a3b8' : '#64748b'}
                        fontSize="8"
                        fontWeight="700"
                      >
                        TV 85&quot;
                      </text>
                      {/* Ban hop dai */}
                      <rect
                        x="95"
                        y="58"
                        width="195"
                        height="74"
                        rx="12"
                        fill={isDark ? '#1e293b' : '#f1f5f9'}
                        stroke="#6366f1"
                        strokeWidth="2"
                      />
                      <text
                        x="192"
                        y="98"
                        textAnchor="middle"
                        fill={isDark ? '#e2e8f0' : '#1e293b'}
                        fontSize="10"
                        fontWeight="800"
                      >
                        {currentRoom.nodeCode} • BÀN HỌP {currentRoom.capacityCount} GHẾ
                      </text>
                      {/* Day ghe tren & duoi */}
                      {[120, 168, 216, 264].map((gx) => (
                        <g key={gx}>
                          <rect
                            x={gx - 12}
                            y="34"
                            width="24"
                            height="16"
                            rx="5"
                            fill="#0d9488"
                          />
                          <rect
                            x={gx - 12}
                            y="140"
                            width="24"
                            height="16"
                            rx="5"
                            fill="#0d9488"
                          />
                        </g>
                      ))}
                      {/* Ghe chu toa */}
                      <rect x="68" y="83" width="18" height="24" rx="5" fill="#4f46e5" />
                      <rect x="298" y="83" width="18" height="24" rx="5" fill="#0d9488" />
                    </svg>
                  </div>
                ) : currentRoom.zoneType === 'COLLAB_HUB' ? (
                  /* BỐ CỤC 3: NẾU CHỌN PHÒNG THẢO LUẬN NHÓM (C-01) */
                  <div className="flex flex-col items-center">
                    <svg viewBox="0 0 360 180" className="w-full max-w-[360px] h-auto">
                      <rect
                        x="20"
                        y="15"
                        width="320"
                        height="150"
                        rx="16"
                        fill={isDark ? '#0f172a' : '#ffffff'}
                        stroke="#0d9488"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                      />
                      <circle
                        cx="180"
                        cy="90"
                        r="42"
                        fill={isDark ? '#1e293b' : '#f0fdfa'}
                        stroke="#0d9488"
                        strokeWidth="2"
                      />
                      <text
                        x="180"
                        y="93"
                        textAnchor="middle"
                        fill={isDark ? '#e2e8f0' : '#134e4a'}
                        fontSize="9.5"
                        fontWeight="800"
                      >
                        COLLAB {currentRoom.capacityCount}P
                      </text>
                      {[0, 60, 120, 180, 240, 300].map((ang) => {
                        const rad = (ang * Math.PI) / 180;
                        const cx = 180 + Math.cos(rad) * 62;
                        const cy = 90 + Math.sin(rad) * 62;
                        return (
                          <circle key={ang} cx={cx} cy={cy} r="10" fill="#0d9488" />
                        );
                      })}
                    </svg>
                  </div>
                ) : (
                  /* BỐ CỤC 4: NẾU CHỌN BÀN CÁ NHÂN / BỐT CÁCH ÂM (A-01..A-03, F-01) */
                  <div className="flex flex-col items-center">
                    <svg viewBox="0 0 320 160" className="w-full max-w-[320px] h-auto">
                      <rect
                        x="40"
                        y="15"
                        width="240"
                        height="130"
                        rx="14"
                        fill={isDark ? '#0f172a' : '#ffffff'}
                        stroke="#2563eb"
                        strokeWidth="2"
                      />
                      <rect
                        x="85"
                        y="32"
                        width="150"
                        height="55"
                        rx="8"
                        fill={isDark ? '#1e293b' : '#eff6ff'}
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                      <rect x="105" y="40" width="48" height="8" rx="2" fill="#1e293b" />
                      <rect x="165" y="40" width="48" height="8" rx="2" fill="#1e293b" />
                      <circle cx="160" cy="115" r="16" fill="#0d9488" />
                      <text
                        x="160"
                        y="72"
                        textAnchor="middle"
                        fill={isDark ? '#e2e8f0' : '#1e3a8a'}
                        fontSize="10"
                        fontWeight="800"
                      >
                        TRẠM {currentRoom.nodeCode} (DUAL 4K)
                      </text>
                    </svg>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  3. Nội dung cuộc họp / Mục đích đặt lịch
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
                  : `Xác nhận Đặt ${currentRoom?.nodeCode}`}
              </button>
            </div>
          </form>
        </div>

        {/* ===================================================================
            COT PHAI (5/12): DANH SACH LICH DA DAT & CHECK-IN QR
           =================================================================== */}
        <div
          className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${cardSurface}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-teal-600" />
                  Lịch Đã Đặt & Vé QR Check-in
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quét mã QR đúng khung giờ đã đặt để nhận +2 điểm tín nhiệm
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {bookingsList.length} lịch
              </span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {bookingsList.map((item) => {
                const isCheckedIn = item.bookingStatus === 'CHECKED_IN';
                return (
                  <div
                    key={item.bookingId}
                    className={`p-4 rounded-2xl border transition ${
                      isDark
                        ? 'bg-slate-950/80 border-slate-800'
                        : 'bg-slate-50/80 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-xs font-extrabold">
                            {item.nodeId}
                          </span>
                          <span className="text-xs font-bold">{item.purposeNote}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          Khung giờ: {item.startTimeIso} – {item.endTimeIso} • {item.userEmail}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${
                          isCheckedIn
                            ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isCheckedIn ? 'ĐÃ CHECK-IN (+2đ)' : 'CHỜ CHECK-IN'}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        Mã vé: {item.bookingId}
                      </span>
                      <div className="flex items-center gap-2">
                        {!isCheckedIn && onCheckInBooking && (
                          <button
                            type="button"
                            onClick={() => onCheckInBooking(item.bookingId)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <QrCode className="w-3 h-3" />
                            Quét QR Check-in
                          </button>
                        )}
                        {onCancelBooking && (
                          <button
                            type="button"
                            onClick={() => onCancelBooking(item.bookingId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
                            title="Hủy lịch đặt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 ${
              isDark
                ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
                : 'bg-indigo-50/70 border-indigo-200/70 text-indigo-900'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Bạn có thể kiểm tra trước các Slot trống tại trang <strong>Sơ đồ Phòng họp</strong> rồi chuyển sang đây để xác nhận đặt lịch.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};