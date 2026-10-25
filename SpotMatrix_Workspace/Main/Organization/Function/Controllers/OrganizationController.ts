import { Request, Response, NextFunction } from 'express';
import {
  assignUserToSingleDepartment,
  deleteOrganizationDepartment,
  deleteOrganizationGroup,
  listOrganizationStructure,
  toggleMemberInOrganizationGroup,
  upsertOrganizationDepartment,
  upsertOrganizationGroup,
} from '../Services/OrganizationService';
import { createValidationException } from '../../../../Error/Function/Models/AppExceptionModel';

export async function handleGetOrganizationStructure(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await listOrganizationStructure();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handleUpsertDepartment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const saved = await upsertOrganizationDepartment(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteDepartment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { departmentId } = req.params;
    await deleteOrganizationDepartment(departmentId);
    res.json({ success: true, deletedId: departmentId });
  } catch (err) {
    next(err);
  }
}

export async function handleAssignUserDepartment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userEmail, departmentName } = req.body;
    if (!userEmail || !departmentName) {
      throw createValidationException('Thiếu userEmail hoặc departmentName.');
    }
    const result = await assignUserToSingleDepartment(
      userEmail,
      departmentName
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function handleUpsertGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const saved = await upsertOrganizationGroup(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { groupId } = req.params;
    await deleteOrganizationGroup(groupId);
    res.json({ success: true, deletedId: groupId });
  } catch (err) {
    next(err);
  }
}

export async function handleToggleGroupMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { groupId } = req.params;
    const { userEmail } = req.body;
    const updated = await toggleMemberInOrganizationGroup(groupId, userEmail);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}