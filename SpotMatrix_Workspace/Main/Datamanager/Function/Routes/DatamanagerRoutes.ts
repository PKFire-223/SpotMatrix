import { Router } from 'express';
import {
  handleAdjustTrustScore,
  handleEvaluateBookingEligibility,
  handleGetAuditLogs,
  handleGetOccupancySummary,
  handleGetPolicyConfig,
  handleGetSharedEquipments,
  handleGetTrustProfiles,
  handlePatchEquipmentStatus,
  handleSimulateConcurrencyLock,
  handleUpdatePolicyConfig,
} from '../Controllers/DatamanagerController';

export const datamanagerRouter = Router();

datamanagerRouter.get('/occupancy', handleGetOccupancySummary);

datamanagerRouter.get('/trust-scores', handleGetTrustProfiles);
datamanagerRouter.post(
  '/trust-scores/evaluate',
  handleEvaluateBookingEligibility
);
datamanagerRouter.patch('/trust-scores/adjust', handleAdjustTrustScore);

datamanagerRouter.get('/equipments', handleGetSharedEquipments);
datamanagerRouter.patch(
  '/equipments/:equipmentId/status',
  handlePatchEquipmentStatus
);

datamanagerRouter.get('/policies', handleGetPolicyConfig);
datamanagerRouter.put('/policies', handleUpdatePolicyConfig);

datamanagerRouter.get('/audit-logs', handleGetAuditLogs);
datamanagerRouter.post(
  '/audit-logs/simulate-conflict',
  handleSimulateConcurrencyLock
);