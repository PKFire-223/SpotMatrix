import { Request, Response, NextFunction } from 'express';
import { fetchAllFloorplanNodes } from '../../../Main/Floorplan/Function/Services/FloorplanService';
import { recommendOptimalSeat } from '../Services/SeatRecommendationService';

export async function handleRecommendOptimalWorkspace(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const teamSize = Number(req.query.teamSize || 1);
    const allNodes = await fetchAllFloorplanNodes();
    const recommendedNode = recommendOptimalSeat(allNodes, teamSize);

    res.json({
      success: true,
      recommendation: recommendedNode,
      reasoning: recommendedNode
        ? `AI de xuat ${recommendedNode.nodeLabel} voi diem toi uu ${recommendedNode.aiScore}/100.`
        : 'Hien khong co vi tri trong phu hop voi quy mo nhom.',
    });
  } catch (err) {
    next(err);
  }
}
