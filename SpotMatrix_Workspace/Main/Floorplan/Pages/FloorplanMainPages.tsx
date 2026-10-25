import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Map,
  Box,
  Layers,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  Building2,
  Users,
} from 'lucide-react';
import {
  BookingPayloadItem,
  SeatStatusType,
  UserRoleType,
  WorkspaceNodeItem,
  WorkspaceZoneType,
} from '../../../Shared/Types/GlobalSystemTypes';
import {
  findApprovedHallEventInSlot,
  formatIsoDateString,
} from '../../Booking/Function/Validators/BookingValidator';

export interface FloorplanMainPagesProps {
  workspaceNodes: WorkspaceNodeItem[];
  bookingsList?: BookingPayloadItem[];
  selectedNode: WorkspaceNodeItem | null;
  userRole?: UserRoleType;
  userDepartment?: string;
  isDark?: boolean;
  onSelectNode: (nodeItem: WorkspaceNodeItem) => void;
  onNavigateToBookingWithSlot?: (
    nodeItem: WorkspaceNodeItem,
    slotTime: {
      start: string;
      end: string;
      seatCode?: string;
      hallMode?: 'HALL_EVENT_RENTAL' | 'HALL_SEAT_BOOKING';
    }
  ) => void;
  onUpdateNodeCoords?: (nodeId: string, posX: number, posY: number) => void;
  onUpdateNodeStatus?: (nodeId: string, nextStatus: SeatStatusType) => void;
  onCreateNewNode?: (payload: {
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

interface ColosseumSeatSpec {
  seatCode: string;
  shortLabel: string;
  rowTier: 'A' | 'B' | 'C';
  svgX: number;
  svgY: number;
  worldX: number;
  worldY: number;
  worldZ: number;
}

function buildColosseumArcSeats(): ColosseumSeatSpec[] {
  const list: ColosseumSeatSpec[] = [];
  const tiers: Array<{
    row: 'A' | 'B' | 'C';
    count: number;
    radius2D: number;
    radius3D: number;
    height3D: number;
  }> = [
    { row: 'A', count: 7, radius2D: 112, radius3D: 3.6, height3D: 0.45 },
    { row: 'B', count: 9, radius2D: 162, radius3D: 5.2, height3D: 0.95 },
    { row: 'C', count: 12, radius2D: 214, radius3D: 6.8, height3D: 1.45 },
  ];

  const centerX = 400;
  const centerY = 305;

  tiers.forEach((tier) => {
    for (let i = 0; i < tier.count; i++) {
      const ratio = tier.count === 1 ? 0.5 : i / (tier.count - 1);
      const angleDeg = -165 + ratio * 150;
      const angleRad = (angleDeg * Math.PI) / 180;

      const svgX = Math.round(centerX + Math.cos(angleRad) * tier.radius2D);
      const svgY = Math.round(centerY + Math.sin(angleRad) * tier.radius2D);

      const worldX = Number((Math.cos(angleRad) * tier.radius3D).toFixed(2));
      const worldZ = Number((Math.sin(angleRad) * tier.radius3D).toFixed(2));

      const shortLabel = `${tier.row}${i + 1}`;
      list.push({
        seatCode: `H01-${shortLabel}`,
        shortLabel,
        rowTier: tier.row,
        svgX,
        svgY,
        worldX,
        worldY: tier.height3D,
        worldZ,
      });
    }
  });

  return list;
}

const COLOSSEUM_SEATS_LIST = buildColosseumArcSeats();

const STANDARD_TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: 'Ca 1: 08:00 – 10:00' },
  { start: '10:00', end: '12:00', label: 'Ca 2: 10:00 – 12:00' },
  { start: '13:00', end: '15:00', label: 'Ca 3: 13:00 – 15:00' },
  { start: '15:00', end: '17:00', label: 'Ca 4: 15:00 – 17:00' },
  { start: '17:00', end: '19:00', label: 'Ca 5: 17:00 – 19:00' },
];

const DEFAULT_CAMERA_SPHERICAL = {
  theta: 0.52,
  phi: 0.86,
  radius: 16.5,
};

export const FloorplanMainPages: React.FC<FloorplanMainPagesProps> = ({
  workspaceNodes,
  bookingsList = [],
  selectedNode,
  userRole = 'SYS_ADMIN',
  userDepartment = 'Product & Engineering',
  isDark = false,
  onSelectNode,
  onNavigateToBookingWithSlot,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<number>(
    selectedNode?.floorLevel || 1
  );
  const [viewDimension, setViewDimension] = useState<'3D' | '2D'>('3D');
  const [zoom2D, setZoom2D] = useState<number>(1);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  }>({ start: '13:00', end: '15:00' });
  const [selectedHallSeatCode, setSelectedHallSeatCode] =
    useState<string>('H01-A4');
  const [hallSeatAlertMessage, setHallSeatAlertMessage] = useState<{
    type: 'WARNING' | 'INFO';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (selectedNode?.floorLevel) {
      setSelectedFloor(selectedNode.floorLevel);
    }
  }, [selectedNode?.floorLevel]);

  const currentFloorNodes = useMemo(() => {
    return workspaceNodes.filter((n) => n.floorLevel === selectedFloor);
  }, [workspaceNodes, selectedFloor]);

  const todayIso = useMemo(() => formatIsoDateString(new Date()), []);

  const currentSlotHallEventInfo = useMemo(() => {
    return findApprovedHallEventInSlot(
      todayIso,
      selectedSlot.start,
      selectedSlot.end,
      bookingsList
    );
  }, [todayIso, selectedSlot, bookingsList]);

  const bookedHallSeatCodes = useMemo(() => {
    const set = new Set<string>();
    bookingsList.forEach((b) => {
      if (b.bookingStatus === 'CANCELLED' || b.approvalStatus === 'REJECTED') {
        return;
      }
      if ((b.bookingDateIso || todayIso) !== todayIso) return;
      if (!/^H01-[A-C]\d+$/i.test(b.nodeId)) return;
      if (
        b.startTimeIso < selectedSlot.end &&
        b.endTimeIso > selectedSlot.start
      ) {
        set.add(b.nodeId);
      }
    });
    return set;
  }, [bookingsList, todayIso, selectedSlot]);

  const handleSelectColosseumSeat = useCallback(
    (seatCode: string) => {
      setSelectedHallSeatCode(seatCode);
      const { approvedEvent, pendingEvent } = currentSlotHallEventInfo;

      if (!approvedEvent) {
        setHallSeatAlertMessage({
          type: 'WARNING',
          text: pendingEvent
            ? `Ghế ${seatCode}: Phòng Hội trường đang có yêu cầu thuê "${pendingEvent.purposeNote}" nhưng CHƯA ĐƯỢC ADMIN CHẤP NHẬN. Hiện chưa thể đặt ghế ngồi!`
            : `Ghế ${seatCode}: Phòng Hội trường hiện đang không có sự kiện gì để tham gia trong khung giờ (${selectedSlot.start} – ${selectedSlot.end})! Chỉ có thể đặt ghế ngồi nếu phòng đã được thuê cho hoạt động thành công.`,
        });
        return;
      }

      const allowedDepts = approvedEvent.allowedDepartments || [];
      const isDeptAllowed =
        userRole === 'SYS_ADMIN' ||
        allowedDepts.length === 0 ||
        allowedDepts.includes('ALL') ||
        allowedDepts.some(
          (d) =>
            d.trim().toLowerCase() ===
            (userDepartment || '').trim().toLowerCase()
        );

      if (!isDeptAllowed) {
        setHallSeatAlertMessage({
          type: 'WARNING',
          text: `Ghế ${seatCode}: Sự kiện "${approvedEvent.purposeNote}" chỉ dành cho phòng ban [${allowedDepts.join(
            ', '
          )}]. Phòng ban của bạn (${userDepartment}) không nằm trong danh sách tham gia!`,
        });
        return;
      }

      setHallSeatAlertMessage({
        type: 'INFO',
        text: `Đã chọn ghế ${seatCode} tham gia sự kiện "${approvedEvent.purposeNote}" (${selectedSlot.start} – ${selectedSlot.end}). Bấm nút "2. Đặt Ghế Ngồi ${seatCode}" ở cột bên phải để nhận mã QR!`,
      });
    },
    [currentSlotHallEventInfo, selectedSlot, userRole, userDepartment]
  );

  const mount3DRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cameraSphericalRef = useRef({ ...DEFAULT_CAMERA_SPHERICAL });
  const cameraTweenFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const prevPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const interactiveMeshesRef = useRef<
    Array<{ mesh: THREE.Object3D; nodeCode: string; isHallSeat?: boolean }>
  >([]);

  const syncCameraPositionAndRender = useCallback(() => {
    const cam = cameraRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    if (!cam || !renderer || !scene) return;

    const { theta, phi, radius } = cameraSphericalRef.current;
    const safePhi = Math.max(0.25, Math.min(1.42, phi));
    cam.position.x = radius * Math.sin(safePhi) * Math.sin(theta);
    cam.position.y = radius * Math.cos(safePhi);
    cam.position.z = radius * Math.sin(safePhi) * Math.cos(theta);
    cam.lookAt(0, 0.4, 0);
    renderer.render(scene, cam);
  }, []);

  // Hàm Lia Camera mượt mà về Góc nhìn chuẩn ngay lập tức khi bấm nút (Không cần di chuột!)
  const handleSmoothResetStandardCamera = useCallback(() => {
    if (cameraTweenFrameRef.current) {
      cancelAnimationFrame(cameraTweenFrameRef.current);
      cameraTweenFrameRef.current = null;
    }

    const startTheta = cameraSphericalRef.current.theta;
    const startPhi = cameraSphericalRef.current.phi;
    const startRadius = cameraSphericalRef.current.radius;

    const targetTheta = DEFAULT_CAMERA_SPHERICAL.theta;
    const targetPhi = DEFAULT_CAMERA_SPHERICAL.phi;
    const targetRadius = DEFAULT_CAMERA_SPHERICAL.radius;

    const durationMs = 420;
    const startTimeMs = performance.now();

    const animateStep = (nowMs: number) => {
      const elapsed = nowMs - startTimeMs;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);

      cameraSphericalRef.current = {
        theta: startTheta + (targetTheta - startTheta) * eased,
        phi: startPhi + (targetPhi - startPhi) * eased,
        radius: startRadius + (targetRadius - startRadius) * eased,
      };

      syncCameraPositionAndRender();

      if (progress < 1) {
        cameraTweenFrameRef.current = requestAnimationFrame(animateStep);
      } else {
        cameraTweenFrameRef.current = null;
      }
    };

    cameraTweenFrameRef.current = requestAnimationFrame(animateStep);
  }, [syncCameraPositionAndRender]);

  useEffect(() => {
    if (viewDimension !== '3D') return;
    const container = mount3DRef.current;
    if (!container) return;

    const width = container.clientWidth || 720;
    const height = 430;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x0b1120 : 0xf1f5f9);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.75 : 0.92);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(10, 18, 12);
    scene.add(dirLight);

    const floorGeo = new THREE.PlaneGeometry(18, 13);
    const floorMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0xe2e8f0,
      roughness: 0.85,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    scene.add(floorMesh);

    const gridHelper = new THREE.GridHelper(
      18,
      18,
      isDark ? 0x334155 : 0xcbd5e1,
      isDark ? 0x1e293b : 0xf8fafc
    );
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    const wallMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x334155 : 0x94a3b8,
      roughness: 0.6,
    });
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(18.2, 1.8, 0.35),
      wallMat
    );
    backWall.position.set(0, 0.9, -6.5);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 1.8, 13.2),
      wallMat
    );
    leftWall.position.set(-9, 0.9, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 1.8, 13.2),
      wallMat
    );
    rightWall.position.set(9, 0.9, 0);
    scene.add(rightWall);

    interactiveMeshesRef.current = [];

    if (selectedFloor === 5) {
      const stageBase = new THREE.Mesh(
        new THREE.CylinderGeometry(2.1, 2.3, 0.45, 40),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
      );
      stageBase.position.set(0, 0.23, 1.6);
      scene.add(stageBase);

      const stageRing = new THREE.Mesh(
        new THREE.TorusGeometry(2.15, 0.09, 16, 48),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.35,
        })
      );
      stageRing.rotation.x = Math.PI / 2;
      stageRing.position.set(0, 0.46, 1.6);
      scene.add(stageRing);

      const podium = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.65, 0.65),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })
      );
      podium.position.set(0, 0.72, 1.6);
      scene.add(podium);

      const screenGeo = new THREE.CylinderGeometry(
        3.8,
        3.8,
        1.55,
        32,
        1,
        true,
        -Math.PI * 0.38,
        Math.PI * 0.76
      );
      const screenMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        side: THREE.DoubleSide,
        roughness: 0.25,
      });
      const curvedScreen = new THREE.Mesh(screenGeo, screenMat);
      curvedScreen.position.set(0, 1.25, 3.6);
      scene.add(curvedScreen);

      COLOSSEUM_SEATS_LIST.forEach((seat) => {
        const isTaken = bookedHallSeatCodes.has(seat.seatCode);
        const isSelected = selectedHallSeatCode === seat.seatCode;
        const hasEvent = Boolean(currentSlotHallEventInfo.approvedEvent);

        const group = new THREE.Group();
        group.position.set(seat.worldX, 0, seat.worldZ + 1.4);

        const stepBlock = new THREE.Mesh(
          new THREE.BoxGeometry(0.92, seat.worldY, 0.92),
          new THREE.MeshStandardMaterial({
            color: isSelected ? 0xc7d2fe : 0xcbd5e1,
          })
        );
        stepBlock.position.y = seat.worldY / 2;
        group.add(stepBlock);

        const seatColor = isSelected
          ? 0x4f46e5
          : isTaken
          ? 0x4338ca
          : !hasEvent
          ? 0x64748b
          : 0x0d9488;

        const chairCushion = new THREE.Mesh(
          new THREE.BoxGeometry(0.54, 0.26, 0.54),
          new THREE.MeshStandardMaterial({ color: seatColor })
        );
        chairCushion.position.y = seat.worldY + 0.14;
        group.add(chairCushion);

        group.lookAt(0, seat.worldY, 1.6);
        scene.add(group);

        interactiveMeshesRef.current.push({
          mesh: chairCushion,
          nodeCode: seat.seatCode,
          isHallSeat: true,
        });
      });
    } else {
      currentFloorNodes.forEach((room, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const posX = (col - 1) * 5.4;
        const posZ = row === 0 ? -2.8 : 2.8;

        const isSelected = selectedNode?.nodeCode === room.nodeCode;
        const statusColor =
          room.status === 'AVAILABLE'
            ? 0x0d9488
            : room.status === 'HOLDING'
            ? 0xd97706
            : 0x4f46e5;

        const roomGroup = new THREE.Group();
        roomGroup.position.set(posX, 0, posZ);

        const basePlatform = new THREE.Mesh(
          new THREE.BoxGeometry(4.2, 0.18, 3.6),
          new THREE.MeshStandardMaterial({
            color: isSelected ? 0xc7d2fe : isDark ? 0x0f172a : 0xffffff,
          })
        );
        basePlatform.position.y = 0.09;
        roomGroup.add(basePlatform);

        const tableMesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.45, 1.3),
          new THREE.MeshStandardMaterial({ color: statusColor })
        );
        tableMesh.position.y = 0.42;
        roomGroup.add(tableMesh);

        scene.add(roomGroup);
        interactiveMeshesRef.current.push({
          mesh: tableMesh,
          nodeCode: room.nodeCode,
          isHallSeat: false,
        });
      });
    }

    syncCameraPositionAndRender();

    const domElem = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      if (cameraTweenFrameRef.current) {
        cancelAnimationFrame(cameraTweenFrameRef.current);
        cameraTweenFrameRef.current = null;
      }
      isDraggingRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevPointerRef.current.x;
      const dy = e.clientY - prevPointerRef.current.y;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };

      cameraSphericalRef.current.theta -= dx * 0.0085;
      cameraSphericalRef.current.phi = Math.max(
        0.28,
        Math.min(1.38, cameraSphericalRef.current.phi - dy * 0.0075)
      );
      syncCameraPositionAndRender();
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraSphericalRef.current.radius = Math.max(
        9,
        Math.min(25, cameraSphericalRef.current.radius + e.deltaY * 0.01)
      );
      syncCameraPositionAndRender();
    };

    const onClickCanvas = (e: MouseEvent) => {
      const rect = domElem.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);

      const targets = interactiveMeshesRef.current.map((item) => item.mesh);
      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length > 0) {
        const hitObj = hits[0].object;
        const found = interactiveMeshesRef.current.find(
          (item) => item.mesh === hitObj || item.mesh.children.includes(hitObj)
        );
        if (found) {
          if (found.isHallSeat) {
            handleSelectColosseumSeat(found.nodeCode);
          } else {
            const matchedNode = workspaceNodes.find(
              (n) => n.nodeCode === found.nodeCode
            );
            if (matchedNode) {
              onSelectNode(matchedNode);
            }
          }
        }
      }
    };

    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    domElem.addEventListener('click', onClickCanvas);

    return () => {
      if (cameraTweenFrameRef.current) {
        cancelAnimationFrame(cameraTweenFrameRef.current);
      }
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      domElem.removeEventListener('click', onClickCanvas);
      renderer.dispose();
    };
  }, [
    viewDimension,
    selectedFloor,
    isDark,
    currentFloorNodes,
    selectedNode?.nodeCode,
    bookedHallSeatCodes,
    selectedHallSeatCode,
    currentSlotHallEventInfo.approvedEvent,
    syncCameraPositionAndRender,
    handleSelectColosseumSeat,
    workspaceNodes,
    onSelectNode,
  ]);

  const activeRightPanelNode = useMemo(() => {
    if (selectedFloor === 5) {
      return (
        workspaceNodes.find((n) => n.nodeCode === 'H-01') ||
        currentFloorNodes[0] ||
        selectedNode
      );
    }
    if (selectedNode && selectedNode.floorLevel === selectedFloor) {
      return selectedNode;
    }
    return currentFloorNodes[0] || selectedNode;
  }, [selectedFloor, workspaceNodes, currentFloorNodes, selectedNode]);

  return (
    <div className="space-y-5">
      <div
        className={`p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((fl) => {
            const isSelected = selectedFloor === fl;
            return (
              <button
                key={fl}
                type="button"
                onClick={() => {
                  setSelectedFloor(fl);
                  setHallSeatAlertMessage(null);
                  const firstOnFloor = workspaceNodes.find(
                    (n) => n.floorLevel === fl
                  );
                  if (firstOnFloor) onSelectNode(firstOnFloor);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500/40'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                {fl === 5 ? 'Tầng 5 • Hội trường La Mã' : `Tầng ${fl}`}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewDimension('3D')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              viewDimension === '3D'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            Mô hình 3D Tương tác
          </button>
          <button
            type="button"
            onClick={() => setViewDimension('2D')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              viewDimension === '2D'
                ? 'bg-teal-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Bản vẽ Mặt bằng 2D
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`lg:col-span-8 p-5 rounded-3xl border space-y-4 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold text-white flex items-center gap-1.5 ${
                  viewDimension === '3D' ? 'bg-indigo-600' : 'bg-teal-600'
                }`}
              >
                {viewDimension === '3D' ? (
                  <>
                    <Box className="w-3.5 h-3.5" />
                    Mô hình 3D Tầng {selectedFloor} —{' '}
                    {selectedFloor === 5
                      ? 'Hội trường Đấu trường La Mã'
                      : 'Khu Phòng họp Chuẩn'}
                  </>
                ) : (
                  <>
                    <Map className="w-3.5 h-3.5" />
                    Bản vẽ Mặt bằng 2D — Tầng {selectedFloor}{' '}
                    {selectedFloor === 5
                      ? '(Hội trường Đấu trường La Mã)'
                      : '(6 Phòng họp)'}
                  </>
                )}
              </span>
              <span className="text-xs text-slate-400">
                Giữ chuột trái xoay 360° • Click vào từng phòng/ghế để xem Slot trống
              </span>
            </div>

            {viewDimension === '2D' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoom2D((z) => Math.max(0.75, z - 0.1))}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Thu nhỏ 2D"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom2D(1)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Khôi phục tỷ lệ 100%"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom2D((z) => Math.min(1.35, z + 0.1))}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Phóng to 2D"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" />
                Còn trống
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                Giữ / Chờ duyệt
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
                Đã đặt
              </span>
              {viewDimension === '3D' && (
                <button
                  type="button"
                  onClick={handleSmoothResetStandardCamera}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-slate-200 hover:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                  Góc nhìn chuẩn
                </button>
              )}
            </div>

            {selectedFloor === 5 && (
              <span
                className={`px-3 py-1 rounded-xl text-[11px] font-extrabold ${
                  currentSlotHallEventInfo.approvedEvent
                    ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                }`}
              >
                {currentSlotHallEventInfo.approvedEvent
                  ? `★ Sự kiện đang mở (${selectedSlot.start}-${selectedSlot.end}): ${currentSlotHallEventInfo.approvedEvent.purposeNote}`
                  : `⚠ Ca ${selectedSlot.start}-${selectedSlot.end}: Hội trường đang không có sự kiện được duyệt`}
              </span>
            )}
          </div>

          {selectedFloor === 5 && hallSeatAlertMessage && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
                hallSeatAlertMessage.type === 'WARNING'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                  : 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {hallSeatAlertMessage.type === 'WARNING' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
                )}
                <span>{hallSeatAlertMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setHallSeatAlertMessage(null)}
                className="text-[11px] underline shrink-0"
              >
                Đóng
              </button>
            </div>
          )}

          {viewDimension === '3D' ? (
            <div
              ref={mount3DRef}
              className="w-full h-[430px] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 cursor-grab active:cursor-grabbing"
            />
          ) : (
            <div className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 p-3 overflow-auto">
              <svg
                viewBox="0 0 800 460"
                style={{
                  transform: `scale(${zoom2D})`,
                  transformOrigin: 'center center',
                }}
                className="w-full h-[410px] transition-transform duration-200 select-none"
              >
                <rect
                  x="20"
                  y="15"
                  width="760"
                  height="430"
                  rx="24"
                  fill={isDark ? '#0f172a' : '#ffffff'}
                  stroke="#6366f1"
                  strokeWidth="2.5"
                />

                {selectedFloor === 5 ? (
                  <>
                    <text
                      x="400"
                      y="52"
                      textAnchor="middle"
                      fill={isDark ? '#f8fafc' : '#0f172a'}
                      fontSize="14"
                      fontWeight="800"
                    >
                      MẶT BẰNG 2D HỘI TRƯỜNG ĐẤU TRƯỜNG LA MÃ (TẦNG 5 — 30 CHỖ)
                    </text>

                    {[112, 162, 214].map((r, idx) => (
                      <path
                        key={idx}
                        d={`M ${400 - r} 305 A ${r} ${r} 0 0 1 ${400 + r} 305`}
                        fill="none"
                        stroke={isDark ? '#1e293b' : '#e2e8f0'}
                        strokeWidth="26"
                        strokeLinecap="round"
                      />
                    ))}

                    {COLOSSEUM_SEATS_LIST.map((seat) => {
                      const isTaken = bookedHallSeatCodes.has(seat.seatCode);
                      const isSelected = selectedHallSeatCode === seat.seatCode;
                      const fillHex = isSelected
                        ? '#4f46e5'
                        : isTaken
                        ? '#4338ca'
                        : '#0d9488';

                      return (
                        <g
                          key={seat.seatCode}
                          transform={`translate(${seat.svgX}, ${seat.svgY})`}
                          onClick={() =>
                            handleSelectColosseumSeat(seat.seatCode)
                          }
                          className="cursor-pointer hover:opacity-90"
                        >
                          <circle
                            r={isSelected ? 16 : 14}
                            fill={fillHex}
                            stroke="#ffffff"
                            strokeWidth={isSelected ? 3 : 1.5}
                          />
                          <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="9.5"
                            fontWeight="800"
                          >
                            {seat.shortLabel}
                          </text>
                        </g>
                      );
                    })}

                    <circle
                      cx="400"
                      cy="305"
                      r="52"
                      fill={isDark ? '#1e1b4b' : '#eef2ff'}
                      stroke="#4f46e5"
                      strokeWidth="3"
                    />
                    <text
                      x="400"
                      y="301"
                      textAnchor="middle"
                      fill={isDark ? '#e0e7ff' : '#1e1b4b'}
                      fontSize="10"
                      fontWeight="800"
                    >
                      SÂN KHẤU TRÒN
                    </text>
                    <text
                      x="400"
                      y="316"
                      textAnchor="middle"
                      fill="#0d9488"
                      fontSize="8.5"
                      fontWeight="800"
                    >
                      SPEAKER 360°
                    </text>

                    <path
                      d="M 265 385 Q 400 412 535 385"
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <text
                      x="400"
                      y="422"
                      textAnchor="middle"
                      fill={isDark ? '#94a3b8' : '#475569'}
                      fontSize="10.5"
                      fontWeight="800"
                    >
                      MÀN HÌNH LED CONG PANORAMA 360°
                    </text>
                  </>
                ) : (
                  <>
                    <text
                      x="400"
                      y="48"
                      textAnchor="middle"
                      fill={isDark ? '#f8fafc' : '#0f172a'}
                      fontSize="14"
                      fontWeight="800"
                    >
                      MẶT BẰNG 2D KHU PHÒNG HỌP TẦNG {selectedFloor} (6 PHÒNG HỌP CHUẨN)
                    </text>

                    {currentFloorNodes.map((node, idx) => {
                      const col = idx % 3;
                      const row = Math.floor(idx / 3);
                      const x = 150 + col * 250;
                      const y = row === 0 ? 145 : 325;
                      const isSel = selectedNode?.nodeCode === node.nodeCode;
                      const fill =
                        node.status === 'AVAILABLE'
                          ? '#0d9488'
                          : node.status === 'HOLDING'
                          ? '#d97706'
                          : '#4f46e5';

                      return (
                        <g
                          key={node.nodeId}
                          transform={`translate(${x}, ${y})`}
                          onClick={() => onSelectNode(node)}
                          className="cursor-pointer"
                        >
                          <rect
                            x="-95"
                            y="-58"
                            width="190"
                            height="116"
                            rx="18"
                            fill={fill}
                            stroke={isSel ? '#0f172a' : '#ffffff'}
                            strokeWidth={isSel ? 4 : 2}
                          />
                          <text
                            x="0"
                            y="-8"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="15"
                            fontWeight="800"
                          >
                            {node.nodeCode}
                          </text>
                          <text
                            x="0"
                            y="14"
                            textAnchor="middle"
                            fill="#f1f5f9"
                            fontSize="10.5"
                            fontWeight="700"
                          >
                            {node.capacityCount} ghế • AI {node.aiScore || 95}%
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>
            </div>
          )}
        </div>

        <div
          className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between space-y-5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400">
                {selectedFloor === 5
                  ? 'Điều phối Hội trường Tầng 5 (2 Chế độ)'
                  : `Thông tin Phòng họp Tầng ${selectedFloor}`}
              </span>
              <h2
                className={`text-base font-extrabold mt-1 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {activeRightPanelNode?.nodeLabel ||
                  'Hội trường Đấu Trường La Mã (Tầng 5)'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sức chứa: {activeRightPanelNode?.capacityCount || 30} chỗ • Mã:{' '}
                <strong>{activeRightPanelNode?.nodeCode || 'H-01'}</strong>
              </p>
            </div>

            <div>
              <label className="text-xs font-extrabold block mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Chọn Khung giờ Hoạt động Hôm nay ({todayIso}):
              </label>
              <div className="space-y-1.5">
                {STANDARD_TIME_SLOTS.map((slot) => {
                  const isSlotSelected =
                    selectedSlot.start === slot.start &&
                    selectedSlot.end === slot.end;
                  return (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => {
                        setSelectedSlot({ start: slot.start, end: slot.end });
                        setHallSeatAlertMessage(null);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                        isSlotSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500/40'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      <span>{slot.label}</span>
                      <span className="text-[10px] font-extrabold">
                        {isSlotSelected ? 'Đang chọn' : 'Chọn ca'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedFloor === 5 ? (
              <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    currentSlotHallEventInfo.approvedEvent
                      ? isDark
                        ? 'bg-teal-950/30 border-teal-500/40 text-teal-200'
                        : 'bg-teal-50 border-teal-200 text-teal-900'
                      : isDark
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <p className="font-extrabold flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 shrink-0" />
                    {currentSlotHallEventInfo.approvedEvent
                      ? `Đã có Sự kiện Được Duyệt: "${currentSlotHallEventInfo.approvedEvent.purposeNote}"`
                      : 'Chưa có Sự kiện nào được duyệt trong khung giờ này'}
                  </p>
                  {currentSlotHallEventInfo.approvedEvent ? (
                    <p className="text-[11px] opacity-90">
                      Phòng ban được tham gia:{' '}
                      <strong>
                        {currentSlotHallEventInfo.approvedEvent
                          .allowedDepartments?.length
                          ? currentSlotHallEventInfo.approvedEvent.allowedDepartments.join(
                              ', '
                            )
                          : 'Tất cả Phòng ban'}
                      </strong>
                    </p>
                  ) : (
                    <p className="text-[11px] opacity-90">
                      Nhân viên chưa thể đặt ghế ngồi nếu Hội trường chưa được Admin hoặc Quản lý thuê và phê duyệt sự kiện.
                    </p>
                  )}
                </div>

                {userRole !== 'EMPLOYEE' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeRightPanelNode && onNavigateToBookingWithSlot) {
                        onNavigateToBookingWithSlot(activeRightPanelNode, {
                          start: selectedSlot.start,
                          end: selectedSlot.end,
                          hallMode: 'HALL_EVENT_RENTAL',
                        });
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    {userRole === 'SYS_ADMIN'
                      ? '1. Thuê Cả Hội Trường Tổ Chức Sự Kiện (Duyệt Ngay)'
                      : '1. Đăng Ký Thuê Cả Hội Trường (Chờ Admin Duyệt)'}
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-[11px] text-slate-400 font-semibold text-center">
                    Vai trò Nhân viên (EMPLOYEE) không có quyền thuê cả Hội trường, chỉ đặt ghế ngồi khi có sự kiện.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!currentSlotHallEventInfo.approvedEvent) {
                      setHallSeatAlertMessage({
                        type: 'WARNING',
                        text: `Phòng Hội trường hiện đang không có sự kiện gì để tham gia trong ca (${selectedSlot.start} – ${selectedSlot.end})!`,
                      });
                      return;
                    }
                    if (activeRightPanelNode && onNavigateToBookingWithSlot) {
                      onNavigateToBookingWithSlot(activeRightPanelNode, {
                        start: selectedSlot.start,
                        end: selectedSlot.end,
                        seatCode: selectedHallSeatCode,
                        hallMode: 'HALL_SEAT_BOOKING',
                      });
                    }
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition ${
                    currentSlotHallEventInfo.approvedEvent
                      ? 'bg-teal-600 hover:bg-teal-500'
                      : 'bg-slate-400 hover:bg-slate-500'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  2. Đặt Ghế Ngồi {selectedHallSeatCode} Tham Gia Sự Kiện
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (activeRightPanelNode && onNavigateToBookingWithSlot) {
                      onNavigateToBookingWithSlot(activeRightPanelNode, {
                        start: selectedSlot.start,
                        end: selectedSlot.end,
                      });
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Đặt Phòng {activeRightPanelNode?.nodeCode} ({selectedSlot.start}{' '}
                  – {selectedSlot.end})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};