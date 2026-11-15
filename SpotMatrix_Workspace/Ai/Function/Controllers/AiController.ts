import { Request, Response, NextFunction } from 'express';
import { fetchAllFloorplanNodes } from '../../../Main/Floorplan/Function/Services/FloorplanService';
import { recommendOptimalSeat } from '../Services/SeatRecommendationService';
import { listAllWorkspaceBookings } from '../../../Main/Booking/Function/Services/BookingService';
import {
  listSharedEquipments,
  listUserTrustProfiles,
} from '../../../Main/Datamanager/Function/Services/DatamanagerService';

interface IncomingAiAttachmentItem {
  fileName: string;
  mimeType: string;
  sizeBytes?: number;
  base64DataUrl?: string;
  textContentPreview?: string;
}

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
        ? `AI đề xuất ${recommendedNode.nodeLabel} với điểm tối ưu ${recommendedNode.aiScore}/100.`
        : 'Hiện không có vị trí trống phù hợp với quy mô nhóm.',
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
        ? Math.round(
            trustList.reduce((acc, u) => acc + u.trustScore, 0) / trustList.length
          )
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
      attachments,
      webLanguage,
    } = req.body || {};

    const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
    const geminiModel = (
      process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash'
    ).trim();
    const geminiBaseUrl = (
      process.env.GEMINI_API_BASE_URL ||
      'https://generativelanguage.googleapis.com/v1beta/models'
    ).trim();

    if (!geminiApiKey || geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      res.json({
        success: true,
        provider: 'SPOTMATRIX_LOCAL_ENGINE',
        replyText: null,
      });
      return;
    }

    const endpoint = `${geminiBaseUrl}/${geminiModel}:generateContent?key=${encodeURIComponent(
      geminiApiKey
    )}`;

    const historyText = Array.isArray(conversationHistory)
      ? conversationHistory
          .slice(-6)
          .map(
            (m: { sender?: string; contentText?: string }) =>
              `${m.sender === 'USER' ? 'Người dùng' : 'AURA-X AI'}: ${
                m.contentText || ''
              }`
          )
          .join('\n')
      : '';

    const langDirective =
      webLanguage === 'en'
        ? 'Respond in clear, structured English.'
        : webLanguage === 'ja'
        ? '明確で整理された日本語で回答してください。'
        : 'Trả lời bằng tiếng Việt mạch lạc, có bố cục rõ ràng.';

    const fullSystemInstruction = `[DANH TÍNH AI ĐỘC QUYỀN: ${
      personaLabel || 'AURA-X — Trợ lý Không gian 3D SpotMatrix'
    }]
${
  systemPersonaPrompt ||
  'Bạn là AURA-X, Trí tuệ Nhân tạo độc quyền của hệ thống Quản lý & Đặt phòng họp Nội bộ 5 Tầng SpotMatrix.'
}
- ${langDirective}
- Phân quyền bảo mật dữ liệu theo đúng tài khoản đang đăng nhập (SYS_ADMIN thấy toàn bộ IP và toàn bộ công ty; MANAGER thấy phòng ban mình quản lý và các đơn chờ duyệt; EMPLOYEE thấy lịch cá nhân, phòng ban của mình và trạng thái phòng trống).
- Khi người dùng hỏi kiến thức bên ngoài trang web (toán học, lập trình, kỹ thuật, viết email, phân tích file/ảnh đính kèm...), hãy trả lời chính xác, chuyên sâu, có cấu trúc gạch đầu dòng rõ ràng.

[DỮ LIỆU HỆ THỐNG SPOTMATRIX THEO TÀI KHOẢN HIỆN TẠI]
${workspaceContextText || 'Không có ngữ cảnh bổ sung.'}
${historyText ? `\n[LỊCH SỬ HỘI THOẠI]\n${historyText}` : ''}`;

    const userParts: Array<
      | { text: string }
      | { inline_data: { mime_type: string; data: string } }
    > = [
      {
        text: `${fullSystemInstruction}\n\n[YÊU CẦU TỪ NGƯỜI DÙNG]: ${
          promptText || 'Hãy phân tích dữ liệu hoặc tệp đính kèm.'
        }`,
      },
    ];

    if (Array.isArray(attachments)) {
      (attachments as IncomingAiAttachmentItem[]).forEach((att) => {
        if (
          att.base64DataUrl &&
          att.mimeType &&
          att.mimeType.startsWith('image/')
        ) {
          const commaIdx = att.base64DataUrl.indexOf(',');
          const rawBase64 =
            commaIdx >= 0
              ? att.base64DataUrl.slice(commaIdx + 1)
              : att.base64DataUrl;
          if (rawBase64) {
            userParts.push({
              inline_data: {
                mime_type: att.mimeType,
                data: rawBase64,
              },
            });
          }
        } else if (att.textContentPreview) {
          userParts.push({
            text: `\n[NỘI DUNG TỆP ĐÍNH KÈM "${att.fileName}"]:\n${att.textContentPreview}`,
          });
        }
      });
    }

    const baseContents = [
      {
        role: 'user',
        parts: userParts,
      },
    ];

    let response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: baseContents,
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      res.json({
        success: true,
        provider: 'SPOTMATRIX_LOCAL_ENGINE',
        replyText: null,
      });
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
      provider: 'SPOTMATRIX_GEMINI_ENGINE',
      replyText: joinedText.length > 0 ? joinedText : null,
    });
  } catch (err) {
    next(err);
  }
}