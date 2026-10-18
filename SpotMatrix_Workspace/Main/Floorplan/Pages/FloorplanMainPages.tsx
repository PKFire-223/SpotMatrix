import React, { useState, useMemo } from 'react';
import {
  Filter,
  Search,
  Move,
  PlusCircle,
  Wrench,
  Cpu,
  Layers,
  MapPin,
  Box,
  Clock,
  CalendarPlus,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import {
  BookingPayloadItem,
  SeatStatusType,
  UserRoleType,
  WorkspaceNodeItem,
  WorkspaceZoneType,
} from '../../../Shared/Types/GlobalSystemTypes';
import { InteractiveMap2D } from '../Function/Components/InteractiveMap2D';
import { InteractiveSpace3D } from '../Function/Components/InteractiveSpace3D';
import { FloorplanCanvasLayout } from '../Layout/FloorplanCanvasLayout';

interface FloorplanMainPagesProps {
  workspaceNodes: WorkspaceNodeItem[];
  bookingsList?: BookingPayloadItem[];
  selectedNode: WorkspaceNodeItem | null;
  userRole: UserRoleType;
  isDark: boolean;
  onSelectNode: (nodeItem: WorkspaceNodeItem) => void;
  onNavigateToBookingWithSlot: (nodeItem: WorkspaceNodeItem, slotTime: { start: string; end: string }) => void;
  onUpdateNodeCoords: (nodeId: string, posX: number, posY: number) => void;
  onUpdateNodeStatus: (nodeId: string, nextStatus: SeatStatusType) => void;
  onCreateNewNode: (payload: {
    nodeCode: string;
    nodeLabel: string;
    zoneType: WorkspaceZoneType;
    floorLevel: number;
    capacityCount: number;
    posX: number;
    posY: number;
    amenitiesList: string[];
  }) => void;
}

const DAILY_TIME_SLOTS = [
  { id: 'SLOT-1', label: 'Ca 1 (08:00 - 10:00)', start: '08:00', end: '10:00' },
  { id: 'SLOT-2', label: 'Ca 2 (10:00 - 12:00)', start: '10:00', end: '12:00' },
  { id: 'SLOT-3', label: 'Ca 3 (13:00 - 15:00)', start: '13:00', end: '15:00' },
  { id: 'SLOT-4', label: 'Ca 4 (15:00 - 17:00)', start: '15:00', end: '17:00' },
  { id: 'SLOT-5', label: 'Ca 5 (17:00 - 19:00)', start: '17:00', end: '19:00' },
];

const EQUIPMENT_FILTER_OPTIONS = [
  'Tất cả thiết bị',
  'Màn hình 4K',
  'Bảng vẽ Wacom',
  'Máy chiếu Laser',
  'Camera AI 360',
  'Sân khấu tròn 360°',
  'Cách âm 40dB',
];

const ARCHITECTURAL_PRESET_COORDS: Record<string, { posX: number; posY: number }> = {
  'A-01': { posX: 110, posY: 125 },
  'A-02': { posX: 250, posY: 125 },
  'A-03': { posX: 390, posY: 125 },
  'M-01': { posX: 630, posY: 145 },
  'F-01': { posX: 135, posY: 350 },
  'C-01': { posX: 425, posY: 350 },
  'B-01': { posX: 180, posY: 130 },
  'M-02': { posX: 630, posY: 145 },
  'H-01': { posX: 400, posY: 230 },
};

export const FloorplanMainPages: React.FC<FloorplanMainPagesProps> = ({
  workspaceNodes,
  bookingsList = [],
  selectedNode,
  userRole,
  isDark,
  onSelectNode,
  onNavigateToBookingWithSlot,
  onUpdateNodeCoords,
  onUpdateNodeStatus,
  onCreateNewNode,
}) => {
  const [activeFloor, setActiveFloor] = useState<number>(1);
  // Mac dinh hien thi Mo hinh 3D Xoay 360 do
  const [viewMode, setViewMode] = useState<'3D_MODEL' | '2D_BLUEPRINT'>('3D_MODEL');

  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('Tất cả thiết bị');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const [isAdminDragMode, setIsAdminDragMode] = useState<boolean>(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState<boolean>(false);

  const [newCode, setNewCode] = useState('M-05');
  const [newLabel, setNewLabel] = useState('Phòng Họp Sáng tạo M05');
  const [newZone, setNewZone] = useState<WorkspaceZoneType>('MEETING_ROOM');
  const [newCapacity, setNewCapacity] = useState(8);
  const [newEquipment, setNewEquipment] = useState('Máy chiếu Laser, Camera AI 360');

  const isSysAdmin = userRole === 'SYS_ADMIN';

  const filteredNodes = useMemo(() => {
    return workspaceNodes.filter((node) => {
      if (node.floorLevel !== activeFloor) return false;
      if (zoneFilter !== 'ALL' && node.zoneType !== zoneFilter) return false;
      if (statusFilter !== 'ALL' && node.status !== statusFilter) return false;
      if (
        equipmentFilter !== 'Tất cả thiết bị' &&
        !(node.amenitiesList || []).some((eq) =>
          eq.toLowerCase().includes(equipmentFilter.toLowerCase())
        )
      ) {
        return false;
      }
      if (searchKeyword.trim() !== '') {
        const kw = searchKeyword.trim().toLowerCase();
        const matchCode = node.nodeCode.toLowerCase().includes(kw);
        const matchLabel = node.nodeLabel.toLowerCase().includes(kw);
        if (!matchCode && !matchLabel) return false;
      }
      return true;
    });
  }, [workspaceNodes, activeFloor, zoneFilter, statusFilter, equipmentFilter, searchKeyword]);

  // Tinh toan trang thai tung Slot gio trong ngay cho Phong dang chon
  const selectedNodeSlotsStatus = useMemo(() => {
    if (!selectedNode) return [];
    return DAILY_TIME_SLOTS.map((slot, index) => {
      const matchedBooking = bookingsList.find(
        (b) =>
          (b.nodeId === selectedNode.nodeCode || b.nodeId === selectedNode.nodeId) &&
          b.bookingStatus !== 'CANCELLED' &&
          b.startTimeIso <= slot.end &&
          b.endTimeIso >= slot.start
      );

      // Mo phong mot slot da dat neu phong dang o trang thai OCCUPIED/RESERVED ma chua co ban ghi cu the
      const isSimulatedOccupied =
        !matchedBooking &&
        index === 1 &&
        (selectedNode.status === 'OCCUPIED' || selectedNode.status === 'RESERVED');

      const isBooked = Boolean(matchedBooking) || isSimulatedOccupied;

      return {
        ...slot,
        isBooked,
        bookedByEmail:
          matchedBooking?.userEmail ||
          (isSimulatedOccupied ? 'manager.lead@spotmatrix.vn' : null),
        bookedPurpose:
          matchedBooking?.purposeNote ||
          (isSimulatedOccupied ? 'Họp triển khai kế hoạch Sprint' : null),
      };
    });
  }, [selectedNode, bookingsList]);

  const handleAutoArrangeStandardLayout = () => {
    filteredNodes.forEach((node, index) => {
      const preset = ARCHITECTURAL_PRESET_COORDS[node.nodeCode] || {
        posX: 120 + (index % 3) * 140,
        posY: index < 3 ? 125 : 350,
      };
      onUpdateNodeCoords(node.nodeId, preset.posX, preset.posY);
    });
  };

  const handleAddNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eqArray = newEquipment
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    onCreateNewNode({
      nodeCode: newCode,
      nodeLabel: newLabel,
      zoneType: newZone,
      floorLevel: activeFloor,
      capacityCount: Number(newCapacity),
      posX: 250,
      posY: 125,
      amenitiesList: eqArray,
    });
    setShowAddNodeModal(false);
  };

  const cardSurfaceClass = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-800 shadow-sm';

  const inputSurfaceClass = isDark
    ? 'bg-slate-950 border-slate-800 text-slate-100'
    : 'bg-slate-50 border-slate-200 text-slate-800';

  return (
    <div className="space-y-4">
      {/* THANH CHON TANG (TANG 1, TANG 2, TANG 3 HOI TRUONG) & CHE DO 3D / 2D */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${cardSurfaceClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/70 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Sơ đồ Phòng họp & Hội trường 3D
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kiểm tra bố cục phòng 3D, xem phòng đã có người đặt chưa và tra cứu các Slot giờ còn trống
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chon 3 Tang: Tang 1, Tang 2, Tang 3 (Hoi truong) */}
            <div
              className={`inline-flex rounded-xl p-1 border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {[
                { fl: 1, name: 'Tầng 1 (Phòng họp & Bàn)' },
                { fl: 2, name: 'Tầng 2 (Phòng Chiến lược)' },
                { fl: 3, name: 'Tầng 3 (Hội trường)' },
              ].map((item) => (
                <button
                  key={item.fl}
                  type="button"
                  onClick={() => {
                    setActiveFloor(item.fl);
                    const firstOnFloor = workspaceNodes.find((n) => n.floorLevel === item.fl);
                    if (firstOnFloor) onSelectNode(firstOnFloor);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeFloor === item.fl
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Chuyen doi Mo hinh 3D Xoay 360 vs Mat bang 2D */}
            <div
              className={`inline-flex rounded-xl p-1 border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode('3D_MODEL')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === '3D_MODEL'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                Mô hình 3D (Xoay chuột)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('2D_BLUEPRINT')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === '2D_BLUEPRINT'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Sơ đồ 2D
              </button>
            </div>

            {isSysAdmin && viewMode === '2D_BLUEPRINT' && (
              <button
                type="button"
                onClick={() => setIsAdminDragMode(!isAdminDragMode)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  isAdminDragMode
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                {isAdminDragMode ? 'Đang bật Kéo thả' : 'Kéo thả 2D (Admin)'}
              </button>
            )}

            {isSysAdmin && (
              <button
                type="button"
                onClick={() => setShowAddNodeModal(!showAddNodeModal)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Thêm Phòng
              </button>
            )}
          </div>
        </div>

        {/* Bo loc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã phòng (M-01, H-01, A-01)..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs font-medium focus:outline-none ${inputSurfaceClass}`}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${inputSurfaceClass}`}
            >
              <option value="ALL">Tất cả loại phòng</option>
              <option value="MEETING_ROOM">Phòng họp (Meeting Room)</option>
              <option value="COLLAB_HUB">Hội trường / Khu thảo luận</option>
              <option value="DESK_POD">Bàn cá nhân (Desk Pod)</option>
              <option value="FOCUS_BOOTH">Bốt yên tĩnh (Focus Booth)</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${inputSurfaceClass}`}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">Đang trống (Available)</option>
              <option value="HOLDING">Đang giữ 5p (Holding)</option>
              <option value="RESERVED">Đã đặt trước (Reserved)</option>
              <option value="OCCUPIED">Đang họp (Occupied)</option>
              <option value="MAINTENANCE">Đang bảo trì (Maintenance)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${inputSurfaceClass}`}
            >
              {EQUIPMENT_FILTER_OPTIONS.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isSysAdmin && showAddNodeModal && (
          <form
            onSubmit={handleAddNodeSubmit}
            className={`mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div>
              <label className="block text-[11px] font-bold mb-1">Mã phòng *</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${inputSurfaceClass}`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Tên phòng họp *</label>
              <input
                type="text"
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${inputSurfaceClass}`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Loại bố cục</label>
              <select
                value={newZone}
                onChange={(e) => setNewZone(e.target.value as WorkspaceZoneType)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${inputSurfaceClass}`}
              >
                <option value="MEETING_ROOM">MEETING_ROOM</option>
                <option value="COLLAB_HUB">COLLAB_HUB</option>
                <option value="DESK_POD">DESK_POD</option>
                <option value="FOCUS_BOOTH">FOCUS_BOOTH</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Thiết bị phòng</label>
              <input
                type="text"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${inputSurfaceClass}`}
              />
            </div>
            <button
              type="submit"
              className="py-2 px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              Lưu vào Tầng {activeFloor}
            </button>
          </form>
        )}
      </div>

      {/* KHUNG HIEN THI MO HINH 3D XOAY CHUOT & BANG KIEM TRA SLOT GIO BEN PHAI */}
      <FloorplanCanvasLayout
        mapViewportSlot={
          viewMode === '3D_MODEL' ? (
            <InteractiveSpace3D
              workspaceNodes={filteredNodes}
              bookingsList={bookingsList}
              selectedNodeId={selectedNode?.nodeId || null}
              activeFloor={activeFloor}
              userRole={userRole}
              isDark={isDark}
              onSelectWorkspaceNode={onSelectNode}
            />
          ) : (
            <InteractiveMap2D
              workspaceNodes={filteredNodes}
              selectedNodeId={selectedNode?.nodeId || null}
              isDark={isDark}
              isAdminDragMode={isAdminDragMode}
              activeFloor={activeFloor}
              onSelectWorkspaceNode={onSelectNode}
              onCommitNodeCoordinates={onUpdateNodeCoords}
              onAutoArrangeLayout={handleAutoArrangeStandardLayout}
            />
          )
        }
        sideControlSlot={
          <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${cardSurfaceClass}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/70 dark:border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                Thông tin Bố cục & Trạng thái Slot
              </h3>
              {selectedNode && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {selectedNode.floorLevel === 3
                    ? 'Tầng 3 (Hội trường)'
                    : `Tầng ${selectedNode.floorLevel}`}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold">{selectedNode.nodeLabel}</span>
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-indigo-600 text-white">
                      {selectedNode.nodeCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Bố cục:{' '}
                    <strong>
                      {selectedNode.floorLevel === 3
                        ? 'Đấu trường La Mã (Sân khấu tròn 360° & 3 vòng ghế)'
                        : selectedNode.zoneType === 'MEETING_ROOM'
                        ? 'Phòng họp Kính Bàn dài (Boardroom)'
                        : selectedNode.zoneType === 'COLLAB_HUB'
                        ? 'Không gian Thảo luận Bàn tròn'
                        : 'Trạm làm việc Cá nhân Dual-4K'}
                    </strong>
                  </p>
                </div>

                {/* Danh sach Thiet bi */}
                <div className="flex flex-wrap gap-1.5">
                  {(selectedNode.amenitiesList || []).map((item) => (
                    <span
                      key={item}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-200'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {/* BANG KIEM TRA CAC SLOT TRONG NGAY (CON TRONG HAY DA CO NGUOI DAT) */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      Trạng thái các Slot trong ngày:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Sức chứa: {selectedNode.capacityCount} chỗ
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedNodeSlotsStatus.map((slot) => (
                      <div
                        key={slot.id}
                        className={`p-2.5 rounded-xl border text-xs transition ${
                          slot.isBooked
                            ? isDark
                              ? 'bg-slate-950/90 border-slate-800'
                              : 'bg-slate-50 border-slate-200/80'
                            : isDark
                            ? 'bg-teal-950/20 border-teal-500/30'
                            : 'bg-teal-50/50 border-teal-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold">{slot.label}</span>
                          {slot.isBooked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                              Đã có người đặt
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                onNavigateToBookingWithSlot(selectedNode, {
                                  start: slot.start,
                                  end: slot.end,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <CalendarPlus className="w-3 h-3" />
                              Còn trống • Qua Đặt lịch →
                            </button>
                          )}
                        </div>

                        {/* NEU LA ADMIN VA SLOT DA CO NGUOI DAT: HIEN THI NGAY NGUOI DAT & MUC DICH */}
                        {slot.isBooked && isSysAdmin && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                            <p className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                              <UserCheck className="w-3 h-3" />
                              Người đặt (Admin View): {slot.bookedByEmail}
                            </p>
                            <p>Nội dung: {slot.bookedPurpose}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cong cu chuyen trang thai nhanh cho Admin */}
                {isSysAdmin && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5" /> Điều khiển Trạng thái (Quyền Admin):
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['AVAILABLE', 'HOLDING', 'MAINTENANCE'] as SeatStatusType[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => onUpdateNodeStatus(selectedNode.nodeId, st)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition ${
                            selectedNode.status === st
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isDark
                              ? 'bg-slate-950 border-slate-800 text-slate-300'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {st === 'AVAILABLE'
                            ? 'Mở Trống'
                            : st === 'HOLDING'
                            ? 'Giữ 5p'
                            : 'Bảo trì'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Hãy bấm vào một phòng trên mô hình 3D để kiểm tra các khung giờ còn trống.
              </p>
            )}
          </div>
        }
      />
    </div>
  );
};