import { Request, Response } from 'express';
import { getRecentErrorLogs } from '../Services/ErrorLoggerService';
import { getMongoConnectionState } from '../../../Shared/Database/MongoConnection';

export function getSystemHealthStatus(_req: Request, res: Response): void {
  res.json({
    success: true,
    serviceName: 'SmartSpace 2D/3D Core API',
    databaseMode: getMongoConnectionState() ? 'MONGODB_CONNECTED' : 'IN_MEMORY_RESILIENT_MODE',
    recentErrorsCount: getRecentErrorLogs().length,
    recentErrors: getRecentErrorLogs().slice(0, 10),
  });
}
