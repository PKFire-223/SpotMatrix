import mongoose, { Schema } from 'mongoose';
import { BookingPayloadItem } from '../../../../Shared/Types/GlobalSystemTypes';

const bookingRecordSchema = new Schema<BookingPayloadItem>(
  {
    bookingId: { type: String, required: true, unique: true },
    nodeId: { type: String, required: true },
    userEmail: { type: String, required: true },
    startTimeIso: { type: String, required: true },
    endTimeIso: { type: String, required: true },
    purposeNote: { type: String, default: 'Làm việc cá nhân / Họp nhóm' },
    bookingStatus: {
      type: String,
      enum: ['CONFIRMED', 'CHECKED_IN', 'CANCELLED'],
      default: 'CONFIRMED',
    },
  },
  { timestamps: true }
);

export const BookingRecordModel =
  mongoose.models.BookingRecord ||
  mongoose.model<BookingPayloadItem>('BookingRecord', bookingRecordSchema);
