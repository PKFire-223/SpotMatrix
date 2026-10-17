import { Router } from 'express';
import { getSystemHealthStatus } from '../Controllers/ErrorReportController';

export const healthCheckRouter = Router();

healthCheckRouter.get('/health', getSystemHealthStatus);
