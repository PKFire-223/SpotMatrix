import React, { useState, useMemo } from 'react';
import {
  Filter,
  Search,
  Move,
  PlusCircle,
  CheckCircle2,
  Wrench,
  Cpu,
  Layers,
  MapPin,
} from 'lucide-react';
import {
  SeatStatusType,
  UserRoleType,
  WorkspaceNodeItem,
  WorkspaceZoneType,
} from '../../../Shared/Types/GlobalSystemTypes';
import { InteractiveMap2D } from '../Function/Components/InteractiveMap2D';
import { FloorplanCanvasLayout } from '../Layout/FloorplanCanvasLayout';

interface FloorplanMainPagesProps {
  workspaceNodes: WorkspaceNodeItem[];
  selectedNode: WorkspaceNodeItem | null;
  userRole: UserRoleType;
  isDark: boolean;
  onSelectNode: (nodeItem: WorkspaceNodeItem) => void;
  onTriggerQuickBooking: (nodeItem: WorkspaceNodeItem) => void;
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

const EQUIPMENT_FILTER_OPTIONS = [
  'Tất cả thiết bị',
  'Màn hình 4K',
  'Bảng vẽ Wacom',
  'Máy chiếu Laser',
  'Camera AI 360',
  'Cách âm 40dB',
  'Cổng Type-C 100W',
];

export const FloorplanMainPages: React.FC<FloorplanMainPagesProps> = ({
  workspaceNodes,
  selectedNode,
  userRole,
  isDark,
  onSelectNode,
  onTriggerQuickBooking,
  onUpdateNodeCoords,
  onUpdateNodeStatus,
  onCreateNewNode,
}) => {
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('Tất cả thiết bị');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Cong cu danh rieng cho SYS_ADMIN
  const [isAdminDragMode, setIsAdminDragMode] = useState<boolean>(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState<boolean>(false);

  // State form them vi tri moi
  const [newCode, setNewCode] = useState('A-05');
  const [newLabel, setNewLabel] = useState('Bàn Làm việc Màn hình Đôi A05');
  const [newZone, setNewZone] = useState<WorkspaceZoneType>('DESK_POD');
  const [newCapacity, setNewCapacity] = useState(1);
  const [newEquipment, setNewEquipment] = useState('Màn hình 4K, Cổng Type-C 100W');

  const isSysAdmin = userRole === 'SYS_ADMIN';

  const filteredNodes = useMemo(() => {
    return workspaceNodes.filter((node) => {
      if (node.floorLevel !== activeFloor) return false;
      if (zoneFilter !== 'ALL' && node.zoneType !== zoneFilter) return false;
      if (statusFilter !== 'ALL' && node.status !== statusFilter) return false;
      if (
        equipmentFilter !== 'Tất cả thiết bị' &&
        !node.amenitiesList.some((eq) =>
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
      posX: 240,
      posY: 190,
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
      {/* THANH CONG CU BO LOC DA CHIEU & CHE DO ADMIN */}
      <div className={`p-4 rounded-2xl border transition-colors ${cardSurfaceClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-slate-200/70 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Sơ đồ Mặt bằng Tương tác 2D & Quản lý Tọa độ Không gian
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hiển thị {filteredNodes.length} vị trí trên Tầng {activeFloor} • Đồng bộ thời gian thực với Bảng Tổng quan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/*Chon Tang 1 / Tang 2 */}
            <div
              className={`inline-flex rounded-xl p-1 border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {[1, 2].map((fl) => (
                <button
                  key={fl}
                  type="button"
                  onClick={() => setActiveFloor(fl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeFloor === fl
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Tầng {fl}
                </button>
              ))}
            </div>

            {/* Nut bat Che do Keo tha Toa do (Chi danh cho SYS_ADMIN) */}
            {isSysAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setIsAdminDragMode(!isAdminDragMode)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                    isAdminDragMode
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Move className="w-3.5 h-3.5" />
                  {isAdminDragMode ? 'Đang bật Kéo thả (Admin)' : 'Kéo thả Tọa độ (Admin)'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddNodeModal(!showAddNodeModal)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Thêm Vị trí Mới
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hang Bo loc: Tim kiem, Khu vuc, Trang thai, Thiet bi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã bàn (A-01, M-01)..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputSurfaceClass}`}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${inputSurfaceClass}`}
            >
              <option value="ALL">Tất cả khu vực</option>
              <option value="DESK_POD">Bàn cá nhân (Desk Pod)</option>
              <option value="MEETING_ROOM">Phòng họp (Meeting Room)</option>
              <option value="FOCUS_BOOTH">Bốt yên tĩnh (Focus Booth)</option>
              <option value="COLLAB_HUB">Khu thảo luận (Collab Hub)</option>
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
              <option value="HOLDING">Đang giữ chỗ 5p (Holding)</option>
              <option value="RESERVED">Đã đặt trước (Reserved)</option>
              <option value="OCCUPIED">Đang sử dụng (Occupied)</option>
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

        {/* Form Them Vi tri Moi cho Admin */}
        {isSysAdmin && showAddNodeModal && (
          <form
            onSubmit={handleAddNodeSubmit}
            className={`mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div>
              <label className="block text-[11px] font-bold mb-1">Mã vị trí *</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${inputSurfaceClass}`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Tên bàn / phòng *</label>
              <input
                type="text"
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${inputSurfaceClass}`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Phân khu</label>
              <select
                value={newZone}
                onChange={(e) => setNewZone(e.target.value as WorkspaceZoneType)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${inputSurfaceClass}`}
              >
                <option value="DESK_POD">DESK_POD</option>
                <option value="MEETING_ROOM">MEETING_ROOM</option>
                <option value="FOCUS_BOOTH">FOCUS_BOOTH</option>
                <option value="COLLAB_HUB">COLLAB_HUB</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Thiết bị gắn kèm</label>
              <input
                type="text"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${inputSurfaceClass}`}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Lưu vào Sơ đồ
              </button>
            </div>
          </form>
        )}
      </div>

      {/* KHUNG BAN DO 2D & BANG THONG SO CHI TIET BEN PHAI */}
      <FloorplanCanvasLayout
        mapViewportSlot={
          <InteractiveMap2D
            workspaceNodes={filteredNodes}
            selectedNodeId={selectedNode?.nodeId || null}
            isDark={isDark}
            isAdminDragMode={isAdminDragMode}
            activeFloor={activeFloor}
            onSelectWorkspaceNode={onSelectNode}
            onCommitNodeCoordinates={onUpdateNodeCoords}
          />
        }
        sideControlSlot={
          <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${cardSurfaceClass}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/70 dark:border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                Thông số Vị trí Đang chọn
              </h3>
              {selectedNode && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Tầng {selectedNode.floorLevel}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold">{selectedNode.nodeLabel}</span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {selectedNode.nodeCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Mã định danh: <code>{selectedNode.nodeId}</code>
                  </p>
                </div>

                <div
                  className={`grid grid-cols-2 gap-2.5 p-3 rounded-xl border text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <div>
                    <span className="text-slate-400 block text-[11px]">Loại không gian</span>
                    <strong className="font-bold">{selectedNode.zoneType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sức chứa chuẩn</span>
                    <strong className="font-bold">{selectedNode.capacityCount} người</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tọa độ Mặt bằng 2D</span>
                    <strong className="font-bold text-blue-600 dark:text-blue-400">
                      X: {selectedNode.position2D.posX}, Y: {selectedNode.position2D.posY}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Điểm Tương thích AI</span>
                    <strong className="font-bold text-teal-600 dark:text-teal-400">
                      {selectedNode.aiScore || 92}/100
                    </strong>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold mb-2">Thiết bị Dùng chung Gắn kèm:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.amenitiesList.map((item) => (
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
                </div>

                {/* Nut Dat cho nhanh */}
                <button
                  type="button"
                  disabled={selectedNode.status !== 'AVAILABLE'}
                  onClick={() => onTriggerQuickBooking(selectedNode)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-teal-600 hover:bg-teal-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedNode.status === 'AVAILABLE'
                    ? 'Giữ chỗ & Đặt ngay Vị trí Này'
                    : `Trạng thái hiện tại: ${selectedNode.status}`}
                </button>

                {/* Cong cu chuyen trang thai nhanh cho Admin */}
                {isSysAdmin && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5" /> Điều khiển Trạng thái (Quyền Admin):
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        ['AVAILABLE', 'HOLDING', 'MAINTENANCE'] as SeatStatusType[]
                      ).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => onUpdateNodeStatus(selectedNode.nodeId, st)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition ${
                            selectedNode.status === st
                              ? 'bg-blue-600 text-white border-blue-600'
                              : isDark
                              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
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
                Hãy bấm vào một bàn hoặc phòng họp trên sơ đồ 2D để xem tọa độ và đặt chỗ.
              </p>
            )}
          </div>
        }
      />
    </div>
  );
};