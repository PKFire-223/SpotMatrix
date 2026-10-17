import { Router } from 'express';
import {
  handleGetFloorplanNodes,
  handlePatchNodeStatus,
} from '../Controllers/FloorplanController';

export const floorplanRouter = Router();

floorplanRouter.get('/nodes', handleGetFloorplanNodes);
floorplanRouter.patch('/nodes/:nodeId/status', handlePatchNodeStatus);
