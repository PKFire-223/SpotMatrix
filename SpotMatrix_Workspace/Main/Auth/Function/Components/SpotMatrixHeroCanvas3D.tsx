import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SpotMatrixHeroCanvas3DProps {
  scrollProgress: number;
  activeChapter: 1 | 2 | 3 | 4;
  selectedFloorPreview: number | null;
  isDark: boolean;
  isCinematicAutoFly?: boolean;
  isPaused?: boolean;
}

interface FloorLayerRig {
  floorNumber: number;
  baseY: number;
  group: THREE.Group;
  edgeStripMat: THREE.MeshStandardMaterial;
}

interface DataPacketNode {
  mesh: THREE.Mesh;
  laneX: number;
  laneZ: number;
  speed: number;
  offset: number;
}

interface SpotMatrixBuildingRig {
  rootGroup: THREE.Group;
  floorLayers: FloorLayerRig[];
  volumetricCones: THREE.Mesh[];
  dataPackets: DataPacketNode[];
  colosseumHaloRing: THREE.Mesh;
  dustPoints: THREE.Points;
  disposeResources: () => void;
}

/**
 * Factory dựng mô hình Tòa nhà 5 Tầng SpotMatrix bằng mã nguồn thuần (Procedural Factory)
 * Học từ kiến trúc img2threejs (tách biệt dữ liệu & hình học khỏi vòng lặp render,
 * phân cấp Macro -> Meso -> Micro, hỗ trợ tách lớp Explodable & InstancedMesh giảm draw calls).
 */
function createSpotMatrixBuildingModel(
  isDarkTheme: boolean
): SpotMatrixBuildingRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(res: T): T => {
    disposables.push(res);
    return res;
  };

  const rootGroup = new THREE.Group();
  const floorLayers: FloorLayerRig[] = [];
  const volumetricCones: THREE.Mesh[] = [];
  const dataPackets: DataPacketNode[] = [];

  // Shared PBR Materials (Học từ pmndrs/react-three-fiber Discussion #425: chỉ biên dịch shader 1 lần)
  const slabMat = track(
    new THREE.MeshPhysicalMaterial({
      color: isDarkTheme ? 0x111827 : 0xf1f5f9,
      roughness: 0.25,
      metalness: 0.35,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15,
    })
  );

  const glassWallMat = track(
    new THREE.MeshPhysicalMaterial({
      color: isDarkTheme ? 0x60a5fa : 0xbae6fd,
      roughness: 0.06,
      metalness: 0.08,
      transmission: 0.72,
      ior: 1.48,
      thickness: 0.45,
      transparent: true,
      opacity: isDarkTheme ? 0.42 : 0.48,
    })
  );

  const frameMetalMat = track(
    new THREE.MeshStandardMaterial({
      color: isDarkTheme ? 0x334155 : 0x64748b,
      roughness: 0.3,
      metalness: 0.85,
    })
  );

  const deskMat = track(
    new THREE.MeshStandardMaterial({
      color: isDarkTheme ? 0x1e293b : 0xe2e8f0,
      roughness: 0.45,
      metalness: 0.15,
    })
  );

  const screenGlowMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: isDarkTheme ? 1.35 : 0.7,
      roughness: 0.15,
    })
  );

  // Shared Geometries
  const floorSlabGeo = track(new THREE.BoxGeometry(10.2, 0.24, 6.8));
  const roomGlassBackGeo = track(new THREE.BoxGeometry(2.7, 1.35, 0.06));
  const roomGlassSideGeo = track(new THREE.BoxGeometry(0.06, 1.35, 2.3));
  const deskGeo = track(new THREE.BoxGeometry(1.35, 0.08, 0.72));
  const screenGeo = track(new THREE.BoxGeometry(1.1, 0.56, 0.05));
  const pillarGeo = track(new THREE.CylinderGeometry(0.08, 0.08, 1.45, 12));

  // Đế móng kiến trúc & Lưới mặt đất
  const basePlinthGeo = track(new THREE.BoxGeometry(12.2, 0.35, 8.8));
  const basePlinth = new THREE.Mesh(basePlinthGeo, slabMat);
  basePlinth.position.y = -3.85;
  rootGroup.add(basePlinth);

  const gridHelper = new THREE.GridHelper(
    46,
    46,
    isDarkTheme ? 0x334155 : 0xcbd5e1,
    isDarkTheme ? 0x1e293b : 0xe2e8f0
  );
  gridHelper.position.y = -4.04;
  rootGroup.add(gridHelper);

  // TẦNG 1 ĐẾN TẦNG 4: 24 Phòng họp Kính Open-Top (Không mái tam giác, rõ nội thất)
  for (let floorIdx = 0; floorIdx < 4; floorIdx++) {
    const floorNumber = floorIdx + 1;
    const baseY = -3.4 + floorIdx * 1.9;
    const floorGroup = new THREE.Group();
    floorGroup.position.y = baseY;

    const slabMesh = new THREE.Mesh(floorSlabGeo, slabMat);
    floorGroup.add(slabMesh);

    const edgeStripMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x4f46e5,
        emissive: 0x4f46e5,
        emissiveIntensity: isDarkTheme ? 1.1 : 0.45,
        roughness: 0.2,
      })
    );
    const edgeRingGeo = track(new THREE.BoxGeometry(10.32, 0.07, 6.92));
    const edgeStrip = new THREE.Mesh(edgeRingGeo, edgeStripMat);
    edgeStrip.position.y = -0.06;
    floorGroup.add(edgeStrip);

    // 4 cột kết cấu góc bằng InstancedMesh (1 draw call / tầng)
    const pillarInst = new THREE.InstancedMesh(pillarGeo, frameMetalMat, 4);
    const dummy = new THREE.Object3D();
    const cornerCoords: Array<[number, number]> = [
      [-4.85, -3.15],
      [4.85, -3.15],
      [-4.85, 3.15],
      [4.85, 3.15],
    ];
    cornerCoords.forEach(([cx, cz], idx) => {
      dummy.position.set(cx, 0.84, cz);
      dummy.updateMatrix();
      pillarInst.setMatrixAt(idx, dummy.matrix);
    });
    pillarInst.instanceMatrix.needsUpdate = true;
    floorGroup.add(pillarInst);

    // 6 Phòng họp kính mỗi tầng (2 hàng x 3 cột)
    for (let rIdx = 0; rIdx < 6; rIdx++) {
      const col = rIdx % 3;
      const row = Math.floor(rIdx / 3);
      const rx = (col - 1) * 3.15;
      const rz = row === 0 ? -1.7 : 1.7;

      const roomGroup = new THREE.Group();
      roomGroup.position.set(rx, 0.12, rz);

      const backGlass = new THREE.Mesh(roomGlassBackGeo, glassWallMat);
      backGlass.position.set(0, 0.68, row === 0 ? -1.12 : 1.12);
      roomGroup.add(backGlass);

      const leftGlass = new THREE.Mesh(roomGlassSideGeo, glassWallMat);
      leftGlass.position.set(-1.34, 0.68, 0);
      roomGroup.add(leftGlass);

      const rightGlass = new THREE.Mesh(roomGlassSideGeo, glassWallMat);
      rightGlass.position.set(1.34, 0.68, 0);
      roomGroup.add(rightGlass);

      const tableMesh = new THREE.Mesh(deskGeo, deskMat);
      tableMesh.position.set(0, 0.42, 0);
      roomGroup.add(tableMesh);

      const tvMesh = new THREE.Mesh(screenGeo, screenGlowMat);
      tvMesh.position.set(0, 0.82, row === 0 ? -1.04 : 1.04);
      roomGroup.add(tvMesh);

      // Đèn trạng thái phòng (Xanh trống / Indigo đang họp)
      const isOccupiedSample = (floorIdx + rIdx) % 4 === 1;
      const beaconGeo = track(new THREE.SphereGeometry(0.11, 14, 14));
      const beaconMat = track(
        new THREE.MeshStandardMaterial({
          color: isOccupiedSample ? 0x6366f1 : 0x10b981,
          emissive: isOccupiedSample ? 0x4f46e5 : 0x10b981,
          emissiveIntensity: isDarkTheme ? 1.8 : 0.9,
        })
      );
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(0, 1.38, 0);
      roomGroup.add(beaconMesh);

      floorGroup.add(roomGroup);
    }

    rootGroup.add(floorGroup);
    floorLayers.push({
      floorNumber,
      baseY,
      group: floorGroup,
      edgeStripMat,
    });
  }

  // TẦNG 5: HỘI TRƯỜNG ĐẤU TRƯỜNG LA MÃ (H-01) VỚI 30 GHẾ INSTANCEDMESH & CHÙM SÁNG ĐIỆN ẢNH
  const hallBaseY = -3.4 + 4 * 1.9;
  const hallGroup = new THREE.Group();
  hallGroup.position.y = hallBaseY;

  const hallFloorGeo = track(new THREE.CylinderGeometry(5.15, 5.3, 0.28, 48));
  const hallFloorMesh = new THREE.Mesh(hallFloorGeo, slabMat);
  hallGroup.add(hallFloorMesh);

  const hallEdgeMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: isDarkTheme ? 1.5 : 0.7,
      roughness: 0.15,
    })
  );
  const colosseumHaloRing = new THREE.Mesh(
    track(new THREE.TorusGeometry(5.2, 0.075, 16, 72)),
    hallEdgeMat
  );
  colosseumHaloRing.rotation.x = Math.PI / 2;
  colosseumHaloRing.position.y = 0.08;
  hallGroup.add(colosseumHaloRing);

  // Tường vòm kính bao quanh Đấu trường La Mã
  const arenaGlassGeo = track(
    new THREE.CylinderGeometry(4.95, 4.95, 1.65, 48, 1, true, 0, Math.PI * 1.65)
  );
  const arenaGlassMesh = new THREE.Mesh(arenaGlassGeo, glassWallMat);
  arenaGlassMesh.position.y = 0.95;
  arenaGlassMesh.rotation.y = Math.PI * 0.18;
  hallGroup.add(arenaGlassMesh);

  // Bục diễn giả trung tâm + Màn hình cong Panorama
  const podiumGeo = track(new THREE.CylinderGeometry(1.15, 1.35, 0.35, 32));
  const podiumMesh = new THREE.Mesh(podiumGeo, frameMetalMat);
  podiumMesh.position.set(0, 0.3, 0);
  hallGroup.add(podiumMesh);

  const centerHoloRing = new THREE.Mesh(
    track(new THREE.TorusGeometry(1.3, 0.045, 12, 48)),
    screenGlowMat
  );
  centerHoloRing.rotation.x = Math.PI / 2;
  centerHoloRing.position.y = 0.5;
  hallGroup.add(centerHoloRing);

  // 30 Ghế vòm La Mã dựng bằng 1 InstancedMesh duy nhất (Tối ưu 30 -> 1 draw call)
  const seatGeo = track(new THREE.BoxGeometry(0.46, 0.38, 0.42));
  const seatMat = track(
    new THREE.MeshStandardMaterial({
      color: isDarkTheme ? 0x818cf8 : 0x4f46e5,
      emissive: 0x312e81,
      emissiveIntensity: isDarkTheme ? 0.45 : 0.12,
      roughness: 0.35,
      metalness: 0.3,
    })
  );
  const seatsInstanced = new THREE.InstancedMesh(seatGeo, seatMat, 30);
  const seatDummy = new THREE.Object3D();
  let seatCursor = 0;
  const ringConfigs = [
    { count: 8, radius: 2.35, y: 0.36 },
    { count: 10, radius: 3.15, y: 0.54 },
    { count: 12, radius: 3.95, y: 0.72 },
  ];
  ringConfigs.forEach((ring) => {
    for (let s = 0; s < ring.count; s++) {
      const theta = -Math.PI * 0.75 + (s / (ring.count - 1)) * Math.PI * 1.5;
      seatDummy.position.set(
        Math.cos(theta) * ring.radius,
        ring.y,
        Math.sin(theta) * ring.radius
      );
      seatDummy.lookAt(0, ring.y, 0);
      seatDummy.updateMatrix();
      seatsInstanced.setMatrixAt(seatCursor, seatDummy.matrix);
      seatCursor += 1;
    }
  });
  seatsInstanced.instanceMatrix.needsUpdate = true;
  hallGroup.add(seatsInstanced);

  // Chùm sáng điện ảnh Volumetric Light Cone chiếu xuống Bục Diễn Giả
  const coneGeo = track(new THREE.ConeGeometry(3.2, 6.2, 32, 1, true));
  const coneMat = track(
    new THREE.MeshBasicMaterial({
      color: isDarkTheme ? 0x38bdf8 : 0x6366f1,
      transparent: true,
      opacity: isDarkTheme ? 0.085 : 0.045,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  const mainCone = new THREE.Mesh(coneGeo, coneMat);
  mainCone.position.set(0, 3.25, 0);
  hallGroup.add(mainCone);
  volumetricCones.push(mainCone);

  rootGroup.add(hallGroup);
  floorLayers.push({
    floorNumber: 5,
    baseY: hallBaseY,
    group: hallGroup,
    edgeStripMat: hallEdgeMat,
  });

  // Các gói tín hiệu dữ liệu chạy dọc 4 trục đứng của tòa nhà
  const packetGeo = track(new THREE.BoxGeometry(0.12, 0.55, 0.12));
  const packetMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: isDarkTheme ? 2.2 : 1.0,
    })
  );
  const lanePositions: Array<[number, number]> = [
    [-5.25, -3.5],
    [5.25, -3.5],
    [-5.25, 3.5],
    [5.25, 3.5],
  ];
  lanePositions.forEach(([lx, lz], idx) => {
    for (let p = 0; p < 2; p++) {
      const pMesh = new THREE.Mesh(packetGeo, packetMat);
      pMesh.position.set(lx, -3.5, lz);
      rootGroup.add(pMesh);
      dataPackets.push({
        mesh: pMesh,
        laneX: lx,
        laneZ: lz,
        speed: 0.24 + (idx % 2) * 0.07,
        offset: p * 0.5 + idx * 0.17,
      });
    }
  });

  // Hạt bụi ánh sáng khí quyển (Atmospheric Depth Particles)
  const particleCount = 160;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 7 + (i % 13) * 0.85;
    const ang = i * 1.6180339 * Math.PI * 2;
    positions[i * 3] = Math.cos(ang) * r;
    positions[i * 3 + 1] = ((i * 37) % 140) / 10 - 4.5;
    positions[i * 3 + 2] = Math.sin(ang) * r;
  }
  const dustGeo = track(new THREE.BufferGeometry());
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = track(
    new THREE.PointsMaterial({
      color: isDarkTheme ? 0x7dd3fc : 0x6366f1,
      size: isDarkTheme ? 0.09 : 0.07,
      transparent: true,
      opacity: isDarkTheme ? 0.55 : 0.32,
      depthWrite: false,
    })
  );
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  rootGroup.add(dustPoints);

  return {
    rootGroup,
    floorLayers,
    volumetricCones,
    dataPackets,
    colosseumHaloRing,
    dustPoints,
    disposeResources: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

export const SpotMatrixHeroCanvas3D: React.FC<SpotMatrixHeroCanvas3DProps> = ({
  scrollProgress,
  activeChapter,
  selectedFloorPreview,
  isDark,
  isCinematicAutoFly = false,
  isPaused = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<number>(scrollProgress);
  const chapterRef = useRef<1 | 2 | 3 | 4>(activeChapter);
  const selectedFloorRef = useRef<number | null>(selectedFloorPreview);
  const autoFlyRef = useRef<boolean>(isCinematicAutoFly);
  const pausedRef = useRef<boolean>(isPaused);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    chapterRef.current = activeChapter;
  }, [activeChapter]);

  useEffect(() => {
    selectedFloorRef.current = selectedFloorPreview;
  }, [selectedFloorPreview]);

  useEffect(() => {
    autoFlyRef.current = isCinematicAutoFly;
  }, [isCinematicAutoFly]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const bgHex = isDark ? 0x050814 : 0xf4f7fb;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, isDark ? 0.022 : 0.015);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 140);
    camera.position.set(13.5, 4.8, 16.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.18 : 1.06;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Hậu kỳ điện ảnh (EffectComposer + UnrealBloomPass chỉ kích hoạt dịu nhẹ để có hào quang phim)
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      isDark ? 0.42 : 0.14,
      0.55,
      isDark ? 0.72 : 0.9
    );
    composer.addPass(bloomPass);

    // Hệ thống chiếu sáng Studio 3 điểm
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.85 : 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.85 : 2.1);
    keyLight.position.set(12, 18, 14);
    scene.add(keyLight);

    const rimCyanLight = new THREE.PointLight(
      0x38bdf8,
      isDark ? 4.2 : 1.6,
      36
    );
    rimCyanLight.position.set(-10, 7, 9);
    scene.add(rimCyanLight);

    const rimIndigoLight = new THREE.PointLight(
      0x6366f1,
      isDark ? 3.8 : 1.4,
      36
    );
    rimIndigoLight.position.set(10, 5, -9);
    scene.add(rimIndigoLight);

    // Khởi tạo mô hình 5 tầng từ Procedural Factory
    const buildingRig = createSpotMatrixBuildingModel(isDark);
    scene.add(buildingRig.rootGroup);

    // Đường bay Camera điện ảnh 5 điểm (CatmullRomCurve3)
    const cameraPathCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(13.5, 4.6, 16.5), // Cảnh 1: Toàn cảnh góc 3/4 mở màn
      new THREE.Vector3(9.8, 0.8, 13.8), // Cảnh 2: Trượt thấp sát sảnh kính Tầng 1-2
      new THREE.Vector3(-11.5, 4.2, 12.2), // Cảnh 3: Quay ngang ngắm 5 tầng tách lớp
      new THREE.Vector3(5.8, 9.2, 8.8), // Cảnh 4: Bay vút qua vòm Đấu trường La Mã Tầng 5
      new THREE.Vector3(14.5, 6.4, -12.5), // Cảnh 5: Kéo góc rộng toàn cảnh sau lưng
    ]);
    const lookTargetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.6, 0),
      new THREE.Vector3(0, -1.6, 0),
      new THREE.Vector3(0, 1.4, 0),
      new THREE.Vector3(0, 4.4, 0),
      new THREE.Vector3(0, 1.8, 0),
    ]);

    const currentCamPos = camera.position.clone();
    const currentLookAt = new THREE.Vector3(0, 0.6, 0);
    const desiredCamPos = new THREE.Vector3();
    const desiredLookAt = new THREE.Vector3();

    let pointerOffsetX = 0;
    let pointerOffsetY = 0;
    const onPointerMove = (e: MouseEvent) => {
      pointerOffsetX = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 1.6;
      pointerOffsetY =
        (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 0.9;
    };
    window.addEventListener('mousemove', onPointerMove, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let rafId = 0;
    let cinemaClock = 0;
    let lastTs = performance.now();

    const animateFrame = (nowTs: number) => {
      rafId = requestAnimationFrame(animateFrame);
      if (document.hidden) {
        lastTs = nowTs;
        return;
      }

      const dt = Math.min(0.05, (nowTs - lastTs) / 1000);
      lastTs = nowTs;

      const freezeMotion = pausedRef.current || prefersReducedMotion;
      if (!freezeMotion) {
        cinemaClock += dt;
      }

      const selFloor = selectedFloorRef.current;
      const rawScroll = Math.max(0, Math.min(1, scrollRef.current));

      // Tính vị trí Camera trên đường cong Spline (Auto-Fly hoặc Scroll-Driven)
      const curveT = autoFlyRef.current
        ? (cinemaClock * 0.045) % 1
        : rawScroll;

      if (selFloor !== null && selFloor >= 1 && selFloor <= 5) {
        const targetY = -3.4 + (selFloor - 1) * 1.9 + 1.1;
        desiredCamPos.set(
          9.4 + pointerOffsetX * 0.8,
          targetY + 2.2 - pointerOffsetY * 0.6,
          10.8
        );
        desiredLookAt.set(0, targetY, 0);
      } else {
        cameraPathCurve.getPointAt(curveT, desiredCamPos);
        lookTargetCurve.getPointAt(curveT, desiredLookAt);
        desiredCamPos.x += pointerOffsetX;
        desiredCamPos.y -= pointerOffsetY;
      }

      currentCamPos.lerp(desiredCamPos, freezeMotion ? 0.16 : 0.06);
      currentLookAt.lerp(desiredLookAt, freezeMotion ? 0.16 : 0.07);
      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);

      // Hiệu ứng tách lớp kiến trúc (Exploded-View) mượt theo Chương 2 / Thanh cuộn
      const explodeStrength =
        selFloor !== null
          ? 0.45
          : chapterRef.current === 2
          ? 0.72
          : rawScroll * 0.45;

      buildingRig.floorLayers.forEach((layer) => {
        const targetY = layer.baseY + (layer.floorNumber - 1) * explodeStrength;
        layer.group.position.y += (targetY - layer.group.position.y) * 0.08;

        const isHighlighted =
          selFloor === layer.floorNumber ||
          (selFloor === null &&
            chapterRef.current === 3 &&
            layer.floorNumber === 5);
        layer.edgeStripMat.emissiveIntensity +=
          ((isHighlighted ? 2.2 : isDark ? 1.0 : 0.4) -
            layer.edgeStripMat.emissiveIntensity) *
          0.1;
      });

      // Chuyển động hạt ánh sáng & luồng dữ liệu dọc trục tòa nhà
      if (!freezeMotion) {
        buildingRig.colosseumHaloRing.rotation.z = cinemaClock * 0.35;
        buildingRig.dustPoints.rotation.y = cinemaClock * 0.03;

        buildingRig.dataPackets.forEach((pkt) => {
          const progress = (cinemaClock * pkt.speed + pkt.offset) % 1;
          pkt.mesh.position.set(pkt.laneX, -3.5 + progress * 9.5, pkt.laneZ);
        });
      }

      composer.render();
    };

    rafId = requestAnimationFrame(animateFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', onResize);
      buildingRig.disposeResources();
      composer.dispose();
      renderer.dispose();
    };
  }, [isDark]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full select-none"
      aria-label="SpotMatrix 5-Floor Cinematic 3D Architecture"
    />
  );
};