import mongoose, { Schema, Document } from 'mongoose';
import { UserRoleType } from '../../../../Shared/Types/GlobalSystemTypes';

export type AccountLifecycleStatus = 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface UserAccountDocument extends Document {
  schemaVersion: number;
  accountCode: string;
  username: string;
  usernameNormalized: string;
  userEmail: string;
  passwordSalt: string;
  passwordHash: string;
  fullName: string;
  departmentName: string;
  role: UserRoleType;
  accountStatus: AccountLifecycleStatus;
  trustScore: number;
  avatarUrl: string | null;
  backgroundUrl: string | null;
  phoneNumber: string;
  jobTitle: string;
  bioText: string;
  failedLoginAttempts: number;
  lockUntilDate: Date | null;
  resetOtpCodeHash: string | null;
  resetOtpExpiresAt: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  passwordChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userAccountSchema = new Schema<UserAccountDocument>(
  {
    schemaVersion: { type: Number, default: 3, index: true },
    accountCode: { type: String, required: true, unique: true, index: true },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 32,
    },
    usernameNormalized: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordSalt: { type: String, required: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    departmentName: { type: String, default: 'Engineering & Product' },
    role: {
      type: String,
      enum: ['EMPLOYEE', 'MANAGER', 'SYS_ADMIN'],
      default: 'EMPLOYEE',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'LOCKED', 'SUSPENDED', 'PENDING_VERIFICATION'],
      default: 'ACTIVE',
      index: true,
    },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    avatarUrl: { type: String, default: null },
    backgroundUrl: { type: String, default: null },
    phoneNumber: { type: String, default: '0908 123 456' },
    jobTitle: { type: String, default: 'Senior System Member' },
    bioText: {
      type: String,
      default: 'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntilDate: { type: Date, default: null },
    resetOtpCodeHash: { type: String, default: null },
    resetOtpExpiresAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    passwordChangedAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    collection: 'spotmatrix_user_accounts',
  }
);

export const UserAccountModel =
  mongoose.models.SpotMatrixUserAccount ||
  mongoose.model<UserAccountDocument>('SpotMatrixUserAccount', userAccountSchema);