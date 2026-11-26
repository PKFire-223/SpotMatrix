import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Middleware xác thực dữ liệu đầu vào bằng Zod (Schema-first Validation)
 * Áp dụng mô hình phòng thủ từ nodebestpractices: chặn payload sai kiểu ngay tại tầng Route,
 * đồng thời hỗ trợ .passthrough() để giữ tương thích 100% với các trường mở rộng từ Frontend.
 */
export function validateBodySchema<TSchema extends ZodSchema>(
  schema: TSchema
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsedResult = schema.safeParse(req.body ?? {});
    if (!parsedResult.success) {
      const formattedIssues = parsedResult.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu đầu vào chưa hợp lệ. Vui lòng kiểm tra lại các trường thông tin.',
        issues: formattedIssues,
      });
      return;
    }

    req.body = parsedResult.data;
    next();
  };
}

const timeSlotRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createBookingBodySchema = z
  .object({
    nodeId: z.string().trim().min(1, 'Mã phòng/ghế không được để trống').optional(),
    userEmail: z.string().trim().email('Email người đặt không hợp lệ').optional(),
    startTimeIso: z
      .string()
      .trim()
      .regex(timeSlotRegex, 'Giờ bắt đầu phải theo định dạng HH:MM')
      .optional(),
    endTimeIso: z
      .string()
      .trim()
      .regex(timeSlotRegex, 'Giờ kết thúc phải theo định dạng HH:MM')
      .optional(),
    purposeNote: z.string().trim().max(400, 'Ghi chú mục đích tối đa 400 ký tự').optional(),
    bookingDateIso: z.string().trim().optional(),
    expectedLockVersion: z.coerce.number().int().nonnegative().optional(),
  })
  .passthrough()
  .refine(
    (data) => {
      if (!data.startTimeIso || !data.endTimeIso) {
        return true;
      }
      return data.endTimeIso > data.startTimeIso;
    },
    {
      message: 'Giờ kết thúc phải lớn hơn giờ bắt đầu.',
      path: ['endTimeIso'],
    }
  );

export const holdRoomBodySchema = z
  .object({
    nodeId: z.string().trim().min(1, 'Mã phòng cần giữ chỗ không được để trống').optional(),
    userEmail: z.string().trim().email('Email người giữ chỗ không hợp lệ').optional(),
    username: z.string().trim().min(1).max(80).optional(),
    expectedLockVersion: z.coerce.number().int().nonnegative().optional(),
  })
  .passthrough();
