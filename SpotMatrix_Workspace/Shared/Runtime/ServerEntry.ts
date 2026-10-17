import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { loadSystemEnvConfig } from '../Config/EnvConfig';
import { connectMongoDatabase } from '../Database/MongoConnection';
import { floorplanRouter } from '../../Main/Floorplan/Function/Routes/FloorplanRoutes';
import { bookingRouter } from '../../Main/Booking/Function/Routes/BookingRoutes';
import { aiRouter } from '../../Ai/Function/Routes/AiRoutes';
import { datamanagerRouter } from '../../Main/Datamanager/Function/Routes/DatamanagerRoutes';
import { authRouter } from '../../Main/Auth/Function/Routes/AuthRoutes';
import { healthCheckRouter } from '../../Error/Function/Routes/HealthCheckRoutes';
import { handleGlobalException } from '../../Error/Function/Middlewares/GlobalErrorMiddleware';

async function bootstrapBackendServer(): Promise<void> {
  const envConfig = loadSystemEnvConfig();
  await connectMongoDatabase();

  const appServer = express();

  appServer.use(helmet());
  appServer.use(
    cors({
      origin: envConfig.allowedOrigins,
      credentials: true,
    })
  );
  appServer.use(express.json());

  appServer.use('/api/v1/floorplan', floorplanRouter);
  appServer.use('/api/v1/bookings', bookingRouter);
  appServer.use('/api/v1/ai', aiRouter);
  appServer.use('/api/v1/datamanager', datamanagerRouter);
  appServer.use('/api/v1/auth', authRouter);
  appServer.use('/api/v1/system', healthCheckRouter);

  appServer.use(handleGlobalException);

  appServer.listen(envConfig.serverPort, () => {
    console.log(
      `[SmartSpace Backend] Server dang chay tai http://localhost:${envConfig.serverPort}/api/v1/system/health`
    );
  });
}

bootstrapBackendServer();
