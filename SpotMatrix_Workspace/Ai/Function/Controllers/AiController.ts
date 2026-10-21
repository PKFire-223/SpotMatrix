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
        provider: 'SPOTMATRIX_AI',
        replyText: null,
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
              `${m.sender === 'USER' ? 'Người dùng' : 'Trợ lý'}: ${m.contentText || ''}`
          )
          .join('\n')
      : '';

    const fullSystemInstruction = `[VAI TRÒ NỀN: ${
      personaLabel || 'Kiến trúc sư Không gian 3D'
    }]
${
  systemPersonaPrompt ||
  'Bạn là Trợ lý thông minh của hệ thống Quản lý Không gian & Đặt lịch Phòng họp 3D/2D SpotMatrix.'
}
- Trả lời đầy đủ, trọn vẹn câu, tự nhiên, linh hoạt bằng tiếng Việt.
- Nếu người dùng hỏi toán học, đố vui hoặc chào hỏi (ví dụ "1+1 bằng 3 ư?"), hãy trả lời chính xác, dí dỏm rồi liên hệ hỗ trợ phòng họp.
- Dựa trực tiếp vào số liệu thực tế của tòa nhà 5 tầng bên dưới.

[DỮ LIỆU TÒA NHÀ 5 TẦNG SPOTMATRIX]
${workspaceContextText || 'Không có ngữ cảnh bổ sung.'}
${historyText ? `\n[LỊCH SỬ HỘI THOẠI]\n${historyText}` : ''}`;

    const baseContents = [
      {
        role: 'user',
        parts: [
          {
            text: `${fullSystemInstruction}\n\n[CÂU HỎI]: ${
              promptText || 'Hãy tổng hợp tình hình hệ thống hiện tại.'
            }`,
          },
        ],
      },
    ];

    let response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: baseContents,
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: baseContents,
          generationConfig: { temperature: 0.65, maxOutputTokens: 2048 },
        }),
      });
    }

    if (!response.ok) {
      res.json({ success: true, provider: 'SPOTMATRIX_AI', replyText: null });
      return;
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      }>;
    };

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const joinedText = parts
      .filter((p) => !p.thought && typeof p.text === 'string')
      .map((p) => p.text)
      .join(' ')
      .trim();

    res.json({
      success: true,
      provider: 'SPOTMATRIX_AI',
      replyText: joinedText.length > 0 ? joinedText : null,
    });
  } catch (err) {
    next(err);
  }
}