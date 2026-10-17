import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { loadSystemEnvConfig } from '../../../../Shared/Config/EnvConfig';
import { getMongoConnectionState } from '../../../../Shared/Database/MongoConnection';
import { UserRoleType } from '../../../../Shared/Types/GlobalSystemTypes';
import {
  AppExceptionModel,
  createValidationException,
} from '../../../../Error/Function/Models/AppExceptionModel';
import { UserAccountDocument, UserAccountModel } from '../Models/UserAccountModel';

const envConfig = loadSystemEnvConfig();
const memoryUserStore: UserAccountDocument[] = [];

export interface PublicUserProfile {
  accountCode: string;
  username: string;
  userEmail: string;
  fullName: string;
  departmentName: string;
  role: UserRoleType;
  trustScore: number;
  accountStatus: string;
  lastLoginAtIso: string | null;
}

export function validateStrongPasswordRules(rawPassword: string): {
  isValid: boolean;
  message: string;
} {
  if (!rawPassword || rawPassword.length < 8) {
    return { isValid: false, message: 'Mật khẩu phải có ít nhất 8 ký tự.' };
  }
  if (!/[a-z]/.test(rawPassword)) {
    return { isValid: false, message: 'Mật khẩu phải chứa ít nhất 1 chữ cái viết thường (a-z).' };
  }
  if (!/[A-Z]/.test(rawPassword)) {
    return { isValid: false, message: 'Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa (A-Z).' };
  }
  if (!/[0-9]/.test(rawPassword)) {
    return { isValid: false, message: 'Mật khẩu phải chứa ít nhất 1 chữ số (0-9).' };
  }
  return { isValid: true, message: 'Mật khẩu hợp lệ.' };
}

export function hashPasswordWithSalt(
  rawPassword: string,
  existingSalt?: string
): { passwordHash: string; passwordSalt: string } {
  const passwordSalt = existingSalt || crypto.randomBytes(16).toString('hex');
  const pepperedInput = `${rawPassword}:${envConfig.passwordPepperSecret}`;
  const derivedKey = crypto.scryptSync(pepperedInput, passwordSalt, 64);
  return {
    passwordHash: derivedKey.toString('hex'),
    passwordSalt,
  };
}

export function verifyPasswordHash(
  rawPassword: string,
  storedHash: string,
  storedSalt: string
): boolean {
  const { passwordHash } = hashPasswordWithSalt(rawPassword, storedSalt);
  const hashBufferA = Buffer.from(passwordHash, 'hex');
  const hashBufferB = Buffer.from(storedHash, 'hex');
  if (hashBufferA.length !== hashBufferB.length) return false;
  return crypto.timingSafeEqual(hashBufferA, hashBufferB);
}

export function sanitizeUserProfile(doc: UserAccountDocument): PublicUserProfile {
  return {
    accountCode: doc.accountCode,
    username: doc.username,
    userEmail: doc.userEmail,
    fullName: doc.fullName,
    departmentName: doc.departmentName,
    role: doc.role,
    trustScore: doc.trustScore,
    accountStatus: doc.accountStatus,
    lastLoginAtIso: doc.lastLoginAtIso,
  };
}

export function generateJwtAccessToken(userDoc: UserAccountDocument): string {
  return jwt.sign(
    {
      accountCode: userDoc.accountCode,
      username: userDoc.username,
      userEmail: userDoc.userEmail,
      role: userDoc.role,
      fullName: userDoc.fullName,
    },
    envConfig.jwtAccessSecret,
    { expiresIn: '8h' }
  );
}

export async function seedDefaultAccountsToMongo(): Promise<{
  seededCount: number;
  storageMode: string;
}> {
  const defaultSeeds: Array<{
    accountCode: string;
    username: string;
    userEmail: string;
    rawPassword: string;
    fullName: string;
    departmentName: string;
    role: UserRoleType;
    trustScore: number;
  }> = [
    {
      accountCode: 'ACC-ADMIN-001',
      username: envConfig.sysAdminUsername,
      userEmail: envConfig.sysAdminEmail.toLowerCase(),
      rawPassword: envConfig.sysAdminPassword,
      fullName: 'System Administrator (SpotMatrix)',
      departmentName: 'System Governance & Security',
      role: 'SYS_ADMIN',
      trustScore: 100,
    },
    {
      accountCode: 'ACC-MGR-002',
      username: 'Managerlead123',
      userEmail: 'manager.lead@spotmatrix.vn',
      rawPassword: 'Password123',
      fullName: 'Lê Thu Hà (Quản lý Không gian)',
      departmentName: 'Workspace Operations',
      role: 'MANAGER',
      trustScore: 100,
    },
    {
      accountCode: 'ACC-EMP-003',
      username: 'Employeedev123',
      userEmail: 'employee.dev@spotmatrix.vn',
      rawPassword: 'Password123',
      fullName: 'Nguyễn Minh Quân (Nhân viên)',
      departmentName: 'Platform Engineering',
      role: 'EMPLOYEE',
      trustScore: 100,
    },
  ];

  for (const seedItem of defaultSeeds) {
    const { passwordHash, passwordSalt } = hashPasswordWithSalt(seedItem.rawPassword);
    const normalizedName = seedItem.username.trim().toLowerCase();

    const accountDoc: UserAccountDocument = {
      accountCode: seedItem.accountCode,
      username: seedItem.username.trim(),
      usernameNormalized: normalizedName,
      userEmail: seedItem.userEmail.trim().toLowerCase(),
      fullName: seedItem.fullName,
      departmentName: seedItem.departmentName,
      role: seedItem.role,
      trustScore: seedItem.trustScore,
      passwordHash,
      passwordSalt,
      accountStatus: 'ACTIVE',
      failedLoginAttempts: 0,
      lockUntilIso: null,
      resetOtpCode: null,
      resetOtpExpiresIso: null,
      lastLoginAtIso: null,
      schemaVersion: 2,
    };

    const existingMemIndex = memoryUserStore.findIndex(
      (u) => u.usernameNormalized === normalizedName
    );
    if (existingMemIndex >= 0) {
      memoryUserStore[existingMemIndex] = accountDoc;
    } else {
      memoryUserStore.push(accountDoc);
    }

    if (getMongoConnectionState()) {
      await UserAccountModel.findOneAndUpdate(
        { usernameNormalized: normalizedName },
        { $set: accountDoc },
        { upsert: true, new: true }
      );
    }
  }

  console.log(
    `[SpotMatrix Auth] Da dong bo 3 tai khoan mau (Admin: ${envConfig.sysAdminUsername} / ${envConfig.sysAdminPassword})`
  );

  return {
    seededCount: defaultSeeds.length,
    storageMode: getMongoConnectionState() ? 'MONGODB_ATLAS_OR_LOCAL' : 'IN_MEMORY_FALLBACK',
  };
}

async function findAccountByIdentifier(identifierInput: string): Promise<UserAccountDocument | null> {
  const cleanKey = identifierInput.trim().toLowerCase();
  if (getMongoConnectionState()) {
    const mongoDoc = await UserAccountModel.findOne({
      schemaVersion: 2,
      $or: [{ usernameNormalized: cleanKey }, { userEmail: cleanKey }],
    }).lean();
    if (mongoDoc) return mongoDoc as unknown as UserAccountDocument;
  }
  return (
    memoryUserStore.find(
      (u) => u.usernameNormalized === cleanKey || u.userEmail === cleanKey
    ) || null
  );
}

async function saveOrUpdateAccount(accountDoc: UserAccountDocument): Promise<void> {
  const memIdx = memoryUserStore.findIndex(
    (u) => u.usernameNormalized === accountDoc.usernameNormalized
  );
  if (memIdx >= 0) {
    memoryUserStore[memIdx] = accountDoc;
  } else {
    memoryUserStore.push(accountDoc);
  }

  if (getMongoConnectionState()) {
    await UserAccountModel.findOneAndUpdate(
      { usernameNormalized: accountDoc.usernameNormalized },
      { $set: accountDoc },
      { upsert: true, new: true }
    );
  }
}

export async function registerUserAccount(payload: {
  username: string;
  userEmail: string;
  rawPassword: string;
  fullName: string;
  departmentName?: string;
  role?: UserRoleType;
}): Promise<{ accessToken: string; userProfile: PublicUserProfile }> {
  const cleanUsername = (payload.username || '').trim();
  const cleanEmail = (payload.userEmail || '').trim().toLowerCase();
  const cleanFullName = (payload.fullName || '').trim();

  if (cleanUsername.length < 4 || /\s/.test(cleanUsername)) {
    throw createValidationException('Tên tài khoản phải từ 4 ký tự trở lên và không chứa khoảng trắng.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw createValidationException('Địa chỉ Email không đúng định dạng hợp lệ.');
  }
  if (!cleanFullName) {
    throw createValidationException('Vui lòng nhập họ và tên đầy đủ.');
  }

  const passwordValidation = validateStrongPasswordRules(payload.rawPassword);
  if (!passwordValidation.isValid) {
    throw createValidationException(passwordValidation.message);
  }

  const existingByUsername = await findAccountByIdentifier(cleanUsername);
  if (existingByUsername) {
    throw new AppExceptionModel(
      `Tên đăng nhập "${cleanUsername}" đã tồn tại trong hệ thống.`,
      409,
      'DUPLICATE_USERNAME'
    );
  }

  const existingByEmail = await findAccountByIdentifier(cleanEmail);
  if (existingByEmail) {
    throw new AppExceptionModel(
      `Email "${cleanEmail}" đã được đăng ký cho một tài khoản khác.`,
      409,
      'DUPLICATE_EMAIL'
    );
  }

  const { passwordHash, passwordSalt } = hashPasswordWithSalt(payload.rawPassword);
  const assignedRole: UserRoleType =
    payload.role === 'MANAGER' ? 'MANAGER' : 'EMPLOYEE';

  const newAccountDoc: UserAccountDocument = {
    accountCode: `ACC-${Date.now().toString().slice(-6)}`,
    username: cleanUsername,
    usernameNormalized: cleanUsername.toLowerCase(),
    userEmail: cleanEmail,
    fullName: cleanFullName,
    departmentName: (payload.departmentName || 'Workspace Member').trim(),
    role: assignedRole,
    trustScore: envConfig.defaultInitialTrustScore,
    passwordHash,
    passwordSalt,
    accountStatus: 'ACTIVE',
    failedLoginAttempts: 0,
    lockUntilIso: null,
    resetOtpCode: null,
    resetOtpExpiresIso: null,
    lastLoginAtIso: new Date().toISOString(),
    schemaVersion: 2,
  };

  await saveOrUpdateAccount(newAccountDoc);

  return {
    accessToken: generateJwtAccessToken(newAccountDoc),
    userProfile: sanitizeUserProfile(newAccountDoc),
  };
}

export async function authenticateUserLogin(
  identifierInput: string,
  rawPasswordInput: string
): Promise<{ accessToken: string; userProfile: PublicUserProfile }> {
  if (!identifierInput || !rawPasswordInput) {
    throw createValidationException('Vui lòng nhập Tên đăng nhập/Email và Mật khẩu.');
  }

  const targetAccount = await findAccountByIdentifier(identifierInput);
  if (!targetAccount) {
    throw new AppExceptionModel(
      'Tài khoản hoặc mật khẩu không chính xác.',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  if (targetAccount.lockUntilIso) {
    const lockUntilTime = new Date(targetAccount.lockUntilIso).getTime();
    if (Date.now() < lockUntilTime) {
      const remainingMinutes = Math.ceil((lockUntilTime - Date.now()) / 60000);
      throw new AppExceptionModel(
        `Tài khoản đang bị khóa bảo vệ do nhập sai quá 5 lần. Vui lòng thử lại sau ${remainingMinutes} phút hoặc dùng chức năng Quên mật khẩu.`,
        423,
        'ACCOUNT_TEMPORARILY_LOCKED'
      );
    }
    targetAccount.accountStatus = 'ACTIVE';
    targetAccount.failedLoginAttempts = 0;
    targetAccount.lockUntilIso = null;
  }

  const isPasswordMatch = verifyPasswordHash(
    rawPasswordInput,
    targetAccount.passwordHash,
    targetAccount.passwordSalt
  );

  if (!isPasswordMatch) {
    targetAccount.failedLoginAttempts += 1;
    if (targetAccount.failedLoginAttempts >= 5) {
      targetAccount.accountStatus = 'LOCKED';
      targetAccount.lockUntilIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await saveOrUpdateAccount(targetAccount);
      throw new AppExceptionModel(
        'Bạn đã nhập sai mật khẩu 5 lần liên tiếp. Tài khoản bị khóa bảo vệ trong 15 phút.',
        423,
        'ACCOUNT_LOCKED_BRUTE_FORCE'
      );
    }
    await saveOrUpdateAccount(targetAccount);
    const remainingTries = 5 - targetAccount.failedLoginAttempts;
    throw new AppExceptionModel(
      `Mật khẩu không chính xác. Bạn còn ${remainingTries} lần thử trước khi tài khoản bị khóa tạm thời.`,
      401,
      'INVALID_CREDENTIALS'
    );
  }

  targetAccount.failedLoginAttempts = 0;
  targetAccount.lockUntilIso = null;
  targetAccount.accountStatus = 'ACTIVE';
  targetAccount.lastLoginAtIso = new Date().toISOString();
  await saveOrUpdateAccount(targetAccount);

  return {
    accessToken: generateJwtAccessToken(targetAccount),
    userProfile: sanitizeUserProfile(targetAccount),
  };
}

export async function requestPasswordResetOtp(identifierInput: string): Promise<{
  maskedEmail: string;
  simulatedOtpCode: string;
  expiresInMinutes: number;
}> {
  if (!identifierInput) {
    throw createValidationException('Vui lòng nhập Tên đăng nhập hoặc Email đã đăng ký.');
  }

  const targetAccount = await findAccountByIdentifier(identifierInput);
  if (!targetAccount) {
    throw new AppExceptionModel(
      'Không tìm thấy tài khoản nào khớp với thông tin bạn cung cấp.',
      404,
      'ACCOUNT_NOT_FOUND'
    );
  }

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  targetAccount.resetOtpCode = generatedOtp;
  targetAccount.resetOtpExpiresIso = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await saveOrUpdateAccount(targetAccount);

  const [localPart, domainPart] = targetAccount.userEmail.split('@');
  const maskedEmail = `${localPart.slice(0, 2)}***@${domainPart || 'spotmatrix.vn'}`;

  return {
    maskedEmail,
    simulatedOtpCode: generatedOtp,
    expiresInMinutes: 10,
  };
}

export async function confirmPasswordResetWithOtp(payload: {
  identifier: string;
  otpCode: string;
  newPassword: string;
}): Promise<PublicUserProfile> {
  const targetAccount = await findAccountByIdentifier(payload.identifier || '');
  if (!targetAccount) {
    throw new AppExceptionModel('Không tìm thấy tài khoản cần đặt lại mật khẩu.', 404, 'ACCOUNT_NOT_FOUND');
  }

  if (!targetAccount.resetOtpCode || !targetAccount.resetOtpExpiresIso) {
    throw createValidationException('Bạn chưa yêu cầu mã xác nhận OTP hoặc mã đã được sử dụng.');
  }

  if (Date.now() > new Date(targetAccount.resetOtpExpiresIso).getTime()) {
    throw createValidationException('Mã xác nhận OTP đã hết hạn (quá 10 phút). Vui lòng lấy mã mới.');
  }

  if (targetAccount.resetOtpCode !== (payload.otpCode || '').trim()) {
    throw createValidationException('Mã xác nhận OTP 6 chữ số không chính xác.');
  }

  const passwordValidation = validateStrongPasswordRules(payload.newPassword);
  if (!passwordValidation.isValid) {
    throw createValidationException(passwordValidation.message);
  }

  const { passwordHash, passwordSalt } = hashPasswordWithSalt(payload.newPassword);
  targetAccount.passwordHash = passwordHash;
  targetAccount.passwordSalt = passwordSalt;
  targetAccount.resetOtpCode = null;
  targetAccount.resetOtpExpiresIso = null;
  targetAccount.failedLoginAttempts = 0;
  targetAccount.lockUntilIso = null;
  targetAccount.accountStatus = 'ACTIVE';

  await saveOrUpdateAccount(targetAccount);
  return sanitizeUserProfile(targetAccount);
}

export async function listAllRegisteredUsers(): Promise<PublicUserProfile[]> {
  if (getMongoConnectionState()) {
    const docs = await UserAccountModel.find({ schemaVersion: 2 })
      .sort({ createdAt: -1 })
      .lean();
    if (docs.length > 0) {
      return (docs as unknown as UserAccountDocument[]).map(sanitizeUserProfile);
    }
  }
  return memoryUserStore.map(sanitizeUserProfile);
}