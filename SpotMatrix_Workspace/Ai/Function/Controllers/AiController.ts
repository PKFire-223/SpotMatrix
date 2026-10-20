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

// Kết nối Google Gemini API kèm Thiết lập Vai trò Nền (System Persona) & Lịch sử Hội thoại
export async function handleAskGeminiCoPilot(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      promptText,
      systemPersonaPrompt,
      personaLabel,
      workspaceContextText,
      conversationHistory,
    } = req.body || {};

    const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
    const geminiModel = (process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash').trim();
    const geminiBaseUrl = (
      process.env.GEMINI_API_BASE_URL ||
      'https://generativelanguage.googleapis.com/v1beta/models'
    ).trim();

    if (!geminiApiKey || geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      res.json({
        success: true,
        provider: 'INTERNAL_PERSONA_AI',
        replyText: null,
        message: 'Sử dụng Động cơ Suy luận Đa Vai trò Nội bộ SpotMatrix.',
      });
      return;
    }

    const endpoint = `${geminiBaseUrl}/${geminiModel}:generateContent?key=${encodeURIComponent(
      geminiApiKey
    )}`;

    const historyText = Array.isArray(conversationHistory)
      ? conversationHistory
          .slice(-5)
          .map(
            (m: { sender?: string; contentText?: string }) =>
              `${m.sender === 'USER' ? 'Người dùng' : 'AI'}: ${m.contentText || ''}`
          )
          .join('\n')
      : '';

    const fullSystemInstruction = `[VAI TRÒ NỀN ĐƯỢC THIẾT LẬP: ${
      personaLabel || 'Kiến trúc sư & Chuyên gia Điều phối SpotMatrix'
    }]
${
  systemPersonaPrompt ||
  'Bạn là Trợ lý AI Co-Pilot thông minh của hệ thống Quản lý Không gian & Đặt lịch Phòng họp 3D/2D SpotMatrix.'
}

[QUY TẮC TRẢ LỜI]
- Trả lời linh hoạt, tự nhiên, đúng trọng tâm câu hỏi của người dùng bằng tiếng Việt chuẩn xác.
- Dựa trực tiếp vào số liệu thực tế của tòa nhà 5 tầng bên dưới (nếu người dùng hỏi về phòng họp, số người, tầng, thiết bị, điểm tín nhiệm hoặc quy định).
- Giữ độ dài vừa phải (2-5 câu) để vừa dễ đọc vừa thuận tiện phát giọng nói Text-to-Speech.

[DỮ LIỆU THỜI GIAN THỰC CỦA TÒA NHÀ 5 TẦNG SPOTMATRIX]
${workspaceContextText || 'Không có ngữ cảnh bổ sung.'}

${historyText ? `[LỊCH SỬ HỘI THOẠI GẦN ĐÂY]\n${historyText}` : ''}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${fullSystemInstruction}\n\n[CÂU HỎI HIỆN TẠI CỦA NGƯỜI DÙNG]: ${
                  promptText || 'Hãy tổng hợp tình hình hệ thống hiện tại.'
                }`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 450,
        },
      }),
    });

    if (!response.ok) {
      res.json({
        success: true,
        provider: 'INTERNAL_PERSONA_FALLBACK',
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
      provider: replyText
        ? `GOOGLE_${geminiModel.toUpperCase()}`
        : 'INTERNAL_PERSONA_FALLBACK',
      replyText,
    });
  } catch (err) {
    next(err);
  }
}