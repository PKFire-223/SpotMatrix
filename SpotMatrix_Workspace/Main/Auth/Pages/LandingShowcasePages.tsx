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
  floorInspectorTitle: string;
  floorResetBtn: string;
  chapter2Badge: string;
  chapter2Title: string;
  chapter2Desc: string;
  chapter3Badge: string;
  chapter3Title: string;
  chapter3Desc: string;
  chapter4Badge: string;
  chapter4Title: string;
  chapter4Desc: string;
  scrollHint: string;
}

const LANDING_TRANSLATIONS: Record<WebLanguageCodeType, LandingTranslationPack> = {
  vi: {
    navBadge: 'WebGL 3.0 Spatial Engine • 60 FPS',
    chapterLabels: [
      '01. Kiến trúc 3D',
      '02. Tách lớp 5 Tầng',
      '03. Đấu trường H-01',
      '04. Bảo mật & QR',
    ],
    ctaEnterSystem: 'Đăng nhập Hệ thống',
    ctaBackDashboard: 'Vào Bảng Điều Khiển',
    heroTagline: 'NỀN TẢNG QUẢN TRỊ KHÔNG GIAN 3D/2D & HỘI TRƯỜNG LA MÃ',
    heroTitlePrefix: 'Định hình Không gian Làm việc trên ',
    heroTitleHighlight: 'Ma trận Kính 3D Thời gian Thực',
    heroDescription:
      'Trải nghiệm kiến trúc tòa nhà 5 tầng tương tác trực tiếp bằng WebGL Three.js: 24 phòng họp kính tiêu chuẩn (M1-01..M4-06), Hội trường Đấu Trường La Mã 30 ghế vòm (H-01), định danh 30 thiết bị 4K/Audio và khóa đồng thời Optimistic Locking.',
    floorInspectorTitle: 'Bộ chọn Tầng 3D Trực tiếp (Click để Camera bay tới Tầng)',
    floorResetBtn: 'Góc nhìn Cuộn Tự động',
    chapter2Badge: 'CHƯƠNG 02 • EXPLODED ISOMETRIC CUTAWAY',
    chapter2Title: 'Tách Lớp 24 Phòng Họp Kính & 30 Thiết Bị Định Danh',
    chapter2Desc:
      'Khi bạn cuộn trang, 5 mặt sàn tự động tách giãn theo trục dọc trong không gian 3D. Mỗi phòng từ M1-01 đến M4-06 đều trang bị tường kính khúc xạ, bàn Boardroom/Collab, màn hình 4K phát sáng và đèn Beacon báo trạng thái Trống / Giữ chỗ 5p / Đang họp.',
    chapter3Badge: 'CHƯƠNG 03 • COLOSSEUM AMPHITHEATER H-01 (TẦNG 5)',
    chapter3Title: 'Hội Trường Đấu Trường La Mã & Màn Hình Panorama 360°',
    chapter3Desc:
      'Camera bay lên đỉnh Tầng 5 để lộ diện kiến trúc vòm La Mã 3 dãy ghế bậc thang (H01-A1..A7, H01-B1..B9, H01-C1..C12) xoay quanh sân khấu tròn trung tâm. Hỗ trợ phân quyền 2 chế độ: Thuê trọn sự kiện theo Phòng ban (HALL_EVENT_RENTAL) và Đặt chỗ từng ghế ngồi (HALL_SEAT_BOOKING).',
    chapter4Badge: 'CHƯƠNG 04 • ZERO DOUBLE-BOOKING & QR CHECK-IN ±30P',
    chapter4Title: 'Khóa Đồng Thời Optimistic Lock, Điểm Tín Nhiệm & Cảnh Báo IP',
    chapter4Desc:
      'Bảo vệ tuyệt đối mọi giao dịch đặt chỗ bằng kiểm soát phiên bản lockVersion, cửa sổ quét mã QR Check-in chính xác (±30 phút cộng +2 điểm Trust Score, tự động thu hồi sau 15 phút vắng mặt) và giám sát bảo mật đa địa chỉ IP.',
    scrollHint: 'Cuộn chuột để tách lớp tòa nhà 3D',
  },
  en: {
    navBadge: 'WebGL 3.0 Spatial Engine • 60 FPS',
    chapterLabels: [
      '01. 3D Architecture',
      '02. 5-Floor Explode',
      '03. Colosseum H-01',
      '04. Security & QR',
    ],
    ctaEnterSystem: 'Sign In to Platform',
    ctaBackDashboard: 'Open Workspace Dashboard',
    heroTagline: '3D/2D SPATIAL WORKSPACE & COLOSSEUM HALL PLATFORM',
    heroTitlePrefix: 'Orchestrate Your Enterprise Space in ',
    heroTitleHighlight: 'Real-Time 3D Glass Matrix',
    heroDescription:
      'Explore an interactive 5-floor WebGL Three.js architectural twin: 24 glass meeting pods (M1-01..M4-06), the 30-seat Colosseum Amphitheater (H-01), 30 tracked 4K/Audio devices, and zero-conflict Optimistic Locking.',
    floorInspectorTitle: 'Interactive 3D Floor Focus (Click to Fly Camera to Floor)',
    floorResetBtn: 'Auto Scroll Camera',
    chapter2Badge: 'CHAPTER 02 • EXPLODED ISOMETRIC CUTAWAY',
    chapter2Title: 'Exploded 24 Glass Meeting Rooms & 30 Tracked Devices',
    chapter2Desc:
      'As you scroll, all 5 architectural slabs dynamically separate along the vertical axis. Every room from M1-01 to M4-06 renders refractive glass walls, Boardroom/Collab tables, glowing 4K screens, and live status beacons.',
    chapter3Badge: 'CHAPTER 03 • COLOSSEUM AMPHITHEATER H-01 (FLOOR 5)',
    chapter3Title: 'Colosseum Tiered Arena & 360° Panorama LED Halo',
    chapter3Desc:
      'The camera ascends to Floor 5, revealing 3 concentric seat arcs (H01-A1..A7, H01-B1..B9, H01-C1..C12) surrounding the central podium with dual-mode governance: Department Event Rental and Individual Seat Booking.',
    chapter4Badge: 'CHAPTER 04 • ZERO DOUBLE-BOOKING & ±30M QR CHECK-IN',
    chapter4Title: 'Optimistic Concurrency Lock, Trust Score & Multi-IP Guard',
    chapter4Desc:
      'Eliminate race conditions with lockVersion verification, ±30-minute QR Check-in validation (+2 Trust Score reward, 15-minute no-show auto-release), and multi-IP anomaly detection.',
    scrollHint: 'Scroll down to explode the 3D building',
  },
  ja: {
    navBadge: 'WebGL 3.0 空間エンジン • 60 FPS',
    chapterLabels: [
      '01. 3D建築マトリクス',
      '02. 5階層フロア分解',
      '03. コロッセオ H-01',
      '04. QR & セキュリティ',
    ],
    ctaEnterSystem: 'システムにログイン',
    ctaBackDashboard: 'ダッシュボードへ移動',
    heroTagline: '3D/2D ワークスペース＆コロッセオ大ホール管理基盤',
    heroTitlePrefix: '次世代のオフィス空間を ',
    heroTitleHighlight: 'リアルタイム3Dガラスマトリクスで制御',
    heroDescription:
      'WebGL Three.jsによる5階建てインタラクティブ空間：24室のガラス会議室（M1-01..M4-06）、30席の円形闘技場ホール（H-01）、30台の4K/音響機器管理、楽観的ロックによる重複予約防止を実現。',
    floorInspectorTitle: '3Dフロア直接フォーカス（クリックでカメラ移動）',
    floorResetBtn: '自動スクロール視点',
    chapter2Badge: 'CHAPTER 02 • 5階層アイソメトリック分解ビュー',
    chapter2Title: '24室のガラス会議室と30台の専用機器を立体可視化',
    chapter2Desc:
      'スクロールに合わせて5つのフロアが垂直方向に美しく分解。M1-01からM4-06までの各部屋にガラス壁、会議テーブル、4Kモニター、リアルタイム状態ビーコンを表示します。',
    chapter3Badge: 'CHAPTER 03 • 5階 コロッセオ大ホール H-01',
    chapter3Title: '円形3列シート（30席）と360°パノラマLEDスクリーン',
    chapter3Desc:
      'カメラが5階最上部へ上昇し、中央ステージを囲む3列の円弧座席（H01-A1..C12）を照射。部門別イベント貸切モードと個別座席予約モードの2段階権限を制御します。',
    chapter4Badge: 'CHAPTER 04 • 楽観的ロック＆前後30分QRチェックイン',
    chapter4Title: '同時実行制御・信頼スコア・複数IPログイン検知',
    chapter4Desc:
      'lockVersionによる競合防止、開始前後30分のQRチェックイン（+2点加算・15分無断キャンセル自動解放）、複数IPログイン警告を統合。',
    scrollHint: 'スクロールして3Dビルを分解表示',
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

  const floorBadges = [
    { floor: 1, code: 'Tầng 1 (M1-01..06)', sub: '6 Phòng kính • 8 Thiết bị' },
    { floor: 2, code: 'Tầng 2 (M2-01..06)', sub: '6 Phòng kính • 7 Thiết bị' },
    { floor: 3, code: 'Tầng 3 (M3-01..06)', sub: '6 Phòng kính • 7 Thiết bị' },
    { floor: 4, code: 'Tầng 4 (M4-01..06)', sub: '6 Phòng kính • 6 Thiết bị' },
    { floor: 5, code: 'Tầng 5 (H-01 La Mã)', sub: '30 Ghế vòm • Panorama 360°' },
  ];

  return (
    <div
      className={`relative min-h-[420vh] w-full selection:bg-indigo-500 selection:text-white transition-colors duration-500 ${
        isDark ? 'bg-[#050814] text-slate-100' : 'bg-[#EEF4FF] text-slate-900'
      }`}
    >
      {/* LỚP NỀN WEBGL 3D THREE.JS CỐ ĐỊNH TOÀN MÀN HÌNH */}
      <SpotMatrixHeroCanvas3D
        scrollProgress={scrollProgress}
        activeChapter={activeChapter}
        selectedFloorPreview={selectedFloorPreview}
        isDark={isDark}
      />

      {/* LỚP PHỦ VIGNETTE ĐỂ CHỮ NỔI BẬT SẮC NÉT TRÊN NỀN 3D */}
      <div
        className={`pointer-events-none fixed inset-0 z-[1] ${
          isDark
            ? 'bg-gradient-to-r from-[#050814]/85 via-[#050814]/35 to-transparent'
            : 'bg-gradient-to-r from-white/80 via-white/30 to-transparent'
        }`}
      />

      {/* =====================================================================
          THANH ĐIỀU HƯỚNG KÍNH MỜ CỐ ĐỊNH (FLOATING GLASS NAVBAR)
         ===================================================================== */}
      <header className="fixed top-0 inset-x-0 z-30 px-4 sm:px-8 py-3.5">
        <div
          className={`max-w-7xl mx-auto rounded-2xl border px-4 sm:px-6 py-3 backdrop-blur-xl shadow-lg flex flex-wrap items-center justify-between gap-3 transition-colors ${
            isDark
              ? 'bg-slate-950/75 border-slate-800/90 shadow-black/40'
              : 'bg-white/80 border-slate-200/90 shadow-indigo-500/10'
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
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              {t.navBadge}
            </span>
          </div>

          {/* 4 Nút chuyển nhanh Chương 3D theo thanh cuộn */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {t.chapterLabels.map((label, idx) => {
              const chapterNum = (idx + 1) as 1 | 2 | 3 | 4;
              const isCurrent = activeChapter === chapterNum;
              const targetRatios = [0.0, 0.36, 0.68, 0.94];
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => scrollToChapterRatio(targetRatios[idx])}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Cụm chuyển đổi Ngôn ngữ (VI / EN / JA), Sáng/Tối & Nút vào Hệ thống */}
          <div className="flex items-center gap-2">
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
              title="Chuyển chế độ Sáng / Tối"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={isAuthenticated ? onNavigateToDashboard : onNavigateToLogin}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition-transform hover:-translate-y-0.5"
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
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-150"
              style={{ width: `${Math.round(scrollProgress * 100)}%` }}
            />
          </div>
        </div>
      </header>

      {/* =====================================================================
          BẢNG ĐIỀU KHIỂN CHỌN TẦNG 3D NỔI BÊN PHẢI (INTERACTIVE 3D FLOOR HUD)
         ===================================================================== */}
      <aside className="hidden xl:flex fixed right-8 top-1/2 -translate-y-1/2 z-20 flex-col gap-2 w-60">
        <div
          className={`p-3.5 rounded-2xl border backdrop-blur-xl shadow-xl space-y-2 ${
            isDark
              ? 'bg-slate-950/80 border-slate-800/90 text-slate-200'
              : 'bg-white/85 border-slate-200/90 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-current/10">
            <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
              <Compass className="w-3.5 h-3.5" />
              3D Floor Camera Rig
            </span>
            {selectedFloorPreview !== null && (
              <button
                type="button"
                onClick={() => setSelectedFloorPreview(null)}
                className="text-[10px] font-bold text-emerald-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <p className="text-[11px] opacity-75 leading-snug">{t.floorInspectorTitle}</p>

          <div className="space-y-1.5 pt-1">
            {floorBadges
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
                        ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-md shadow-indigo-600/30 translate-x-[-4px]'
                        : isDark
                        ? 'bg-slate-900/75 border-slate-800 hover:border-indigo-500/50 text-slate-200'
                        : 'bg-slate-50/90 border-slate-200 hover:border-indigo-400 text-slate-800'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-extrabold">{item.code}</p>
                      <p
                        className={`text-[10px] ${
                          isSelected ? 'text-indigo-100' : 'opacity-65'
                        }`}
                      >
                        {item.sub}
                      </p>
                    </div>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.floor === 5 ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'
                      }`}
                    />
                  </button>
                );
              })}
          </div>
        </div>
      </aside>

      {/* =====================================================================
          NỘI DUNG 4 CHƯƠNG TRƯỢT THEO THANH CUỘN (SCROLL-TELLING CHAPTERS)
         ===================================================================== */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-28 pb-24">
        {/* CHƯƠNG 1: HERO OVERVIEW */}
        <section className="min-h-[92vh] flex flex-col justify-center max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full text-xs font-extrabold border backdrop-blur-md bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-300"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.heroTagline}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.1]"
          >
            {t.heroTitlePrefix}
            <span className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              {t.heroTitleHighlight}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className={`text-sm sm:text-base xl:text-lg leading-relaxed backdrop-blur-sm rounded-2xl p-4 border ${
              isDark
                ? 'bg-slate-950/65 border-slate-800/80 text-slate-300'
                : 'bg-white/75 border-slate-200/80 text-slate-700'
            }`}
          >
            {t.heroDescription}
          </motion.p>

          {/* 4 Chỉ số Định lượng Cốt lõi của Dự án */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: '25', label: 'Không gian 3D/2D', sub: 'Tầng 1–4 & H-01', icon: Building2 },
              { value: '30', label: 'Ghế vòm La Mã', sub: 'H01-A1..C12', icon: Users },
              { value: '30', label: 'Thiết bị 4K/Audio', sub: 'Đủ 25/25 phòng', icon: Monitor },
              { value: '±30p', label: 'Cửa sổ QR Check-in', sub: '+2đ Trust Score', icon: QrCode },
            ].map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`p-3.5 rounded-2xl border backdrop-blur-xl transition-transform hover:-translate-y-1 ${
                    isDark
                      ? 'bg-slate-950/75 border-slate-800/90'
                      : 'bg-white/85 border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
                      {stat.value}
                    </span>
                    <StatIcon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xs font-extrabold">{stat.label}</p>
                  <p className="text-[11px] opacity-65">{stat.sub}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={isAuthenticated ? onNavigateToDashboard : onNavigateToLogin}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all hover:-translate-y-0.5"
            >
              <span>{isAuthenticated ? t.ctaBackDashboard : t.ctaEnterSystem}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollToChapterRatio(0.36)}
              className={`px-5 py-4 rounded-2xl border text-xs sm:text-sm font-extrabold backdrop-blur-xl flex items-center gap-2 transition ${
                isDark
                  ? 'bg-slate-900/80 border-slate-700 text-slate-200 hover:border-indigo-400'
                  : 'bg-white/90 border-slate-300 text-slate-800 hover:border-indigo-500'
              }`}
            >
              <span>{t.scrollHint}</span>
              <ChevronDown className="w-4 h-4 animate-bounce text-indigo-400" />
            </button>
          </div>
        </section>

        {/* CHƯƠNG 2: EXPLODED 5-FLOOR MATRIX */}
        <section className="min-h-[95vh] flex flex-col justify-center max-w-xl space-y-5">
          <div
            className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-2xl space-y-5 ${
              isDark
                ? 'bg-slate-950/80 border-indigo-500/30 shadow-indigo-950/30'
                : 'bg-white/90 border-indigo-200 shadow-indigo-500/10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/15 text-cyan-500 dark:text-cyan-300 text-xs font-extrabold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              {t.chapter2Badge}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {t.chapter2Title}
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed opacity-85">{t.chapter2Desc}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-500 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kiến trúc Phòng Kính 3D</span>
                </div>
                <p className="text-[11px] opacity-75">
                  Tường kính có lối cửa vào, trụ góc nhôm, bàn dài Boardroom / bàn tròn Collab, ghế xoay theo sức chứa 2–12 người.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-400 mb-1">
                  <Cpu className="w-4 h-4" />
                  <span>30 Thiết bị Định danh</span>
                </div>
                <p className="text-[11px] opacity-75">
                  Màn hình Samsung 75&quot; 4K, Poly Studio E70, Máy chiếu Laser Epson, Bose Videobar VB1, Wacom Cintiq 24&quot;.
                </p>
              </div>
            </div>

            {/* Thanh chọn nhanh Tầng 1..4 ngay trong thẻ Chương 2 */}
            <div className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-70 mb-2">
                Click để khóa Camera vào mặt cắt từng tầng:
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
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-400'
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

        {/* CHƯƠNG 3: COLOSSEUM AMPHITHEATER H-01 (TẦNG 5) */}
        <section className="min-h-[95vh] flex flex-col justify-center max-w-xl space-y-5">
          <div
            className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-2xl space-y-5 ${
              isDark
                ? 'bg-slate-950/80 border-emerald-500/35 shadow-emerald-950/25'
                : 'bg-white/90 border-emerald-200 shadow-emerald-500/10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 dark:text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              {t.chapter3Badge}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {t.chapter3Title}
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed opacity-85">{t.chapter3Desc}</p>

            <div className="space-y-2.5 pt-1">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-xs font-extrabold text-emerald-400">
                  1. Chế độ Thuê Cả Hội Trường (HALL_EVENT_RENTAL)
                </span>
                <p className="text-[11px] opacity-80 mt-0.5">
                  SYS_ADMIN duyệt tức thì (APPROVED), MANAGER gửi yêu cầu phê duyệt (PENDING_APPROVAL) và chỉ định danh sách Phòng ban (allowedDepartments) được phép tham dự.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-xs font-extrabold text-cyan-400">
                  2. Chế độ Đặt Ghế Vòm La Mã (HALL_SEAT_BOOKING)
                </span>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Mở đặt chỗ 30 ghế vòm (H01-A1..A7, H01-B1..B9, H01-C1..C12) khi có sự kiện được duyệt và kiểm tra tư cách thành viên theo Phòng ban & Nhóm chuyên môn.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFloorPreview(5)}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/25 transition"
            >
              Khóa Góc Nhìn Cận Cảnh Đấu Trường La Mã H-01 (Tầng 5)
            </button>
          </div>
        </section>

        {/* CHƯƠNG 4: SECURITY, OPTIMISTIC LOCK & QR CHECK-IN CONVERGENCE */}
        <section className="min-h-[88vh] flex flex-col justify-center max-w-2xl space-y-6">
          <div
            className={`p-6 sm:p-9 rounded-3xl border backdrop-blur-xl shadow-2xl space-y-6 ${
              isDark
                ? 'bg-slate-950/85 border-indigo-500/40'
                : 'bg-white/95 border-indigo-200'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/15 text-indigo-500 dark:text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.chapter4Badge}
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {t.chapter4Title}
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed opacity-85">{t.chapter4Desc}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Lock className="w-4 h-4 text-indigo-400 mb-1.5" />
                <p className="text-xs font-extrabold">Optimistic Lock v2</p>
                <p className="text-[11px] opacity-70 mt-0.5">
                  Chống xung đột đặt trùng phòng/ghế theo mili-giây với lockVersion.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-400 mb-1.5" />
                <p className="text-xs font-extrabold">QR Check-in ±30 Phút</p>
                <p className="text-[11px] opacity-70 mt-0.5">
                  Đúng giờ cộng +2đ Tín nhiệm; quá 15 phút vắng mặt tự thu hồi và trừ -10đ.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400 mb-1.5" />
                <p className="text-xs font-extrabold">Nhật ký Đa IP & AI Banner</p>
                <p className="text-[11px] opacity-70 mt-0.5">
                  Cảnh báo khi phát hiện 2–3 IP đăng nhập khác nhau & tạo ảnh bìa AI có bước Preview.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={isAuthenticated ? onNavigateToDashboard : onNavigateToLogin}
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
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
                  ? 'bg-slate-900/90 border-indigo-500/50 text-white'
                  : 'bg-white/95 border-indigo-300 text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                Đang khóa Camera 3D tại Tầng {selectedFloorPreview}{' '}
                {selectedFloorPreview === 5 ? '(Đấu Trường La Mã H-01)' : `(M${selectedFloorPreview}-01..06)`}
              </span>
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