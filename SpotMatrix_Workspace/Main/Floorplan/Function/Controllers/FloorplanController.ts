import { Request, Response, NextFunction } from 'express';
import {
  createNewWorkspaceNode,
  fetchAllFloorplanNodes,
  updateWorkspaceNodeCoordinates,
  updateWorkspaceNodeStatus,
} from '../Services/FloorplanService';
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
    const { status, actorEmail } = req.body;
    if (!nodeId || !status) {
      throw createValidationException('Thiếu nodeId hoặc trạng thái status cần cập nhật.');
    }
    const updatedNode = await updateWorkspaceNodeStatus(nodeId, status, actorEmail);
    res.json({
      success: true,
      data: updatedNode,
    });
  } catch (err) {
    next(err);
  }
}

export async function handlePatchNodeCoordinates(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { nodeId } = req.params;
    const { posX, posY, actorEmail } = req.body;
    if (!nodeId || posX === undefined || posY === undefined) {
      throw createValidationException('Thiếu nodeId hoặc tọa độ (posX, posY).');
    }
    const updatedNode = await updateWorkspaceNodeCoordinates(
      nodeId,
      Number(posX),
      Number(posY),
      actorEmail || 'Systemadmin123'
    );
    res.json({
      success: true,
      message: `Đã lưu tọa độ mới (${posX}, ${posY}) vào MongoDB.`,
      data: updatedNode,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateFloorplanNode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      nodeCode,
      nodeLabel,
      zoneType,
      floorLevel,
      capacityCount,
      posX,
      posY,
      amenitiesList,
      actorEmail,
    } = req.body;
    if (!nodeCode || !nodeLabel || !zoneType) {
      throw createValidationException('Vui lòng nhập đầy đủ Mã vị trí, Tên vị trí và Loại khu vực.');
    }
    const createdNode = await createNewWorkspaceNode(
      {
        nodeCode,
        nodeLabel,
        zoneType,
        floorLevel: Number(floorLevel || 1),
        capacityCount: Number(capacityCount || 1),
        posX: Number(posX || 220),
        posY: Number(posY || 180),
        amenitiesList: Array.isArray(amenitiesList) ? amenitiesList : [],
      },
      actorEmail || 'Systemadmin123'
    );
    res.status(201).json({
      success: true,
      message: `Đã thêm vị trí ${createdNode.nodeCode} vào sơ đồ mặt bằng!`,
      data: createdNode,
    });
  } catch (err) {
    next(err);
  }
}