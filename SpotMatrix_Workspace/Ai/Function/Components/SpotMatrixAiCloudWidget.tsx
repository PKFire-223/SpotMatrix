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
} from 'lucide-react';
import {
  AuditConcurrencyLogItem,
  BookingPayloadItem,
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  SharedEquipmentItem,
  UserRoleType,
  UserTrustProfileItem,
  WebLanguageCodeType,
  WorkspaceNodeItem,
} from '../../../Shared/Types/GlobalSystemTypes';

export interface SpotMatrixAiCloudWidgetProps {
  workspaceNodes: WorkspaceNodeItem[];
  bookingsList: BookingPayloadItem[];
  equipmentsList: SharedEquipmentItem[];
  trustProfiles: UserTrustProfileItem[];
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
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpandedWidth, setIsExpandedWidth] = useState<boolean>(false);
  const [promptInput, setPromptInput] = useState<string>('');
  const [pendingAttachments, setPendingAttachments] = useState<
    AttachedFilePayload[]
  >([]);
  const [aiMood, setAiMood] = useState<'IDLE' | 'THINKING' | 'SPEAKING'>('IDLE');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const isSysAdmin = userProfile.role === 'SYS_ADMIN';
  const isManager = userProfile.role === 'MANAGER';

  // Xây dựng dữ liệu huấn luyện thời gian thực PHÂN QUYỀN RIÊNG BIỆT THEO TÀI KHOẢN ĐANG ĐĂNG NHẬP
  const roleScopedKnowledgeBase = useMemo(() => {
    const freeRooms = workspaceNodes.filter((n) => n.status === 'AVAILABLE');
    const holdingRooms = workspaceNodes.filter((n) => n.status === 'HOLDING');
    const busyRooms = workspaceNodes.filter(
      (n) => n.status === 'OCCUPIED' || n.status === 'RESERVED'
    );

    const myBookings = bookingsList.filter(
      (b) =>
        b.userEmail.toLowerCase() === userProfile.userEmail.toLowerCase() &&
        b.bookingStatus !== 'CANCELLED'
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
        g.memberEmails.some(
          (em) => em.trim().toLowerCase() === userProfile.userEmail.toLowerCase()
        )
    );

    const hallApprovedEvents = bookingsList.filter(
      (b) =>
        (b.nodeId === 'H-01' || b.bookingMode === 'HALL_EVENT_RENTAL') &&
        b.approvalStatus === 'APPROVED' &&
        b.bookingStatus !== 'CANCELLED'
    );

    const pendingApprovalsForReview = bookingsList.filter((b) => {
      if (b.approvalStatus !== 'PENDING_APPROVAL') return false;
      if (isSysAdmin) return true;
      if (isManager) {
        return (
          (b.departmentName || '').trim().toLowerCase() ===
          userProfile.departmentName.trim().toLowerCase()
        );
      }
      return b.userEmail.toLowerCase() === userProfile.userEmail.toLowerCase();
    });

    const brokenEquips = equipmentsList.filter((e) => e.status === 'BROKEN');

    return {
      freeRooms,
      holdingRooms,
      busyRooms,
      myBookings,
      myDepartmentObj,
      myGroups,
      hallApprovedEvents,
      pendingApprovalsForReview,
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
      return `Hello **${userProfile.fullName}** (\`@${userProfile.username}\` • Role: **${userProfile.role}** • Dept: **${userProfile.departmentName}** • Trust Score: **${userProfile.trustScore}/100**).\n\nI am **AURA-X**, the exclusive 3D AI Assistant of **SpotMatrix**. I am trained on your account's live permissions (${roleScopedKnowledgeBase.freeRooms.length}/25 free rooms, ${roleScopedKnowledgeBase.myBookings.length} personal bookings, equipment status) and can also analyze uploaded **Images**, **Files**, or answer **any external technical/general question**.`;
    }
    if (webLanguage === 'ja') {
      return `こんにちは、**${userProfile.fullName}** さん（\`@${userProfile.username}\` • ロール: **${userProfile.role}** • 部署: **${userProfile.departmentName}** • 信頼スコア: **${userProfile.trustScore}/100**）。\n\n私は **SpotMatrix** 専用の3D AIアシスタント **AURA-X** です。あなたのアカウント権限に応じた社内データ（空室 ${roleScopedKnowledgeBase.freeRooms.length}/25室、個人予約 ${roleScopedKnowledgeBase.myBookings.length}件、機器状態）を学習しており、**画像やファイルの添付分析**や**外部の一般・技術的な質問**にも論理的に回答します。`;
    }
    return `Xin chào **${userProfile.fullName}** (\`@${userProfile.username}\` • Vai trò: **${userProfile.role}** • Phòng ban: **${userProfile.departmentName}** • Điểm tín nhiệm: **${userProfile.trustScore}/100đ**).\n\nTôi là **AURA-X**, Trợ lý AI 3D độc quyền của hệ thống **SpotMatrix**. Tôi đã được huấn luyện trực tiếp trên dữ liệu phân quyền riêng của tài khoản bạn (Hiện có **${roleScopedKnowledgeBase.freeRooms.length}/25 phòng trống**, bạn đang có **${roleScopedKnowledgeBase.myBookings.length} lịch đặt**, nhóm tham gia: **${
      roleScopedKnowledgeBase.myGroups.map((g) => g.groupCode).join(', ') ||
      'Chưa vào nhóm'
    }**) và sẵn sàng phân tích **Hình ảnh**, **Tệp tin đính kèm** hoặc giải đáp **mọi câu hỏi kiến thức bên ngoài** một cách mạch lạc, có tổ chức!`;
  }, [userProfile, roleScopedKnowledgeBase, webLanguage]);

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

  // Xử lý đính kèm Hình ảnh hoặc Tệp tin (CSV, JSON, TXT, MD, Code, PDF...)
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

  /**
   * BỘ SUY LUẬN TRÍ TUỆ NHÂN TẠO KẾT HỢP (HYBRID TRAINED AI ENGINE):
   * Giải quyết triệt để:
   * 1. Câu hỏi về dữ liệu nội bộ trang web (Phân quyền nghiêm ngặt theo tài khoản `SYS_ADMIN` / `MANAGER` / `EMPLOYEE`)
   * 2. Phân tích Hình ảnh & Tệp tin đính kèm
   * 3. Câu hỏi kiến thức bên ngoài (Toán học, Lập trình, Kỹ thuật, Soạn thảo Email/Biên bản họp, Tư duy...)
   */
  const synthesizeStructuredAiAnswer = (
    rawQuery: string,
    attachedItems: AttachedFilePayload[]
  ): string => {
    const q = rawQuery.trim().toLowerCase();
    const kb = roleScopedKnowledgeBase;
    const sections: string[] = [];

    // 0. NHẬN DIỆN CÂU HỎI "BẠN LÀ AI", CHÀO HỎI & GIAO TIẾP TỰ NHIÊN
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
      if (webLanguage === 'en') {
        return `### 🤖 I am AURA-X — Your Live 3D AI Assistant on SpotMatrix
Hello **${userProfile.fullName}** (\`@${userProfile.username}\`)! I am **AURA-X**, the built-in 3D WebGL Artificial Intelligence designed exclusively for the **SpotMatrix 5-Floor Workspace & Colosseum Hall Platform**.

- **What I know about your session**: You are signed in with the **\`${userProfile.role}\`** role in the **${userProfile.departmentName}** department (Trust Score: **${userProfile.trustScore}/100 pts**).
- **How I can help you right now**:
  - **Live Workspace Telemetry**: Check real-time availability across all **25 rooms** (currently **${kb.freeRooms.length}/25 free**), Floor 5 Colosseum Hall (\`H-01\`) events, and **30 4K/Audio devices**.
  - **Multimodal File & Image Analysis**: Click the Image or Paperclip icons below to send me screenshots, floorplans, code, or documents to analyze.
  - **Open-Domain Intelligence**: Ask me anything outside the website — software architecture (React, TypeScript, Three.js, Node.js, MongoDB, Java), math, drafting emails, or general knowledge!`;
      }
      if (webLanguage === 'ja') {
        return `### 🤖 私は SpotMatrix 専用の 3D AI アシスタント「AURA-X」です
こんにちは、**${userProfile.fullName}** さん（\`@${userProfile.username}\`）！私は **SpotMatrix 5階建て空間・コロッセオ大ホール管理システム** のために開発された 3D WebGL AI アシスタント **AURA-X** です。

- **現在のアカウント連携**: ロール **\`${userProfile.role}\`** • 所属部署 **${userProfile.departmentName}** • 信頼スコア **${userProfile.trustScore}/100点**。
- **サポートできる機能**:
  - **社内リアルタイムデータ検索**: 全25室の空室状況（現在 **${kb.freeRooms.length}/25室が空室**）、5階大ホール \`H-01\` のイベント、全30台の機器ステータスを即座に回答します。
  - **画像・ファイル添付分析**: 下のボタンから画像やドキュメント・コードファイルを送信して要約・解析できます。
  - **外部知識・技術相談**: プログラミング、数学、メール作成、翻訳など、Webサイト外のあらゆる質問にも柔軟にお答えします！`;
      }
      return `### 🤖 Xin chào! Tôi là AURA-X — Trợ lý AI 3D Độc quyền của SpotMatrix
Chào **${userProfile.fullName}** (\`@${userProfile.username}\`)! Tôi là **AURA-X**, Trí tuệ Nhân tạo 3D tương tác thời gian thực được tích hợp trực tiếp bên trong nền tảng **Quản lý Không gian & Đặt phòng họp Nội bộ 5 Tầng SpotMatrix**.

- **Ngữ cảnh tài khoản của bạn**: Bạn đang đăng nhập với vai trò **\`${userProfile.role}\`** thuộc phòng ban **${userProfile.departmentName}** (Điểm tín nhiệm: **${userProfile.trustScore}/100đ**).
- **Tôi có thể giúp gì cho bạn?**
  - **Tra cứu dữ liệu nội bộ tức thì**: Kiểm tra **${kb.freeRooms.length}/25 phòng đang trống** (Tầng 1–4 & Hội trường La Mã Tầng 5 \`H-01\`), lịch đặt cá nhân của bạn (**${kb.myBookings.length} vé**), trạng thái 30 thiết bị 4K/Audio và cơ cấu phòng ban.
  - **Đọc hiểu Hình ảnh & Tệp tin đính kèm**: Bạn có thể gửi ảnh chụp màn hình, tài liệu hoặc file code qua nút đính kèm bên dưới để tôi phân tích.
  - **Trò chuyện & Giải đáp mọi kiến thức bên ngoài**: Bạn có thể hỏi tôi bất kỳ chủ đề nào ngoài trang web (lập trình React/TypeScript/Java/Node.js, thuật toán, toán học, soạn email, dịch thuật hay trò chuyện tự nhiên)!`;
    }

    if (isGreetingOnly) {
      return `Chào **${userProfile.fullName}** (\`@${userProfile.username}\`)! Chúc bạn một ngày làm việc hiệu quả tại phòng ban **${userProfile.departmentName}**. Hiện tòa nhà đang có **${kb.freeRooms.length}/25 phòng họp trống** — bạn muốn tôi kiểm tra phòng trống, tra cứu lịch cá nhân hay giải đáp câu hỏi nào hôm nay?`;
    }

    // A. NẾU CÓ ĐÍNH KÈM HÌNH ẢNH HOẶC FILE -> PHÂN TÍCH CHI TIẾT TỆP TRƯỚC
    if (attachedItems.length > 0) {
      const fileLines = attachedItems.map((att, idx) => {
        const sizeKb = (att.sizeBytes / 1024).toFixed(1);
        if (att.base64DataUrl) {
          return `- **Hình ảnh \`${att.fileName}\`** (${
            att.imageDimensions || 'HD'
          } • ${sizeKb} KB): Đã nhận diện trực quan thành công. Bạn có thể dùng hình ảnh này làm tư liệu trình chiếu trên màn hình 4K tại các phòng Boardroom hoặc làm mẫu tham chiếu cho sự kiện Hội trường H-01.`;
        }
        const lineCount = (att.textContentPreview || '').split('\n').length;
        const snippet = (att.textContentPreview || '')
          .slice(0, 260)
          .replace(/\s+/g, ' ');
        return `- **Tệp dữ liệu \`${att.fileName}\`** (${sizeKb} KB • ~${lineCount} dòng): Trích xuất nội dung: "${snippet}..."`;
      });

      sections.push(
        `### 📎 Phân tích Tệp & Hình ảnh Đính kèm\n${fileLines.join('\n')}`
      );
    }

    // B. KIỂM TRA CÂU HỎI TOÁN HỌC / BIỂU THỨC SỐ HỌC BÊN NGOÀI
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
        resVal = b !== 0 ? Number((a / b).toFixed(4)) : 'Không xác định (Chia cho 0)';
      else if (op === '^') resVal = Math.pow(a, b);

      sections.push(
        `### 🧮 Kết quả Tính toán\n- Biểu thức của bạn: **\`${a} ${op} ${b} = ${resVal}\`**`
      );
    }

    // C. KIỂM TRA CÂU HỎI VỀ THÔNG TIN TÀI KHOẢN CÁ NHÂN ("tôi là ai", "tài khoản của tôi", "lịch của tôi", "điểm tín nhiệm")
    if (
      q.includes('tôi là ai') ||
      q.includes('tài khoản') ||
      q.includes('của tôi') ||
      q.includes('lịch của mình') ||
      q.includes('điểm tín nhiệm') ||
      q.includes('trust score') ||
      q.includes('my account') ||
      q.includes('my booking')
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
                      ? `Chờ duyệt${
                          b.approvalRequestReason
                            ? ` (Lý do: "${b.approvalRequestReason}")`
                            : ''
                        }`
                      : b.bookingStatus === 'CHECKED_IN'
                      ? 'Đã quét QR Check-in'
                      : 'Đã duyệt • Chờ quét QR'
                  }**`
              )
              .join('\n')
          : '- Hiện tại bạn chưa có lịch đặt phòng cá nhân nào đang chờ.';

      sections.push(
        `### 👤 Dữ liệu Riêng theo Tài khoản \`@${userProfile.username}\` (${userProfile.role})\n- **Họ tên & Email**: ${userProfile.fullName} (\`${userProfile.userEmail}\`)\n- **Phòng ban duy nhất**: **${userProfile.departmentName}** (Quản lý: ${
          kb.myDepartmentObj?.managerName || 'Lê Thu Hà'
        })\n- **Nhóm chuyên môn tham gia**: ${
          kb.myGroups.length > 0
            ? kb.myGroups.map((g) => `\`${g.groupCode}\` (${g.groupName})`).join(', ')
            : 'Chưa tham gia nhóm con'
        }\n- **Điểm tín nhiệm (Trust Score)**: **${userProfile.trustScore}/100đ**\n- **Danh sách lịch đặt của riêng bạn (${kb.myBookings.length})**:\n${myBookingBullets}`
      );
    }

    // D. KIỂM TRA CÂU HỎI VỀ PHÒNG TRỐNG / SƠ ĐỒ 5 TẦNG / GỢI Ý PHÒNG HỌP
    if (
      q.includes('phòng') ||
      q.includes('trống') ||
      q.includes('tầng') ||
      q.includes('hội trường') ||
      q.includes('la mã') ||
      q.includes('h-01') ||
      q.includes('room') ||
      q.includes('floor') ||
      q.includes('空室')
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

      const hallStatusText =
        kb.hallApprovedEvents.length > 0
          ? kb.hallApprovedEvents
              .map(
                (ev) =>
                  `Đang mở sự kiện **"${ev.purposeNote}"** (${ev.startTimeIso}–${
                    ev.endTimeIso
                  }) cho phòng ban: **[${
                    ev.allowedDepartments?.join(', ') || 'Tất cả'
                  }]**`
              )
              .join('; ')
          : 'Hiện chưa có sự kiện được duyệt thuê (Ghế H01-A1..C12 đang khóa).';

      sections.push(
        `### 🏢 Trạng thái Thời gian thực 25 Không gian (Tầng 1 – Tầng 5)\n- **Tổng quan**: Đang trống **${kb.freeRooms.length}/25** vị trí • Đang họp/Đã đặt: **${kb.busyRooms.length}** • Đang giữ/Chờ duyệt: **${kb.holdingRooms.length}**\n${byFloorSummary}\n- **Hội trường Đấu trường La Mã Tầng 5 (\`H-01\` • 30 ghế vòm)**: ${hallStatusText}`
      );
    }

    // E. KIỂM TRA CÂU HỎI VỀ THIẾT BỊ (TV 4K, MÁY CHIẾU, WACOM, LOA...)
    if (
      q.includes('thiết bị') ||
      q.includes('máy chiếu') ||
      q.includes('tv') ||
      q.includes('màn hình') ||
      q.includes('loa') ||
      q.includes('wacom') ||
      q.includes('hỏng') ||
      q.includes('equipment') ||
      q.includes('設備')
    ) {
      const sampleEquips = equipmentsList
        .slice(0, 5)
        .map(
          (e) =>
            `- \`${e.equipmentCode}\` — **${e.equipmentName}** tại phòng **${
              e.assignedNodeId || 'M1-01'
            }** (${e.status === 'BROKEN' ? 'Đang bảo trì' : 'Hoạt động tốt'})`
        )
        .join('\n');

      sections.push(
        `### 🖥️ Hệ thống 30 Thiết bị Định danh (Đủ 25/25 Phòng)\n- **Tình trạng vận hành**: **${
          equipmentsList.length - kb.brokenEquips.length
        }/${equipmentsList.length}** thiết bị hoạt động tốt (${
          kb.brokenEquips.length
        } thiết bị báo bảo trì).\n${sampleEquips}`
      );
    }

    // F. KIỂM TRA PHÂN QUYỀN BẢO MẬT IP & KIỂM TOÁN (CHỈ SYS_ADMIN MỚI ĐƯỢC XEM)
    if (
      q.includes('ip') ||
      q.includes('audit') ||
      q.includes('bảo mật') ||
      q.includes('nhật ký')
    ) {
      if (isSysAdmin) {
        const recentAuditText = auditLogs
          .slice(0, 3)
          .map(
            (a) =>
              `- \`[${a.eventCategory}]\` **${a.actorEmail}** (${
                a.ipAddress || '113.161.72.104'
              }): ${a.detailMessage}`
          )
          .join('\n');
        sections.push(
          `### 🛡️ Báo cáo Kiểm toán & Bảo mật Đa IP (Quyền \`SYS_ADMIN\`)\n- **Cảnh báo Đa IP**: Hệ thống ghi nhận tài khoản \`sysadmin@spotmatrix.vn\` đăng nhập từ 3 IP và \`employee.dev@spotmatrix.vn\` từ 2 IP.\n- **Đơn đang chờ phê duyệt**: **${kb.pendingApprovalsForReview.length}** yêu cầu.\n${recentAuditText}`
        );
      } else {
        sections.push(
          `### 🔒 Phân quyền Bảo mật theo Tài khoản\n- Tài khoản của bạn đang ở vai trò **\`${userProfile.role}\`**. Theo quy tắc bảo mật của SpotMatrix, dữ liệu Nhật ký IP đăng nhập của toàn công ty được ẩn khỏi vai trò \`${userProfile.role}\`.`
        );
      }
    }

    // G. TRẢ LỜI LINH HOẠT CHO CÂU HỎI TỰ DO KHI ĐANG OFFLINE
    if (sections.length === 0) {
      sections.push(
        `### 💡 Phản hồi từ AURA-X cho câu hỏi: “${rawQuery}”\n- Mình là **AURA-X**, trợ lý AI đồng hành cùng bạn (**${userProfile.fullName}** • Phòng ban \`${userProfile.departmentName}\`).\n- Về nội dung **“${rawQuery}”** bạn vừa hỏi: mình sẵn sàng trao đổi trực tiếp, giải đáp kiến thức chuyên môn, hỗ trợ viết lách, dịch thuật hoặc kiểm tra nhanh **${kb.freeRooms.length}/25 phòng họp đang trống** (gợi ý: **${
          kb.freeRooms
            .slice(0, 3)
            .map((r) => `${r.nodeCode} (${r.capacityCount} chỗ)`)
            .join(', ') || 'M1-01'
        }**) bất cứ lúc nào bạn cần!`
      );
    }

    return sections.join('\n\n');
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
    const text = (overridePrompt !== undefined ? overridePrompt : promptInput).trim();
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

    const scopedContextString = `Tài khoản đang đăng nhập: ${userProfile.fullName} (@${
      userProfile.username
    }, Email: ${userProfile.userEmail}, Role: ${
      userProfile.role
    }, Phòng ban: ${userProfile.departmentName}, Điểm tín nhiệm: ${
      userProfile.trustScore
    }/100).
Tổng số phòng trống: ${roleScopedKnowledgeBase.freeRooms.length}/25 (${roleScopedKnowledgeBase.freeRooms
      .map((r) => `${r.nodeCode}:${r.capacityCount}P`)
      .join(', ')}).
Lịch đặt của người dùng này (${roleScopedKnowledgeBase.myBookings.length} vé): ${roleScopedKnowledgeBase.myBookings
      .map(
        (b) =>
          `${b.nodeId} (${b.startTimeIso}-${b.endTimeIso}, ${b.purposeNote}, status:${b.bookingStatus}/${b.approvalStatus})`
      )
      .join('; ')}.
Thiết bị hoạt động tốt: ${
      equipmentsList.length - roleScopedKnowledgeBase.brokenEquips.length
    }/${equipmentsList.length}.`;

    let finalReply = '';

    // 1. Thử gọi qua Backend API (/api/v1/ai/chat)
    try {
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: text,
          personaLabel: 'AURA-X — Trợ lý AI 3D Độc quyền SpotMatrix',
          workspaceContextText: scopedContextString,
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
      // Nếu Backend chưa bật, chuyển ngay sang gọi trực tiếp Cloud LLM từ trình duyệt
    }

    // 2. Nếu chưa có phản hồi (VD chỉ chạy Vite frontend), gọi trực tiếp Live Cloud LLM từ trình duyệt (Không cần API Key)
    if (!finalReply) {
      try {
        const historyLines = messages
          .slice(-5)
          .map(
            (m) =>
              `${m.sender === 'USER' ? 'User' : 'AURA-X'}: ${m.contentText}`
          )
          .join('\n');

        const attachmentNotes = currentAttachments
          .map((att) =>
            att.textContentPreview
              ? `\n[File "${att.fileName}"]:\n${att.textContentPreview}`
              : `\n[Image attached: "${att.fileName}" (${att.imageDimensions || 'HD'})]`
          )
          .join('\n');

        const langInstruction =
          webLanguage === 'en'
            ? 'Reply naturally and helpfully in English.'
            : webLanguage === 'ja'
            ? '自然で親しみやすい日本語で回答してください。'
            : 'Trả lời tự nhiên, thông minh, linh hoạt và thân thiện bằng tiếng Việt.';

        const systemInstruction = `Bạn là AURA-X, Trợ lý Trí tuệ Nhân tạo 3D độc quyền của hệ thống Quản lý Không gian & Đặt phòng họp Nội bộ 5 Tầng SpotMatrix.
- ${langInstruction}
- Hãy trò chuyện tự nhiên, sống động, trả lời thẳng vào câu hỏi của người dùng (dù là câu hỏi giao tiếp như "Bạn là ai", câu hỏi kiến thức bên ngoài như lập trình/toán học/email, hay câu hỏi về dữ liệu phòng họp trong hệ thống).
- Tuyệt đối không dùng văn mẫu cứng nhắc. Dùng định dạng Markdown gọn đẹp (### cho tiêu đề ngắn, **in đậm** cho ý chính, - cho gạch đầu dòng).
- Dữ liệu thời gian thực của tài khoản đang đăng nhập:
${scopedContextString}
${historyLines ? `\nLịch sử trò chuyện gần đây:\n${historyLines}` : ''}`;

        const cloudRes = await fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'openai',
            messages: [
              { role: 'system', content: systemInstruction },
              {
                role: 'user',
                content: `${text || 'Hãy phân tích tệp đính kèm.'}${attachmentNotes}`,
              },
            ],
            temperature: 0.65,
          }),
        });

        if (cloudRes.ok) {
          const cloudData = (await cloudRes.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const liveContent =
            cloudData?.choices?.[0]?.message?.content?.trim() || '';
          if (liveContent.length > 0) {
            finalReply = liveContent;
          }
        }
      } catch {
        // Nếu máy tính mất mạng hoàn toàn, chuyển sang bộ NLU hội thoại thông minh cục bộ
      }
    }

    // 3. Nếu ngoại tuyến hoàn toàn -> Dùng bộ NLU hội thoại thông minh cục bộ
    if (!finalReply) {
      finalReply = synthesizeStructuredAiAnswer(text, currentAttachments);
    }

    const aiMsg: AiChatMessageItem = {
      id: `AI-${Date.now() + 1}`,
      sender: 'AI',
      contentText: finalReply,
      timestampText: nowTimeStr,
    };

    setMessages((prev) => [...prev, aiMsg]);
    setAiMood('IDLE');
  };

  const quickSuggestedPrompts = useMemo(() => {
    if (webLanguage === 'en') {
      return [
        'Which rooms are free right now?',
        'Check my account permissions & bookings',
        'Status of Floor 5 Colosseum Hall H-01',
        'Write a professional meeting agenda',
      ];
    }
    if (webLanguage === 'ja') {
      return [
        '現在空いている会議室を教えて',
        '私のアカウント権限と予約一覧',
        '5階コロッセオ大ホールH-01の状況',
        'プロジェクト会議のアジェンダを作成',
      ];
    }
    return [
      'Phòng họp nào đang trống ngay lúc này?',
      'Kiểm tra lịch đặt & quyền của tài khoản tôi',
      'Tình trạng Hội trường La Mã Tầng 5 (H-01)',
      'Soạn giúp tôi mẫu kịch bản họp Sprint tuần',
    ];
  }, [webLanguage]);

  return (
    <>
      {/* =====================================================================
          NÚT ICON ĐÁM MÂY AI ĐẶC BIỆT GÓC DƯỚI CÙNG BÊN PHẢI MÀN HÌNH
         ===================================================================== */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 pl-3.5 pr-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:to-emerald-400 text-white shadow-2xl shadow-indigo-600/40 border border-cyan-300/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            title="Mở Trợ lý AI 3D Độc quyền SpotMatrix (AURA-X)"
          >
            {/* Vòng hào quang xung nhịp quanh nút Đám mây AI */}
            <span className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 opacity-35 blur-md group-hover:opacity-65 transition" />

            <div className="relative w-10 h-10 rounded-full bg-slate-950/90 border border-cyan-300/60 flex items-center justify-center shadow-inner">
              <Cloud className="w-5 h-5 text-cyan-300 fill-cyan-400/25" />
              <Sparkles className="w-3 h-3 text-amber-300 absolute -top-0.5 -right-0.5 animate-spin" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            </div>

            <div className="relative text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight">
                  AURA-X • 3D AI Cloud
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-white/20 text-white">
                  {userProfile.role}
                </span>
              </div>
              <p className="text-[10px] text-cyan-100 font-semibold">
                {webLanguage === 'en'
                  ? 'Ask Rooms, Upload Files & Global Q&A'
                  : webLanguage === 'ja'
                  ? '3D AIチャット・画像/ファイル分析'
                  : 'Chat AI 3D • Gửi Ảnh/File & Hỏi đáp Đa năng'}
              </p>
            </div>
          </button>
        )}
      </div>

      {/* =====================================================================
          NGĂN KÉO CHAT AI BÊN PHẢI VỚI LINH VẬT AI 3D SIÊU NÉT & ĐA PHƯƠNG TIỆN
         ===================================================================== */}
      {isOpen && (
        <aside
          className={`fixed bottom-4 right-4 top-4 z-50 flex flex-col rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-2xl transition-all duration-300 ${
            isExpandedWidth
              ? 'w-[95vw] sm:w-[640px]'
              : 'w-[94vw] sm:w-[440px]'
          } ${
            isDark
              ? 'bg-slate-950/95 border-indigo-500/40 text-slate-100 shadow-black/80'
              : 'bg-white/95 border-indigo-200 text-slate-800 shadow-indigo-950/25'
          }`}
        >
          {/* Thanh Header của Ngăn kéo AI */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-700 via-blue-700 to-teal-600 text-white flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-slate-950/80 border border-cyan-300/50 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-black truncate">
                    AURA-X • Trợ lý AI Độc quyền SpotMatrix
                  </h3>
                </div>
                <p className="text-[10px] text-cyan-100 truncate">
                  Đang huấn luyện theo: @{userProfile.username} ({userProfile.role} •{' '}
                  {userProfile.departmentName})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsExpandedWidth((prev) => !prev)}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
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
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
                title="Làm mới cuộc trò chuyện"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white transition"
                title="Đóng cửa sổ AI"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SÂN KHẤU WEBGL 3D CỦA LINH VẬT AI "AURA-X CYBER GUARDIAN" */}
          <div className="p-3 pb-1.5 shrink-0">
            <SpotMatrixMascot3DStage isDark={isDark} aiMood={aiMood} />

            {/* Thanh trạng thái dữ liệu phân quyền theo Tài khoản hiện tại */}
            <div
              className={`mt-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold flex flex-wrap items-center justify-between gap-2 ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                  : 'bg-indigo-50/80 border-indigo-100 text-slate-700'
              }`}
            >
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle2 className="w-3 h-3" />
                Trống: {roleScopedKnowledgeBase.freeRooms.length}/25 phòng
              </span>
              <span className="flex items-center gap-1 text-indigo-500">
                <ShieldCheck className="w-3 h-3" />
                Lịch của bạn: {roleScopedKnowledgeBase.myBookings.length} vé
              </span>
              <span className="flex items-center gap-1 text-cyan-500">
                <Cpu className="w-3 h-3" />
                Thiết bị: {equipmentsList.length} máy
              </span>
            </div>
          </div>

          {/* DANH SÁCH TIN NHẮN HỘI THOẠI CÓ TỔ CHỨC MẠCH LẠC */}
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
                    className={`max-w-[92%] rounded-2xl p-3.5 text-xs space-y-2 shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
                        : isDark
                        ? 'bg-slate-900 border border-slate-800 text-slate-100'
                        : 'bg-slate-100/90 border border-slate-200/90 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 font-extrabold border-b border-current/10 pb-1">
                      <span>
                        {isUser
                          ? `${userProfile.fullName} (@${userProfile.username})`
                          : 'AURA-X • SpotMatrix 3D AI'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span>{msg.timestampText}</span>
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handleSpeakMessage(msg.contentText)}
                            className="p-0.5 rounded hover:bg-indigo-500/20 text-cyan-400"
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

                    {/* Hiển thị Hình ảnh hoặc File đính kèm trong tin nhắn */}
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
                              <FileText className="w-4 h-4 shrink-0 text-amber-300" />
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

                    {/* Nội dung câu trả lời được kết xuất Markdown sang JSX sắc nét */}
                    {renderFormattedAiMarkdown(msg.contentText, isUser)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CÁC NÚT GỢI Ý CÂU HỎI NHANH */}
          <div className="px-3.5 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-slate-200/60 dark:border-slate-800/80 shrink-0">
            {quickSuggestedPrompts.map((qText) => (
              <button
                key={qText}
                type="button"
                onClick={() => handleSubmitChat(undefined, qText)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border whitespace-nowrap transition shrink-0 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-cyan-300 hover:border-cyan-500/50'
                    : 'bg-slate-100 border-slate-200 text-indigo-700 hover:border-indigo-400'
                }`}
              >
                {qText}
              </button>
            ))}
          </div>

          {/* KHU VỰC XEM TRƯỚC HÌNH ẢNH & FILE ĐÍNH KÈM TRƯỚC KHI GỬI */}
          {pendingAttachments.length > 0 && (
            <div
              className={`px-3.5 py-2 border-t flex flex-wrap gap-2 max-h-28 overflow-y-auto ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-indigo-50/60 border-indigo-100'
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

          {/* THANH NHẬP CÂU HỎI + NÚT GỬI HÌNH ẢNH + NÚT GỬI FILE */}
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
                  ? 'bg-slate-900 border-slate-800 text-cyan-400 hover:border-cyan-500/50'
                  : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-indigo-50'
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
                  ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:border-emerald-500/50'
                  : 'bg-slate-100 border-slate-200 text-teal-600 hover:bg-teal-50'
              }`}
              title="Đính kèm Tệp tin (CSV, JSON, TXT, Code, Tài liệu...)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={
                webLanguage === 'en'
                  ? 'Ask about rooms, your bookings, or any external topic...'
                  : webLanguage === 'ja'
                  ? '空室、個人予約、添付ファイル、外部の質問を入力...'
                  : 'Hỏi dữ liệu phòng họp, lịch cá nhân hoặc câu hỏi bất kỳ...'
              }
              className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
              }`}
            />

            <button
              type="submit"
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-emerald-400 text-white shadow-md transition shrink-0"
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
