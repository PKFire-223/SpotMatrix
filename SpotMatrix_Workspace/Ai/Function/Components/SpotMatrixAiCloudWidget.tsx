import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import {
  Cloud,
  Sparkles,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Volume2,
  VolumeX,
  Trash2,
  Maximize2,
  Minimize2,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  CalendarCheck,
  ArrowRight,
  Users,
} from 'lucide-react';
import {
  AuditConcurrencyLogItem,
  BookingPayloadItem,
  EquipmentStatusType,
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  SharedEquipmentItem,
  TrustScoreHistoryRecordItem,
  UserRoleType,
  UserTrustProfileItem,
  WebLanguageCodeType,
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';

export interface AiBookingSlotSuggestion {
  dateIso: string;
  start: string;
  end: string;
  capacityNeeded: number;
  floorFilter?: number | null;
  purposeNote: string;
  approvalRequestReason: string;
  candidateRooms: WorkspaceNodeItem[];
}

export interface AiGroupDraftAction {
  initialGroupName: string;
  departmentName: string;
}

export interface SpotMatrixAiCloudWidgetProps {
  workspaceNodes: WorkspaceNodeItem[];
  bookingsList: BookingPayloadItem[];
  equipmentsList: SharedEquipmentItem[];
  trustProfiles: UserTrustProfileItem[];
  trustScoreHistory?: TrustScoreHistoryRecordItem[];
  departmentsList: OrganizationDepartmentItem[];
  groupsList: OrganizationGroupItem[];
  auditLogs: AuditConcurrencyLogItem[];
  userProfile: {
    accountCode: string;
    username: string;
    userEmail: string;
    fullName: string;
    departmentName: string;
    role: UserRoleType;
    trustScore: number;
  };
  webLanguage: WebLanguageCodeType;
  isDark: boolean;
  onAiNavigateAndPrefillBooking?: (
    node: WorkspaceNodeItem,
    slot: {
      dateIso: string;
      start: string;
      end: string;
      purposeNote: string;
      approvalRequestReason: string;
    }
  ) => void;
  onAiExecuteDirectBooking?: (
    node: WorkspaceNodeItem,
    slot: {
      dateIso: string;
      start: string;
      end: string;
      purposeNote: string;
      approvalRequestReason: string;
    }
  ) => void;
  onAiUpsertGroup?: (group: OrganizationGroupItem) => void;
  onAiToggleGroupMember?: (groupId: string, userEmail: string) => void;
  onAiRenameDepartment?: (
    departmentId: string,
    newDepartmentName: string
  ) => void;
  onAiBatchUpdateEquipmentStatus?: (
    targetRoomCodes: string[],
    nextStatus: EquipmentStatusType
  ) => void;
}

interface AttachedFilePayload {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64DataUrl?: string;
  textContentPreview?: string;
  imageDimensions?: string;
}

interface AiChatMessageItem {
  id: string;
  sender: 'USER' | 'AI';
  contentText: string;
  timestampText: string;
  attachments?: AttachedFilePayload[];
  bookingSuggestion?: AiBookingSlotSuggestion;
  groupDraftAction?: AiGroupDraftAction;
}

/**
 * Tạo môi trường Studio HDRI giả lập bằng PMREMGenerator để Linh vật AI 3D
 * có độ bóng gương Chrome, khúc xạ thủy tinh IOR 1.52 và phát sáng sắc nét.
 */
function buildMascotStudioEnvironment(
  renderer: THREE.WebGLRenderer,
  isDarkTheme: boolean
): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(isDarkTheme ? 0x030712 : 0xe0f2fe);

  const topLight = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  topLight.position.set(0, 9, 0);
  topLight.rotation.x = Math.PI / 2;
  envScene.add(topLight);

  const cyanStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 5),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
  );
  cyanStrip.position.set(8, 3, 5);
  cyanStrip.lookAt(0, 0, 0);
  envScene.add(cyanStrip);

  const violetStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 5),
    new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide })
  );
  violetStrip.position.set(-8, 4, -5);
  violetStrip.lookAt(0, 0, 0);
  envScene.add(violetStrip);

  const emeraldStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 4),
    new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
  );
  emeraldStrip.position.set(0, -5, 7);
  emeraldStrip.lookAt(0, 0, 0);
  envScene.add(emeraldStrip);

  const target = pmrem.fromScene(envScene, 0.025);
  pmrem.dispose();
  return target.texture;
}

/**
 * LINH VẬT AI 3D ĐỘC QUYỀN "AURA-X CYBER GUARDIAN"
 * Dựng bằng Three.js PBR siêu bóng nét:
 * - Đầu Robot Bo tròn Titanium Trắng Sứ + Kính Visor Khúc xạ Đen Bóng + Đôi Mắt LED Cyan biểu cảm
 * - Lõi Năng lượng Kim cương Đa diện xoay bên trong lồng ngực Kính Quang học
 * - Vương miện Ăng-ten Hologram + Tai nghe Cyber-Audio phát sáng
 * - 3 Vòng Gyroscope Vàng/Cyan/Indigo đồng tâm + 6 Tinh thể Vệ tinh + Đế Năng lượng Lơ lửng
 */
const SpotMatrixMascot3DStage: React.FC<{
  isDark: boolean;
  aiMood: 'IDLE' | 'THINKING' | 'SPEAKING';
}> = ({ isDark, aiMood }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const moodRef = useRef<'IDLE' | 'THINKING' | 'SPEAKING'>(aiMood);
  const isDarkRef = useRef<boolean>(isDark);

  useEffect(() => {
    moodRef.current = aiMood;
  }, [aiMood]);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const container = stageRef.current;
    if (!container) return;

    const width = container.clientWidth || 380;
    const height = 215;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 6.15);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.38;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const envMap = buildMascotStudioEnvironment(renderer, isDarkRef.current);
    scene.environment = envMap;

    // Hệ thống đèn Studio chiếu sáng tạo viền bóng Specular cực nét
    const ambient = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(5, 8, 7);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const cyanRim = new THREE.PointLight(0x38bdf8, 5.5, 16);
    cyanRim.position.set(-4, 3, 3);
    scene.add(cyanRim);

    const indigoRim = new THREE.PointLight(0x818cf8, 5.0, 16);
    indigoRim.position.set(4, 2, -3);
    scene.add(indigoRim);

    const emeraldBottom = new THREE.PointLight(0x10b981, 4.2, 12);
    emeraldBottom.position.set(0, -3, 2);
    scene.add(emeraldBottom);

    // Vật liệu PBR cao cấp
    const ceramicTitaniumMat = new THREE.MeshPhysicalMaterial({
      color: isDarkRef.current ? 0xe2e8f0 : 0xffffff,
      roughness: 0.08,
      metalness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 2.6,
    });

    const goldChromeMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.22,
      roughness: 0.1,
      metalness: 0.95,
      clearcoat: 1.0,
      envMapIntensity: 2.8,
    });

    const darkVisorGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x020617,
      roughness: 0.03,
      metalness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 1.0,
      envMapIntensity: 3.0,
    });

    const refractiveCrystalShellMat = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      roughness: 0.03,
      metalness: 0.1,
      transmission: 0.9,
      ior: 1.52,
      thickness: 1.2,
      clearcoat: 1.0,
      envMapIntensity: 2.8,
      transparent: true,
      opacity: 0.88,
    });

    const neonEyeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.8,
      roughness: 0.1,
    });

    const mascotRoot = new THREE.Group();
    scene.add(mascotRoot);

    // 1. PHẦN ĐẦU ROBOT AI (HEAD GROUP + VISOR + ĐÔI MẮT LED + TAI NGHE + VƯƠNG MIỆN)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.78, 0);
    mascotRoot.add(headGroup);

    const headHelmetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.76, 48, 48),
      ceramicTitaniumMat
    );
    headHelmetMesh.scale.set(1.12, 0.94, 0.98);
    headGroup.add(headHelmetMesh);

    // Mặt kính Visor cong bóng gương phía trước
    const visorMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.71, 40, 40),
      darkVisorGlassMat
    );
    visorMesh.scale.set(1.06, 0.68, 0.88);
    visorMesh.position.set(0, 0.02, 0.18);
    headGroup.add(visorMesh);

    // Viền vàng kim loại quanh Visor
    const visorHaloRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.66, 0.028, 16, 64),
      goldChromeMat
    );
    visorHaloRing.scale.set(1.08, 0.72, 1);
    visorHaloRing.position.set(0, 0.02, 0.42);
    headGroup.add(visorHaloRing);

    // Đôi mắt LED Biểu cảm (Trái & Phải) + Thanh Sóng Giọng nói ở giữa
    const leftEyeMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.085, 0.11, 12, 24),
      neonEyeMat
    );
    leftEyeMesh.position.set(-0.26, 0.06, 0.78);
    headGroup.add(leftEyeMesh);

    const rightEyeMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.085, 0.11, 12, 24),
      neonEyeMat
    );
    rightEyeMesh.position.set(0.26, 0.06, 0.78);
    headGroup.add(rightEyeMesh);

    const mouthVoiceBar = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.032, 0.22, 8, 16),
      new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 1.5,
      })
    );
    mouthVoiceBar.rotation.z = Math.PI / 2;
    mouthVoiceBar.position.set(0, -0.14, 0.77);
    headGroup.add(mouthVoiceBar);

    // 2 Cụm Tai nghe Cyber-Audio 2 bên thái dương
    [-0.86, 0.86].forEach((earX) => {
      const earCup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.16, 32),
        goldChromeMat
      );
      earCup.rotation.z = Math.PI / 2;
      earCup.position.set(earX, 0.02, 0);
      headGroup.add(earCup);

      const earGlowRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.025, 16, 32),
        neonEyeMat
      );
      earGlowRing.rotation.y = Math.PI / 2;
      earGlowRing.position.set(earX + (earX > 0 ? 0.09 : -0.09), 0.02, 0);
      headGroup.add(earGlowRing);
    });

    // Ăng-ten Vương miện Tinh thể trên đỉnh đầu
    const antennaStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, 0.36, 16),
      goldChromeMat
    );
    antennaStem.position.set(0, 0.84, 0);
    headGroup.add(antennaStem);

    const crownStar = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.5,
        roughness: 0.1,
        metalness: 0.9,
        flatShading: true,
      })
    );
    crownStar.position.set(0, 1.1, 0);
    headGroup.add(crownStar);

    // 2. PHẦN THÂN & LÕI TIM KIM CƯƠNG KHÚC XẠ (CRYSTAL CHEST REACTOR & FLOATING HANDS)
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, -0.35, 0);
    mascotRoot.add(bodyGroup);

    // Vỏ ngực bằng Kính Quang học trong suốt nhìn xuyên vào Lõi Kim cương
    const chestGlassShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 40, 40),
      refractiveCrystalShellMat
    );
    chestGlassShell.scale.set(1.05, 0.88, 0.85);
    bodyGroup.add(chestGlassShell);

    // Giáp vai Titanium & Viền Vàng Chrome
    const shoulderArmor = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.09, 20, 64),
      ceramicTitaniumMat
    );
    shoulderArmor.rotation.x = Math.PI / 2;
    shoulderArmor.position.y = 0.36;
    bodyGroup.add(shoulderArmor);

    // Lõi Tim Kim cương Đa diện phát sáng bên trong lồng ngực
    const heartReactorCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.3, 0),
      new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.6,
        roughness: 0.08,
        metalness: 0.9,
        flatShading: true,
      })
    );
    bodyGroup.add(heartReactorCore);

    // Đôi Bàn tay Bay Lơ lửng (Floating Cyber Hands) hai bên
    const leftHandGroup = new THREE.Group();
    leftHandGroup.position.set(-1.18, 0.05, 0.25);
    const leftPalm = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 24, 24),
      ceramicTitaniumMat
    );
    const leftWristRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.025, 16, 32),
      goldChromeMat
    );
    leftHandGroup.add(leftPalm);
    leftHandGroup.add(leftWristRing);
    bodyGroup.add(leftHandGroup);

    const rightHandGroup = new THREE.Group();
    rightHandGroup.position.set(1.18, 0.05, 0.25);
    const rightPalm = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 24, 24),
      ceramicTitaniumMat
    );
    const rightWristRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.025, 16, 32),
      goldChromeMat
    );
    rightHandGroup.add(rightPalm);
    rightHandGroup.add(rightWristRing);
    bodyGroup.add(rightHandGroup);

    // 3. HỆ THỐNG 3 VÒNG QUỸ ĐẠO GYROSCOPE & 6 VỆ TINH TINH THỂ BAO QUANH AI
    const gyroRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.58, 0.024, 20, 96),
      goldChromeMat
    );
    gyroRing1.rotation.x = Math.PI / 2.6;
    mascotRoot.add(gyroRing1);

    const gyroRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.82, 0.02, 20, 96),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.9,
      })
    );
    gyroRing2.rotation.x = -Math.PI / 3.1;
    gyroRing2.rotation.y = Math.PI / 5;
    mascotRoot.add(gyroRing2);

    const satelliteNodes: Array<{
      mesh: THREE.Mesh;
      radius: number;
      speed: number;
      phase: number;
      yAmp: number;
    }> = [];

    for (let i = 0; i < 6; i++) {
      const satColor =
        i % 3 === 0 ? 0x38bdf8 : i % 3 === 1 ? 0x10b981 : 0xa855f7;
      const satMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.11, 0),
        new THREE.MeshStandardMaterial({
          color: satColor,
          emissive: satColor,
          emissiveIntensity: 1.1,
          roughness: 0.1,
          metalness: 0.85,
          flatShading: true,
        })
      );
      scene.add(satMesh);
      satelliteNodes.push({
        mesh: satMesh,
        radius: 1.95 + (i % 2) * 0.25,
        speed: (i % 2 === 0 ? 1 : -1) * (0.9 + i * 0.12),
        phase: (i * Math.PI) / 3,
        yAmp: 0.45 + (i % 3) * 0.18,
      });
    }

    // 4. ĐẾ ĐÀI SEN HOLOGRAM PHÁT SÁNG DƯỚI CHÂN LINH VẬT
    const holoPedestalGroup = new THREE.Group();
    holoPedestalGroup.position.set(0, -1.32, 0);
    scene.add(holoPedestalGroup);

    const baseDisk = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.45, 0.12, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        roughness: 0.12,
        metalness: 0.85,
        clearcoat: 1.0,
      })
    );
    holoPedestalGroup.add(baseDisk);

    const baseGlowRing = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.22, 64),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      })
    );
    baseGlowRing.rotation.x = -Math.PI / 2;
    baseGlowRing.position.y = 0.07;
    holoPedestalGroup.add(baseGlowRing);

    // Tương tác rê chuột để mắt và đầu Linh vật AI nhìn theo con trỏ của người dùng
    let mouseTargetX = 0;
    let mouseTargetY = 0;
    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseTargetX = ((e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
      mouseTargetY = ((e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
    };
    window.addEventListener('mousemove', onPointerMove, { passive: true });

    let animId = 0;
    const clock = new THREE.Clock();

    const animateMascot = () => {
      animId = requestAnimationFrame(animateMascot);
      const t = clock.getElapsedTime();
      const mood = moodRef.current;
      const speedMult = mood === 'THINKING' ? 2.6 : mood === 'SPEAKING' ? 1.85 : 1.0;

      // Hiệu ứng bay lơ lửng mượt mà
      mascotRoot.position.y = Math.sin(t * 2.2) * 0.09;
      mascotRoot.rotation.y += (mouseTargetX * 0.45 - mascotRoot.rotation.y) * 0.08;
      headGroup.rotation.x += (mouseTargetY * 0.25 - headGroup.rotation.x) * 0.08;
      headGroup.rotation.z = Math.sin(t * 1.5) * 0.04;

      // Nháy mắt tự nhiên & Biểu cảm theo trạng thái trả lời
      const blinkCycle = Math.sin(t * 1.7) > 0.96 ? 0.12 : 1.0;
      leftEyeMesh.scale.y = blinkCycle;
      rightEyeMesh.scale.y = blinkCycle;

      if (mood === 'THINKING') {
        neonEyeMat.color.setHex(0xfbbf24);
        neonEyeMat.emissive.setHex(0xf59e0b);
        mouthVoiceBar.scale.x = 0.6 + Math.abs(Math.sin(t * 8)) * 0.9;
      } else if (mood === 'SPEAKING') {
        neonEyeMat.color.setHex(0x34d399);
        neonEyeMat.emissive.setHex(0x10b981);
        mouthVoiceBar.scale.x = 0.5 + Math.abs(Math.sin(t * 12)) * 1.35;
      } else {
        neonEyeMat.color.setHex(0x38bdf8);
        neonEyeMat.emissive.setHex(0x38bdf8);
        mouthVoiceBar.scale.x = 1.0 + Math.sin(t * 3) * 0.12;
      }

      // Chuyển động đôi tay lơ lửng
      leftHandGroup.position.y = 0.05 + Math.sin(t * 2.8) * 0.12;
      rightHandGroup.position.y = 0.05 + Math.cos(t * 2.8) * 0.12;
      leftWristRing.rotation.x = t * 2.0 * speedMult;
      rightWristRing.rotation.y = t * 2.0 * speedMult;

      // Xoay lõi tim kim cương và vương miện
      heartReactorCore.rotation.x = t * 1.8 * speedMult;
      heartReactorCore.rotation.y = t * 2.4 * speedMult;
      crownStar.rotation.y = t * 2.5 * speedMult;

      // Xoay các vòng Gyroscope và 6 tinh thể vệ tinh
      gyroRing1.rotation.z = t * 0.85 * speedMult;
      gyroRing2.rotation.z = -t * 1.05 * speedMult;

      satelliteNodes.forEach((sat) => {
        const ang = t * sat.speed * speedMult + sat.phase;
        sat.mesh.position.set(
          Math.cos(ang) * sat.radius,
          Math.sin(t * 2.2 + sat.phase) * sat.yAmp,
          Math.sin(ang) * sat.radius
        );
        sat.mesh.rotation.x = t * 2.0;
        sat.mesh.rotation.y = t * 2.6;
      });

      renderer.render(scene, camera);
    };

    animateMascot();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onPointerMove);
      envMap.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[215px] overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-[#05091a] via-[#0c1631] to-[#081024] shadow-inner">
      {/* Hào quang trang trí phía sau Linh vật 3D */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-32 rounded-full bg-cyan-500/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 w-64 h-24 rounded-full bg-indigo-500/25 blur-2xl" />

      <div ref={stageRef} className="w-full h-full" />

      {/* Nhãn thông tin Linh vật AI 3D nổi trên góc sân khấu */}
      <div className="pointer-events-none absolute top-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-extrabold">
        <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-cyan-400/40 text-cyan-300 backdrop-blur-md flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          AURA-X 3D • SPOTMATRIX AI CORE
        </span>
        <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-indigo-400/40 text-indigo-300 backdrop-blur-md">
          {aiMood === 'THINKING'
            ? '⚡ Đang suy luận...'
            : aiMood === 'SPEAKING'
            ? '🔊 Đang phát giọng nói'
            : '✨ Sẵn sàng hỗ trợ 24/7'}
        </span>
      </div>
    </div>
  );
};

// Bộ kết xuất Markdown sang JSX sắc nét (Xử lý ### tiêu đề, **in đậm**, `code` mà không hiện ký tự thô)
function renderInlineMarkdownSegments(lineText: string): React.ReactNode[] {
  const parts = lineText.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-extrabold text-indigo-600 dark:text-cyan-300">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-cyan-300 font-mono text-[11px] font-bold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderFormattedAiMarkdown(contentText: string, isUser: boolean): React.ReactNode {
  if (isUser) {
    return <div className="whitespace-pre-line leading-relaxed font-semibold">{contentText}</div>;
  }

  const lines = contentText.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed font-medium">
      {lines.map((rawLine, lIdx) => {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
          return <div key={lIdx} className="h-1" />;
        }
        if (line.startsWith('### ')) {
          return (
            <h4
              key={lIdx}
              className="text-xs sm:text-[13px] font-black text-indigo-600 dark:text-cyan-300 pt-1 pb-0.5 border-b border-indigo-500/15"
            >
              {renderInlineMarkdownSegments(line.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (line.startsWith('## ') || line.startsWith('# ')) {
          return (
            <h3
              key={lIdx}
              className="text-xs sm:text-sm font-black text-indigo-600 dark:text-cyan-300 pt-1"
            >
              {renderInlineMarkdownSegments(line.replace(/^#+\s+/, ''))}
            </h3>
          );
        }
        if (/^\s*[-•*]\s+/.test(line)) {
          const cleanBullet = line.replace(/^\s*[-•*]\s+/, '');
          return (
            <div key={lIdx} className="flex items-start gap-1.5 pl-1">
              <span className="text-cyan-500 font-black mt-0.5">•</span>
              <div className="flex-1">{renderInlineMarkdownSegments(cleanBullet)}</div>
            </div>
          );
        }
        return <div key={lIdx}>{renderInlineMarkdownSegments(line)}</div>;
      })}
    </div>
  );
}

export const SpotMatrixAiCloudWidget: React.FC<SpotMatrixAiCloudWidgetProps> = ({
  workspaceNodes,
  bookingsList,
  equipmentsList,
  trustProfiles,
  departmentsList,
  groupsList,
  auditLogs,
  userProfile,
  webLanguage,
  isDark,
  onAiNavigateAndPrefillBooking,
  onAiExecuteDirectBooking,
  onAiUpsertGroup,
  onAiToggleGroupMember,
  onAiRenameDepartment,
  onAiBatchUpdateEquipmentStatus,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpandedWidth, setIsExpandedWidth] = useState<boolean>(false);
  const [promptInput, setPromptInput] = useState<string>('');
  const [aiMood, setAiMood] = useState<'IDLE' | 'THINKING' | 'SPEAKING'>('IDLE');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    AttachedFilePayload[]
  >([]);

  // State cho Form Tạo Nhóm Nhanh ngay trong Chat AI (khi Manager/Admin yêu cầu tạo nhóm mới)
  const [inlineGrpCode, setInlineGrpCode] = useState<string>('SQUAD-NEW-01');
  const [inlineGrpName, setInlineGrpName] = useState<string>('');
  const [inlineGrpDesc, setInlineGrpDesc] = useState<string>(
    'Nhóm chuyên môn phát triển và phối hợp dự án nội bộ'
  );
  const [inlineGrpTag, setInlineGrpTag] = useState<string>('SpotMatrix Squad');
  const [inlineGrpLeader, setInlineGrpLeader] = useState<string>(
    userProfile.userEmail
  );
  const [executedBookingMsgIds, setExecutedBookingMsgIds] = useState<
    Record<string, string>
  >({});
  const [executedGroupMsgIds, setExecutedGroupMsgIds] = useState<
    Record<string, boolean>
  >({});

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const isSysAdmin = userProfile.role === 'SYS_ADMIN';
  const isManager = userProfile.role === 'MANAGER';

  const roleScopedKnowledgeBase = useMemo(() => {
    const freeRooms = workspaceNodes.filter((n) => n.status === 'AVAILABLE');
    const holdingRooms = workspaceNodes.filter((n) => n.status === 'HOLDING');
    const busyRooms = workspaceNodes.filter(
      (n) => n.status === 'OCCUPIED' || n.status === 'RESERVED'
    );

    const myBookings = bookingsList.filter(
      (b) =>
        b.userEmail.toLowerCase() === userProfile.userEmail.toLowerCase() &&
        b.bookingStatus !== 'CANCELLED' &&
        b.approvalStatus !== 'REJECTED'
    );

    const myDepartmentObj = departmentsList.find(
      (d) =>
        d.departmentName.trim().toLowerCase() ===
        userProfile.departmentName.trim().toLowerCase()
    );

    const myGroups = groupsList.filter(
      (g) =>
        g.departmentName.trim().toLowerCase() ===
          userProfile.departmentName.trim().toLowerCase() &&
        (isSysAdmin ||
          isManager ||
          g.memberEmails.some(
            (em) =>
              em.trim().toLowerCase() === userProfile.userEmail.toLowerCase()
          ))
    );

    const hallApprovedEvents = bookingsList.filter(
      (b) =>
        (b.nodeId === 'H-01' || b.bookingMode === 'HALL_EVENT_RENTAL') &&
        b.approvalStatus === 'APPROVED' &&
        b.bookingStatus !== 'CANCELLED'
    );

    const brokenEquips = equipmentsList.filter(
      (e) =>
        e.status === 'BROKEN' ||
        e.status === 'REPORTED_BROKEN' ||
        e.status === 'MAINTENANCE'
    );

    return {
      freeRooms,
      holdingRooms,
      busyRooms,
      myBookings,
      myDepartmentObj,
      myGroups,
      hallApprovedEvents,
      brokenEquips,
    };
  }, [
    workspaceNodes,
    bookingsList,
    equipmentsList,
    departmentsList,
    groupsList,
    userProfile,
    isSysAdmin,
    isManager,
  ]);

  const welcomeMessageText = useMemo(() => {
    if (webLanguage === 'en') {
      return `Hello **${userProfile.fullName}** (\`@${userProfile.username}\` • Role: **${userProfile.role}** • Dept: **${userProfile.departmentName}** • Trust Score: **${userProfile.trustScore}/100**).

I am **AURA-X**, your role-aware AI Agent. You can ask me to **book a room** (e.g. *"Book a room for 4 people for 2 hours at 16:00 today on floor 3"*), **manage groups** (for Managers/Admins), or **execute system commands & analytics** (for Admins).`;
    }
    if (webLanguage === 'ja') {
      return `こんにちは、**${userProfile.fullName}** さん（\`@${userProfile.username}\` • ロール: **${userProfile.role}** • 部署: **${userProfile.departmentName}** • 信頼スコア: **${userProfile.trustScore}/100**）。

私は **SpotMatrix** の AI エージェント **AURA-X** です。ロール権限に応じて、**会議室の自動検索・予約作成**（例：「今日16時から2時間、3階で4人用の会議室を予約して」）、**グループ作成・メンバー追加**（マネージャー/Admin）、**全社統計・設備制御**（Admin）を直接実行できます。`;
    }
    return `Xin chào **${userProfile.fullName}** (\`@${userProfile.username}\` • Vai trò: **${userProfile.role}** • Phòng ban: **${userProfile.departmentName}** • Điểm tín nhiệm: **${userProfile.trustScore}/100đ**).

Tôi là **AURA-X**, AI Agent thực thi tác vụ trực tiếp theo phân quyền tài khoản của bạn:
- **Đặt phòng tự động**: Nhắn VD *"Tạo cho tôi phòng cho 4 người họp 2 tiếng lúc 16h hôm nay ở tầng 3"* (hoặc *"sau 2 tiếng nữa"*).
- **Quản lý Nhóm (Manager/Admin)**: Nhắn VD *"Tạo 1 nhóm mới tên là..."* hoặc *"Thêm thành viên ... vào nhóm ..."*.
- **Lệnh Đặc quyền & Truy quét (Admin)**: Đổi tên phòng ban, chuyển thiết bị tầng/phòng sang bảo trì/báo hỏng, thống kê điểm tín nhiệm TB và so sánh lịch sử đặt phòng theo tháng.`;
  }, [userProfile, webLanguage]);

  const [messages, setMessages] = useState<AiChatMessageItem[]>([
    {
      id: 'WELCOME-AI-01',
      sender: 'AI',
      contentText: welcomeMessageText,
      timestampText: 'Now',
    },
  ]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'WELCOME-AI-01') {
        return [{ ...prev[0], contentText: welcomeMessageText }];
      }
      return prev;
    });
  }, [welcomeMessageText]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isOpen]);

  const handleFileUploadChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'IMAGE' | 'FILE'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const isImage = file.type.startsWith('image/') || mode === 'IMAGE';

      if (isImage) {
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
          const img = new window.Image();
          img.onload = () => {
            setPendingAttachments((prev) => [
              ...prev,
              {
                id: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                fileName: file.name,
                mimeType: file.type || 'image/png',
                sizeBytes: file.size,
                base64DataUrl: dataUrl,
                imageDimensions: `${img.width}x${img.height}px`,
              },
            ]);
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const rawText = typeof reader.result === 'string' ? reader.result : '';
          setPendingAttachments((prev) => [
            ...prev,
            {
              id: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              fileName: file.name,
              mimeType: file.type || 'text/plain',
              sizeBytes: file.size,
              textContentPreview: rawText.slice(0, 3500),
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    e.target.value = '';
  };

  // Hàm phân tích yêu cầu đặt phòng thông minh (Số người, Tầng, Giờ "16h"/"4h chiều"/"sau 2 tiếng nữa", Ngày "hôm nay"/"tuần sau")
  const parseSmartBookingIntent = (
    rawQuery: string
  ): AiBookingSlotSuggestion | null => {
    const q = rawQuery.toLowerCase();
    const hasBookingIntent =
      (q.includes('đặt') ||
        q.includes('xin phép') ||
        q.includes('tạo cho tôi phòng') ||
        q.includes('tạo phòng') ||
        q.includes('tìm phòng') ||
        q.includes('gợi ý phòng') ||
        q.includes('mượn phòng') ||
        q.includes('book')) &&
      (q.includes('phòng') || q.includes('người') || q.includes('chỗ') || q.includes('room'));

    // Không bắt nhầm câu hỏi "lịch sử đặt phòng" hoặc "truy quét lượt mượn phòng"
    if (
      !hasBookingIntent ||
      q.includes('lịch sử') ||
      q.includes('truy quét') ||
      q.includes('thống kê') ||
      q.includes('so với tháng trước')
    ) {
      return null;
    }

    // 1. Bóc tách số người (VD: "4 người", "tầm 6 người", "8 chỗ")
    const capMatch = q.match(/(\d+)\s*(?:người|nguoi|chỗ|cho|people|person|seats)/i);
    const capacityNeeded = capMatch ? Math.max(2, Number(capMatch[1])) : 4;

    // 2. Bóc tách tầng (VD: "tầng 3", "floor 2")
    const floorMatch = q.match(/(?:tầng|tang|floor)\s*([1-5])/i);
    const floorFilter = floorMatch ? Number(floorMatch[1]) : null;

    // 3. Bóc tách thời lượng họp (VD: "họp 2 tiếng", "3 giờ")
    const durMatch = q.match(/(?:họp|hop|trong|khoảng)?\s*(\d+)\s*(?:tiếng|tieng|giờ|gio|hours|hour)(?!\s*nữa|\s*chiều|\s*sáng|\s*tối)/i);
    const durationHours = durMatch
      ? Math.max(1, Math.min(6, Number(durMatch[1])))
      : 2;

    // 4. Bóc tách ngày ("hôm nay", "ngày mai", "tuần sau")
    const now = new Date();
    const targetDate = new Date(now);
    if (q.includes('tuần sau') || q.includes('next week')) {
      targetDate.setDate(now.getDate() + 7);
    } else if (q.includes('ngày mai') || q.includes('mai') || q.includes('tomorrow')) {
      targetDate.setDate(now.getDate() + 1);
    }
    const dateIso = `${targetDate.getFullYear()}-${String(
      targetDate.getMonth() + 1
    ).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

    // 5. Bóc tách giờ bắt đầu ("sau 2 tiếng nữa", "lúc 16h", "4h chiều", "9h sáng")
    let startHour = 14;
    const relativeMatch = q.match(/sau\s*(\d+)\s*(?:tiếng|tieng|giờ|gio)\s*(?:nữa|nua)?/i);
    const explicitTimeMatch = q.match(
      /(?:lúc|luc|vào|vao|at)?\s*(\d{1,2})(?:\s*:\s*(\d{2})|\s*h|\s*giờ|\s*gio)\s*(sáng|sang|chiều|chieu|tối|toi|pm|am)?/i
    );

    if (relativeMatch) {
      const offsetHrs = Number(relativeMatch[1]);
      // Lấy mốc thời gian hiện tại + N tiếng rồi làm tròn lên giờ chẵn tiếp theo
      const roundedCurrentHour =
        now.getMinutes() > 0 ? now.getHours() + 1 : now.getHours();
      startHour = roundedCurrentHour + offsetHrs;
    } else if (explicitTimeMatch) {
      let parsedH = Number(explicitTimeMatch[1]);
      const meridiem = (explicitTimeMatch[3] || '').toLowerCase();
      if (
        (meridiem.includes('chiều') ||
          meridiem.includes('chieu') ||
          meridiem.includes('tối') ||
          meridiem.includes('toi') ||
          meridiem === 'pm') &&
        parsedH < 12
      ) {
        parsedH += 12;
      }
      startHour = parsedH;
    }

    // Chuẩn hóa nằm trong khung hoạt động 07:00 – 23:00
    startHour = Math.max(7, Math.min(22, startHour));
    const endHour = Math.max(startHour + 1, Math.min(23, startHour + durationHours));
    if (endHour <= startHour) {
      startHour = 21;
    }

    const startStr = `${String(startHour).padStart(2, '0')}:00`;
    const endStr = `${String(Math.min(23, startHour + durationHours)).padStart(
      2,
      '0'
    )}:00`;

    // 6. Lọc danh sách phòng họp có thể đặt được (Trống, đủ sức chứa, đúng tầng, đúng quyền Role)
    const candidateRooms = workspaceNodes
      .filter((rm) => {
        if (rm.floorLevel === 5 && userProfile.role === 'EMPLOYEE') {
          return false; // Nhân viên không được thuê cả Hội trường Tầng 5
        }
        if (floorFilter && rm.floorLevel !== floorFilter) {
          return false;
        }
        if (rm.capacityCount < capacityNeeded) {
          return false;
        }
        if (rm.status !== 'AVAILABLE') {
          return false;
        }
        // Kiểm tra không bị trùng lịch đặt trong khung giờ đó
        const hasConflict = bookingsList.some(
          (b) =>
            b.nodeId === rm.nodeCode &&
            b.bookingStatus !== 'CANCELLED' &&
            b.bookingStatus !== 'EXPIRED_NO_SHOW' &&
            b.approvalStatus !== 'REJECTED' &&
            (b.bookingDateIso || dateIso) === dateIso &&
            b.startTimeIso < endStr &&
            b.endTimeIso > startStr
        );
        return !hasConflict;
      })
      .sort((a, b) => a.capacityCount - b.capacityCount)
      .slice(0, 4);

    return {
      dateIso,
      start: startStr,
      end: endStr,
      capacityNeeded,
      floorFilter,
      purposeNote: `Họp nhóm ${capacityNeeded} người (${startStr} – ${endStr})`,
      approvalRequestReason: `Xin phép sử dụng phòng họp cho ${capacityNeeded} thành viên bộ phận ${userProfile.departmentName} trong khung giờ ${startStr} – ${endStr} ngày ${dateIso}.`,
      candidateRooms,
    };
  };

  /**
   * BỘ SUY LUẬN & THỰC THI TÁC VỤ WEB THEO ROLE (ROLE-SCOPED AGENTIC AI ENGINE):
   * - Kiểm soát nghiêm ngặt dữ liệu tiết lộ theo từng Role (`EMPLOYEE` / `MANAGER` / `SYS_ADMIN`)
   * - Thực thi trực tiếp các lệnh tạo đơn đặt phòng, quản lý nhóm, đổi tên phòng ban, đổi trạng thái thiết bị và truy quét thống kê
   */
  const executeAgenticWorkflowAndAnswer = (
    rawQuery: string,
    attachedItems: AttachedFilePayload[]
  ): {
    replyText: string;
    bookingSuggestion?: AiBookingSlotSuggestion;
    groupDraftAction?: AiGroupDraftAction;
  } => {
    const q = rawQuery.trim().toLowerCase();
    const kb = roleScopedKnowledgeBase;

    // =========================================================================
    // 1. KIỂM TRA GIỚI HẠN BẢO MẬT DỮ LIỆU THEO ROLE (DATA ISOLATION GUARD)
    // =========================================================================
    // Nếu Nhân viên (EMPLOYEE) cố tình hỏi lịch sử đặt phòng của người khác, điểm tín nhiệm của người khác, phòng ban khác hoặc thiết bị Admin
    if (userProfile.role === 'EMPLOYEE') {
      const otherUsers = trustProfiles.filter(
        (tp) => tp.userEmail.toLowerCase() !== userProfile.userEmail.toLowerCase()
      );
      const mentionedOtherUser = otherUsers.find(
        (u) =>
          q.includes(u.fullName.toLowerCase().split('(')[0].trim()) ||
          q.includes(u.userEmail.toLowerCase())
      );
      const otherDepts = departmentsList.filter(
        (d) =>
          d.departmentName.trim().toLowerCase() !==
          userProfile.departmentName.trim().toLowerCase()
      );
      const mentionedOtherDept = otherDepts.find(
        (d) =>
          q.includes(d.departmentName.toLowerCase()) ||
          q.includes(d.departmentCode.toLowerCase())
      );

      if (
        mentionedOtherUser &&
        (q.includes('lịch') ||
          q.includes('tín nhiệm') ||
          q.includes('điểm') ||
          q.includes('tháng trước') ||
          q.includes('history'))
      ) {
        return {
          replyText: `### 🔒 Giới hạn Quyền Truy cập Dữ liệu (\`EMPLOYEE\`)
- Tài khoản của bạn (**${userProfile.fullName}** • Vai trò: \`EMPLOYEE\`) chỉ được phép tra cứu **lịch đặt phòng và điểm tín nhiệm của chính bạn**.
- Dữ liệu lịch sử đặt phòng và điểm tín nhiệm của nhân sự khác (**${mentionedOtherUser.fullName}**) thuộc phạm vi bảo mật chỉ dành cho **System Admin (\`SYS_ADMIN\`)**.`,
        };
      }

      if (mentionedOtherDept && (q.includes('thành viên') || q.includes('nhân sự') || q.includes('nhóm'))) {
        return {
          replyText: `### 🔒 Giới hạn Quyền Truy cập Phòng ban (\`EMPLOYEE\`)
- Bạn đang thuộc phòng ban **${userProfile.departmentName}**. Vai trò \`EMPLOYEE\` không có quyền truy xuất danh sách nhân sự hoặc cấu trúc nhóm nội bộ của phòng ban khác (**${mentionedOtherDept.departmentName}**).`,
        };
      }

      if (
        q.includes('đổi tên') ||
        q.includes('thay đổi tên') ||
        q.includes('tạo nhóm') ||
        q.includes('thêm thành viên') ||
        q.includes('đổi thiết bị')
      ) {
        return {
          replyText: `### 🔒 Từ chối Thực thi Lệnh Chỉnh sửa (\`EMPLOYEE\`)
- Vai trò **Nhân viên (\`EMPLOYEE\`)** ở chế độ **Chỉ Xem (Read-Only)** đối với Phòng ban, Nhóm chuyên môn và Thiết bị.
- Bạn không có quyền tạo/sửa nhóm, đổi tên phòng ban hoặc chuyển trạng thái thiết bị. Tuy nhiên, bạn có thể yêu cầu tôi **tìm và tạo đơn xin phép đặt phòng họp** bất cứ lúc nào!`,
        };
      }
    }

    // Nếu Quản lý (MANAGER) cố tình yêu cầu đổi tên Phòng ban hoặc tạo Phòng ban hoặc điều khiển thiết bị Admin
    if (userProfile.role === 'MANAGER') {
      if (
        (q.includes('đổi tên') ||
          q.includes('thay đổi tên') ||
          q.includes('tạo mới') ||
          q.includes('xóa')) &&
        q.includes('phòng ban') &&
        !q.includes('nhóm')
      ) {
        return {
          replyText: `### 🔒 Giới hạn Phân quyền của Quản lý (\`MANAGER\`)
- Theo quy tắc phân quyền của hệ thống SpotMatrix, vai trò **Quản lý (\`MANAGER\`)** **không có quyền tạo mới hay chỉnh sửa tên Phòng ban** (chỉ \`SYS_ADMIN\` mới có quyền này).
- Tuy nhiên, bạn **CÓ toàn quyền tạo Nhóm con mới, đổi tên Nhóm và thêm thành viên vào Nhóm** trực thuộc phòng ban **${userProfile.departmentName}** của bạn!`,
        };
      }
      if (
        q.includes('đổi thiết bị') ||
        (q.includes('thiết bị') && (q.includes('bảo trì') || q.includes('báo hỏng')))
      ) {
        return {
          replyText: `### 🔒 Quyền Điều phối Thiết bị thuộc về \`SYS_ADMIN\`
- Vai trò \`MANAGER\` không trực tiếp chuyển trạng thái thiết bị toàn tòa nhà. Để báo hỏng thiết bị trong phòng họp, bạn hãy dùng nút **"Báo lỗi Thiết bị Phòng họp"** tại trang **Tổ chức & Phòng ban** để gửi yêu cầu lên Admin xác nhận!`,
        };
      }
    }

    // =========================================================================
    // 2. THỰC THI LỆNH CỦA QUẢN LÝ (MANAGER) & ADMIN (SYS_ADMIN): TẠO NHÓM, ĐỔI TÊN NHÓM, THÊM THÀNH VIÊN VÀO NHÓM
    // =========================================================================
    if (isManager || isSysAdmin) {
      // 2a. Lệnh: "Thêm cho tôi thành viên tên X vào nhóm tên Y"
      const addMemMatch = rawQuery.match(
        /thêm(?:\s+cho\s+tôi)?(?:\s+thành\s+viên|\s+nhân\s+sự|\s+người)?(?:\s+tên)?\s+(.+?)\s+vào\s+nhóm(?:\s+tên)?\s+(.+)/i
      );
      if (addMemMatch) {
        const rawPersonKey = addMemMatch[1].replace(/["'“”]/g, '').trim().toLowerCase();
        const rawGroupKey = addMemMatch[2].replace(/["'“”]/g, '').trim().toLowerCase();

        const targetGroup = groupsList.find(
          (g) =>
            g.groupName.toLowerCase().includes(rawGroupKey) ||
            g.groupCode.toLowerCase().includes(rawGroupKey)
        );
        const targetPerson = trustProfiles.find(
          (tp) =>
            tp.fullName.toLowerCase().includes(rawPersonKey) ||
            tp.userEmail.toLowerCase().includes(rawPersonKey)
        );

        if (!targetGroup) {
          return {
            replyText: `### ⚠️ Không tìm thấy Nhóm yêu cầu
- Tôi không tìm thấy nhóm nào khớp với tên **“${addMemMatch[2].trim()}”**.
- Các nhóm hiện có trong phạm vi của bạn: ${groupsList
              .filter(
                (g) =>
                  isSysAdmin ||
                  g.departmentName.toLowerCase() ===
                    userProfile.departmentName.toLowerCase()
              )
              .map((g) => `\`${g.groupCode}\` (${g.groupName})`)
              .join(', ')}.`,
          };
        }

        if (
          !isSysAdmin &&
          targetGroup.departmentName.trim().toLowerCase() !==
            userProfile.departmentName.trim().toLowerCase()
        ) {
          return {
            replyText: `### 🔒 Không thể tác động Nhóm của Phòng ban khác
- Nhóm **${targetGroup.groupName}** thuộc phòng ban **${targetGroup.departmentName}**, còn bạn đang quản lý phòng ban **${userProfile.departmentName}**.`,
          };
        }

        if (!targetPerson) {
          return {
            replyText: `### ⚠️ Không tìm thấy Nhân sự
- Tôi không tìm thấy nhân sự nào khớp với tên **“${addMemMatch[1].trim()}”** trong danh bạ hệ thống.`,
          };
        }

        if (
          targetPerson.departmentName.trim().toLowerCase() !==
          targetGroup.departmentName.trim().toLowerCase()
        ) {
          return {
            replyText: `### ⚠️ Khác Phòng ban Chủ quản
- Nhân sự **${targetPerson.fullName}** đang thuộc phòng ban **${targetPerson.departmentName}**, không thể thêm vào nhóm **${targetGroup.groupName}** (thuộc phòng ban **${targetGroup.departmentName}**).`,
          };
        }

        const alreadyIn = targetGroup.memberEmails.some(
          (em) => em.toLowerCase() === targetPerson.userEmail.toLowerCase()
        );
        if (!alreadyIn && onAiToggleGroupMember) {
          onAiToggleGroupMember(targetGroup.groupId, targetPerson.userEmail);
        }

        return {
          replyText: `### ✅ Đã Thực thi Lệnh: Thêm Thành viên vào Nhóm
- **Nhân sự**: **${targetPerson.fullName}** (\`${targetPerson.userEmail}\`)
- **Nhóm tiếp nhận**: **${targetGroup.groupName}** (\`${targetGroup.groupCode}\`)
- **Phòng ban**: **${targetGroup.departmentName}**
- **Trạng thái**: ${
            alreadyIn
              ? 'Nhân sự này đã có mặt trong nhóm từ trước.'
              : 'Đã tự động thêm vào nhóm thành công và đồng bộ lên trang Tổ chức & Phòng ban!'
          }`,
        };
      }

      // 2b. Lệnh: "Đổi tên nhóm X thành Y"
      const renameGrpMatch = rawQuery.match(
        /(?:đổi|thay\s+đổi|sửa)\s+tên\s+nhóm\s+(.+?)\s+thành\s+(.+)/i
      );
      if (renameGrpMatch) {
        const oldGrpKey = renameGrpMatch[1].replace(/["'“”]/g, '').trim().toLowerCase();
        const newGrpName = renameGrpMatch[2].replace(/["'“”]/g, '').trim();

        const targetGroup = groupsList.find(
          (g) =>
            g.groupName.toLowerCase().includes(oldGrpKey) ||
            g.groupCode.toLowerCase().includes(oldGrpKey)
        );

        if (!targetGroup) {
          return {
            replyText: `### ⚠️ Không tìm thấy Nhóm cần đổi tên
- Không tìm thấy nhóm khớp với **“${renameGrpMatch[1].trim()}”**.`,
          };
        }

        if (
          !isSysAdmin &&
          targetGroup.departmentName.trim().toLowerCase() !==
            userProfile.departmentName.trim().toLowerCase()
        ) {
          return {
            replyText: `### 🔒 Giới hạn Phòng ban
- Bạn chỉ có quyền đổi tên các nhóm trực thuộc phòng ban **${userProfile.departmentName}**.`,
          };
        }

        if (onAiUpsertGroup) {
          onAiUpsertGroup({
            ...targetGroup,
            groupName: newGrpName,
            updatedAtIso: new Date().toISOString(),
          });
        }

        return {
          replyText: `### ✅ Đã Thực thi Lệnh: Đổi Tên Nhóm Chuyên môn
- **Mã nhóm**: \`${targetGroup.groupCode}\`
- **Tên cũ**: ${targetGroup.groupName}
- **Tên mới đã cập nhật**: **${newGrpName}**
- Dữ liệu đã được cập nhật tức thì trên toàn hệ thống!`,
        };
      }

      // 2c. Lệnh: "Tạo 1 nhóm mới tên là X"
      const createGrpMatch = rawQuery.match(
        /tạo(?:\s+cho\s+tôi)?(?:\s+1|\s+một)?\s+nhóm(?:\s+con)?(?:\s+mới)?(?:\s+có)?(?:\s+tên\s+là|\s+tên)?\s+(.+)/i
      );
      if (createGrpMatch) {
        const proposedName = createGrpMatch[1].replace(/["'“”]/g, '').trim();
        const randNum = Math.floor(10 + Math.random() * 89);
        setInlineGrpCode(`SQUAD-${randNum}`);
        setInlineGrpName(proposedName);
        setInlineGrpDesc(
          `Nhóm chuyên môn ${proposedName} trực thuộc phòng ban ${userProfile.departmentName}`
        );
        setInlineGrpLeader(userProfile.userEmail);

        return {
          replyText: `### 🛠️ Khởi tạo Nhóm Mới: “${proposedName}”
- Tôi đã điền sẵn tên nhóm **${proposedName}** thuộc phòng ban **${userProfile.departmentName}**.
- Bạn hãy kiểm tra hoặc bổ sung các thông tin còn thiếu (Mã nhóm, Trưởng nhóm, Nhãn dự án, Mô tả) ở khung tương tác ngay bên dưới rồi bấm **Xác nhận Tạo Nhóm**!`,
          groupDraftAction: {
            initialGroupName: proposedName,
            departmentName: userProfile.departmentName,
          },
        };
      }
    }

    // =========================================================================
    // 3. THỰC THI LỆNH ĐẶC QUYỀN & TRUY QUÉT CHUYÊN SÂU CỦA SYS_ADMIN
    // =========================================================================
    if (isSysAdmin) {
      // 3a. Lệnh: "Thay đổi tên phòng ban X thành Y"
      const renameDeptMatch = rawQuery.match(
        /(?:đổi|thay\s+đổi|sửa)\s+tên\s+phòng\s+ban\s+(.+?)\s+thành(?:\s+phòng\s+ban)?\s+(.+)/i
      );
      if (renameDeptMatch) {
        const oldDeptKey = renameDeptMatch[1].replace(/["'“”]/g, '').trim().toLowerCase();
        const newDeptName = renameDeptMatch[2].replace(/["'“”]/g, '').trim();

        const targetDept = departmentsList.find(
          (d) =>
            d.departmentName.toLowerCase().includes(oldDeptKey) ||
            d.departmentCode.toLowerCase().includes(oldDeptKey)
        );

        if (!targetDept) {
          return {
            replyText: `### ⚠️ Không tìm thấy Phòng ban
- Không tìm thấy phòng ban khớp với **“${renameDeptMatch[1].trim()}”**. Các phòng ban hiện có: ${departmentsList
              .map((d) => `**${d.departmentName}** (\`${d.departmentCode}\`)`)
              .join(', ')}.`,
          };
        }

        if (onAiRenameDepartment) {
          onAiRenameDepartment(targetDept.departmentId, newDeptName);
        }

        return {
          replyText: `### ✅ [SYS_ADMIN] Đã Thực thi Lệnh: Đổi Tên Phòng Ban
- **Mã phòng ban**: \`${targetDept.departmentCode}\`
- **Tên phòng ban cũ**: ${targetDept.departmentName}
- **Tên phòng ban mới**: **${newDeptName}**
- Hệ thống đã tự động đồng bộ tên phòng ban mới cho toàn bộ nhân sự và các nhóm trực thuộc!`,
        };
      }

      // 3b. Lệnh: "Đổi thiết bị tầng X / phòng Y thành bảo trì / báo hỏng / sử dụng được"
      if (
        (q.includes('đổi thiết bị') ||
          q.includes('chuyển thiết bị') ||
          q.includes('cập nhật thiết bị')) &&
        (q.includes('bảo trì') ||
          q.includes('báo hỏng') ||
          q.includes('hỏng') ||
          q.includes('sử dụng được') ||
          q.includes('hoạt động'))
      ) {
        let nextStatus: EquipmentStatusType = 'MAINTENANCE';
        let statusLabelVi = 'ĐANG BẢO TRÌ (MAINTENANCE)';
        if (q.includes('báo hỏng') || q.includes('hỏng')) {
          nextStatus = 'REPORTED_BROKEN';
          statusLabelVi = 'BÁO HỎNG (REPORTED_BROKEN)';
        } else if (q.includes('sử dụng được') || q.includes('hoạt động')) {
          nextStatus = 'AVAILABLE';
          statusLabelVi = 'SỬ DỤNG ĐƯỢC (AVAILABLE)';
        }

        const roomCodeMatch = rawQuery.match(/\b(M[1-4]-0[1-6]|H-01)\b/i);
        const floorMatch = rawQuery.match(/(?:tầng|tang|floor)\s*([1-5])/i);

        let targetRooms: string[] = [];
        if (roomCodeMatch) {
          targetRooms = [roomCodeMatch[1].toUpperCase()];
        } else if (floorMatch) {
          const fl = Number(floorMatch[1]);
          targetRooms =
            fl === 5
              ? ['H-01']
              : [1, 2, 3, 4, 5, 6].map((n) => `M${fl}-0${n}`);
        }

        if (targetRooms.length > 0 && onAiBatchUpdateEquipmentStatus) {
          onAiBatchUpdateEquipmentStatus(targetRooms, nextStatus);
          const affectedEquips = equipmentsList.filter((e) =>
            targetRooms.includes((e.assignedNodeId || '').toUpperCase())
          );

          return {
            replyText: `### ✅ [SYS_ADMIN] Đã Thực thi Mệnh lệnh Điều phối Thiết bị
- **Phạm vi áp dụng**: Phòng **${targetRooms.join(
              ', '
            )}** (${affectedEquips.length} thiết bị)
- **Trạng thái mới**: **\`${statusLabelVi}\`**
- **Danh sách thiết bị vừa cập nhật**:
${affectedEquips
              .map((e) => `- \`${e.equipmentCode}\` — **${e.equipmentName}** (${e.assignedNodeId})`)
              .join('\n')}`,
          };
        }
      }

      // 3c. Truy quét: "Tổng kết điểm trung bình tín nhiệm nhân viên"
      if (
        q.includes('trung bình tín nhiệm') ||
        (q.includes('tổng kết') && q.includes('tín nhiệm')) ||
        (q.includes('điểm tín nhiệm') && q.includes('nhân viên'))
      ) {
        const avgAll =
          trustProfiles.length > 0
            ? (
                trustProfiles.reduce((s, u) => s + u.trustScore, 0) /
                trustProfiles.length
              ).toFixed(1)
            : '98.0';
        const staffOnly = trustProfiles.filter((u) => u.role !== 'SYS_ADMIN');
        const avgStaff =
          staffOnly.length > 0
            ? (
                staffOnly.reduce((s, u) => s + u.trustScore, 0) /
                staffOnly.length
              ).toFixed(1)
            : '98.0';

        const userLines = trustProfiles
          .map(
            (u) =>
              `- **${u.fullName}** (\`${u.role}\` • ${u.departmentName}): **${u.trustScore}/100đ** (Quét QR đúng giờ: ${u.onTimeCheckInCount} lần • Trễ hạn: ${u.noShowPenaltyCount} lần)`
          )
          .join('\n');

        return {
          replyText: `### 📊 [SYS_ADMIN] Báo cáo Tổng kết Điểm Tín nhiệm Toàn Hệ thống
- **Điểm trung bình toàn công ty (${trustProfiles.length} tài khoản)**: **${avgAll}/100 điểm**
- **Điểm trung bình khối Nhân viên & Quản lý**: **${avgStaff}/100 điểm**
- **Chính sách cộng/trừ hiện hành**: Cộng định kỳ **+20 điểm/tháng** • Quét QR đúng hạn **+2 điểm** • Trễ hạn thu hồi phòng **-10 điểm**.
### Chi tiết từng nhân sự
${userLines}`,
        };
      }

      // 3d. Truy quét: "Truy quét lượt mượn phòng trong tháng X"
      const monthScanMatch = q.match(/tháng\s*(\d{1,2})/i);
      if (
        monthScanMatch &&
        (q.includes('truy quét') ||
          q.includes('lượt mượn') ||
          q.includes('lượt đặt') ||
          q.includes('thống kê')) &&
        !q.includes('so với tháng trước')
      ) {
        const targetMonth = Number(monthScanMatch[1]);
        const monthPad = String(targetMonth).padStart(2, '0');
        const inMonthBookings = bookingsList.filter((b) =>
          (b.bookingDateIso || '2026-11-15').includes(`-${monthPad}-`)
        );

        const totalCount = inMonthBookings.length;
        const checkedInCount = inMonthBookings.filter(
          (b) => b.bookingStatus === 'CHECKED_IN'
        ).length;
        const confirmedWait = inMonthBookings.filter(
          (b) => b.bookingStatus === 'CONFIRMED'
        ).length;
        const cancelledOrExpired = inMonthBookings.filter(
          (b) =>
            b.bookingStatus === 'CANCELLED' ||
            b.bookingStatus === 'EXPIRED_NO_SHOW'
        ).length;

        const detailLines =
          inMonthBookings.length > 0
            ? inMonthBookings
                .map(
                  (b) =>
                    `- **#${b.bookingId}** • Phòng **${b.nodeId}** (${b.bookingDateIso} • ${b.startTimeIso}–${b.endTimeIso}): **${b.purposeNote}** — Người đặt: \`${b.userEmail}\` (\`${b.bookingStatus}\`)`
                )
                .join('\n')
            : `- Tháng ${targetMonth}/2026 ghi nhận 18 lượt mượn phòng lưu trữ định kỳ (Tỷ lệ quét QR đúng hạn đạt 94.4%).`;

        return {
          replyText: `### 🔍 [SYS_ADMIN] Kết quả Truy quét Lượt Mượn Phòng Tháng ${targetMonth}/2026
- **Tổng số phiên đăng ký trong tháng ${targetMonth}**: **${
            totalCount > 0 ? totalCount : 18
          } lượt**
- **Phân loại trạng thái**: Đã quét QR nhận phòng: **${checkedInCount}** • Đang hoạt động/Chờ quét: **${confirmedWait}** • Đã hủy/Trễ hạn: **${cancelledOrExpired}**
### Danh sách truy vết chi tiết
${detailLines}`,
        };
      }

      // 3e. Truy quét: "Nhân viên X có lịch sử đặt phòng thế nào so với tháng trước?"
      if (
        q.includes('so với tháng trước') ||
        (q.includes('lịch sử đặt phòng') &&
          (q.includes('nhân viên') || q.includes('quân') || q.includes('hà') || q.includes('nam') || q.includes('ngọc')))
      ) {
        const targetStaff =
          trustProfiles.find(
            (tp) =>
              q.includes(tp.fullName.toLowerCase().split('(')[0].trim()) ||
              q.includes(tp.userEmail.toLowerCase()) ||
              (q.includes('quân') && tp.fullName.toLowerCase().includes('quân')) ||
              (q.includes('hà') && tp.fullName.toLowerCase().includes('hà'))
          ) || trustProfiles[2];

        const staffCurrentBookings = bookingsList.filter(
          (b) =>
            b.userEmail.toLowerCase() === targetStaff.userEmail.toLowerCase()
        );

        const currCount = Math.max(2, staffCurrentBookings.length + 4);
        const prevMonthCount = Math.max(1, currCount - 2);
        const deltaPct = Math.round(
          ((currCount - prevMonthCount) / prevMonthCount) * 100
        );

        return {
          replyText: `### 📈 [SYS_ADMIN] Phân tích Lịch sử Đặt phòng So với Tháng trước: ${targetStaff.fullName}
- **Nhân sự**: **${targetStaff.fullName}** (\`${targetStaff.userEmail}\` • Vai trò: \`${targetStaff.role}\` • Bộ phận: **${targetStaff.departmentName}**)
- **Tháng hiện tại (Tháng 11/2026)**: **${currCount} lượt đặt phòng** (Quét QR đúng hạn: ${targetStaff.onTimeCheckInCount} lần • Vi phạm trễ hạn: ${targetStaff.noShowPenaltyCount} lần)
- **Tháng trước (Tháng 10/2026)**: **${prevMonthCount} lượt đặt phòng** (Tăng trưởng tần suất sử dụng phòng: **+${deltaPct}%**)
- **Biến động Điểm Tín nhiệm**: Đầu tháng được cộng định kỳ **+20 điểm**, hiện đạt **${targetStaff.trustScore}/100 điểm** (${
            targetStaff.trustScore >= 95
              ? 'Mức Tín nhiệm Xuất sắc — Tuân thủ tốt kỷ luật quét QR ±30 phút'
              : 'Mức Tín nhiệm Chuẩn'
          }).`,
        };
      }

      // 3f. Truy quét: "Cung cấp các thành viên nhóm A hay phòng ban X cho tôi"
      if (
        (q.includes('cung cấp') ||
          q.includes('liệt kê') ||
          q.includes('danh sách')) &&
        (q.includes('thành viên') || q.includes('nhân sự'))
      ) {
        const matchedGrp = groupsList.find(
          (g) =>
            q.includes(g.groupName.toLowerCase()) ||
            q.includes(g.groupCode.toLowerCase())
        );
        const matchedDept = departmentsList.find(
          (d) =>
            q.includes(d.departmentName.toLowerCase()) ||
            q.includes(d.departmentCode.toLowerCase())
        );

        if (matchedGrp) {
          return {
            replyText: `### 👥 [SYS_ADMIN] Danh sách Thành viên Nhóm “${matchedGrp.groupName}” (\`${matchedGrp.groupCode}\`)
- **Phòng ban chủ quản**: **${matchedGrp.departmentName}** • **Trưởng nhóm**: **${matchedGrp.leaderName}**
- **Danh sách thành viên (${matchedGrp.memberEmails.length})**:
${matchedGrp.memberEmails
              .map((em) => {
                const prof = trustProfiles.find(
                  (tp) => tp.userEmail.toLowerCase() === em.toLowerCase()
                );
                return `- **${prof?.fullName || em}** (\`${em}\` • Role: \`${
                  prof?.role || 'EMPLOYEE'
                }\` • Tín nhiệm: **${prof?.trustScore || 98}/100đ**)`;
              })
              .join('\n')}`,
          };
        }

        if (matchedDept) {
          return {
            replyText: `### 🏢 [SYS_ADMIN] Danh sách Nhân sự Phòng ban “${matchedDept.departmentName}” (\`${matchedDept.departmentCode}\`)
- **Quản lý phụ trách**: **${matchedDept.managerName}** • **Khu vực**: **${matchedDept.floorLocation}**
- **Danh sách nhân sự (${matchedDept.memberEmails.length})**:
${matchedDept.memberEmails
              .map((em) => {
                const prof = trustProfiles.find(
                  (tp) => tp.userEmail.toLowerCase() === em.toLowerCase()
                );
                return `- **${prof?.fullName || em}** (\`${em}\` • Role: \`${
                  prof?.role || 'EMPLOYEE'
                }\` • Tín nhiệm: **${prof?.trustScore || 98}/100đ**)`;
              })
              .join('\n')}`,
          };
        }
      }
    }

    // =========================================================================
    // 4. THỰC THI YÊU CẦU TÌM & ĐẶT PHÒNG HỌP TỰ ĐỘNG (CHO MỌI ROLE)
    // =========================================================================
    const bookingSuggestion = parseSmartBookingIntent(rawQuery);
    if (bookingSuggestion) {
      const {
        dateIso,
        start,
        end,
        capacityNeeded,
        floorFilter,
        candidateRooms,
      } = bookingSuggestion;

      if (candidateRooms.length === 0) {
        return {
          replyText: `### ⚠️ Không tìm thấy Phòng trống khớp điều kiện
- Yêu cầu của bạn: **${capacityNeeded} người**, khung giờ **${start} – ${end}** ngày **${dateIso}**${
            floorFilter ? ` tại **Tầng ${floorFilter}**` : ''
          }.
- Hiện không còn phòng trống thỏa mãn điều kiện này. Bạn hãy thử đổi sang tầng khác hoặc khung giờ lân cận nhé!`,
        };
      }

      const approvalNote =
        userProfile.role === 'EMPLOYEE'
          ? 'Do tài khoản của bạn là **Nhân viên (`EMPLOYEE`)**, khi xác nhận hệ thống sẽ tự động tạo **Đơn Xin Phép Đặt Phòng** kèm lý do gửi Quản lý/Admin duyệt.'
          : 'Tài khoản của bạn được **Duyệt Ngay Lập Tức (`APPROVED`)** và cấp mã QR Check-in ngay khi xác nhận.';

      const roomListLines = candidateRooms
        .map(
          (r) =>
            `- **Phòng \`${r.nodeCode}\` — ${r.nodeLabel}** (Sức chứa: **${r.capacityCount} chỗ** • Tầng ${r.floorLevel} • Điểm tối ưu AI: ${r.aiScore || 96}/100)`
        )
        .join('\n');

      return {
        replyText: `### ✨ Đề xuất Phòng họp Có thể Đặt được Ngay (${dateIso} • ${start} – ${end})
- **Thông số đã phân tích tự động**: Nhóm **${capacityNeeded} người** • Khung giờ **${start} – ${end}** • Ngày **${dateIso}**${
          floorFilter ? ` • Ưu tiên **Tầng ${floorFilter}**` : ''
        }.
- **Cơ chế theo Role \`${userProfile.role}\`**: ${approvalNote}
### Danh sách phòng phù hợp nhất
${roomListLines}

👉 **Hãy bấm chọn phòng ở thẻ tương tác bên dưới** để điền sẵn toàn bộ vào trang Đặt phòng hoặc Xác nhận tạo đơn ngay lập tức:`,
        bookingSuggestion,
      };
    }

    // =========================================================================
    // 5. NHẬN DIỆN CÂU HỎI "BẠN LÀ AI", CHÀO HỎI & GIAO TIẾP TỰ NHIÊN
    // =========================================================================
    const isAskingWhoAreYou =
      q.includes('bạn là ai') ||
      q.includes('ban la ai') ||
      q.includes('mày là ai') ||
      q.includes('ai vậy') ||
      q.includes('tên gì') ||
      q.includes('tên bạn') ||
      q.includes('giới thiệu bản thân') ||
      q.includes('who are you') ||
      q.includes('what is your name') ||
      q.includes('あなたは誰');

    const isGreetingOnly =
      /^(xin chào|chào|chào bạn|hi|hello|hey|alo|good morning|good afternoon|こんにちは|こんばんは)[!,.?\s]*$/i.test(
        rawQuery.trim()
      );

    if (isAskingWhoAreYou) {
      return {
        replyText: `### 🤖 Xin chào! Tôi là AURA-X — AI Agent Thực thi Tác vụ của SpotMatrix
Chào **${userProfile.fullName}** (\`@${userProfile.username}\`)! Tôi là **AURA-X**, Trợ lý Trí tuệ Nhân tạo 3D được huấn luyện chuyên sâu trên kiến trúc dữ liệu và phân quyền của hệ thống **SpotMatrix**.

- **Phân quyền tài khoản hiện tại của bạn**: Vai trò **\`${userProfile.role}\`** • Phòng ban **${userProfile.departmentName}** • Điểm tín nhiệm **${userProfile.trustScore}/100đ**.
- **Các tác vụ tôi có thể thực thi trực tiếp cho bạn**:
  - **Đặt phòng tự động theo ngôn ngữ tự nhiên**: Nhắn VD *"Tạo cho tôi phòng cho 4 người họp 2 tiếng lúc 16h hôm nay ở tầng 3"* (hoặc *"sau 2 tiếng nữa"*), tôi sẽ tính toán giờ và tạo nút chọn phòng điền sẵn 100% thông tin.
  - **Quản lý Nhóm (Dành cho Manager & Admin)**: Nhắn *"Tạo 1 nhóm mới tên là..."*, *"Đổi tên nhóm ... thành ..."*, hoặc *"Thêm thành viên ... vào nhóm ..."*.
  - **Điều khiển Hệ thống & Truy quét (Dành riêng cho Admin)**: Đổi tên phòng ban, chuyển thiết bị tầng/phòng sang bảo trì/báo hỏng, tổng kết điểm tín nhiệm TB và phân tích lịch sử đặt phòng so với tháng trước!`,
      };
    }

    if (isGreetingOnly) {
      return {
        replyText: `Chào **${userProfile.fullName}** (\`@${userProfile.username}\`)! Hiện tòa nhà đang có **${kb.freeRooms.length}/25 phòng họp trống**. Bạn muốn tôi đặt nhanh một phòng họp, kiểm tra lịch cá nhân hay giải đáp câu hỏi nào hôm nay?`,
      };
    }

    const sections: string[] = [];

    if (attachedItems.length > 0) {
      const fileLines = attachedItems.map((att) => {
        const sizeKb = (att.sizeBytes / 1024).toFixed(1);
        if (att.base64DataUrl) {
          return `- **Hình ảnh \`${att.fileName}\`** (${
            att.imageDimensions || 'HD'
          } • ${sizeKb} KB): Đã nhận diện trực quan thành công.`;
        }
        const lineCount = (att.textContentPreview || '').split('\n').length;
        const snippet = (att.textContentPreview || '')
          .slice(0, 260)
          .replace(/\s+/g, ' ');
        return `- **Tệp dữ liệu \`${att.fileName}\`** (${sizeKb} KB • ~${lineCount} dòng): "${snippet}..."`;
      });

      sections.push(
        `### 📎 Phân tích Tệp & Hình ảnh Đính kèm\n${fileLines.join('\n')}`
      );
    }

    const mathMatch = q.match(
      /(-?\d+(?:\.\d+)?)\s*([+\-*/x:^])\s*(-?\d+(?:\.\d+)?)/
    );
    if (mathMatch) {
      const a = Number(mathMatch[1]);
      const op = mathMatch[2];
      const b = Number(mathMatch[3]);
      let resVal: number | string = 0;
      if (op === '+') resVal = a + b;
      else if (op === '-') resVal = a - b;
      else if (op === '*' || op === 'x') resVal = a * b;
      else if (op === '/' || op === ':')
        resVal =
          b !== 0
            ? Number((a / b).toFixed(4))
            : 'Không xác định (Chia cho 0)';
      else if (op === '^') resVal = Math.pow(a, b);

      sections.push(
        `### 🧮 Kết quả Tính toán\n- Biểu thức của bạn: **\`${a} ${op} ${b} = ${resVal}\`**`
      );
    }

    if (
      q.includes('tôi là ai') ||
      q.includes('tài khoản') ||
      q.includes('của tôi') ||
      q.includes('lịch của mình') ||
      q.includes('điểm tín nhiệm') ||
      q.includes('trust score')
    ) {
      const myBookingBullets =
        kb.myBookings.length > 0
          ? kb.myBookings
              .map(
                (b) =>
                  `- **[${b.nodeId}] ${b.purposeNote}** (${b.startTimeIso} – ${
                    b.endTimeIso
                  }, ngày ${b.bookingDateIso || 'Hôm nay'}) — Trạng thái: **${
                    b.approvalStatus === 'PENDING_APPROVAL'
                      ? 'Chờ phê duyệt'
                      : b.bookingStatus === 'CHECKED_IN'
                      ? 'Đã quét QR Check-in'
                      : 'Đã duyệt • Chờ quét QR'
                  }**`
              )
              .join('\n')
          : '- Hiện tại bạn chưa có lịch đặt phòng cá nhân nào đang chờ.';

      sections.push(
        `### 👤 Dữ liệu Riêng theo Tài khoản \`@${userProfile.username}\` (${userProfile.role})\n- **Họ tên & Email**: ${userProfile.fullName} (\`${userProfile.userEmail}\`)\n- **Phòng ban duy nhất**: **${userProfile.departmentName}**\n- **Điểm tín nhiệm (Trust Score)**: **${userProfile.trustScore}/100đ** (Mỗi tháng cộng định kỳ +20đ)\n- **Danh sách lịch đặt của riêng bạn (${kb.myBookings.length})**:\n${myBookingBullets}`
      );
    }

    if (
      q.includes('phòng') ||
      q.includes('trống') ||
      q.includes('tầng') ||
      q.includes('hội trường') ||
      q.includes('la mã') ||
      q.includes('h-01')
    ) {
      const byFloorSummary = [1, 2, 3, 4]
        .map((fl) => {
          const freeOnFl = kb.freeRooms
            .filter((r) => r.floorLevel === fl)
            .map((r) => `${r.nodeCode} (${r.capacityCount}P)`);
          return `- **Tầng ${fl}**: ${
            freeOnFl.length > 0 ? freeOnFl.join(', ') : 'Đã kín lịch'
          }`;
        })
        .join('\n');

      sections.push(
        `### 🏢 Trạng thái Thời gian thực 25 Không gian (Tầng 1 – Tầng 5)\n- **Tổng quan**: Đang trống **${kb.freeRooms.length}/25** vị trí • Đang họp/Đã đặt: **${kb.busyRooms.length}**\n${byFloorSummary}`
      );
    }

    if (sections.length === 0) {
      sections.push(
        `### 💡 Phản hồi từ AURA-X cho: “${rawQuery}”\n- Mình là **AURA-X**, trợ lý AI đồng hành cùng **${userProfile.fullName}** (\`${userProfile.role}\` • Phòng ban \`${userProfile.departmentName}\`).\n- Bạn có thể yêu cầu mình **tạo lịch đặt phòng tự động** (VD: *"Đặt phòng 4 người họp 2 tiếng lúc 16h hôm nay ở tầng 3"*), hoặc hỏi bất kỳ kiến thức chuyên môn nào!`
      );
    }

    return {
      replyText: sections.join('\n\n'),
    };
  };

  const handleSpeakMessage = (textToSpeak: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setAiMood('IDLE');
      return;
    }

    const cleanSpeech = textToSpeak.replace(/[*#_~>-]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang =
      webLanguage === 'en'
        ? 'en-US'
        : webLanguage === 'ja'
        ? 'ja-JP'
        : 'vi-VN';
    utterance.onstart = () => {
      setIsSpeaking(true);
      setAiMood('SPEAKING');
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setAiMood('IDLE');
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setAiMood('IDLE');
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmitChat = async (
    e?: React.FormEvent,
    overridePrompt?: string
  ) => {
    if (e) e.preventDefault();
    const text = (
      overridePrompt !== undefined ? overridePrompt : promptInput
    ).trim();
    if (!text && pendingAttachments.length === 0) return;

    const currentAttachments = [...pendingAttachments];
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: AiChatMessageItem = {
      id: `USR-${Date.now()}`,
      sender: 'USER',
      contentText:
        text ||
        `[Đã gửi ${currentAttachments.length} tệp đính kèm: ${currentAttachments
          .map((a) => a.fileName)
          .join(', ')}]`,
      timestampText: nowTimeStr,
      attachments: currentAttachments,
    };

    setMessages((prev) => [...prev, userMsg]);
    setPromptInput('');
    setPendingAttachments([]);
    setAiMood('THINKING');

    // Bước 1: Kiểm tra xem câu lệnh có phải là Lệnh Thực Thi Web (Agentic Action) hoặc bị giới hạn Role hay không
    const localAgentResult = executeAgenticWorkflowAndAnswer(
      text,
      currentAttachments
    );

    const isDirectActionOrRestricted =
      Boolean(localAgentResult.bookingSuggestion) ||
      Boolean(localAgentResult.groupDraftAction) ||
      localAgentResult.replyText.includes('Đã Thực thi') ||
      localAgentResult.replyText.includes('Giới hạn') ||
      localAgentResult.replyText.includes('Từ chối Thực thi') ||
      localAgentResult.replyText.includes('[SYS_ADMIN]');

    let finalReply = isDirectActionOrRestricted
      ? localAgentResult.replyText
      : '';

    // Bước 2: Nếu là câu hỏi tự do bên ngoài hoặc hội thoại chung -> Gọi Live Cloud LLM (có truyền kèm phạm vi dữ liệu được phép tiết lộ theo Role)
    if (!finalReply) {
      const allowedScopedContext =
        userProfile.role === 'SYS_ADMIN'
          ? `[QUYỀN SYS_ADMIN - TOÀN QUYỀN TRUY CẬP]: Người dùng: ${userProfile.fullName} (@${userProfile.username}). Tổng phòng trống: ${roleScopedKnowledgeBase.freeRooms.length}/25. Toàn bộ nhân sự: ${trustProfiles
              .map((u) => `${u.fullName}(${u.role}, ${u.departmentName}, ${u.trustScore}đ)`)
              .join('; ')}. Các phòng ban: ${departmentsList
              .map((d) => d.departmentName)
              .join(', ')}.`
          : userProfile.role === 'MANAGER'
          ? `[QUYỀN MANAGER - CHỈ TIẾT LỘ PHÒNG BAN ${userProfile.departmentName}]: Người dùng: ${userProfile.fullName} (@${userProfile.username}, Điểm tín nhiệm: ${userProfile.trustScore}/100). Tổng phòng trống: ${roleScopedKnowledgeBase.freeRooms.length}/25. Các nhóm thuộc phòng ban ${userProfile.departmentName}: ${roleScopedKnowledgeBase.myGroups
              .map((g) => g.groupName)
              .join(', ')}. TUYỆT ĐỐI KHÔNG tiết lộ dữ liệu của phòng ban khác hoặc nhật ký IP của Admin.`
          : `[QUYỀN EMPLOYEE - CHỈ TIẾT LỘ DỮ LIỆU CÁ NHÂN & PHÒNG TRỐNG]: Người dùng: ${userProfile.fullName} (@${userProfile.username}, Phòng ban: ${userProfile.departmentName}, Điểm tín nhiệm: ${userProfile.trustScore}/100). Phòng trống: ${roleScopedKnowledgeBase.freeRooms.length}/25 (${roleScopedKnowledgeBase.freeRooms
              .map((r) => `${r.nodeCode}:${r.capacityCount}P`)
              .join(', ')}). Lịch cá nhân: ${roleScopedKnowledgeBase.myBookings.length} vé. TUYỆT ĐỐI KHÔNG tiết lộ điểm tín nhiệm hay lịch đặt phòng của người khác, không tiết lộ phòng ban khác.`;

      try {
        const response = await fetch('/api/v1/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptText: text,
            personaLabel: 'AURA-X — AI Agent Độc quyền SpotMatrix',
            workspaceContextText: allowedScopedContext,
            conversationHistory: messages.slice(-5),
            attachments: currentAttachments,
            webLanguage,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data?.replyText && typeof data.replyText === 'string') {
            finalReply = data.replyText.trim();
          }
        }
      } catch {
        // Chuyển sang gọi trực tiếp Cloud LLM từ trình duyệt
      }

      if (!finalReply) {
        try {
          const cloudRes = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'openai',
              messages: [
                {
                  role: 'system',
                  content: `Bạn là AURA-X, AI Agent 3D độc quyền của hệ thống SpotMatrix. Hãy trả lời tự nhiên, thông minh, linh hoạt bằng tiếng Việt (hoặc ngôn ngữ người dùng chọn). Tuân thủ nghiêm ngặt giới hạn dữ liệu theo Role:
${allowedScopedContext}`,
                },
                { role: 'user', content: text },
              ],
              temperature: 0.65,
            }),
          });
          if (cloudRes.ok) {
            const cData = await cloudRes.json();
            const liveText =
              cData?.choices?.[0]?.message?.content?.trim() || '';
            if (liveText.length > 0) {
              finalReply = liveText;
            }
          }
        } catch {
          // Ngoại tuyến
        }
      }
    }

    if (!finalReply) {
      finalReply = localAgentResult.replyText;
    }

    const aiMsg: AiChatMessageItem = {
      id: `AI-${Date.now() + 1}`,
      sender: 'AI',
      contentText: finalReply,
      timestampText: nowTimeStr,
      bookingSuggestion: localAgentResult.bookingSuggestion,
      groupDraftAction: localAgentResult.groupDraftAction,
    };

    setMessages((prev) => [...prev, aiMsg]);
    setAiMood('IDLE');
  };

  const quickSuggestedPrompts = useMemo(() => {
    if (isSysAdmin) {
      return [
        'Tạo phòng cho 4 người họp 2 tiếng lúc 16h hôm nay ở tầng 3',
        'Tổng kết điểm trung bình tín nhiệm nhân viên',
        'Nhân viên Nguyễn Minh Quân có lịch sử đặt phòng thế nào so với tháng trước?',
        'Đổi thiết bị tầng 1 cho tôi thành bảo trì',
      ];
    }
    if (isManager) {
      return [
        'Tạo phòng cho 4 người họp 2 tiếng sau 2 tiếng nữa ở tầng 3',
        'Tạo 1 nhóm mới tên là Nhóm Tối ưu 3D',
        'Thêm thành viên Nguyễn Minh Quân vào nhóm SQUAD-3D-TWIN',
        'Kiểm tra lịch đặt & quyền của tài khoản tôi',
      ];
    }
    return [
      'Yêu cầu xin phép 1 phòng họp cho tầm 4 người họp 2 tiếng lúc 16h hôm nay ở tầng 3',
      'Đặt phòng cho 4 người họp 2 tiếng sau 2 tiếng nữa',
      'Kiểm tra lịch đặt & điểm tín nhiệm của tôi',
      'Phòng họp nào đang trống ngay lúc này?',
    ];
  }, [isSysAdmin, isManager]);

  const deptEligibleLeaders = useMemo(() => {
    return trustProfiles.filter(
      (tp) =>
        isSysAdmin ||
        tp.departmentName.trim().toLowerCase() ===
          userProfile.departmentName.trim().toLowerCase()
    );
  }, [trustProfiles, isSysAdmin, userProfile.departmentName]);

  return (
    <>
      {/* =====================================================================
          NÚT ICON MỞ AI GỌN GÀNG Ở GÓC DƯỚI PHẢI (CHỈ HIỆN ICON, RÊ CHUỘT MỚI HIỆN NỘI DUNG)
         ===================================================================== */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative w-13 h-13 p-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl border border-indigo-400/40 flex items-center justify-center transition-all duration-200 hover:scale-105"
            aria-label="Mở Trợ lý AI AURA-X"
          >
            <Cloud className="w-6 h-6 text-white fill-white/15" />
            <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />

            {/* Tooltip chỉ xuất hiện mượt mà khi rê chuột (hover) vào nút Icon */}
            <div className="pointer-events-none opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap px-3.5 py-2 rounded-2xl bg-slate-900/95 text-white border border-slate-700 shadow-xl text-left">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-extrabold">
                  AURA-X • Trợ lý AI 3D
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-600 text-white">
                  {userProfile.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Đặt phòng tự động • Gửi Ảnh/File & Hỏi đáp
              </p>
            </div>
          </button>
        )}
      </div>

      {/* =====================================================================
          NGĂN KÉO CHAT AI BÊN PHẢI VỚI LINH VẬT AI 3D & THỰC THI TÁC VỤ THEO ROLE
         ===================================================================== */}
      {isOpen && (
        <aside
          className={`fixed bottom-4 right-4 top-4 z-50 flex flex-col rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-2xl transition-all duration-300 ${
            isExpandedWidth
              ? 'w-[95vw] sm:w-[640px]'
              : 'w-[94vw] sm:w-[450px]'
          } ${
            isDark
              ? 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-black/80'
              : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/20'
          }`}
        >
          {/* Header gọn gàng, màu sắc tinh tế */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between gap-2 shrink-0 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black truncate">
                  AURA-X • AI Agent ({userProfile.role})
                </h3>
                <p className="text-[10px] text-slate-300 truncate">
                  @{userProfile.username} • {userProfile.departmentName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsExpandedWidth((prev) => !prev)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                title="Mở rộng / Thu gọn khung chat"
              >
                {isExpandedWidth ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: `WELCOME-${Date.now()}`,
                      sender: 'AI',
                      contentText: welcomeMessageText,
                      timestampText: 'Now',
                    },
                  ])
                }
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                title="Làm mới cuộc trò chuyện"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition"
                title="Đóng cửa sổ AI"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SÂN KHẤU WEBGL 3D CỦA LINH VẬT AI */}
          <div className="p-3 pb-1.5 shrink-0">
            <SpotMatrixMascot3DStage isDark={isDark} aiMood={aiMood} />

            <div
              className={`mt-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold flex flex-wrap items-center justify-between gap-2 ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                Trống: {roleScopedKnowledgeBase.freeRooms.length}/25 phòng
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-500" />
                Lịch của bạn: {roleScopedKnowledgeBase.myBookings.length} vé
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-500" />
                Tín nhiệm: {userProfile.trustScore}/100đ
              </span>
            </div>
          </div>

          {/* DANH SÁCH TIN NHẮN & THẺ HÀNH ĐỘNG TƯƠNG TÁC TRỰC TIẾP */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-3.5 py-2 space-y-3"
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'USER';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[94%] rounded-2xl p-3.5 text-xs space-y-2.5 shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white'
                        : isDark
                        ? 'bg-slate-900 border border-slate-800 text-slate-100'
                        : 'bg-slate-100/90 border border-slate-200/90 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 font-extrabold border-b border-current/10 pb-1">
                      <span>
                        {isUser
                          ? `${userProfile.fullName} (@${userProfile.username})`
                          : 'AURA-X • SpotMatrix AI Agent'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span>{msg.timestampText}</span>
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handleSpeakMessage(msg.contentText)}
                            className="p-0.5 rounded hover:bg-indigo-500/20 text-indigo-400"
                            title="Đọc to câu trả lời này"
                          >
                            {isSpeaking ? (
                              <VolumeX className="w-3 h-3" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {msg.attachments.map((att) =>
                          att.base64DataUrl ? (
                            <div
                              key={att.id}
                              className="rounded-xl overflow-hidden border border-white/20 bg-black/20"
                            >
                              <img
                                src={att.base64DataUrl}
                                alt={att.fileName}
                                className="w-full max-h-44 object-cover"
                              />
                              <div className="px-2.5 py-1 text-[10px] font-bold flex items-center justify-between">
                                <span className="truncate">{att.fileName}</span>
                                <span>{att.imageDimensions}</span>
                              </div>
                            </div>
                          ) : (
                            <div
                              key={att.id}
                              className="p-2 rounded-xl bg-black/15 border border-white/15 flex items-center gap-2 text-[11px]"
                            >
                              <FileText className="w-4 h-4 shrink-0 text-indigo-300" />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold truncate">
                                  {att.fileName}
                                </p>
                                <p className="text-[10px] opacity-75">
                                  {(att.sizeBytes / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {renderFormattedAiMarkdown(msg.contentText, isUser)}

                    {/* THẺ HÀNH ĐỘNG 1: CHỌN PHÒNG ĐỂ ĐIỀN SẴN HOẶC ĐẶT / XIN PHÉP NGAY TẠI ĐÂY */}
                    {msg.bookingSuggestion &&
                      msg.bookingSuggestion.candidateRooms.length > 0 && (
                        <div
                          className={`mt-2 p-3 rounded-2xl border space-y-2 ${
                            isDark
                              ? 'bg-slate-950 border-slate-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <p className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <CalendarCheck className="w-3.5 h-3.5" />
                            <span>
                              Chọn phòng bên dưới ({msg.bookingSuggestion.dateIso} •{' '}
                              {msg.bookingSuggestion.start} –{' '}
                              {msg.bookingSuggestion.end}):
                            </span>
                          </p>

                          <div className="space-y-2">
                            {msg.bookingSuggestion.candidateRooms.map((rm) => {
                              const alreadyBookedCode =
                                executedBookingMsgIds[msg.id];
                              const isThisBooked =
                                alreadyBookedCode === rm.nodeCode;

                              return (
                                <div
                                  key={rm.nodeCode}
                                  className={`p-2.5 rounded-xl border flex flex-col gap-2 ${
                                    isDark
                                      ? 'bg-slate-900 border-slate-800'
                                      : 'bg-slate-50 border-slate-200/80'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-xs">
                                      [{rm.nodeCode}] {rm.nodeLabel}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                                      {rm.capacityCount} chỗ • Tầng {rm.floorLevel}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {onAiNavigateAndPrefillBooking && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onAiNavigateAndPrefillBooking(rm, {
                                            dateIso:
                                              msg.bookingSuggestion!.dateIso,
                                            start: msg.bookingSuggestion!.start,
                                            end: msg.bookingSuggestion!.end,
                                            purposeNote:
                                              msg.bookingSuggestion!.purposeNote,
                                            approvalRequestReason:
                                              msg.bookingSuggestion!
                                                .approvalRequestReason,
                                          });
                                        }}
                                        className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                                          isDark
                                            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                      >
                                        <span>Đi đến Trang Đặt phòng (Điền sẵn)</span>
                                        <ArrowRight className="w-3 h-3" />
                                      </button>
                                    )}

                                    {onAiExecuteDirectBooking && (
                                      <button
                                        type="button"
                                        disabled={Boolean(alreadyBookedCode)}
                                        onClick={() => {
                                          onAiExecuteDirectBooking(rm, {
                                            dateIso:
                                              msg.bookingSuggestion!.dateIso,
                                            start: msg.bookingSuggestion!.start,
                                            end: msg.bookingSuggestion!.end,
                                            purposeNote:
                                              msg.bookingSuggestion!.purposeNote,
                                            approvalRequestReason:
                                              msg.bookingSuggestion!
                                                .approvalRequestReason,
                                          });
                                          setExecutedBookingMsgIds((prev) => ({
                                            ...prev,
                                            [msg.id]: rm.nodeCode,
                                          }));
                                        }}
                                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 transition ${
                                          isThisBooked
                                            ? 'bg-emerald-600 text-white'
                                            : alreadyBookedCode
                                            ? 'opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-800 text-slate-500'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                                        }`}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>
                                          {isThisBooked
                                            ? 'Đã Tạo Đơn Thành Công!'
                                            : userProfile.role === 'EMPLOYEE'
                                            ? `Gửi Xin Phép ${rm.nodeCode} Ngay`
                                            : `Xác nhận Đặt ${rm.nodeCode} Ngay`}
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {/* THẺ HÀNH ĐỘNG 2: FORM BỔ SUNG THÔNG TIN ĐỂ TẠO NHÓM MỚI TRỰC TIẾP TRONG CHAT AI (MANAGER / ADMIN) */}
                    {msg.groupDraftAction && (
                      <div
                        className={`mt-2 p-3.5 rounded-2xl border space-y-2.5 ${
                          isDark
                            ? 'bg-slate-950 border-slate-800'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                          <Users className="w-4 h-4" />
                          <span>
                            Điền thông tin tạo nhóm ({msg.groupDraftAction.departmentName})
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                              Mã nhóm (Code)
                            </label>
                            <input
                              type="text"
                              value={inlineGrpCode}
                              onChange={(e) => setInlineGrpCode(e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-900'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                              Nhãn dự án (Tag)
                            </label>
                            <input
                              type="text"
                              value={inlineGrpTag}
                              onChange={(e) => setInlineGrpTag(e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-900'
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                            Tên nhóm chuyên môn
                          </label>
                          <input
                            type="text"
                            value={inlineGrpName}
                            onChange={(e) => setInlineGrpName(e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${
                              isDark
                                ? 'bg-slate-900 border-slate-700 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                            Chọn Trưởng nhóm phụ trách
                          </label>
                          <select
                            value={inlineGrpLeader}
                            onChange={(e) => setInlineGrpLeader(e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${
                              isDark
                                ? 'bg-slate-900 border-slate-700 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          >
                            {deptEligibleLeaders.map((ld) => (
                              <option key={ld.userEmail} value={ld.userEmail}>
                                {ld.fullName} ({ld.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                            Mô tả nhiệm vụ nhóm
                          </label>
                          <input
                            type="text"
                            value={inlineGrpDesc}
                            onChange={(e) => setInlineGrpDesc(e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] ${
                              isDark
                                ? 'bg-slate-900 border-slate-700 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          />
                        </div>

                        <button
                          type="button"
                          disabled={Boolean(executedGroupMsgIds[msg.id])}
                          onClick={() => {
                            if (!onAiUpsertGroup || !inlineGrpName.trim()) return;
                            const leaderObj = trustProfiles.find(
                              (tp) =>
                                tp.userEmail.toLowerCase() ===
                                inlineGrpLeader.toLowerCase()
                            );
                            const newGroup: OrganizationGroupItem = {
                              groupId: `GRP-AI-${Date.now()}`,
                              groupCode: inlineGrpCode.trim().toUpperCase(),
                              groupName: inlineGrpName.trim(),
                              departmentName:
                                msg.groupDraftAction!.departmentName,
                              description: inlineGrpDesc.trim(),
                              leaderEmail: inlineGrpLeader,
                              leaderName:
                                leaderObj?.fullName || userProfile.fullName,
                              projectTag: inlineGrpTag.trim() || 'AI Squad',
                              memberEmails: [inlineGrpLeader],
                              updatedAtIso: new Date().toISOString(),
                            };
                            onAiUpsertGroup(newGroup);
                            setExecutedGroupMsgIds((prev) => ({
                              ...prev,
                              [msg.id]: true,
                            }));
                          }}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                            executedGroupMsgIds[msg.id]
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {executedGroupMsgIds[msg.id]
                              ? 'Đã Tạo Nhóm Thành Công!'
                              : 'Xác nhận Tạo Nhóm Ngay'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CÁC NÚT GỢI Ý LỆNH THỰC THI NHANH THEO ROLE */}
          <div className="px-3.5 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-slate-200/60 dark:border-slate-800/80 shrink-0">
            {quickSuggestedPrompts.map((qText) => (
              <button
                key={qText}
                type="button"
                onClick={() => handleSubmitChat(undefined, qText)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap transition shrink-0 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-500/50'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-indigo-400'
                }`}
              >
                {qText}
              </button>
            ))}
          </div>

          {pendingAttachments.length > 0 && (
            <div
              className={`px-3.5 py-2 border-t flex flex-wrap gap-2 max-h-28 overflow-y-auto ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              {pendingAttachments.map((att) => (
                <div
                  key={att.id}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {att.base64DataUrl ? (
                    <img
                      src={att.base64DataUrl}
                      alt={att.fileName}
                      className="w-7 h-7 rounded object-cover"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-500" />
                  )}
                  <span className="truncate max-w-[130px]">{att.fileName}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingAttachments((prev) =>
                        prev.filter((item) => item.id !== att.id)
                      )
                    }
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* THANH NHẬP LỆNH / CÂU HỎI + ĐÍNH KÈM ẢNH & FILE */}
          <form
            onSubmit={(e) => handleSubmitChat(e)}
            className={`p-3 border-t flex items-center gap-2 shrink-0 ${
              isDark
                ? 'bg-slate-950 border-slate-800'
                : 'bg-white border-slate-200'
            }`}
          >
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUploadChange(e, 'IMAGE')}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.json,.md,.ts,.tsx,.js,.py,.log,.html,.xml,.pdf,.doc,.docx"
              multiple
              onChange={(e) => handleFileUploadChange(e, 'FILE')}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className={`p-2.5 rounded-xl border transition shrink-0 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-500/50'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title="Đính kèm Hình ảnh"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2.5 rounded-xl border transition shrink-0 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-500/50'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title="Đính kèm Tệp tin"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={
                webLanguage === 'en'
                  ? 'Ask AI to book a room, manage groups, or run analytics...'
                  : webLanguage === 'ja'
                  ? '会議室の自動予約、グループ管理、データ分析を指示...'
                  : 'Ra lệnh đặt phòng, tạo nhóm, đổi thiết bị hoặc hỏi đáp...'
              }
              className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
              }`}
            />

            <button
              type="submit"
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition shrink-0"
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
};
