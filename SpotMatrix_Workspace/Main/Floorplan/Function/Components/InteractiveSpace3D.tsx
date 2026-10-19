import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, Eye, UserCheck, Clock, Move3d } from 'lucide-react';
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
  const isSysAdmin = userRole === 'SYS_ADMIN';

  const orbitStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    theta: 0.42,
    phi: 0.88,
    radius: 20,
  });

  const resetCameraView = () => {
    orbitStateRef.current.theta = activeFloor === 5 ? 0.0 : 0.42;
    orbitStateRef.current.phi = activeFloor === 5 ? 0.82 : 0.88;
    orbitStateRef.current.radius = activeFloor === 5 ? 21.5 : 20;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 780;
    const height = 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x0b1120 : 0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    const updateCameraPosition = () => {
      const { theta, phi, radius } = orbitStateRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0.4, 0);
    };
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, isDark ? 0.78 : 0.95));
    const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 0.95 : 1.15);
    dirLight.position.set(14, 24, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const floorWidth = 18.6;
    const floorDepth = 12.4;
    const slabMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0xf8fafc,
      roughness: 0.65,
    });
    const floorSlab = new THREE.Mesh(
      new THREE.BoxGeometry(floorWidth, 0.36, floorDepth),
      slabMat
    );
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

    const outerWallMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x334155 : 0xcbd5e1,
      roughness: 0.5,
    });
    const backOuterWall = new THREE.Mesh(
      new THREE.BoxGeometry(floorWidth, 1.85, 0.18),
      outerWallMat
    );
    backOuterWall.position.set(0, 0.92, -floorDepth / 2);
    scene.add(backOuterWall);

    const leftOuterWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1.85, floorDepth),
      outerWallMat
    );
    leftOuterWall.position.set(-floorWidth / 2, 0.92, 0);
    scene.add(leftOuterWall);

    const rightOuterWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1.85, floorDepth),
      outerWallMat
    );
    rightOuterWall.position.set(floorWidth / 2, 0.92, 0);
    scene.add(rightOuterWall);

    const interactiveMeshes: THREE.Object3D[] = [];

    const getStatusHex = (status: WorkspaceNodeItem['status']) => {
      switch (status) {
        case 'AVAILABLE':
          return 0x0d9488;
        case 'HOLDING':
          return 0xd97706;
        case 'RESERVED':
          return 0x4f46e5;
        case 'OCCUPIED':
          return 0xe11d48;
        default:
          return 0x64748b;
      }
    };

    // Tựa lưng đặt tại z = -0.19 để mặt trước ghế luôn hướng về +Z
    const createChair3D = (colorHex: number) => {
      const chairGroup = new THREE.Group();
      const cushionMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35 });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.46), cushionMat);
      seat.position.y = 0.44;
      seat.castShadow = true;
      chairGroup.add(seat);

      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.09), cushionMat);
      backrest.position.set(0, 0.72, -0.19);
      backrest.castShadow = true;
      chairGroup.add(backrest);

      const armLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.36), frameMat);
      armLeft.position.set(-0.24, 0.56, 0.02);
      chairGroup.add(armLeft);

      const armRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.36), frameMat);
      armRight.position.set(0.24, 0.56, 0.02);
      chairGroup.add(armRight);

      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 0.42, 12),
        frameMat
      );
      pedestal.position.y = 0.21;
      chairGroup.add(pedestal);

      return chairGroup;
    };

    // Hàm xoay mặt trước của ghế (+Z) hướng thẳng vào tọa độ (targetX, targetZ)
    const orientChairTowardTarget = (
      chairObj: THREE.Object3D,
      chairX: number,
      chairZ: number,
      targetX: number,
      targetZ: number
    ) => {
      chairObj.rotation.y = Math.atan2(targetX - chairX, targetZ - chairZ);
    };

    if (activeFloor === 5) {
      const hallNode =
        workspaceNodes.find((n) => n.floorLevel === 5) ||
        workspaceNodes[workspaceNodes.length - 1];

      const aisleCarpet = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.03, 11.8),
        new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.8 })
      );
      aisleCarpet.position.set(0, 0.02, 0);
      scene.add(aisleCarpet);

      const stageCenterZ = -1.6;
      const stageCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(2.1, 2.25, 0.28, 48),
        new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3 })
      );
      stageCylinder.position.set(0, 0.14, stageCenterZ);
      stageCylinder.receiveShadow = true;
      scene.add(stageCylinder);

      const stageLedRing = new THREE.Mesh(
        new THREE.RingGeometry(2.05, 2.22, 48),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
      );
      stageLedRing.rotation.x = -Math.PI / 2;
      stageLedRing.position.set(0, 0.29, stageCenterZ);
      scene.add(stageLedRing);

      const lectern = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.85, 0.45),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
      );
      lectern.position.set(0, 0.7, stageCenterZ);
      lectern.castShadow = true;
      scene.add(lectern);

      const ledArcGeo = new THREE.CylinderGeometry(
        4.8,
        4.8,
        2.3,
        40,
        1,
        true,
        Math.PI * 0.72,
        Math.PI * 0.56
      );
      const ledArcMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: 0x2563eb,
        emissiveIntensity: 0.45,
        side: THREE.DoubleSide,
      });
      const ledScreen = new THREE.Mesh(ledArcGeo, ledArcMat);
      ledScreen.position.set(0, 1.35, stageCenterZ + 0.6);
      scene.add(ledScreen);

      const amphitheaterTiers = [
        { radius: 3.3, stepHeight: 0.16, count: 7, prefix: 'A' },
        { radius: 4.7, stepHeight: 0.42, count: 9, prefix: 'B' },
        { radius: 6.1, stepHeight: 0.68, count: 12, prefix: 'C' },
      ];

      const platformMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x334155 : 0xe2e8f0,
        roughness: 0.6,
      });

      amphitheaterTiers.forEach((tier) => {
        for (let i = 0; i < tier.count; i++) {
          const ratio = tier.count > 1 ? i / (tier.count - 1) : 0.5;
          const angle = -Math.PI * 0.38 + ratio * Math.PI * 0.76;
          const sx = Math.sin(angle) * tier.radius;
          const sz = stageCenterZ + Math.cos(angle) * tier.radius;
          const seatCode = `H01-${tier.prefix}${i + 1}`;

          const stepBlock = new THREE.Mesh(
            new THREE.BoxGeometry(0.95, tier.stepHeight, 0.95),
            platformMat
          );
          stepBlock.position.set(sx, tier.stepHeight / 2, sz);
          orientChairTowardTarget(stepBlock, sx, sz, 0, stageCenterZ);
          stepBlock.receiveShadow = true;
          scene.add(stepBlock);

          const isBooked =
            bookingsList.some((b) => b.nodeId === seatCode && b.bookingStatus !== 'CANCELLED') ||
            (tier.prefix === 'A' && i === 3) ||
            (tier.prefix === 'B' && i === 4);

          const chairColor = isBooked ? 0x4f46e5 : 0x0d9488;
          const chair3D = createChair3D(chairColor);
          chair3D.position.set(sx, tier.stepHeight, sz);
          // Quay mặt ghế hướng thẳng vào tâm Sân khấu Tròn (0, stageCenterZ)
          orientChairTowardTarget(chair3D, sx, sz, 0, stageCenterZ);

          if (hallNode) {
            chair3D.userData = {
              nodeItem: hallNode,
              seatLabel: `Ghế Hội trường ${seatCode} — Hàng ${tier.prefix} (${
                isBooked ? 'Đã đặt' : 'Còn trống'
              })`,
            };
            chair3D.traverse((c) => {
              c.userData = chair3D.userData;
            });
            interactiveMeshes.push(chair3D);
          }

          scene.add(chair3D);
        }
      });
    } else {
      const corridorRunner = new THREE.Mesh(
        new THREE.BoxGeometry(floorWidth - 0.6, 0.02, 1.85),
        new THREE.MeshStandardMaterial({
          color: isDark ? 0x0f172a : 0xe2e8f0,
          roughness: 0.8,
        })
      );
      corridorRunner.position.set(0, 0.015, 0);
      scene.add(corridorRunner);

      const interiorWallMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x475569 : 0xcbd5e1,
        roughness: 0.45,
      });
      const glassCorridorMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x38bdf8 : 0x64748b,
        transparent: true,
        opacity: 0.24,
        roughness: 0.15,
      });
      const doorWoodMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x6366f1 : 0x334155,
        roughness: 0.4,
      });

      [-3.1, 3.1].forEach((divX) => {
        const northDivider = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 1.65, 5.1),
          interiorWallMat
        );
        northDivider.position.set(divX, 0.82, -3.55);
        northDivider.castShadow = true;
        scene.add(northDivider);

        const southDivider = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 1.65, 5.1),
          interiorWallMat
        );
        southDivider.position.set(divX, 0.82, 3.55);
        southDivider.castShadow = true;
        scene.add(southDivider);
      });

      workspaceNodes.forEach((nodeItem, idx) => {
        const colIndex = idx % 3;
        const isNorthWing = idx < 3;

        const roomCenterX = (colIndex - 1) * 6.15;
        const roomCenterZ = isNorthWing ? -3.55 : 3.55;
        const corridorWallZ = isNorthWing ? -1.0 : 1.0;

        const statusColor = getStatusHex(nodeItem.status);
        const isSelected = nodeItem.nodeId === selectedNodeId;

        const roomGroup = new THREE.Group();
        roomGroup.position.set(roomCenterX, 0, roomCenterZ);

        const roomCarpet = new THREE.Mesh(
          new THREE.BoxGeometry(5.8, 0.03, 4.8),
          new THREE.MeshStandardMaterial({
            color: isSelected
              ? isDark
                ? 0x1e1b4b
                : 0xeef2ff
              : isDark
              ? 0x1e293b
              : 0xffffff,
            roughness: 0.5,
          })
        );
        roomCarpet.position.y = 0.02;
        roomGroup.add(roomCarpet);

        const localCorridorZ = corridorWallZ - roomCenterZ;
        const leftGlassPanel = new THREE.Mesh(
          new THREE.BoxGeometry(3.6, 1.65, 0.1),
          glassCorridorMat
        );
        leftGlassPanel.position.set(-1.1, 0.82, localCorridorZ);
        roomGroup.add(leftGlassPanel);

        const rightGlassPanel = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 1.65, 0.1),
          glassCorridorMat
        );
        rightGlassPanel.position.set(2.35, 0.82, localCorridorZ);
        roomGroup.add(rightGlassPanel);

        const doorLeaf = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 1.5, 0.07),
          doorWoodMat
        );
        doorLeaf.position.set(1.25, 0.75, localCorridorZ + (isNorthWing ? -0.25 : 0.25));
        doorLeaf.rotation.y = isNorthWing ? 0.55 : -0.55;
        roomGroup.add(doorLeaf);

        const tvWall = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.85, 1.65),
          new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            emissive: statusColor,
            emissiveIntensity: 0.4,
          })
        );
        tvWall.position.set(-2.75, 0.95, 0);
        roomGroup.add(tvWall);

        const seatCap = Math.max(2, nodeItem.capacityCount || 4);

        if (nodeItem.zoneType === 'COLLAB_HUB') {
          const tableRadius = seatCap >= 8 ? 1.25 : 1.0;
          const roundTable = new THREE.Mesh(
            new THREE.CylinderGeometry(tableRadius, tableRadius, 0.1, 32),
            new THREE.MeshStandardMaterial({
              color: isDark ? 0x334155 : 0xf1f5f9,
              roughness: 0.3,
            })
          );
          roundTable.position.y = 0.68;
          roundTable.castShadow = true;
          roomGroup.add(roundTable);

          const basePole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.4, 0.65, 20),
            new THREE.MeshStandardMaterial({ color: 0x475569 })
          );
          basePole.position.y = 0.32;
          roomGroup.add(basePole);

          const displayChairs = Math.min(10, seatCap);
          for (let c = 0; c < displayChairs; c++) {
            const ang = (c * Math.PI * 2) / displayChairs;
            const ch = createChair3D(statusColor);
            const chairDist = tableRadius + 0.48;
            const cx = Math.cos(ang) * chairDist;
            const cz = Math.sin(ang) * chairDist;
            ch.position.set(cx, 0, cz);
            // Quay mặt ghế hướng thẳng vào tâm bàn tròn (0, 0)
            orientChairTowardTarget(ch, cx, cz, 0, 0);
            roomGroup.add(ch);
          }
        } else {
          const sidePairs = Math.max(1, Math.floor((seatCap - 2) / 2));
          const tableLen = Math.min(3.6, Math.max(1.3, sidePairs * 0.78 + 0.6));
          const tableWid = seatCap <= 4 ? 0.95 : 1.2;

          const rectTable = new THREE.Mesh(
            new THREE.BoxGeometry(tableLen, 0.1, tableWid),
            new THREE.MeshStandardMaterial({
              color: isDark ? 0x334155 : 0xf8fafc,
              roughness: 0.3,
            })
          );
          rectTable.position.y = 0.68;
          rectTable.castShadow = true;
          roomGroup.add(rectTable);

          [-tableLen / 2 + 0.25, tableLen / 2 - 0.25].forEach((lx) => {
            const leg = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 0.65, tableWid - 0.3),
              new THREE.MeshStandardMaterial({ color: 0x475569 })
            );
            leg.position.set(lx, 0.32, 0);
            roomGroup.add(leg);
          });

          if (seatCap === 2) {
            const chTop = createChair3D(statusColor);
            chTop.position.set(0, 0, -0.78);
            orientChairTowardTarget(chTop, 0, -0.78, 0, 0);
            roomGroup.add(chTop);

            const chBot = createChair3D(statusColor);
            chBot.position.set(0, 0, 0.78);
            orientChairTowardTarget(chBot, 0, 0.78, 0, 0);
            roomGroup.add(chBot);
          } else {
            const headLeft = createChair3D(statusColor);
            headLeft.position.set(-tableLen / 2 - 0.42, 0, 0);
            orientChairTowardTarget(headLeft, -tableLen / 2 - 0.42, 0, 0, 0);
            roomGroup.add(headLeft);

            const headRight = createChair3D(statusColor);
            headRight.position.set(tableLen / 2 + 0.42, 0, 0);
            orientChairTowardTarget(headRight, tableLen / 2 + 0.42, 0, 0, 0);
            roomGroup.add(headRight);

            const pairsCount = Math.min(5, Math.ceil((seatCap - 2) / 2));
            for (let p = 0; p < pairsCount; p++) {
              const offsetRatio = pairsCount > 1 ? p / (pairsCount - 1) - 0.5 : 0;
              const gx = offsetRatio * (tableLen - 0.7);
              const zDist = tableWid / 2 + 0.38;

              const c1 = createChair3D(statusColor);
              c1.position.set(gx, 0, -zDist);
              orientChairTowardTarget(c1, gx, -zDist, gx, 0);
              roomGroup.add(c1);

              const c2 = createChair3D(statusColor);
              c2.position.set(gx, 0, zDist);
              orientChairTowardTarget(c2, gx, zDist, gx, 0);
              roomGroup.add(c2);
            }
          }
        }

        const statusOrb = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 16, 16),
          new THREE.MeshStandardMaterial({
            color: statusColor,
            emissive: statusColor,
            emissiveIntensity: 0.65,
          })
        );
        statusOrb.position.y = 1.75;
        roomGroup.add(statusOrb);

        roomGroup.userData = { nodeItem };
        roomGroup.traverse((child) => {
          child.userData = { nodeItem };
        });

        interactiveMeshes.push(roomGroup);
        scene.add(roomGroup);
      });
    }

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
          0.32,
          Math.min(1.4, orbitStateRef.current.phi - dy * 0.007)
        );
        updateCameraPosition();
        return;
      }

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
        Math.min(29, orbitStateRef.current.radius + e.deltaY * 0.01)
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-600 text-white shadow-sm">
            <Move3d className="w-3.5 h-3.5" />
            {activeFloor === 5
              ? 'Mô hình 3D Tầng 5 — Hội trường Đấu trường La Mã'
              : `Mô hình 3D 6 Phòng họp — Tầng ${activeFloor}`}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Giữ chuột trái xoay 360° • Click vào từng phòng để xem Slot trống
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Còn trống
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Giữ / Chờ duyệt
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

      <div className="relative w-full rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div ref={mountRef} className="w-full h-[450px] cursor-grab active:cursor-grabbing" />

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
              Sức chứa: <strong>{hoveredInfo.node.capacityCount} người</strong> • Trạng thái:{' '}
              <strong>{hoveredInfo.node.status}</strong>
            </p>

            {isSysAdmin && (
              <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1 text-[11px]">
                <p className="font-extrabold text-rose-500 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Thông tin Người đặt (Quyền ADMIN):
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
                      Giờ đặt:{' '}
                      <strong>
                        {hoveredBookingRecord
                          ? `${hoveredBookingRecord.startTimeIso} – ${hoveredBookingRecord.endTimeIso}`
                          : '10:00 – 12:00'}
                      </strong>
                    </p>
                  </>
                ) : (
                  <p className="text-teal-600 dark:text-teal-400 font-semibold">
                    ✓ Phòng hiện đang trống tất cả các ca.
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