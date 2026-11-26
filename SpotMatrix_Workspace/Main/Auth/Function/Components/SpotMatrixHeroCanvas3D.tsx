import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface SpotMatrixHeroCanvas3DProps {
  scrollProgress: number;
  activeChapter: 1 | 2 | 3 | 4;
  selectedFloorPreview: number | null;
  isDark: boolean;
  isCinematicAutoFly?: boolean;
  isPaused?: boolean;
}

interface FloorHighlightRig {
  floorNumber: number;
  baseY: number;
  bandMaterial: THREE.MeshStandardMaterial;
  bandMesh: THREE.Mesh;
}

interface ArchitecturalTowerSpec {
  x: number;
  z: number;
  width: number;
  depth: number;
  floors: number;
  floorHeight: number;
  baseOffsetY: number;
  glassHex: number;
  litSeed: number;
}

interface SpotMatrixArchitectureRig {
  rootGroup: THREE.Group;
  floorHighlights: FloorHighlightRig[];
  skyParticles: THREE.Points;
  disposables: Array<{ dispose: () => void }>;
}

/**
 * Factory dựng mô hình Kiến trúc Tòa nhà Văn phòng Kính Xếp Bậc (Curtain-Wall 3 Towers)
 * Lấy cảm hứng trực tiếp từ mẫu kiến trúc kính xanh hiện đại 3 khối tháp + sảnh ngang + cột đỡ tầng trệt.
 * Sử dụng THREE.InstancedMesh cho toàn bộ hệ khung nhôm mullions/transoms và ô cửa sáng nội thất
 * nhằm đạt độ sắc nét kiến trúc cao, 0 lóa trắng (không dùng Bloom trên nền sáng) và 60 FPS ổn định.
 */
function createSpotMatrixArchitectureModel(
  isDark: boolean,
  facadeTexture: THREE.Texture | null
): SpotMatrixArchitectureRig {
  const rootGroup = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  // =========================================================================
  // 1. ĐẾ SÂN KIẾN TRÚC & BỆ ĐỠ CỘT TẦNG TRỆT (PLAZA & PODIUM)
  // =========================================================================
  const plazaGeo = track(new THREE.BoxGeometry(20, 0.45, 16));
  const plazaMat = track(
    new THREE.MeshStandardMaterial({
      color: isDark ? 0x0f172a : 0xdbe3ee,
      roughness: 0.72,
      metalness: 0.12,
    })
  );
  const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
  plazaMesh.position.set(0.6, -0.225, 0);
  plazaMesh.receiveShadow = true;
  rootGroup.add(plazaMesh);

  // Viền đá sáng bao quanh sân
  const plazaTrimGeo = track(new THREE.BoxGeometry(20.15, 0.1, 16.15));
  const plazaTrimMat = track(
    new THREE.MeshStandardMaterial({
      color: isDark ? 0x334155 : 0x94a3b8,
      roughness: 0.45,
      metalness: 0.35,
    })
  );
  const plazaTrim = new THREE.Mesh(plazaTrimGeo, plazaTrimMat);
  plazaTrim.position.set(0.6, 0.02, 0);
  rootGroup.add(plazaTrim);

  // Lưới sân kiến trúc tinh tế
  const gridHelper = new THREE.GridHelper(
    28,
    28,
    isDark ? 0x1e3a5f : 0xb8c7da,
    isDark ? 0x132238 : 0xd5e0ec
  );
  gridHelper.position.y = -0.44;
  rootGroup.add(gridHelper);

  // =========================================================================
  // 2. CẤU HÌNH 3 KHỐI THÁP KÍNH XẾP BẬC (THEO MẪU TÒA NHÀ KÍNH XANH)
  // =========================================================================
  const towerSpecs: ArchitecturalTowerSpec[] = [
    // Tháp Chính Phải-Trước (5 tầng chuẩn SpotMatrix nổi bật nhất)
    {
      x: 1.55,
      z: 1.35,
      width: 4.2,
      depth: 3.8,
      floors: 6,
      floorHeight: 1.35,
      baseOffsetY: 0.9,
      glassHex: isDark ? 0x12477d : 0x1d5fa3,
      litSeed: 11,
    },
    // Tháp Trung Tâm Cao Phía Sau (Tạo chiều sâu & đường chân trời bậc thang)
    {
      x: -0.9,
      z: -1.65,
      width: 4.0,
      depth: 3.6,
      floors: 8,
      floorHeight: 1.35,
      baseOffsetY: 0.9,
      glassHex: isDark ? 0x0e3a69 : 0x174f8c,
      litSeed: 23,
    },
    // Tháp Cánh Trái Bậc Thấp (Tạo tỷ lệ 3 khối cân đối như ảnh tham khảo)
    {
      x: -3.25,
      z: 1.15,
      width: 3.3,
      depth: 3.2,
      floors: 5,
      floorHeight: 1.35,
      baseOffsetY: 0.9,
      glassHex: isDark ? 0x16538f : 0x246eb8,
      litSeed: 37,
    },
  ];

  // Vật liệu chung cho khung nhôm mullions trắng-bạc sắc nét
  const mullionMat = track(
    new THREE.MeshStandardMaterial({
      color: isDark ? 0xcbd5e1 : 0xf1f5f9,
      roughness: 0.32,
      metalness: 0.55,
    })
  );

  // Vật liệu kính phản chiếu xanh cobalt kiến trúc có áp Texture ảnh thật độ phân giải cao
  const createGlassMaterial = (hex: number) =>
    track(
      new THREE.MeshPhysicalMaterial({
        color: facadeTexture ? (isDark ? 0xdbeafe : 0xeff6ff) : hex,
        map: facadeTexture || undefined,
        emissive: facadeTexture ? new THREE.Color(isDark ? 0x1e3a5f : 0x0f172a) : new THREE.Color(0x000000),
        emissiveMap: facadeTexture || undefined,
        emissiveIntensity: facadeTexture ? (isDark ? 0.55 : 0.22) : 0,
        roughness: 0.12,
        metalness: 0.42,
        clearcoat: 0.95,
        clearcoatRoughness: 0.08,
        reflectivity: 0.95,
      })
    );

  // Vật liệu cột đỡ tầng trệt (Pilotis) & sảnh kính
  const columnMat = track(
    new THREE.MeshStandardMaterial({
      color: isDark ? 0x94a3b8 : 0xe2e8f0,
      roughness: 0.4,
      metalness: 0.4,
    })
  );

  const lobbyGlassMat = track(
    new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x1e3a5f : 0x3b82c4,
      roughness: 0.15,
      metalness: 0.25,
      transparent: true,
      opacity: 0.72,
    })
  );

  // Gom transform cho InstancedMesh cửa sổ phát sáng ấm bên trong
  const litWindowTransforms: Array<{
    pos: THREE.Vector3;
    scale: THREE.Vector3;
    rotY: number;
    warm: boolean;
  }> = [];

  // Gom transform cho InstancedMesh khung nhôm đứng/ngang
  const mullionTransforms: Array<{
    pos: THREE.Vector3;
    scale: THREE.Vector3;
  }> = [];

  const unitBoxGeo = track(new THREE.BoxGeometry(1, 1, 1));

  towerSpecs.forEach((spec) => {
    const totalHeight = spec.floors * spec.floorHeight;
    const centerY = spec.baseOffsetY + totalHeight / 2;

    // Lõi kính xanh chính của tháp
    const glassGeo = track(
      new THREE.BoxGeometry(spec.width, totalHeight, spec.depth)
    );
    const glassMat = createGlassMaterial(spec.glassHex);
    const towerCore = new THREE.Mesh(glassGeo, glassMat);
    towerCore.position.set(spec.x, centerY, spec.z);
    towerCore.castShadow = true;
    towerCore.receiveShadow = true;
    rootGroup.add(towerCore);

    // Khối kính tầng trệt (lùi vào nhẹ để lộ cột đỡ pilotis)
    const lobbyGeo = track(
      new THREE.BoxGeometry(
        spec.width * 0.86,
        spec.baseOffsetY,
        spec.depth * 0.86
      )
    );
    const lobbyMesh = new THREE.Mesh(lobbyGeo, lobbyGlassMat);
    lobbyMesh.position.set(spec.x, spec.baseOffsetY / 2, spec.z);
    rootGroup.add(lobbyMesh);

    // Cột đỡ kiến trúc tầng trệt ở 4 góc + giữa cạnh
    const colGeo = track(new THREE.BoxGeometry(0.18, spec.baseOffsetY, 0.18));
    const hw = spec.width / 2 - 0.12;
    const hd = spec.depth / 2 - 0.12;
    const colCoords: Array<[number, number]> = [
      [-hw, -hd],
      [0, -hd],
      [hw, -hd],
      [-hw, hd],
      [0, hd],
      [hw, hd],
    ];
    colCoords.forEach(([cx, cz]) => {
      const col = new THREE.Mesh(colGeo, columnMat);
      col.position.set(spec.x + cx, spec.baseOffsetY / 2, spec.z + cz);
      col.castShadow = true;
      rootGroup.add(col);
    });

    // Viền mái kính (Parapet Crown) phản sáng xanh dương trên đỉnh tháp
    const crownHeight = 0.28;
    const crownGeo = track(
      new THREE.BoxGeometry(spec.width + 0.08, crownHeight, spec.depth + 0.08)
    );
    const crownMat = track(
      new THREE.MeshStandardMaterial({
        color: isDark ? 0x38bdf8 : 0x2563eb,
        emissive: isDark ? 0x0284c7 : 0x1d4ed8,
        emissiveIntensity: isDark ? 0.45 : 0.18,
        roughness: 0.2,
        metalness: 0.5,
      })
    );
    const crownMesh = new THREE.Mesh(crownGeo, crownMat);
    crownMesh.position.set(
      spec.x,
      spec.baseOffsetY + totalHeight + crownHeight / 2,
      spec.z
    );
    rootGroup.add(crownMesh);

    // Hệ khung nhôm ngang (Transoms) giữa từng tầng
    for (let fl = 0; fl <= spec.floors; fl += 1) {
      const y = spec.baseOffsetY + fl * spec.floorHeight;
      // Mặt trước & sau
      mullionTransforms.push({
        pos: new THREE.Vector3(spec.x, y, spec.z + spec.depth / 2 + 0.025),
        scale: new THREE.Vector3(spec.width + 0.08, 0.09, 0.06),
      });
      mullionTransforms.push({
        pos: new THREE.Vector3(spec.x, y, spec.z - spec.depth / 2 - 0.025),
        scale: new THREE.Vector3(spec.width + 0.08, 0.09, 0.06),
      });
      // Mặt trái & phải
      mullionTransforms.push({
        pos: new THREE.Vector3(spec.x + spec.width / 2 + 0.025, y, spec.z),
        scale: new THREE.Vector3(0.06, 0.09, spec.depth + 0.08),
      });
      mullionTransforms.push({
        pos: new THREE.Vector3(spec.x - spec.width / 2 - 0.025, y, spec.z),
        scale: new THREE.Vector3(0.06, 0.09, spec.depth + 0.08),
      });
    }

    // Hệ khung nhôm dọc (Vertical Mullions) tạo lưới cửa kính cao tầng
    const colsX = Math.max(4, Math.round(spec.width / 0.65));
    const colsZ = Math.max(4, Math.round(spec.depth / 0.65));
    for (let ix = 0; ix <= colsX; ix += 1) {
      const lx = -spec.width / 2 + (ix / colsX) * spec.width;
      mullionTransforms.push({
        pos: new THREE.Vector3(spec.x + lx, centerY, spec.z + spec.depth / 2 + 0.025),
        scale: new THREE.Vector3(0.065, totalHeight + 0.08, 0.06),
      });
      mullionTransforms.push({
        pos: new THREE.Vector3(spec.x + lx, centerY, spec.z - spec.depth / 2 - 0.025),
        scale: new THREE.Vector3(0.065, totalHeight + 0.08, 0.06),
      });
    }
    for (let iz = 0; iz <= colsZ; iz += 1) {
      const lz = -spec.depth / 2 + (iz / colsZ) * spec.depth;
      mullionTransforms.push({
        pos: new THREE.Vector3(spec.x + spec.width / 2 + 0.025, centerY, spec.z + lz),
        scale: new THREE.Vector3(0.06, totalHeight + 0.08, 0.065),
      });
      mullionTransforms.push({
        pos: new THREE.Vector3(spec.x - spec.width / 2 - 0.025, centerY, spec.z + lz),
        scale: new THREE.Vector3(0.06, totalHeight + 0.08, 0.065),
      });
    }

    // Ô cửa sổ nội thất phát sáng ấm/trắng xen kẽ (giống đèn văn phòng bật ban tối)
    const stepX = spec.width / colsX;
    const stepZ = spec.depth / colsZ;
    for (let fl = 0; fl < spec.floors; fl += 1) {
      const winY = spec.baseOffsetY + fl * spec.floorHeight + spec.floorHeight * 0.52;
      for (let ix = 0; ix < colsX; ix += 1) {
        const hash = (fl * 17 + ix * 31 + spec.litSeed) % 10;
        if (hash < 6) {
          const wx = spec.x - spec.width / 2 + (ix + 0.5) * stepX;
          litWindowTransforms.push({
            pos: new THREE.Vector3(wx, winY, spec.z + spec.depth / 2 + 0.012),
            scale: new THREE.Vector3(stepX * 0.72, spec.floorHeight * 0.62, 0.02),
            rotY: 0,
            warm: hash % 2 === 0,
          });
        }
        if ((hash + 3) % 10 < 5) {
          const wx = spec.x - spec.width / 2 + (ix + 0.5) * stepX;
          litWindowTransforms.push({
            pos: new THREE.Vector3(wx, winY, spec.z - spec.depth / 2 - 0.012),
            scale: new THREE.Vector3(stepX * 0.72, spec.floorHeight * 0.62, 0.02),
            rotY: 0,
            warm: hash % 3 === 0,
          });
        }
      }
      for (let iz = 0; iz < colsZ; iz += 1) {
        const hash = (fl * 19 + iz * 29 + spec.litSeed) % 10;
        if (hash < 6) {
          const wz = spec.z - spec.depth / 2 + (iz + 0.5) * stepZ;
          litWindowTransforms.push({
            pos: new THREE.Vector3(spec.x + spec.width / 2 + 0.012, winY, wz),
            scale: new THREE.Vector3(0.02, spec.floorHeight * 0.62, stepZ * 0.72),
            rotY: 0,
            warm: hash % 2 === 1,
          });
        }
        if ((hash + 4) % 10 < 5) {
          const wz = spec.z - spec.depth / 2 + (iz + 0.5) * stepZ;
          litWindowTransforms.push({
            pos: new THREE.Vector3(spec.x - spec.width / 2 - 0.012, winY, wz),
            scale: new THREE.Vector3(0.02, spec.floorHeight * 0.62, stepZ * 0.72),
            rotY: 0,
            warm: hash % 2 === 0,
          });
        }
      }
    }
  });

  // =========================================================================
  // 3. KHỐI SẢNH NGANG BÊN PHẢI & CÂY XANH CẢNH QUAN (NHƯ ẢNH MẪU OIP.JPG)
  // =========================================================================
  const annexGeo = track(new THREE.BoxGeometry(4.4, 2.15, 2.5));
  const annexMat = track(
    new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0x334155,
      roughness: 0.45,
      metalness: 0.4,
    })
  );
  const annexMesh = new THREE.Mesh(annexGeo, annexMat);
  annexMesh.position.set(6.4, 1.35, 0.6);
  annexMesh.castShadow = true;
  annexMesh.receiveShadow = true;
  rootGroup.add(annexMesh);

  const annexGlassGeo = track(new THREE.BoxGeometry(4.1, 1.15, 2.56));
  const annexGlassMesh = new THREE.Mesh(
    annexGlassGeo,
    createGlassMaterial(isDark ? 0x1e40af : 0x2563eb)
  );
  annexGlassMesh.position.set(6.4, 1.45, 0.6);
  rootGroup.add(annexGlassMesh);

  // Cây xanh cảnh quan xung quanh chân tòa nhà
  const treeFoliageGeo = track(new THREE.DodecahedronGeometry(0.55, 1));
  const treeFoliageMat = track(
    new THREE.MeshStandardMaterial({
      color: isDark ? 0x15803d : 0x16a34a,
      roughness: 0.85,
      metalness: 0.05,
    })
  );
  const treePositions: Array<[number, number, number]> = [
    [-5.5, 0.55, 3.6],
    [-4.2, 0.48, 4.1],
    [-2.8, 0.52, 4.0],
    [4.4, 0.45, 3.8],
    [6.1, 0.5, 3.5],
    [-5.8, 0.5, -2.5],
  ];
  treePositions.forEach(([tx, ty, tz], idx) => {
    const tree = new THREE.Mesh(treeFoliageGeo, treeFoliageMat);
    const scale = 0.8 + (idx % 3) * 0.22;
    tree.scale.set(scale, scale * 0.85, scale);
    tree.position.set(tx, ty, tz);
    tree.castShadow = true;
    rootGroup.add(tree);
  });

  // Render InstancedMesh cho toàn bộ khung nhôm mullions
  const mullionInstanced = new THREE.InstancedMesh(
    unitBoxGeo,
    mullionMat,
    mullionTransforms.length
  );
  const dummy = new THREE.Object3D();
  mullionTransforms.forEach((t, idx) => {
    dummy.position.copy(t.pos);
    dummy.scale.copy(t.scale);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    mullionInstanced.setMatrixAt(idx, dummy.matrix);
  });
  mullionInstanced.instanceMatrix.needsUpdate = true;
  rootGroup.add(mullionInstanced);

  // Render 2 InstancedMesh cho cửa sổ sáng ấm (warm amber) và sáng trắng lạnh (cool office)
  const warmWindows = litWindowTransforms.filter((w) => w.warm);
  const coolWindows = litWindowTransforms.filter((w) => !w.warm);

  const warmWinMat = track(
    new THREE.MeshStandardMaterial({
      color: isDark ? 0xfef3c7 : 0xe0f2fe,
      emissive: isDark ? 0xf59e0b : 0xbae6fd,
      emissiveIntensity: isDark ? 0.65 : 0.35,
      roughness: 0.25,
    })
  );
  const coolWinMat = track(
    new THREE.MeshStandardMaterial({
      color: isDark ? 0xe0f2fe : 0xf8fafc,
      emissive: isDark ? 0x38bdf8 : 0x93c5fd,
      emissiveIntensity: isDark ? 0.5 : 0.28,
      roughness: 0.25,
    })
  );

  if (warmWindows.length > 0) {
    const warmInst = new THREE.InstancedMesh(
      unitBoxGeo,
      warmWinMat,
      warmWindows.length
    );
    warmWindows.forEach((w, idx) => {
      dummy.position.copy(w.pos);
      dummy.scale.copy(w.scale);
      dummy.rotation.set(0, w.rotY, 0);
      dummy.updateMatrix();
      warmInst.setMatrixAt(idx, dummy.matrix);
    });
    warmInst.instanceMatrix.needsUpdate = true;
    rootGroup.add(warmInst);
  }

  if (coolWindows.length > 0) {
    const coolInst = new THREE.InstancedMesh(
      unitBoxGeo,
      coolWinMat,
      coolWindows.length
    );
    coolWindows.forEach((w, idx) => {
      dummy.position.copy(w.pos);
      dummy.scale.copy(w.scale);
      dummy.rotation.set(0, w.rotY, 0);
      dummy.updateMatrix();
      coolInst.setMatrixAt(idx, dummy.matrix);
    });
    coolInst.instanceMatrix.needsUpdate = true;
    rootGroup.add(coolInst);
  }

  // =========================================================================
  // 4. DẢI ĐÈN CHỈ TẦNG TƯƠNG TÁC (TẦNG 1 – TẦNG 5) BAO QUANH THÁP CHÍNH
  // =========================================================================
  const floorHighlights: FloorHighlightRig[] = [];
  for (let floorNum = 1; floorNum <= 5; floorNum += 1) {
    const y = 0.9 + (floorNum - 0.5) * 1.35;
    const bandGeo = track(new THREE.BoxGeometry(4.55, 0.16, 4.15));
    const bandMat = track(
      new THREE.MeshStandardMaterial({
        color: floorNum === 5 ? 0x10b981 : 0x4f46e5,
        emissive: floorNum === 5 ? 0x10b981 : 0x4f46e5,
        emissiveIntensity: 0.12,
        transparent: true,
        opacity: 0.0,
      })
    );
    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    bandMesh.position.set(1.55, y, 1.35);
    rootGroup.add(bandMesh);
    floorHighlights.push({
      floorNumber: floorNum,
      baseY: y,
      bandMaterial: bandMat,
      bandMesh,
    });
  }

  // =========================================================================
  // 5. HẠT KHÔNG GIAN NHẸ PHÍA XA (CHỈ HIỂN THỊ RÕ TRONG DARK MODE)
  // =========================================================================
  const starCount = 90;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    starPos[i * 3] = (Math.random() - 0.5) * 34;
    starPos[i * 3 + 1] = 2 + Math.random() * 18;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 28;
  }
  const starGeo = track(new THREE.BufferGeometry());
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = track(
    new THREE.PointsMaterial({
      color: isDark ? 0x93c5fd : 0x64748b,
      size: isDark ? 0.08 : 0.04,
      transparent: true,
      opacity: isDark ? 0.42 : 0.14,
    })
  );
  const skyParticles = new THREE.Points(starGeo, starMat);
  rootGroup.add(skyParticles);

  // Đặt tòa nhà hơi lệch phải để chừa không gian cho nội dung chữ bên trái
  rootGroup.position.set(1.8, -3.2, 0);

  return {
    rootGroup,
    floorHighlights,
    skyParticles,
    disposables,
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<number>(scrollProgress);
  const chapterRef = useRef<number>(activeChapter);
  const floorPreviewRef = useRef<number | null>(selectedFloorPreview);
  const autoFlyRef = useRef<boolean>(isCinematicAutoFly);
  const pausedRef = useRef<boolean>(isPaused);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    chapterRef.current = activeChapter;
  }, [activeChapter]);

  useEffect(() => {
    floorPreviewRef.current = selectedFloorPreview;
  }, [selectedFloorPreview]);

  useEffect(() => {
    autoFlyRef.current = isCinematicAutoFly;
  }, [isCinematicAutoFly]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x051433 : 0xeaf1f8);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 140);
    camera.position.set(11.5, 6.2, 16.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.1 : 1.04;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Ánh sáng kiến trúc 3 điểm sắc nét — tương phản cao, không lóa
    const hemiLight = new THREE.HemisphereLight(
      isDark ? 0x93c5fd : 0xffffff,
      isDark ? 0x0b1629 : 0x94a3b8,
      isDark ? 0.95 : 1.15
    );
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(
      isDark ? 0xdbeafe : 0xfffbeb,
      isDark ? 1.9 : 2.1
    );
    sunLight.position.set(14, 22, 16);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 55;
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 16;
    sunLight.shadow.camera.bottom = -16;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, isDark ? 1.2 : 0.75);
    rimLight.position.set(-16, 10, -12);
    scene.add(rimLight);

    // Tạo môi trường phản chiếu Studio (PMREMGenerator) giúp mặt kính tòa nhà phản sáng như Ray-Tracing
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(isDark ? 0x0a1e44 : 0xdbeafe);
    const envSkyLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e3a8a, 2.2);
    envScene.add(envSkyLight);
    const envRenderTarget = pmremGenerator.fromScene(envScene, 0.04);
    scene.environment = envRenderTarget.texture;
    pmremGenerator.dispose();

    // Tải ảnh texture mặt dựng kính kiến trúc siêu nét (/assets/spotmatrix-facade-texture.jpg)
    const textureLoader = new THREE.TextureLoader();
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const facadeTexture = textureLoader.load('/assets/spotmatrix-facade-texture.jpg');
    facadeTexture.colorSpace = THREE.SRGBColorSpace;
    facadeTexture.wrapS = THREE.RepeatWrapping;
    facadeTexture.wrapT = THREE.RepeatWrapping;
    facadeTexture.repeat.set(1, 1);
    facadeTexture.anisotropy = Math.min(maxAnisotropy, 16);

    // Dựng mô hình 3 khối tháp kính có áp texture ảnh thật
    const rig = createSpotMatrixArchitectureModel(isDark, facadeTexture);
    scene.add(rig.rootGroup);

    // Đường bay camera điện ảnh xoay quanh 3 khối tháp kính
    const cinematicSpline = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(11.5, 5.5, 16.5),
        new THREE.Vector3(16.0, 8.8, 7.5),
        new THREE.Vector3(9.0, 12.2, -13.0),
        new THREE.Vector3(-12.0, 8.0, -9.5),
        new THREE.Vector3(-11.5, 4.8, 12.5),
        new THREE.Vector3(3.5, 4.2, 17.5),
      ],
      true
    );

    const pointerTarget = { x: 0, y: 0 };
    const pointerSmooth = { x: 0, y: 0 };
    const currentLookAt = new THREE.Vector3(1.5, 2.2, 0);
    const desiredCamPos = new THREE.Vector3();
    const desiredLookAt = new THREE.Vector3();

    const handlePointerMove = (e: MouseEvent) => {
      pointerTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    const handleResize = () => {
      if (!container) {
        return;
      }
      const nextW = container.clientWidth || window.innerWidth;
      const nextH = container.clientHeight || window.innerHeight;
      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
      renderer.setSize(nextW, nextH);
    };
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let lastTimeMs = performance.now();
    let elapsedSec = 0;
    let isTabHidden = document.hidden;

    const handleVisibilityChange = () => {
      isTabHidden = document.hidden;
      lastTimeMs = performance.now();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = (nowMs: number) => {
      rafId = window.requestAnimationFrame(animate);
      if (isTabHidden) {
        return;
      }

      const dt = Math.min((nowMs - lastTimeMs) / 1000, 0.05);
      lastTimeMs = nowMs;

      if (!pausedRef.current && !prefersReducedMotion) {
        elapsedSec += dt;
      }

      pointerSmooth.x += (pointerTarget.x - pointerSmooth.x) * 0.05;
      pointerSmooth.y += (pointerTarget.y - pointerSmooth.y) * 0.05;

      const selectedFl = floorPreviewRef.current;

      if (autoFlyRef.current && !selectedFl) {
        const splineT = (elapsedSec * 0.04) % 1;
        cinematicSpline.getPointAt(splineT, desiredCamPos);
        desiredLookAt.set(1.4, 2.4 + Math.sin(elapsedSec * 0.35) * 0.5, 0);
      } else if (selectedFl !== null) {
        const targetY = -3.2 + 0.9 + (selectedFl - 0.5) * 1.35;
        desiredCamPos.set(
          9.5 + pointerSmooth.x * 1.1,
          targetY + 2.2 - pointerSmooth.y * 0.6,
          12.2
        );
        desiredLookAt.set(2.2, targetY, 1.0);
      } else {
        const progress = scrollRef.current;
        const angle = -0.35 + progress * Math.PI * 0.85;
        const radius = 17.5 - Math.sin(progress * Math.PI) * 2.5;
        const camY = 5.4 + progress * 4.5 - pointerSmooth.y * 0.9;
        desiredCamPos.set(
          Math.sin(angle) * radius + pointerSmooth.x * 1.2 + 2.0,
          camY,
          Math.cos(angle) * radius
        );
        desiredLookAt.set(1.5, 2.0 + progress * 1.4, 0);
      }

      camera.position.lerp(desiredCamPos, 0.06);
      currentLookAt.lerp(desiredLookAt, 0.07);
      camera.lookAt(currentLookAt);

      // Xoay nhẹ toàn bộ cụm tòa nhà để tạo chiều sâu không gian
      if (!pausedRef.current && !prefersReducedMotion && !autoFlyRef.current) {
        rig.rootGroup.rotation.y =
          Math.sin(elapsedSec * 0.18) * 0.14 + scrollRef.current * 0.35;
      }

      // Highlight dải tầng đang chọn (Tầng 1–5)
      rig.floorHighlights.forEach((fh) => {
        const isHighlighted = selectedFl === fh.floorNumber;
        const targetOpacity = isHighlighted ? 0.88 : 0.0;
        fh.bandMaterial.opacity +=
          (targetOpacity - fh.bandMaterial.opacity) * 0.12;
        fh.bandMaterial.emissiveIntensity = isHighlighted ? 1.1 : 0.1;
      });

      rig.skyParticles.rotation.y = elapsedSec * 0.015;

      renderer.render(scene, camera);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      facadeTexture.dispose();
      envRenderTarget.dispose();
      rig.disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, [isDark]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none select-none"
      aria-hidden="true"
    />
  );
};