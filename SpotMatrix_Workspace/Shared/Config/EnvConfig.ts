import dotenv from 'dotenv';

dotenv.config();

export interface SystemEnvConfig {
  nodeEnv: string;
  serverPort: number;
  mongoUri: string;
  enableMemoryFallback: boolean;
  jwtAccessSecret: string;
  allowedOrigins: string[];
  defaultInitialTrustScore: number;
  trustScoreCheckinReward: number;
  trustScoreNoshowPenalty: number;
  minTrustScoreForRecurring: number;
  restrictedMaxAdvanceDays: number;
  holdTimeoutMinutes: number;
  checkinGracePeriodMinutes: number;
  maxMeetingHoursPerWeek: number;
}

export function loadSystemEnvConfig(): SystemEnvConfig {
  const rawOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173';
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    serverPort: Number(process.env.SERVER_PORT || 5000),
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spotmatrix_workspace_db',
    enableMemoryFallback: process.env.ENABLE_MEMORY_FALLBACK !== 'false',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'spotmatrix_dev_secret_key',
    allowedOrigins: rawOrigins.split(',').map((item) => item.trim()),
    defaultInitialTrustScore: Number(process.env.DEFAULT_INITIAL_TRUST_SCORE || 100),
    trustScoreCheckinReward: Number(process.env.TRUST_SCORE_CHECKIN_REWARD || 2),
    trustScoreNoshowPenalty: Number(process.env.TRUST_SCORE_NOSHOW_PENALTY || 10),
    minTrustScoreForRecurring: Number(process.env.MIN_TRUST_SCORE_FOR_RECURRING || 60),
    restrictedMaxAdvanceDays: Number(process.env.RESTRICTED_MAX_ADVANCE_DAYS || 2),
    holdTimeoutMinutes: Number(process.env.HOLD_TIMEOUT_MINUTES || 5),
    checkinGracePeriodMinutes: Number(process.env.CHECKIN_GRACE_PERIOD_MINUTES || 15),
    maxMeetingHoursPerWeek: Number(process.env.MAX_MEETING_HOURS_PER_WEEK || 10),
  };
}
