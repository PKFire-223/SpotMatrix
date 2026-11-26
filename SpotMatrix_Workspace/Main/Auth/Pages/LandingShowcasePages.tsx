import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Layers,
  ShieldCheck,
  QrCode,
  Building2,
  Cpu,
  ArrowRight,
  Sun,
  Moon,
  Globe,
  CheckCircle2,
  Lock,
  Radio,
  Compass,
  Award,
  Monitor,
  Users,
  ChevronDown,
  Eye,
  Play,
  Pause,
  Film,
} from 'lucide-react';
import { SpotMatrixLogo } from '../../../Shared/Components/SpotMatrixLogo';
import { WebLanguageCodeType } from '../../../Shared/Types/GlobalSystemTypes';
import { SpotMatrixHeroCanvas3D } from '../Function/Components/SpotMatrixHeroCanvas3D';

export interface LandingShowcasePagesProps {
  isDark: boolean;
  webLanguage: WebLanguageCodeType;
  isAuthenticated: boolean;
  onToggleTheme: () => void;
  onChangeWebLanguage: (nextLang: WebLanguageCodeType) => void;
  onNavigateToLogin: () => void;
  onNavigateToDashboard: () => void;
}

interface LandingTranslationPack {
  navBadge: string;
  chapterLabels: [string, string, string, string];
  ctaEnterSystem: string;
  ctaBackDashboard: string;
  heroTagline: string;
  heroTitlePrefix: string;
  heroTitleHighlight: string;
  heroDescription: string;
  stat1Label: string;
  stat1Sub: string;
  stat2Label: string;
  stat2Sub: string;
  stat3Label: string;
  stat3Sub: string;
  stat4Label: string;
  stat4Sub: string;
  floorInspectorTitle: string;
  floorResetBtn: string;
  floorBadges: Array<{ floor: number; code: string; sub: string }>;
  chapter2Badge: string;
  chapter2Title: string;
  chapter2Desc: string;
  ch2Box1Title: string;
  ch2Box1Desc: string;
  ch2Box2Title: string;
  ch2Box2Desc: string;
  ch2FloorPickLabel: string;
  chapter3Badge: string;
  chapter3Title: string;
  chapter3Desc: string;
  ch3Mode1Title: string;
  ch3Mode1Desc: string;
  ch3Mode2Title: string;
  ch3Mode2Desc: string;
  ch3FocusBtn: string;
  chapter4Badge: string;
  chapter4Title: string;
  chapter4Desc: string;
  ch4Card1Title: string;
  ch4Card1Desc: string;
  ch4Card2Title: string;
  ch4Card2Desc: string;
  ch4Card3Title: string;
  ch4Card3Desc: string;
  scrollHint: string;
  inspect3dToggle: string;
  lockingFloorToast: (fl: number) => string;
}

const LANDING_TRANSLATIONS: Record<WebLanguageCodeType, LandingTranslationPack> = {
  vi: {
    navBadge: 'Cổng Đặt Phòng Nội Bộ Doanh Nghiệp • 3D/2D',
    chapterLabels: [
      '01. Tổng quan',
      '02. 24 Phòng họp',
      '03. Hội trường H-01',
      '04. Quy trình & QR',
    ],
    ctaEnterSystem: 'Đăng nhập Nội bộ',
    ctaBackDashboard: 'Vào Bảng Điều Khiển',
    heroTagline: 'HỆ THỐNG ĐẶT PHÒNG HỌP & HỘI TRƯỜNG NỘI BỘ CÔNG TY',
    heroTitlePrefix: 'Đặt Phòng Họp & Điều Phối ',
    heroTitleHighlight: 'Không Gian 5 Tầng Tức Thì',
    heroDescription:
      'Giải pháp quản lý lịch họp nội bộ dành riêng cho nhân sự công ty: trực quan hóa 24 phòng họp tiêu chuẩn (Tầng 1–4) và Hội trường La Mã 30 chỗ (Tầng 5) trên sơ đồ 3D/2D, kiểm tra thiết bị phòng họp, phê duyệt theo cấp bậc và quét mã QR nhận phòng.',
    stat1Label: 'Không gian 5 Tầng',
    stat1Sub: '24 Phòng & 1 Hội trường',
    stat2Label: 'Ghế Hội trường',
    stat2Sub: 'H01-A1..C12 (Tầng 5)',
    stat3Label: 'Thiết bị Đi kèm',
    stat3Sub: 'TV 4K, Máy chiếu, Loa',
    stat4Label: 'Nhận phòng QR',
    stat4Sub: 'Trước/Trễ 30p (+2đ)',
    floorInspectorTitle: 'Chọn nhanh mặt cắt từng tầng trong tòa nhà công ty:',
    floorResetBtn: 'Bỏ khóa góc nhìn',
    floorBadges: [
      { floor: 1, code: 'Tầng 1 (M1-01..06)', sub: '6 Phòng họp • 8 Thiết bị' },
      { floor: 2, code: 'Tầng 2 (M2-01..06)', sub: '6 Phòng họp • 7 Thiết bị' },
      { floor: 3, code: 'Tầng 3 (M3-01..06)', sub: '6 Phòng họp • 7 Thiết bị' },
      { floor: 4, code: 'Tầng 4 (M4-01..06)', sub: '6 Phòng họp • 6 Thiết bị' },
      { floor: 5, code: 'Tầng 5 (Hội trường H-01)', sub: '30 Ghế vòm • Sự kiện' },
    ],
    chapter2Badge: 'TẦNG 1 – TẦNG 4 • 24 PHÒNG HỌP TIÊU CHUẨN',
    chapter2Title: 'Tra Cứu Phòng Trống & Thiết Bị Trước Khi Đặt Lịch',
    chapter2Desc:
      'Nhân viên và Quản lý dễ dàng kiểm tra trạng thái phòng thực tế (Còn trống, Chờ duyệt, Đang họp), sức chứa từ 2 đến 12 người và danh mục thiết bị đi kèm ngay trên mặt bằng 3D/2D.',
    ch2Box1Title: 'Phân quyền Đặt phòng Rõ ràng',
    ch2Box1Desc:
      'Admin & Quản lý đặt phòng duyệt ngay; Nhân viên gửi yêu cầu kèm lý do xin phép để Quản lý phê duyệt minh bạch.',
    ch2Box2Title: '30 Thiết bị Định danh theo Phòng',
    ch2Box2Desc:
      'Mỗi phòng đều gắn sẵn TV 4K, máy chiếu Laser, loa hội nghị hoặc bảng vẽ Wacom để chọn đúng nhu cầu cuộc họp.',
    ch2FloorPickLabel: 'Xem nhanh mặt bằng từng tầng:',
    chapter3Badge: 'TẦNG 5 • HỘI TRƯỜNG ĐẤU TRƯỜNG LA MÃ (H-01)',
    chapter3Title: 'Điều Phối Sự Kiện Công Ty & Đặt Chỗ Ngồi Theo Phòng Ban',
    chapter3Desc:
      'Hội trường lớn 30 ghế vòm trên Tầng 5 vận hành theo 2 chế độ chặt chẽ nhằm phục vụ các buổi họp toàn công ty, đào tạo và báo cáo quý.',
    ch3Mode1Title: '1. Chế độ Thuê Cả Hội Trường (HALL_EVENT_RENTAL)',
    ch3Mode1Desc:
      'Dành cho Admin (duyệt ngay) và Quản lý (kèm lý do chờ duyệt) để mở sự kiện và chỉ định các Phòng ban được phép tham dự.',
    ch3Mode2Title: '2. Chế độ Đặt Ghế Ngồi (HALL_SEAT_BOOKING)',
    ch3Mode2Desc:
      'Khi có sự kiện được duyệt, nhân sự thuộc các phòng ban được phép sẽ chọn ghế ngồi cụ thể (H01-A1..C12) và nhận mã QR.',
    ch3FocusBtn: 'Xem Góc Nhìn 3D Hội Trường Tầng 5',
    chapter4Badge: 'QUY TRÌNH NHẬN PHÒNG & KỶ LUẬT SỬ DỤNG',
    chapter4Title: 'Chống Đặt Trùng Lịch, Quét QR ±30 Phút & Điểm Tín Nhiệm',
    chapter4Desc:
      'Đảm bảo tài nguyên phòng họp nội bộ luôn được sử dụng hiệu quả, tránh giữ phòng ảo mà không đến họp.',
    ch4Card1Title: 'Chống Đặt Trùng Lịch',
    ch4Card1Desc:
      'Cơ chế Optimistic Lock ngăn chặn 2 người đặt trùng cùng 1 phòng ở cùng khung giờ.',
    ch4Card2Title: 'Quét QR Check-in ±30p',
    ch4Card2Desc:
      'Mở quét mã từ 30p trước đến 30p sau giờ bắt đầu (+2đ). Quá 15p vắng mặt tự thu hồi phòng (-10đ).',
    ch4Card3Title: 'Phòng Ban & Bảo Mật IP',
    ch4Card3Desc:
      'Mỗi nhân sự thuộc 1 phòng ban và nhiều nhóm chuyên môn, kèm cảnh báo khi đăng nhập từ nhiều IP.',
    scrollHint: 'Xem chi tiết quy trình bên dưới',
    inspect3dToggle: 'Ẩn chữ ngắm 3D',
    lockingFloorToast: (fl) =>
      `Đang xem cận cảnh Tầng ${fl} ${
        fl === 5 ? '(Hội trường H-01)' : `(Phòng M${fl}-01..06)`
      }`,
  },
  en: {
    navBadge: 'Internal Corporate Room Booking • 3D/2D',
    chapterLabels: [
      '01. Overview',
      '02. 24 Rooms',
      '03. Hall H-01',
      '04. Rules & QR',
    ],
    ctaEnterSystem: 'Employee Sign In',
    ctaBackDashboard: 'Open Dashboard',
    heroTagline: 'INTERNAL COMPANY MEETING ROOM & HALL BOOKING SYSTEM',
    heroTitlePrefix: 'Book Meeting Rooms & Coordinate ',
    heroTitleHighlight: '5 Office Floors Instantly',
    heroDescription:
      'Built for internal company teams: check real-time availability across 24 standard meeting rooms (Floors 1–4) and the 30-seat Colosseum Hall (Floor 5) in 3D/2D, verify room equipment, submit approval requests, and check in via QR.',
    stat1Label: '5 Office Floors',
    stat1Sub: '24 Rooms & 1 Main Hall',
    stat2Label: 'Hall Tiered Seats',
    stat2Sub: 'H01-A1..C12 (Floor 5)',
    stat3Label: 'Room Devices',
    stat3Sub: '4K TV, Projector, Audio',
    stat4Label: 'QR Check-in',
    stat4Sub: '±30m Window (+2 pts)',
    floorInspectorTitle: 'Quickly inspect any floor in the building:',
    floorResetBtn: 'Reset Camera',
    floorBadges: [
      { floor: 1, code: 'Floor 1 (M1-01..06)', sub: '6 Rooms • 8 Devices' },
      { floor: 2, code: 'Floor 2 (M2-01..06)', sub: '6 Rooms • 7 Devices' },
      { floor: 3, code: 'Floor 3 (M3-01..06)', sub: '6 Rooms • 7 Devices' },
      { floor: 4, code: 'Floor 4 (M4-01..06)', sub: '6 Rooms • 6 Devices' },
      { floor: 5, code: 'Floor 5 (Hall H-01)', sub: '30 Seats • Events' },
    ],
    chapter2Badge: 'FLOORS 1 – 4 • 24 STANDARD MEETING ROOMS',
    chapter2Title: 'Check Room Availability & Equipment Before Booking',
    chapter2Desc:
      'Staff and managers can inspect live room status (Available, Pending Approval, Occupied), seating capacity (2–12 seats), and dedicated AV equipment on the 3D/2D map.',
    ch2Box1Title: 'Role-Based Booking Workflow',
    ch2Box1Desc:
      'Admins & Managers book immediately; Employees submit a booking reason for fast manager approval.',
    ch2Box2Title: '30 Dedicated Room Devices',
    ch2Box2Desc:
      'Every room is equipped with 4K displays, laser projectors, conference audio, or Wacom tablets.',
    ch2FloorPickLabel: 'Inspect individual floors:',
    chapter3Badge: 'FLOOR 5 • COLOSSEUM AMPHITHEATER HALL (H-01)',
    chapter3Title: 'Company Townhalls & Department Seat Reservations',
    chapter3Desc:
      'The 30-seat amphitheater on Floor 5 operates with two governance modes for townhalls, workshops, and quarterly reviews.',
    ch3Mode1Title: '1. Whole-Hall Event Rental (HALL_EVENT_RENTAL)',
    ch3Mode1Desc:
      'Admins (instant) and Managers (with approval reason) book the hall and select allowed departments.',
    ch3Mode2Title: '2. Individual Seat Booking (HALL_SEAT_BOOKING)',
    ch3Mode2Desc:
      'Once an event is approved, members of eligible departments reserve seats (H01-A1..C12) and receive QR passes.',
    ch3FocusBtn: 'Focus 3D Camera on Floor 5 Hall',
    chapter4Badge: 'CHECK-IN POLICY & FAIR USAGE',
    chapter4Title: 'Conflict-Free Booking, ±30m QR Check-in & Trust Score',
    chapter4Desc:
      'Keep company meeting spaces utilized fairly and automatically release unused rooms.',
    ch4Card1Title: 'Zero Double-Booking',
    ch4Card1Desc:
      'Optimistic Locking prevents simultaneous conflicting reservations on the same room.',
    ch4Card2Title: '±30m QR Check-in',
    ch4Card2Desc:
      'Scan within ±30 mins of start time (+2 pts). Rooms auto-release after 15 mins of no-show (-10 pts).',
    ch4Card3Title: 'Teams & IP Security',
    ch4Card3Desc:
      'Single-department & multi-group structure with multi-IP login anomaly alerts.',
    scrollHint: 'Explore booking workflow below',
    inspect3dToggle: 'Pure 3D View',
    lockingFloorToast: (fl) =>
      `Focusing 3D Camera on Floor ${fl} ${
        fl === 5 ? '(Colosseum Hall H-01)' : `(Rooms M${fl}-01..06)`
      }`,
  },
  ja: {
    navBadge: '社内会議室・ホール予約ポータル • 3D/2D',
    chapterLabels: [
      '01. システム概要',
      '02. 24会議室',
      '03. 5階ホール H-01',
      '04. 利用規約・QR',
    ],
    ctaEnterSystem: '社員ログイン',
    ctaBackDashboard: 'ダッシュボードへ',
    heroTagline: '社内向け会議室・5階大ホール予約管理システム',
    heroTitlePrefix: '社内会議室と5階ホールを ',
    heroTitleHighlight: '3D/2Dマップで即時予約',
    heroDescription:
      '社員・マネージャー向けの社内施設予約プラットフォーム：1〜4階の標準会議室（24室）と5階コロッセオ大ホール（30席）の空き状況・備品を3D/2Dで確認し、申請理由の提出やQRチェックインを簡単に行えます。',
    stat1Label: '全5フロア構成',
    stat1Sub: '24会議室＆1大ホール',
    stat2Label: '大ホール座席',
    stat2Sub: 'H01-A1..C12 (5階)',
    stat3Label: '専用AV機器',
    stat3Sub: '4Kモニター・プロジェクター',
    stat4Label: 'QRチェックイン',
    stat4Sub: '前後30分以内 (+2点)',
    floorInspectorTitle: '各フロアを直接クリックして確認:',
    floorResetBtn: '視点をリセット',
    floorBadges: [
      { floor: 1, code: '1階 (M1-01..06)', sub: '6会議室 • 8機器' },
      { floor: 2, code: '2階 (M2-01..06)', sub: '6会議室 • 7機器' },
      { floor: 3, code: '3階 (M3-01..06)', sub: '6会議室 • 7機器' },
      { floor: 4, code: '4階 (M4-01..06)', sub: '6会議室 • 6機器' },
      { floor: 5, code: '5階 (大ホール H-01)', sub: '円弧30席 • イベント' },
    ],
    chapter2Badge: '1階〜4階 • 標準ガラス会議室（全24室）',
    chapter2Title: '空室状況と室内設備を予約前にひと目で確認',
    chapter2Desc:
      '各会議室（定員2〜12名）のリアルタイム状態（空室・承認待ち・使用中）や設置済みの4Kモニター・音響機器を3D/2Dマップ上で確認できます。',
    ch2Box1Title: '権限に応じた承認フロー',
    ch2Box1Desc:
      '管理者・マネージャーは即時予約可能。一般社員は利用理由を添えて申請し、迅速に承認を受けられます。',
    ch2Box2Title: '全25室に30台の専用機器を配備',
    ch2Box2Desc:
      '4K大型ディスプレイ、レーザープロジェクター、会議用マイクスピーカー、Wacom液タブを完備。',
    ch2FloorPickLabel: 'フロアを選択してフォーカス:',
    chapter3Badge: '5階 • コロッセオ大ホール (H-01)',
    chapter3Title: '全社イベント貸切と部署別座席予約の2段階運用',
    chapter3Desc:
      '5階の30席円形ホールは、社内勉強会・全体会議向けに「ホール全体貸切」と「個別座席予約」の2モードで運用されます。',
    ch3Mode1Title: '1. ホール全体貸切 (HALL_EVENT_RENTAL)',
    ch3Mode1Desc:
      '管理者（即時承認）およびマネージャー（申請理由付き）がイベントを登録し、参加対象部署を指定します。',
    ch3Mode2Title: '2. 個別座席予約 (HALL_SEAT_BOOKING)',
    ch3Mode2Desc:
      '承認済みイベントがある場合、対象部署の社員が座席（H01-A1..C12）を予約してQRコードを取得できます。',
    ch3FocusBtn: '5階大ホールを3Dカメラで拡大',
    chapter4Badge: 'チェックイン規則と公平な施設利用',
    chapter4Title: '重複予約ブロック・前後30分QRチェックイン・信頼スコア',
    chapter4Desc:
      'カラ予約を防ぎ、社内会議室をすべての部署が公平に利用できるルールを自動化しています。',
    ch4Card1Title: '重複予約の完全防止',
    ch4Card1Desc:
      '楽観的ロック（Optimistic Lock）により、同一時間帯の重複予約をミリ秒単位でブロックします。',
    ch4Card2Title: '前後30分 QRチェックイン',
    ch4Card2Desc:
      '開始30分前〜30分後にQR読取で+2点。15分経過しても未入室の場合は自動解放（-10点）されます。',
    ch4Card3Title: '所属部署＆複数IP警告',
    ch4Card3Desc:
      '1社員1部署・複数グループ所属に対応し、複数IPからの不審なログインを自動検知します。',
    scrollHint: '予約ルールと詳細を下にスクロール',
    inspect3dToggle: '3Dモデルのみ表示',
    lockingFloorToast: (fl) =>
      `${fl}階に3Dカメラを固定中 ${
        fl === 5 ? '(大ホール H-01)' : `(会議室 M${fl}-01..06)`
      }`,
  },
};

export const LandingShowcasePages: React.FC<LandingShowcasePagesProps> = ({
  isDark,
  webLanguage,
  isAuthenticated,
  onToggleTheme,
  onChangeWebLanguage,
  onNavigateToLogin,
  onNavigateToDashboard,
}) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [selectedFloorPreview, setSelectedFloorPreview] = useState<number | null>(null);
  const [pure3dInspectMode, setPure3dInspectMode] = useState<boolean>(false);
  const [isCinematicAutoFly, setIsCinematicAutoFly] = useState<boolean>(false);
  const [isScenePaused, setIsScenePaused] = useState<boolean>(false);

  const t = LANDING_TRANSLATIONS[webLanguage] || LANDING_TRANSLATIONS.vi;

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const currentRatio = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      setScrollProgress(currentRatio);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeChapter: 1 | 2 | 3 | 4 =
    scrollProgress < 0.28
      ? 1
      : scrollProgress < 0.58
      ? 2
      : scrollProgress < 0.82
      ? 3
      : 4;

  const scrollToChapterRatio = (targetRatio: number) => {
    setSelectedFloorPreview(null);
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1
    );
    window.scrollTo({
      top: targetRatio * maxScroll,
      behavior: 'smooth',
    });
  };

  return (
    <div
      className={`relative min-h-[380vh] w-full selection:bg-indigo-500 selection:text-white transition-colors duration-500 ${
        isDark ? 'bg-[#040711] text-slate-100' : 'bg-[#EEF4FF] text-slate-900'
      }`}
    >
      {/* LỚP NỀN WEBGL 3D THREE.JS SIÊU NÉT (HIỂN THỊ KHI MỚI VÀO TRANG HOẶC KHI TƯƠNG TÁC 3D) */}
      <SpotMatrixHeroCanvas3D
        scrollProgress={scrollProgress}
        activeChapter={activeChapter}
        selectedFloorPreview={selectedFloorPreview}
        isDark={isDark}
        isCinematicAutoFly={isCinematicAutoFly}
        isPaused={isScenePaused}
      />

      {/* LỚP BACKGROUND ẢNH TÒA NHÀ KIẾN TRÚC CỐ ĐỊNH PHÍA SAU KHI CUỘN XUỐNG ĐỌC NỘI DUNG */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-700"
        style={{
          opacity:
            pure3dInspectMode || isCinematicAutoFly || selectedFloorPreview !== null
              ? 0
              : Math.min(1, Math.max(0, (scrollProgress - 0.08) / 0.14)),
        }}
        aria-hidden="true"
      >
        <img
          src="/assets/spotmatrix-hq-backdrop.jpg"
          alt="SpotMatrix Architectural Headquarters Backdrop"
          className="w-full h-full object-cover object-center scale-105"
          style={{
            transform: `scale(${1.04 + scrollProgress * 0.05}) translateY(${-scrollProgress * 18}px)`,
          }}
        />
        <div
          className={`absolute inset-0 ${
            isDark
              ? 'bg-slate-950/75'
              : 'bg-white/78'
          }`}
        />
      </div>

      {/* LỚP PHỦ VIGNETTE GIÚP CHỮ BÊN TRÁI LUÔN RÕ NÉT TRÊN MỌI NỀN SÁNG/TỐI */}
      <div
        className={`pointer-events-none fixed inset-0 z-[2] transition-opacity duration-500 ${
          pure3dInspectMode ? 'opacity-0' : 'opacity-100'
        } ${
          isDark
            ? 'bg-gradient-to-r from-[#040711]/90 via-[#040711]/45 to-transparent'
            : 'bg-gradient-to-r from-white/90 via-white/45 to-transparent'
        }`}
      />

      {/* =====================================================================
          THANH ĐIỀU HƯỚNG KÍNH MỜ CỐ ĐỊNH (FLOATING SPECULAR GLASS NAVBAR)
         ===================================================================== */}
      <header className="fixed top-0 inset-x-0 z-30 px-4 sm:px-8 py-3">
        <div
          className={`max-w-7xl mx-auto rounded-2xl border px-4 sm:px-6 py-2.5 backdrop-blur-xl shadow-xl flex flex-wrap items-center justify-between gap-3 transition-colors ${
            isDark
              ? 'bg-slate-950/85 border-indigo-500/25 shadow-black/50'
              : 'bg-white/90 border-indigo-200/90 shadow-indigo-500/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <SpotMatrixLogo theme={isDark ? 'dark' : 'light'} variant="full" />
            <span
              className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                isDark
                  ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700'
              }`}
            >
              <Radio className="w-3 h-3 text-emerald-500" />
              {t.navBadge}
            </span>
          </div>



          {/* Cụm Nút Ngắm 3D, Chuyển đổi Ngôn ngữ (VI / EN / JA), Sáng/Tối & Nút vào Hệ thống */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPure3dInspectMode((prev) => !prev)}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-extrabold transition ${
                pure3dInspectMode
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-cyan-300 hover:border-cyan-500/50'
                  : 'bg-slate-100 border-slate-200 text-indigo-700 hover:border-indigo-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.inspect3dToggle}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedFloorPreview(null);
                setIsCinematicAutoFly((prev) => !prev);
                setIsScenePaused(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                isCinematicAutoFly
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {webLanguage === 'en'
                  ? isCinematicAutoFly
                    ? 'Auto-Fly: ON'
                    : 'Cinematic Tour'
                  : webLanguage === 'ja'
                  ? isCinematicAutoFly
                    ? '自動シネマ: ON'
                    : '3Dシネマ映像'
                  : isCinematicAutoFly
                  ? 'Phim 3D: Đang bay'
                  : 'Chế độ Phim 3D'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsScenePaused((prev) => !prev)}
              className={`p-2 rounded-xl border transition ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title={isScenePaused ? 'Play 3D' : 'Pause 3D'}
              aria-label={isScenePaused ? 'Play 3D' : 'Pause 3D'}
            >
              {isScenePaused ? (
                <Play className="w-3.5 h-3.5" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
            </button>

            <div
              className={`inline-flex items-center rounded-xl p-1 border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 ml-1.5 mr-1 text-indigo-500" />
              {(['vi', 'en', 'ja'] as WebLanguageCodeType[]).map((langCode) => (
                <button
                  key={langCode}
                  type="button"
                  onClick={() => onChangeWebLanguage(langCode)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-extrabold uppercase transition ${
                    webLanguage === langCode
                      ? 'bg-indigo-600 text-white'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {langCode}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              className={`p-2.5 rounded-xl border transition ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title="Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={isAuthenticated ? onNavigateToDashboard : onNavigateToLogin}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition-transform hover:-translate-y-0.5"
            >
              <span>{isAuthenticated ? t.ctaBackDashboard : t.ctaEnterSystem}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Thanh tiến trình cuộn WebGL mỏng phía dưới Navbar */}
        <div className="max-w-7xl mx-auto mt-1.5 px-2">
          <div className="w-full h-1 rounded-full bg-slate-500/20 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-150"
              style={{ width: `${Math.round(scrollProgress * 100)}%` }}
            />
          </div>
        </div>
      </header>

      {/* =====================================================================
          BẢNG ĐIỀU KHIỂN CHỌN TẦNG 3D NỔI BÊN PHẢI (INTERACTIVE 3D FLOOR HUD)
         ===================================================================== */}
      <aside className="hidden xl:flex fixed right-8 top-1/2 -translate-y-1/2 z-20 flex-col gap-2 w-64">
        <div
          className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl space-y-2.5 ${
            isDark
              ? 'bg-slate-950/85 border-indigo-500/30 text-slate-200 shadow-black/50'
              : 'bg-white/90 border-indigo-200 text-slate-800 shadow-indigo-500/10'
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-current/10">
            <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-indigo-600 dark:text-cyan-400">
              <Compass className="w-3.5 h-3.5" />
              Sơ đồ 5 Tầng Công ty
            </span>
            {selectedFloorPreview !== null && (
              <button
                type="button"
                onClick={() => setSelectedFloorPreview(null)}
                className="text-[10px] font-bold text-emerald-500 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <p className="text-[11px] opacity-80 leading-snug">{t.floorInspectorTitle}</p>

          <div className="space-y-1.5 pt-1">
            {t.floorBadges
              .slice()
              .reverse()
              .map((item) => {
                const isSelected = selectedFloorPreview === item.floor;
                return (
                  <button
                    key={item.floor}
                    type="button"
                    onClick={() =>
                      setSelectedFloorPreview((prev) =>
                        prev === item.floor ? null : item.floor
                      )
                    }
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 translate-x-[-4px]'
                        : isDark
                        ? 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/50 text-slate-200'
                        : 'bg-slate-50/95 border-slate-200 hover:border-indigo-400 text-slate-800'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-extrabold">{item.code}</p>
                      <p
                        className={`text-[10px] ${
                          isSelected ? 'text-indigo-100' : 'opacity-70'
                        }`}
                      >
                        {item.sub}
                      </p>
                    </div>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.floor === 5 ? 'bg-emerald-500 animate-ping' : 'bg-indigo-500'
                      }`}
                    />
                  </button>
                );
              })}
          </div>
        </div>
      </aside>

      {/* =====================================================================
          NỘI DUNG 4 CHƯƠNG TRƯỢT THEO THANH CUỘN (ĐẶT TRONG THẺ KÍNH RÕ NÉT, KHÔNG LỖI FONT/ĐÈ CHỮ)
         ===================================================================== */}
      <main
        className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-24 pb-24 transition-opacity duration-500 ${
          pure3dInspectMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* CHƯƠNG 1: HERO OVERVIEW */}
        <section className="min-h-[88vh] flex flex-col justify-center max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-2xl space-y-5 ${
              isDark
                ? 'bg-slate-950/85 border-indigo-500/30 shadow-black/60'
                : 'bg-white/92 border-indigo-200/90 shadow-indigo-500/15'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold border bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{t.heroTagline}</span>
            </div>

            <h1
              className={`text-3xl sm:text-4xl xl:text-[42px] font-black tracking-tight leading-[1.18] ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <span>{t.heroTitlePrefix}</span>
              <span
                className={
                  isDark
                    ? 'bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-indigo-700 via-blue-700 to-teal-700 bg-clip-text text-transparent'
                }
              >
                {t.heroTitleHighlight}
              </span>
            </h1>

            <p
              className={`text-xs sm:text-sm leading-relaxed font-medium ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {t.heroDescription}
            </p>

            {/* 4 Chỉ số Cốt lõi của Hệ thống Đặt phòng Nội bộ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { value: '25', label: t.stat1Label, sub: t.stat1Sub, icon: Building2 },
                { value: '30', label: t.stat2Label, sub: t.stat2Sub, icon: Users },
                { value: '30', label: t.stat3Label, sub: t.stat3Sub, icon: Monitor },
                { value: '±30p', label: t.stat4Label, sub: t.stat4Sub, icon: QrCode },
              ].map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`p-3 rounded-2xl border transition-all ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800'
                        : 'bg-slate-50/95 border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl font-black text-indigo-600 dark:text-cyan-400">
                        {stat.value}
                      </span>
                      <StatIcon className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
                    </div>
                    <p className="text-[11px] font-extrabold leading-tight">{stat.label}</p>
                    <p className="text-[10px] opacity-65 mt-0.5">{stat.sub}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={isAuthenticated ? onNavigateToDashboard : onNavigateToLogin}
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all hover:-translate-y-0.5"
              >
                <span>{isAuthenticated ? t.ctaBackDashboard : t.ctaEnterSystem}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToChapterRatio(0.36)}
                className={`px-4 py-3.5 rounded-2xl border text-xs font-extrabold flex items-center gap-2 transition ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-400'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:border-indigo-500'
                }`}
              >
                <span>{t.scrollHint}</span>
                <ChevronDown className="w-4 h-4 animate-bounce text-indigo-500" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* CHƯƠNG 2: 24 PHÒNG HỌP TIÊU CHUẨN TẦNG 1–4 */}
        <section className="min-h-[88vh] flex flex-col justify-center max-w-xl">
          <div
            className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-2xl space-y-5 ${
              isDark
                ? 'bg-slate-950/85 border-cyan-500/30 shadow-black/60'
                : 'bg-white/92 border-indigo-200/90 shadow-indigo-500/15'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-xs font-extrabold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              {t.chapter2Badge}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              {t.chapter2Title}
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed opacity-85">{t.chapter2Desc}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.ch2Box1Title}</span>
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">{t.ch2Box1Desc}</p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-600 dark:text-cyan-400 mb-1">
                  <Cpu className="w-4 h-4" />
                  <span>{t.ch2Box2Title}</span>
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">{t.ch2Box2Desc}</p>
              </div>
            </div>

            <div className="pt-1">
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-70 mb-2">
                {t.ch2FloorPickLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((fl) => (
                  <button
                    key={fl}
                    type="button"
                    onClick={() =>
                      setSelectedFloorPreview((prev) => (prev === fl ? null : fl))
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition ${
                      selectedFloorPreview === fl
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                        : isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-400'
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:border-indigo-500'
                    }`}
                  >
                    Tầng {fl} (M{fl}-01..06)
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CHƯƠNG 3: HỘI TRƯỜNG ĐẤU TRƯỜNG LA MÃ H-01 (TẦNG 5) */}
        <section className="min-h-[88vh] flex flex-col justify-center max-w-xl">
          <div
            className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-2xl space-y-5 ${
              isDark
                ? 'bg-slate-950/85 border-emerald-500/35 shadow-black/60'
                : 'bg-white/92 border-emerald-200 shadow-emerald-500/10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              {t.chapter3Badge}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              {t.chapter3Title}
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed opacity-85">{t.chapter3Desc}</p>

            <div className="space-y-2.5 pt-1">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {t.ch3Mode1Title}
                </span>
                <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                  {t.ch3Mode1Desc}
                </p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-xs font-extrabold text-indigo-600 dark:text-cyan-400">
                  {t.ch3Mode2Title}
                </span>
                <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                  {t.ch3Mode2Desc}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFloorPreview(5)}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/25 transition"
            >
              {t.ch3FocusBtn}
            </button>
          </div>
        </section>

        {/* CHƯƠNG 4: QUY TRÌNH CHECK-IN QR & KỶ LUẬT PHÒNG HỌP */}
        <section className="min-h-[84vh] flex flex-col justify-center max-w-xl">
          <div
            className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-2xl space-y-5 ${
              isDark
                ? 'bg-slate-950/85 border-indigo-500/40 shadow-black/60'
                : 'bg-white/95 border-indigo-200 shadow-indigo-500/15'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.chapter4Badge}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              {t.chapter4Title}
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed opacity-85">{t.chapter4Desc}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Lock className="w-4 h-4 text-indigo-500 mb-1.5" />
                <p className="text-xs font-extrabold">{t.ch4Card1Title}</p>
                <p className="text-[11px] opacity-75 mt-0.5 leading-relaxed">
                  {t.ch4Card1Desc}
                </p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-500 mb-1.5" />
                <p className="text-xs font-extrabold">{t.ch4Card2Title}</p>
                <p className="text-[11px] opacity-75 mt-0.5 leading-relaxed">
                  {t.ch4Card2Desc}
                </p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-500 mb-1.5" />
                <p className="text-xs font-extrabold">{t.ch4Card3Title}</p>
                <p className="text-[11px] opacity-75 mt-0.5 leading-relaxed">
                  {t.ch4Card3Desc}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={isAuthenticated ? onNavigateToDashboard : onNavigateToLogin}
                className="flex-1 py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
              >
                <span>{isAuthenticated ? t.ctaBackDashboard : t.ctaEnterSystem}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* THÔNG BÁO NỔI KHI ĐANG KHÓA CAMERA VÀO 1 TẦNG CỤ THỂ */}
      <AnimatePresence>
        {selectedFloorPreview !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30"
          >
            <div
              className={`px-4 py-2.5 rounded-full border backdrop-blur-xl shadow-xl flex items-center gap-3 text-xs font-extrabold ${
                isDark
                  ? 'bg-slate-900/95 border-cyan-500/50 text-white'
                  : 'bg-white/95 border-indigo-300 text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{t.lockingFloorToast(selectedFloorPreview)}</span>
              <button
                type="button"
                onClick={() => setSelectedFloorPreview(null)}
                className="px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] hover:bg-indigo-500"
              >
                {t.floorResetBtn}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};