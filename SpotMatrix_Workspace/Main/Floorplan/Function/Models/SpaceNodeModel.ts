import mongoose, { Schema } from 'mongoose';
import { WorkspaceNodeItem } from '../../../../Shared/Types/GlobalSystemTypes';

const spaceNodeSchema = new Schema<WorkspaceNodeItem>(
  {
    nodeId: { type: String, required: true, unique: true },
    nodeCode: { type: String, required: true },
    nodeLabel: { type: String, required: true },
    zoneType: {
      type: String,
      enum: ['DESK_POD', 'MEETING_ROOM', 'FOCUS_BOOTH', 'COLLAB_HUB'],
      required: true,
    },
    floorLevel: { type: Number, default: 1 },
    position2D: {
      posX: { type: Number, required: true },
      posY: { type: Number, required: true },
    },
    position3D: {
      coordX: { type: Number, required: true },
      coordY: { type: Number, required: true },
      coordZ: { type: Number, required: true },
    },
    capacityCount: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'HOLDING', 'MAINTENANCE'],
      default: 'AVAILABLE',
    },
    amenitiesList: [{ type: String }],
    aiScore: { type: Number, default: 90 },
    lockVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const SpaceNodeModel =
  mongoose.models.SpaceNode ||
  mongoose.model<WorkspaceNodeItem>('SpaceNode', spaceNodeSchema);