import { Router } from 'express';
import {
  handleAdjustTrustScore,
  handleAssignUserDepartment,
  handleDeleteDepartment,
  handleDeleteGroup,
  handleEvaluateBookingEligibility,
  handleGetAuditLogs,
  handleGetOccupancySummary,
  handleGetOrganizationStructure,
  handleGetPolicyConfig,
  handleGetSharedEquipments,
  handleGetTrustProfiles,
  handlePatchEquipmentStatus,
  handleSimulateConcurrencyLock,
  handleToggleGroupMember,
  handleUpdatePolicyConfig,
  handleUpsertDepartment,
  handleUpsertGroup,
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

datamanagerRouter.get('/organization', handleGetOrganizationStructure);
datamanagerRouter.post('/organization/departments', handleUpsertDepartment);
datamanagerRouter.delete(
  '/organization/departments/:departmentId',
  handleDeleteDepartment
);
datamanagerRouter.patch(
  '/organization/departments/assign-user',
  handleAssignUserDepartment
);
datamanagerRouter.post('/organization/groups', handleUpsertGroup);
datamanagerRouter.delete('/organization/groups/:groupId', handleDeleteGroup);
datamanagerRouter.patch(
  '/organization/groups/:groupId/toggle-member',
  handleToggleGroupMember
);