import { Router } from 'express';
import { handleGetOccupancySummary } from '../Controllers/DatamanagerController';

export const datamanagerRouter = Router();
datamanagerRouter.get('/occupancy', handleGetOccupancySummary);
