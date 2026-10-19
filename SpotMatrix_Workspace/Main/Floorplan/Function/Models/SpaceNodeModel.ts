import mongoose, { Schema } from 'mongoose';
import { WorkspaceNodeItem } from '../../../../Shared/Types/GlobalSystemTypes';

const spaceNodeSchema = new Schema<WorkspaceNodeItem>(
  {
    nodeId: { type: String, required: true, unique: true, index: true },
    nodeCode: { type: String, required: true, trim: true },
    nodeLabel: { type: String, required: true, trim: true },
    zoneType: {
      type: String,
      enum: ['DESK_POD', 'MEETING_ROOM', 'FOCUS_BOOTH', 'COLLAB_HUB'],
      required: true,
      index: true,
    },
    floorLevel: { type: Number, default: 1, index: true },
    position2D: {
      posX: { type: Number, required: true },
      posY: { type: Number, required: true },
    },
    position3D: {
      coordX: { type: Number, default: 0 },
      coordY: { type: Number, default: 0.4 },
      coordZ: { type: Number, default: 0 },
    },
    capacityCount: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['AVAILABLE', 'HOLDING', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
      default: 'AVAILABLE',
      index: true,
    },
    amenitiesList: [{ type: String }],
    aiScore: { type: Number, default: 90 },
    lockVersion: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    collection: 'spotmatrix_space_nodes',
  }
);

export const SpaceNodeModel =
  mongoose.models.SpotMatrixSpaceNode ||
  mongoose.model<WorkspaceNodeItem>('SpotMatrixSpaceNode', spaceNodeSchema);