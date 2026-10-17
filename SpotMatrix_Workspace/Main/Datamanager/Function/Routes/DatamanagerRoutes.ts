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

// Thong ke tong quan
datamanagerRouter.get('/occupancy', handleGetOccupancySummary);

// 1. Routes Diem Tin Nhiem (Trust Score)
datamanagerRouter.get('/trust-scores', handleGetTrustProfiles);
datamanagerRouter.post('/trust-scores/evaluate', handleEvaluateBookingEligibility);
datamanagerRouter.patch('/trust-scores/adjust', handleAdjustTrustScore);

// 2. Routes Thiet Bi Dung Chung (Shared Equipment Inventory)
datamanagerRouter.get('/equipments', handleGetSharedEquipments);
datamanagerRouter.patch('/equipments/:equipmentId/status', handlePatchEquipmentStatus);

// 3. Routes Chinh Sach & Han Muc (Quota & Policy Config)
datamanagerRouter.get('/policies', handleGetPolicyConfig);
datamanagerRouter.put('/policies', handleUpdatePolicyConfig);

// 4. Routes Nhat Ky Xung Dot & Truy Vet (Concurrency & Audit Logs)
datamanagerRouter.get('/audit-logs', handleGetAuditLogs);
datamanagerRouter.post('/audit-logs/simulate-conflict', handleSimulateConcurrencyLock);
