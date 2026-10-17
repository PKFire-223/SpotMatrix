import { Router } from 'express';
import { handleRecommendOptimalWorkspace } from '../Controllers/AiController';

export const aiRouter = Router();

aiRouter.get('/recommend', handleRecommendOptimalWorkspace);
