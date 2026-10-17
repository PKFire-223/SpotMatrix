export type WorkspaceZoneType = 'DESK_POD' | 'MEETING_ROOM' | 'FOCUS_BOOTH' | 'COLLAB_HUB';

export type SeatStatusType = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export interface WorkspaceNodeItem {
  nodeId: string;
  nodeCode: string;
  nodeLabel: string;
  zoneType: WorkspaceZoneType;
  floorLevel: number;
  position2D: { posX: number; posY: number };
  position3D: { coordX: number; coordY: number; coordZ: number };
  capacityCount: number;
  status: SeatStatusType;
  amenitiesList: string[];
  aiScore?: number;
}

export interface BookingPayloadItem {
  bookingId: string;
  nodeId: string;
  userEmail: string;
  startTimeIso: string;
  endTimeIso: string;
  purposeNote: string;
  bookingStatus: 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';
}
