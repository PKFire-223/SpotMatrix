import dotenv from 'dotenv';

dotenv.config();

export interface SystemEnvConfig {
  nodeEnv: string;
  serverPort: number;
  mongoUri: string;
  enableMemoryFallback: boolean;
  jwtAccessSecret: string;
  allowedOrigins: string[];
}

export function loadSystemEnvConfig(): SystemEnvConfig {
  const rawOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173';
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    serverPort: Number(process.env.SERVER_PORT || 5000),
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartspace_workspace_db',
    enableMemoryFallback: process.env.ENABLE_MEMORY_FALLBACK !== 'false',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'smartspace_dev_secret_key',
    allowedOrigins: rawOrigins.split(',').map((item) => item.trim()),
  };
}
