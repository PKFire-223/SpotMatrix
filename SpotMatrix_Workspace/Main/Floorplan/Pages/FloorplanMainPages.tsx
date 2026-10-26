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
} from 'lucide-react';
import {
  BookingPayloadItem,
  SeatStatusType,
  UserRoleType,
  WebLanguageCodeType,
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
  webLanguage?: WebLanguageCodeType;
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

// Xây dựng 28 ghế vòm Đấu trường La Mã (A1..A7, B1..B9, C1..C12) khớp 100% ảnh 2D & 3D
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

// Hàm tạo Sprite nhãn 3D sắc nét lơ lửng trên từng phòng họp (M1-01 .. M4-06)
function createRoomLabelSprite(
  roomCode: string,
  capacityCount: number,
  status: SeatStatusType,
  isSelected: boolean
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 96);
    const bgHex = isSelected
      ? '#4338ca'
      : status === 'AVAILABLE'
      ? '#0f766e'
      : status === 'HOLDING'
      ? '#b45309'
      : '#3730a3';

    ctx.fillStyle = bgHex;
    ctx.beginPath();
    ctx.roundRect(12, 12, 232, 72, 18);
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.65)';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${roomCode} (${capacityCount}P)`, 128, 52);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 16px Inter, Arial, sans-serif';
    const statusLabel =
      status === 'AVAILABLE'
        ? 'CÒN TRỐNG'
        : status === 'HOLDING'
        ? 'CHỜ DUYỆT'
        : 'ĐÃ ĐẶT / BẬN';
    ctx.fillText(statusLabel, 128, 74);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.35, 0.88, 1);
  return sprite;
}

const STANDARD_TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: 'Ca 1: 08:00 – 10:00' },
  { start: '10:00', end: '12:00', label: 'Ca 2: 10:00 – 12:00' },
  { start: '13:00', end: '15:00', label: 'Ca 3: 13:00 – 15:00' },
  { start: '15:00', end: '17:00', label: 'Ca 4: 15:00 – 17:00' },
  { start: '17:00', end: '19:00', label: 'Ca 5: 17:00 – 19:00' },
];

const DEFAULT_CAMERA_SPHERICAL = {
  theta: 0.48,
  phi: 0.84,
  radius: 16.2,
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
      if (b.startTimeIso < selectedSlot.end && b.endTimeIso > selectedSlot.start) {
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
        text: `Đã chọn ghế ${seatCode} tham gia sự kiện "${approvedEvent.purposeNote}" (${selectedSlot.start} – ${selectedSlot.end}). Bấm nút "Đặt Ghế ${seatCode}" ở cột bên phải để nhận mã QR!`,
      });
    },
    [currentSlotHallEventInfo, selectedSlot, userRole, userDepartment]
  );

  // ============================================================================
  // THREE.JS 3D ENGINE VỚI MÔ HÌNH PHÒNG HỌP CHI TIẾT (VÁCH KÍNH, BÀN, GHẾ, TV 4K)
  // ============================================================================
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
    cam.lookAt(0, 0.45, 0);
    renderer.render(scene, cam);
  }, []);

  // Hàm Lia Camera mượt mà về Góc nhìn chuẩn ngay lập tức khi bấm nút
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
    const height = 440;

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

    // Hệ thống ánh sáng kiến trúc 3 điểm
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.78 : 0.92);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.88);
    dirLight.position.set(12, 20, 14);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 0.32);
    fillLight.position.set(-10, 12, -10);
    scene.add(fillLight);

    // Mặt sàn chính & Lưới tọa độ
    const floorGeo = new THREE.PlaneGeometry(18.5, 13.5);
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

    // Tường bao quanh tòa nhà
    const wallMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x334155 : 0x94a3b8,
      roughness: 0.55,
    });
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(18.6, 1.9, 0.32),
      wallMat
    );
    backWall.position.set(0, 0.95, -6.6);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 1.9, 13.4),
      wallMat
    );
    leftWall.position.set(-9.15, 0.95, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 1.9, 13.4),
      wallMat
    );
    rightWall.position.set(9.15, 0.95, 0);
    scene.add(rightWall);

    interactiveMeshesRef.current = [];

    if (selectedFloor === 5) {
      // MÔ HÌNH 3D TẦNG 5: ĐẤU TRƯỜNG LA MÃ (SÂN KHẤU TRÒN + MÀN HÌNH CONG PANORAMA + 28 GHẾ VÒM)
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

        const chairBack = new THREE.Mesh(
          new THREE.BoxGeometry(0.54, 0.38, 0.12),
          new THREE.MeshStandardMaterial({ color: seatColor })
        );
        chairBack.position.set(0, seat.worldY + 0.34, -0.22);
        group.add(chairBack);

        group.lookAt(0, seat.worldY, 1.6);
        scene.add(group);

        interactiveMeshesRef.current.push({
          mesh: group,
          nodeCode: seat.seatCode,
          isHallSeat: true,
        });
      });
    } else {
      // ====================================================================
      // MÔ HÌNH 3D TẦNG 1 - 4 CHI TIẾT ĐẦY ĐỦ:
      // Thảm hành lang trung tâm + 6 Phòng họp Kính cường lực + Bàn Dài/Tròn
      // + Ghế xoay quanh bàn theo đúng sức chứa + Màn hình TV 4K + Nhãn 3D nổi
      // ====================================================================
      const corridorCarpet = new THREE.Mesh(
        new THREE.PlaneGeometry(17.4, 1.75),
        new THREE.MeshStandardMaterial({
          color: isDark ? 0x1e1b4b : 0xe0e7ff,
          roughness: 0.9,
        })
      );
      corridorCarpet.rotation.x = -Math.PI / 2;
      corridorCarpet.position.set(0, 0.02, 0);
      scene.add(corridorCarpet);

      currentFloorNodes.forEach((room, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const posX = (col - 1) * 5.4;
        const posZ = row === 0 ? -3.45 : 3.45;
        const isTopRow = row === 0;

        const isSelected = selectedNode?.nodeCode === room.nodeCode;
        const statusColor =
          room.status === 'AVAILABLE'
            ? 0x0d9488
            : room.status === 'HOLDING'
            ? 0xd97706
            : 0x4f46e5;

        const roomGroup = new THREE.Group();
        roomGroup.position.set(posX, 0, posZ);

        // 1. Nền sàn gỗ/thảm riêng cho từng phòng + viền phát sáng theo trạng thái
        const roomW = 4.6;
        const roomD = 3.9;
        const basePlatform = new THREE.Mesh(
          new THREE.BoxGeometry(roomW, 0.14, roomD),
          new THREE.MeshStandardMaterial({
            color: isSelected
              ? isDark
                ? 0x312e81
                : 0xe0e7ff
              : isDark
              ? 0x0f172a
              : 0xffffff,
            roughness: 0.6,
          })
        );
        basePlatform.position.y = 0.07;
        roomGroup.add(basePlatform);

        // Viền LED chỉ thị trạng thái quanh đế phòng
        const borderStrip = new THREE.Mesh(
          new THREE.BoxGeometry(roomW + 0.08, 0.06, roomD + 0.08),
          new THREE.MeshStandardMaterial({
            color: statusColor,
            emissive: statusColor,
            emissiveIntensity: isSelected ? 0.55 : 0.22,
          })
        );
        borderStrip.position.y = 0.03;
        roomGroup.add(borderStrip);

        // 2. Vách kính cường lực 4 mặt (có chừa cửa ra vào hướng ra hành lang trung tâm)
        const glassHeight = 1.45;
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: isSelected ? 0x818cf8 : 0x93c5fd,
          transparent: true,
          opacity: isSelected ? 0.34 : 0.22,
          roughness: 0.15,
          metalness: 0.1,
        });
        const frameMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0x4f46e5 : isDark ? 0x475569 : 0x64748b,
          metalness: 0.5,
          roughness: 0.3,
        });

        const outerGlassZ = isTopRow ? -roomD / 2 : roomD / 2;
        const innerCorridorZ = isTopRow ? roomD / 2 : -roomD / 2;

        const backGlass = new THREE.Mesh(
          new THREE.BoxGeometry(roomW, glassHeight, 0.06),
          glassMat
        );
        backGlass.position.set(0, glassHeight / 2 + 0.14, outerGlassZ);
        roomGroup.add(backGlass);

        const leftGlass = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, glassHeight, roomD),
          glassMat
        );
        leftGlass.position.set(-roomW / 2, glassHeight / 2 + 0.14, 0);
        roomGroup.add(leftGlass);

        const rightGlass = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, glassHeight, roomD),
          glassMat
        );
        rightGlass.position.set(roomW / 2, glassHeight / 2 + 0.14, 0);
        roomGroup.add(rightGlass);

        // Vách kính mặt hành lang (chừa cửa 1.25m ở giữa)
        const frontGlassSegmentW = (roomW - 1.25) / 2;
        const frontLeftGlass = new THREE.Mesh(
          new THREE.BoxGeometry(frontGlassSegmentW, glassHeight, 0.06),
          glassMat
        );
        frontLeftGlass.position.set(
          -roomW / 2 + frontGlassSegmentW / 2,
          glassHeight / 2 + 0.14,
          innerCorridorZ
        );
        roomGroup.add(frontLeftGlass);

        const frontRightGlass = new THREE.Mesh(
          new THREE.BoxGeometry(frontGlassSegmentW, glassHeight, 0.06),
          glassMat
        );
        frontRightGlass.position.set(
          roomW / 2 - frontGlassSegmentW / 2,
          glassHeight / 2 + 0.14,
          innerCorridorZ
        );
        roomGroup.add(frontRightGlass);

        // 4 cột trụ nhôm góc phòng
        [
          [-roomW / 2, -roomD / 2],
          [roomW / 2, -roomD / 2],
          [-roomW / 2, roomD / 2],
          [roomW / 2, roomD / 2],
        ].forEach(([cx, cz]) => {
          const pillar = new THREE.Mesh(
            new THREE.BoxGeometry(0.11, glassHeight + 0.08, 0.11),
            frameMat
          );
          pillar.position.set(cx, glassHeight / 2 + 0.14, cz);
          roomGroup.add(pillar);
        });

        // 3. Màn hình Hội nghị 4K gắn trên vách trong của mỗi phòng
        const tvBoard = new THREE.Mesh(
          new THREE.BoxGeometry(1.75, 0.78, 0.08),
          new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.2,
          })
        );
        tvBoard.position.set(
          0,
          0.98,
          isTopRow ? outerGlassZ + 0.09 : outerGlassZ - 0.09
        );
        roomGroup.add(tvBoard);

        const tvScreenGlow = new THREE.Mesh(
          new THREE.BoxGeometry(1.62, 0.66, 0.09),
          new THREE.MeshStandardMaterial({
            color: statusColor,
            emissive: statusColor,
            emissiveIntensity: 0.35,
          })
        );
        tvScreenGlow.position.copy(tvBoard.position);
        roomGroup.add(tvScreenGlow);

        // 4. Bàn Họp Trung Tâm (Bàn tròn cho COLLAB_HUB 04/05, Bàn dài Boardroom cho các phòng còn lại)
        const isRoundTable =
          room.zoneType === 'COLLAB_HUB' ||
          room.nodeCode.endsWith('-04') ||
          room.nodeCode.endsWith('-05');

        if (isRoundTable) {
          const roundTop = new THREE.Mesh(
            new THREE.CylinderGeometry(1.12, 1.12, 0.1, 32),
            new THREE.MeshStandardMaterial({
              color: isDark ? 0xcbd5e1 : 0xf8fafc,
              roughness: 0.35,
            })
          );
          roundTop.position.set(0, 0.62, 0);
          roomGroup.add(roundTop);

          const roundAccent = new THREE.Mesh(
            new THREE.CylinderGeometry(0.48, 0.48, 0.12, 24),
            new THREE.MeshStandardMaterial({ color: statusColor })
          );
          roundAccent.position.set(0, 0.63, 0);
          roomGroup.add(roundAccent);

          const centerPedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.38, 0.48, 20),
            frameMat
          );
          centerPedestal.position.set(0, 0.36, 0);
          roomGroup.add(centerPedestal);
        } else {
          const tableW =
            room.capacityCount >= 10
              ? 2.55
              : room.capacityCount >= 6
              ? 2.15
              : 1.65;
          const tableD = room.capacityCount >= 10 ? 1.35 : 1.15;

          const rectTop = new THREE.Mesh(
            new THREE.BoxGeometry(tableW, 0.1, tableD),
            new THREE.MeshStandardMaterial({
              color: isDark ? 0xcbd5e1 : 0xf8fafc,
              roughness: 0.35,
            })
          );
          rectTop.position.set(0, 0.62, 0);
          roomGroup.add(rectTop);

          const tableRunner = new THREE.Mesh(
            new THREE.BoxGeometry(tableW * 0.72, 0.11, tableD * 0.36),
            new THREE.MeshStandardMaterial({ color: statusColor })
          );
          tableRunner.position.set(0, 0.625, 0);
          roomGroup.add(tableRunner);

          [
            [-tableW * 0.38, -tableD * 0.34],
            [tableW * 0.38, -tableD * 0.34],
            [-tableW * 0.38, tableD * 0.34],
            [tableW * 0.38, tableD * 0.34],
          ].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.06, 0.48, 12),
              frameMat
            );
            leg.position.set(lx, 0.36, lz);
            roomGroup.add(leg);
          });
        }

        // 5. Ghế xoay văn phòng xếp quanh bàn đúng theo sức chứa (capacityCount)
        const chairCount = Math.min(12, Math.max(2, room.capacityCount));
        const chairMat = new THREE.MeshStandardMaterial({
          color: statusColor,
          roughness: 0.45,
        });

        for (let cIdx = 0; cIdx < chairCount; cIdx++) {
          const chairGroup = new THREE.Group();
          const seatPad = new THREE.Mesh(
            new THREE.BoxGeometry(0.36, 0.08, 0.36),
            chairMat
          );
          seatPad.position.y = 0.42;
          chairGroup.add(seatPad);

          const backRest = new THREE.Mesh(
            new THREE.BoxGeometry(0.36, 0.34, 0.07),
            chairMat
          );
          backRest.position.set(0, 0.6, -0.15);
          chairGroup.add(backRest);

          const chairStem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.08, 0.28, 10),
            frameMat
          );
          chairStem.position.y = 0.26;
          chairGroup.add(chairStem);

          if (isRoundTable) {
            const angle = (cIdx / chairCount) * Math.PI * 2;
            const radius = 1.48;
            chairGroup.position.set(
              Math.cos(angle) * radius,
              0,
              Math.sin(angle) * radius
            );
            chairGroup.lookAt(0, 0.42, 0);
          } else {
            const half = Math.ceil(chairCount / 2);
            const isFrontSide = cIdx < half;
            const sideIndex = isFrontSide ? cIdx : cIdx - half;
            const countOnSide = isFrontSide ? half : chairCount - half;
            const spanW = room.capacityCount >= 10 ? 2.1 : 1.5;
            const offsetX =
              countOnSide <= 1
                ? 0
                : -spanW / 2 + (sideIndex / (countOnSide - 1)) * spanW;
            const offsetZ = isFrontSide ? -0.92 : 0.92;
            chairGroup.position.set(offsetX, 0, offsetZ);
            chairGroup.lookAt(offsetX, 0.42, 0);
          }

          roomGroup.add(chairGroup);
        }

        // 6. Nhãn 3D nổi hiển thị mã phòng và sức chứa
        const labelSprite = createRoomLabelSprite(
          room.nodeCode,
          room.capacityCount,
          room.status,
          isSelected
        );
        labelSprite.position.set(0, 2.05, 0);
        roomGroup.add(labelSprite);

        scene.add(roomGroup);
        interactiveMeshesRef.current.push({
          mesh: roomGroup,
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
        let hitObj: THREE.Object3D | null = hits[0].object;
        let found:
          | { mesh: THREE.Object3D; nodeCode: string; isHallSeat?: boolean }
          | undefined;
        while (hitObj && !found) {
          found = interactiveMeshesRef.current.find(
            (item) => item.mesh === hitObj
          );
          hitObj = hitObj.parent;
        }
        if (found) {
          if (found.isHallSeat) {
            handleSelectColosseumSeat(found.nodeCode);
          } else {
            const matchedNode = workspaceNodes.find(
              (n) => n.nodeCode === found!.nodeCode
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
    currentFloorNodes,
    selectedNode,
    selectedHallSeatCode,
    bookedHallSeatCodes,
    currentSlotHallEventInfo,
    isDark,
    workspaceNodes,
    onSelectNode,
    handleSelectColosseumSeat,
    syncCameraPositionAndRender,
  ]);

  const hallNodeItem = useMemo(() => {
    return (
      workspaceNodes.find((n) => n.nodeCode === 'H-01' || n.floorLevel === 5) ||
      workspaceNodes[0]
    );
  }, [workspaceNodes]);

  const activeRightPanelNode =
    selectedFloor === 5
      ? hallNodeItem
      : selectedNode && selectedNode.floorLevel === selectedFloor
      ? selectedNode
      : currentFloorNodes[0] || workspaceNodes[0];

  const canRentWholeHall = userRole === 'SYS_ADMIN' || userRole === 'MANAGER';
  const hasApprovedHallEventInSlot = Boolean(
    currentSlotHallEventInfo.approvedEvent
  );

  return (
    <div className="space-y-5">
      {/* Thanh Chọn Tầng 1..5 & Chuyển đổi 3D / 2D */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((fl) => {
            const isSelectedFl = selectedFloor === fl;
            return (
              <button
                key={fl}
                type="button"
                onClick={() => {
                  setSelectedFloor(fl);
                  setHallSeatAlertMessage(null);
                  const firstNodeOnFloor = workspaceNodes.find(
                    (n) => n.floorLevel === fl
                  );
                  if (firstNodeOnFloor) {
                    onSelectNode(firstNodeOnFloor);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                  isSelectedFl
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {fl === 5 ? 'Tầng 5 • Hội trường La Mã' : `Tầng ${fl}`}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewDimension('3D')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              viewDimension === '3D'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Mô hình 3D Tương tác</span>
          </button>

          <button
            type="button"
            onClick={() => setViewDimension('2D')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              viewDimension === '2D'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Bản vẽ Mặt bằng 2D</span>
          </button>
        </div>
      </div>

      {/* Bố cục chính: Cột Trái (Canvas 3D / Bản vẽ 2D) + Cột Phải (Điều phối Đặt phòng / Hội trường 2 chế độ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`lg:col-span-8 p-5 rounded-3xl border flex flex-col justify-between ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-indigo-600 text-white flex items-center gap-1">
                  <Box className="w-3 h-3" />
                  {viewDimension === '3D'
                    ? `Mô hình 3D Tầng ${selectedFloor} — ${
                        selectedFloor === 5
                          ? 'Hội trường Đấu Trường La Mã'
                          : 'Khu Phòng họp Kính 3D Chuẩn'
                      }`
                    : `Bản vẽ 2D Tầng ${selectedFloor} — ${
                        selectedFloor === 5
                          ? 'Hội trường Lớn (Tầng 5)'
                          : '6 Phòng họp Chuẩn'
                      }`}
                </span>
                <span className="text-xs text-slate-400">
                  Giữ chuột trái xoay 360° • Click vào từng phòng/ghế để xem Slot trống
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                  Còn trống
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Giữ / Chờ duyệt
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  Đã đặt
                </span>

                {viewDimension === '3D' ? (
                  <button
                    type="button"
                    onClick={handleSmoothResetStandardCamera}
                    className={`px-3 py-1 rounded-lg border text-xs font-extrabold inline-flex items-center gap-1.5 transition shadow-sm ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700'
                        : 'bg-white border-slate-200 text-indigo-700 hover:bg-indigo-50'
                    }`}
                    title="Lia camera mượt mà về lại Góc nhìn chuẩn mặc định"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Góc nhìn chuẩn</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setZoom2D((z) =>
                          Math.max(0.75, Number((z - 0.1).toFixed(2)))
                        )
                      }
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] px-1.5">
                      {Math.round(zoom2D * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setZoom2D((z) =>
                          Math.min(1.4, Number((z + 0.1).toFixed(2)))
                        )
                      }
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedFloor === 5 && hallSeatAlertMessage && (
            <div
              className={`mb-3 p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
                hallSeatAlertMessage.type === 'WARNING'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                  : 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300'
              }`}
            >
              {hallSeatAlertMessage.type === 'WARNING' ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="font-semibold leading-relaxed">
                {hallSeatAlertMessage.text}
              </div>
            </div>
          )}

          {viewDimension === '3D' ? (
            <div
              ref={mount3DRef}
              className="w-full h-[440px] rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800 cursor-grab active:cursor-grabbing"
            />
          ) : (
            <div className="w-full h-[440px] rounded-2xl overflow-auto border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-2">
              <svg
                viewBox="0 0 800 460"
                className="w-full h-full max-w-[780px] transition-transform"
                style={{ transform: `scale(${zoom2D})` }}
              >
                {selectedFloor === 5 ? (
                  <>
                    <rect
                      x="20"
                      y="15"
                      width="760"
                      height="430"
                      rx="22"
                      fill={isDark ? '#0f172a' : '#f8fafc'}
                      stroke={isDark ? '#334155' : '#cbd5e1'}
                      strokeWidth="2"
                    />
                    <text
                      x="400"
                      y="42"
                      textAnchor="middle"
                      fill={isDark ? '#94a3b8' : '#475569'}
                      fontSize="12"
                      fontWeight="800"
                    >
                      HỘI TRƯỜNG ĐẤU TRƯỜNG LA MÃ H-01 (3 HÀNG GHẾ VÒM A, B, C & SÂN KHẤU TRUNG TÂM)
                    </text>

                    {[112, 162, 214].map((r, idx) => (
                      <path
                        key={r}
                        d={`M ${400 - r} 305 A ${r} ${r} 0 0 1 ${400 + r} 305`}
                        fill="none"
                        stroke={isDark ? '#1e293b' : '#e2e8f0'}
                        strokeWidth="18"
                        strokeDasharray={idx === 1 ? '6 4' : undefined}
                      />
                    ))}

                    {COLOSSEUM_SEATS_LIST.map((seat) => {
                      const isBooked = bookedHallSeatCodes.has(seat.seatCode);
                      const isSelected = selectedHallSeatCode === seat.seatCode;
                      const fillHex = isSelected
                        ? '#4f46e5'
                        : isBooked
                        ? '#4338ca'
                        : !hasApprovedHallEventInSlot
                        ? '#94a3b8'
                        : '#0d9488';

                      return (
                        <g
                          key={seat.seatCode}
                          onClick={() => handleSelectColosseumSeat(seat.seatCode)}
                          className="cursor-pointer"
                        >
                          <rect
                            x={seat.svgX - 18}
                            y={seat.svgY - 14}
                            width="36"
                            height="28"
                            rx="7"
                            fill={fillHex}
                            stroke={isSelected ? '#ffffff' : 'none'}
                            strokeWidth="2.5"
                          />
                          <text
                            x={seat.svgX}
                            y={seat.svgY + 4}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="800"
                          >
                            {seat.shortLabel}
                          </text>
                        </g>
                      );
                    })}

                    <circle
                      cx="400"
                      cy="315"
                      r="56"
                      fill="#0f172a"
                      stroke="#10b981"
                      strokeWidth="4"
                    />
                    <text
                      x="400"
                      y="312"
                      textAnchor="middle"
                      fill="#34d399"
                      fontSize="11"
                      fontWeight="800"
                    >
                      SÂN KHẤU TRÒN
                    </text>
                    <text
                      x="400"
                      y="328"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                    >
                      Bục Diễn Giả 360°
                    </text>

                    <rect
                      x="250"
                      y="390"
                      width="300"
                      height="28"
                      rx="8"
                      fill="#1e3a8a"
                    />
                    <text
                      x="400"
                      y="408"
                      textAnchor="middle"
                      fill="#93c5fd"
                      fontSize="10"
                      fontWeight="800"
                    >
                      MÀN HÌNH LED CONG PANORAMA 360°
                    </text>
                  </>
                ) : (
                  <>
                    <rect
                      x="20"
                      y="15"
                      width="760"
                      height="430"
                      rx="22"
                      fill={isDark ? '#0f172a' : '#f8fafc'}
                      stroke={isDark ? '#334155' : '#cbd5e1'}
                      strokeWidth="2"
                    />
                    <rect
                      x="30"
                      y="208"
                      width="740"
                      height="44"
                      fill={isDark ? '#1e293b' : '#f1f5f9'}
                    />
                    <text
                      x="400"
                      y="234"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="11"
                      fontWeight="700"
                      letterSpacing="2"
                    >
                      HÀNH LANG GIAO THÔNG TRUNG TÂM TẦNG {selectedFloor}
                    </text>

                    {currentFloorNodes.map((room, idx) => {
                      const col = idx % 3;
                      const row = Math.floor(idx / 3);
                      const rx = 45 + col * 245;
                      const ry = row === 0 ? 32 : 268;
                      const isSel = selectedNode?.nodeCode === room.nodeCode;
                      const badgeColor =
                        room.status === 'AVAILABLE'
                          ? '#0d9488'
                          : room.status === 'HOLDING'
                          ? '#d97706'
                          : '#4f46e5';

                      return (
                        <g
                          key={room.nodeCode}
                          onClick={() => onSelectNode(room)}
                          className="cursor-pointer"
                        >
                          <rect
                            x={rx}
                            y={ry}
                            width="220"
                            height="155"
                            rx="16"
                            fill={isDark ? '#1e293b' : '#ffffff'}
                            stroke={isSel ? '#4f46e5' : badgeColor}
                            strokeWidth={isSel ? '3.5' : '2'}
                          />
                          <rect
                            x={rx + 14}
                            y={ry + 14}
                            width="64"
                            height="24"
                            rx="6"
                            fill={badgeColor}
                          />
                          <text
                            x={rx + 46}
                            y={ry + 30}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="800"
                          >
                            {room.nodeCode}
                          </text>
                          <text
                            x={rx + 195}
                            y={ry + 30}
                            textAnchor="end"
                            fill="#64748b"
                            fontSize="11"
                            fontWeight="700"
                          >
                            {room.capacityCount} chỗ
                          </text>
                          <text
                            x={rx + 16}
                            y={ry + 62}
                            fill={isDark ? '#f1f5f9' : '#1e293b'}
                            fontSize="12"
                            fontWeight="800"
                          >
                            {room.nodeLabel.slice(0, 26)}
                          </text>
                          <rect
                            x={rx + 55}
                            y={ry + 85}
                            width="110"
                            height="46"
                            rx="10"
                            fill={badgeColor}
                            fillOpacity="0.18"
                            stroke={badgeColor}
                            strokeWidth="1.5"
                          />
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>
            </div>
          )}
        </div>

        {/* Cột Phải: Điều phối Thuê cả Hội trường vs. Đặt chỗ Ghế ngồi (Tầng 5) hoặc Đặt Phòng (Tầng 1-4) */}
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
              <label className="text-xs font-extrabold mb-2 flex items-center gap-1.5">
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
                          ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-indigo-500/40'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      <span>{slot.label}</span>
                      <span className="text-[10px] font-extrabold uppercase">
                        {isSlotSelected ? 'Đang chọn' : 'Chọn ca'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedFloor === 5 && (
              <div
                className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                  hasApprovedHallEventInSlot
                    ? 'bg-teal-500/10 border-teal-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="font-extrabold flex items-center justify-between">
                  <span>Trạng thái Sự kiện Hội trường:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      hasApprovedHallEventInSlot
                        ? 'bg-teal-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {hasApprovedHallEventInSlot
                      ? 'ĐÃ THUÊ & DUYỆT'
                      : 'CHƯA CÓ SỰ KIỆN'}
                  </span>
                </div>

                {currentSlotHallEventInfo.approvedEvent ? (
                  <>
                    <p className="font-bold text-teal-700 dark:text-teal-300">
                      “{currentSlotHallEventInfo.approvedEvent.purposeNote}”
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Phòng ban được phép đặt ghế:{' '}
                      <strong>
                        {currentSlotHallEventInfo.approvedEvent
                          .allowedDepartments?.length
                          ? currentSlotHallEventInfo.approvedEvent.allowedDepartments.join(
                              ', '
                            )
                          : 'Tất cả phòng ban'}
                      </strong>
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                    Khung giờ {selectedSlot.start}–{selectedSlot.end} hiện chưa có
                    sự kiện nào được duyệt thuê. Ghế ngồi đang khóa cho đến khi
                    Admin hoặc Quản lý thuê Hội trường thành công.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-200/70 dark:border-slate-800">
            {selectedFloor === 5 ? (
              <>
                {canRentWholeHall ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToBookingWithSlot && hallNodeItem) {
                        onNavigateToBookingWithSlot(hallNodeItem, {
                          start: selectedSlot.start,
                          end: selectedSlot.end,
                          seatCode: 'H-01',
                          hallMode: 'HALL_EVENT_RENTAL',
                        });
                      }
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {userRole === 'SYS_ADMIN'
                        ? 'Thuê Cả Hội Trường H-01 (Tự động duyệt)'
                        : 'Đăng ký Thuê Cả Hội Trường (Chờ Admin duyệt)'}
                    </span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-[11px] text-slate-500 text-center font-semibold">
                    Vai trò Nhân viên (`EMPLOYEE`) chỉ có quyền đặt chỗ ghế ngồi, không thể thuê cả Hội trường.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!hasApprovedHallEventInSlot) {
                      handleSelectColosseumSeat(selectedHallSeatCode);
                      return;
                    }
                    if (onNavigateToBookingWithSlot && hallNodeItem) {
                      onNavigateToBookingWithSlot(hallNodeItem, {
                        start: selectedSlot.start,
                        end: selectedSlot.end,
                        seatCode: selectedHallSeatCode,
                        hallMode: 'HALL_SEAT_BOOKING',
                      });
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 ${
                    hasApprovedHallEventInSlot
                      ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-rose-500/15 hover:text-rose-600'
                  }`}
                >
                  <span>
                    {hasApprovedHallEventInSlot
                      ? `Đặt Ghế Ngồi ${selectedHallSeatCode} (${selectedSlot.start} – ${selectedSlot.end})`
                      : `Đặt Ghế ${selectedHallSeatCode} (Chưa có sự kiện)`}
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToBookingWithSlot && activeRightPanelNode) {
                    onNavigateToBookingWithSlot(activeRightPanelNode, {
                      start: selectedSlot.start,
                      end: selectedSlot.end,
                      hallMode: 'STANDARD_ROOM',
                    });
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  Đặt Phòng {activeRightPanelNode?.nodeCode} ({selectedSlot.start} –{' '}
                  {selectedSlot.end})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};