import { Request, Response, NextFunction } from 'express';
import { fetchAllFloorplanNodes } from '../../../Main/Floorplan/Function/Services/FloorplanService';
import { recommendOptimalSeat } from '../Services/SeatRecommendationService';
import { listAllWorkspaceBookings } from '../../../Main/Booking/Function/Services/BookingService';
import {
  listSharedEquipments,
  listUserTrustProfiles,
} from '../../../Main/Datamanager/Function/Services/DatamanagerService';

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

export async function handleSynthesizeDashboardAiReport(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [nodes, bookings, equipments, trustList] = await Promise.all([
      fetchAllFloorplanNodes(),
      listAllWorkspaceBookings(),
      listSharedEquipments(),
      listUserTrustProfiles(),
    ]);

    const availableCount = nodes.filter((n) => n.status === 'AVAILABLE').length;
    const avgTrust =
      trustList.length > 0
        ? Math.round(trustList.reduce((acc, u) => acc + u.trustScore, 0) / trustList.length)
        : 95;
    const brokenCount = equipments.filter((e) => e.status === 'BROKEN').length;

    res.json({
      success: true,
      summaryText: `Hệ thống đang có ${availableCount}/${nodes.length} không gian trống, ${bookings.length} lịch đặt chỗ, điểm tín nhiệm trung bình đạt ${avgTrust}/100 và ${brokenCount} thiết bị cần bảo trì.`,
    });
  } catch (err) {
    next(err);
  }
}

// Kết nối trực tiếp tới Google Gemini API (kèm dữ liệu thực tế SpotMatrix) + Tự động Fallback sang AI Nội bộ
export async function handleAskGeminiCoPilot(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { promptText, workspaceContextText } = req.body || {};
    const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
    const geminiModel = (process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash').trim();
    const geminiBaseUrl = (
      process.env.GEMINI_API_BASE_URL ||
      'https://generativelanguage.googleapis.com/v1beta/models'
    ).trim();

    if (!geminiApiKey || geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      res.json({
        success: true,
        provider: 'INTERNAL_HEURISTIC_AI',
        replyText: null,
        message: 'Chưa cấu hình GEMINI_API_KEY, sử dụng AI Nội bộ SpotMatrix.',
      });
      return;
    }

    const endpoint = `${geminiBaseUrl}/${geminiModel}:generateContent?key=${encodeURIComponent(
      geminiApiKey
    )}`;

    const systemInstruction = `Bạn là Trợ lý AI Co-Pilot chuyên gia của hệ thống Quản lý Không gian & Đặt lịch Phòng họp 3D/2D SpotMatrix (5 tầng: Tầng 1-4 là các phòng họp chính thức, Tầng 5 là Hội trường Đấu trường La Mã H-01).
Hãy trả lời ngắn gọn, súc tích, chuyên nghiệp bằng tiếng Việt (khoảng 2-4 câu để thuận tiện đọc bằng giọng nói Text-to-Speech).
Dưới đây là dữ liệu thời gian thực của hệ thống:
${workspaceContextText || 'Không có ngữ cảnh bổ sung.'}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemInstruction}\n\nCâu hỏi của người dùng: ${
                  promptText || 'Hãy tóm tắt tình hình hệ thống hiện tại.'
                }`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 350,
        },
      }),
    });

    if (!response.ok) {
      res.json({
        success: true,
        provider: 'INTERNAL_HEURISTIC_FALLBACK',
        replyText: null,
      });
      return;
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const replyText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;

    res.json({
      success: true,
      provider: replyText ? `GOOGLE_${geminiModel.toUpperCase()}` : 'INTERNAL_HEURISTIC_FALLBACK',
      replyText,
    });
  } catch (err) {
    next(err);
  }
}