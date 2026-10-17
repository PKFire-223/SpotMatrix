import { Request, Response, NextFunction } from 'express';
import { fetchAllFloorplanNodes, updateWorkspaceNodeStatus } from '../Services/FloorplanService';
import { createValidationException } from '../../../../Error/Function/Models/AppExceptionModel';

export async function handleGetFloorplanNodes(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const nodeList = await fetchAllFloorplanNodes();
    res.json({
      success: true,
      totalCount: nodeList.length,
      data: nodeList,
    });
  } catch (err) {
    next(err);
  }
}

export async function handlePatchNodeStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { nodeId } = req.params;
    const { status } = req.body;
    if (!nodeId || !status) {
      throw createValidationException('Thieu nodeId hoac trang thai status can cap nhat.');
    }
    const updatedNode = await updateWorkspaceNodeStatus(nodeId, status);
    res.json({
      success: true,
      data: updatedNode,
    });
  } catch (err) {
    next(err);
  }
}
