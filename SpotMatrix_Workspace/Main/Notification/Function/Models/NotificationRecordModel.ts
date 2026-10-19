import mongoose, { Schema } from 'mongoose';
import { NotificationRecordItem } from '../../../../Shared/Types/GlobalSystemTypes';

const notificationRecordSchema = new Schema<NotificationRecordItem>(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    recipientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    titleText: { type: String, required: true, trim: true },
    contentText: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['BOOKING_EVENT', 'FLOORPLAN_UPDATE', 'TRUST_SCORE_ALERT', 'SYSTEM_SECURITY'],
      default: 'BOOKING_EVENT',
    },
    isRead: { type: Boolean, default: false, index: true },
    relatedNodeId: { type: String, default: undefined },
    createdAtIso: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: true,
    collection: 'spotmatrix_notifications',
  }
);

export const NotificationRecordModel =
  mongoose.models.SpotMatrixNotification ||
  mongoose.model<NotificationRecordItem>('SpotMatrixNotification', notificationRecordSchema);