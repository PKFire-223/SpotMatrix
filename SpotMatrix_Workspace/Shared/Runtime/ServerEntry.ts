import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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
    appServer.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(indexHtmlPath);
    });
  }

  appServer.use(handleGlobalException);

  const activePort = Number(process.env.PORT) || envConfig.serverPort;
  appServer.listen(activePort, '0.0.0.0', () => {
    console.log(
      `[SpotMatrix Backend] Server dang chay tai http://localhost:${activePort}/api/v1/system/health`
    );
  });
}

bootstrapBackendServer();
