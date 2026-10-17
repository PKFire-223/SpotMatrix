import { WorkspaceNodeItem, SeatStatusType } from '../../../../Shared/Types/GlobalSystemTypes';
import {
  fallbackMemoryNodes,
  getMongoConnectionState,
} from '../../../../Shared/Database/MongoConnection';
import { SpaceNodeModel } from '../Models/SpaceNodeModel';

export async function fetchAllFloorplanNodes(): Promise<WorkspaceNodeItem[]> {
  if (getMongoConnectionState()) {
    const dbRecords = await SpaceNodeModel.find().lean();
    if (dbRecords.length > 0) {
      return dbRecords as unknown as WorkspaceNodeItem[];
    }
  }
  return fallbackMemoryNodes;
}

export async function updateWorkspaceNodeStatus(
  targetNodeId: string,
  nextStatus: SeatStatusType
): Promise<WorkspaceNodeItem | null> {
  const memoryItem = fallbackMemoryNodes.find((item) => item.nodeId === targetNodeId);
  if (memoryItem) {
    memoryItem.status = nextStatus;
  }
  if (getMongoConnectionState()) {
    await SpaceNodeModel.findOneAndUpdate({ nodeId: targetNodeId }, { status: nextStatus });
  }
  return memoryItem || null;
}
