import { Router } from 'express';
import {
  handleAskGeminiCoPilot,
  handleRecommendOptimalWorkspace,
  handleStreamGeminiCoPilot,
  handleSynthesizeDashboardAiReport,
} from '../Controllers/AiController';

export const aiRouter = Router();

aiRouter.get('/recommend', handleRecommendOptimalWorkspace);
aiRouter.get('/synthesize', handleSynthesizeDashboardAiReport);
aiRouter.post('/chat', handleAskGeminiCoPilot);
aiRouter.post('/chat-stream', handleStreamGeminiCoPilot);
aiRouter.post('/gemini-chat', handleAskGeminiCoPilot);
