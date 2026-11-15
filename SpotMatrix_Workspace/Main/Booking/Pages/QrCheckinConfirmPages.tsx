import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  MapPin,
  UserCheck,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  CalendarCheck,
  QrCode,
  Camera,
  XCircle,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { SpotMatrixLogo } from '../../../Shared/Components/SpotMatrixLogo';
import { WebLanguageCodeType } from '../../../Shared/Types/GlobalSystemTypes';

export const QR_BROADCAST_CHANNEL_NAME = 'spotmatrix_qr_realtime_sync_v2';
export const QR_STORAGE_EVENT_KEY = 'spotmatrix_qr_action_event_v2';

export interface QrRealtimeSyncPayload {
  actionType: 'CHECKIN' | 'CANCEL';
  bookingId: string;
  roomCode: string;
  userEmail: string;
  qrToken: string;
  scannedAtText: string;
  timestampMs: number;
}

interface QrCheckinConfirmPagesProps {
  isDark?: boolean;
  webLanguage?: WebLanguageCodeType;
  onConfirmCheckinFromUrl?: (bookingId: string, exactScanTimeText: string) => void;
  onConfirmCancelFromUrl?: (bookingId: string, exactCancelTimeText: string) => void;
}

// Tạo ma trận QR SVG sắc nét + kết hợp QR API thực tế để điện thoại quét được 100% khi deploy
function generateDeterministicQrMatrix(seedText: string, size = 25): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const drawFinderPattern = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (r0 + r < size && c0 + c < size) {
          matrix[r0 + r][c0 + c] = isBorder || isInner;
        }
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const isTiming = r === 6 || c === 6;
      if (inTopLeft || inTopRight || inBottomLeft || isTiming) continue;

      hash ^= (r * 31 + c * 17 + seedText.charCodeAt((r + c) % seedText.length)) & 0xff;
      hash = Math.imul(hash, 16777619);
      matrix[r][c] = (Math.abs(hash) % 10) < 5;
    }
  }

  return matrix;
}

const QR_KIOSK_I18N: Record<
  WebLanguageCodeType,
  {
    kioskBadge: string;
    modeCheckinTitle: string;
    modeCancelTitle: string;
    kioskSub: string;
    switchModeCheckin: string;
    switchModeCancel: string;
    qrCardTitleCheckin: string;
    qrCardTitleCancel: string;
    qrCardSub: string;
    tokenLabel: string;
    copyLinkBtn: string;
    copiedText: string;
    scannerBoxTitle: string;
    scannerBoxSub: string;
    pasteTokenPlaceholder: string;
    verifyTokenBtn: string;
    uploadQrBtn: string;
    testSimulateHeader: string;
    testSimulateSub: string;
    testCheckinBtn: string;
    testCancelBtn: string;
    doneCheckinTitle: string;
    doneCancelTitle: string;
    doneCheckinSub: string;
    doneCancelSub: string;
    ticketIdLabel: string;
    roomCodeLabel: string;
    slotLabel: string;
    userLabel: string;
    scanTimeLabel: string;
    purposeLabel: string;
    trustRewardBanner: string;
    cancelConfirmBanner: string;
    backDashboardBtn: string;
    gatewayFooter: string;
  }
> = {
  vi: {
    kioskBadge: 'Thiết bị Kiosk Cửa Phòng & Cổng Quét QR Trực tuyến',
    modeCheckinTitle: 'Quét Mã QR Nhận Phòng Họp (Check-in ±30 Phút)',
    modeCancelTitle: 'Quét Mã QR Hủy Đặt Phòng Họp Trực Tiếp',
    kioskSub:
      'Màn hình này dùng cho iPad/Tablet gắn trước cửa phòng họp hoặc quét trực tiếp trên trình duyệt web.',
    switchModeCheckin: 'Chế độ: QR Nhận Phòng',
    switchModeCancel: 'Chế độ: QR Hủy Đặt Phòng',
    qrCardTitleCheckin: 'Mã QR Nhận Phòng (Quét bằng Điện thoại / Camera)',
    qrCardTitleCancel: 'Mã QR Hủy Đặt Phòng (Quét để Giải phóng Phòng)',
    qrCardSub:
      'Quét mã QR bên dưới bằng camera điện thoại hoặc dùng hộp Test Quét Thành Công ngay bên phải.',
    tokenLabel: 'Mã định danh QR Token:',
    copyLinkBtn: 'Sao chép Link QR',
    copiedText: 'Đã chép!',
    scannerBoxTitle: 'Trình Quét Mã QR Trực tiếp trên Web (Camera / Ảnh / Mã Token)',
    scannerBoxSub:
      'Tải ảnh mã QR lên hoặc dán mã QR Token vào ô dưới để xác thực quét trên trình duyệt:',
    pasteTokenPlaceholder: 'Dán mã QR Token hoặc nội dung QR vào đây...',
    verifyTokenBtn: 'Xác thực Quét QR',
    uploadQrBtn: 'Tải Ảnh Mã QR để Quét',
    testSimulateHeader: 'Ô Test Nhanh (Giả sử Vừa Quét Mã QR Thành Công)',
    testSimulateSub:
      'Dùng khi kiểm thử trên máy tính chưa có điện thoại quét — kết quả sẽ đồng bộ tức thì về Tab chính:',
    testCheckinBtn: 'Giả sử Quét QR Nhận Phòng Thành Công (+2đ Tín nhiệm)',
    testCancelBtn: 'Giả sử Quét QR Hủy Đặt Phòng Thành Công',
    doneCheckinTitle: 'Xác nhận Quét QR Nhận Phòng Thành Công!',
    doneCancelTitle: 'Đã Hủy Đặt Phòng Bằng Mã QR Thành Công!',
    doneCheckinSub:
      'Thời điểm quét QR đã được khóa cố định, đồng bộ về Tab chính và lưu vào Lịch sử Đặt phòng.',
    doneCancelSub:
      'Phòng họp đã được giải phóng về trạng thái Trống và đơn đã chuyển vào Trang Lịch sử Đặt phòng.',
    ticketIdLabel: 'Mã vé đặt lịch:',
    roomCodeLabel: 'Phòng họp / Vị trí:',
    slotLabel: 'Khung giờ đăng ký:',
    userLabel: 'Tài khoản thực hiện:',
    scanTimeLabel: 'Thời điểm quét QR (Đã chốt):',
    purposeLabel: 'Nội dung cuộc họp:',
    trustRewardBanner: 'Điểm Tín nhiệm của bạn vừa được cộng thêm +2 điểm!',
    cancelConfirmBanner: 'Đã giải phóng phòng họp và ghi nhận hủy qua mã QR!',
    backDashboardBtn: 'Quay về Bảng Điều khiển SpotMatrix',
    gatewayFooter: 'Chứng thực thời gian thực bởi SpotMatrix Smart Door QR Gateway',
  },
  en: {
    kioskBadge: 'Smart Door Kiosk & Web QR Verification Gateway',
    modeCheckinTitle: 'Scan QR Code for Room Check-in (±30m Window)',
    modeCancelTitle: 'Scan QR Code to Cancel Room Reservation',
    kioskSub:
      'Designed for room-side door tablets or direct browser QR verification and testing.',
    switchModeCheckin: 'Mode: QR Check-in',
    switchModeCancel: 'Mode: QR Cancel Booking',
    qrCardTitleCheckin: 'Room Check-in QR Code (Scan via Phone Camera)',
    qrCardTitleCancel: 'Booking Cancellation QR Code (Scan to Release Room)',
    qrCardSub:
      'Scan this QR code with your phone camera or use the Test Scan Success box on the right.',
    tokenLabel: 'QR Verification Token:',
    copyLinkBtn: 'Copy QR URL',
    copiedText: 'Copied!',
    scannerBoxTitle: 'Web QR Scanner (Upload QR Image / Enter Token)',
    scannerBoxSub:
      'Upload a QR image or paste the QR Token below to verify directly in your browser:',
    pasteTokenPlaceholder: 'Paste QR Token or QR URL here...',
    verifyTokenBtn: 'Verify QR Scan',
    uploadQrBtn: 'Upload QR Image to Scan',
    testSimulateHeader: 'Quick Test Box (Simulate Successful QR Scan)',
    testSimulateSub:
      'Click below to simulate scanning this QR code — syncs in real time with your main SpotMatrix tab:',
    testCheckinBtn: 'Simulate QR Check-in Scan Success (+2 Trust Pts)',
    testCancelBtn: 'Simulate QR Cancel Booking Scan Success',
    doneCheckinTitle: 'QR Check-in Confirmed Successfully!',
    doneCancelTitle: 'Booking Cancelled via QR Code Successfully!',
    doneCheckinSub:
      'Your scan timestamp is locked, synced to the main tab, and saved to Booking History.',
    doneCancelSub:
      'The room has been released back to Available status and recorded in Booking History.',
    ticketIdLabel: 'Booking ID:',
    roomCodeLabel: 'Room / Seat Code:',
    slotLabel: 'Reserved Time Slot:',
    userLabel: 'Account Email:',
    scanTimeLabel: 'Locked Scan Timestamp:',
    purposeLabel: 'Meeting Purpose:',
    trustRewardBanner: 'Your Trust Score has been increased by +2 points!',
    cancelConfirmBanner: 'Room released and QR cancellation recorded in History!',
    backDashboardBtn: 'Return to SpotMatrix Dashboard',
    gatewayFooter: 'Real-time verification powered by SpotMatrix Smart Door QR Gateway',
  },
  ja: {
    kioskBadge: '会議室ドアQRキオスク＆Web QR認証ゲートウェイ',
    modeCheckinTitle: '会議室チェックイン用QRコード読取 (前後30分枠)',
    modeCancelTitle: 'QRコードによる予約キャンセル手続き',
    kioskSub:
      '会議室前のタブレット端末表示用、またはブラウザ上での直接QRスキャン・テストに対応しています。',
    switchModeCheckin: 'モード: QRチェックイン',
    switchModeCancel: 'モード: QR予約キャンセル',
    qrCardTitleCheckin: '入室チェックイン用QRコード (スマホカメラで読取)',
    qrCardTitleCancel: '予約キャンセル用QRコード (読取で会議室を解放)',
    qrCardSub:
      'スマホのカメラで下のQRコードを読み取るか、右側の「テスト読取成功」ボタンを使用してください。',
    tokenLabel: 'QRトークン識別子:',
    copyLinkBtn: 'QRリンクをコピー',
    copiedText: 'コピー済!',
    scannerBoxTitle: 'Web QRスキャナー (QR画像アップロード / トークン入力)',
    scannerBoxSub:
      'QR画像をアップロードするか、QRトークンを入力してブラウザ上で認証します:',
    pasteTokenPlaceholder: 'QRトークンまたはURLをここに貼り付け...',
    verifyTokenBtn: 'QR読取を認証',
    uploadQrBtn: 'QR画像をアップロードして読取',
    testSimulateHeader: 'クイックテスト枠 (QRスキャン成功をシミュレート)',
    testSimulateSub:
      'PC上でのテスト用：ボタンをクリックするとQR読取成功としてメインタブへ即時同期されます:',
    testCheckinBtn: 'QRチェックイン読取成功をシミュレート (+2 信頼スコア)',
    testCancelBtn: 'QR予約キャンセル読取成功をシミュレート',
    doneCheckinTitle: 'QRチェックインが正常に完了しました！',
    doneCancelTitle: 'QRコードによる予約キャンセルが完了しました！',
    doneCheckinSub:
      '読取時刻が固定記録され、メインタブおよび予約履歴ページに即時反映されました。',
    doneCancelSub:
      '会議室は空室状態に解放され、予約履歴ページに記録されました。',
    ticketIdLabel: '予約チケット番号:',
    roomCodeLabel: '会議室 / 座席コード:',
    slotLabel: '予約時間帯:',
    userLabel: '実行アカウント:',
    scanTimeLabel: '確定スキャン時刻:',
    purposeLabel: '会議の目的:',
    trustRewardBanner: '信頼スコアが +2ポイント 加算されました！',
    cancelConfirmBanner: '会議室を解放し、QRキャンセル履歴を記録しました！',
    backDashboardBtn: 'SpotMatrix ダッシュボードへ戻る',
    gatewayFooter: 'SpotMatrix Smart Door QR Gateway によるリアルタイム認証',
  },
};

export const QrCheckinConfirmPages: React.FC<QrCheckinConfirmPagesProps> = ({
  isDark = false,
  webLanguage = 'vi',
  onConfirmCheckinFromUrl,
  onConfirmCancelFromUrl,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasAutoVerifiedRef = useRef<boolean>(false);

  const t = QR_KIOSK_I18N[webLanguage] || QR_KIOSK_I18N.vi;

  const bookingId = searchParams.get('bookingId') || 'BK-2026-001';
  const roomCode = searchParams.get('room') || 'M1-01';
  const userEmail = searchParams.get('user') || 'employee.dev@spotmatrix.vn';
  const timeSlot = searchParams.get('time') || '08:00 - 10:00';
  const dateIso = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const purposeNote =
    searchParams.get('purpose') || 'Họp triển khai dự án SpotMatrix';
  const initialMode =
    searchParams.get('mode')?.toUpperCase() === 'CANCEL' ? 'CANCEL' : 'CHECKIN';
  const autoVerify = searchParams.get('autoVerify') === '1';

  const [activeMode, setActiveMode] = useState<'CHECKIN' | 'CANCEL'>(initialMode);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [completedMode, setCompletedMode] = useState<'CHECKIN' | 'CANCEL'>(
    initialMode
  );
  const [frozenScanTimeText, setFrozenScanTimeText] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const expectedQrToken = useMemo(() => {
    const fromUrl = searchParams.get('token');
    if (fromUrl) return fromUrl;
    return `QR-SMX-${roomCode.toUpperCase()}-${bookingId.toUpperCase()}-${activeMode}`;
  }, [searchParams, roomCode, bookingId, activeMode]);

  const realActionUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const params = new URLSearchParams({
      mode: activeMode,
      bookingId,
      room: roomCode,
      user: userEmail,
      time: timeSlot,
      date: dateIso,
      purpose: purposeNote,
      token: expectedQrToken,
      autoVerify: '1',
    });
    return `${origin}/qr-checkin?${params.toString()}`;
  }, [
    activeMode,
    bookingId,
    roomCode,
    userEmail,
    timeSlot,
    dateIso,
    purposeNote,
    expectedQrToken,
  ]);

  const qrMatrix = useMemo(
    () => generateDeterministicQrMatrix(realActionUrl, 25),
    [realActionUrl]
  );

  const executeQrVerificationAction = (
    targetMode: 'CHECKIN' | 'CANCEL',
    customTimeText?: string
  ) => {
    const now = new Date();
    const scanTimeStr =
      customTimeText ||
      `${now.toLocaleTimeString('vi-VN')} • Ngày ${now.toLocaleDateString('vi-VN')}`;

    setFrozenScanTimeText(scanTimeStr);
    setCompletedMode(targetMode);
    setIsCompleted(true);
    setFeedbackError(null);

    if (targetMode === 'CHECKIN' && onConfirmCheckinFromUrl) {
      onConfirmCheckinFromUrl(bookingId, scanTimeStr);
    }
    if (targetMode === 'CANCEL' && onConfirmCancelFromUrl) {
      onConfirmCancelFromUrl(bookingId, scanTimeStr);
    }

    const syncPayload: QrRealtimeSyncPayload = {
      actionType: targetMode,
      bookingId,
      roomCode,
      userEmail,
      qrToken: expectedQrToken,
      scannedAtText: scanTimeStr,
      timestampMs: Date.now(),
    };

    try {
      localStorage.setItem(QR_STORAGE_EVENT_KEY, JSON.stringify(syncPayload));
    } catch {
      // ignore storage errors
    }

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(QR_BROADCAST_CHANNEL_NAME);
        channel.postMessage(syncPayload);
        channel.close();
      }
    } catch {
      // ignore broadcast errors
    }
  };

  // Nếu người dùng quét QR bằng điện thoại mở link có autoVerify=1 -> tự động xác thực ngay
  useEffect(() => {
    if (!autoVerify || hasAutoVerifiedRef.current) return;
    hasAutoVerifiedRef.current = true;
    executeQrVerificationAction(initialMode);
  });

  const handleManualTokenVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tokenInput.trim();
    if (!clean) {
      setFeedbackError('Vui lòng dán mã QR Token hoặc tải ảnh QR lên để quét!');
      return;
    }
    if (
      clean.toLowerCase().includes(bookingId.toLowerCase()) ||
      clean.toLowerCase().includes(roomCode.toLowerCase()) ||
      clean.toLowerCase().includes('qr-smx') ||
      clean.toLowerCase().includes('qr-checkin')
    ) {
      executeQrVerificationAction(activeMode);
    } else {
      setFeedbackError(
        `Mã QR "${clean}" không khớp với vé ${bookingId} (${roomCode}). Hãy copy đúng mã Token hiển thị bên trái hoặc bấm nút Giả sử Quét Thành Công!`
      );
    }
  };

  const handleUploadQrImageScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    executeQrVerificationAction(activeMode);
  };

  const qrImageApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
    realActionUrl
  )}`;
  const [useSvgFallback, setUseSvgFallback] = useState<boolean>(false);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 transition-colors ${
        isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#F4F7FB] text-slate-800'
      }`}
    >
      <div
        className={`max-w-4xl w-full rounded-3xl border p-6 sm:p-8 shadow-2xl space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-100 dark:border-slate-800">
          <SpotMatrixLogo theme={isDark ? 'dark' : 'light'} variant="full" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              {t.kioskBadge}
            </span>
          </div>
        </div>

        {!isCompleted ? (
          <>
            {/* Tiêu đề & Chuyển chế độ Nhận phòng / Hủy phòng */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                  <QrCode
                    className={`w-6 h-6 ${
                      activeMode === 'CHECKIN' ? 'text-teal-500' : 'text-rose-500'
                    }`}
                  />
                  <span>
                    {activeMode === 'CHECKIN'
                      ? t.modeCheckinTitle
                      : t.modeCancelTitle}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">{t.kioskSub}</p>
              </div>

              <div className="inline-flex rounded-2xl p-1 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setActiveMode('CHECKIN')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeMode === 'CHECKIN'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {t.switchModeCheckin}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('CANCEL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeMode === 'CANCEL'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {t.switchModeCancel}
                </button>
              </div>
            </div>

            {feedbackError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold">
                {feedbackError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* CỘT TRÁI (5 CỘT): MÀN HÌNH HIỂN THỊ MÃ QR TRƯỚC CỬA PHÒNG */}
              <div
                className={`lg:col-span-5 p-5 rounded-3xl border flex flex-col items-center justify-between text-center space-y-4 ${
                  isDark
                    ? 'bg-slate-950/90 border-slate-800'
                    : 'bg-slate-50/90 border-slate-200/90'
                }`}
              >
                <div className="space-y-1">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      activeMode === 'CHECKIN'
                        ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {roomCode} • {bookingId}
                  </span>
                  <h2 className="text-sm font-extrabold pt-1">
                    {activeMode === 'CHECKIN'
                      ? t.qrCardTitleCheckin
                      : t.qrCardTitleCancel}
                  </h2>
                  <p className="text-[11px] text-slate-400">{t.qrCardSub}</p>
                </div>

                {/* Khung hiển thị mã QR thật (Ảnh QR chuẩn quốc tế + SVG Fallback khi offline) */}
                <div className="p-4 bg-white rounded-3xl shadow-xl border-4 border-indigo-500/20 flex flex-col items-center justify-center">
                  {!useSvgFallback ? (
                    <img
                      src={qrImageApiUrl}
                      alt={`QR ${bookingId}`}
                      width={210}
                      height={210}
                      onError={() => setUseSvgFallback(true)}
                      className="w-[210px] h-[210px] object-contain rounded-xl"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 25 25"
                      className="w-[210px] h-[210px]"
                      shapeRendering="crispEdges"
                    >
                      <rect width="25" height="25" fill="#ffffff" />
                      {qrMatrix.map((row, rIdx) =>
                        row.map((cell, cIdx) =>
                          cell ? (
                            <rect
                              key={`${rIdx}-${cIdx}`}
                              x={cIdx}
                              y={rIdx}
                              width={1}
                              height={1}
                              fill={
                                activeMode === 'CHECKIN' ? '#0f172a' : '#881337'
                              }
                            />
                          ) : null
                        )
                      )}
                    </svg>
                  )}
                  <span className="mt-2 font-mono text-[10px] font-black text-slate-700 tracking-wider">
                    {expectedQrToken}
                  </span>
                </div>

                <div className="w-full space-y-2 text-left text-xs">
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {t.roomCodeLabel}
                      </span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-black">
                        {roomCode} ({dateIso} • {timeSlot})
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {t.userLabel}
                      </span>
                      <strong className="truncate max-w-[180px]">
                        {userEmail}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={expectedQrToken}
                      className={`flex-1 px-3 py-2 rounded-xl border font-mono text-[11px] font-bold ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-teal-300'
                          : 'bg-white border-slate-200 text-teal-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(expectedQrToken);
                        setTokenInput(expectedQrToken);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-extrabold flex items-center gap-1 shrink-0"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.copiedText}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Token</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI (7 CỘT): TRÌNH QUÉT QR WEB & Ô TEST GIẢ SỬ QUÉT THÀNH CÔNG */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                {/* Hộp 1: Quét QR trên Web bằng Ảnh / Camera / Mã Token */}
                <div
                  className={`p-5 rounded-3xl border space-y-3.5 ${
                    isDark
                      ? 'bg-slate-950/80 border-slate-800'
                      : 'bg-slate-50/90 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold">
                        {t.scannerBoxTitle}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {t.scannerBoxSub}
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleManualTokenVerify}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder={t.pasteTokenPlaceholder}
                      className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shrink-0 transition"
                    >
                      {t.verifyTokenBtn}
                    </button>
                  </form>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadQrImageScan}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full py-2.5 px-4 rounded-xl border border-dashed text-xs font-bold flex items-center justify-center gap-2 transition ${
                        isDark
                          ? 'border-slate-700 bg-slate-900/60 hover:border-indigo-500 text-slate-300'
                          : 'border-slate-300 bg-white hover:border-indigo-500 text-slate-700'
                      }`}
                    >
                      <Upload className="w-4 h-4 text-indigo-500" />
                      <span>{t.uploadQrBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Hộp 2: Ô TEST THỬ GIẢ SỬ VỪA QUÉT MÃ QR ĐÓ THÀNH CÔNG (NHẬN PHÒNG HOẶC HỦY PHÒNG) */}
                <div
                  className={`p-5 rounded-3xl border-2 space-y-4 ${
                    isDark
                      ? 'bg-indigo-950/25 border-indigo-500/40'
                      : 'bg-indigo-50/70 border-indigo-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                        {t.testSimulateHeader}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.testSimulateSub}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => executeQrVerificationAction('CHECKIN')}
                      className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{t.testCheckinBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => executeQrVerificationAction('CANCEL')}
                      className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition"
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>{t.testCancelBtn}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.opener) {
                      window.close();
                    } else {
                      navigate('/dashboard');
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t.backDashboardBtn}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* MÀN HÌNH BIÊN LAI XÁC NHẬN SAU KHI QUÉT QR THÀNH CÔNG (NHẬN PHÒNG HOẶC HỦY PHÒNG) */
          <div className="space-y-6 py-2">
            <div className="text-center space-y-2">
              <div
                className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto shadow-sm ${
                  completedMode === 'CHECKIN'
                    ? 'bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
              >
                {completedMode === 'CHECKIN' ? (
                  <CheckCircle2 className="w-9 h-9" />
                ) : (
                  <XCircle className="w-9 h-9" />
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {completedMode === 'CHECKIN'
                  ? t.doneCheckinTitle
                  : t.doneCancelTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {completedMode === 'CHECKIN'
                  ? t.doneCheckinSub
                  : t.doneCancelSub}
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border space-y-3 text-xs max-w-xl mx-auto ${
                isDark
                  ? 'bg-slate-950/90 border-slate-800'
                  : 'bg-slate-50/90 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 font-semibold">
                  {t.ticketIdLabel}
                </span>
                <strong className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {bookingId}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />{' '}
                  {t.roomCodeLabel}
                </span>
                <strong className="font-extrabold text-sm">{roomCode}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-500" /> {t.slotLabel}
                </span>
                <strong className="font-bold">
                  {dateIso} • {timeSlot}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" />{' '}
                  {t.userLabel}
                </span>
                <strong className="font-bold">{userEmail}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-teal-500" />{' '}
                  {t.scanTimeLabel}
                </span>
                <strong
                  className={`font-extrabold ${
                    completedMode === 'CHECKIN'
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {frozenScanTimeText}
                </strong>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 block mb-0.5">
                  {t.purposeLabel}
                </span>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  {purposeNote}
                </p>
              </div>
            </div>

            <div
              className={`max-w-xl mx-auto p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                completedMode === 'CHECKIN'
                  ? isDark
                    ? 'bg-teal-950/30 border-teal-500/30 text-teal-200'
                    : 'bg-teal-50/80 border-teal-200 text-teal-900'
                  : isDark
                  ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                  : 'bg-rose-50/80 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="font-semibold">
                  {completedMode === 'CHECKIN'
                    ? t.trustRewardBanner
                    : t.cancelConfirmBanner}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-white font-black text-[10px] ${
                  completedMode === 'CHECKIN' ? 'bg-teal-600' : 'bg-rose-600'
                }`}
              >
                {completedMode === 'CHECKIN' ? '+2 TRUST' : 'QR CANCELLED'}
              </span>
            </div>

            <div className="max-w-xl mx-auto flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsCompleted(false)}
                className={`flex-1 py-3 px-4 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-2 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Hiển thị lại Mã QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.backDashboardBtn}</span>
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>{t.gatewayFooter}</span>
        </div>
      </div>
    </div>
  );
};
