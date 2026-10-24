import { Router } from 'express';
import {
  handleAskGeminiCoPilot,
  handleRecommendOptimalWorkspace,
  handleSynthesizeDashboardAiReport,
} from '../Controllers/AiController';

export const aiRouter = Router();

aiRouter.get('/recommend', handleRecommendOptimalWorkspace);
aiRouter.get('/synthesize', handleSynthesizeDashboardAiReport);
aiRouter.post('/chat', handleAskGeminiCoPilot);