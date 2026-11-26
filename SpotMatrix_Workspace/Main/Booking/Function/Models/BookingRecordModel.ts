import mongoose, { Schema } from 'mongoose';
import { BookingPayloadItem } from '../../../../Shared/Types/GlobalSystemTypes';

const bookingRecordSchema = new Schema<BookingPayloadItem>(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    nodeId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    requesterUsername: { type: String, default: 'Employeedev123' },
    requesterRole: {
      type: String,
      enum: ['EMPLOYEE', 'MANAGER', 'SYS_ADMIN'],
      default: 'EMPLOYEE',
    },
    departmentName: { type: String, default: 'Product & Engineering' },
    bookingDateIso: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    startTimeIso: { type: String, required: true },
    endTimeIso: { type: String, required: true },
    purposeNote: { type: String, default: 'Làm việc cá nhân / Họp nhóm' },
    approvalRequestReason: { type: String, default: '' },
    recurringOption: {
      type: String,
      enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'],
      default: 'NONE',
    },
    recurringSeriesId: { type: String, default: null },
    occurrenceDates: { type: [String], default: [] },
    lockVersion: { type: Number, default: 1 },
    holdExpiresAtIso: { type: String, default: null },
    noShowDeadlineIso: { type: String, default: null },
    autoReleasedReason: { type: String, default: null },
    bookingStatus: {
      type: String,
      enum: [
        'HOLDING',
        'CONFIRMED',
        'CHECKED_IN',
        'EXPIRED_NO_SHOW',
        'AUTO_RELEASED',
        'CANCELLED',
      ],
      default: 'CONFIRMED',
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'APPROVED',
    },
    approvedByUsername: { type: String, default: null },
    approvedAtIso: { type: String, default: null },
    checkedInAtIso: { type: String, default: null },
    checkedInTimestampMs: { type: Number, default: null },
    expiredAtIso: { type: String, default: null },
    expiredAtTimestampMs: { type: Number, default: null },
    cancelledAtIso: { type: String, default: null },
    cancelledAtTimestampMs: { type: Number, default: null },
    cancelledViaQr: { type: Boolean, default: false },
    rejectedAtIso: { type: String, default: null },
    rejectedAtTimestampMs: { type: Number, default: null },
    qrToken: { type: String, default: '' },
    bookingMode: {
      type: String,
      enum: ['STANDARD_ROOM', 'HALL_EVENT_RENTAL', 'HALL_SEAT_BOOKING'],
      default: 'STANDARD_ROOM',
    },
    allowedDepartments: {
      type: [String],
      default: [],
    },
    parentHallEventBookingId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, collection: 'spotmatrix_booking_records' }
);

// Compound Indexes tăng tốc truy vấn kiểm tra trùng lịch, lịch cá nhân và quét No-Show
bookingRecordSchema.index(
  { nodeId: 1, bookingDateIso: 1, bookingStatus: 1 },
  { name: 'idx_node_date_status' }
);
bookingRecordSchema.index(
  { userEmail: 1, bookingDateIso: -1 },
  { name: 'idx_user_booking_history' }
);
bookingRecordSchema.index(
  { bookingStatus: 1, approvalStatus: 1 },
  { name: 'idx_status_approval_queue' }
);

export const BookingRecordModel =
  mongoose.models.SpotMatrixBookingRecord ||
  mongoose.model<BookingPayloadItem>(
    'SpotMatrixBookingRecord',
    bookingRecordSchema
  );
