import mongoose, { Schema } from 'mongoose';
import { UserRoleType } from '../../../../Shared/Types/GlobalSystemTypes';

export interface UserAccountDocument {
  accountCode: string;
  username: string;
  usernameNormalized: string;
  userEmail: string;
  fullName: string;
  departmentName: string;
  role: UserRoleType;
  trustScore: number;
  passwordHash: string;
  passwordSalt: string;
  accountStatus: 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
  failedLoginAttempts: number;
  lockUntilIso: string | null;
  resetOtpCode: string | null;
  resetOtpExpiresIso: string | null;
  lastLoginAtIso: string | null;
  schemaVersion: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const userAccountSchema = new Schema<UserAccountDocument>(
  {
    accountCode: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, trim: true },
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
    fullName: { type: String, required: true, trim: true },
    departmentName: { type: String, default: 'General Workspace', trim: true },
    role: {
      type: String,
      enum: ['EMPLOYEE', 'MANAGER', 'SYS_ADMIN'],
      default: 'EMPLOYEE',
      index: true,
    },
    trustScore: { type: Number, default: 100 },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'LOCKED', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntilIso: { type: String, default: null },
    resetOtpCode: { type: String, default: null },
    resetOtpExpiresIso: { type: String, default: null },
    lastLoginAtIso: { type: String, default: null },
    schemaVersion: { type: Number, default: 2, index: true },
  },
  {
    timestamps: true,
    collection: 'spotmatrix_user_accounts',
  }
);

export const UserAccountModel =
  mongoose.models.SpotMatrixUserAccount ||
  mongoose.model<UserAccountDocument>('SpotMatrixUserAccount', userAccountSchema);