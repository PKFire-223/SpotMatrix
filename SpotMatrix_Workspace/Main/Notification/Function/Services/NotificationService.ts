import { getMongoConnectionState } from '../../../../Shared/Database/MongoConnection';
import {
  NotificationCategoryType,
  NotificationRecordItem,
} from '../../../../Shared/Types/GlobalSystemTypes';
import { NotificationRecordModel } from '../Models/NotificationRecordModel';

const initialSeedNotifications: NotificationRecordItem[] = [
  {
    notificationId: 'NTF-2026-001',
    recipientEmail: 'all',
    titleText: 'Đồng bộ Sơ đồ Mặt bằng Tầng 1 & Tầng 2',
    contentText: 'Hệ thống đã sẵn sàng tiếp nhận đặt chỗ và kiểm tra va chạm tọa độ thời gian thực.',
    category: 'FLOORPLAN_UPDATE',
    isRead: false,
    relatedNodeId: 'NODE-A01',
    createdAtIso: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    notificationId: 'NTF-2026-002',
    recipientEmail: 'all',
    titleText: 'Cơ chế Giữ chỗ 5 phút & Ân hạn QR 15 phút',
    contentText: 'Vị trí đang giữ sẽ tự động mở khóa nếu không xác nhận trong 5 phút.',
    category: 'BOOKING_EVENT',
    isRead: false,
    relatedNodeId: 'NODE-A03',
    createdAtIso: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    notificationId: 'NTF-2026-003',
    recipientEmail: 'all',
    titleText: 'Chính sách Điểm Tín nhiệm (100đ khởi điểm)',
    contentText: 'Check-in đúng giờ qua mã QR được cộng +2 điểm; quá hạn 15 phút không đến bị trừ -10 điểm.',
    category: 'TRUST_SCORE_ALERT',
    isRead: true,
    createdAtIso: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
];

let memoryNotificationsStore: NotificationRecordItem[] = [...initialSeedNotifications];

export async function listUserNotifications(
  userEmail?: string
): Promise<NotificationRecordItem[]> {
  if (getMongoConnectionState()) {
    const count = await NotificationRecordModel.countDocuments();
    if (count === 0) {
      await NotificationRecordModel.insertMany(initialSeedNotifications);
    }
    const query = userEmail
      ? { $or: [{ recipientEmail: 'all' }, { recipientEmail: userEmail.toLowerCase() }] }
      : {};
    const docs = await NotificationRecordModel.find(query)
      .sort({ createdAtIso: -1 })
      .limit(40)
      .lean();
    if (docs.length > 0) {
      return docs as unknown as NotificationRecordItem[];
    }
  }
  return memoryNotificationsStore;
}

export async function createSystemNotification(payload: {
  recipientEmail?: string;
  titleText: string;
  contentText: string;
  category?: NotificationCategoryType;
  relatedNodeId?: string;
}): Promise<NotificationRecordItem> {
  const newNotification: NotificationRecordItem = {
    notificationId: `NTF-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    recipientEmail: (payload.recipientEmail || 'all').toLowerCase(),
    titleText: payload.titleText.trim(),
    contentText: payload.contentText.trim(),
    category: payload.category || 'BOOKING_EVENT',
    isRead: false,
    relatedNodeId: payload.relatedNodeId,
    createdAtIso: new Date().toISOString(),
  };

  memoryNotificationsStore.unshift(newNotification);
  if (getMongoConnectionState()) {
    await NotificationRecordModel.create(newNotification);
  }
  return newNotification;
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<NotificationRecordItem | null> {
  const target = memoryNotificationsStore.find((n) => n.notificationId === notificationId);
  if (target) {
    target.isRead = true;
  }
  if (getMongoConnectionState()) {
    await NotificationRecordModel.findOneAndUpdate(
      { notificationId },
      { $set: { isRead: true } }
    );
  }
  return target || null;
}

export async function markAllNotificationsAsRead(): Promise<number> {
  memoryNotificationsStore = memoryNotificationsStore.map((item) => ({
    ...item,
    isRead: true,
  }));
  if (getMongoConnectionState()) {
    await NotificationRecordModel.updateMany({}, { $set: { isRead: true } });
  }
  return memoryNotificationsStore.length;
}

export async function deleteNotificationById(notificationId: string): Promise<boolean> {
  memoryNotificationsStore = memoryNotificationsStore.filter(
    (n) => n.notificationId !== notificationId
  );
  if (getMongoConnectionState()) {
    await NotificationRecordModel.deleteOne({ notificationId });
  }
  return true;
}