import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { Server } from 'http';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { loadSystemEnvConfig } from '../Config/EnvConfig';
import { connectMongoDatabase } from '../Database/MongoConnection';
import { floorplanRouter } from '../../Main/Floorplan/Function/Routes/FloorplanRoutes';
import { bookingRouter } from '../../Main/Booking/Function/Routes/BookingRoutes';
import { aiRouter } from '../../Ai/Function/Routes/AiRoutes';
import { datamanagerRouter } from '../../Main/Datamanager/Function/Routes/DatamanagerRoutes';
import { organizationRouter } from '../../Main/Organization/Function/Routes/OrganizationRoutes';
import { authRouter } from '../../Main/Auth/Function/Routes/AuthRoutes';
import { healthCheckRouter } from '../../Error/Function/Routes/HealthCheckRoutes';
import { handleGlobalException } from '../../Error/Function/Middlewares/GlobalErrorMiddleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Structured JSON Logger (chuẩn production từ nodebestpractices)
 * Ghi nhận có cấu trúc method, path, statusCode, durationMs cho mọi yêu cầu /api/
 */
function createStructuredRequestLogger() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.path.startsWith('/api/')) {
      next();
      return;
    }
    const startedAtMs = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - startedAtMs;
      const logEntry = {
        timestamp: new Date().toISOString(),
        service: 'spotmatrix-api',
        level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      };
      console.log(JSON.stringify(logEntry));
    });
    next();
  };
}

/**
 * Cơ chế Graceful Shutdown (SIGTERM / SIGINT) học hỏi từ goldbergyoni/nodebestpractices:
 * Ngừng nhận kết nối mới, chờ các request đang chạy hoàn tất rồi mới đóng MongoDB.
 */
function registerGracefulShutdownHandlers(httpServer: Server): void {
  let isShuttingDown = false;

  const executeGracefulShutdown = async (signalName: string): Promise<void> => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'spotmatrix-api',
        level: 'warn',
        event: 'GRACEFUL_SHUTDOWN_START',
        signal: signalName,
      })
    );

    const forceExitTimer = setTimeout(() => {
      console.error('[SpotMatrix Backend] Hết thời gian chờ đóng kết nối (10s), thoát cưỡng bức.');
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    httpServer.close(async () => {
      try {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.close(false);
        }
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            service: 'spotmatrix-api',
            level: 'info',
            event: 'GRACEFUL_SHUTDOWN_COMPLETE',
            signal: signalName,
          })
        );
        process.exit(0);
      } catch (closeErr) {
        console.error('[SpotMatrix Backend] Lỗi khi đóng kết nối MongoDB:', closeErr);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => {
    void executeGracefulShutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void executeGracefulShutdown('SIGINT');
  });
  process.on('unhandledRejection', (reason: unknown) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'spotmatrix-api',
        level: 'error',
        event: 'UNHANDLED_REJECTION',
        detail: reason instanceof Error ? reason.message : String(reason),
      })
    );
  });
  process.on('uncaughtException', (err: Error) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'spotmatrix-api',
        level: 'error',
        event: 'UNCAUGHT_EXCEPTION',
        detail: err.message,
      })
    );
    void executeGracefulShutdown('UNCAUGHT_EXCEPTION');
  });
}

async function bootstrapBackendServer(): Promise<void> {
  const envConfig = loadSystemEnvConfig();
  await connectMongoDatabase();

  const appServer = express();

  appServer.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  appServer.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  appServer.use(express.json({ limit: '15mb' }));
  appServer.use(express.urlencoded({ extended: true, limit: '15mb' }));
  appServer.use(createStructuredRequestLogger());

  appServer.use('/api/v1/floorplan', floorplanRouter);
  appServer.use('/api/v1/bookings', bookingRouter);
  appServer.use('/api/v1/ai', aiRouter);
  appServer.use('/api/v1/datamanager', datamanagerRouter);
  appServer.use('/api/v1/organization', organizationRouter);
  appServer.use('/api/v1/auth', authRouter);
  appServer.use('/api/v1/system', healthCheckRouter);

  // Phục vụ trực tiếp bản build Frontend (thư mục dist) khi Deploy lên Render / Railway / VPS
  const distDir = path.resolve(__dirname, '../../dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    appServer.use(express.static(distDir));
    appServer.get(
      '*',
      (req: Request, res: Response, next: NextFunction): void => {
        if (req.path.startsWith('/api/')) {
          next();
          return;
        }
        res.sendFile(indexHtmlPath);
      }
    );
  }

  appServer.use(handleGlobalException);

  const activePort = Number(process.env.PORT) || envConfig.serverPort;
  const httpServer = appServer.listen(activePort, '0.0.0.0', () => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'spotmatrix-api',
        level: 'info',
        event: 'SERVER_STARTED',
        url: `http://localhost:${activePort}/api/v1/system/health`,
      })
    );
  });

  registerGracefulShutdownHandlers(httpServer);
}

void bootstrapBackendServer();
