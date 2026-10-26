import { Router } from 'express';
import {
  handleAssignUserDepartment,
  handleDeleteDepartment,
  handleDeleteGroup,
  handleGetOrganizationStructure,
  handleToggleGroupMember,
  handleUpsertDepartment,
  handleUpsertGroup,
} from '../Controllers/OrganizationController';

export const organizationRouter = Router();

organizationRouter.get('/', handleGetOrganizationStructure);
organizationRouter.post('/departments', handleUpsertDepartment);
organizationRouter.delete(
  '/departments/:departmentId',
  handleDeleteDepartment
);
organizationRouter.patch(
  '/departments/assign-user',
  handleAssignUserDepartment
);
organizationRouter.post('/groups', handleUpsertGroup);
organizationRouter.delete('/groups/:groupId', handleDeleteGroup);
organizationRouter.patch(
  '/groups/:groupId/toggle-member',
  handleToggleGroupMember
);