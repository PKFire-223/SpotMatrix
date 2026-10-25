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
      enum: ['HOLDING', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED'],
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

export const BookingRecordModel =
  mongoose.models.SpotMatrixBookingRecord ||
  mongoose.model<BookingPayloadItem>(
    'SpotMatrixBookingRecord',
    bookingRecordSchema
  );