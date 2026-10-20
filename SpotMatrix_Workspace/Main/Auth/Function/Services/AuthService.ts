import crypto from 'crypto';
import { UserRoleType } from '../../../../Shared/Types/GlobalSystemTypes';
import {
  AccountLifecycleStatus,
  UserAccountDocument,
  UserAccountModel,
} from '../Models/UserAccountModel';
import { getMongoConnectionState } from '../../../../Shared/Database/MongoConnection';
import {
  createConflictException,
  createForbiddenException,
  createUnauthorizedException,
  createValidationException,
} from '../../../../Error/Function/Models/AppExceptionModel';

export interface AuthenticatedUserProfileDto {
  accountCode: string;
  username: string;
  userEmail: string;
  fullName: string;
  departmentName: string;
  role: UserRoleType;
  accountStatus: AccountLifecycleStatus;
  trustScore: number;
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  phoneNumber?: string;
  jobTitle?: string;
  bioText?: string;
  lastLoginAtIso: string;
}

export interface AuthSessionResponseDto {
  accessToken: string;
  expiresInText: string;
  storageMode: 'MONGODB_ATLAS' | 'IN_MEMORY_FALLBACK';
  userProfile: AuthenticatedUserProfileDto;
}

interface InternalMemoryAccountRecord {
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
}

const PEPPER_SECRET =
  process.env.PASSWORD_PEPPER_SECRET || 'spotmatrix_scrypt_pepper_2026_v2';
const JWT_SECRET =
  process.env.JWT_ACCESS_SECRET || 'spotmatrix_super_secret_access_key_2026_enterprise';
const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const LOCK_DURATION_MINUTES = Number(process.env.ACCOUNT_LOCK_MINUTES || 15);
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 10);

const memoryAccountsStore = new Map<string, InternalMemoryAccountRecord>();
let isDefaultSeeded = false;

export function hashPasswordWithScrypt(
  rawPassword: string,
  saltHex?: string
): { salt: string; hash: string } {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(`${rawPassword}:${PEPPER_SECRET}`, salt, 64);
  return {
    salt,
    hash: derivedKey.toString('hex'),
  };
}

export function verifyPasswordWithScrypt(
  rawPassword: string,
  saltHex: string,
  expectedHashHex: string
): boolean {
  try {
    const { hash } = hashPasswordWithScrypt(rawPassword, saltHex);
    const bufA = Buffer.from(hash, 'hex');
    const bufB = Buffer.from(expectedHashHex, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function validateStrongPasswordPolicy(password: string): {
  valid: boolean;
  reason?: string;
} {
  if (!password || password.length < 8) {
    return { valid: false, reason: 'Mật khẩu phải có tối thiểu 8 ký tự.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Mật khẩu phải chứa ít nhất 1 chữ cái viết HOA (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Mật khẩu phải chứa ít nhất 1 chữ cái viết thường (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Mật khẩu phải chứa ít nhất 1 chữ số (0-9).' };
  }
  return { valid: true };
}

export function generateSessionToken(
  username: string,
  userEmail = 'user@spotmatrix.vn',
  role: UserRoleType = 'EMPLOYEE'
): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64url'
  );
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      email: userEmail,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyJwtAccessToken(token: string): {
  valid: boolean;
  sub?: string;
  email?: string;
  role?: UserRoleType;
} {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };
    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    if (signature !== expectedSig) return { valid: false };
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }
    return {
      valid: true,
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return { valid: false };
  }
}

export async function ensureDefaultAccountsSeeded(): Promise<void> {
  const defaultUsers: Array<{
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
      username: process.env.SYS_ADMIN_USERNAME || 'Systemadmin123',
      userEmail: process.env.SYS_ADMIN_EMAIL || 'sysadmin@spotmatrix.vn',
      rawPassword: process.env.SYS_ADMIN_PASSWORD || 'Password123',
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
      fullName: 'Lê Thu Hà (Quản lý)',
      departmentName: 'Product & Engineering',
      role: 'MANAGER',
      trustScore: 100,
    },
    {
      accountCode: 'ACC-EMP-003',
      username: 'Employeedev123',
      userEmail: 'employee.dev@spotmatrix.vn',
      rawPassword: 'Password123',
      fullName: 'Nguyễn Minh Quân (Nhân viên)',
      departmentName: 'Product & Engineering',
      role: 'EMPLOYEE',
      trustScore: 96,
    },
  ];

  if (!isDefaultSeeded) {
    for (const item of defaultUsers) {
      const { salt, hash } = hashPasswordWithScrypt(item.rawPassword);
      const norm = item.username.toLowerCase().trim();
      memoryAccountsStore.set(norm, {
        accountCode: item.accountCode,
        username: item.username,
        usernameNormalized: norm,
        userEmail: item.userEmail.toLowerCase().trim(),
        passwordSalt: salt,
        passwordHash: hash,
        fullName: item.fullName,
        departmentName: item.departmentName,
        role: item.role,
        accountStatus: 'ACTIVE',
        trustScore: item.trustScore,
        avatarUrl: null,
        backgroundUrl: null,
        phoneNumber: '0908 123 456',
        jobTitle:
          item.role === 'SYS_ADMIN'
            ? 'System Architect & Admin'
            : item.role === 'MANAGER'
            ? 'Engineering Manager'
            : 'Full-Stack Developer',
        bioText: 'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
        failedLoginAttempts: 0,
        lockUntilDate: null,
        resetOtpCodeHash: null,
        resetOtpExpiresAt: null,
        lastLoginAt: new Date(),
      });
    }
    isDefaultSeeded = true;
  }

  if (getMongoConnectionState()) {
    for (const item of defaultUsers) {
      const norm = item.username.toLowerCase().trim();
      const exists = await UserAccountModel.findOne({ usernameNormalized: norm }).lean();
      if (!exists) {
        const { salt, hash } = hashPasswordWithScrypt(item.rawPassword);
        await UserAccountModel.create({
          schemaVersion: 3,
          accountCode: item.accountCode,
          username: item.username,
          usernameNormalized: norm,
          userEmail: item.userEmail.toLowerCase().trim(),
          passwordSalt: salt,
          passwordHash: hash,
          fullName: item.fullName,
          departmentName: item.departmentName,
          role: item.role,
          accountStatus: 'ACTIVE',
          trustScore: item.trustScore,
          avatarUrl: null,
          backgroundUrl: null,
          phoneNumber: '0908 123 456',
          jobTitle:
            item.role === 'SYS_ADMIN'
              ? 'System Architect & Admin'
              : item.role === 'MANAGER'
              ? 'Engineering Manager'
              : 'Full-Stack Developer',
          bioText: 'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
        });
      }
    }
  }
}

// 1. Đăng nhập tài khoản (Hỗ trợ cả Username hoặc Email + Chống Brute-Force 5 lần khóa 15p)
export async function loginUserAccount(
  payload: {
    identifier?: string;
    usernameOrEmail?: string;
    username?: string;
    email?: string;
    password?: string;
  },
  clientIp = '127.0.0.1'
): Promise<AuthSessionResponseDto> {
  await ensureDefaultAccountsSeeded();

  const rawIdentifier = String(
    payload.identifier ||
      payload.usernameOrEmail ||
      payload.username ||
      payload.email ||
      ''
  )
    .trim()
    .toLowerCase();
  const rawPassword = String(payload.password || '');

  if (!rawIdentifier || !rawPassword) {
    throw createValidationException(
      'Vui lòng nhập đầy đủ Tên đăng nhập (hoặc Email) và Mật khẩu.'
    );
  }

  const isMongoOnline = getMongoConnectionState();

  if (isMongoOnline) {
    const userDoc = (await UserAccountModel.findOne({
      $or: [{ usernameNormalized: rawIdentifier }, { userEmail: rawIdentifier }],
    })) as UserAccountDocument | null;

    if (!userDoc) {
      throw createUnauthorizedException(
        'Tài khoản không tồn tại trong hệ thống. Vui lòng kiểm tra lại Username hoặc Email.'
      );
    }

    if (userDoc.accountStatus === 'SUSPENDED') {
      throw createForbiddenException(
        'Tài khoản của bạn đã bị Quản trị viên (SYS_ADMIN) tạm khóa quyền truy cập.'
      );
    }

    if (
      userDoc.lockUntilDate &&
      new Date(userDoc.lockUntilDate).getTime() > Date.now()
    ) {
      const waitMin = Math.ceil(
        (new Date(userDoc.lockUntilDate).getTime() - Date.now()) / 60000
      );
      throw createForbiddenException(
        `Tài khoản đang bị khóa bảo mật do nhập sai mật khẩu quá ${MAX_LOGIN_ATTEMPTS} lần. Vui lòng thử lại sau ${waitMin} phút.`
      );
    }

    const isPasswordMatch = verifyPasswordWithScrypt(
      rawPassword,
      userDoc.passwordSalt,
      userDoc.passwordHash
    );

    if (!isPasswordMatch) {
      const nextAttempts = (userDoc.failedLoginAttempts || 0) + 1;
      const shouldLock = nextAttempts >= MAX_LOGIN_ATTEMPTS;
      userDoc.failedLoginAttempts = nextAttempts;
      if (shouldLock) {
        userDoc.accountStatus = 'LOCKED';
        userDoc.lockUntilDate = new Date(Date.now() + LOCK_DURATION_MINUTES * 60000);
      }
      await userDoc.save();

      const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - nextAttempts);
      throw createUnauthorizedException(
        shouldLock
          ? `Bạn đã nhập sai mật khẩu ${MAX_LOGIN_ATTEMPTS} lần liên tiếp. Tài khoản bị khóa tạm thời ${LOCK_DURATION_MINUTES} phút!`
          : `Mật khẩu không chính xác! Bạn còn ${remaining} lần thử trước khi tài khoản bị khóa.`
      );
    }

    userDoc.failedLoginAttempts = 0;
    userDoc.lockUntilDate = null;
    if (userDoc.accountStatus === 'LOCKED') {
      userDoc.accountStatus = 'ACTIVE';
    }
    userDoc.lastLoginAt = new Date();
    userDoc.lastLoginIp = clientIp;
    await userDoc.save();

    const accessToken = generateSessionToken(
      userDoc.username,
      userDoc.userEmail,
      userDoc.role
    );

    return {
      accessToken,
      expiresInText: '12 giờ',
      storageMode: 'MONGODB_ATLAS',
      userProfile: {
        accountCode: userDoc.accountCode,
        username: userDoc.username,
        userEmail: userDoc.userEmail,
        fullName: userDoc.fullName,
        departmentName: userDoc.departmentName,
        role: userDoc.role,
        accountStatus: userDoc.accountStatus,
        trustScore: userDoc.trustScore,
        avatarUrl: userDoc.avatarUrl ?? null,
        backgroundUrl: userDoc.backgroundUrl ?? null,
        phoneNumber: userDoc.phoneNumber || '0908 123 456',
        jobTitle: userDoc.jobTitle || 'Senior System Member',
        bioText:
          userDoc.bioText ||
          'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
        lastLoginAtIso: userDoc.lastLoginAt.toISOString(),
      },
    };
  }

  // Fallback In-Memory khi chưa bật kết nối mạng tới MongoDB Atlas
  let foundMem: InternalMemoryAccountRecord | undefined;
  memoryAccountsStore.forEach((acc) => {
    if (
      acc.usernameNormalized === rawIdentifier ||
      acc.userEmail.toLowerCase() === rawIdentifier
    ) {
      foundMem = acc;
    }
  });

  if (!foundMem) {
    throw createUnauthorizedException(
      'Tài khoản không tồn tại. Hãy chọn 1 trong 3 tài khoản mẫu (Systemadmin123, Managerlead123, Employeedev123).'
    );
  }

  if (foundMem.accountStatus === 'SUSPENDED') {
    throw createForbiddenException('Tài khoản đã bị Quản trị viên đình chỉ hoạt động.');
  }

  if (foundMem.lockUntilDate && foundMem.lockUntilDate.getTime() > Date.now()) {
    const waitMin = Math.ceil((foundMem.lockUntilDate.getTime() - Date.now()) / 60000);
    throw createForbiddenException(
      `Tài khoản đang bị khóa bảo mật. Vui lòng thử lại sau ${waitMin} phút.`
    );
  }

  const isMatch = verifyPasswordWithScrypt(
    rawPassword,
    foundMem.passwordSalt,
    foundMem.passwordHash
  );
  if (!isMatch) {
    foundMem.failedLoginAttempts += 1;
    if (foundMem.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      foundMem.accountStatus = 'LOCKED';
      foundMem.lockUntilDate = new Date(Date.now() + LOCK_DURATION_MINUTES * 60000);
    }
    throw createUnauthorizedException('Mật khẩu không chính xác!');
  }

  foundMem.failedLoginAttempts = 0;
  foundMem.lockUntilDate = null;
  foundMem.accountStatus = 'ACTIVE';
  foundMem.lastLoginAt = new Date();

  const accessToken = generateSessionToken(
    foundMem.username,
    foundMem.userEmail,
    foundMem.role
  );

  return {
    accessToken,
    expiresInText: '12 giờ',
    storageMode: 'IN_MEMORY_FALLBACK',
    userProfile: {
      accountCode: foundMem.accountCode,
      username: foundMem.username,
      userEmail: foundMem.userEmail,
      fullName: foundMem.fullName,
      departmentName: foundMem.departmentName,
      role: foundMem.role,
      accountStatus: foundMem.accountStatus,
      trustScore: foundMem.trustScore,
      avatarUrl: foundMem.avatarUrl,
      backgroundUrl: foundMem.backgroundUrl,
      phoneNumber: foundMem.phoneNumber,
      jobTitle: foundMem.jobTitle,
      bioText: foundMem.bioText,
      lastLoginAtIso: foundMem.lastLoginAt.toISOString(),
    },
  };
}

// 2. Đăng ký tài khoản mới (Chặn tự nâng quyền SYS_ADMIN trái phép từ trang công khai)
export async function registerUserAccount(payload: {
  username?: string;
  userEmail?: string;
  password?: string;
  fullName?: string;
  departmentName?: string;
  role?: UserRoleType;
}): Promise<AuthSessionResponseDto> {
  await ensureDefaultAccountsSeeded();

  const username = String(payload.username || '').trim();
  const usernameNormalized = username.toLowerCase();
  const userEmail = String(payload.userEmail || '')
    .trim()
    .toLowerCase();
  const rawPassword = String(payload.password || '');
  const fullName = String(payload.fullName || username).trim();
  const departmentName = String(
    payload.departmentName || 'Product & Engineering'
  ).trim();

  // Bảo mật Phân quyền: Chỉ cho phép tạo EMPLOYEE hoặc MANAGER khi đăng ký công khai
  const safeRole: UserRoleType =
    payload.role === 'MANAGER' ? 'MANAGER' : 'EMPLOYEE';

  if (username.length < 4) {
    throw createValidationException('Tên tài khoản (Username) phải có từ 4 ký tự trở lên.');
  }
  if (!userEmail.includes('@')) {
    throw createValidationException('Địa chỉ Email không hợp lệ.');
  }

  const pwdCheck = validateStrongPasswordPolicy(rawPassword);
  if (!pwdCheck.valid) {
    throw createValidationException(pwdCheck.reason || 'Mật khẩu chưa đủ mạnh.');
  }

  const { salt, hash } = hashPasswordWithScrypt(rawPassword);
  const accountCode = `ACC-${safeRole === 'MANAGER' ? 'MGR' : 'EMP'}-${Date.now()
    .toString()
    .slice(-4)}`;

  if (getMongoConnectionState()) {
    const existing = await UserAccountModel.findOne({
      $or: [{ usernameNormalized }, { userEmail }],
    }).lean();
    if (existing) {
      throw createConflictException(
        'Tên đăng nhập hoặc Email này đã được đăng ký. Vui lòng chọn thông tin khác.'
      );
    }

    const createdDoc = await UserAccountModel.create({
      schemaVersion: 3,
      accountCode,
      username,
      usernameNormalized,
      userEmail,
      passwordSalt: salt,
      passwordHash: hash,
      fullName,
      departmentName,
      role: safeRole,
      accountStatus: 'ACTIVE',
      trustScore: 100,
      avatarUrl: null,
      backgroundUrl: null,
      phoneNumber: '0908 123 456',
      jobTitle: safeRole === 'MANAGER' ? 'Team Manager' : 'Project Member',
      bioText: 'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
      lastLoginAt: new Date(),
    });

    const accessToken = generateSessionToken(
      createdDoc.username,
      createdDoc.userEmail,
      createdDoc.role
    );

    return {
      accessToken,
      expiresInText: '12 giờ',
      storageMode: 'MONGODB_ATLAS',
      userProfile: {
        accountCode: createdDoc.accountCode,
        username: createdDoc.username,
        userEmail: createdDoc.userEmail,
        fullName: createdDoc.fullName,
        departmentName: createdDoc.departmentName,
        role: createdDoc.role,
        accountStatus: createdDoc.accountStatus,
        trustScore: createdDoc.trustScore,
        avatarUrl: null,
        backgroundUrl: null,
        phoneNumber: createdDoc.phoneNumber,
        jobTitle: createdDoc.jobTitle,
        bioText: createdDoc.bioText,
        lastLoginAtIso: new Date().toISOString(),
      },
    };
  }

  if (memoryAccountsStore.has(usernameNormalized)) {
    throw createConflictException('Tên tài khoản này đã tồn tại.');
  }

  const memRec: InternalMemoryAccountRecord = {
    accountCode,
    username,
    usernameNormalized,
    userEmail,
    passwordSalt: salt,
    passwordHash: hash,
    fullName,
    departmentName,
    role: safeRole,
    accountStatus: 'ACTIVE',
    trustScore: 100,
    avatarUrl: null,
    backgroundUrl: null,
    phoneNumber: '0908 123 456',
    jobTitle: safeRole === 'MANAGER' ? 'Team Manager' : 'Project Member',
    bioText: 'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
    failedLoginAttempts: 0,
    lockUntilDate: null,
    resetOtpCodeHash: null,
    resetOtpExpiresAt: null,
    lastLoginAt: new Date(),
  };
  memoryAccountsStore.set(usernameNormalized, memRec);

  const accessToken = generateSessionToken(username, userEmail, safeRole);
  return {
    accessToken,
    expiresInText: '12 giờ',
    storageMode: 'IN_MEMORY_FALLBACK',
    userProfile: {
      accountCode,
      username,
      userEmail,
      fullName,
      departmentName,
      role: safeRole,
      accountStatus: 'ACTIVE',
      trustScore: 100,
      avatarUrl: null,
      backgroundUrl: null,
      phoneNumber: memRec.phoneNumber,
      jobTitle: memRec.jobTitle,
      bioText: memRec.bioText,
      lastLoginAtIso: new Date().toISOString(),
    },
  };
}

// 3. Yêu cầu mã OTP 6 chữ số để đặt lại mật khẩu
export async function requestPasswordResetOtp(
  identifierInput: string | { identifier?: string }
): Promise<{
  otpDemoCode: string;
  expiresInMinutes: number;
  maskedTarget: string;
}> {
  await ensureDefaultAccountsSeeded();

  const rawIdentifier = String(
    typeof identifierInput === 'string'
      ? identifierInput
      : identifierInput?.identifier || ''
  )
    .trim()
    .toLowerCase();

  if (!rawIdentifier) {
    throw createValidationException('Vui lòng nhập Tên đăng nhập hoặc Email để nhận mã OTP.');
  }

  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60000);

  if (getMongoConnectionState()) {
    const userDoc = await UserAccountModel.findOne({
      $or: [{ usernameNormalized: rawIdentifier }, { userEmail: rawIdentifier }],
    });
    if (!userDoc) {
      throw createValidationException('Không tìm thấy tài khoản khớp với thông tin đã nhập.');
    }
    userDoc.resetOtpCodeHash = otpHash;
    userDoc.resetOtpExpiresAt = expiresAt;
    await userDoc.save();

    return {
      otpDemoCode: otpCode,
      expiresInMinutes: OTP_EXPIRES_MINUTES,
      maskedTarget: userDoc.userEmail,
    };
  }

  let foundMem: InternalMemoryAccountRecord | undefined;
  memoryAccountsStore.forEach((acc) => {
    if (
      acc.usernameNormalized === rawIdentifier ||
      acc.userEmail.toLowerCase() === rawIdentifier
    ) {
      foundMem = acc;
    }
  });

  if (!foundMem) {
    throw createValidationException('Không tìm thấy tài khoản khớp với thông tin đã nhập.');
  }

  foundMem.resetOtpCodeHash = otpHash;
  foundMem.resetOtpExpiresAt = expiresAt;

  return {
    otpDemoCode: otpCode,
    expiresInMinutes: OTP_EXPIRES_MINUTES,
    maskedTarget: foundMem.userEmail,
  };
}

// 4. Xác nhận mã OTP & Đặt lại mật khẩu mới
export async function confirmPasswordResetWithOtp(
  arg1:
    | string
    | {
        identifier?: string;
        otpCode?: string;
        newPassword?: string;
      },
  arg2?: string,
  arg3?: string
): Promise<{ resetSuccess: boolean; username: string }> {
  await ensureDefaultAccountsSeeded();

  const rawIdentifier = String(
    typeof arg1 === 'string' ? arg1 : arg1?.identifier || ''
  )
    .trim()
    .toLowerCase();
  const otpCode = String(typeof arg1 === 'string' ? arg2 || '' : arg1?.otpCode || '').trim();
  const newPassword = String(
    typeof arg1 === 'string' ? arg3 || '' : arg1?.newPassword || ''
  );

  const pwdCheck = validateStrongPasswordPolicy(newPassword);
  if (!pwdCheck.valid) {
    throw createValidationException(pwdCheck.reason || 'Mật khẩu mới chưa đủ mạnh.');
  }

  const inputOtpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
  const { salt, hash } = hashPasswordWithScrypt(newPassword);

  if (getMongoConnectionState()) {
    const userDoc = await UserAccountModel.findOne({
      $or: [{ usernameNormalized: rawIdentifier }, { userEmail: rawIdentifier }],
    });
    if (!userDoc || !userDoc.resetOtpCodeHash || !userDoc.resetOtpExpiresAt) {
      throw createValidationException('Yêu cầu đặt lại mật khẩu không hợp lệ hoặc chưa tạo OTP.');
    }
    if (new Date(userDoc.resetOtpExpiresAt).getTime() < Date.now()) {
      throw createValidationException('Mã OTP đã hết hạn. Vui lòng lấy mã OTP mới.');
    }
    if (userDoc.resetOtpCodeHash !== inputOtpHash) {
      throw createValidationException('Mã xác thực OTP không chính xác.');
    }

    userDoc.passwordSalt = salt;
    userDoc.passwordHash = hash;
    userDoc.resetOtpCodeHash = null;
    userDoc.resetOtpExpiresAt = null;
    userDoc.failedLoginAttempts = 0;
    userDoc.lockUntilDate = null;
    userDoc.accountStatus = 'ACTIVE';
    userDoc.passwordChangedAt = new Date();
    await userDoc.save();

    return { resetSuccess: true, username: userDoc.username };
  }

  let foundMem: InternalMemoryAccountRecord | undefined;
  memoryAccountsStore.forEach((acc) => {
    if (
      acc.usernameNormalized === rawIdentifier ||
      acc.userEmail.toLowerCase() === rawIdentifier
    ) {
      foundMem = acc;
    }
  });

  if (!foundMem || foundMem.resetOtpCodeHash !== inputOtpHash) {
    throw createValidationException('Mã xác thực OTP không chính xác hoặc đã hết hạn.');
  }

  foundMem.passwordSalt = salt;
  foundMem.passwordHash = hash;
  foundMem.resetOtpCodeHash = null;
  foundMem.resetOtpExpiresAt = null;
  foundMem.failedLoginAttempts = 0;
  foundMem.lockUntilDate = null;
  foundMem.accountStatus = 'ACTIVE';

  return { resetSuccess: true, username: foundMem.username };
}

export const loginAccount = loginUserAccount;
export const authenticateUserAccount = loginUserAccount;
export const registerAccount = registerUserAccount;