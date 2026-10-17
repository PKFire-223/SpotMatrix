import mongoose from 'mongoose';
import { loadSystemEnvConfig } from '../Config/EnvConfig';
import { WorkspaceNodeItem } from '../Types/GlobalSystemTypes';

let isMongoConnectedState = false;

export const fallbackMemoryNodes: WorkspaceNodeItem[] = [
  {
    nodeId: 'NODE-A01',
    nodeCode: 'A-01',
    nodeLabel: 'Bàn Dev Dual-Monitor A01',
    zoneType: 'DESK_POD',
    floorLevel: 1,
    position2D: { posX: 90, posY: 110 },
    position3D: { coordX: -2.2, coordY: 0.4, coordZ: -1.2 },
    capacityCount: 1,
    status: 'AVAILABLE',
    amenitiesList: ['Màn hình 4K', 'Cổng Type-C 100W', 'Ghế Công thái học'],
    aiScore: 96,
  },
  {
    nodeId: 'NODE-A02',
    nodeCode: 'A-02',
    nodeLabel: 'Bàn Thiết kế Đồ họa A02',
    zoneType: 'DESK_POD',
    floorLevel: 1,
    position2D: { posX: 220, posY: 110 },
    position3D: { coordX: 0, coordY: 0.4, coordZ: -1.2 },
    capacityCount: 1,
    status: 'OCCUPIED',
    amenitiesList: ['Màn hình Chuẩn màu', 'Bảng vẽ Wacom'],
    aiScore: 78,
  },
  {
    nodeId: 'NODE-M01',
    nodeCode: 'M-01',
    nodeLabel: 'Phòng Họp Kính 3D Boardroom',
    zoneType: 'MEETING_ROOM',
    floorLevel: 1,
    position2D: { posX: 370, posY: 130 },
    position3D: { coordX: 2.2, coordY: 0.6, coordZ: -0.8 },
    capacityCount: 8,
    status: 'AVAILABLE',
    amenitiesList: ['Tivi 85 inch', 'Camera AI 360', 'Bảng trắng KTS'],
    aiScore: 92,
  },
  {
    nodeId: 'NODE-F01',
    nodeCode: 'F-01',
    nodeLabel: 'Silent Focus Booth F01',
    zoneType: 'FOCUS_BOOTH',
    floorLevel: 1,
    position2D: { posX: 140, posY: 250 },
    position3D: { coordX: -1.4, coordY: 0.5, coordZ: 1.4 },
    capacityCount: 1,
    status: 'RESERVED',
    amenitiesList: ['Cách âm 40dB', 'Đèn đổi nhiệt độ màu'],
    aiScore: 88,
  },
  {
    nodeId: 'NODE-C01',
    nodeCode: 'C-01',
    nodeLabel: 'Không gian Sáng tạo Collab Hub',
    zoneType: 'COLLAB_HUB',
    floorLevel: 1,
    position2D: { posX: 310, posY: 255 },
    position3D: { coordX: 1.5, coordY: 0.45, coordZ: 1.4 },
    capacityCount: 6,
    status: 'AVAILABLE',
    amenitiesList: ['Sofa Module', 'Máy chiếu Laser', 'Ổ cắm âm sàn'],
    aiScore: 94,
  },
];

export async function connectMongoDatabase(): Promise<boolean> {
  const envConfig = loadSystemEnvConfig();
  try {
    await mongoose.connect(envConfig.mongoUri, {
      serverSelectionTimeoutMS: 2500,
    });
    isMongoConnectedState = true;
    console.log('[MongoDB] Da ket noi thanh cong toi:', envConfig.mongoUri);
    return true;
  } catch (dbError) {
    isMongoConnectedState = false;
    if (envConfig.enableMemoryFallback) {
      console.warn(
        '[MongoDB Fallback] Khong tim thay MongoDB local. He thong tu dong kich hoat In-Memory Store de ban test ngay tren VS Code!'
      );
      return false;
    }
    throw dbError;
  }
}

export function getMongoConnectionState(): boolean {
  return isMongoConnectedState;
}
