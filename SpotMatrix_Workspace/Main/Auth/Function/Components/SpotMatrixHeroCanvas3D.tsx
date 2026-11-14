import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface SpotMatrixHeroCanvas3DProps {
  scrollProgress: number;
  activeChapter: 1 | 2 | 3 | 4;
  selectedFloorPreview: number | null;
  isDark: boolean;
}

interface RoomBeaconEntry {
  mesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  floorIndex: number;
  roomIndex: number;
  baseStatusColor: number;
}

interface ColosseumSeatEntry {
  mesh: THREE.Mesh;
  rowIdx: number;
  seatIdx: number;
}

interface FloatingOrbEntry {
  mesh: THREE.Mesh;
  orbitRadius: number;
  orbitSpeed: number;
  baseY: number;
  phaseOffset: number;
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
    scene.fog = new THREE.FogExp2(isDarkRef.current ? 0x050814 : 0xeef4ff, 0.024);

    const camera = new THREE.PerspectiveCamera(42, initialWidth / initialHeight, 0.1, 160);
    camera.position.set(11.5, 8.2, 13.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerEl.innerHTML = '';
    containerEl.appendChild(renderer.domElement);

    // 1. Hệ thống ánh sáng Đa tầng (Studio PBR + Rim Neon)
    const ambientLight = new THREE.AmbientLight(
      isDarkRef.current ? 0x94a3b8 : 0xffffff,
      isDarkRef.current ? 0.85 : 1.35
    );
    scene.add(ambientLight);

    const mainDirLight = new THREE.DirectionalLight(0xffffff, isDarkRef.current ? 1.8 : 2.1);
    mainDirLight.position.set(16, 26, 18);
    mainDirLight.castShadow = true;
    mainDirLight.shadow.mapSize.width = 1024;
    mainDirLight.shadow.mapSize.height = 1024;
    scene.add(mainDirLight);

    const indigoRimLight = new THREE.PointLight(0x6366f1, 4.2, 34);
    indigoRimLight.position.set(-10, 7, -8);
    scene.add(indigoRimLight);

    const cyanAccentLight = new THREE.PointLight(0x06b6d4, 3.8, 32);
    cyanAccentLight.position.set(10, 5, 9);
    scene.add(cyanAccentLight);

    const colosseumCrownLight = new THREE.PointLight(0x10b981, 4.5, 26);
    colosseumCrownLight.position.set(0, 11, 0);
    scene.add(colosseumCrownLight);

    // 2. Dải sóng Lụa Năng lượng WebGL 3.0 (Tương tự hiệu ứng sóng Iridescent nhưng mang lưới Ma trận Không gian)
    const waveGeometry = new THREE.PlaneGeometry(42, 26, 72, 44);
    waveGeometry.rotateX(-Math.PI / 2);
    const waveBasePositions = new Float32Array(
      (waveGeometry.attributes.position as THREE.BufferAttribute).array
    );

    const waveMaterial = new THREE.MeshPhysicalMaterial({
      color: isDarkRef.current ? 0x1e1b4b : 0xc7d2fe,
      emissive: isDarkRef.current ? 0x312e81 : 0x6366f1,
      emissiveIntensity: isDarkRef.current ? 0.55 : 0.2,
      roughness: 0.18,
      metalness: 0.35,
      transmission: 0.45,
      transparent: true,
      opacity: 0.72,
      wireframe: false,
      side: THREE.DoubleSide,
    });
    const waveSurfaceMesh = new THREE.Mesh(waveGeometry, waveMaterial);
    waveSurfaceMesh.position.set(0, -3.4, 0);
    scene.add(waveSurfaceMesh);

    const waveWireMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: isDarkRef.current ? 0.22 : 0.14,
    });
    const waveWireMesh = new THREE.Mesh(waveGeometry, waveWireMaterial);
    waveWireMesh.position.set(0, -3.38, 0);
    scene.add(waveWireMesh);

    // 3. Quả cầu Thủy tinh Khúc xạ (Refractive Crystal Orbs) bay quanh Tòa nhà
    const floatingOrbs: FloatingOrbEntry[] = [];
    const orbConfigs = [
      { radius: 0.62, orbit: 7.4, speed: 0.48, y: 1.2, phase: 0.2, color: 0x38bdf8 },
      { radius: 0.44, orbit: 8.6, speed: -0.36, y: 3.8, phase: 2.1, color: 0xa855f7 },
      { radius: 0.52, orbit: 6.8, speed: 0.55, y: 5.8, phase: 4.0, color: 0x10b981 },
      { radius: 0.36, orbit: 9.2, speed: -0.42, y: -0.4, phase: 5.1, color: 0xf59e0b },
    ];

    orbConfigs.forEach((cfg) => {
      const orbGeo = new THREE.SphereGeometry(cfg.radius, 32, 32);
      const orbMat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.35,
        roughness: 0.05,
        metalness: 0.1,
        transmission: 0.88,
        thickness: 1.2,
        transparent: true,
        opacity: 0.92,
      });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      scene.add(orbMesh);
      floatingOrbs.push({
        mesh: orbMesh,
        orbitRadius: cfg.orbit,
        orbitSpeed: cfg.speed,
        baseY: cfg.y,
        phaseOffset: cfg.phase,
      });
    });

    // 4. Khối Tổ hợp Tòa nhà 5 Tầng (Tầng 1–4: 24 Phòng họp Kính + Tầng 5: Hội trường Đấu Trường La Mã H-01)
    const towerRootGroup = new THREE.Group();
    scene.add(towerRootGroup);

    const floorGroups: THREE.Group[] = [];
    const floorEdgeMaterials: THREE.LineBasicMaterial[] = [];
    const roomBeacons: RoomBeaconEntry[] = [];
    const colosseumSeats: ColosseumSeatEntry[] = [];

    const roomOffsets: Array<{ x: number; z: number; statusColor: number }> = [
      { x: -2.4, z: -1.45, statusColor: 0x10b981 },
      { x: 0.0, z: -1.45, statusColor: 0x6366f1 },
      { x: 2.4, z: -1.45, statusColor: 0x10b981 },
      { x: -2.4, z: 1.45, statusColor: 0xf59e0b },
      { x: 0.0, z: 1.45, statusColor: 0x10b981 },
      { x: 2.4, z: 1.45, statusColor: 0xf43f5e },
    ];

    for (let floorIdx = 0; floorIdx < 5; floorIdx++) {
      const floorGroup = new THREE.Group();
      floorGroup.position.y = floorIdx * 1.15 - 1.2;

      if (floorIdx < 4) {
        // Mặt sàn kính Tầng 1..4
        const slabGeo = new THREE.BoxGeometry(7.6, 0.16, 5.2);
        const slabMat = new THREE.MeshPhysicalMaterial({
          color: isDarkRef.current ? 0x0f172a : 0xf8fafc,
          emissive: 0x1e293b,
          emissiveIntensity: 0.25,
          roughness: 0.2,
          metalness: 0.3,
          transmission: 0.55,
          transparent: true,
          opacity: 0.88,
        });
        const slabMesh = new THREE.Mesh(slabGeo, slabMat);
        slabMesh.receiveShadow = true;
        floorGroup.add(slabMesh);

        // Viền phát sáng Neon quanh sàn
        const edgesGeo = new THREE.EdgesGeometry(slabGeo);
        const edgeMat = new THREE.LineBasicMaterial({
          color: floorIdx % 2 === 0 ? 0x38bdf8 : 0x818cf8,
          transparent: true,
          opacity: 0.8,
        });
        floorEdgeMaterials.push(edgeMat);
        const edgeLines = new THREE.LineSegments(edgesGeo, edgeMat);
        floorGroup.add(edgeLines);

        // Thảm hành lang trung tâm phát sáng
        const corridorGeo = new THREE.PlaneGeometry(7.1, 0.72);
        corridorGeo.rotateX(-Math.PI / 2);
        const corridorMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.18,
        });
        const corridorMesh = new THREE.Mesh(corridorGeo, corridorMat);
        corridorMesh.position.y = 0.09;
        floorGroup.add(corridorMesh);

        // 6 Phòng họp Kính 3D trên mỗi tầng (Tổng 24 phòng M1-01..M4-06)
        roomOffsets.forEach((rm, rmIdx) => {
          const roomPodGroup = new THREE.Group();
          roomPodGroup.position.set(rm.x, 0.36, rm.z);

          // Khối buồng kính trong suốt
          const glassBoxGeo = new THREE.BoxGeometry(2.05, 0.54, 1.75);
          const glassBoxMat = new THREE.MeshPhysicalMaterial({
            color: 0x93c5fd,
            roughness: 0.08,
            metalness: 0.1,
            transmission: 0.82,
            transparent: true,
            opacity: 0.42,
          });
          const glassBoxMesh = new THREE.Mesh(glassBoxGeo, glassBoxMat);
          roomPodGroup.add(glassBoxMesh);

          const roomWireGeo = new THREE.EdgesGeometry(glassBoxGeo);
          const roomWireMat = new THREE.LineBasicMaterial({
            color: 0x60a5fa,
            transparent: true,
            opacity: 0.55,
          });
          roomPodGroup.add(new THREE.LineSegments(roomWireGeo, roomWireMat));

          // Bàn họp bên trong (Bàn tròn hoặc Bàn dài Boardroom)
          const isRoundTable = rmIdx === 3 || rmIdx === 4;
          const tableGeo = isRoundTable
            ? new THREE.CylinderGeometry(0.42, 0.42, 0.08, 20)
            : new THREE.BoxGeometry(1.1, 0.08, 0.52);
          const tableMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            roughness: 0.3,
            metalness: 0.5,
          });
          const tableMesh = new THREE.Mesh(tableGeo, tableMat);
          tableMesh.position.y = -0.08;
          roomPodGroup.add(tableMesh);

          // Màn hình 4K treo tường phát sáng
          const tvGeo = new THREE.BoxGeometry(0.68, 0.28, 0.04);
          const tvMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
          });
          const tvMesh = new THREE.Mesh(tvGeo, tvMat);
          tvMesh.position.set(0, 0.04, rm.z < 0 ? -0.82 : 0.82);
          roomPodGroup.add(tvMesh);

          // Đèn Beacon trạng thái phòng (AVAILABLE / RESERVED / OCCUPIED)
          const dynamicStatusColor =
            (floorIdx + rmIdx) % 5 === 0
              ? 0xf43f5e
              : (floorIdx + rmIdx) % 3 === 0
              ? 0xf59e0b
              : rm.statusColor;

          const beaconGeo = new THREE.SphereGeometry(0.09, 16, 16);
          const beaconMat = new THREE.MeshBasicMaterial({
            color: dynamicStatusColor,
          });
          const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
          beaconMesh.position.set(0, 0.34, 0);
          roomPodGroup.add(beaconMesh);

          const pulseRingGeo = new THREE.RingGeometry(0.12, 0.2, 24);
          pulseRingGeo.rotateX(-Math.PI / 2);
          const pulseRingMat = new THREE.MeshBasicMaterial({
            color: dynamicStatusColor,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide,
          });
          const pulseRingMesh = new THREE.Mesh(pulseRingGeo, pulseRingMat);
          pulseRingMesh.position.set(0, 0.29, 0);
          roomPodGroup.add(pulseRingMesh);

          roomBeacons.push({
            mesh: beaconMesh,
            ringMesh: pulseRingMesh,
            floorIndex: floorIdx,
            roomIndex: rmIdx,
            baseStatusColor: dynamicStatusColor,
          });

          floorGroup.add(roomPodGroup);
        });
      } else {
        // ===================================================================
        // TẦNG 5 (H-01): HỘI TRƯỜNG ĐẤU TRƯỜNG LA MÃ (COLOSSEUM AMPHITHEATER)
        // ===================================================================
        const arenaBaseGeo = new THREE.CylinderGeometry(4.15, 4.45, 0.24, 48);
        const arenaBaseMat = new THREE.MeshPhysicalMaterial({
          color: isDarkRef.current ? 0x0f172a : 0xf1f5f9,
          emissive: 0x10b981,
          emissiveIntensity: 0.22,
          roughness: 0.18,
          metalness: 0.45,
          transmission: 0.5,
          transparent: true,
          opacity: 0.92,
        });
        const arenaBaseMesh = new THREE.Mesh(arenaBaseGeo, arenaBaseMat);
        floorGroup.add(arenaBaseMesh);

        const arenaRingGeo = new THREE.RingGeometry(4.12, 4.32, 64);
        arenaRingGeo.rotateX(-Math.PI / 2);
        const arenaRingMat = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const arenaRingMesh = new THREE.Mesh(arenaRingGeo, arenaRingMat);
        arenaRingMesh.position.y = 0.14;
        floorGroup.add(arenaRingMesh);

        // Sân khấu tròn trung tâm (Central Stage Podium)
        const stageGeo = new THREE.CylinderGeometry(1.15, 1.28, 0.22, 36);
        const stageMat = new THREE.MeshPhysicalMaterial({
          color: 0x06b6d4,
          emissive: 0x0284c7,
          emissiveIntensity: 0.65,
          roughness: 0.15,
          metalness: 0.4,
        });
        const stageMesh = new THREE.Mesh(stageGeo, stageMat);
        stageMesh.position.set(0, 0.22, -0.55);
        floorGroup.add(stageMesh);

        // Màn hình LED Panorama 360° vòm cong phía Bắc Sân khấu
        const panoramaGeo = new THREE.CylinderGeometry(
          3.65,
          3.65,
          0.95,
          40,
          1,
          true,
          Math.PI * 0.68,
          Math.PI * 0.64
        );
        const panoramaMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.48,
          side: THREE.DoubleSide,
        });
        const panoramaMesh = new THREE.Mesh(panoramaGeo, panoramaMat);
        panoramaMesh.position.set(0, 0.62, -0.2);
        floorGroup.add(panoramaMesh);

        // 3 Dãy ghế vòng cung La Mã (Tổng 30 ghế)
        const rowDefinitions = [
          { rowIndex: 0, count: 8, radius: 1.95, yOffset: 0.24, color: 0x10b981 },
          { rowIndex: 1, count: 10, radius: 2.68, yOffset: 0.38, color: 0x38bdf8 },
          { rowIndex: 2, count: 12, radius: 3.42, yOffset: 0.54, color: 0xa855f7 },
        ];

        rowDefinitions.forEach((rowDef) => {
          const tierArcGeo = new THREE.RingGeometry(
            rowDef.radius - 0.24,
            rowDef.radius + 0.24,
            40,
            1,
            -Math.PI * 0.12,
            Math.PI * 1.24
          );
          tierArcGeo.rotateX(-Math.PI / 2);
          const tierArcMat = new THREE.MeshBasicMaterial({
            color: rowDef.color,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
          });
          const tierArcMesh = new THREE.Mesh(tierArcGeo, tierArcMat);
          tierArcMesh.position.set(0, rowDef.yOffset - 0.08, -0.25);
          floorGroup.add(tierArcMesh);

          for (let s = 0; s < rowDef.count; s++) {
            const ratio = rowDef.count > 1 ? s / (rowDef.count - 1) : 0.5;
            const angle = -Math.PI * 0.08 + ratio * Math.PI * 1.16;
            const seatX = Math.cos(angle) * rowDef.radius;
            const seatZ = Math.sin(angle) * rowDef.radius - 0.25;

            const seatGeo = new THREE.BoxGeometry(0.24, 0.18, 0.24);
            const seatMat = new THREE.MeshStandardMaterial({
              color: rowDef.color,
              emissive: rowDef.color,
              emissiveIntensity: 0.55,
              roughness: 0.2,
              metalness: 0.4,
            });
            const seatMesh = new THREE.Mesh(seatGeo, seatMat);
            seatMesh.position.set(seatX, rowDef.yOffset, seatZ);
            seatMesh.lookAt(0, rowDef.yOffset, -0.55);
            floorGroup.add(seatMesh);

            colosseumSeats.push({
              mesh: seatMesh,
              rowIdx: rowDef.rowIndex,
              seatIdx: s,
            });
          }
        });
      }

      floorGroups.push(floorGroup);
      towerRootGroup.add(floorGroup);
    }

    // 5. Tia dữ liệu trục đứng (Vertical Matrix Data Beams) nối xuyên 5 tầng
    const pillarCorners = [
      { x: -3.75, z: -2.55 },
      { x: 3.75, z: -2.55 },
      { x: -3.75, z: 2.55 },
      { x: 3.75, z: 2.55 },
    ];
    const verticalPillars: THREE.Mesh[] = [];
    pillarCorners.forEach((corner) => {
      const pillarGeo = new THREE.CylinderGeometry(0.03, 0.03, 12, 12);
      const pillarMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
      });
      const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
      pillarMesh.position.set(corner.x, 3.5, corner.z);
      towerRootGroup.add(pillarMesh);
      verticalPillars.push(pillarMesh);
    });

    // 6. Vòng Khiên Bảo mật & Quét QR (Security & QR Orbital Rings)
    const orbitalShieldGroup = new THREE.Group();
    const outerRingGeo = new THREE.TorusGeometry(5.6, 0.035, 16, 96);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.45,
    });
    const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRingMesh.rotation.x = Math.PI / 2.3;
    orbitalShieldGroup.add(outerRingMesh);

    const innerRingGeo = new THREE.TorusGeometry(4.85, 0.03, 16, 96);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.4,
    });
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRingMesh.rotation.x = -Math.PI / 2.6;
    orbitalShieldGroup.add(innerRingMesh);

    orbitalShieldGroup.position.y = 2.4;
    towerRootGroup.add(orbitalShieldGroup);

    // 7. Trường Hạt Không gian 3D (Spatial Starfield & Matrix Nodes)
    const particleCount = 420;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 38;
      particlePositions[i * 3 + 1] = (Math.random() - 0.2) * 24;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 34;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.11,
      transparent: true,
      opacity: 0.75,
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
    const currentCamPos = new THREE.Vector3(11.5, 8.2, 13.5);
    const currentLookTarget = new THREE.Vector3(0, 1.8, 0);
    const desiredCamPos = new THREE.Vector3(11.5, 8.2, 13.5);
    const desiredLookTarget = new THREE.Vector3(0, 1.8, 0);

    let currentFloorGap = 1.15;
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animateLoop = () => {
      animationFrameId = window.requestAnimationFrame(animateLoop);
      const elapsed = clock.getElapsedTime();

      // Đồng bộ nền Sáng / Tối theo thời gian thực
      scene.fog = new THREE.FogExp2(isDarkRef.current ? 0x050814 : 0xeef4ff, 0.024);
      ambientLight.intensity = isDarkRef.current ? 0.85 : 1.45;
      waveMaterial.color.setHex(isDarkRef.current ? 0x1e1b4b : 0xc7d2fe);
      waveMaterial.emissiveIntensity = isDarkRef.current ? 0.55 : 0.22;

      smoothedScroll += (scrollTargetRef.current - smoothedScroll) * 0.065;

      const manualFloor = selectedFloorRef.current;
      let targetFloorGap = 1.15;

      if (manualFloor !== null && manualFloor >= 1 && manualFloor <= 5) {
        targetFloorGap = 2.45;
        const focusFloorY = (manualFloor - 1) * targetFloorGap - 1.2;
        if (manualFloor === 5) {
          desiredCamPos.set(0.0, focusFloorY + 5.2, 6.2);
          desiredLookTarget.set(0.0, focusFloorY + 0.3, 0.0);
        } else {
          desiredCamPos.set(6.8, focusFloorY + 2.6, 7.6);
          desiredLookTarget.set(0.0, focusFloorY + 0.2, 0.0);
        }
      } else if (smoothedScroll < 0.28) {
        const t = smoothedScroll / 0.28;
        targetFloorGap = 1.15 + t * 0.45;
        desiredCamPos.set(11.5 - t * 2.0, 8.2 - t * 1.2, 13.5 - t * 2.5);
        desiredLookTarget.set(0.0, 1.8, 0.0);
      } else if (smoothedScroll < 0.58) {
        const t = (smoothedScroll - 0.28) / 0.3;
        targetFloorGap = 2.55 + Math.sin(t * Math.PI) * 0.25;
        desiredCamPos.set(8.2 - t * 2.4, 5.6 + t * 3.2, 9.4 - t * 1.6);
        desiredLookTarget.set(0.0, 2.2 + t * 1.2, 0.0);
      } else if (smoothedScroll < 0.82) {
        const t = (smoothedScroll - 0.58) / 0.24;
        targetFloorGap = 1.85;
        const topFloorY = 4 * targetFloorGap - 1.2;
        desiredCamPos.set(Math.sin(t * 1.2) * 2.2, topFloorY + 5.4, 6.4 - t * 0.8);
        desiredLookTarget.set(0.0, topFloorY + 0.25, -0.2);
      } else {
        const t = (smoothedScroll - 0.82) / 0.18;
        targetFloorGap = 1.3 - t * 0.15;
        desiredCamPos.set(9.4, 6.6, 10.4);
        desiredLookTarget.set(0.0, 2.0, 0.0);
      }

      desiredCamPos.x += pointerNormX * 1.35;
      desiredCamPos.y += -pointerNormY * 0.85;

      currentCamPos.lerp(desiredCamPos, 0.065);
      currentLookTarget.lerp(desiredLookTarget, 0.075);
      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookTarget);

      currentFloorGap += (targetFloorGap - currentFloorGap) * 0.075;

      floorGroups.forEach((fGroup, idx) => {
        const baseFloorY = idx * currentFloorGap - 1.2;
        const floatWave = Math.sin(elapsed * 1.6 + idx * 0.7) * 0.04;
        fGroup.position.y = baseFloorY + floatWave;

        const isSelectedFloor = manualFloor === idx + 1;
        const targetScale = isSelectedFloor ? 1.06 : 1.0;
        fGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
      });

      floorEdgeMaterials.forEach((edgeMat, idx) => {
        edgeMat.opacity = manualFloor === idx + 1 ? 1.0 : 0.72;
      });

      verticalPillars.forEach((pillarMesh) => {
        const pMat = pillarMesh.material as THREE.MeshBasicMaterial;
        pMat.opacity = currentFloorGap > 1.7 ? 0.52 : 0.24;
      });

      towerRootGroup.rotation.y = elapsed * 0.16 + smoothedScroll * Math.PI * 1.15;

      const posAttr = waveGeometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        const bx = waveBasePositions[i * 3];
        const bz = waveBasePositions[i * 3 + 2];
        const waveY =
          Math.sin(bx * 0.28 + elapsed * 1.7) * 0.55 +
          Math.cos(bz * 0.32 + elapsed * 1.3) * 0.45;
        posAttr.setY(i, waveY);
      }
      posAttr.needsUpdate = true;

      floatingOrbs.forEach((orb) => {
        const angle = elapsed * orb.orbitSpeed + orb.phaseOffset;
        orb.mesh.position.set(
          Math.cos(angle) * orb.orbitRadius,
          orb.baseY + Math.sin(elapsed * 1.8 + orb.phaseOffset) * 0.55,
          Math.sin(angle) * orb.orbitRadius
        );
      });

      roomBeacons.forEach((beacon) => {
        const pulseScale =
          1 + Math.sin(elapsed * 3.4 + beacon.floorIndex * 0.7 + beacon.roomIndex * 0.5) * 0.35;
        beacon.ringMesh.scale.set(pulseScale, pulseScale, 1);
        const beaconMat = beacon.mesh.material as THREE.MeshBasicMaterial;
        beaconMat.color.setHex(beacon.baseStatusColor);
      });

      colosseumSeats.forEach((seat) => {
        const waveBoost =
          0.45 +
          Math.max(0, Math.sin(elapsed * 3.2 - seat.seatIdx * 0.35 - seat.rowIdx * 0.6)) * 0.75;
        const mat = seat.mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = activeChapterRef.current === 3 ? waveBoost * 1.35 : waveBoost;
      });

      outerRingMesh.rotation.z = elapsed * 0.42;
      innerRingMesh.rotation.z = -elapsed * 0.55;
      const shieldScale = activeChapterRef.current === 4 ? 1.12 : 0.96;
      orbitalShieldGroup.scale.lerp(
        new THREE.Vector3(shieldScale, shieldScale, shieldScale),
        0.06
      );

      particleSystem.rotation.y = elapsed * 0.04;

      renderer.render(scene, camera);
    };

    animateLoop();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleWindowResize);

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