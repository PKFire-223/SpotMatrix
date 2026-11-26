import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Map,
  CalendarCheck,
  Building2,
  Database,
  ShieldAlert,
  LayoutDashboard,
  Settings,
  User,
  Sun,
  Moon,
  Globe,
  CornerDownLeft,
  X,
  Sparkles,
} from 'lucide-react';
import {
  UserRoleType,
  WebLanguageCodeType,
  WorkspaceNodeItem,
} from '../Types/GlobalSystemTypes';

export type CommandPaletteTargetPage =
  | 'OVERVIEW'
  | 'FLOORPLAN'
  | 'BOOKING'
  | 'ORGANIZATION'
  | 'NOTIFICATION'
  | 'DATAMANAGER'
  | 'AUDIT'
  | 'PROFILE'
  | 'SETTINGS';

export interface QuickCommandPaletteProps {
  isOpen: boolean;
  isDark: boolean;
  userRole: UserRoleType;
  webLanguage: WebLanguageCodeType;
  workspaceNodes: WorkspaceNodeItem[];
  onClose: () => void;
  onNavigatePage: (page: CommandPaletteTargetPage) => void;
  onSelectRoomAndBook: (node: WorkspaceNodeItem) => void;
  onToggleTheme: () => void;
  onChangeLanguage: (lang: WebLanguageCodeType) => void;
}

interface PaletteActionItem {
  id: string;
  group: 'NAV' | 'ROOM' | 'SYSTEM';
  title: string;
  subtitle: string;
  badge?: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  onExecute: () => void;
}

/**
 * Thanh Lệnh Tìm Kiếm & Điều Hướng Nhanh Toàn Cục (Ctrl + K / ⌘K)
 * Học hỏi kiến trúc từ pacocoursey/cmdk & emilkowalski/skills (ease-out < 250ms, hỗ trợ đầy đủ phím mũi tên + Enter + Esc).
 */
export const QuickCommandPalette: React.FC<QuickCommandPaletteProps> = ({
  isOpen,
  isDark,
  userRole,
  webLanguage,
  workspaceNodes,
  onClose,
  onNavigatePage,
  onSelectRoomAndBook,
  onToggleTheme,
  onChangeLanguage,
}) => {
  const [query, setQuery] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isSysAdmin = userRole === 'SYS_ADMIN';

  const allItems = useMemo<PaletteActionItem[]>(() => {
    const navItems: PaletteActionItem[] = [
      {
        id: 'nav-overview',
        group: 'NAV',
        title:
          webLanguage === 'en'
            ? 'Overview Dashboard'
            : webLanguage === 'ja'
            ? 'ダッシュボード概要'
            : 'Tổng quan (Dashboard)',
        subtitle:
          webLanguage === 'en'
            ? 'Live KPIs & Quick Approvals'
            : webLanguage === 'ja'
            ? 'リアルタイムKPI・承認管理'
            : 'Số liệu KPI thời gian thực & Duyệt nhanh',
        keywords: 'dashboard overview tong quan kpi',
        icon: LayoutDashboard,
        onExecute: () => onNavigatePage('OVERVIEW'),
      },
      {
        id: 'nav-floorplan',
        group: 'NAV',
        title:
          webLanguage === 'en'
            ? '3D/2D 5-Floor Map'
            : webLanguage === 'ja'
            ? '5階 3D/2D フロアマップ'
            : 'Sơ đồ Phòng họp 5 Tầng (3D/2D)',
        subtitle:
          webLanguage === 'en'
            ? 'Interactive Three.js PBR & SVG Map'
            : webLanguage === 'ja'
            ? '3Dモデル・2D図面・コロッセオ大ホール'
            : 'Mô hình kính 3D không mái & Bản vẽ 2D SVG',
        keywords: 'floorplan map 3d 2d so do tang',
        icon: Map,
        onExecute: () => onNavigatePage('FLOORPLAN'),
      },
      {
        id: 'nav-booking',
        group: 'NAV',
        title:
          webLanguage === 'en'
            ? 'Room & Hall Booking'
            : webLanguage === 'ja'
            ? '会議室・大ホール予約'
            : 'Đặt lịch Phòng họp & Quét QR',
        subtitle:
          webLanguage === 'en'
            ? 'Schedule rooms, QR Check-in & History'
            : webLanguage === 'ja'
            ? '予約作成・QRチェックイン・予約履歴'
            : 'Tạo lịch, Quét mã QR ±30p & Lịch sử',
        keywords: 'booking calendar dat phong qr lich',
        icon: CalendarCheck,
        onExecute: () => onNavigatePage('BOOKING'),
      },
      {
        id: 'nav-org',
        group: 'NAV',
        title:
          webLanguage === 'en'
            ? 'Organization, Teams & Fault Report'
            : webLanguage === 'ja'
            ? '組織・部署・設備故障報告'
            : 'Tổ chức, Phòng ban & Báo lỗi Thiết bị',
        subtitle:
          webLanguage === 'en'
            ? 'Departments, Squads & Report faulty devices'
            : webLanguage === 'ja'
            ? '部署管理・グループ・不具合報告フォーム'
            : 'Phòng ban, Nhóm chuyên môn & Báo lỗi thiết bị',
        keywords: 'organization department group fault phong ban nhom bao loi',
        icon: Building2,
        onExecute: () => onNavigatePage('ORGANIZATION'),
      },
      {
        id: 'nav-datamanager',
        group: 'NAV',
        title: isSysAdmin
          ? webLanguage === 'en'
            ? 'Equipment Inventory & Trust Ledger'
            : webLanguage === 'ja'
            ? '設備管理・信頼スコア履歴'
            : 'Quản lý Thiết bị & Sổ cái Tín nhiệm'
          : webLanguage === 'en'
          ? 'My Trust Score Ledger (+20/mo)'
          : webLanguage === 'ja'
          ? '個人信頼スコア履歴（毎月+20）'
          : 'Điểm & Lịch sử Tín nhiệm cá nhân',
        subtitle:
          webLanguage === 'en'
            ? 'Monthly +20 pts bonus & QR history'
            : webLanguage === 'ja'
            ? '毎月+20ポイント・QR履歴確認'
            : 'Cộng +20đ định kỳ tháng & Chi tiết cộng/trừ',
        keywords: 'equipment trust score thiet bi tin nhiem lich su diem',
        icon: Database,
        onExecute: () => onNavigatePage('DATAMANAGER'),
      },
      {
        id: 'nav-profile',
        group: 'NAV',
        title:
          webLanguage === 'en'
            ? 'Personal Profile & AI Banner'
            : webLanguage === 'ja'
            ? '個人プロフィール＆AI背景'
            : 'Hồ sơ Cá nhân & Tạo Nền AI',
        subtitle:
          webLanguage === 'en'
            ? 'Avatar, cover image & MongoDB sync'
            : webLanguage === 'ja'
            ? 'アバター・カバー画像・MongoDB同期'
            : 'Đổi Avatar, Ảnh nền AI & Đồng bộ MongoDB',
        keywords: 'profile avatar banner ho so ca nhan',
        icon: User,
        onExecute: () => onNavigatePage('PROFILE'),
      },
      {
        id: 'nav-settings',
        group: 'NAV',
        title:
          webLanguage === 'en'
            ? 'System Settings & Lofi Audio'
            : webLanguage === 'ja'
            ? 'システム設定・Lofi BGM'
            : 'Cài đặt Hệ thống, Nhạc Lofi & IP',
        subtitle:
          webLanguage === 'en'
            ? 'Theme, SFX, Language & Password'
            : webLanguage === 'ja'
            ? 'テーマ・効果音・言語・パスワード'
            : 'Ngôn ngữ VI/EN/JA, Đổi mật khẩu & Lofi',
        keywords: 'settings lofi password ip cai dat ngon ngu',
        icon: Settings,
        onExecute: () => onNavigatePage('SETTINGS'),
      },
    ];

    if (isSysAdmin) {
      navItems.push({
        id: 'nav-audit',
        group: 'NAV',
        title:
          webLanguage === 'en'
            ? 'Audit Log & User Roles (Admin)'
            : webLanguage === 'ja'
            ? '監査ログ・ユーザー権限管理'
            : 'Nhật ký Kiểm toán & Quản trị User',
        subtitle: 'SYS_ADMIN • IP Security & Role Switching',
        keywords: 'audit log security user admin nhat ky ip',
        icon: ShieldAlert,
        onExecute: () => onNavigatePage('AUDIT'),
      });
    }

    const roomItems: PaletteActionItem[] = workspaceNodes.map((node) => ({
      id: `room-${node.nodeId}`,
      group: 'ROOM',
      title: `[${node.nodeCode}] ${node.nodeLabel}`,
      subtitle:
        webLanguage === 'en'
          ? `Floor ${node.floorLevel} • ${node.capacityCount} seats • Click to book`
          : webLanguage === 'ja'
          ? `${node.floorLevel}階 • ${node.capacityCount}席 • 予約画面へ`
          : `Tầng ${node.floorLevel} • ${node.capacityCount} chỗ • Bấm để mở Đặt phòng`,
      badge: node.status,
      keywords: `${node.nodeCode} ${node.nodeLabel} tang ${node.floorLevel} floor ${node.floorLevel} ${node.status}`,
      icon: Sparkles,
      onExecute: () => onSelectRoomAndBook(node),
    }));

    const sysItems: PaletteActionItem[] = [
      {
        id: 'sys-theme',
        group: 'SYSTEM',
        title: isDark
          ? webLanguage === 'en'
            ? 'Switch to Light Mode'
            : webLanguage === 'ja'
            ? 'ライトモードに切替'
            : 'Chuyển sang Giao diện Sáng (Light Mode)'
          : webLanguage === 'en'
          ? 'Switch to Dark Mode'
          : webLanguage === 'ja'
          ? 'ダークモードに切替'
          : 'Chuyển sang Giao diện Tối (Dark Mode)',
        subtitle: 'Instant Theme Toggle',
        keywords: 'theme dark light sang toi giao dien',
        icon: isDark ? Sun : Moon,
        onExecute: onToggleTheme,
      },
      {
        id: 'sys-lang-vi',
        group: 'SYSTEM',
        title: 'Chuyển ngôn ngữ: Tiếng Việt (VI)',
        subtitle: 'Vietnamese Interface & AI Voice',
        keywords: 'language vi vietnamese tieng viet',
        icon: Globe,
        onExecute: () => onChangeLanguage('vi'),
      },
      {
        id: 'sys-lang-en',
        group: 'SYSTEM',
        title: 'Switch Language: English (EN)',
        subtitle: 'English Interface & AI Voice',
        keywords: 'language en english tieng anh',
        icon: Globe,
        onExecute: () => onChangeLanguage('en'),
      },
      {
        id: 'sys-lang-ja',
        group: 'SYSTEM',
        title: '言語切替: 日本語 (JA)',
        subtitle: 'Japanese Interface & AI Voice',
        keywords: 'language ja japanese tieng nhat',
        icon: Globe,
        onExecute: () => onChangeLanguage('ja'),
      },
    ];

    return [...navItems, ...roomItems, ...sysItems];
  }, [
    isSysAdmin,
    webLanguage,
    workspaceNodes,
    isDark,
    onNavigatePage,
    onSelectRoomAndBook,
    onToggleTheme,
    onChangeLanguage,
  ]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return allItems.slice(0, 12);
    }
    return allItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.keywords.toLowerCase().includes(q)
      )
      .slice(0, 14);
  }, [allItems, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) =>
          filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) =>
          filteredItems.length > 0
            ? (prev - 1 + filteredItems.length) % filteredItems.length
            : 0
        );
      } else if (e.key === 'Enter' && filteredItems[activeIndex]) {
        e.preventDefault();
        filteredItems[activeIndex].onExecute();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, activeIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center pt-[10vh] px-3 sm:px-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border transition-all duration-200 ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/70 dark:border-slate-800">
          <Search className="w-4 h-4 text-indigo-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              webLanguage === 'en'
                ? 'Jump to room (M3-04, H-01), page, or setting...'
                : webLanguage === 'ja'
                ? '会議室コード (M3-04, H-01)、ページ、設定を検索...'
                : 'Tìm nhanh phòng họp (M3-04, H-01), chuyển trang hoặc cài đặt...'
            }
            className="flex-1 bg-transparent text-sm font-semibold outline-none focus:outline-none focus-visible:outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              {webLanguage === 'en'
                ? 'No matching commands or rooms found.'
                : webLanguage === 'ja'
                ? '一致するコマンドまたは会議室が見つかりません。'
                : 'Không tìm thấy phòng họp hoặc chức năng phù hợp.'}
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const IconComp = item.icon;
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    item.onExecute();
                    onClose();
                  }}
                  className={`w-full px-3 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-left transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isDark
                      ? 'hover:bg-slate-800/80 text-slate-200'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold truncate">
                        {item.title}
                      </p>
                      <p
                        className={`text-[11px] truncate ${
                          isSelected ? 'text-indigo-100' : 'text-slate-400'
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : item.badge === 'AVAILABLE'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-500/15 text-slate-500'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>↑↓ Di chuyển • Enter Chọn • Esc Đóng</span>
          <span className="font-mono">SpotMatrix Command Palette • ⌘K</span>
        </div>
      </div>
    </div>
  );
};
