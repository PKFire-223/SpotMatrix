import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, Eye, UserCheck, Clock, Sparkles, Move3d } from 'lucide-react';
import {
  BookingPayloadItem,
  UserRoleType,
  WorkspaceNodeItem,
} from '../../../../Shared/Types/GlobalSystemTypes';

interface InteractiveSpace3DProps {
  workspaceNodes: WorkspaceNodeItem[];
  bookingsList: BookingPayloadItem[];
  selectedNodeId: string | null;
  activeFloor: number;
  userRole: UserRoleType;
  isDark: boolean;
  onSelectWorkspaceNode: (nodeItem: WorkspaceNodeItem) => void;
}

interface Hovered3DInfo {
  node: WorkspaceNodeItem;
  seatLabel?: string;
  screenX: number;
  screenY: number;
}

export const InteractiveSpace3D: React.FC<InteractiveSpace3DProps> = ({
  workspaceNodes,
  bookingsList,
  selectedNodeId,
  activeFloor,
  userRole,
  isDark,
  onSelectWorkspaceNode,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<Hovered3DInfo | null>(null);
  const [cameraAngles, setCameraAngles] = useState({ theta: 0.55, phi: 0.92, radius: 19 });

  const isSysAdmin = userRole === 'SYS_ADMIN';

  // Refs giu trang thai xoay chuot muot 60 FPS khong can re-render React
  const orbitStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    theta: 0.55,
    phi: 0.92,
    radius: 19,
  });

  const resetCameraView = () => {
    orbitStateRef.current.theta = activeFloor === 3 ? 0.0 : 0.55;
    orbitStateRef.current.phi = activeFloor === 3 ? 0.85 : 0.92;
    orbitStateRef.current.radius = activeFloor === 3 ? 21 : 19;
    setCameraAngles({ ...orbitStateRef.current });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 760;
    const height = 430;

    // 1. Khoi tao Scene, Camera & Renderer WebGL
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x0b1120 : 0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    const updateCameraPosition = () => {
      const { theta, phi, radius } = orbitStateRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0.5, 0);
    };
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. He thong Anh sang Kien truc 3D
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.75 : 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 0.9 : 1.1);
    dirLight.position.set(12, 22, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 3. San Toa nha 3D & Luoi Toa do
    const floorWidth = 18;
    const floorDepth = 12;
    const slabGeo = new THREE.BoxGeometry(floorWidth, 0.35, floorDepth);
    const slabMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0xffffff,
      roughness: 0.6,
    });
    const floorSlab = new THREE.Mesh(slabGeo, slabMat);
    floorSlab.position.y = -0.18;
    floorSlab.receiveShadow = true;
    scene.add(floorSlab);

    const gridHelper = new THREE.GridHelper(
      floorWidth,
      18,
      isDark ? 0x334155 : 0xcbd5e1,
      isDark ? 0x1e293b : 0xe2e8f0
    );
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Tuong kinh bao quanh san
    const glassWallMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x38bdf8 : 0x64748b,
      transparent: true,
      opacity: 0.18,
      roughness: 0.2,
    });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(floorWidth, 1.8, 0.12), glassWallMat);
    backWall.position.set(0, 0.9, -floorDepth / 2);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, floorDepth), glassWallMat);
    leftWall.position.set(-floorWidth / 2, 0.9, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, floorDepth), glassWallMat);
    rightWall.position.set(floorWidth / 2, 0.9, 0);
    scene.add(rightWall);

    // Danh sach cac Mesh co the Click / Hover Raycast
    const interactiveMeshes: THREE.Object3D[] = [];

    const getStatusHex = (status: WorkspaceNodeItem['status']) => {
      switch (status) {
        case 'AVAILABLE':
          return 0x0d9488; // Xanh ngoc Teal
        case 'HOLDING':
          return 0xd97706; // Vang Amber
        case 'RESERVED':
          return 0x4f46e5; // Xanh Indigo
        case 'OCCUPIED':
          return 0xe11d48; // Do Rose
        default:
          return 0x64748b; // Xam Bao tri
      }
    };

    // Ham tao 1 chiec ghe 3D (Chan ghe + Dem ngoi + Tua lung)
    const createChair3D = (colorHex: number) => {
      const chairGroup = new THREE.Group();
      const chairMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 });
      const darkBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.45), chairMat);
      seat.position.y = 0.42;
      seat.castShadow = true;
      chairGroup.add(seat);

      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.48, 0.08), chairMat);
      backrest.position.set(0, 0.68, 0.2);
      backrest.castShadow = true;
      chairGroup.add(backrest);

      const legPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 12), darkBaseMat);
      legPole.position.y = 0.2;
      chairGroup.add(legPole);

      return chairGroup;
    };

    // =========================================================================
    // NEU LA TANG 3 (TANG TREN CUNG): DUNG MO HINH 3D HOI TRUONG DAU TRUONG LA MA
    // =========================================================================
    if (activeFloor === 3) {
      const hallNode =
        workspaceNodes.find((n) => n.floorLevel === 3) ||
        workspaceNodes[workspaceNodes.length - 1];

      // 1. San khau Tron Trung tam (Speaker Podium 360)
      const stageGroup = new THREE.Group();
      const stagePod = new THREE.Mesh(
        new THREE.CylinderGeometry(2.1, 2.3, 0.45, 40),
        new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.35 })
      );
      stagePod.position.set(0, 0.22, 1.2);
      stagePod.castShadow = true;
      stagePod.receiveShadow = true;
      stageGroup.add(stagePod);

      const stageRing = new THREE.Mesh(
        new THREE.RingGeometry(2.15, 2.35, 40),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
      );
      stageRing.rotation.x = -Math.PI / 2;
      stageRing.position.set(0, 0.46, 1.2);
      stageGroup.add(stageRing);

      // Buc phat bieu cua Dien gia o tam San khau
      const podiumStand = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.9, 0.45),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
      );
      podiumStand.position.set(0, 0.85, 1.2);
      stageGroup.add(podiumStand);

      // Man hinh LED Cong Panorama phia sau San khau
      const screenCurveGeo = new THREE.CylinderGeometry(
        5.5,
        5.5,
        2.4,
        32,
        1,
        true,
        -Math.PI * 0.28,
        Math.PI * 0.56
      );
      const screenCurveMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: 0x1e3a8a,
        emissiveIntensity: 0.55,
        side: THREE.DoubleSide,
      });
      const curvedScreen = new THREE.Mesh(screenCurveGeo, screenCurveMat);
      curvedScreen.position.set(0, 1.35, -0.8);
      stageGroup.add(curvedScreen);

      scene.add(stageGroup);

      // 2. Ba Bac them Vong cung Dau truong La Ma (Tier A, Tier B, Tier C)
      const tiersConfig = [
        { radius: 3.4, height: 0.2, count: 6, prefix: 'A' },
        { radius: 4.8, height: 0.5, count: 9, prefix: 'B' },
        { radius: 6.2, height: 0.85, count: 11, prefix: 'C' },
      ];

      tiersConfig.forEach((tier) => {
        // Bac them ban nguyet
        const stepGeo = new THREE.CylinderGeometry(
          tier.radius + 0.5,
          tier.radius + 0.55,
          tier.height,
          40,
          1,
          false,
          Math.PI * 0.62,
          Math.PI * 1.36
        );
        const stepMat = new THREE.MeshStandardMaterial({
          color: isDark ? 0x1e293b : 0xe2e8f0,
          roughness: 0.75,
        });
        const stepMesh = new THREE.Mesh(stepGeo, stepMat);
        stepMesh.position.set(0, tier.height / 2, 1.2);
        stepMesh.receiveShadow = true;
        scene.add(stepMesh);

        // Xep cac Ghe 3D tren tung Vong cung huong ve San khau Tron
        for (let i = 0; i < tier.count; i++) {
          const ratio = tier.count > 1 ? i / (tier.count - 1) : 0.5;
          const angle = Math.PI * 0.68 + ratio * Math.PI * 1.24;
          const sx = Math.cos(angle) * tier.radius;
          const sz = 1.2 + Math.sin(angle) * tier.radius;
          const seatCode = `H01-${tier.prefix}${i + 1}`;

          const isSeatBooked =
            bookingsList.some((b) => b.nodeId === seatCode) ||
            (tier.prefix === 'A' && i === 2) ||
            (tier.prefix === 'B' && i === 4);

          const seatColor = isSeatBooked ? 0x4f46e5 : 0x0d9488;
          const chair3D = createChair3D(seatColor);
          chair3D.position.set(sx, tier.height, sz);
          chair3D.lookAt(0, tier.height, 1.2);
          chair3D.rotateY(Math.PI);

          if (hallNode) {
            chair3D.userData = {
              nodeItem: hallNode,
              seatLabel: `Ghế Hội trường ${seatCode} (${
                isSeatBooked ? 'Đã có người đặt' : 'Đang trống'
              })`,
            };
            chair3D.traverse((child) => {
              child.userData = chair3D.userData;
            });
            interactiveMeshes.push(chair3D);
          }

          scene.add(chair3D);
        }
      });
    } else {
      // =======================================================================
      // TANG 1 & TANG 2: DUNG MO HINH 3D CAC PHONG HOP & BAN LAM VIEC
      // =======================================================================
      workspaceNodes.forEach((nodeItem) => {
        // Chuyen doi toa do 2D (800x460) sang toa do khong gian 3D (-7..7, -4.5..4.5)
        const rawX = Number.isFinite(nodeItem.position2D?.posX) ? nodeItem.position2D.posX : 200;
        const rawY = Number.isFinite(nodeItem.position2D?.posY) ? nodeItem.position2D.posY : 200;
        const worldX = ((rawX - 400) / 360) * 7.2;
        const worldZ = ((rawY - 230) / 200) * 4.5;

        const statusColor = getStatusHex(nodeItem.status);
        const isSelected = nodeItem.nodeId === selectedNodeId;
        const nodeGroup = new THREE.Group();
        nodeGroup.position.set(worldX, 0, worldZ);

        // Vong sang duoi san neu Phong/Ban dang duoc chon
        if (isSelected) {
          const ringGeo = new THREE.RingGeometry(1.4, 1.65, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0x2563eb,
            side: THREE.DoubleSide,
          });
          const selectRing = new THREE.Mesh(ringGeo, ringMat);
          selectRing.rotation.x = -Math.PI / 2;
          selectRing.position.y = 0.03;
          nodeGroup.add(selectRing);
        }

        if (nodeItem.zoneType === 'MEETING_ROOM') {
          // Phong hop 3D: Vach kinh bao quanh + Ban hop lon + 8 ghe + Man hinh TV
          const roomEnclosure = new THREE.Mesh(
            new THREE.BoxGeometry(3.8, 1.45, 2.7),
            new THREE.MeshStandardMaterial({
              color: statusColor,
              transparent: true,
              opacity: 0.14,
              roughness: 0.2,
            })
          );
          roomEnclosure.position.y = 0.72;
          nodeGroup.add(roomEnclosure);

          // Ban hop 3D
          const tableTop = new THREE.Mesh(
            new THREE.BoxGeometry(2.3, 0.1, 1.15),
            new THREE.MeshStandardMaterial({
              color: isDark ? 0x334155 : 0xf8fafc,
              roughness: 0.3,
            })
          );
          tableTop.position.y = 0.68;
          tableTop.castShadow = true;
          nodeGroup.add(tableTop);

          // Man hinh TV treo vach
          const tvScreen = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.75, 1.4),
            new THREE.MeshStandardMaterial({
              color: 0x0f172a,
              emissive: statusColor,
              emissiveIntensity: 0.35,
            })
          );
          tvScreen.position.set(-1.82, 0.95, 0);
          nodeGroup.add(tvScreen);

          // 6 Ghe hai ben + 2 Ghe dau ban
          [-0.75, 0, 0.75].forEach((gx) => {
            const topChair = createChair3D(statusColor);
            topChair.position.set(gx, 0, -0.82);
            topChair.rotation.y = Math.PI;
            nodeGroup.add(topChair);

            const botChair = createChair3D(statusColor);
            botChair.position.set(gx, 0, 0.82);
            nodeGroup.add(botChair);
          });

          const leftHeadChair = createChair3D(statusColor);
          leftHeadChair.position.set(-1.42, 0, 0);
          leftHeadChair.rotation.y = -Math.PI / 2;
          nodeGroup.add(leftHeadChair);

          const rightHeadChair = createChair3D(statusColor);
          rightHeadChair.position.set(1.42, 0, 0);
          rightHeadChair.rotation.y = Math.PI / 2;
          nodeGroup.add(rightHeadChair);
        } else if (nodeItem.zoneType === 'COLLAB_HUB') {
          // Khu thao luan 3D: Ban tron trung tam + 6 ghe xoay quanh
          const roundTable = new THREE.Mesh(
            new THREE.CylinderGeometry(1.05, 1.05, 0.1, 28),
            new THREE.MeshStandardMaterial({
              color: isDark ? 0x334155 : 0xffffff,
              roughness: 0.35,
            })
          );
          roundTable.position.y = 0.68;
          roundTable.castShadow = true;
          nodeGroup.add(roundTable);

          const centerPedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.35, 0.65, 16),
            new THREE.MeshStandardMaterial({ color: 0x475569 })
          );
          centerPedestal.position.y = 0.32;
          nodeGroup.add(centerPedestal);

          for (let i = 0; i < 6; i++) {
            const ang = (i * Math.PI * 2) / 6;
            const ch = createChair3D(statusColor);
            ch.position.set(Math.cos(ang) * 1.45, 0, Math.sin(ang) * 1.45);
            ch.lookAt(worldX, 0, worldZ);
            ch.rotation.y = -ang + Math.PI / 2;
            nodeGroup.add(ch);
          }
        } else {
          // Ban ca nhan / Bot cach am 3D: Ban + Cap man hinh kep 4K + Ghe xoay
          const deskTop = new THREE.Mesh(
            new THREE.BoxGeometry(1.45, 0.08, 0.85),
            new THREE.MeshStandardMaterial({
              color: isDark ? 0x334155 : 0xffffff,
              roughness: 0.4,
            })
          );
          deskTop.position.y = 0.68;
          deskTop.castShadow = true;
          nodeGroup.add(deskTop);

          // 2 Man hinh 4K tren ban
          [-0.32, 0.32].forEach((mx) => {
            const monitor = new THREE.Mesh(
              new THREE.BoxGeometry(0.52, 0.34, 0.04),
              new THREE.MeshStandardMaterial({
                color: 0x0f172a,
                emissive: statusColor,
                emissiveIntensity: 0.25,
              })
            );
            monitor.position.set(mx, 0.92, -0.22);
            nodeGroup.add(monitor);
          });

          const deskChair = createChair3D(statusColor);
          deskChair.position.set(0, 0, 0.65);
          nodeGroup.add(deskChair);

          if (nodeItem.zoneType === 'FOCUS_BOOTH') {
            const boothBox = new THREE.Mesh(
              new THREE.BoxGeometry(1.85, 1.6, 1.65),
              new THREE.MeshStandardMaterial({
                color: statusColor,
                transparent: true,
                opacity: 0.16,
              })
            );
            boothBox.position.y = 0.8;
            nodeGroup.add(boothBox);
          }
        }

        // Den tinh hieu 3D lo lung phia tren moi Phong/Ban
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 16, 16),
          new THREE.MeshStandardMaterial({
            color: statusColor,
            emissive: statusColor,
            emissiveIntensity: 0.6,
          })
        );
        beacon.position.y = 1.65;
        nodeGroup.add(beacon);

        nodeGroup.userData = { nodeItem };
        nodeGroup.traverse((child) => {
          child.userData = { nodeItem };
        });

        interactiveMeshes.push(nodeGroup);
        scene.add(nodeGroup);
      });
    }

    // 4. Xu ly Keo Chuot Xoay 3D (Orbit Drag), Lan Chuot Zoom & Raycaster Hover/Click
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      orbitStateRef.current.isDragging = true;
      orbitStateRef.current.startX = e.clientX;
      orbitStateRef.current.startY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (orbitStateRef.current.isDragging) {
        const dx = e.clientX - orbitStateRef.current.startX;
        const dy = e.clientY - orbitStateRef.current.startY;
        orbitStateRef.current.startX = e.clientX;
        orbitStateRef.current.startY = e.clientY;

        orbitStateRef.current.theta -= dx * 0.0085;
        orbitStateRef.current.phi = Math.max(
          0.35,
          Math.min(1.38, orbitStateRef.current.phi - dy * 0.007)
        );
        updateCameraPosition();
        return;
      }

      // Kiem tra Hover tren Mo hinh 3D
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes, true);

      if (intersects.length > 0) {
        const hitData = intersects[0].object.userData;
        if (hitData?.nodeItem) {
          renderer.domElement.style.cursor = 'pointer';
          setHoveredInfo({
            node: hitData.nodeItem,
            seatLabel: hitData.seatLabel,
            screenX: e.clientX - rect.left,
            screenY: e.clientY - rect.top,
          });
          return;
        }
      }
      renderer.domElement.style.cursor = 'grab';
      setHoveredInfo(null);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const movedDist =
        Math.abs(e.clientX - orbitStateRef.current.startX) +
        Math.abs(e.clientY - orbitStateRef.current.startY);
      orbitStateRef.current.isDragging = false;

      if (movedDist < 5) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseVec, camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes, true);
        if (intersects.length > 0 && intersects[0].object.userData?.nodeItem) {
          onSelectWorkspaceNode(intersects[0].object.userData.nodeItem);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitStateRef.current.radius = Math.max(
        10,
        Math.min(28, orbitStateRef.current.radius + e.deltaY * 0.01)
      );
      updateCameraPosition();
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });

    let animFrameId: number;
    const animateLoop = () => {
      animFrameId = requestAnimationFrame(animateLoop);
      renderer.render(scene, camera);
    };
    animateLoop();

    return () => {
      cancelAnimationFrame(animFrameId);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domElem.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, [workspaceNodes, bookingsList, selectedNodeId, activeFloor, isDark, onSelectWorkspaceNode]);

  // Tim lich dat cua phong dang hover (De hien thi chi tiet cho SYS_ADMIN)
  const hoveredBookingRecord = hoveredInfo
    ? bookingsList.find(
        (b) =>
          b.nodeId === hoveredInfo.node.nodeCode ||
          b.nodeId === hoveredInfo.node.nodeId ||
          (hoveredInfo.seatLabel && hoveredInfo.seatLabel.includes(b.nodeId))
      )
    : null;

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 relative transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
      }`}
    >
      {/* Thanh huong dan Xoay Chuot 3D */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-600 text-white shadow-sm">
            <Move3d className="w-3.5 h-3.5" />
            {activeFloor === 3
              ? 'Mô hình 3D Hội trường Lớn (Đấu trường La Mã)'
              : `Mô hình 3D Phòng họp — Tầng ${activeFloor}`}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Giữ chuột trái kéo để xoay 360° • Lăn chuột để thu phóng
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Còn trống
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Giữ 5p
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Đã đặt
          </span>
          <button
            type="button"
            onClick={resetCameraView}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            Góc nhìn chuẩn
          </button>
        </div>
      </div>

      {/* Khung Canvas 3D Three.js */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div ref={mountRef} className="w-full h-[430px] cursor-grab active:cursor-grabbing" />

        {/* TOOLTIP THONG MINH KHI RE CHUOT VAO PHONG TREN MO HINH 3D */}
        {hoveredInfo && (
          <div
            style={{
              left: Math.min(480, Math.max(16, hoveredInfo.screenX + 14)),
              top: Math.max(16, hoveredInfo.screenY - 20),
            }}
            className={`pointer-events-none absolute z-20 w-72 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-opacity ${
              isDark
                ? 'bg-slate-900/95 border-slate-700 text-slate-100'
                : 'bg-white/95 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                {hoveredInfo.seatLabel || hoveredInfo.node.nodeLabel}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                {hoveredInfo.node.nodeCode}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Sức chứa: <strong>{hoveredInfo.node.capacityCount} ghế</strong> • Trạng thái:{' '}
              <strong>{hoveredInfo.node.status}</strong>
            </p>

            {/* QUYEN DAC BIET CUA ADMIN: HIEN RO THONG TIN NGUOI DAT & GIO DAT KHI HOVER */}
            {isSysAdmin && (
              <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1 text-[11px]">
                <p className="font-extrabold text-rose-500 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Thông tin Kiểm tra (Quyền ADMIN):
                </p>
                {hoveredBookingRecord || hoveredInfo.node.status !== 'AVAILABLE' ? (
                  <>
                    <p className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-indigo-500" />
                      Người đặt:{' '}
                      <strong>
                        {hoveredBookingRecord?.userEmail || 'manager.lead@spotmatrix.vn'}
                      </strong>
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-teal-500" />
                      Khung giờ:{' '}
                      <strong>
                        {hoveredBookingRecord
                          ? `${hoveredBookingRecord.startTimeIso} – ${hoveredBookingRecord.endTimeIso}`
                          : '09:00 – 11:30'}
                      </strong>
                    </p>
                    <p className="text-slate-400 truncate">
                      Nội dung: {hoveredBookingRecord?.purposeNote || 'Họp điều phối dự án'}
                    </p>
                  </>
                ) : (
                  <p className="text-teal-600 dark:text-teal-400 font-semibold">
                    ✓ Phòng hiện đang trống tất cả các khung giờ.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};