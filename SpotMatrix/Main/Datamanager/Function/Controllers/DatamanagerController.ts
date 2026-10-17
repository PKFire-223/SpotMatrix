import { Request, Response } from 'express';
import { calculateZoneOccupancyRate } from '../Services/DatamanagerService';

export function handleGetOccupancySummary(_req: Request, res: Response): void {
  res.json({
    success: true,
    occupancyPercent: calculateZoneOccupancyRate(2, 5),
  });
}
