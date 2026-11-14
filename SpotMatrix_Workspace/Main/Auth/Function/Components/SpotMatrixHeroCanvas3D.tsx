import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface SpotMatrixHeroCanvas3DProps {
  scrollProgress: number;
  activeChapter: 1 | 2 | 3 | 4;
  selectedFloorPreview: number | null;
  isDark: boolean;
}

interface RoomBeaconEntry {
  coreMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
  pulseRingMesh: THREE.Mesh;
  tvGlowMesh: THREE.Mesh;
  floorIndex: number;
  roomIndex: number;
  baseStatusColor: number;
}

interface ColosseumSeatEntry {
  cushionMesh: THREE.Mesh;
  backrestMesh: THREE.Mesh;
  rowIdx: number;
  seatIdx: number;
  baseColor: number;
}

interface FloatingCrystalEntry {
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  orbitRadius: number;
  orbitSpeed: number;
  baseY: number;
  phaseOffset: number;
}

interface DataPulsePacketEntry {
  mesh: THREE.Mesh;
  cornerIndex: number;
  speed: number;
  offset: number;
}

/**
 * Tạo hình hộp chữ nhật bo góc và vát cạnh sắc nét (Beveled Architectural Box)
 * giúp bắt tia sáng phản xạ Specular Highlight dọc theo mọi gờ cạnh kim loại/kính.
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
 * Khởi tạo môi trường ánh sáng Studio HDRI giả lập (Procedural Lightbox Environment)
 * dùng PMREMGenerator để toàn bộ kính, kim loại, mặt bàn có phản chiếu sắc nét như Ray-Tracing.
 */
function buildStudioEnvironmentTexture(
  renderer: THREE.WebGLRenderer,
  isDarkTheme: boolean
): THREE.Texture {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(isDarkTheme ? 0x050816 : 0xeef4ff);

  // Tấm sáng trần chính (Top Softbox Studio Light)
  const topPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 28),
    new THREE.MeshBasicMaterial({
      color: isDarkTheme ? 0xe0f2fe : 0xffffff,
      side: THREE.DoubleSide,
    })
  );
  topPanel.position.set(0, 18, 0);
  topPanel.rotation.x = Math.PI / 2;
  envScene.add(topPanel);

  // Dải sáng Neon Cyan bên phải (Key Specular Strip)
  const cyanStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 7),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
    })
  );
  cyanStrip.position.set(18, 6, 10);
  cyanStrip.lookAt(0, 0, 0);
  envScene.add(cyanStrip);

  // Dải sáng Indigo/Violet bên trái (Rim Specular Strip)
  const indigoStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 7),
    new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      side: THREE.DoubleSide,
    })
  );
  indigoStrip.position.set(-18, 7, -10);
  indigoStrip.lookAt(0, 0, 0);
  envScene.add(indigoStrip);

  // Dải sáng Emerald ấm phía trước
  const emeraldStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 5),
    new THREE.MeshBasicMaterial({
      color: 0x34d399,
      side: THREE.DoubleSide,
    })
  );
  emeraldStrip.position.set(0, 10, 18);
  emeraldStrip.lookAt(0, 0, 0);
  envScene.add(emeraldStrip);

  const envRenderTarget = pmremGenerator.fromScene(envScene, 0.03);
  pmremGenerator.dispose();
  return envRenderTarget.texture;
}

/**
 * Tạo Texture màn hình Panorama 360° độ phân giải cao cho Hội trường La Mã H-01
 */
function createPanoramaScreenTexture(): THREE.CanvasTexture {
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

    // Lưới sóng âm thanh & biểu đồ Hologram trên màn hình LED
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
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
      const y = 135 + Math.sin(x * 0.025) * 42 * Math.cos(x * 0.008);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTMATRIX COLOSSEUM H-01 • 360° ULTRA-LED ARENA', 512, 82);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px Inter, Arial, sans-serif';
    ctx.fillText('HALL_EVENT_RENTAL & 30-SEAT TIERED AMPHITHEATER', 512, 208);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const SpotMatrixHeroCanvas3D: React.FC<SpotMatrixHeroCanvas3DProps> = ({
  scrollProgress,
  activeChapter,
  selectedFloorPreview,
  isDark,
}) => {
  const mountContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollTargetRef = useRef<number>(scrollProgress);
  const activeChapterRef = useRef<1 | 2 | 3 | 4>(activeChapter);
  const selectedFloorRef = useRef<number | null>(selectedFloorPreview);
  const isDarkRef = useRef<boolean>(isDark);

  useEffect(() => {
    scrollTargetRef.current = Math.max(0, Math.min(1, scrollProgress));
  }, [scrollProgress]);

  useEffect(() => {
    activeChapterRef.current = activeChapter;
  }, [activeChapter]);

  useEffect(() => {
    selectedFloorRef.current = selectedFloorPreview;
  }, [selectedFloorPreview]);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const containerEl = mountContainerRef.current;
    if (!containerEl) {
      return;
    }

    const initialWidth = Math.max(containerEl.clientWidth, window.innerWidth, 320);
    const initialHeight = Math.max(containerEl.clientHeight, window.innerHeight, 480);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isDarkRef.current ? 0x040711 : 0xeef4ff, 0.018);

    const camera = new THREE.PerspectiveCamera(40, initialWidth / initialHeight, 0.1, 180);
    camera.position.set(11.8, 8.4, 13.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.32;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerEl.innerHTML = '';
    containerEl.appendChild(renderer.domElement);

    // Khởi tạo PBR Studio Environment Map cho độ bóng kính & kim loại sắc nét
    const studioEnvTexture = buildStudioEnvironmentTexture(renderer, isDarkRef.current);
    scene.environment = studioEnvTexture;

    // 1. Hệ thống ánh sáng Đa tầng (Studio Key + Rim + Specular Accent)
    const ambientLight = new THREE.AmbientLight(
      isDarkRef.current ? 0x94a3b8 : 0xffffff,
      isDarkRef.current ? 0.95 : 1.4
    );
    scene.add(ambientLight);

    const mainDirLight = new THREE.DirectionalLight(0xffffff, isDarkRef.current ? 2.4 : 2.8);
    mainDirLight.position.set(15, 28, 20);
    mainDirLight.castShadow = true;
    mainDirLight.shadow.mapSize.width = 2048;
    mainDirLight.shadow.mapSize.height = 2048;
    mainDirLight.shadow.camera.near = 2;
    mainDirLight.shadow.camera.far = 65;
    const d = 14;
    mainDirLight.shadow.camera.left = -d;
    mainDirLight.shadow.camera.right = d;
    mainDirLight.shadow.camera.top = d;
    mainDirLight.shadow.camera.bottom = -d;
    mainDirLight.shadow.bias = -0.0005;
    scene.add(mainDirLight);

    const indigoRimLight = new THREE.PointLight(0x6366f1, 6.5, 38);
    indigoRimLight.position.set(-11, 8, -9);
    scene.add(indigoRimLight);

    const cyanAccentLight = new THREE.PointLight(0x38bdf8, 6.0, 36);
    cyanAccentLight.position.set(11, 6, 10);
    scene.add(cyanAccentLight);

    const colosseumCrownLight = new THREE.PointLight(0x10b981, 6.2, 30);
    colosseumCrownLight.position.set(0, 12.5, 0);
    scene.add(colosseumCrownLight);

    // 2. Dải sóng Lụa Khúc xạ WebGL 3.0 (Iridescent Liquid Ribbon có tính toán Pháp tuyến Normals thời gian thực)
    const waveGeometry = new THREE.PlaneGeometry(48, 30, 96, 64);
    waveGeometry.rotateX(-Math.PI / 2);
    const waveBasePositions = new Float32Array(
      (waveGeometry.attributes.position as THREE.BufferAttribute).array
    );

    const waveMaterial = new THREE.MeshPhysicalMaterial({
      color: isDarkRef.current ? 0x0f172a : 0xdbeafe,
      emissive: isDarkRef.current ? 0x1e1b4b : 0x6366f1,
      emissiveIntensity: isDarkRef.current ? 0.45 : 0.16,
      roughness: 0.08,
      metalness: 0.65,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 1.0,
      envMapIntensity: 2.2,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
    });
    const waveSurfaceMesh = new THREE.Mesh(waveGeometry, waveMaterial);
    waveSurfaceMesh.position.set(0, -3.55, 0);
    waveSurfaceMesh.receiveShadow = true;
    scene.add(waveSurfaceMesh);

    const waveWireMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: isDarkRef.current ? 0.16 : 0.1,
    });
    const waveWireMesh = new THREE.Mesh(waveGeometry, waveWireMaterial);
    waveWireMesh.position.set(0, -3.53, 0);
    scene.add(waveWireMesh);

    // 3. Khối Tinh thể & Quả cầu Thủy tinh Khúc xạ IOR 1.52 (Refractive Crystal Orbs & Octahedrons)
    const floatingCrystals: FloatingCrystalEntry[] = [];
    const crystalConfigs = [
      { radius: 0.68, orbit: 7.8, speed: 0.44, y: 1.4, phase: 0.2, color: 0x38bdf8 },
      { radius: 0.52, orbit: 8.9, speed: -0.35, y: 4.1, phase: 2.1, color: 0xa855f7 },
      { radius: 0.58, orbit: 7.1, speed: 0.52, y: 6.2, phase: 4.0, color: 0x10b981 },
      { radius: 0.45, orbit: 9.5, speed: -0.4, y: -0.2, phase: 5.1, color: 0xf59e0b },
    ];

    crystalConfigs.forEach((cfg) => {
      const crystalGroup = new THREE.Group();

      // Lớp vỏ cầu thủy tinh quang học trong suốt có độ bóng gương cao
      const outerSphereGeo = new THREE.SphereGeometry(cfg.radius, 48, 48);
      const outerSphereMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        emissive: cfg.color,
        emissiveIntensity: 0.15,
        roughness: 0.02,
        metalness: 0.08,
        transmission: 0.92,
        ior: 1.52,
        thickness: 1.8,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 2.8,
        transparent: true,
        opacity: 0.95,
      });
      const outerSphereMesh = new THREE.Mesh(outerSphereGeo, outerSphereMat);
      crystalGroup.add(outerSphereMesh);

      // Lõi kim cương đa diện (Faceted Octahedron) xoay bên trong quả cầu
      const innerCoreGeo = new THREE.OctahedronGeometry(cfg.radius * 0.48, 0);
      const innerCoreMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.85,
        roughness: 0.12,
        metalness: 0.85,
        flatShading: true,
      });
      const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
      crystalGroup.add(innerCoreMesh);

      // Vòng quỹ đạo Chrome mảnh bao quanh quả cầu
      const ringGeo = new THREE.TorusGeometry(cfg.radius * 1.28, 0.018, 16, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.6,
        roughness: 0.1,
        metalness: 0.9,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 3;
      crystalGroup.add(ringMesh);

      scene.add(crystalGroup);
      floatingCrystals.push({
        group: crystalGroup,
        coreMesh: innerCoreMesh,
        ringMesh,
        orbitRadius: cfg.orbit,
        orbitSpeed: cfg.speed,
        baseY: cfg.y,
        phaseOffset: cfg.phase,
      });
    });

    // 4. Khối Tổ hợp Tòa nhà Kiến trúc 5 Tầng Vát Cạnh Sắc Nét (Architectural Beveled 5-Floor Matrix)
    const towerRootGroup = new THREE.Group();
    scene.add(towerRootGroup);

    const floorGroups: THREE.Group[] = [];
    const floorEdgeMaterials: THREE.LineBasicMaterial[] = [];
    const roomBeacons: RoomBeaconEntry[] = [];
    const colosseumSeats: ColosseumSeatEntry[] = [];

    // Dùng chung các Geometry đã vát cạnh (Beveled) để tối ưu FPS và tạo gờ bắt sáng sắc nét
    const sharedSlabBevelGeo = createBeveledBoxGeometry(8.2, 0.24, 5.6, 0.38, 0.045);
    const sharedSlabSubFrameGeo = createBeveledBoxGeometry(7.95, 0.08, 5.35, 0.34, 0.02);
    const sharedGlassRoomShellGeo = createBeveledBoxGeometry(2.18, 0.62, 1.86, 0.16, 0.022);
    const sharedRoomRoofFrameGeo = createBeveledBoxGeometry(2.22, 0.045, 1.9, 0.16, 0.012);
    const sharedRectTableGeo = createBeveledBoxGeometry(1.16, 0.07, 0.56, 0.08, 0.015);
    const sharedChairSeatGeo = createBeveledBoxGeometry(0.18, 0.05, 0.18, 0.04, 0.01);
    const sharedChairBackGeo = createBeveledBoxGeometry(0.18, 0.16, 0.04, 0.03, 0.008);

    const chromeFrameMaterial = new THREE.MeshPhysicalMaterial({
      color: isDarkRef.current ? 0x94a3b8 : 0x475569,
      roughness: 0.14,
      metalness: 0.92,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 2.4,
    });

    const roomOffsets: Array<{
      x: number;
      z: number;
      statusColor: number;
      cap: number;
    }> = [
      { x: -2.55, z: -1.55, statusColor: 0x10b981, cap: 6 },
      { x: 0.0, z: -1.55, statusColor: 0x38bdf8, cap: 8 },
      { x: 2.55, z: -1.55, statusColor: 0x10b981, cap: 4 },
      { x: -2.55, z: 1.55, statusColor: 0xf59e0b, cap: 6 },
      { x: 0.0, z: 1.55, statusColor: 0x10b981, cap: 8 },
      { x: 2.55, z: 1.55, statusColor: 0xf43f5e, cap: 10 },
    ];

    for (let floorIdx = 0; floorIdx < 5; floorIdx++) {
      const floorGroup = new THREE.Group();
      floorGroup.position.y = floorIdx * 1.18 - 1.25;

      if (floorIdx < 4) {
        // Mặt sàn kính cường lực vát cạnh kim loại Tầng 1..4
        const slabMat = new THREE.MeshPhysicalMaterial({
          color: isDarkRef.current ? 0x0f172a : 0xf8fafc,
          emissive: isDarkRef.current ? 0x1e293b : 0xe2e8f0,
          emissiveIntensity: 0.18,
          roughness: 0.1,
          metalness: 0.55,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          envMapIntensity: 2.2,
          transparent: true,
          opacity: 0.94,
        });
        const slabMesh = new THREE.Mesh(sharedSlabBevelGeo, slabMat);
        slabMesh.castShadow = true;
        slabMesh.receiveShadow = true;
        floorGroup.add(slabMesh);

        // Khung sườn kim loại Anodized dưới đáy mỗi tầng
        const subFrameMesh = new THREE.Mesh(sharedSlabSubFrameGeo, chromeFrameMaterial);
        subFrameMesh.position.y = -0.14;
        floorGroup.add(subFrameMesh);

        // Đường viền ánh sáng kiến trúc quanh sàn
        const edgesGeo = new THREE.EdgesGeometry(sharedSlabBevelGeo, 22);
        const edgeMat = new THREE.LineBasicMaterial({
          color: floorIdx % 2 === 0 ? 0x38bdf8 : 0x818cf8,
          transparent: true,
          opacity: 0.85,
        });
        floorEdgeMaterials.push(edgeMat);
        const edgeLines = new THREE.LineSegments(edgesGeo, edgeMat);
        floorGroup.add(edgeLines);

        // Hành lang trung tâm bóng gương kèm 2 dải LED dẫn hướng
        const corridorGeo = new THREE.PlaneGeometry(7.6, 0.82);
        corridorGeo.rotateX(-Math.PI / 2);
        const corridorMat = new THREE.MeshPhysicalMaterial({
          color: isDarkRef.current ? 0x1e1b4b : 0xe0e7ff,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.22,
          roughness: 0.12,
          metalness: 0.4,
          clearcoat: 1.0,
        });
        const corridorMesh = new THREE.Mesh(corridorGeo, corridorMat);
        corridorMesh.position.y = 0.125;
        floorGroup.add(corridorMesh);

        [-0.38, 0.38].forEach((railZ) => {
          const railMesh = new THREE.Mesh(
            new THREE.BoxGeometry(7.5, 0.015, 0.03),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
          );
          railMesh.position.set(0, 0.13, railZ);
          floorGroup.add(railMesh);
        });

        // 6 Phòng họp Kính Vát Cạnh 3D trên mỗi tầng (Tổng 24 phòng M1-01..M4-06)
        roomOffsets.forEach((rm, rmIdx) => {
          const roomPodGroup = new THREE.Group();
          roomPodGroup.position.set(rm.x, 0.42, rm.z);

          const dynamicStatusColor =
            (floorIdx + rmIdx) % 5 === 0
              ? 0xf43f5e
              : (floorIdx + rmIdx) % 3 === 0
              ? 0xf59e0b
              : rm.statusColor;

          // Đế sàn riêng từng phòng có viền LED phát sáng
          const podBaseGeo = createBeveledBoxGeometry(2.14, 0.05, 1.82, 0.14, 0.01);
          const podBaseMat = new THREE.MeshStandardMaterial({
            color: isDarkRef.current ? 0x1e293b : 0xffffff,
            emissive: dynamicStatusColor,
            emissiveIntensity: 0.25,
            roughness: 0.25,
            metalness: 0.5,
          });
          const podBaseMesh = new THREE.Mesh(podBaseGeo, podBaseMat);
          podBaseMesh.position.y = -0.28;
          roomPodGroup.add(podBaseMesh);

          // Khối buồng kính quang học PBR có độ bóng Clearcoat và phản xạ HDRI
          const glassBoxMat = new THREE.MeshPhysicalMaterial({
            color: isDarkRef.current ? 0xbae6fd : 0xe0f2fe,
            emissive: dynamicStatusColor,
            emissiveIntensity: 0.08,
            roughness: 0.04,
            metalness: 0.12,
            transmission: 0.86,
            ior: 1.5,
            thickness: 0.6,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            envMapIntensity: 2.6,
            transparent: true,
            opacity: 0.52,
          });
          const glassBoxMesh = new THREE.Mesh(sharedGlassRoomShellGeo, glassBoxMat);
          glassBoxMesh.castShadow = true;
          roomPodGroup.add(glassBoxMesh);

          // Viền khung nhôm Titanium trên đỉnh phòng kính
          const roofFrameMesh = new THREE.Mesh(sharedRoomRoofFrameGeo, chromeFrameMaterial);
          roofFrameMesh.position.y = 0.31;
          roomPodGroup.add(roofFrameMesh);

          // 4 Trụ góc nhôm Anodized sắc nét cho từng phòng
          [
            [-1.02, -0.86],
            [1.02, -0.86],
            [-1.02, 0.86],
            [1.02, 0.86],
          ].forEach(([px, pz]) => {
            const cornerPost = new THREE.Mesh(
              new THREE.CylinderGeometry(0.032, 0.032, 0.62, 12),
              chromeFrameMaterial
            );
            cornerPost.position.set(px, 0, pz);
            roomPodGroup.add(cornerPost);
          });

          // Bàn họp bên trong (Bàn tròn Collab hoặc Bàn dài Boardroom vát cạnh)
          const isRoundTable = rmIdx === 3 || rmIdx === 4;
          const tableMat = new THREE.MeshPhysicalMaterial({
            color: isDarkRef.current ? 0xe2e8f0 : 0xffffff,
            roughness: 0.12,
            metalness: 0.35,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08,
          });

          if (isRoundTable) {
            const roundTableGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.06, 28);
            const roundTableMesh = new THREE.Mesh(roundTableGeo, tableMat);
            roundTableMesh.position.y = -0.06;
            roundTableMesh.castShadow = true;
            roomPodGroup.add(roundTableMesh);

            const centerInlay = new THREE.Mesh(
              new THREE.CylinderGeometry(0.2, 0.2, 0.068, 24),
              new THREE.MeshStandardMaterial({
                color: dynamicStatusColor,
                emissive: dynamicStatusColor,
                emissiveIntensity: 0.6,
              })
            );
            centerInlay.position.y = -0.058;
            roomPodGroup.add(centerInlay);
          } else {
            const rectTableMesh = new THREE.Mesh(sharedRectTableGeo, tableMat);
            rectTableMesh.position.y = -0.06;
            rectTableMesh.castShadow = true;
            roomPodGroup.add(rectTableMesh);

            const runnerInlay = new THREE.Mesh(
              new THREE.BoxGeometry(0.76, 0.075, 0.16),
              new THREE.MeshStandardMaterial({
                color: dynamicStatusColor,
                emissive: dynamicStatusColor,
                emissiveIntensity: 0.6,
              })
            );
            runnerInlay.position.y = -0.058;
            roomPodGroup.add(runnerInlay);
          }

          // Ghế xoay 3D chi tiết xếp quanh bàn họp
          const chairMat = new THREE.MeshStandardMaterial({
            color: dynamicStatusColor,
            roughness: 0.25,
            metalness: 0.4,
          });
          const chairCount = Math.min(6, rm.cap);
          for (let c = 0; c < chairCount; c++) {
            const miniChair = new THREE.Group();
            const seatPad = new THREE.Mesh(sharedChairSeatGeo, chairMat);
            const backPad = new THREE.Mesh(sharedChairBackGeo, chairMat);
            backPad.position.set(0, 0.09, -0.07);
            miniChair.add(seatPad);
            miniChair.add(backPad);

            const angle = (c / chairCount) * Math.PI * 2;
            const rad = isRoundTable ? 0.64 : 0.68;
            const cx = Math.cos(angle) * rad;
            const cz = Math.sin(angle) * (isRoundTable ? 0.62 : 0.48);
            miniChair.position.set(cx, -0.14, cz);
            miniChair.lookAt(0, -0.14, 0);
            roomPodGroup.add(miniChair);
          }

          // Màn hình Hội nghị 4K treo tường có khung Bezel và mặt phát sáng
          const tvFrameMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.78, 0.34, 0.04),
            chromeFrameMaterial
          );
          tvFrameMesh.position.set(0, 0.05, rm.z < 0 ? -0.86 : 0.86);
          roomPodGroup.add(tvFrameMesh);

          const tvGlowMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            emissive: dynamicStatusColor,
            emissiveIntensity: 0.95,
            roughness: 0.1,
          });
          const tvGlowMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.27, 0.048),
            tvGlowMat
          );
          tvGlowMesh.position.copy(tvFrameMesh.position);
          roomPodGroup.add(tvGlowMesh);

          // Đèn Beacon Kim cương (Octahedron) báo trạng thái phòng trên nóc
          const beaconGeo = new THREE.OctahedronGeometry(0.095, 0);
          const beaconMat = new THREE.MeshStandardMaterial({
            color: dynamicStatusColor,
            emissive: dynamicStatusColor,
            emissiveIntensity: 1.2,
            roughness: 0.1,
            metalness: 0.8,
            flatShading: true,
          });
          const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
          beaconMesh.position.set(0, 0.44, 0);
          roomPodGroup.add(beaconMesh);

          const haloGeo = new THREE.SphereGeometry(0.14, 16, 16);
          const haloMat = new THREE.MeshBasicMaterial({
            color: dynamicStatusColor,
            transparent: true,
            opacity: 0.28,
          });
          const haloMesh = new THREE.Mesh(haloGeo, haloMat);
          haloMesh.position.set(0, 0.44, 0);
          roomPodGroup.add(haloMesh);

          const pulseRingGeo = new THREE.RingGeometry(0.13, 0.21, 32);
          pulseRingGeo.rotateX(-Math.PI / 2);
          const pulseRingMat = new THREE.MeshBasicMaterial({
            color: dynamicStatusColor,
            transparent: true,
            opacity: 0.72,
            side: THREE.DoubleSide,
          });
          const pulseRingMesh = new THREE.Mesh(pulseRingGeo, pulseRingMat);
          pulseRingMesh.position.set(0, 0.34, 0);
          roomPodGroup.add(pulseRingMesh);

          roomBeacons.push({
            coreMesh: beaconMesh,
            haloMesh,
            pulseRingMesh,
            tvGlowMesh,
            floorIndex: floorIdx,
            roomIndex: rmIdx,
            baseStatusColor: dynamicStatusColor,
          });

          floorGroup.add(roomPodGroup);
        });
      } else {
        // ===================================================================
        // TẦNG 5 (H-01): ĐẤU TRƯỜNG LA MÃ (COLOSSEUM AMPHITHEATER 360° PBR)
        // ===================================================================
        const arenaBaseGeo = new THREE.CylinderGeometry(4.35, 4.65, 0.3, 64);
        const arenaBaseMat = new THREE.MeshPhysicalMaterial({
          color: isDarkRef.current ? 0x0f172a : 0xf1f5f9,
          emissive: 0x065f46,
          emissiveIntensity: 0.25,
          roughness: 0.1,
          metalness: 0.65,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          envMapIntensity: 2.5,
        });
        const arenaBaseMesh = new THREE.Mesh(arenaBaseGeo, arenaBaseMat);
        arenaBaseMesh.castShadow = true;
        arenaBaseMesh.receiveShadow = true;
        floorGroup.add(arenaBaseMesh);

        // Vòng vương miện Chrome + LED Ngọc lục bảo bao quanh Đấu trường
        const crownTorusGeo = new THREE.TorusGeometry(4.42, 0.06, 20, 96);
        crownTorusGeo.rotateX(Math.PI / 2);
        const crownTorusMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 0.9,
          roughness: 0.15,
          metalness: 0.85,
        });
        const crownTorusMesh = new THREE.Mesh(crownTorusGeo, crownTorusMat);
        crownTorusMesh.position.y = 0.15;
        floorGroup.add(crownTorusMesh);

        // Hàng cột trụ kiến trúc Colosseum bao quanh chu vi Tầng 5
        const colonnadeCount = 16;
        for (let c = 0; c < colonnadeCount; c++) {
          const colAngle = (c / colonnadeCount) * Math.PI * 2;
          const colRadius = 4.22;
          const colPillar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.065, 0.08, 0.95, 16),
            chromeFrameMaterial
          );
          colPillar.position.set(
            Math.cos(colAngle) * colRadius,
            0.58,
            Math.sin(colAngle) * colRadius
          );
          floorGroup.add(colPillar);
        }

        // Vòng giàn đèn đỉnh Đấu trường (Upper Colosseum Halo Arch)
        const upperArchGeo = new THREE.TorusGeometry(4.22, 0.055, 16, 96);
        upperArchGeo.rotateX(Math.PI / 2);
        const upperArchMesh = new THREE.Mesh(upperArchGeo, chromeFrameMaterial);
        upperArchMesh.position.y = 1.06;
        floorGroup.add(upperArchMesh);

        // Sân khấu tròn trung tâm 3 bậc (Multi-Tiered Central Stage Podium)
        const stageCenterZ = -0.58;
        const stageOuterGeo = new THREE.CylinderGeometry(1.32, 1.46, 0.24, 48);
        const stageOuterMat = new THREE.MeshPhysicalMaterial({
          color: 0x0f172a,
          emissive: 0x0284c7,
          emissiveIntensity: 0.45,
          roughness: 0.08,
          metalness: 0.75,
          clearcoat: 1.0,
        });
        const stageOuterMesh = new THREE.Mesh(stageOuterGeo, stageOuterMat);
        stageOuterMesh.position.set(0, 0.24, stageCenterZ);
        floorGroup.add(stageOuterMesh);

        const stageNeonRing = new THREE.Mesh(
          new THREE.TorusGeometry(1.34, 0.035, 16, 64),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        stageNeonRing.rotation.x = Math.PI / 2;
        stageNeonRing.position.set(0, 0.36, stageCenterZ);
        floorGroup.add(stageNeonRing);

        // Bục phát biểu Keynote ở tâm sân khấu
        const lecternGeo = createBeveledBoxGeometry(0.42, 0.42, 0.28, 0.06, 0.015);
        const lecternMesh = new THREE.Mesh(lecternGeo, chromeFrameMaterial);
        lecternMesh.position.set(0, 0.52, stageCenterZ);
        floorGroup.add(lecternMesh);

        // Màn hình LED Panorama 360° vòm cong có CanvasTexture sắc nét
        const panoramaTex = createPanoramaScreenTexture();
        const panoramaGeo = new THREE.CylinderGeometry(
          3.78,
          3.78,
          1.12,
          64,
          1,
          true,
          Math.PI * 0.66,
          Math.PI * 0.68
        );
        const panoramaMat = new THREE.MeshStandardMaterial({
          map: panoramaTex,
          emissive: 0x38bdf8,
          emissiveMap: panoramaTex,
          emissiveIntensity: 0.85,
          roughness: 0.12,
          metalness: 0.3,
          side: THREE.DoubleSide,
        });
        const panoramaMesh = new THREE.Mesh(panoramaGeo, panoramaMat);
        panoramaMesh.position.set(0, 0.76, -0.22);
        floorGroup.add(panoramaMesh);

        // 3 Dãy ghế vòng cung La Mã (A1..A7, B1..B9, C1..C12 — Tổng 28-30 ghế bậc thang)
        const rowDefinitions = [
          { rowIndex: 0, count: 7, radius: 1.98, yOffset: 0.26, color: 0x10b981 },
          { rowIndex: 1, count: 9, radius: 2.74, yOffset: 0.44, color: 0x38bdf8 },
          { rowIndex: 2, count: 12, radius: 3.52, yOffset: 0.64, color: 0xa855f7 },
        ];

        rowDefinitions.forEach((rowDef) => {
          // Bậc thềm đá vòm cung đỡ từng hàng ghế
          const tierStepGeo = new THREE.RingGeometry(
            rowDef.radius - 0.3,
            rowDef.radius + 0.3,
            56,
            1,
            -Math.PI * 0.1,
            Math.PI * 1.2
          );
          tierStepGeo.rotateX(-Math.PI / 2);
          const tierStepMat = new THREE.MeshPhysicalMaterial({
            color: isDarkRef.current ? 0x1e293b : 0xe2e8f0,
            emissive: rowDef.color,
            emissiveIntensity: 0.22,
            roughness: 0.2,
            metalness: 0.5,
            side: THREE.DoubleSide,
          });
          const tierStepMesh = new THREE.Mesh(tierStepGeo, tierStepMat);
          tierStepMesh.position.set(0, rowDef.yOffset - 0.1, -0.25);
          floorGroup.add(tierStepMesh);

          for (let s = 0; s < rowDef.count; s++) {
            const ratio = rowDef.count > 1 ? s / (rowDef.count - 1) : 0.5;
            const angle = -Math.PI * 0.06 + ratio * Math.PI * 1.12;
            const seatX = Math.cos(angle) * rowDef.radius;
            const seatZ = Math.sin(angle) * rowDef.radius - 0.25;

            const seatUnitGroup = new THREE.Group();
            seatUnitGroup.position.set(seatX, rowDef.yOffset, seatZ);

            const cushionMat = new THREE.MeshPhysicalMaterial({
              color: rowDef.color,
              emissive: rowDef.color,
              emissiveIntensity: 0.5,
              roughness: 0.18,
              metalness: 0.45,
              clearcoat: 0.8,
            });
            const cushionMesh = new THREE.Mesh(sharedChairSeatGeo, cushionMat);
            seatUnitGroup.add(cushionMesh);

            const backrestMesh = new THREE.Mesh(sharedChairBackGeo, cushionMat);
            backrestMesh.position.set(0, 0.11, -0.08);
            seatUnitGroup.add(backrestMesh);

            seatUnitGroup.lookAt(0, rowDef.yOffset, stageCenterZ);
            floorGroup.add(seatUnitGroup);

            colosseumSeats.push({
              cushionMesh,
              backrestMesh,
              rowIdx: rowDef.rowIndex,
              seatIdx: s,
              baseColor: rowDef.color,
            });
          }
        });
      }

      floorGroups.push(floorGroup);
      towerRootGroup.add(floorGroup);
    }

    // 5. Trụ Dữ liệu Quang học & Xung ánh sáng chạy dọc 5 tầng (Vertical Fiber Optic Columns)
    const pillarCorners = [
      { x: -3.95, z: -2.65 },
      { x: 3.95, z: -2.65 },
      { x: -3.95, z: 2.65 },
      { x: 3.95, z: 2.65 },
    ];
    const verticalPillars: THREE.Mesh[] = [];
    const dataPulsePackets: DataPulsePacketEntry[] = [];

    pillarCorners.forEach((corner, cIdx) => {
      const pillarGeo = new THREE.CylinderGeometry(0.035, 0.035, 12.5, 16);
      const pillarMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.38,
      });
      const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
      pillarMesh.position.set(corner.x, 3.6, corner.z);
      towerRootGroup.add(pillarMesh);
      verticalPillars.push(pillarMesh);

      // Các hạt xung năng lượng chạy dọc theo cột khi tách tầng
      const packetGeo = new THREE.CapsuleGeometry(0.065, 0.35, 8, 16);
      const packetMat = new THREE.MeshBasicMaterial({
        color: cIdx % 2 === 0 ? 0x38bdf8 : 0x10b981,
      });
      const packetMesh = new THREE.Mesh(packetGeo, packetMat);
      packetMesh.position.set(corner.x, 0, corner.z);
      towerRootGroup.add(packetMesh);
      dataPulsePackets.push({
        mesh: packetMesh,
        cornerIndex: cIdx,
        speed: 2.4 + cIdx * 0.35,
        offset: cIdx * 1.7,
      });
    });

    // 6. Vòng Khiên Bảo mật Optimistic Lock & Quét QR (Security & QR Gyroscope Rings)
    const orbitalShieldGroup = new THREE.Group();
    const outerRingGeo = new THREE.TorusGeometry(5.85, 0.042, 20, 120);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.65,
    });
    const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRingMesh.rotation.x = Math.PI / 2.25;
    orbitalShieldGroup.add(outerRingMesh);

    const innerRingGeo = new THREE.TorusGeometry(5.1, 0.036, 20, 120);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x6366f1,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.6,
    });
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRingMesh.rotation.x = -Math.PI / 2.55;
    orbitalShieldGroup.add(innerRingMesh);

    orbitalShieldGroup.position.y = 2.45;
    towerRootGroup.add(orbitalShieldGroup);

    // 7. Trường Hạt Không gian 3D (Spatial Starfield)
    const particleCount = 460;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 42;
      particlePositions[i * 3 + 1] = (Math.random() - 0.2) * 26;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 38;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.11,
      transparent: true,
      opacity: 0.8,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 8. Tương tác Chuột (Pointer Parallax) & Cuộn trang mượt (Smooth Damped Camera Rig)
    let pointerNormX = 0;
    let pointerNormY = 0;

    const handlePointerMove = (evt: MouseEvent) => {
      pointerNormX = (evt.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      pointerNormY = (evt.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
    };
    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    const handleWindowResize = () => {
      if (!mountContainerRef.current) {
        return;
      }
      const nextW = Math.max(mountContainerRef.current.clientWidth, window.innerWidth, 320);
      const nextH = Math.max(mountContainerRef.current.clientHeight, window.innerHeight, 480);
      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
      renderer.setSize(nextW, nextH);
    };
    window.addEventListener('resize', handleWindowResize);

    let smoothedScroll = scrollTargetRef.current;
    const currentCamPos = new THREE.Vector3(11.8, 8.4, 13.8);
    const currentLookTarget = new THREE.Vector3(0, 1.8, 0);
    const desiredCamPos = new THREE.Vector3(11.8, 8.4, 13.8);
    const desiredLookTarget = new THREE.Vector3(0, 1.8, 0);

    let currentFloorGap = 1.18;
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animateLoop = () => {
      animationFrameId = window.requestAnimationFrame(animateLoop);
      const elapsed = clock.getElapsedTime();

      // Đồng bộ nền Sáng / Tối theo thời gian thực
      scene.fog = new THREE.FogExp2(isDarkRef.current ? 0x040711 : 0xeef4ff, 0.018);
      ambientLight.intensity = isDarkRef.current ? 0.95 : 1.45;
      waveMaterial.color.setHex(isDarkRef.current ? 0x0f172a : 0xdbeafe);
      waveMaterial.emissiveIntensity = isDarkRef.current ? 0.45 : 0.16;

      smoothedScroll += (scrollTargetRef.current - smoothedScroll) * 0.065;

      const manualFloor = selectedFloorRef.current;
      let targetFloorGap = 1.18;

      if (manualFloor !== null && manualFloor >= 1 && manualFloor <= 5) {
        targetFloorGap = 2.55;
        const focusFloorY = (manualFloor - 1) * targetFloorGap - 1.25;
        if (manualFloor === 5) {
          desiredCamPos.set(0.0, focusFloorY + 5.2, 6.2);
          desiredLookTarget.set(0.0, focusFloorY + 0.35, -0.15);
        } else {
          desiredCamPos.set(6.9, focusFloorY + 2.65, 7.6);
          desiredLookTarget.set(0.0, focusFloorY + 0.2, 0.0);
        }
      } else if (smoothedScroll < 0.28) {
        const t = smoothedScroll / 0.28;
        targetFloorGap = 1.18 + t * 0.45;
        desiredCamPos.set(11.8 - t * 2.1, 8.4 - t * 1.2, 13.8 - t * 2.5);
        desiredLookTarget.set(0.0, 1.8, 0.0);
      } else if (smoothedScroll < 0.58) {
        const t = (smoothedScroll - 0.28) / 0.3;
        targetFloorGap = 2.65 + Math.sin(t * Math.PI) * 0.25;
        desiredCamPos.set(8.2 - t * 2.4, 5.8 + t * 3.2, 9.5 - t * 1.6);
        desiredLookTarget.set(0.0, 2.2 + t * 1.2, 0.0);
      } else if (smoothedScroll < 0.82) {
        const t = (smoothedScroll - 0.58) / 0.24;
        targetFloorGap = 1.85;
        const topFloorY = 4 * targetFloorGap - 1.25;
        desiredCamPos.set(Math.sin(t * 1.2) * 2.2, topFloorY + 5.3, 6.3 - t * 0.8);
        desiredLookTarget.set(0.0, topFloorY + 0.3, -0.2);
      } else {
        const t = (smoothedScroll - 0.82) / 0.18;
        targetFloorGap = 1.32 - t * 0.14;
        desiredCamPos.set(9.6, 6.8, 10.6);
        desiredLookTarget.set(0.0, 2.0, 0.0);
      }

      desiredCamPos.x += pointerNormX * 1.4;
      desiredCamPos.y += -pointerNormY * 0.9;

      currentCamPos.lerp(desiredCamPos, 0.065);
      currentLookTarget.lerp(desiredLookTarget, 0.075);
      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookTarget);

      currentFloorGap += (targetFloorGap - currentFloorGap) * 0.075;

      floorGroups.forEach((fGroup, idx) => {
        const baseFloorY = idx * currentFloorGap - 1.25;
        const floatWave = Math.sin(elapsed * 1.6 + idx * 0.7) * 0.04;
        fGroup.position.y = baseFloorY + floatWave;

        const isSelectedFloor = manualFloor === idx + 1;
        const targetScale = isSelectedFloor ? 1.07 : 1.0;
        fGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
      });

      floorEdgeMaterials.forEach((edgeMat, idx) => {
        edgeMat.opacity = manualFloor === idx + 1 ? 1.0 : 0.78;
      });

      verticalPillars.forEach((pillarMesh) => {
        const pMat = pillarMesh.material as THREE.MeshPhysicalMaterial;
        pMat.opacity = currentFloorGap > 1.7 ? 0.58 : 0.28;
      });

      dataPulsePackets.forEach((pkt) => {
        const corner = pillarCorners[pkt.cornerIndex];
        const cycleY = ((elapsed * pkt.speed + pkt.offset) % 10.5) - 1.5;
        pkt.mesh.position.set(corner.x, cycleY, corner.z);
      });

      towerRootGroup.rotation.y = elapsed * 0.15 + smoothedScroll * Math.PI * 1.18;

      // Cập nhật bề mặt Sóng Lụa Khúc Xạ & tính lại Vertex Normals để ánh sáng phản chiếu mượt như lụa
      const posAttr = waveGeometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        const bx = waveBasePositions[i * 3];
        const bz = waveBasePositions[i * 3 + 2];
        const waveY =
          Math.sin(bx * 0.26 + elapsed * 1.65) * 0.62 +
          Math.cos(bz * 0.3 + elapsed * 1.25) * 0.48 +
          Math.sin((bx + bz) * 0.18 - elapsed * 1.1) * 0.22;
        posAttr.setY(i, waveY);
      }
      posAttr.needsUpdate = true;
      waveGeometry.computeVertexNormals();

      floatingCrystals.forEach((item) => {
        const angle = elapsed * item.orbitSpeed + item.phaseOffset;
        item.group.position.set(
          Math.cos(angle) * item.orbitRadius,
          item.baseY + Math.sin(elapsed * 1.8 + item.phaseOffset) * 0.58,
          Math.sin(angle) * item.orbitRadius
        );
        item.coreMesh.rotation.x = elapsed * 1.4;
        item.coreMesh.rotation.y = elapsed * 1.9;
        item.ringMesh.rotation.z = elapsed * 1.2;
      });

      roomBeacons.forEach((beacon) => {
        const pulseScale =
          1 + Math.sin(elapsed * 3.4 + beacon.floorIndex * 0.7 + beacon.roomIndex * 0.5) * 0.36;
        beacon.pulseRingMesh.scale.set(pulseScale, pulseScale, 1);
        beacon.coreMesh.rotation.y = elapsed * 2.2;
        const tvMat = beacon.tvGlowMesh.material as THREE.MeshStandardMaterial;
        tvMat.emissiveIntensity =
          0.75 + Math.sin(elapsed * 2.6 + beacon.roomIndex) * 0.35;
      });

      colosseumSeats.forEach((seat) => {
        const waveBoost =
          0.45 +
          Math.max(0, Math.sin(elapsed * 3.2 - seat.seatIdx * 0.35 - seat.rowIdx * 0.6)) * 0.85;
        const mat = seat.cushionMesh.material as THREE.MeshPhysicalMaterial;
        mat.emissiveIntensity = activeChapterRef.current === 3 ? waveBoost * 1.45 : waveBoost;
      });

      outerRingMesh.rotation.z = elapsed * 0.44;
      innerRingMesh.rotation.z = -elapsed * 0.58;
      const shieldScale = activeChapterRef.current === 4 ? 1.14 : 0.96;
      orbitalShieldGroup.scale.lerp(
        new THREE.Vector3(shieldScale, shieldScale, shieldScale),
        0.06
      );

      particleSystem.rotation.y = elapsed * 0.035;

      renderer.render(scene, camera);
    };

    animateLoop();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleWindowResize);

      studioEnvTexture.dispose();
      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh ||
          obj instanceof THREE.LineSegments ||
          obj instanceof THREE.Points
        ) {
          if (obj.geometry) {
            obj.geometry.dispose();
          }
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountContainerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
};