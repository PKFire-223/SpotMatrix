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
      customApiKey,
    } = req.body || {};

    const geminiApiKey = (
      customApiKey ||
      process.env.GEMINI_API_KEY ||
      ''
    ).trim();
    const geminiModel = (
      process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash'
    ).trim();
    const geminiBaseUrl = (
      process.env.GEMINI_API_BASE_URL ||
      'https://generativelanguage.googleapis.com/v1beta/models'
    ).trim();

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
        ? 'Respond naturally and intelligently in English.'
        : webLanguage === 'ja'
        ? '自然で分かりやすい日本語で回答してください。'
        : 'Trả lời tự nhiên, linh hoạt, thông minh bằng tiếng Việt.';

    const fullSystemInstruction = `[DANH TÍNH AI ĐỘC QUYỀN: ${
      personaLabel || 'AURA-X — Trợ lý Không gian 3D SpotMatrix'
    }]
${
  systemPersonaPrompt ||
  'Bạn là AURA-X, Trí tuệ Nhân tạo 3D độc quyền của nền tảng Quản lý & Đặt phòng họp Nội bộ 5 Tầng SpotMatrix.'
}
- ${langDirective}
- Trò chuyện tự nhiên, linh hoạt đúng trọng tâm câu hỏi của người dùng (không trả lời rập khuôn máy móc).
- Nếu người dùng hỏi "Bạn là ai" hoặc chào hỏi, hãy tự giới thiệu sinh động về bản thân là AURA-X của SpotMatrix và chào tên người dùng đang đăng nhập.
- Nếu người dùng hỏi dữ liệu trên trang web (phòng trống, lịch cá nhân, thiết bị, phòng ban, điểm tín nhiệm...), hãy dùng chính xác số liệu trong [DỮ LIỆU HỆ THỐNG SPOTMATRIX THEO TÀI KHOẢN HIỆN TẠI] bên dưới và tuân thủ phân quyền bảo mật theo vai trò của họ.
- Nếu người dùng hỏi câu hỏi kiến thức bên ngoài (lập trình, thuật toán, toán học, viết email, dịch thuật, đời sống...), hãy giải đáp trực tiếp, chi tiết và chính xác như một chuyên gia thực thụ.

[DỮ LIỆU HỆ THỐNG SPOTMATRIX THEO TÀI KHOẢN HIỆN TẠI]
${workspaceContextText || 'Không có ngữ cảnh bổ sung.'}
${historyText ? `\n[LỊCH SỬ HỘI THOẠI]\n${historyText}` : ''}`;

    // TẦNG 1: THỬ GỌI GOOGLE GEMINI API NẾU CÓ KHÓA HỢP LỆ
    if (
      geminiApiKey &&
      geminiApiKey !== 'YOUR_GEMINI_API_KEY_HERE' &&
      geminiApiKey.startsWith('AIza')
    ) {
      try {
        const endpoint = `${geminiBaseUrl}/${geminiModel}:generateContent?key=${encodeURIComponent(
          geminiApiKey
        )}`;

        const userParts: Array<
          | { text: string }
          | { inline_data: { mime_type: string; data: string } }
        > = [
          {
            text: `${fullSystemInstruction}\n\n[CÂU HỎI CỦA NGƯỜI DÙNG]: ${
              promptText || 'Hãy phân tích tệp đính kèm.'
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

        const geminiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: userParts }],
            generationConfig: {
              temperature: 0.65,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (geminiRes.ok) {
          const data = (await geminiRes.json()) as {
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

          if (joinedText.length > 0) {
            res.json({
              success: true,
              provider: 'GOOGLE_GEMINI_LIVE',
              replyText: joinedText,
            });
            return;
          }
        }
      } catch {
        // Chuyển sang Tầng 2 (Cloud OpenAI-Compatible LLM)
      }
    }

    // TẦNG 2: GỌI TRỰC TIẾP CLOUD LLM (POLLINATIONS OPENAI-COMPATIBLE API — KHÔNG CẦN API KEY)
    try {
      const attachmentContext = Array.isArray(attachments)
        ? (attachments as IncomingAiAttachmentItem[])
            .map((att) =>
              att.textContentPreview
                ? `\n[Tệp đính kèm "${att.fileName}"]:\n${att.textContentPreview}`
                : `\n[Hình ảnh đính kèm: "${att.fileName}" (${att.mimeType})]`
            )
            .join('\n')
        : '';

      const cloudRes = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: [
            { role: 'system', content: fullSystemInstruction },
            {
              role: 'user',
              content: `${promptText || 'Phân tích dữ liệu đính kèm.'}${attachmentContext}`,
            },
          ],
          temperature: 0.65,
        }),
      });

      if (cloudRes.ok) {
        const cloudJson = (await cloudRes.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const cloudReply =
          cloudJson?.choices?.[0]?.message?.content?.trim() || '';
        if (cloudReply.length > 0) {
          res.json({
            success: true,
            provider: 'AURA_X_CLOUD_LLM',
            replyText: cloudReply,
          });
          return;
        }
      }
    } catch {
      // Nếu máy chủ hoàn toàn không có kết nối mạng ra ngoài, trả về cho Frontend xử lý
    }

    res.json({
      success: true,
      provider: 'SPOTMATRIX_LOCAL_ENGINE',
      replyText: null,
    });
  } catch (err) {
    next(err);
  }
}