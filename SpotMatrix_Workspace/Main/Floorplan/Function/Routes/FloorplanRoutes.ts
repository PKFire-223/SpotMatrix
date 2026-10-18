import { Router } from 'express';
import {
  handleCreateFloorplanNode,
  handleGetFloorplanNodes,
  handlePatchNodeCoordinates,
  handlePatchNodeStatus,
} from '../Controllers/FloorplanController';

export const floorplanRouter = Router();

floorplanRouter.get('/nodes', handleGetFloorplanNodes);
floorplanRouter.post('/nodes', handleCreateFloorplanNode);
floorplanRouter.patch('/nodes/:nodeId/status', handlePatchNodeStatus);
floorplanRouter.patch('/nodes/:nodeId/coordinates', handlePatchNodeCoordinates);