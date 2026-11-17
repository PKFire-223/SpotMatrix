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
  handleCreateAuditLog,
  handleGetFaultReports,
  handleGetTrustHistory,
  handlePatchFaultReport,
  handlePostFaultReport,
  handlePostTrustHistory,
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
datamanagerRouter.post('/audit-logs', handleCreateAuditLog);
datamanagerRouter.get('/fault-reports', handleGetFaultReports);
datamanagerRouter.post('/fault-reports', handlePostFaultReport);
datamanagerRouter.patch('/fault-reports/:reportId', handlePatchFaultReport);
datamanagerRouter.get('/trust-history', handleGetTrustHistory);
datamanagerRouter.post('/trust-history', handlePostTrustHistory);
