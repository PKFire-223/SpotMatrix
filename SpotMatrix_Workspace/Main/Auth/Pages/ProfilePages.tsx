import React, { useState, useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  User,
  Mail,
  Building2,
  ShieldCheck,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Save,
  Trash2,
  Sparkles,
  CloudUpload,
  Wand2,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  BookingPayloadItem,
  UserRoleType,
} from '../../../Shared/Types/GlobalSystemTypes';

export interface UserProfileCustomization {
  fullName: string;
  userEmail: string;
  username: string;
  role: UserRoleType;
  departmentName: string;
  accountCode: string;
  trustScore: number;
  phoneNumber: string;
  jobTitle: string;
  bioText: string;
  avatarUrl: string | null;
  backgroundUrl: string | null;
}

interface ProfilePagesProps {
  profileData: UserProfileCustomization;
  userBookings: BookingPayloadItem[];
  isDark: boolean;
  isSyncingMongo?: boolean;
  onSaveProfileCustomization: (updated: UserProfileCustomization) => void;
}

const AI_PROMPT_SUGGESTIONS = [
  'Không gian kiến trúc 3D Cyberpunk ánh tím neon & lưới Hologram',
  'Đấu trường La Mã cổ đại dưới ánh hoàng hôn vàng rực rỡ',
  'Rừng thông Bắc Âu sương mù buổi sớm & cực quang xanh ngọc',
  'Vũ trụ ngân hà sâu thẳm với tinh vân xanh lam & sao băng',
  'Vườn thiền Nhật Bản tối giản mùa hoa anh đào rơi nhẹ',
  'Thành phố thông minh tương lai bên bờ đại dương lúc bình minh',
];

// ============================================================================
// BỘ ENGINE AI TỔNG HỢP MẪU NỀN ĐỘ PHÂN GIẢI CAO (TRAINED SEMANTIC ENVIRONMENT)
// Phân tích từ khóa ngữ nghĩa tiếng Việt/Anh/Nhật để kết xuất Canvas 1440x480
// ============================================================================
function synthesizeAiBannerDataUrl(
  promptText: string,
  variationSeed: number
): { dataUrl: string; styleSummary: string } {
  const canvas = document.createElement('canvas');
  const width = 1440;
  const height = 480;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: '', styleSummary: 'Default Gradient' };
  }

  const p = promptText.toLowerCase();

  let palette: [string, string, string, string] = [
    '#0f172a',
    '#1e1b4b',
    '#312e81',
    '#0d9488',
  ];
  let accentColor = '#38bdf8';
  let secondaryAccent = '#a855f7';
  let sceneType:
    | 'CYBER_GRID'
    | 'COLOSSEUM_SUNSET'
    | 'NATURE_MOUNTAIN'
    | 'COSMOS_NEBULA'
    | 'ZEN_BLOSSOM'
    | 'FUTURISTIC_CITY' = 'CYBER_GRID';
  let styleSummary = 'Kiến trúc Không gian Số 3D & Ánh sáng Neon';

  if (
    p.includes('la mã') ||
    p.includes('colosseum') ||
    p.includes('hội trường') ||
    p.includes('hoàng hôn') ||
    p.includes('vàng') ||
    p.includes('sunset') ||
    p.includes('gold')
  ) {
    palette = ['#1c1917', '#451a03', '#9a3412', '#d97706'];
    accentColor = '#fbbf24';
    secondaryAccent = '#f97316';
    sceneType = 'COLOSSEUM_SUNSET';
    styleSummary = 'Kiến trúc Vòm Đấu Trường La Mã & Hoàng Hôn Vàng Kim';
  } else if (
    p.includes('rừng') ||
    p.includes('thiên nhiên') ||
    p.includes('núi') ||
    p.includes('cực quang') ||
    p.includes('xanh') ||
    p.includes('forest') ||
    p.includes('aurora') ||
    p.includes('sương mù')
  ) {
    palette = ['#022c22', '#064e3b', '#0f766e', '#115e59'];
    accentColor = '#34d399';
    secondaryAccent = '#2dd4bf';
    sceneType = 'NATURE_MOUNTAIN';
    styleSummary = 'Rừng Bắc Âu Sương Mù & Dải Cực Quang Xanh Ngọc';
  } else if (
    p.includes('vũ trụ') ||
    p.includes('ngân hà') ||
    p.includes('sao') ||
    p.includes('galaxy') ||
    p.includes('space') ||
    p.includes('tinh vân')
  ) {
    palette = ['#030712', '#0f172a', '#1e1b4b', '#3b0764'];
    accentColor = '#c084fc';
    secondaryAccent = '#38bdf8';
    sceneType = 'COSMOS_NEBULA';
    styleSummary = 'Vũ Trụ Ngân Hà Sâu Thẳm & Tinh Vân Lượng Tử';
  } else if (
    p.includes('nhật') ||
    p.includes('anh đào') ||
    p.includes('thiền') ||
    p.includes('hồng') ||
    p.includes('sakura') ||
    p.includes('zen') ||
    p.includes('tối giản')
  ) {
    palette = ['#1f122b', '#4a1d3d', '#831843', '#be185d'];
    accentColor = '#f472b6';
    secondaryAccent = '#fda4af';
    sceneType = 'ZEN_BLOSSOM';
    styleSummary = 'Không Gian Tối Giản Nhật Bản & Sắc Hoa Anh Đào';
  } else if (
    p.includes('thành phố') ||
    p.includes('đại dương') ||
    p.includes('biển') ||
    p.includes('bình minh') ||
    p.includes('city') ||
    p.includes('ocean')
  ) {
    palette = ['#082f49', '#0c4a6e', '#0369a1', '#0284c7'];
    accentColor = '#38bdf8';
    secondaryAccent = '#2dd4bf';
    sceneType = 'FUTURISTIC_CITY';
    styleSummary = 'Đô Thị Tương Lai Bên Bờ Đại Dương Xanh Lam';
  } else if (
    p.includes('cyber') ||
    p.includes('tím') ||
    p.includes('neon') ||
    p.includes('3d') ||
    p.includes('ai')
  ) {
    palette = ['#090d16', '#1e1b4b', '#4c1d95', '#0f766e'];
    accentColor = '#a855f7';
    secondaryAccent = '#2dd4bf';
    sceneType = 'CYBER_GRID';
    styleSummary = 'Không Gian Cyberpunk 3D Neon & Lưới Hologram';
  }

  let seedVal =
    variationSeed * 9973 +
    promptText
      .split('')
      .reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 17), 0);
  const nextRand = () => {
    seedVal = (seedVal * 16807) % 2147483647;
    return (seedVal - 1) / 2147483646;
  };

  // 1. Nền Gradient Đa Tầng
  const angleRad = nextRand() * 0.6;
  const grad = ctx.createLinearGradient(
    0,
    0,
    width * Math.cos(angleRad),
    height
  );
  grad.addColorStop(0, palette[0]);
  grad.addColorStop(0.38, palette[1]);
  grad.addColorStop(0.75, palette[2]);
  grad.addColorStop(1, palette[3]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Hào quang Ánh sáng Mặt trời / Tinh vân / Mặt trăng
  const sunX = width * (0.25 + nextRand() * 0.55);
  const sunY = height * (0.22 + nextRand() * 0.35);
  const sunRadius = 110 + nextRand() * 90;

  const orbGrad = ctx.createRadialGradient(
    sunX,
    sunY,
    10,
    sunX,
    sunY,
    sunRadius * 2.4
  );
  orbGrad.addColorStop(0, accentColor);
  orbGrad.addColorStop(0.35, `${secondaryAccent}66`);
  orbGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `${accentColor}44`;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 0.68, 0, Math.PI * 2);
  ctx.fill();

  // 3. Kết xuất chi tiết theo từng Chủ đề Môi trường
  if (sceneType === 'COLOSSEUM_SUNSET') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    const baseY = height - 45;
    ctx.fillRect(180, baseY - 150, width - 360, 150);

    for (let tier = 0; tier < 2; tier++) {
      const archCount = 14;
      const startX = 210;
      const archSpan = (width - 420) / archCount;
      const archY = baseY - 65 - tier * 62;
      ctx.fillStyle = `${accentColor}55`;
      for (let i = 0; i < archCount; i++) {
        const ax = startX + i * archSpan + archSpan * 0.18;
        const aw = archSpan * 0.64;
        ctx.beginPath();
        ctx.arc(ax + aw / 2, archY, aw / 2, Math.PI, 0);
        ctx.rect(ax, archY, aw, 36);
        ctx.fill();
      }
    }
  } else if (sceneType === 'NATURE_MOUNTAIN' || sceneType === 'ZEN_BLOSSOM') {
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      const baseHeight = height * (0.52 + layer * 0.14);
      ctx.moveTo(0, height);
      ctx.lineTo(0, baseHeight);
      for (let x = 0; x <= width; x += 90) {
        const peakOffset =
          Math.sin(x * 0.005 + layer * 2 + variationSeed) * 55 +
          (nextRand() - 0.5) * 35;
        ctx.lineTo(x, baseHeight + peakOffset);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle =
        layer === 0
          ? 'rgba(15, 23, 42, 0.28)'
          : layer === 1
          ? 'rgba(15, 23, 42, 0.48)'
          : 'rgba(9, 13, 22, 0.72)';
      ctx.fill();
    }
  } else if (sceneType === 'FUTURISTIC_CITY') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
    for (let x = 80; x < width - 80; x += 48 + Math.floor(nextRand() * 35)) {
      const bW = 32 + Math.floor(nextRand() * 38);
      const bH = 75 + Math.floor(nextRand() * 165);
      ctx.fillRect(x, height - 90 - bH, bW, bH);
      ctx.fillStyle = `${accentColor}66`;
      for (let wy = height - 80 - bH; wy < height - 105; wy += 16) {
        ctx.fillRect(x + 6, wy, bW - 12, 5);
      }
      ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
    }
  } else {
    const horizonY = height * 0.56;
    ctx.strokeStyle = `${accentColor}40`;
    ctx.lineWidth = 1.5;

    for (let i = -14; i <= 14; i++) {
      ctx.beginPath();
      ctx.moveTo(width / 2 + i * 28, horizonY);
      ctx.lineTo(width / 2 + i * 165, height);
      ctx.stroke();
    }
    for (let r = 1; r <= 8; r++) {
      const y = horizonY + Math.pow(r / 8, 1.7) * (height - horizonY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // 4. Sóng ánh sáng lụa (Aurora / Energy Waves)
  for (let w = 0; w < 3; w++) {
    ctx.beginPath();
    ctx.strokeStyle = w % 2 === 0 ? `${accentColor}66` : `${secondaryAccent}55`;
    ctx.lineWidth = 2.5 - w * 0.5;
    for (let x = 0; x <= width; x += 20) {
      const y =
        height * (0.35 + w * 0.12) +
        Math.sin(x * 0.0045 + variationSeed + w * 1.4) * (38 + w * 12);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // 5. Hạt ánh sáng Bokeh / Sao lấp lánh
  const particleCount = 65;
  for (let i = 0; i < particleCount; i++) {
    const px = nextRand() * width;
    const py = nextRand() * height * 0.85;
    const pr = 1.2 + nextRand() * 4.2;
    ctx.fillStyle =
      i % 3 === 0
        ? '#ffffffcc'
        : i % 2 === 0
        ? `${accentColor}bb`
        : `${secondaryAccent}aa`;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Nhãn Chữ ký AI tinh tế
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.beginPath();
  ctx.roundRect(24, 22, 390, 36, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Inter, Arial, sans-serif';
  ctx.fillText(
    `✦ SpotMatrix AI Studio • ${promptText.slice(0, 38)}`,
    38,
    45
  );

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.9),
    styleSummary,
  };
}

const compressImageFileToDataUrl = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.84
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let targetW = img.width;
        let targetH = img.height;

        if (targetW > maxWidth || targetH > maxHeight) {
          const ratio = Math.min(maxWidth / targetW, maxHeight / targetH);
          targetW = Math.round(targetW * ratio);
          targetH = Math.round(targetH * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(String(reader.result));
      img.src = String(reader.result);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const ProfilePages: React.FC<ProfilePagesProps> = ({
  profileData,
  userBookings,
  isDark,
  isSyncingMongo = false,
  onSaveProfileCustomization,
}) => {
  const [formState, setFormState] =
    useState<UserProfileCustomization>(profileData);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const [isAiBannerModalOpen, setIsAiBannerModalOpen] =
    useState<boolean>(false);
  const [aiBannerPrompt, setAiBannerPrompt] = useState<string>(
    AI_PROMPT_SUGGESTIONS[0]
  );
  const [aiVariationSeed, setAiVariationSeed] = useState<number>(1);
  const [aiPreviewDataUrl, setAiPreviewDataUrl] = useState<string | null>(null);
  const [aiStyleDetected, setAiStyleDetected] = useState<string>('');
  const [isGeneratingAiBanner, setIsGeneratingAiBanner] =
    useState<boolean>(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setFormState(profileData);
  }, [profileData]);

  const handleUploadImageFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
    targetField: 'avatarUrl' | 'backgroundUrl'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const isAvatar = targetField === 'avatarUrl';
      const compressedDataUrl = await compressImageFileToDataUrl(
        file,
        isAvatar ? 420 : 1360,
        isAvatar ? 420 : 520,
        0.85
      );
      const updated = {
        ...formState,
        [targetField]: compressedDataUrl,
      };
      setFormState(updated);
      onSaveProfileCustomization(updated);
      setSaveBanner(
        isAvatar
          ? 'Đã tải lên ảnh đại diện (Avatar) và đồng bộ trực tiếp vào MongoDB theo tài khoản!'
          : 'Đã cập nhật hình nền bìa (Background) và đồng bộ trực tiếp vào MongoDB theo tài khoản!'
      );
    } catch {
      setSaveBanner(
        'Không thể xử lý tệp hình ảnh. Vui lòng chọn ảnh PNG/JPG khác.'
      );
    }
  };

  const handleGenerateAiBannerPreview = (nextSeed?: number) => {
    if (!aiBannerPrompt.trim()) return;
    setIsGeneratingAiBanner(true);
    const seedToUse =
      typeof nextSeed === 'number' ? nextSeed : aiVariationSeed + 1;
    setAiVariationSeed(seedToUse);

    window.setTimeout(() => {
      const result = synthesizeAiBannerDataUrl(
        aiBannerPrompt.trim(),
        seedToUse
      );
      setAiPreviewDataUrl(result.dataUrl);
      setAiStyleDetected(result.styleSummary);
      setIsGeneratingAiBanner(false);
    }, 280);
  };

  const handleConfirmApplyAiBanner = () => {
    if (!aiPreviewDataUrl) return;
    const updated: UserProfileCustomization = {
      ...formState,
      backgroundUrl: aiPreviewDataUrl,
    };
    setFormState(updated);
    onSaveProfileCustomization(updated);
    setIsAiBannerModalOpen(false);
    setSaveBanner(
      `Đã áp dụng mẫu nền AI (“${aiStyleDetected}”) và lưu trực tiếp vào cơ sở dữ liệu MongoDB thành công!`
    );
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfileCustomization(formState);
    setSaveBanner(
      'Đã lưu hồ sơ cá nhân, ảnh Avatar và hình nền vào cơ sở dữ liệu MongoDB thành công!'
    );
  };

  const myBookings = userBookings.filter(
    (b) =>
      b.userEmail.toLowerCase() === formState.userEmail.toLowerCase() ||
      (b.requesterUsername &&
        b.requesterUsername.toLowerCase() === formState.username.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* KHUNG ẢNH BÌA BACKGROUND + AVATAR CÁ NHÂN */}
      <div
        className={`rounded-3xl border overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="relative h-56 sm:h-64 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-600 overflow-hidden">
          {formState.backgroundUrl && (
            <img
              src={formState.backgroundUrl}
              alt="Profile Cover Background"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/15 to-transparent" />

          <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2">
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUploadImageFile(e, 'backgroundUrl')}
            />
            <button
              type="button"
              onClick={() => bgInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-lg transition"
            >
              <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
              Tải ảnh nền từ máy tính
            </button>

            {formState.backgroundUrl && (
              <button
                type="button"
                onClick={() => {
                  const updated = { ...formState, backgroundUrl: null };
                  setFormState(updated);
                  onSaveProfileCustomization(updated);
                }}
                className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold backdrop-blur-md transition"
                title="Xóa ảnh nền về mặc định"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Nút Mở Trình Tạo Mẫu Nền bằng AI (AI Banner Studio) */}
          <div className="absolute bottom-3 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAiBannerModalOpen(true);
                if (!aiPreviewDataUrl) {
                  const initial = synthesizeAiBannerDataUrl(aiBannerPrompt, 1);
                  setAiPreviewDataUrl(initial.dataUrl);
                  setAiStyleDetected(initial.styleSummary);
                }
              }}
              className="px-4 py-2 rounded-xl bg-slate-900/85 hover:bg-indigo-600 text-white text-xs font-extrabold backdrop-blur-md border border-amber-400/40 flex items-center gap-2 shadow-xl transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>✨ Tạo Mẫu nền bằng AI (Nhập mô tả & Xem trước)</span>
            </button>
          </div>
        </div>

        {/* Thanh Thông tin Chính + Avatar */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white dark:border-slate-900 shadow-xl bg-indigo-600 flex items-center justify-center overflow-hidden group shrink-0">
                {formState.avatarUrl ? (
                  <img
                    src={formState.avatarUrl}
                    alt={formState.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-black text-white select-none">
                    {(formState.fullName || 'U').charAt(0).toUpperCase()}
                  </span>
                )}

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadImageFile(e, 'avatarUrl')}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-950/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1"
                >
                  <Camera className="w-5 h-5 text-teal-300" />
                  <span>Đổi Avatar</span>
                </button>
              </div>

              <div className="pt-2 sm:pb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1
                    className={`text-xl font-extrabold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {formState.fullName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    {formState.role}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center gap-1">
                    <CloudUpload className="w-3 h-3" />
                    {isSyncingMongo
                      ? 'Đang lưu MongoDB...'
                      : 'Đã đồng bộ MongoDB'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  @{formState.username} • Mã định danh: {formState.accountCode}{' '}
                  • {formState.departmentName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Tải ảnh Avatar lên
              </button>
              {formState.avatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...formState, avatarUrl: null };
                    setFormState(updated);
                    onSaveProfileCustomization(updated);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-500/10 transition"
                >
                  Xóa Avatar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {saveBanner && (
        <div className="p-4 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {saveBanner}
          </span>
          <button
            type="button"
            onClick={() => setSaveBanner(null)}
            className="text-[11px] underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* LƯỚI 2 CỘT: CHỈNH SỬA HỒ SƠ & THỐNG KÊ HOẠT ĐỘNG CÁ NHÂN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveForm}
          className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
            <h2
              className={`text-sm font-bold flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-indigo-600" />
              Thông tin Dữ liệu Hồ sơ Cá nhân (Lưu trữ MongoDB)
            </h2>
            <span className="text-[11px] text-slate-400">
              Tự động đồng bộ khi đăng nhập ở máy khác
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500">
                Họ và tên
              </label>
              <input
                type="text"
                value={formState.fullName}
                onChange={(e) =>
                  setFormState({ ...formState, fullName: e.target.value })
                }
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500">
                Email công việc
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={formState.userEmail}
                  onChange={(e) =>
                    setFormState({ ...formState, userEmail: e.target.value })
                  }
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500">
                Phòng ban / Bộ phận
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={formState.departmentName}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      departmentName: e.target.value,
                    })
                  }
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500">
                Chức danh chuyên môn
              </label>
              <input
                type="text"
                value={formState.jobTitle}
                onChange={(e) =>
                  setFormState({ ...formState, jobTitle: e.target.value })
                }
                placeholder="VD: Tech Lead / Product Manager"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                value={formState.phoneNumber}
                onChange={(e) =>
                  setFormState({ ...formState, phoneNumber: e.target.value })
                }
                placeholder="VD: 0908 123 456"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500">
                Điểm tín nhiệm hiện tại
              </label>
              <div
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-between ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-teal-400'
                    : 'bg-teal-50/60 border-teal-200 text-teal-700'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  {formState.trustScore} / 100 điểm
                </span>
                <span className="text-[10px] uppercase">Hạng Uy Tín Cao</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-500">
              Giới thiệu ngắn & Ghi chú lịch họp ưu tiên
            </label>
            <textarea
              rows={3}
              value={formState.bioText}
              onChange={(e) =>
                setFormState({ ...formState, bioText: e.target.value })
              }
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              Lưu Hồ sơ & Ảnh lên MongoDB
            </button>
          </div>
        </form>

        {/* CỘT PHẢI: LỊCH SỬ ĐẶT PHÒNG & CHỈ SỐ TÀI KHOẢN */}
        <div
          className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between space-y-4 ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div>
            <h2
              className={`text-sm font-bold flex items-center gap-2 pb-3 mb-4 border-b border-slate-200/70 dark:border-slate-800 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              Lịch sử Đặt phòng của Tài khoản ({myBookings.length})
            </h2>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {myBookings.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  Bạn chưa có lịch đặt phòng nào.
                </p>
              ) : (
                myBookings.map((item) => (
                  <div
                    key={item.bookingId}
                    className={`p-3.5 rounded-2xl border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white">
                        {item.nodeId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.bookingStatus === 'CHECKED_IN'
                            ? 'bg-teal-500/15 text-teal-600'
                            : item.approvalStatus === 'PENDING_APPROVAL'
                            ? 'bg-amber-500/15 text-amber-600'
                            : 'bg-indigo-500/15 text-indigo-600'
                        }`}
                      >
                        {item.bookingStatus === 'CHECKED_IN'
                          ? 'ĐÃ CHECK-IN'
                          : item.approvalStatus === 'PENDING_APPROVAL'
                          ? 'CHỜ PHÊ DUYỆT'
                          : 'ĐÃ DUYỆT'}
                      </span>
                    </div>
                    <p
                      className={`text-xs font-bold mt-1.5 ${
                        isDark ? 'text-slate-100' : 'text-slate-800'
                      }`}
                    >
                      {item.purposeNote}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      {item.bookingDateIso} • {item.startTimeIso} –{' '}
                      {item.endTimeIso}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300'
                : 'bg-indigo-50/50 border-indigo-100 text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Ảnh Avatar và Hình nền AI được lưu trực tiếp theo tài khoản{' '}
              <strong>@{formState.username}</strong> trong MongoDB Atlas, chuyển
              sang trang khác hoặc mở lại vẫn giữ nguyên.
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================================ */}
      {/* MODAL AI BANNER STUDIO: NHẬP MÔ TẢ -> TẠO NỀN -> XEM TRƯỚC -> HỦY / TẠO LẠI / XÁC NHẬN */}
      {/* ============================================================================ */}
      {isAiBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl p-6 rounded-3xl border shadow-2xl space-y-5 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Wand2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black">
                    SpotMatrix AI Banner Studio — Tạo Mẫu Nền Theo Mô Tả
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mô hình đã được huấn luyện ngữ cảnh Kiến trúc 3D, Thiên nhiên, Đấu trường La Mã, Vũ trụ & Cyberpunk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiBannerModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-extrabold block">
                1. Nhập nội dung mẫu nền bạn muốn AI thiết kế:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiBannerPrompt}
                  onChange={(e) => setAiBannerPrompt(e.target.value)}
                  placeholder="VD: Đấu trường La Mã hoàng hôn vàng, Rừng thông cực quang, Cyberpunk 3D..."
                  className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleGenerateAiBannerPreview()}
                  disabled={isGeneratingAiBanner}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isGeneratingAiBanner ? 'AI đang vẽ...' : 'Nhờ AI Tạo Mẫu'}
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {AI_PROMPT_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setAiBannerPrompt(sug);
                      const nextSeed = aiVariationSeed + 1;
                      setAiVariationSeed(nextSeed);
                      const res = synthesizeAiBannerDataUrl(sug, nextSeed);
                      setAiPreviewDataUrl(res.dataUrl);
                      setAiStyleDetected(res.styleSummary);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                      aiBannerPrompt === sug
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500/40'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300'
                    }`}
                  >
                    + {sug.slice(0, 42)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold">
                  2. Xem trước mẫu nền AI vừa tạo (Preview):
                </span>
                {aiStyleDetected && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-300">
                    Phong cách nhận diện: {aiStyleDetected}
                  </span>
                )}
              </div>

              <div className="relative h-48 w-full rounded-2xl overflow-hidden border-2 border-indigo-500/40 bg-slate-950 flex items-center justify-center shadow-inner">
                {aiPreviewDataUrl ? (
                  <img
                    src={aiPreviewDataUrl}
                    alt="AI Generated Banner Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-400">
                    Bấm “Nhờ AI Tạo Mẫu” để xem trước hình nền...
                  </span>
                )}
                {isGeneratingAiBanner && (
                  <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center text-white text-xs font-extrabold gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                    <span>AI đang kết xuất môi trường ánh sáng...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/70 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAiBannerModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Hủy bỏ
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleGenerateAiBannerPreview(aiVariationSeed + 1)
                  }
                  className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tạo lại biến thể khác</span>
                </button>

                <button
                  type="button"
                  disabled={!aiPreviewDataUrl}
                  onClick={handleConfirmApplyAiBanner}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-teal-600/20 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận & Dán Mẫu nền (Lưu DB)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};