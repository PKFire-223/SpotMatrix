import {
  WorkspaceNodeItem,
  SeatStatusType,
  WorkspaceZoneType,
} from '../../../../Shared/Types/GlobalSystemTypes';
import { getMongoConnectionState } from '../../../../Shared/Database/MongoConnection';
import { SpaceNodeModel } from '../Models/SpaceNodeModel';
import { recordAuditConcurrencyLog } from '../../../Datamanager/Function/Services/DatamanagerService';

export const initialFloorplanSeedNodes: WorkspaceNodeItem[] = [
  {
    nodeId: 'NODE-A01',
    nodeCode: 'A-01',
    nodeLabel: 'Bàn Lập trình Dual-4K A01',
    zoneType: 'DESK_POD',
    floorLevel: 1,
    position2D: { posX: 110, posY: 110 },
    position3D: { coordX: -2.2, coordY: 0.4, coordZ: -1.2 },
    capacityCount: 1,
    status: 'AVAILABLE',
    amenitiesList: ['Màn hình 4K', 'Cổng Type-C 100W', 'Ghế Công thái học'],
    aiScore: 96,
    lockVersion: 1,
  },
  {
    nodeId: 'NODE-A02',
    nodeCode: 'A-02',
    nodeLabel: 'Bàn Đồ họa Wacom A02',
    zoneType: 'DESK_POD',
    floorLevel: 1,
    position2D: { posX: 250, posY: 110 },
    position3D: { coordX: -0.8, coordY: 0.4, coordZ: -1.2 },
    capacityCount: 1,
    status: 'OCCUPIED',
    amenitiesList: ['Màn hình 4K', 'Bảng vẽ Wacom'],
    aiScore: 84,
    lockVersion: 2,
  },
  {
    nodeId: 'NODE-A03',
    nodeCode: 'A-03',
    nodeLabel: 'Bàn Tiêu chuẩn A03',
    zoneType: 'DESK_POD',
    floorLevel: 1,
    position2D: { posX: 390, posY: 110 },
    position3D: { coordX: 0.6, coordY: 0.4, coordZ: -1.2 },
    capacityCount: 1,
    status: 'HOLDING',
    amenitiesList: ['Cổng Type-C 100W', 'Ghế Công thái học'],
    aiScore: 91,
    lockVersion: 3,
  },
  {
    nodeId: 'NODE-M01',
    nodeCode: 'M-01',
    nodeLabel: 'Phòng Họp Boardroom M01',
    zoneType: 'MEETING_ROOM',
    floorLevel: 1,
    position2D: { posX: 560, posY: 125 },
    position3D: { coordX: 2.2, coordY: 0.6, coordZ: -0.8 },
    capacityCount: 8,
    status: 'AVAILABLE',
    amenitiesList: ['Máy chiếu Laser', 'Camera AI 360', 'Bảng trắng KTS'],
    aiScore: 95,
    lockVersion: 1,
  },
  {
    nodeId: 'NODE-F01',
    nodeCode: 'F-01',
    nodeLabel: 'Bốt Cách âm Focus F01',
    zoneType: 'FOCUS_BOOTH',
    floorLevel: 1,
    position2D: { posX: 140, posY: 270 },
    position3D: { coordX: -1.6, coordY: 0.5, coordZ: 1.4 },
    capacityCount: 1,
    status: 'RESERVED',
    amenitiesList: ['Cách âm 40dB', 'Đèn chống mỏi mắt'],
    aiScore: 89,
    lockVersion: 2,
  },
  {
    nodeId: 'NODE-C01',
    nodeCode: 'C-01',
    nodeLabel: 'Không gian Thảo luận Collab C01',
    zoneType: 'COLLAB_HUB',
    floorLevel: 1,
    position2D: { posX: 350, posY: 270 },
    position3D: { coordX: 0.8, coordY: 0.45, coordZ: 1.4 },
    capacityCount: 6,
    status: 'AVAILABLE',
    amenitiesList: ['Máy chiếu Laser', 'Màn hình 4K', 'Ổ cắm âm sàn'],
    aiScore: 94,
    lockVersion: 1,
  },
  {
    nodeId: 'NODE-B01',
    nodeCode: 'B-01',
    nodeLabel: 'Bàn Nghiên cứu AI B01 (Tầng 2)',
    zoneType: 'DESK_POD',
    floorLevel: 2,
    position2D: { posX: 160, posY: 130 },
    position3D: { coordX: -1.5, coordY: 1.4, coordZ: -0.9 },
    capacityCount: 2,
    status: 'AVAILABLE',
    amenitiesList: ['Màn hình 4K', 'Bảng vẽ Wacom', 'Cổng Type-C 100W'],
    aiScore: 97,
    lockVersion: 1,
  },
  {
    nodeId: 'NODE-M02',
    nodeCode: 'M-02',
    nodeLabel: 'Phòng Hội thảo Chiến lược M02 (Tầng 2)',
    zoneType: 'MEETING_ROOM',
    floorLevel: 2,
    position2D: { posX: 430, posY: 210 },
    position3D: { coordX: 1.4, coordY: 1.6, coordZ: 0.6 },
    capacityCount: 12,
    status: 'MAINTENANCE',
    amenitiesList: ['Máy chiếu Laser', 'Camera AI 360', 'Cách âm 40dB'],
    aiScore: 82,
    lockVersion: 1,
  },
];

const memoryNodesStore: WorkspaceNodeItem[] = [...initialFloorplanSeedNodes];

export async function fetchAllFloorplanNodes(): Promise<WorkspaceNodeItem[]> {
  if (getMongoConnectionState()) {
    const existingCount = await SpaceNodeModel.countDocuments();
    if (existingCount === 0) {
      await SpaceNodeModel.insertMany(initialFloorplanSeedNodes);
    }
    const dbRecords = await SpaceNodeModel.find().sort({ floorLevel: 1, nodeCode: 1 }).lean();
    if (dbRecords.length > 0) {
      return dbRecords as unknown as WorkspaceNodeItem[];
    }
  }
  return memoryNodesStore;
}

export async function updateWorkspaceNodeStatus(
  targetNodeId: string,
  nextStatus: SeatStatusType,
  actorEmail = 'sysadmin@spotmatrix.vn'
): Promise<WorkspaceNodeItem | null> {
  const memItem = memoryNodesStore.find((item) => item.nodeId === targetNodeId);
  if (memItem) {
    memItem.status = nextStatus;
    memItem.lockVersion = (memItem.lockVersion || 1) + 1;
  }

  let updatedDoc: WorkspaceNodeItem | null = memItem || null;
  if (getMongoConnectionState()) {
    const mongoRes = await SpaceNodeModel.findOneAndUpdate(
      { nodeId: targetNodeId },
      { $set: { status: nextStatus }, $inc: { lockVersion: 1 } },
      { new: true }
    ).lean();
    if (mongoRes) {
      updatedDoc = mongoRes as unknown as WorkspaceNodeItem;
    }
  }

  await recordAuditConcurrencyLog({
    eventCategory: 'FLOORPLAN_COORD_UPDATED',
    actorEmail,
    targetNodeId,
    outcomeStatus: 'SUCCESS',
    detailMessage: `Cập nhật trạng thái vị trí ${targetNodeId} sang [${nextStatus}].`,
  });

  return updatedDoc;
}

export async function updateWorkspaceNodeCoordinates(
  targetNodeId: string,
  posX: number,
  posY: number,
  actorEmail = 'Systemadmin123'
): Promise<WorkspaceNodeItem | null> {
  const clampedX = Math.max(50, Math.min(670, Math.round(posX)));
  const clampedY = Math.max(60, Math.min(350, Math.round(posY)));

  const memItem = memoryNodesStore.find((item) => item.nodeId === targetNodeId);
  if (memItem) {
    memItem.position2D = { posX: clampedX, posY: clampedY };
    memItem.lockVersion = (memItem.lockVersion || 1) + 1;
  }

  let updatedDoc: WorkspaceNodeItem | null = memItem || null;
  if (getMongoConnectionState()) {
    const mongoRes = await SpaceNodeModel.findOneAndUpdate(
      { nodeId: targetNodeId },
      {
        $set: { 'position2D.posX': clampedX, 'position2D.posY': clampedY },
        $inc: { lockVersion: 1 },
      },
      { new: true }
    ).lean();
    if (mongoRes) {
      updatedDoc = mongoRes as unknown as WorkspaceNodeItem;
    }
  }

  await recordAuditConcurrencyLog({
    eventCategory: 'FLOORPLAN_COORD_UPDATED',
    actorEmail,
    targetNodeId,
    outcomeStatus: 'SUCCESS',
    detailMessage: `Admin [${actorEmail}] đã kéo thả tọa độ vị trí ${targetNodeId} tới (X=${clampedX}, Y=${clampedY}).`,
  });

  return updatedDoc;
}

export async function createNewWorkspaceNode(
  payload: {
    nodeCode: string;
    nodeLabel: string;
    zoneType: WorkspaceZoneType;
    floorLevel: number;
    capacityCount: number;
    posX: number;
    posY: number;
    amenitiesList: string[];
  },
  actorEmail = 'Systemadmin123'
): Promise<WorkspaceNodeItem> {
  const cleanCode = payload.nodeCode.trim().toUpperCase();
  const newNode: WorkspaceNodeItem = {
    nodeId: `NODE-${cleanCode.replace(/[^A-Z0-9]/g, '')}-${Date.now().toString().slice(-3)}`,
    nodeCode: cleanCode,
    nodeLabel: payload.nodeLabel.trim(),
    zoneType: payload.zoneType,
    floorLevel: Number(payload.floorLevel || 1),
    position2D: {
      posX: Number(payload.posX || 200),
      posY: Number(payload.posY || 180),
    },
    position3D: { coordX: 0, coordY: 0.4, coordZ: 0 },
    capacityCount: Number(payload.capacityCount || 1),
    status: 'AVAILABLE',
    amenitiesList:
      payload.amenitiesList.length > 0 ? payload.amenitiesList : ['Màn hình 4K', 'Cổng Type-C 100W'],
    aiScore: 93,
    lockVersion: 1,
  };

  memoryNodesStore.push(newNode);
  if (getMongoConnectionState()) {
    await SpaceNodeModel.create(newNode);
  }

  await recordAuditConcurrencyLog({
    eventCategory: 'FLOORPLAN_COORD_UPDATED',
    actorEmail,
    targetNodeId: newNode.nodeId,
    outcomeStatus: 'SUCCESS',
    detailMessage: `Admin [${actorEmail}] đã thêm mới vị trí ${newNode.nodeCode} (${newNode.nodeLabel}) tại Tầng ${newNode.floorLevel}.`,
  });

  return newNode;
}