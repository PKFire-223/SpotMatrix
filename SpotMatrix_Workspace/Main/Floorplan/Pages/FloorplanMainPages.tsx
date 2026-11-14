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

/**
 * Tạo hình hộp chữ nhật bo góc & vát cạnh kiến trúc (Beveled Architectural Box)
 * giúp bắt tia sáng phản xạ Specular Highlight dọc theo mọi gờ cạnh kim loại/kính/bàn ghế.
 */
function createBeveledBoxGeometry(
  width: number,
  height: number,
  depth: number,
  cornerRadius: number,
  bevelSize: number
): THREE.ExtrudeGeometry {
  const hw = Math.max(0.02, width / 2 - bevelSize);
  const hd = Math.max(0.02, depth / 2 - bevelSize);
  const r = Math.min(cornerRadius, hw * 0.45, hd * 0.45);

  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const extrudeDepth = Math.max(0.01, height - bevelSize * 2);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize,
    bevelThickness: bevelSize,
    curveSegments: 12,
  });

  geometry.rotateX(-Math.PI / 2);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Tạo bản đồ phản xạ môi trường Studio HDRI giả lập (Procedural Lightbox Environment)
 * dùng PMREMGenerator để kính cường lực, nhôm Anodized và mặt bàn có phản chiếu sắc nét.
 */
function buildInteriorStudioEnvMap(
  renderer: THREE.WebGLRenderer,
  isDarkTheme: boolean
): THREE.Texture {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(isDarkTheme ? 0x060b18 : 0xf1f5f9);

  const ceilingSoftbox = new THREE.Mesh(
    new THREE.PlaneGeometry(32, 32),
    new THREE.MeshBasicMaterial({
      color: isDarkTheme ? 0xe0f2fe : 0xffffff,
      side: THREE.DoubleSide,
    })
  );
  ceilingSoftbox.position.set(0, 16, 0);
  ceilingSoftbox.rotation.x = Math.PI / 2;
  envScene.add(ceilingSoftbox);

  const cyanStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 6),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
  );
  cyanStrip.position.set(16, 5, 8);
  cyanStrip.lookAt(0, 0, 0);
  envScene.add(cyanStrip);

  const indigoStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 6),
    new THREE.MeshBasicMaterial({ color: 0x818cf8, side: THREE.DoubleSide })
  );
  indigoStrip.position.set(-16, 6, -8);
  indigoStrip.lookAt(0, 0, 0);
  envScene.add(indigoStrip);

  const emeraldStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 5),
    new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide })
  );
  emeraldStrip.position.set(0, 8, 16);
  emeraldStrip.lookAt(0, 0, 0);
  envScene.add(emeraldStrip);

  const envTarget = pmremGenerator.fromScene(envScene, 0.03);
  pmremGenerator.dispose();
  return envTarget.texture;
}

/**
 * Tạo Texture màn hình Panorama 360° độ phân giải cao cho Hội trường La Mã H-01
 */
function createColosseumPanoramaTexture(eventTitle: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 1024, 256);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.25, '#0f172a');
    grad.addColorStop(0.5, '#0369a1');
    grad.addColorStop(0.75, '#1e1b4b');
    grad.addColorStop(1, '#064e3b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 256);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 0; x <= 1024; x += 8) {
      const y = 148 + Math.sin(x * 0.025) * 36 * Math.cos(x * 0.009);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COLOSSEUM AMPHITHEATER H-01 • PANORAMA 360° LED', 512, 78);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px Inter, Arial, sans-serif';
    ctx.fillText(eventTitle.slice(0, 56), 512, 212);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
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
    { row: 'A', count: 7, radius2D: 112, radius3D: 3.6, height3D: 0.42 },
    { row: 'B', count: 9, radius2D: 162, radius3D: 5.2, height3D: 0.88 },
    { row: 'C', count: 12, radius2D: 214, radius3D: 6.8, height3D: 1.36 },
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

// Hàm tạo Sprite nhãn 3D Retina (512x192) sắc nét lơ lửng trên từng phòng họp (M1-01 .. M4-06)
function createRoomLabelSprite(
  roomCode: string,
  capacityCount: number,
  status: SeatStatusType,
  isSelected: boolean
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 192);
    const grad = ctx.createLinearGradient(0, 0, 512, 192);
    if (isSelected) {
      grad.addColorStop(0, '#4f46e5');
      grad.addColorStop(1, '#0284c7');
    } else if (status === 'AVAILABLE') {
      grad.addColorStop(0, '#0f766e');
      grad.addColorStop(1, '#059669');
    } else if (status === 'HOLDING') {
      grad.addColorStop(0, '#b45309');
      grad.addColorStop(1, '#d97706');
    } else {
      grad.addColorStop(0, '#312e81');
      grad.addColorStop(1, '#4338ca');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(20, 20, 472, 152, 36);
    ctx.fill();

    ctx.lineWidth = isSelected ? 8 : 5;
    ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(255,255,255,0.75)';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 56px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${roomCode} • ${capacityCount}P`, 256, 98);

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = 'bold 30px Inter, Arial, sans-serif';
    const statusLabel =
      status === 'AVAILABLE'
        ? '● CÒN TRỐNG'
        : status === 'HOLDING'
        ? '◐ CHỜ DUYỆT / GIỮ 5P'
        : '■ ĐÃ ĐẶT / ĐANG HỌP';
    ctx.fillText(statusLabel, 256, 146);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.45, 0.92, 1);
  return sprite;
}

// Hàm tạo Sprite nhãn ghế La Mã 3D nhỏ gọn cho ghế đang chọn trên Tầng 5
function createSeatBadgeSprite(seatCode: string, isBooked: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = isBooked ? '#4338ca' : '#059669';
    ctx.beginPath();
    ctx.roundRect(12, 12, 232, 72, 20);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(seatCode, 128, 60);
  }
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(1.4, 0.52, 1);
  return sp;
}

const STANDARD_TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: 'Ca 1: 08:00 – 10:00' },
  { start: '10:00', end: '12:00', label: 'Ca 2: 10:00 – 12:00' },
  { start: '13:00', end: '15:00', label: 'Ca 3: 13:00 – 15:00' },
  { start: '15:00', end: '17:00', label: 'Ca 4: 15:00 – 17:00' },
  { start: '17:00', end: '19:00', label: 'Ca 5: 17:00 – 19:00' },
];

const DEFAULT_CAMERA_SPHERICAL = {
  theta: 0.46,
  phi: 0.82,
  radius: 15.8,
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
  // THREE.JS PBR 3D ENGINE VỚI ENVIRONMENT MAP, VÁT CẠNH BEVEL & NỘI THẤT CHI TIẾT
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
    cam.lookAt(0, 0.55, 0);
    renderer.render(scene, cam);
  }, []);

  // Hàm Lia Camera mượt mà về Góc nhìn chuẩn ngay lập tức khi bấm nút (420ms ease-out cubic)
  const handleSmoothResetStandardCamera = useCallback(() => {
    if (cameraTweenFrameRef.current) {
      cancelAnimationFrame(cameraTweenFrameRef.current);
      cameraTweenFrameRef.current = null;
    }

    const startTheta = cameraSphericalRef.current.theta;
    const startPhi = cameraSphericalRef.current.phi;
    const startRadius = cameraSphericalRef.current.radius;

    const targetTheta = selectedFloor === 5 ? 0.0 : DEFAULT_CAMERA_SPHERICAL.theta;
    const targetPhi = selectedFloor === 5 ? 0.78 : DEFAULT_CAMERA_SPHERICAL.phi;
    const targetRadius = selectedFloor === 5 ? 16.8 : DEFAULT_CAMERA_SPHERICAL.radius;

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
  }, [selectedFloor, syncCameraPositionAndRender]);

  useEffect(() => {
    if (viewDimension !== '3D') return;
    const container = mount3DRef.current;
    if (!container) return;

    const width = container.clientWidth || 720;
    const height = 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x070c18 : 0xeef4ff);
    scene.fog = new THREE.FogExp2(isDark ? 0x070c18 : 0xeef4ff, 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.26;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Gắn PBR Environment Map để kính và kim loại có phản xạ ánh sáng sắc nét
    const envMapTexture = buildInteriorStudioEnvMap(renderer, isDark);
    scene.environment = envMapTexture;

    // Hệ thống ánh sáng PBR 4 nguồn có đổ bóng 2048px
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.9 : 1.25);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 2.1 : 2.4);
    dirLight.position.set(14, 24, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 60;
    const shadowBound = 13;
    dirLight.shadow.camera.left = -shadowBound;
    dirLight.shadow.camera.right = shadowBound;
    dirLight.shadow.camera.top = shadowBound;
    dirLight.shadow.camera.bottom = -shadowBound;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(0x38bdf8, isDark ? 3.5 : 2.2, 32);
    fillLight.position.set(-10, 8, -8);
    scene.add(fillLight);

    const accentLight = new THREE.PointLight(0x818cf8, isDark ? 3.2 : 2.0, 32);
    accentLight.position.set(10, 7, 8);
    scene.add(accentLight);

    // Mặt sàn chính Beveled & Lưới tọa độ kiến trúc
    const floorSlabGeo = createBeveledBoxGeometry(19.2, 0.32, 14.0, 0.55, 0.05);
    const floorSlabMat = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x0f172a : 0xf8fafc,
      roughness: 0.16,
      metalness: 0.35,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorSlabGeo, floorSlabMat);
    floorMesh.position.y = -0.16;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const gridHelper = new THREE.GridHelper(
      18.4,
      20,
      isDark ? 0x38bdf8 : 0x94a3b8,
      isDark ? 0x1e293b : 0xe2e8f0
    );
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Tường bao quanh tòa nhà có gờ nhôm đỉnh tường
    const wallMat = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x1e293b : 0xcbd5e1,
      roughness: 0.28,
      metalness: 0.4,
      clearcoat: 0.6,
    });
    const chromeMat = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x94a3b8 : 0x475569,
      roughness: 0.14,
      metalness: 0.92,
      clearcoat: 1.0,
      envMapIntensity: 2.4,
    });

    const backWall = new THREE.Mesh(
      createBeveledBoxGeometry(19.0, 2.0, 0.28, 0.08, 0.025),
      wallMat
    );
    backWall.position.set(0, 1.0, -6.8);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(
      createBeveledBoxGeometry(0.28, 2.0, 13.8, 0.08, 0.025),
      wallMat
    );
    leftWall.position.set(-9.35, 1.0, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      createBeveledBoxGeometry(0.28, 2.0, 13.8, 0.08, 0.025),
      wallMat
    );
    rightWall.position.set(9.35, 1.0, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    interactiveMeshesRef.current = [];
    const animatedPulseRings: THREE.Mesh[] = [];
    const animatedHoloOrbs: THREE.Mesh[] = [];

    // Dùng chung Beveled Geometry cho ghế văn phòng công thái học để sắc nét & mượt
    const sharedSeatCushionGeo = createBeveledBoxGeometry(0.4, 0.075, 0.4, 0.08, 0.015);
    const sharedSeatBackGeo = createBeveledBoxGeometry(0.4, 0.42, 0.065, 0.08, 0.015);
    const sharedArmrestGeo = createBeveledBoxGeometry(0.05, 0.16, 0.28, 0.02, 0.008);

    const buildErgonomicChair = (cushionColor: number, isHighlighted: boolean) => {
      const chairGroup = new THREE.Group();
      const cushionMat = new THREE.MeshPhysicalMaterial({
        color: cushionColor,
        emissive: cushionColor,
        emissiveIntensity: isHighlighted ? 0.45 : 0.12,
        roughness: 0.22,
        metalness: 0.25,
        clearcoat: 0.75,
      });

      const seatPad = new THREE.Mesh(sharedSeatCushionGeo, cushionMat);
      seatPad.position.y = 0.42;
      seatPad.castShadow = true;
      chairGroup.add(seatPad);

      const backRest = new THREE.Mesh(sharedSeatBackGeo, cushionMat);
      backRest.position.set(0, 0.66, -0.17);
      backRest.castShadow = true;
      chairGroup.add(backRest);

      const leftArm = new THREE.Mesh(sharedArmrestGeo, chromeMat);
      leftArm.position.set(-0.21, 0.52, -0.02);
      chairGroup.add(leftArm);

      const rightArm = new THREE.Mesh(sharedArmrestGeo, chromeMat);
      rightArm.position.set(0.21, 0.52, -0.02);
      chairGroup.add(rightArm);

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.05, 0.34, 12),
        chromeMat
      );
      stem.position.y = 0.22;
      chairGroup.add(stem);

      const starBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.22, 0.03, 6),
        chromeMat
      );
      starBase.position.y = 0.04;
      chairGroup.add(starBase);

      return chairGroup;
    };

    if (selectedFloor === 5) {
      // ====================================================================
      // MÔ HÌNH 3D TẦNG 5: ĐẤU TRƯỜNG LA MÃ H-01 (PBR COLOSSEUM AMPHITHEATER)
      // ====================================================================
      const stageCenterZ = 1.65;

      // Sân khấu tròn trung tâm 2 tầng ốp đá & viền LED Ngọc lục bảo
      const stageOuter = new THREE.Mesh(
        new THREE.CylinderGeometry(2.35, 2.55, 0.34, 64),
        new THREE.MeshPhysicalMaterial({
          color: 0x0f172a,
          roughness: 0.1,
          metalness: 0.7,
          clearcoat: 1.0,
        })
      );
      stageOuter.position.set(0, 0.17, stageCenterZ);
      stageOuter.receiveShadow = true;
      stageOuter.castShadow = true;
      scene.add(stageOuter);

      const stageInner = new THREE.Mesh(
        new THREE.CylinderGeometry(1.85, 1.95, 0.16, 64),
        new THREE.MeshPhysicalMaterial({
          color: 0x1e1b4b,
          emissive: 0x0284c7,
          emissiveIntensity: 0.3,
          roughness: 0.12,
          metalness: 0.6,
          clearcoat: 1.0,
        })
      );
      stageInner.position.set(0, 0.4, stageCenterZ);
      scene.add(stageInner);

      const stageRing = new THREE.Mesh(
        new THREE.TorusGeometry(2.38, 0.065, 20, 96),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 0.9,
          roughness: 0.15,
          metalness: 0.8,
        })
      );
      stageRing.rotation.x = Math.PI / 2;
      stageRing.position.set(0, 0.35, stageCenterZ);
      scene.add(stageRing);

      // Bục phát biểu Keynote vát cạnh + Khối Hologram xoay lơ lửng trên sân khấu
      const podium = new THREE.Mesh(
        createBeveledBoxGeometry(0.78, 0.78, 0.52, 0.1, 0.025),
        chromeMat
      );
      podium.position.set(0, 0.82, stageCenterZ);
      podium.castShadow = true;
      scene.add(podium);

      const stageHoloCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32, 0),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x38bdf8,
          emissiveIntensity: 1.1,
          roughness: 0.1,
          metalness: 0.9,
          flatShading: true,
        })
      );
      stageHoloCrystal.position.set(0, 1.65, stageCenterZ);
      scene.add(stageHoloCrystal);
      animatedHoloOrbs.push(stageHoloCrystal);

      // Hàng cột trụ kiến trúc La Mã (Colonnade) quanh vòm khán đài
      const pillarCount = 14;
      for (let p = 0; p < pillarCount; p++) {
        const pRatio = p / (pillarCount - 1);
        const pAngle = ((-172 + pRatio * 164) * Math.PI) / 180;
        const px = Math.cos(pAngle) * 8.1;
        const pz = Math.sin(pAngle) * 8.1 + 1.4;
        const colMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.18, 2.5, 20),
          chromeMat
        );
        colMesh.position.set(px, 1.25, pz);
        colMesh.castShadow = true;
        scene.add(colMesh);
      }

      // Màn hình LED Cong Panorama 360° có CanvasTexture hiển thị tên sự kiện thực tế
      const eventTitleText =
        currentSlotHallEventInfo.approvedEvent?.purposeNote ||
        'SẴN SÀNG TỔ CHỨC SỰ KIỆN • HALL_EVENT_RENTAL & SEAT_BOOKING';
      const panoramaTex = createColosseumPanoramaTexture(eventTitleText);
      const screenGeo = new THREE.CylinderGeometry(
        4.2,
        4.2,
        1.85,
        64,
        1,
        true,
        -Math.PI * 0.42,
        Math.PI * 0.84
      );
      const screenMat = new THREE.MeshStandardMaterial({
        map: panoramaTex,
        emissive: 0x38bdf8,
        emissiveMap: panoramaTex,
        emissiveIntensity: 0.85,
        side: THREE.DoubleSide,
        roughness: 0.12,
        metalness: 0.3,
      });
      const curvedScreen = new THREE.Mesh(screenGeo, screenMat);
      curvedScreen.position.set(0, 1.45, 3.85);
      scene.add(curvedScreen);

      COLOSSEUM_SEATS_LIST.forEach((seat) => {
        const isTaken = bookedHallSeatCodes.has(seat.seatCode);
        const isSelected = selectedHallSeatCode === seat.seatCode;
        const hasEvent = Boolean(currentSlotHallEventInfo.approvedEvent);

        const group = new THREE.Group();
        group.position.set(seat.worldX, 0, seat.worldZ + 1.4);

        // Bệ đá bậc thang vát cạnh cho từng ghế vòm La Mã
        const stepBlockGeo = createBeveledBoxGeometry(
          0.96,
          seat.worldY,
          0.96,
          0.14,
          0.025
        );
        const stepBlockMat = new THREE.MeshPhysicalMaterial({
          color: isSelected
            ? 0x4f46e5
            : isDark
            ? 0x1e293b
            : 0xe2e8f0,
          emissive: isSelected ? 0x4f46e5 : 0x000000,
          emissiveIntensity: isSelected ? 0.35 : 0,
          roughness: 0.22,
          metalness: 0.45,
          clearcoat: 0.8,
        });
        const stepBlock = new THREE.Mesh(stepBlockGeo, stepBlockMat);
        stepBlock.position.y = seat.worldY / 2;
        stepBlock.receiveShadow = true;
        stepBlock.castShadow = true;
        group.add(stepBlock);

        const seatColor = isSelected
          ? 0x38bdf8
          : isTaken
          ? 0x4f46e5
          : !hasEvent
          ? 0x64748b
          : 0x10b981;

        const ergonomicSeat = buildErgonomicChair(seatColor, isSelected);
        ergonomicSeat.position.y = seat.worldY;
        group.add(ergonomicSeat);

        if (isSelected) {
          const badgeSprite = createSeatBadgeSprite(seat.seatCode, isTaken);
          badgeSprite.position.set(0, seat.worldY + 1.15, 0);
          group.add(badgeSprite);
        }

        group.lookAt(0, seat.worldY, stageCenterZ);
        scene.add(group);

        interactiveMeshesRef.current.push({
          mesh: group,
          nodeCode: seat.seatCode,
          isHallSeat: true,
        });
      });
    } else {
      // ====================================================================
      // MÔ HÌNH 3D TẦNG 1 - 4 PBR SẮC NÉT:
      // Hành lang bóng gương + 6 Phòng họp Kính Vát Cạnh IOR 1.5 + Bàn Dài/Tròn
      // + Ghế công thái học có tay vịn + Màn hình TV 4K Bezel + Nhãn 3D Retina
      // ====================================================================
      const corridorCarpet = new THREE.Mesh(
        new THREE.PlaneGeometry(17.8, 1.85),
        new THREE.MeshPhysicalMaterial({
          color: isDark ? 0x1e1b4b : 0xe0e7ff,
          emissive: 0x38bdf8,
          emissiveIntensity: isDark ? 0.18 : 0.08,
          roughness: 0.14,
          metalness: 0.4,
          clearcoat: 1.0,
        })
      );
      corridorCarpet.rotation.x = -Math.PI / 2;
      corridorCarpet.position.set(0, 0.02, 0);
      corridorCarpet.receiveShadow = true;
      scene.add(corridorCarpet);

      // 2 Dải đèn LED dẫn hướng dọc hành lang trung tâm
      [-0.88, 0.88].forEach((railZ) => {
        const railLine = new THREE.Mesh(
          new THREE.BoxGeometry(17.6, 0.02, 0.05),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        railLine.position.set(0, 0.025, railZ);
        scene.add(railLine);
      });

      const roomW = 4.65;
      const roomD = 3.95;
      const sharedRoomPlatformGeo = createBeveledBoxGeometry(
        roomW,
        0.16,
        roomD,
        0.22,
        0.025
      );
      const sharedRoomLedBorderGeo = createBeveledBoxGeometry(
        roomW + 0.1,
        0.06,
        roomD + 0.1,
        0.24,
        0.015
      );

      currentFloorNodes.forEach((room, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const posX = (col - 1) * 5.45;
        const posZ = row === 0 ? -3.48 : 3.48;
        const isTopRow = row === 0;

        const isSelected = selectedNode?.nodeCode === room.nodeCode;
        const statusColor =
          room.status === 'AVAILABLE'
            ? 0x10b981
            : room.status === 'HOLDING'
            ? 0xf59e0b
            : 0x6366f1;

        const roomGroup = new THREE.Group();
        roomGroup.position.set(posX, 0, posZ);

        // 1. Nền sàn gỗ/đá vát cạnh riêng cho từng phòng + viền LED trạng thái
        const basePlatform = new THREE.Mesh(
          sharedRoomPlatformGeo,
          new THREE.MeshPhysicalMaterial({
            color: isSelected
              ? isDark
                ? 0x1e1b4b
                : 0xe0e7ff
              : isDark
              ? 0x0f172a
              : 0xffffff,
            roughness: 0.18,
            metalness: 0.25,
            clearcoat: 0.85,
          })
        );
        basePlatform.position.y = 0.08;
        basePlatform.receiveShadow = true;
        roomGroup.add(basePlatform);

        const borderStrip = new THREE.Mesh(
          sharedRoomLedBorderGeo,
          new THREE.MeshStandardMaterial({
            color: statusColor,
            emissive: statusColor,
            emissiveIntensity: isSelected ? 0.95 : 0.42,
            roughness: 0.2,
          })
        );
        borderStrip.position.y = 0.03;
        roomGroup.add(borderStrip);

        // 2. Vách kính cường lực quang học PBR (Clearcoat 1.0 + IOR 1.5 + Khung nhôm vát cạnh)
        const glassHeight = 1.52;
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: isSelected ? 0x7dd3fc : 0xbae6fd,
          emissive: statusColor,
          emissiveIntensity: isSelected ? 0.1 : 0.03,
          transparent: true,
          opacity: isSelected ? 0.42 : 0.28,
          roughness: 0.04,
          metalness: 0.12,
          transmission: 0.85,
          ior: 1.5,
          thickness: 0.5,
          clearcoat: 1.0,
          clearcoatRoughness: 0.04,
          envMapIntensity: 2.5,
        });
        const frameMat = new THREE.MeshPhysicalMaterial({
          color: isSelected ? 0x38bdf8 : isDark ? 0x94a3b8 : 0x475569,
          metalness: 0.9,
          roughness: 0.15,
          clearcoat: 1.0,
        });

        const outerGlassZ = isTopRow ? -roomD / 2 : roomD / 2;
        const innerCorridorZ = isTopRow ? roomD / 2 : -roomD / 2;

        const backGlass = new THREE.Mesh(
          new THREE.BoxGeometry(roomW, glassHeight, 0.065),
          glassMat
        );
        backGlass.position.set(0, glassHeight / 2 + 0.16, outerGlassZ);
        roomGroup.add(backGlass);

        const leftGlass = new THREE.Mesh(
          new THREE.BoxGeometry(0.065, glassHeight, roomD),
          glassMat
        );
        leftGlass.position.set(-roomW / 2, glassHeight / 2 + 0.16, 0);
        roomGroup.add(leftGlass);

        const rightGlass = new THREE.Mesh(
          new THREE.BoxGeometry(0.065, glassHeight, roomD),
          glassMat
        );
        rightGlass.position.set(roomW / 2, glassHeight / 2 + 0.16, 0);
        roomGroup.add(rightGlass);

        // Vách kính mặt hành lang (chừa lối cửa kính mở 1.25m kèm tay nắm Inox)
        const frontGlassSegmentW = (roomW - 1.25) / 2;
        const frontLeftGlass = new THREE.Mesh(
          new THREE.BoxGeometry(frontGlassSegmentW, glassHeight, 0.065),
          glassMat
        );
        frontLeftGlass.position.set(
          -roomW / 2 + frontGlassSegmentW / 2,
          glassHeight / 2 + 0.16,
          innerCorridorZ
        );
        roomGroup.add(frontLeftGlass);

        const frontRightGlass = new THREE.Mesh(
          new THREE.BoxGeometry(frontGlassSegmentW, glassHeight, 0.065),
          glassMat
        );
        frontRightGlass.position.set(
          roomW / 2 - frontGlassSegmentW / 2,
          glassHeight / 2 + 0.16,
          innerCorridorZ
        );
        roomGroup.add(frontRightGlass);

        // Cánh cửa kính cường lực hé mở góc 35 độ + tay nắm kim loại
        const doorLeaf = new THREE.Mesh(
          new THREE.BoxGeometry(0.88, glassHeight - 0.12, 0.05),
          glassMat
        );
        doorLeaf.position.set(
          0.42,
          (glassHeight - 0.12) / 2 + 0.16,
          innerCorridorZ + (isTopRow ? -0.22 : 0.22)
        );
        doorLeaf.rotation.y = isTopRow ? 0.52 : -0.52;
        roomGroup.add(doorLeaf);

        // Khung viền đỉnh phòng bằng nhôm Anodized vát cạnh
        const topCrownFrame = new THREE.Mesh(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(roomW, 0.05, roomD)),
          new THREE.LineBasicMaterial({
            color: isSelected ? 0x38bdf8 : 0x94a3b8,
          })
        );
        topCrownFrame.position.y = glassHeight + 0.18;
        roomGroup.add(topCrownFrame);

        // 4 cột trụ nhôm góc phòng
        [
          [-roomW / 2, -roomD / 2],
          [roomW / 2, -roomD / 2],
          [-roomW / 2, roomD / 2],
          [roomW / 2, roomD / 2],
        ].forEach(([cx, cz]) => {
          const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.075, 0.075, glassHeight + 0.1, 16),
            frameMat
          );
          pillar.position.set(cx, glassHeight / 2 + 0.16, cz);
          pillar.castShadow = true;
          roomGroup.add(pillar);
        });

        // 3. Màn hình Hội nghị 4K gắn trên vách trong của mỗi phòng + Loa Soundbar
        const tvBoard = new THREE.Mesh(
          createBeveledBoxGeometry(1.85, 0.84, 0.08, 0.06, 0.015),
          frameMat
        );
        tvBoard.position.set(
          0,
          1.02,
          isTopRow ? outerGlassZ + 0.1 : outerGlassZ - 0.1
        );
        roomGroup.add(tvBoard);

        const tvScreenGlow = new THREE.Mesh(
          new THREE.BoxGeometry(1.72, 0.72, 0.095),
          new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            emissive: statusColor,
            emissiveIntensity: 0.65,
            roughness: 0.1,
          })
        );
        tvScreenGlow.position.copy(tvBoard.position);
        roomGroup.add(tvScreenGlow);

        // 4. Bàn Họp Trung Tâm Vát Cạnh Bóng Gương (Bàn tròn Collab hoặc Bàn dài Boardroom)
        const isRoundTable =
          room.zoneType === 'COLLAB_HUB' ||
          room.nodeCode.endsWith('-04') ||
          room.nodeCode.endsWith('-05');

        const tableSurfaceMat = new THREE.MeshPhysicalMaterial({
          color: isDark ? 0xe2e8f0 : 0xffffff,
          roughness: 0.1,
          metalness: 0.3,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
        });

        if (isRoundTable) {
          const roundTop = new THREE.Mesh(
            new THREE.CylinderGeometry(1.15, 1.15, 0.09, 40),
            tableSurfaceMat
          );
          roundTop.position.set(0, 0.64, 0);
          roundTop.castShadow = true;
          roundTop.receiveShadow = true;
          roomGroup.add(roundTop);

          const roundAccent = new THREE.Mesh(
            new THREE.CylinderGeometry(0.48, 0.48, 0.105, 32),
            new THREE.MeshStandardMaterial({
              color: statusColor,
              emissive: statusColor,
              emissiveIntensity: 0.45,
            })
          );
          roundAccent.position.set(0, 0.645, 0);
          roomGroup.add(roundAccent);

          const centerPedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.38, 0.5, 24),
            frameMat
          );
          centerPedestal.position.set(0, 0.36, 0);
          roomGroup.add(centerPedestal);
        } else {
          const tableW =
            room.capacityCount >= 10
              ? 2.6
              : room.capacityCount >= 6
              ? 2.2
              : 1.7;
          const tableD = room.capacityCount >= 10 ? 1.38 : 1.18;

          const rectTop = new THREE.Mesh(
            createBeveledBoxGeometry(tableW, 0.095, tableD, 0.14, 0.02),
            tableSurfaceMat
          );
          rectTop.position.set(0, 0.64, 0);
          rectTop.castShadow = true;
          rectTop.receiveShadow = true;
          roomGroup.add(rectTop);

          const tableRunner = new THREE.Mesh(
            createBeveledBoxGeometry(tableW * 0.72, 0.105, tableD * 0.34, 0.06, 0.01),
            new THREE.MeshStandardMaterial({
              color: statusColor,
              emissive: statusColor,
              emissiveIntensity: 0.45,
            })
          );
          tableRunner.position.set(0, 0.645, 0);
          roomGroup.add(tableRunner);

          [
            [-tableW * 0.38, -tableD * 0.34],
            [tableW * 0.38, -tableD * 0.34],
            [-tableW * 0.38, tableD * 0.34],
            [tableW * 0.38, tableD * 0.34],
          ].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16),
              frameMat
            );
            leg.position.set(lx, 0.36, lz);
            roomGroup.add(leg);
          });
        }

        // 5. Ghế xoay công thái học 3D xếp quanh bàn đúng theo sức chứa (capacityCount)
        const chairCount = Math.min(12, Math.max(2, room.capacityCount));
        for (let cIdx = 0; cIdx < chairCount; cIdx++) {
          const chairGroup = buildErgonomicChair(statusColor, isSelected);

          if (isRoundTable) {
            const angle = (cIdx / chairCount) * Math.PI * 2;
            const radius = 1.52;
            chairGroup.position.set(
              Math.cos(angle) * radius,
              0.08,
              Math.sin(angle) * radius
            );
            chairGroup.lookAt(0, 0.08, 0);
          } else {
            const half = Math.ceil(chairCount / 2);
            const isFrontSide = cIdx < half;
            const sideIndex = isFrontSide ? cIdx : cIdx - half;
            const countOnSide = isFrontSide ? half : chairCount - half;
            const spanW = room.capacityCount >= 10 ? 2.15 : 1.55;
            const offsetX =
              countOnSide <= 1
                ? 0
                : -spanW / 2 + (sideIndex / (countOnSide - 1)) * spanW;
            const offsetZ = isFrontSide ? -0.96 : 0.96;
            chairGroup.position.set(offsetX, 0.08, offsetZ);
            chairGroup.lookAt(offsetX, 0.08, 0);
          }

          roomGroup.add(chairGroup);
        }

        // 6. Vòng xung nhịp ánh sáng + Nhãn 3D Retina nổi hiển thị mã phòng và sức chứa
        if (isSelected) {
          const selectRingGeo = new THREE.RingGeometry(2.45, 2.62, 48);
          selectRingGeo.rotateX(-Math.PI / 2);
          const selectRingMesh = new THREE.Mesh(
            selectRingGeo,
            new THREE.MeshBasicMaterial({
              color: 0x38bdf8,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.75,
            })
          );
          selectRingMesh.position.y = 0.04;
          roomGroup.add(selectRingMesh);
          animatedPulseRings.push(selectRingMesh);
        }

        const labelSprite = createRoomLabelSprite(
          room.nodeCode,
          room.capacityCount,
          room.status,
          isSelected
        );
        labelSprite.position.set(0, 2.18, 0);
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

    // Vòng lặp hoạt ảnh nhẹ 60 FPS giúp khối Hologram & vòng chọn phòng phát sáng sống động
    let idleAnimFrame = 0;
    const clock = new THREE.Clock();
    const animateSceneLoop = () => {
      idleAnimFrame = requestAnimationFrame(animateSceneLoop);
      const t = clock.getElapsedTime();

      animatedHoloOrbs.forEach((orb) => {
        orb.rotation.y = t * 1.4;
        orb.rotation.x = t * 0.8;
        orb.position.y = 1.65 + Math.sin(t * 2.2) * 0.08;
      });

      animatedPulseRings.forEach((ring) => {
        const sc = 1 + Math.sin(t * 3.0) * 0.04;
        ring.scale.set(sc, sc, 1);
      });

      renderer.render(scene, camera);
    };
    animateSceneLoop();

    return () => {
      cancelAnimationFrame(idleAnimFrame);
      if (cameraTweenFrameRef.current) {
        cancelAnimationFrame(cameraTweenFrameRef.current);
      }
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      domElem.removeEventListener('click', onClickCanvas);
      envMapTexture.dispose();
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
            <span>Mô hình 3D PBR Sắc Nét</span>
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
                    ? `Mô hình 3D PBR Tầng ${selectedFloor} — ${
                        selectedFloor === 5
                          ? 'Hội trường Đấu Trường La Mã (Colosseum H-01)'
                          : 'Khu Phòng họp Kính Vát Cạnh IOR 1.5'
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
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
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
              className="w-full h-[460px] rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800 cursor-grab active:cursor-grabbing"
            />
          ) : (
            <div className="w-full h-[460px] rounded-2xl overflow-auto border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-2">
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
                      hallMode: 'HALL_EVENT_RENTAL',
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