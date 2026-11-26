import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  CalendarCheck,
  Database,
  ShieldAlert,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Sparkles,
  User,
  Settings,
  Mail,
  Building2,
  Award,
  Music,
  VolumeX,
  Globe,
  Menu,
  Search,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SpotMatrixLogo } from '../Components/SpotMatrixLogo';
import { QuickCommandPalette } from '../Components/QuickCommandPalette';
import {
  AuditConcurrencyLogItem,
  BookingPayloadItem,
  EquipmentFaultReportItem,
  EquipmentStatusType,
  NotificationCategoryType,
  NotificationRecordItem,
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  SeatStatusType,
  SharedEquipmentItem,
  TrustScoreHistoryRecordItem,
  UserTrustProfileItem,
  WebLanguageCodeType,
  WorkspaceNodeItem,
  WorkspaceZoneType,
} from '../Types/GlobalSystemTypes';
import { ErrorBoundaryLayout } from '../../Error/Layout/ErrorBoundaryLayout';
import { DashboardMainPages } from '../../Main/Dashboard/Pages/DashboardMainPages';
import { DataOverviewPages } from '../../Main/Datamanager/Pages/DataOverviewPages';
import { OrganizationPages } from '../../Main/Organization/Pages/OrganizationPages';
import { FloorplanMainPages } from '../../Main/Floorplan/Pages/FloorplanMainPages';
import {
  BookingCalendarPages,
  BookingTimeWindowInput,
} from '../../Main/Booking/Pages/BookingCalendarPages';
import {
  QR_BROADCAST_CHANNEL_NAME,
  QR_STORAGE_EVENT_KEY,
  QrCheckinConfirmPages,
  QrRealtimeSyncPayload,
} from '../../Main/Booking/Pages/QrCheckinConfirmPages';
import {
  buildNormalizedMeetingDateRange,
  generateQrCheckinToken,
} from '../../Main/Booking/Function/Validators/BookingValidator';
import {
  AuthenticatedUserSession,
  LoginPages,
} from '../../Main/Auth/Pages/LoginPages';
import { LandingShowcasePages } from '../../Main/Auth/Pages/LandingShowcasePages';
import { SpotMatrixAiCloudWidget } from '../../Ai/Function/Components/SpotMatrixAiCloudWidget';
import {
  ProfilePages,
  UserProfileCustomization,
} from '../../Main/Auth/Pages/ProfilePages';
import {
  AUDIO_SETTINGS_STORAGE_KEY,
  LofiTrackStyleType,
  SettingsPages,
  SpotMatrixAudioSettings,
  WEB_LANGUAGE_STORAGE_KEY,
} from '../../Main/Auth/Pages/SettingsPages';
import { NotificationHeaderBell } from '../../Main/Notification/Function/Components/NotificationHeaderBell';
import { RealtimePopupToast } from '../../Main/Notification/Function/Components/RealtimePopupToast';
import { NotificationCenterPages } from '../../Main/Notification/Pages/NotificationCenterPages';
import {
  AuditLogPages,
  ManagedUserAccountItem,
} from '../../Main/Auditlog/Pages/AuditLogPages';

const SESSION_STORAGE_KEY = 'spotmatrix_active_session_v2';
const PROFILE_CUSTOM_STORAGE_KEY = 'spotmatrix_profile_custom_v2';

type ActiveSidebarPage =
  | 'OVERVIEW'
  | 'FLOORPLAN'
  | 'BOOKING'
  | 'ORGANIZATION'
  | 'NOTIFICATION'
  | 'DATAMANAGER'
  | 'AUDIT'
  | 'PROFILE'
  | 'SETTINGS';

// 1. Khởi tạo chuẩn 25 Phòng (Tầng 1–4: 24 Phòng họp kính 3D + Tầng 5: Hội trường Đấu trường La Mã H-01)
function buildStandardFiveFloorRooms(): WorkspaceNodeItem[] {
  const rooms: WorkspaceNodeItem[] = [];
  const floorTemplates = [
    { codeSuffix: '01', name: 'Phòng Họp Đối tác Nhỏ', zone: 'MEETING_ROOM' as WorkspaceZoneType, cap: 2, posX: 150, posY: 115, status: 'AVAILABLE' as SeatStatusType },
    { codeSuffix: '02', name: 'Phòng Họp Nhóm Sprint', zone: 'MEETING_ROOM' as WorkspaceZoneType, cap: 6, posX: 400, posY: 115, status: 'OCCUPIED' as SeatStatusType },
    { codeSuffix: '03', name: 'Phòng Họp Boardroom Lớn', zone: 'MEETING_ROOM' as WorkspaceZoneType, cap: 10, posX: 650, posY: 115, status: 'AVAILABLE' as SeatStatusType },
    { codeSuffix: '04', name: 'Phòng Họp Bàn Tròn Sáng tạo', zone: 'COLLAB_HUB' as WorkspaceZoneType, cap: 4, posX: 150, posY: 345, status: 'AVAILABLE' as SeatStatusType },
    { codeSuffix: '05', name: 'Phòng Họp Bàn Tròn Thảo luận', zone: 'COLLAB_HUB' as WorkspaceZoneType, cap: 8, posX: 400, posY: 345, status: 'RESERVED' as SeatStatusType },
    { codeSuffix: '06', name: 'Phòng Họp Hội đồng VIP', zone: 'QUIET_POD' as WorkspaceZoneType, cap: 12, posX: 650, posY: 345, status: 'AVAILABLE' as SeatStatusType },
  ];

  for (let floor = 1; floor <= 4; floor++) {
    floorTemplates.forEach((tpl, idx) => {
      const roomCode = `M${floor}-${tpl.codeSuffix}`;
      rooms.push({
        nodeId: `NODE-M${floor}${tpl.codeSuffix}`,
        nodeCode: roomCode,
        nodeLabel: `${tpl.name} ${roomCode} (Tầng ${floor})`,
        zoneType: tpl.zone,
        floorLevel: floor,
        position2D: { posX: tpl.posX, posY: tpl.posY },
        position3D: { coordX: (idx % 3) * 4 - 4, coordY: 0.5, coordZ: idx < 3 ? -3 : 3 },
        capacityCount: tpl.cap,
        status: floor === 1 ? tpl.status : idx === floor % 5 ? 'OCCUPIED' : 'AVAILABLE',
        amenitiesList: ['Bàn họp lớn', `${tpl.cap} ghế tiêu chuẩn`, 'Màn hình 4K', 'Cách âm 40dB'],
        aiScore: 98 - idx * 2,
        lockVersion: 1,
      });
    });
  }

  rooms.push({
    nodeId: 'NODE-H01-COLOSSEUM',
    nodeCode: 'H-01',
    nodeLabel: 'Hội trường Lớn Đấu Trường La Mã (Tầng 5)',
    zoneType: 'MEETING_ROOM',
    floorLevel: 5,
    position2D: { posX: 400, posY: 230 },
    position3D: { coordX: 0, coordY: 0.5, coordZ: 0 },
    capacityCount: 30,
    status: 'AVAILABLE',
    amenitiesList: ['Bục Diễn Giả trung tâm', 'Ghế vòm La Mã H01-A1..B8', 'Màn hình LED Panorama 360°'],
    aiScore: 99,
    lockVersion: 1,
  });

  return rooms;
}

// 2. Khởi tạo đủ 30 thiết bị định danh riêng cho toàn bộ 25/25 phòng
function buildStandardTwentyFiveRoomEquipments(): SharedEquipmentItem[] {
  const list: SharedEquipmentItem[] = [];
  const roomSpecs: Array<{
    suffix: string;
    primaryName: string;
    category: SharedEquipmentItem['categoryName'];
    posX: number;
    posY: number;
    secondaryName?: string;
    secondaryCat?: SharedEquipmentItem['categoryName'];
  }> = [
    {
      suffix: '01',
      primaryName: 'Màn hình Hội nghị 4K Samsung 75"',
      category: 'MONITOR_4K',
      posX: 150,
      posY: 115,
      secondaryName: 'Camera AI 360° Poly Studio E70',
      secondaryCat: 'AUDIO_POD',
    },
    {
      suffix: '02',
      primaryName: 'Máy chiếu Laser Epson 4K Pro',
      category: 'PROJECTOR',
      posX: 400,
      posY: 115,
    },
    {
      suffix: '03',
      primaryName: 'Hệ thống Âm thanh Hội trường Bose Videobar VB1',
      category: 'AUDIO_POD',
      posX: 650,
      posY: 115,
      secondaryName: 'Trạm Chia tín hiệu HDMI & Type-C 100W',
      secondaryCat: 'TYPE_C_HUB',
    },
    {
      suffix: '04',
      primaryName: 'Bảng Tương tác Cảm ứng KTS Wacom Cintiq 24"',
      category: 'WACOM_TABLET',
      posX: 150,
      posY: 345,
    },
    {
      suffix: '05',
      primaryName: 'Màn hình Cảm ứng Đa điểm LG One:Quick Works 55"',
      category: 'MONITOR_4K',
      posX: 400,
      posY: 345,
    },
    {
      suffix: '06',
      primaryName: 'Tổ hợp Micro Đa hướng & Camera PTZ 4K Logitech Rally',
      category: 'CONF_MIC_CAM',
      posX: 650,
      posY: 345,
    },
  ];

  let seq = 1;
  for (let floor = 1; floor <= 4; floor++) {
    roomSpecs.forEach((spec, idx) => {
      const roomCode = `M${floor}-${spec.suffix}`;
      const isInUse = floor === 1 && spec.suffix === '02';
      list.push({
        equipmentId: `EQ-${String(seq).padStart(2, '0')}`,
        equipmentCode: `EQ-M${floor}${spec.suffix}-DEV-01`,
        equipmentName: `${spec.primaryName} (${roomCode})`,
        categoryName: spec.category,
        status: isInUse ? 'IN_USE' : 'AVAILABLE',
        assignedNodeId: roomCode,
        position2D: { posX: spec.posX, posY: spec.posY },
        currentBookingId: isInUse ? 'BK-2026-001' : null,
        weeklyUsageHours: 16 + ((floor * 3 + idx * 4) % 18),
        monthlyUsageHours: 64 + ((floor * 12 + idx * 15) % 68),
      });
      seq += 1;

      if (floor === 1 && spec.secondaryName && spec.secondaryCat) {
        const isBroken = spec.suffix === '03';
        list.push({
          equipmentId: `EQ-${String(seq).padStart(2, '0')}`,
          equipmentCode: `EQ-M${floor}${spec.suffix}-DEV-02`,
          equipmentName: `${spec.secondaryName} (${roomCode})`,
          categoryName: spec.secondaryCat,
          status: isBroken ? 'REPORTED_BROKEN' : 'AVAILABLE',
          assignedNodeId: roomCode,
          position2D: { posX: spec.posX, posY: spec.posY },
          currentBookingId: null,
          weeklyUsageHours: 14,
          monthlyUsageHours: 58,
          lastReportedReason: isBroken
            ? 'Cổng HDMI số 2 bị lỏng tín hiệu khi kết nối máy tính cá nhân'
            : null,
          lastReportedBy: isBroken ? 'employee.dev@spotmatrix.vn' : null,
        });
        seq += 1;
      }
    });
  }

  list.push(
    {
      equipmentId: `EQ-${String(seq).padStart(2, '0')}`,
      equipmentCode: 'EQ-H01-PANO-01',
      equipmentName: 'Màn hình LED Cong Panorama 360° Hội trường (H-01)',
      categoryName: 'PROJECTOR',
      status: 'AVAILABLE',
      assignedNodeId: 'H-01',
      position2D: { posX: 400, posY: 230 },
      currentBookingId: null,
      weeklyUsageHours: 28,
      monthlyUsageHours: 112,
    },
    {
      equipmentId: `EQ-${String(seq + 1).padStart(2, '0')}`,
      equipmentCode: 'EQ-H01-AUDIO-02',
      equipmentName: 'Hệ thống Loa Line-Array & Micro Không dây Sân khấu (H-01)',
      categoryName: 'AUDIO_POD',
      status: 'AVAILABLE',
      assignedNodeId: 'H-01',
      position2D: { posX: 400, posY: 230 },
      currentBookingId: null,
      weeklyUsageHours: 26,
      monthlyUsageHours: 104,
    }
  );

  return list;
}

const INITIAL_ROOM_EQUIPMENTS: SharedEquipmentItem[] =
  buildStandardTwentyFiveRoomEquipments();

const INITIAL_EQUIPMENT_FAULT_REPORTS: EquipmentFaultReportItem[] = [
  {
    reportId: 'FLT-2026-001',
    equipmentId: 'EQ-05',
    equipmentCode: 'EQ-M103-DEV-02',
    equipmentName: 'Trạm Chia tín hiệu HDMI & Type-C 100W (M1-03)',
    roomCode: 'M1-03',
    reporterEmail: 'employee.dev@spotmatrix.vn',
    reporterName: 'Nguyễn Minh Quân (Nhân viên)',
    reporterRole: 'EMPLOYEE',
    faultReason:
      'Cổng HDMI số 2 bị lỏng tín hiệu khi kết nối máy tính cá nhân trong ca họp sáng.',
    reportStatus: 'PENDING_ADMIN',
    aiDiagnosisNote:
      'Đề xuất kỹ thuật viên kiểm tra khe tiếp xúc cổng HDMI số 2 hoặc thay mới cáp chuyển Type-C.',
    createdAtIso: '09:15 • Hôm nay',
    updatedAtIso: new Date().toISOString(),
  },
];

const INITIAL_TRUST_PROFILES: UserTrustProfileItem[] = [
  {
    userEmail: 'sysadmin@spotmatrix.vn',
    fullName: 'System Administrator',
    role: 'SYS_ADMIN',
    departmentName: 'System Governance',
    trustScore: 100,
    onTimeCheckInCount: 32,
    noShowPenaltyCount: 0,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
  {
    userEmail: 'manager.lead@spotmatrix.vn',
    fullName: 'Lê Thu Hà (Quản lý)',
    role: 'MANAGER',
    departmentName: 'Product & Engineering',
    trustScore: 100,
    onTimeCheckInCount: 28,
    noShowPenaltyCount: 0,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
  {
    userEmail: 'employee.dev@spotmatrix.vn',
    fullName: 'Nguyễn Minh Quân (Nhân viên)',
    role: 'EMPLOYEE',
    departmentName: 'Product & Engineering',
    trustScore: 96,
    onTimeCheckInCount: 18,
    noShowPenaltyCount: 1,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
];

const INITIAL_TRUST_SCORE_HISTORY: TrustScoreHistoryRecordItem[] = [
  {
    recordId: 'TSH-2026-001',
    userEmail: 'employee.dev@spotmatrix.vn',
    fullName: 'Nguyễn Minh Quân (Nhân viên)',
    deltaPoints: 20,
    balanceAfter: 100,
    eventType: 'MONTHLY_BONUS_20',
    reasonText:
      'Cộng +20 điểm tín nhiệm định kỳ đầu tháng (Chính sách thưởng duy trì kỷ luật phòng họp)',
    createdAtIso: '01/11/2026 • 00:00',
  },
  {
    recordId: 'TSH-2026-002',
    userEmail: 'employee.dev@spotmatrix.vn',
    fullName: 'Nguyễn Minh Quân (Nhân viên)',
    deltaPoints: -10,
    balanceAfter: 90,
    eventType: 'NO_SHOW_PENALTY',
    reasonText:
      'Trừ -10 điểm do quá hạn 30 phút không quét QR xác nhận dùng phòng M2-04 (Tự động thu hồi phòng)',
    createdAtIso: '05/11/2026 • 10:31',
  },
  {
    recordId: 'TSH-2026-003',
    userEmail: 'employee.dev@spotmatrix.vn',
    fullName: 'Nguyễn Minh Quân (Nhân viên)',
    deltaPoints: 2,
    balanceAfter: 92,
    eventType: 'QR_CHECKIN_REWARD',
    reasonText: 'Cộng +2 điểm khi quét mã QR Check-in đúng giờ tại phòng M1-01',
    createdAtIso: '09/11/2026 • 07:55',
  },
  {
    recordId: 'TSH-2026-004',
    userEmail: 'employee.dev@spotmatrix.vn',
    fullName: 'Nguyễn Minh Quân (Nhân viên)',
    deltaPoints: 2,
    balanceAfter: 94,
    eventType: 'QR_CHECKIN_REWARD',
    reasonText: 'Cộng +2 điểm khi quét mã QR Check-in đúng giờ tại phòng M3-02',
    createdAtIso: '12/11/2026 • 13:52',
  },
  {
    recordId: 'TSH-2026-005',
    userEmail: 'employee.dev@spotmatrix.vn',
    fullName: 'Nguyễn Minh Quân (Nhân viên)',
    deltaPoints: 2,
    balanceAfter: 96,
    eventType: 'QR_CHECKIN_REWARD',
    reasonText: 'Cộng +2 điểm khi quét mã QR Check-in đúng giờ tại phòng M1-01',
    createdAtIso: '14/11/2026 • 08:02',
  },
  {
    recordId: 'TSH-2026-006',
    userEmail: 'manager.lead@spotmatrix.vn',
    fullName: 'Lê Thu Hà (Quản lý)',
    deltaPoints: 20,
    balanceAfter: 100,
    eventType: 'MONTHLY_BONUS_20',
    reasonText:
      'Cộng +20 điểm tín nhiệm định kỳ đầu tháng (Đạt trần tối đa 100 điểm)',
    createdAtIso: '01/11/2026 • 00:00',
  },
  {
    recordId: 'TSH-2026-007',
    userEmail: 'manager.lead@spotmatrix.vn',
    fullName: 'Lê Thu Hà (Quản lý)',
    deltaPoints: 2,
    balanceAfter: 100,
    eventType: 'QR_CHECKIN_REWARD',
    reasonText:
      'Cộng +2 điểm khi quét mã QR Check-in đúng giờ tại ghế H01-A3 (Hội trường Tầng 5)',
    createdAtIso: 'Hôm nay • 12:45',
  },
  {
    recordId: 'TSH-2026-008',
    userEmail: 'sysadmin@spotmatrix.vn',
    fullName: 'System Administrator',
    deltaPoints: 20,
    balanceAfter: 100,
    eventType: 'MONTHLY_BONUS_20',
    reasonText:
      'Cộng +20 điểm tín nhiệm định kỳ đầu tháng (Đạt trần tối đa 100 điểm)',
    createdAtIso: '01/11/2026 • 00:00',
  },
];

const INITIAL_FIVE_FLOOR_ROOMS = buildStandardFiveFloorRooms();

const INITIAL_MANAGED_USERS: ManagedUserAccountItem[] = [
  {
    accountCode: 'ACC-ADMIN-001',
    username: 'Systemadmin123',
    userEmail: 'sysadmin@spotmatrix.vn',
    fullName: 'System Administrator',
    departmentName: 'System Governance',
    role: 'SYS_ADMIN',
    trustScore: 100,
    accountStatus: 'ACTIVE',
    isOnline: false,
    lastActiveText: 'Chưa đăng nhập',
    recentIpAddresses: [
      '113.161.72.104 (TP.HCM)',
      '14.231.108.55 (Hà Nội)',
      '27.74.201.18 (Đà Nẵng)',
    ],
  },
  {
    accountCode: 'ACC-MGR-002',
    username: 'Managerlead123',
    userEmail: 'manager.lead@spotmatrix.vn',
    fullName: 'Lê Thu Hà (Quản lý)',
    departmentName: 'Product & Engineering',
    role: 'MANAGER',
    trustScore: 100,
    accountStatus: 'ACTIVE',
    isOnline: false,
    lastActiveText: 'Chưa đăng nhập',
    recentIpAddresses: ['113.161.72.104 (TP.HCM)'],
  },
  {
    accountCode: 'ACC-EMP-003',
    username: 'Employeedev123',
    userEmail: 'employee.dev@spotmatrix.vn',
    fullName: 'Nguyễn Minh Quân (Nhân viên)',
    departmentName: 'Product & Engineering',
    role: 'EMPLOYEE',
    trustScore: 96,
    accountStatus: 'ACTIVE',
    isOnline: false,
    lastActiveText: 'Chưa đăng nhập',
    recentIpAddresses: [
      '113.161.72.104 (TP.HCM)',
      '171.244.18.92 (Cần Thơ)',
    ],
  },
];

const INITIAL_DEPARTMENTS: OrganizationDepartmentItem[] = [
  {
    departmentId: 'DEPT-GOV-01',
    departmentCode: 'SYS-GOV',
    departmentName: 'System Governance',
    description:
      'Ban Quản trị Hệ thống, An ninh Mạng RBAC & Điều phối Tòa nhà 5 Tầng',
    managerEmail: 'sysadmin@spotmatrix.vn',
    managerName: 'System Administrator',
    floorLocation: 'Tầng 1 & Tầng 5 (Hội trường)',
    colorBadge: 'INDIGO',
    memberEmails: ['sysadmin@spotmatrix.vn'],
    updatedAtIso: new Date().toISOString(),
  },
  {
    departmentId: 'DEPT-ENG-02',
    departmentCode: 'PROD-ENG',
    departmentName: 'Product & Engineering',
    description:
      'Khối Kỹ thuật Phần mềm, Kiến trúc Không gian 3D Three.js & Nền tảng Cloud',
    managerEmail: 'manager.lead@spotmatrix.vn',
    managerName: 'Lê Thu Hà (Quản lý)',
    floorLocation: 'Tầng 2 & Tầng 3',
    colorBadge: 'TEAL',
    memberEmails: ['manager.lead@spotmatrix.vn', 'employee.dev@spotmatrix.vn'],
    updatedAtIso: new Date().toISOString(),
  },
  {
    departmentId: 'DEPT-DES-03',
    departmentCode: 'UX-DESIGN',
    departmentName: 'Product Design & UX',
    description:
      'Khối Thiết kế Trải nghiệm Không gian Số, Bản vẽ Mặt bằng 2D/3D & Đồ họa',
    managerEmail: 'tran.bao.ngoc@spotmatrix.vn',
    managerName: 'Trần Bảo Ngọc (UX Lead)',
    floorLocation: 'Tầng 3 — Khu Thiết kế & Sáng tạo',
    colorBadge: 'AMBER',
    memberEmails: ['tran.bao.ngoc@spotmatrix.vn'],
    updatedAtIso: new Date().toISOString(),
  },
  {
    departmentId: 'DEPT-AI-04',
    departmentCode: 'AI-DATA',
    departmentName: 'AI & Data Science',
    description:
      'Khối Trí tuệ Nhân tạo, Phân tích Mật độ Sử dụng Phòng họp & Tối ưu Công suất',
    managerEmail: 'pham.hoang.nam@spotmatrix.vn',
    managerName: 'Phạm Hoàng Nam (AI Researcher)',
    floorLocation: 'Tầng 4 — Khu AI & Khoa học Dữ liệu',
    colorBadge: 'ROSE',
    memberEmails: ['pham.hoang.nam@spotmatrix.vn'],
    updatedAtIso: new Date().toISOString(),
  },
];

const INITIAL_GROUPS: OrganizationGroupItem[] = [
  {
    groupId: 'GRP-3D-01',
    groupCode: 'SQUAD-3D-TWIN',
    groupName: 'Nhóm Kiến trúc Sơ đồ 3D & Spatial Twin',
    departmentName: 'Product & Engineering',
    description:
      'Phát triển mô hình 3D Three.js 5 tầng và Đấu trường La Mã Tầng 5',
    leaderEmail: 'manager.lead@spotmatrix.vn',
    leaderName: 'Lê Thu Hà (Quản lý)',
    projectTag: '3D Engine v5.0',
    memberEmails: ['manager.lead@spotmatrix.vn', 'employee.dev@spotmatrix.vn'],
    updatedAtIso: new Date().toISOString(),
  },
  {
    groupId: 'GRP-CORE-02',
    groupCode: 'SQUAD-CORE-API',
    groupName: 'Nhóm Core Backend, Optimistic Lock & MongoDB',
    departmentName: 'Product & Engineering',
    description:
      'Vận hành cơ chế giữ chỗ 5 phút, chống trùng lịch đa chiều và Cronjob 15p',
    leaderEmail: 'manager.lead@spotmatrix.vn',
    leaderName: 'Lê Thu Hà (Quản lý)',
    projectTag: 'Concurrency Lock',
    memberEmails: ['manager.lead@spotmatrix.vn', 'employee.dev@spotmatrix.vn'],
    updatedAtIso: new Date().toISOString(),
  },
  {
    groupId: 'GRP-SEC-03',
    groupCode: 'SQUAD-SEC-RBAC',
    groupName: 'Hội đồng Bảo mật RBAC & Kiểm toán Hệ thống',
    departmentName: 'System Governance',
    description:
      'Giám sát nhật ký truy vết, phê duyệt thuê Hội trường và quản lý điểm tín nhiệm',
    leaderEmail: 'sysadmin@spotmatrix.vn',
    leaderName: 'System Administrator',
    projectTag: 'Zero-Trust Audit',
    memberEmails: ['sysadmin@spotmatrix.vn'],
    updatedAtIso: new Date().toISOString(),
  },
];

const LOFI_CHORD_PROGRESSIONS: Record<LofiTrackStyleType, number[][]> = {
  CHILL_RHODES: [
    [174.61, 220.0, 261.63, 329.63],
    [164.81, 196.0, 246.94, 293.66],
    [146.83, 174.61, 220.0, 261.63],
    [130.81, 164.81, 196.0, 246.94],
  ],
  AMBIENT_SPACE: [
    [220.0, 261.63, 329.63, 392.0],
    [174.61, 220.0, 261.63, 329.63],
    [130.81, 196.0, 246.94, 329.63],
    [196.0, 246.94, 293.66, 329.63],
  ],
  RAINY_CAFE: [
    [146.83, 220.0, 261.63, 329.63],
    [196.0, 246.94, 293.66, 349.23],
    [130.81, 164.81, 246.94, 293.66],
    [220.0, 277.18, 329.63, 392.0],
  ],
};

function getPreviousMonthIsoDate(dayOfMonth = 15): string {
  const now = new Date();
  const prevMonthDate = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    dayOfMonth
  );
  const y = prevMonthDate.getFullYear();
  const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
  const d = String(prevMonthDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const MainWorkspaceRoutes: React.FC = () => {
  const navigate = useNavigate();
  const avatarDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] =
    useState<boolean>(false);

  useEffect(() => {
    const handleGlobalCmdK = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalCmdK);
    return () => window.removeEventListener('keydown', handleGlobalCmdK);
  }, []);
  const [isSyncingMongo, setIsSyncingMongo] = useState<boolean>(false);

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('spotmatrix_theme_mode');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const isDark = themeMode === 'dark';

  const [audioSettings, setAudioSettings] = useState<SpotMatrixAudioSettings>(
    () => {
      try {
        const raw = localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            lofiEnabled: Boolean(parsed.lofiEnabled),
            sfxEnabled: parsed.sfxEnabled !== false,
            lofiVolume:
              typeof parsed.lofiVolume === 'number' ? parsed.lofiVolume : 0.35,
            lofiTrackStyle: parsed.lofiTrackStyle || 'CHILL_RHODES',
          };
        }
      } catch {
        // Bỏ qua
      }
      return {
        lofiEnabled: false,
        sfxEnabled: true,
        lofiVolume: 0.35,
        lofiTrackStyle: 'CHILL_RHODES',
      };
    }
  );

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lofiIntervalRef = useRef<number | null>(null);
  const chordStepRef = useRef<number>(0);

  const getOrInitAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const playUiSoundEffect = useCallback(
    (
      type: 'CLICK' | 'SUCCESS' | 'ERROR' | 'NOTIFICATION',
      forcePlay = false
    ) => {
      if (!audioSettings.sfxEnabled && !forcePlay) return;
      const ctx = getOrInitAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'CLICK') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.045);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.055);
        return;
      }

      if (type === 'SUCCESS') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.065);
          gain.gain.setValueAtTime(0.11, now + idx * 0.065);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + idx * 0.065 + 0.22
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.065);
          osc.stop(now + idx * 0.065 + 0.24);
        });
        return;
      }

      if (type === 'ERROR') {
        [240, 180].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.11);
          gain.gain.setValueAtTime(0.09, now + idx * 0.11);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + idx * 0.11 + 0.16
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.11);
          osc.stop(now + idx * 0.11 + 0.18);
        });
        return;
      }

      if (type === 'NOTIFICATION') {
        [880, 1318.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.1, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + idx * 0.08 + 0.3
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.32);
        });
      }
    },
    [audioSettings.sfxEnabled, getOrInitAudioContext]
  );

  useEffect(() => {
    if (lofiIntervalRef.current) {
      window.clearInterval(lofiIntervalRef.current);
      lofiIntervalRef.current = null;
    }
    if (!audioSettings.lofiEnabled) return;

    const playSingleLofiBar = () => {
      const ctx = getOrInitAudioContext();
      if (!ctx) return;
      const progression =
        LOFI_CHORD_PROGRESSIONS[audioSettings.lofiTrackStyle] ||
        LOFI_CHORD_PROGRESSIONS.CHILL_RHODES;
      const chord = progression[chordStepRef.current % progression.length];
      chordStepRef.current += 1;

      const now = ctx.currentTime;
      const masterVol =
        Math.max(0.02, Math.min(1, audioSettings.lofiVolume)) * 0.12;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(
        audioSettings.lofiTrackStyle === 'AMBIENT_SPACE' ? 750 : 1050,
        now
      );
      filter.connect(ctx.destination);

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type =
          audioSettings.lofiTrackStyle === 'AMBIENT_SPACE'
            ? 'sine'
            : 'triangle';
        osc.frequency.setValueAtTime(
          freq + (idx % 2 === 0 ? 0.4 : -0.4),
          now
        );
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(
          masterVol / chord.length,
          now + 0.35
        );
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 2.9);
        osc.connect(gain);
        gain.connect(filter);
        osc.start(now);
        osc.stop(now + 2.95);
      });

      if (audioSettings.lofiTrackStyle === 'CHILL_RHODES') {
        [0, 1.5].forEach((beatOffset) => {
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(115, now + beatOffset);
          kickOsc.frequency.exponentialRampToValueAtTime(
            42,
            now + beatOffset + 0.14
          );
          kickGain.gain.setValueAtTime(masterVol * 0.85, now + beatOffset);
          kickGain.gain.exponentialRampToValueAtTime(
            0.001,
            now + beatOffset + 0.18
          );
          kickOsc.connect(kickGain);
          kickGain.connect(ctx.destination);
          kickOsc.start(now + beatOffset);
          kickOsc.stop(now + beatOffset + 0.2);
        });
      }
    };

    playSingleLofiBar();
    lofiIntervalRef.current = window.setInterval(playSingleLofiBar, 3000);

    return () => {
      if (lofiIntervalRef.current) {
        window.clearInterval(lofiIntervalRef.current);
        lofiIntervalRef.current = null;
      }
    };
  }, [
    audioSettings.lofiEnabled,
    audioSettings.lofiVolume,
    audioSettings.lofiTrackStyle,
    getOrInitAudioContext,
  ]);

  const persistAudioSettings = (next: SpotMatrixAudioSettings) => {
    setAudioSettings(next);
    try {
      localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Bỏ qua
    }
  };

  const toggleThemeMode = () => {
    const next = isDark ? 'light' : 'dark';
    setThemeMode(next);
    localStorage.setItem('spotmatrix_theme_mode', next);
    playUiSoundEffect('CLICK');
  };

  const [userSession, setUserSession] =
    useState<AuthenticatedUserSession | null>(() => {
      try {
        const savedRaw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        return savedRaw ? JSON.parse(savedRaw) : null;
      } catch {
        return null;
      }
    });

  const [profileCustomMap, setProfileCustomMap] = useState<
    Record<
      string,
      {
        avatarUrl: string | null;
        backgroundUrl: string | null;
        phoneNumber: string;
        jobTitle: string;
        bioText: string;
      }
    >
  >(() => {
    try {
      const raw = localStorage.getItem(PROFILE_CUSTOM_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [activePage, setActivePage] = useState<ActiveSidebarPage>('OVERVIEW');
  const [workspaceNodes, setWorkspaceNodes] =
    useState<WorkspaceNodeItem[]>(INITIAL_FIVE_FLOOR_ROOMS);
  const [selectedNode, setSelectedNode] = useState<WorkspaceNodeItem | null>(
    INITIAL_FIVE_FLOOR_ROOMS[0]
  );
  const [preselectedSlot, setPreselectedSlot] = useState<{
    dateIso?: string;
    start: string;
    end: string;
    purposeNote?: string;
    approvalRequestReason?: string;
    seatCode?: string;
    hallMode?: 'HALL_EVENT_RENTAL' | 'HALL_SEAT_BOOKING';
  } | null>(null);

  const [webLanguage, setWebLanguage] = useState<WebLanguageCodeType>(() => {
    const saved = localStorage.getItem(WEB_LANGUAGE_STORAGE_KEY);
    return (
      saved === 'en' || saved === 'ja' ? saved : 'vi'
    ) as WebLanguageCodeType;
  });

  const [departmentsList, setDepartmentsList] =
    useState<OrganizationDepartmentItem[]>(INITIAL_DEPARTMENTS);
  const [groupsList, setGroupsList] =
    useState<OrganizationGroupItem[]>(INITIAL_GROUPS);

  const [bookingsList, setBookingsList] = useState<BookingPayloadItem[]>([
    {
      bookingId: 'BK-2026-HALL-01',
      nodeId: 'H-01',
      userEmail: 'sysadmin@spotmatrix.vn',
      requesterUsername: 'Systemadmin123',
      requesterRole: 'SYS_ADMIN',
      departmentName: 'System Governance',
      bookingDateIso: new Date().toISOString().slice(0, 10),
      startTimeIso: '13:00',
      endTimeIso: '15:00',
      purposeNote: 'Townhall Quý 4 & Ra mắt Kiến trúc Không gian 3D',
      recurringOption: 'NONE',
      occurrenceDates: [new Date().toISOString().slice(0, 10)],
      lockVersion: 1,
      bookingStatus: 'CONFIRMED',
      approvalStatus: 'APPROVED',
      approvedByUsername: 'Systemadmin123',
      bookingMode: 'HALL_EVENT_RENTAL',
      allowedDepartments: [
        'System Governance',
        'Product & Engineering',
        'Product Design & UX',
      ],
    },
    {
      bookingId: 'BK-2026-001',
      nodeId: 'M1-01',
      userEmail: 'employee.dev@spotmatrix.vn',
      requesterUsername: 'Employeedev123',
      requesterRole: 'EMPLOYEE',
      departmentName: 'Product & Engineering',
      bookingDateIso: new Date().toISOString().slice(0, 10),
      startTimeIso: '08:00',
      endTimeIso: '10:00',
      purposeNote: 'Họp Kiến trúc Hệ thống 3D (Tầng 1)',
      approvalRequestReason:
        'Xin phép họp rà soát sơ đồ 3D PBR cùng nhóm Frontend',
      recurringOption: 'NONE',
      occurrenceDates: [new Date().toISOString().slice(0, 10)],
      lockVersion: 1,
      bookingStatus: 'CONFIRMED',
      approvalStatus: 'APPROVED',
      approvedByUsername: 'Managerlead123',
    },
    {
      bookingId: 'BK-2026-002',
      nodeId: 'H01-A3',
      userEmail: 'manager.lead@spotmatrix.vn',
      requesterUsername: 'Managerlead123',
      requesterRole: 'MANAGER',
      departmentName: 'Product & Engineering',
      bookingDateIso: new Date().toISOString().slice(0, 10),
      startTimeIso: '13:00',
      endTimeIso: '15:00',
      purposeNote: '[Hội trường Tầng 5 - Ghế H01-A3] Townhall Quý 4',
      recurringOption: 'NONE',
      occurrenceDates: [new Date().toISOString().slice(0, 10)],
      lockVersion: 2,
      bookingStatus: 'CHECKED_IN',
      approvalStatus: 'APPROVED',
      approvedByUsername: 'Systemadmin123',
      checkedInAtIso: '12:45:10 • Hôm nay',
      checkedInTimestampMs: Date.now() - 3600 * 1000,
      qrToken: 'QR-SMX-H01A3-BK2026002-CHECKIN',
    },
    {
      bookingId: 'BK-2026-PREV-01',
      nodeId: 'M2-02',
      userEmail: 'employee.dev@spotmatrix.vn',
      requesterUsername: 'Employeedev123',
      requesterRole: 'EMPLOYEE',
      departmentName: 'Product & Engineering',
      bookingDateIso: getPreviousMonthIsoDate(10),
      startTimeIso: '09:00',
      endTimeIso: '11:00',
      purposeNote: 'Họp Sprint Planning Tháng trước (Tầng 2)',
      recurringOption: 'NONE',
      occurrenceDates: [getPreviousMonthIsoDate(10)],
      lockVersion: 1,
      bookingStatus: 'CHECKED_IN',
      approvalStatus: 'APPROVED',
      approvedByUsername: 'Managerlead123',
      checkedInAtIso: `08:52:00 • Ngày ${getPreviousMonthIsoDate(10)}`,
      checkedInTimestampMs: Date.now() - 25 * 24 * 3600 * 1000,
    },
    {
      bookingId: 'BK-2026-PREV-02',
      nodeId: 'M3-04',
      userEmail: 'employee.dev@spotmatrix.vn',
      requesterUsername: 'Employeedev123',
      requesterRole: 'EMPLOYEE',
      departmentName: 'Product & Engineering',
      bookingDateIso: getPreviousMonthIsoDate(18),
      startTimeIso: '14:00',
      endTimeIso: '16:00',
      purposeNote: 'Review Giao diện 3D WebGL Tháng trước',
      recurringOption: 'NONE',
      occurrenceDates: [getPreviousMonthIsoDate(18)],
      lockVersion: 1,
      bookingStatus: 'EXPIRED_NO_SHOW',
      approvalStatus: 'APPROVED',
      approvedByUsername: 'Managerlead123',
      expiredAtIso: `14:31:00 • Ngày ${getPreviousMonthIsoDate(18)}`,
      expiredAtTimestampMs: Date.now() - 18 * 24 * 3600 * 1000,
    },
  ]);

  const [equipmentsList, setEquipmentsList] =
    useState<SharedEquipmentItem[]>(INITIAL_ROOM_EQUIPMENTS);
  const [equipmentFaultReports, setEquipmentFaultReports] =
    useState<EquipmentFaultReportItem[]>(INITIAL_EQUIPMENT_FAULT_REPORTS);
  const [trustProfiles, setTrustProfiles] =
    useState<UserTrustProfileItem[]>(INITIAL_TRUST_PROFILES);
  const [trustScoreHistory, setTrustScoreHistory] =
    useState<TrustScoreHistoryRecordItem[]>(INITIAL_TRUST_SCORE_HISTORY);
  const [auditLogs, setAuditLogs] = useState<AuditConcurrencyLogItem[]>([
    {
      auditId: 'AUD-INIT-01',
      eventCategory: 'QR_CHECKIN_SUCCESS',
      actorEmail: 'manager.lead@spotmatrix.vn',
      targetNodeId: 'H01-A3',
      outcomeStatus: 'SUCCESS',
      detailMessage:
        'Xác nhận quét QR đúng hạn tại Hội trường H01-A3 lúc 12:45:10 (+2 điểm tín nhiệm).',
      ipAddress: '113.161.72.104',
      createdAtIso: new Date().toISOString(),
    },
  ]);
  const [managedUsers, setManagedUsers] =
    useState<ManagedUserAccountItem[]>(INITIAL_MANAGED_USERS);

  const [notificationsList, setNotificationsList] = useState<
    NotificationRecordItem[]
  >([]);
  const [activePopupNotification, setActivePopupNotification] =
    useState<NotificationRecordItem | null>(null);

  const isSysAdmin = userSession?.userProfile.role === 'SYS_ADMIN';

  useEffect(() => {
    const activeUsername = userSession?.userProfile.username?.toLowerCase();
    setManagedUsers((prev) =>
      prev.map((u) =>
        activeUsername && u.username.toLowerCase() === activeUsername
          ? {
              ...u,
              isOnline: true,
              lastActiveText: 'Đang trực tuyến (Phiên hiện tại)',
            }
          : { ...u, isOnline: false, lastActiveText: 'Chưa đăng nhập' }
      )
    );
  }, [userSession?.userProfile.username]);

  // Đồng bộ toàn bộ dữ liệu từ MongoDB Atlas khi đăng nhập hoặc mở trang
  const fetchAccountProfileAndWorkspaceFromMongo = useCallback(
    async (username: string) => {
      try {
        const [
          profileRes,
          bookingsRes,
          trustRes,
          auditRes,
          orgRes,
          equipRes,
          faultRes,
          historyRes,
        ] = await Promise.allSettled([
          fetch(`/api/v1/auth/profile/${encodeURIComponent(username)}`),
          fetch('/api/v1/bookings'),
          fetch('/api/v1/datamanager/trust-scores'),
          fetch('/api/v1/datamanager/audit-logs'),
          fetch('/api/v1/organization'),
          fetch('/api/v1/datamanager/equipments'),
          fetch('/api/v1/datamanager/fault-reports'),
          fetch('/api/v1/datamanager/trust-history'),
        ]);

        if (orgRes.status === 'fulfilled' && orgRes.value.ok) {
          const oJson = await orgRes.value.json();
          if (oJson?.success && oJson.data) {
            if (
              Array.isArray(oJson.data.departments) &&
              oJson.data.departments.length > 0
            ) {
              setDepartmentsList(oJson.data.departments);
            }
            if (
              Array.isArray(oJson.data.groups) &&
              oJson.data.groups.length > 0
            ) {
              setGroupsList(oJson.data.groups);
            }
          }
        }

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const json = await profileRes.value.json();
          if (json?.success && json.data) {
            const p = json.data;
            setProfileCustomMap((prev) => {
              const nextMap = {
                ...prev,
                [username]: {
                  avatarUrl: p.avatarUrl ?? prev[username]?.avatarUrl ?? null,
                  backgroundUrl:
                    p.backgroundUrl ?? prev[username]?.backgroundUrl ?? null,
                  phoneNumber:
                    p.phoneNumber ||
                    prev[username]?.phoneNumber ||
                    '0908 123 456',
                  jobTitle:
                    p.jobTitle ||
                    prev[username]?.jobTitle ||
                    'Senior System Member',
                  bioText:
                    p.bioText ||
                    prev[username]?.bioText ||
                    'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
                },
              };
              try {
                localStorage.setItem(
                  PROFILE_CUSTOM_STORAGE_KEY,
                  JSON.stringify(nextMap)
                );
              } catch {
                // Bỏ qua
              }
              return nextMap;
            });
          }
        }

        if (bookingsRes.status === 'fulfilled' && bookingsRes.value.ok) {
          const bJson = await bookingsRes.value.json();
          if (
            bJson?.success &&
            Array.isArray(bJson.data) &&
            bJson.data.length > 0
          ) {
            setBookingsList(bJson.data);
          }
        }

        if (trustRes.status === 'fulfilled' && trustRes.value.ok) {
          const tJson = await trustRes.value.json();
          if (
            tJson?.success &&
            Array.isArray(tJson.data) &&
            tJson.data.length > 0
          ) {
            setTrustProfiles(tJson.data);
          }
        }

        if (auditRes.status === 'fulfilled' && auditRes.value.ok) {
          const aJson = await auditRes.value.json();
          if (
            aJson?.success &&
            Array.isArray(aJson.data) &&
            aJson.data.length > 0
          ) {
            setAuditLogs(aJson.data);
          }
        }

        if (equipRes.status === 'fulfilled' && equipRes.value.ok) {
          const eqJson = await equipRes.value.json();
          if (
            eqJson?.success &&
            Array.isArray(eqJson.data) &&
            eqJson.data.length > 0
          ) {
            setEquipmentsList(eqJson.data);
          }
        }

        if (faultRes.status === 'fulfilled' && faultRes.value.ok) {
          const fJson = await faultRes.value.json();
          if (
            fJson?.success &&
            Array.isArray(fJson.data) &&
            fJson.data.length > 0
          ) {
            setEquipmentFaultReports(fJson.data);
          }
        }

        if (historyRes.status === 'fulfilled' && historyRes.value.ok) {
          const hJson = await historyRes.value.json();
          if (
            hJson?.success &&
            Array.isArray(hJson.data) &&
            hJson.data.length > 0
          ) {
            setTrustScoreHistory(hJson.data);
          }
        }
      } catch {
        // Giữ nguyên state dự phòng
      }
    },
    []
  );

  useEffect(() => {
    if (userSession?.userProfile.username) {
      fetchAccountProfileAndWorkspaceFromMongo(
        userSession.userProfile.username
      );
    }
  }, [
    userSession?.userProfile.username,
    fetchAccountProfileAndWorkspaceFromMongo,
  ]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        avatarDropdownRef.current &&
        !avatarDropdownRef.current.contains(e.target as Node)
      ) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recordRealtimeAuditLog = useCallback(
    (
      eventCategory: AuditConcurrencyLogItem['eventCategory'],
      actorEmail: string,
      targetNodeId: string,
      detailMessage: string,
      outcomeStatus: 'SUCCESS' | 'CONFLICT_BLOCKED' | 'AUTO_REVOKED' = 'SUCCESS',
      lockVersionAttempted?: number
    ) => {
      const newAudit: AuditConcurrencyLogItem = {
        auditId: `AUD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        eventCategory,
        actorEmail,
        targetNodeId,
        lockVersionAttempted,
        outcomeStatus,
        detailMessage,
        ipAddress: '113.161.72.104',
        createdAtIso: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      fetch('/api/v1/datamanager/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAudit),
      }).catch(() => {});
    },
    []
  );

  const pushRealtimeNotification = useCallback(
    async (
      titleText: string,
      contentText: string,
      category: NotificationCategoryType = 'BOOKING_EVENT',
      relatedNodeId?: string,
      extraApproval?: {
        approvalBookingId: string;
        approvalHandledStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
      },
      customRecipientEmail?: string
    ) => {
      if (category === 'FLOORPLAN_UPDATE') return;

      const localItem: NotificationRecordItem = {
        notificationId: `NTF-${Date.now()}-${Math.floor(Math.random() * 99)}`,
        recipientEmail:
          customRecipientEmail || userSession?.userProfile.userEmail || 'all',
        titleText,
        contentText,
        category,
        isRead: false,
        relatedNodeId,
        approvalBookingId: extraApproval?.approvalBookingId,
        approvalHandledStatus: extraApproval?.approvalHandledStatus,
        createdAtIso: new Date().toISOString(),
      };

      setNotificationsList((prev) => [localItem, ...prev]);
      setActivePopupNotification(localItem);
      playUiSoundEffect('NOTIFICATION');
    },
    [userSession, playUiSoundEffect]
  );

  useEffect(() => {
    if (!activePopupNotification) return;
    const timer = setTimeout(() => {
      setActivePopupNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [activePopupNotification]);

  const handleLoginSuccess = (sessionData: AuthenticatedUserSession) => {
    setUserSession(sessionData);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    setActivePage('OVERVIEW');
    navigate('/dashboard', { replace: true });
    playUiSoundEffect('SUCCESS');

    recordRealtimeAuditLog(
      'USER_LOGIN_SESSION',
      sessionData.userProfile.userEmail,
      'AUTH_GATEWAY',
      `Đăng nhập thành công vào hệ thống SpotMatrix bởi @${sessionData.userProfile.username} (IP: 113.161.72.104).`
    );

    const incomingProfile =
      sessionData.userProfile as AuthenticatedUserSession['userProfile'] & {
        avatarUrl?: string | null;
        backgroundUrl?: string | null;
        phoneNumber?: string;
        jobTitle?: string;
        bioText?: string;
      };
    if (incomingProfile.username) {
      setProfileCustomMap((prev) => ({
        ...prev,
        [incomingProfile.username]: {
          avatarUrl:
            incomingProfile.avatarUrl ??
            prev[incomingProfile.username]?.avatarUrl ??
            null,
          backgroundUrl:
            incomingProfile.backgroundUrl ??
            prev[incomingProfile.username]?.backgroundUrl ??
            null,
          phoneNumber:
            incomingProfile.phoneNumber ||
            prev[incomingProfile.username]?.phoneNumber ||
            '0908 123 456',
          jobTitle:
            incomingProfile.jobTitle ||
            prev[incomingProfile.username]?.jobTitle ||
            'Senior System Member',
          bioText:
            incomingProfile.bioText ||
            prev[incomingProfile.username]?.bioText ||
            'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
        },
      }));
      fetchAccountProfileAndWorkspaceFromMongo(incomingProfile.username);
    }

    setManagedUsers((prev) => {
      const targetUser = sessionData.userProfile.username.toLowerCase();
      return prev.map((u) =>
        u.username.toLowerCase() === targetUser
          ? {
              ...u,
              isOnline: true,
              lastActiveText: 'Đang trực tuyến (Phiên hiện tại)',
            }
          : { ...u, isOnline: false, lastActiveText: 'Chưa đăng nhập' }
      );
    });
  };

  const handleLogout = () => {
    const loggingOutUsername =
      userSession?.userProfile.username?.toLowerCase();
    setManagedUsers((prev) =>
      prev.map((u) =>
        loggingOutUsername && u.username.toLowerCase() === loggingOutUsername
          ? { ...u, isOnline: false, lastActiveText: 'Vừa đăng xuất' }
          : u
      )
    );
    setIsAvatarMenuOpen(false);
    setIsMobileSidebarOpen(false);
    setUserSession(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setActivePopupNotification(null);
    navigate('/login', { replace: true });
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotificationsList((prev) =>
      prev.filter((item) => item.notificationId !== notificationId)
    );
  };

  const handleSelectAndNavigateNotification = (
    notifItem: NotificationRecordItem
  ) => {
    setNotificationsList((prev) =>
      prev.map((n) =>
        n.notificationId === notifItem.notificationId
          ? { ...n, isRead: true }
          : n
      )
    );

    if (notifItem.category === 'EQUIPMENT_FAULT_ALERT') {
      setActivePage('DATAMANAGER');
      return;
    }

    if (notifItem.relatedNodeId) {
      const foundNode = workspaceNodes.find(
        (n) =>
          n.nodeId === notifItem.relatedNodeId ||
          n.nodeCode === notifItem.relatedNodeId
      );
      if (foundNode) {
        setSelectedNode(foundNode);
        setActivePage('FLOORPLAN');
        return;
      }
    }
    setActivePage('BOOKING');
  };

  const handleNavigateToBookingWithSlot = (
    nodeItem: WorkspaceNodeItem,
    slotTime: {
      dateIso?: string;
      start: string;
      end: string;
      purposeNote?: string;
      approvalRequestReason?: string;
      seatCode?: string;
      hallMode?: 'HALL_EVENT_RENTAL' | 'HALL_SEAT_BOOKING';
    }
  ) => {
    setSelectedNode(nodeItem);
    setPreselectedSlot(slotTime);
    setActivePage('BOOKING');
    playUiSoundEffect('CLICK');
  };

  const handleApprovalDecision = (
    bookingId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    const actorUsername = userSession?.userProfile.username || 'Systemadmin123';
    const approvedTimeStr = new Date().toLocaleTimeString('vi-VN');
    playUiSoundEffect(decision === 'APPROVED' ? 'SUCCESS' : 'ERROR');

    const targetBk = bookingsList.find((b) => b.bookingId === bookingId);
    if (targetBk && decision === 'REJECTED') {
      const matchedNode = workspaceNodes.find(
        (n) => n.nodeCode === targetBk.nodeId
      );
      if (matchedNode) {
        setWorkspaceNodes((prev) =>
          prev.map((n) =>
            n.nodeId === matchedNode.nodeId
              ? { ...n, status: 'AVAILABLE' }
              : n
          )
        );
      }
      pushRealtimeNotification(
        `[Từ chối yêu cầu] Đặt phòng ${targetBk.nodeId}`,
        `Yêu cầu đặt vị trí ${targetBk.nodeId} (${targetBk.startTimeIso} – ${targetBk.endTimeIso}) không được phê duyệt bởi @${actorUsername}. Đơn đã được chuyển vào Lịch sử Đặt phòng.`,
        'BOOKING_EVENT',
        targetBk.nodeId,
        undefined,
        targetBk.userEmail
      );
    }

    setBookingsList((prev) =>
      prev.map((b) =>
        b.bookingId === bookingId
          ? {
              ...b,
              approvalStatus: decision,
              approvedByUsername: actorUsername,
              approvedAtIso: approvedTimeStr,
              rejectedAtIso: decision === 'REJECTED' ? approvedTimeStr : null,
              rejectedAtTimestampMs:
                decision === 'REJECTED' ? Date.now() : null,
              bookingStatus:
                decision === 'REJECTED' ? 'CANCELLED' : 'CONFIRMED',
            }
          : b
      )
    );

    fetch(`/api/v1/bookings/${encodeURIComponent(bookingId)}/approval`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approvalStatus: decision,
        approvedByUsername: actorUsername,
        approvedAtIso: approvedTimeStr,
      }),
    }).catch(() => {});

    setNotificationsList((prev) =>
      prev.map((n) =>
        n.approvalBookingId === bookingId
          ? {
              ...n,
              isRead: true,
              approvalHandledStatus: decision,
              approvalHandledBy: actorUsername,
            }
          : n
      )
    );

    recordRealtimeAuditLog(
      'POLICY_CONFIG_UPDATED',
      actorUsername,
      bookingId,
      `@${actorUsername} đã [${
        decision === 'APPROVED' ? 'CHẤP NHẬN' : 'TỪ CHỐI'
      }] yêu cầu đặt phòng ${bookingId}.`
    );
  };

  const handleAdminDeleteBookingWithNotification = (
    bookingId: string,
    reasonText: string
  ) => {
    const targetBk = bookingsList.find((b) => b.bookingId === bookingId);
    const adminUsername = userSession?.userProfile.username || 'Systemadmin123';

    setBookingsList((prev) => prev.filter((b) => b.bookingId !== bookingId));

    fetch(`/api/v1/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
    }).catch(() => {});

    if (targetBk) {
      const matchedNode = workspaceNodes.find(
        (n) => n.nodeCode === targetBk.nodeId
      );
      if (matchedNode) {
        setWorkspaceNodes((prev) =>
          prev.map((n) =>
            n.nodeId === matchedNode.nodeId
              ? { ...n, status: 'AVAILABLE' }
              : n
          )
        );
      }

      pushRealtimeNotification(
        `[Thông báo từ Admin] Đã xóa lịch đặt phòng ${targetBk.nodeId} (${targetBk.bookingId})`,
        `Quản trị viên (@${adminUsername}) đã xóa lịch đặt vị trí ${targetBk.nodeId} (${targetBk.startTimeIso} – ${targetBk.endTimeIso}, ngày ${
          targetBk.bookingDateIso || 'Hôm nay'
        }) của ${targetBk.userEmail}. Lý do: ${reasonText}`,
        'SYSTEM_POLICY',
        targetBk.nodeId,
        undefined,
        targetBk.userEmail
      );

      recordRealtimeAuditLog(
        'POLICY_CONFIG_UPDATED',
        adminUsername,
        targetBk.nodeId,
        `[Admin Xóa Lịch & Gửi Thông Báo] @${adminUsername} đã xóa vé ${targetBk.bookingId} tại ${targetBk.nodeId} của ${targetBk.userEmail}. Lý do: "${reasonText}".`,
        'AUTO_REVOKED'
      );
    }
  };

  const handleUpdateNodeCoords = async (
    nodeId: string,
    posX: number,
    posY: number
  ) => {
    setWorkspaceNodes((prev) =>
      prev.map((item) =>
        item.nodeId === nodeId ? { ...item, position2D: { posX, posY } } : item
      )
    );
  };

  const handleUpdateNodeStatus = async (
    nodeId: string,
    nextStatus: SeatStatusType
  ) => {
    setWorkspaceNodes((prev) =>
      prev.map((item) =>
        item.nodeId === nodeId ? { ...item, status: nextStatus } : item
      )
    );
    setSelectedNode((prev) =>
      prev && prev.nodeId === nodeId ? { ...prev, status: nextStatus } : prev
    );
  };

  const handleCreateNewNode = async (payload: {
    nodeCode: string;
    nodeLabel: string;
    zoneType: WorkspaceZoneType;
    floorLevel: number;
    capacityCount: number;
    posX: number;
    posY: number;
    amenitiesList: string[];
  }) => {
    const newNode: WorkspaceNodeItem = {
      nodeId: `NODE-${payload.nodeCode.replace('-', '')}-${Date.now()
        .toString()
        .slice(-3)}`,
      nodeCode: payload.nodeCode,
      nodeLabel: payload.nodeLabel,
      zoneType: payload.zoneType,
      floorLevel: payload.floorLevel,
      position2D: { posX: payload.posX, posY: payload.posY },
      position3D: { coordX: 0, coordY: 0.5, coordZ: 0 },
      capacityCount: Math.max(2, payload.capacityCount),
      status: 'AVAILABLE',
      amenitiesList: payload.amenitiesList,
      aiScore: 95,
      lockVersion: 1,
    };
    setWorkspaceNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
    playUiSoundEffect('SUCCESS');
  };

  const handleQuickBooking = (
    targetNode: WorkspaceNodeItem,
    customEmail?: string,
    note?: string,
    customTargetCode?: string,
    timeWindow?: BookingTimeWindowInput
  ) => {
    const codeToBook = customTargetCode || targetNode.nodeCode;
    const currentRole = userSession?.userProfile.role || 'EMPLOYEE';
    const isHallWholeRoomRental =
      codeToBook === 'H-01' || timeWindow?.bookingMode === 'HALL_EVENT_RENTAL';
    const isHallSeatBooking =
      /^H01-[A-C]\d+$/i.test(codeToBook) ||
      timeWindow?.bookingMode === 'HALL_SEAT_BOOKING';

    const needsApproval = isHallWholeRoomRental
      ? currentRole !== 'SYS_ADMIN'
      : isHallSeatBooking
      ? false
      : currentRole === 'EMPLOYEE';

    handleUpdateNodeStatus(
      targetNode.nodeId,
      needsApproval ? 'HOLDING' : 'RESERVED'
    );

    const newBookingId = `BK-${Date.now().toString().slice(-4)}`;
    const baseDate =
      timeWindow?.dateIso || new Date().toISOString().slice(0, 10);
    const newBookingItem: BookingPayloadItem = {
      bookingId: newBookingId,
      nodeId: codeToBook,
      userEmail:
        customEmail ||
        userSession?.userProfile.userEmail ||
        'employee@spotmatrix.vn',
      requesterUsername: userSession?.userProfile.username || 'Employeedev123',
      requesterRole: currentRole,
      departmentName:
        userSession?.userProfile.departmentName || 'Product & Engineering',
      bookingDateIso: baseDate,
      startTimeIso: timeWindow?.start || '08:00',
      endTimeIso: timeWindow?.end || '10:00',
      purposeNote: note || `Đặt lịch ${targetNode.nodeLabel}`,
      approvalRequestReason: timeWindow?.approvalRequestReason,
      recurringOption: timeWindow?.recurringOption || 'NONE',
      occurrenceDates: timeWindow?.occurrenceDates || [baseDate],
      lockVersion: timeWindow?.lockVersion || (targetNode.lockVersion || 1) + 1,
      bookingStatus: 'CONFIRMED',
      approvalStatus: needsApproval ? 'PENDING_APPROVAL' : 'APPROVED',
      qrToken: generateQrCheckinToken(codeToBook, newBookingId),
      approvedByUsername: needsApproval
        ? null
        : userSession?.userProfile.username || 'Systemadmin123',
      bookingMode:
        timeWindow?.bookingMode ||
        (isHallWholeRoomRental
          ? 'HALL_EVENT_RENTAL'
          : isHallSeatBooking
          ? 'HALL_SEAT_BOOKING'
          : 'STANDARD_ROOM'),
      allowedDepartments: timeWindow?.allowedDepartments || [],
      parentHallEventBookingId: timeWindow?.parentHallEventBookingId || null,
    };

    setBookingsList((prev) => [newBookingItem, ...prev]);
    playUiSoundEffect('SUCCESS');

    recordRealtimeAuditLog(
      'OPTIMISTIC_LOCK_WIN',
      newBookingItem.userEmail,
      codeToBook,
      `[Đặt lịch Thành công - Lock v${newBookingItem.lockVersion}] @${newBookingItem.requesterUsername} đặt ${codeToBook} (${newBookingItem.startTimeIso}-${newBookingItem.endTimeIso}).`,
      'SUCCESS',
      newBookingItem.lockVersion
    );

    fetch('/api/v1/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBookingItem),
    }).catch(() => {});

    if (needsApproval) {
      const reasonSuffix = timeWindow?.approvalRequestReason
        ? ` Lý do xin phép: "${timeWindow.approvalRequestReason}".`
        : '';
      pushRealtimeNotification(
        `[Cần Phê Duyệt] Yêu cầu đặt ${codeToBook}`,
        `@${userSession?.userProfile.username} xin đặt ${codeToBook} (${newBookingItem.startTimeIso} - ${newBookingItem.endTimeIso}, ngày ${baseDate}).${reasonSuffix}`,
        'BOOKING_APPROVAL_REQUEST',
        targetNode.nodeId,
        { approvalBookingId: newBookingId, approvalHandledStatus: 'PENDING' }
      );
    } else {
      pushRealtimeNotification(
        `Đặt lịch thành công: ${codeToBook}`,
        `Đã cấp mã QR Check-in cho "${newBookingItem.purposeNote}" (${newBookingItem.startTimeIso} - ${newBookingItem.endTimeIso}, ngày ${baseDate}).`,
        'BOOKING_EVENT',
        targetNode.nodeId
      );
    }
  };

  const handleCheckInBooking = useCallback(
    (bookingId: string, exactScanTimeText?: string) => {
      const now = new Date();
      const frozenTime =
        exactScanTimeText ||
        `${now.toLocaleTimeString('vi-VN')} • Ngày ${now.toLocaleDateString(
          'vi-VN'
        )}`;

      const targetBk = bookingsList.find((b) => b.bookingId === bookingId);
      const targetEmail =
        targetBk?.userEmail || userSession?.userProfile.userEmail || '';

      setBookingsList((prev) =>
        prev.map((b) =>
          b.bookingId === bookingId
            ? {
                ...b,
                bookingStatus: 'CHECKED_IN',
                checkedInAtIso: frozenTime,
                checkedInTimestampMs: Date.now(),
              }
            : b
        )
      );
      playUiSoundEffect('SUCCESS');

      setTrustProfiles((prev) =>
        prev.map((tp) => {
          if (tp.userEmail.toLowerCase() !== targetEmail.toLowerCase()) {
            return tp;
          }
          const nextScore = Math.min(100, tp.trustScore + 2);
          const historyItem: TrustScoreHistoryRecordItem = {
            recordId: `TSH-${Date.now()}-${Math.floor(
              Math.random() * 90 + 10
            )}`,
            userEmail: tp.userEmail,
            fullName: tp.fullName,
            deltaPoints: 2,
            balanceAfter: nextScore,
            eventType: 'QR_CHECKIN_REWARD',
            reasonText: `Cộng +2 điểm khi quét mã QR Check-in đúng giờ tại phòng ${
              targetBk?.nodeId || bookingId
            }`,
            createdAtIso: frozenTime,
          };
          setTrustScoreHistory((hPrev) => [historyItem, ...hPrev]);
          fetch('/api/v1/datamanager/trust-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(historyItem),
          }).catch(() => {});

          return {
            ...tp,
            trustScore: nextScore,
            onTimeCheckInCount: tp.onTimeCheckInCount + 1,
            updatedAtIso: new Date().toISOString(),
          };
        })
      );

      fetch(`/api/v1/bookings/${encodeURIComponent(bookingId)}/checkin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkedInAtIso: frozenTime }),
      }).catch(() => {});

      pushRealtimeNotification(
        `[Quét QR Nhận Phòng Thành Công] ${targetBk?.nodeId || bookingId}`,
        `Đã xác thực nhận phòng ${targetBk?.nodeId || ''} (${bookingId}) lúc ${frozenTime} và cộng +2 điểm Tín nhiệm. Vé sẽ lưu tại khung nhanh 3 ngày và chuyển vào Lịch sử.`,
        'BOOKING_EVENT',
        targetBk?.nodeId
      );

      recordRealtimeAuditLog(
        'QR_CHECKIN_SUCCESS',
        targetEmail || userSession?.userProfile.username || 'User',
        targetBk?.nodeId || bookingId,
        `Xác nhận quét mã QR đúng hạn cho vé ${bookingId} tại thời điểm cố định: [${frozenTime}] (+2 điểm tín nhiệm).`
      );
    },
    [
      bookingsList,
      userSession,
      playUiSoundEffect,
      pushRealtimeNotification,
      recordRealtimeAuditLog,
    ]
  );

  // Tự động thu hồi phòng khi quá hạn quét QR: Chuyển sang Trạng thái 3 (EXPIRED_NO_SHOW), trừ 10đ, thông báo và giữ hiển thị 3 ngày
  const handlePenalizeNoShowBooking = useCallback(
    (bookingId: string, targetUserEmail: string, nodeCode: string) => {
      const now = new Date();
      const expiredTimeStr = `${now.toLocaleTimeString(
        'vi-VN'
      )} • Ngày ${now.toLocaleDateString('vi-VN')}`;

      setBookingsList((prev) =>
        prev.map((b) =>
          b.bookingId === bookingId
            ? {
                ...b,
                bookingStatus: 'EXPIRED_NO_SHOW',
                expiredAtIso: expiredTimeStr,
                expiredAtTimestampMs: Date.now(),
                autoReleasedReason: `Quá hạn không quét QR xác nhận dùng phòng (${expiredTimeStr})`,
              }
            : b
        )
      );

      const matchedNode = workspaceNodes.find((n) => n.nodeCode === nodeCode);
      if (matchedNode) {
        setWorkspaceNodes((prev) =>
          prev.map((n) =>
            n.nodeId === matchedNode.nodeId
              ? { ...n, status: 'AVAILABLE' }
              : n
          )
        );
      }

      playUiSoundEffect('ERROR');

      setTrustProfiles((prev) =>
        prev.map((tp) => {
          if (tp.userEmail.toLowerCase() !== targetUserEmail.toLowerCase()) {
            return tp;
          }
          const nextScore = Math.max(0, tp.trustScore - 10);
          const historyItem: TrustScoreHistoryRecordItem = {
            recordId: `TSH-${Date.now()}-${Math.floor(
              Math.random() * 90 + 10
            )}`,
            userEmail: tp.userEmail,
            fullName: tp.fullName,
            deltaPoints: -10,
            balanceAfter: nextScore,
            eventType: 'NO_SHOW_PENALTY',
            reasonText: `Trừ -10 điểm do quá hạn không quét QR xác nhận dùng phòng ${nodeCode} (Tự động thu hồi phòng)`,
            createdAtIso: expiredTimeStr,
          };
          setTrustScoreHistory((hPrev) => [historyItem, ...hPrev]);
          fetch('/api/v1/datamanager/trust-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(historyItem),
          }).catch(() => {});

          return {
            ...tp,
            trustScore: nextScore,
            noShowPenaltyCount: tp.noShowPenaltyCount + 1,
            isRestrictedMode: nextScore < 60,
            updatedAtIso: new Date().toISOString(),
          };
        })
      );

      fetch('/api/v1/datamanager/trust-scores/adjust', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: targetUserEmail,
          eventType: 'NO_SHOW_EXPIRED',
          targetNodeId: nodeCode,
        }),
      }).catch(() => {});

      pushRealtimeNotification(
        `[Trễ hạn Quét QR • Thu hồi phòng ${nodeCode}]`,
        `Vé ${bookingId} đã quá thời gian cho phép quét QR xác nhận dùng phòng. Hệ thống tự động thu hồi phòng ${nodeCode}, chuyển vé sang Trạng thái 3 (Trễ hạn • Ẩn sau 3 ngày) và trừ 10 điểm tín nhiệm của ${targetUserEmail}.`,
        'TRUST_SCORE_ALERT',
        nodeCode,
        undefined,
        targetUserEmail
      );

      recordRealtimeAuditLog(
        'AUTO_RELEASE_NO_SHOW',
        targetUserEmail,
        nodeCode,
        `[Tự động Thu hồi Phòng & Trừ 10đ] Vé ${bookingId} tại ${nodeCode} quá hạn không quét QR Check-in lúc ${expiredTimeStr}.`,
        'AUTO_REVOKED'
      );
    },
    [
      workspaceNodes,
      playUiSoundEffect,
      pushRealtimeNotification,
      recordRealtimeAuditLog,
    ]
  );

  // Cộng +20 điểm tín nhiệm định kỳ hằng tháng cho toàn bộ nhân sự
  const handleTriggerMonthlyTrustBonus = useCallback(() => {
    const now = new Date();
    const timeLabel = `${now.toLocaleDateString(
      'vi-VN'
    )} • ${now.toLocaleTimeString('vi-VN')}`;

    setTrustProfiles((prev) => {
      const bonusHistoryEntries: TrustScoreHistoryRecordItem[] = [];
      const updated = prev.map((tp) => {
        const nextScore = Math.min(100, tp.trustScore + 20);
        const hItem: TrustScoreHistoryRecordItem = {
          recordId: `TSH-MONTH-${Date.now()}-${Math.floor(
            Math.random() * 900 + 100
          )}`,
          userEmail: tp.userEmail,
          fullName: tp.fullName,
          deltaPoints: 20,
          balanceAfter: nextScore,
          eventType: 'MONTHLY_BONUS_20',
          reasonText:
            'Cộng +20 điểm tín nhiệm định kỳ hằng tháng (Tối đa 100 điểm)',
          createdAtIso: timeLabel,
        };
        bonusHistoryEntries.push(hItem);
        fetch('/api/v1/datamanager/trust-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hItem),
        }).catch(() => {});

        return {
          ...tp,
          trustScore: nextScore,
          isRestrictedMode: nextScore < 60,
          updatedAtIso: now.toISOString(),
        };
      });
      setTrustScoreHistory((hPrev) => [...bonusHistoryEntries, ...hPrev]);
      return updated;
    });

    playUiSoundEffect('SUCCESS');
    pushRealtimeNotification(
      '[Cộng +20đ Định kỳ Tháng] Đã cập nhật Điểm Tín nhiệm',
      'Hệ thống đã cộng +20 điểm tín nhiệm định kỳ hằng tháng cho toàn bộ nhân sự và lưu lên MongoDB.',
      'TRUST_SCORE_ALERT'
    );
  }, [playUiSoundEffect, pushRealtimeNotification]);

  const handleUpdateEquipmentStatus = (
    equipmentId: string,
    nextStatus: EquipmentStatusType
  ) => {
    setEquipmentsList((prev) =>
      prev.map((eq) =>
        eq.equipmentId === equipmentId ? { ...eq, status: nextStatus } : eq
      )
    );
    playUiSoundEffect('CLICK');

    fetch(
      `/api/v1/datamanager/equipments/${encodeURIComponent(
        equipmentId
      )}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      }
    ).catch(() => {});
  };

  // Nhân viên / Quản lý gửi Báo lỗi Thiết bị từ trang Tổ chức & Phòng ban lên Admin
  const handleSubmitEquipmentFaultReport = useCallback(
    (equipmentId: string, roomCode: string, faultReason: string) => {
      const targetEq = equipmentsList.find(
        (e) => e.equipmentId === equipmentId
      );
      const reporterEmail =
        userSession?.userProfile.userEmail || 'employee.dev@spotmatrix.vn';
      const reporterName =
        userSession?.userProfile.fullName || 'Nhân sự Nội bộ';
      const reporterRole = userSession?.userProfile.role || 'EMPLOYEE';
      const nowStr = `${new Date().toLocaleTimeString('vi-VN')} • Hôm nay`;

      const newReport: EquipmentFaultReportItem = {
        reportId: `FLT-${Date.now().toString().slice(-4)}`,
        equipmentId,
        equipmentCode: targetEq?.equipmentCode || equipmentId,
        equipmentName: targetEq?.equipmentName || `Thiết bị phòng ${roomCode}`,
        roomCode,
        reporterEmail,
        reporterName,
        reporterRole,
        faultReason,
        reportStatus: 'PENDING_ADMIN',
        aiDiagnosisNote:
          'AURA-X đề xuất kiểm tra nguồn tín hiệu và chuyển sang trạng thái Đang bảo trì.',
        createdAtIso: nowStr,
        updatedAtIso: new Date().toISOString(),
      };

      setEquipmentFaultReports((prev) => [newReport, ...prev]);
      setEquipmentsList((prev) =>
        prev.map((eq) =>
          eq.equipmentId === equipmentId
            ? {
                ...eq,
                lastReportedReason: faultReason,
                lastReportedBy: reporterEmail,
              }
            : eq
        )
      );

      fetch('/api/v1/datamanager/fault-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      }).catch(() => {});

      playUiSoundEffect('NOTIFICATION');

      pushRealtimeNotification(
        `[Báo lỗi Thiết bị Phòng ${roomCode}] Chờ Admin xác nhận`,
        `${reporterName} đã báo lỗi thiết bị "${
          targetEq?.equipmentName || equipmentId
        }" tại phòng ${roomCode}. Lý do: "${faultReason}". Hệ thống đã lưu lên MongoDB và chuyển phiếu đến SYS_ADMIN.`,
        'EQUIPMENT_FAULT_ALERT',
        roomCode,
        undefined,
        'all'
      );

      recordRealtimeAuditLog(
        'POLICY_CONFIG_UPDATED',
        reporterEmail,
        roomCode,
        `[Báo lỗi Thiết bị] ${reporterName} (${reporterEmail}) báo lỗi ${
          targetEq?.equipmentCode || equipmentId
        } tại ${roomCode}: "${faultReason}".`
      );
    },
    [
      equipmentsList,
      userSession,
      playUiSoundEffect,
      pushRealtimeNotification,
      recordRealtimeAuditLog,
    ]
  );

  // Admin duyệt Báo lỗi Thiết bị -> Chuyển sang REPORTED_BROKEN -> MAINTENANCE -> AVAILABLE hoặc REJECT
  const handleEquipmentFaultDecision = useCallback(
    (
      reportId: string,
      decision: 'CONFIRM_BROKEN' | 'START_MAINTENANCE' | 'MARK_FIXED' | 'REJECT'
    ) => {
      const targetReport = equipmentFaultReports.find(
        (r) => r.reportId === reportId
      );
      if (!targetReport) return;

      const adminName = userSession?.userProfile.username || 'Systemadmin123';
      const handledAtStr = new Date().toISOString();

      const nextReportStatus: EquipmentFaultReportItem['reportStatus'] =
        decision === 'CONFIRM_BROKEN'
          ? 'CONFIRMED_BROKEN'
          : decision === 'START_MAINTENANCE'
          ? 'IN_MAINTENANCE'
          : decision === 'MARK_FIXED'
          ? 'RESOLVED_READY'
          : 'REJECTED';

      const nextEqStatus: EquipmentStatusType =
        decision === 'CONFIRM_BROKEN'
          ? 'REPORTED_BROKEN'
          : decision === 'START_MAINTENANCE'
          ? 'MAINTENANCE'
          : 'AVAILABLE';

      setEquipmentFaultReports((prev) =>
        prev.map((r) =>
          r.reportId === reportId
            ? {
                ...r,
                reportStatus: nextReportStatus,
                handledByEmail: adminName,
                updatedAtIso: handledAtStr,
              }
            : r
        )
      );

      setEquipmentsList((prev) =>
        prev.map((eq) =>
          eq.equipmentId === targetReport.equipmentId
            ? { ...eq, status: nextEqStatus }
            : eq
        )
      );

      fetch(
        `/api/v1/datamanager/fault-reports/${encodeURIComponent(reportId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportStatus: nextReportStatus,
            equipmentStatus: nextEqStatus,
            handledByEmail: adminName,
          }),
        }
      ).catch(() => {});

      playUiSoundEffect(decision === 'REJECT' ? 'CLICK' : 'SUCCESS');

      const statusLabelMap = {
        CONFIRM_BROKEN: 'Đã xác nhận Báo hỏng (Chờ kỹ thuật bảo trì)',
        START_MAINTENANCE: 'Đang bảo trì / sửa chữa tại phòng',
        MARK_FIXED: 'Đã sửa xong — Chuyển về Sử dụng được',
        REJECT: 'Từ chối báo lỗi — Thiết bị hoạt động bình thường',
      };

      pushRealtimeNotification(
        `[Cập nhật Thiết bị ${targetReport.roomCode}] ${statusLabelMap[decision]}`,
        `Quản trị viên @${adminName} đã xử lý phiếu ${reportId} (${targetReport.equipmentName}): ${statusLabelMap[decision]}.`,
        'EQUIPMENT_FAULT_ALERT',
        targetReport.roomCode,
        undefined,
        targetReport.reporterEmail
      );
    },
    [
      equipmentFaultReports,
      userSession,
      playUiSoundEffect,
      pushRealtimeNotification,
    ]
  );

  // AI Tự động Xử lý & Điều phối Bảo trì Thiết bị cho Admin
  const handleTriggerAiAutoProcessFaults = useCallback(() => {
    const nowStr = new Date().toISOString();

    setEquipmentFaultReports((prev) =>
      prev.map((r) => {
        if (
          r.reportStatus === 'PENDING_ADMIN' ||
          r.reportStatus === 'CONFIRMED_BROKEN'
        ) {
          return {
            ...r,
            reportStatus: 'IN_MAINTENANCE',
            handledByEmail: 'AURA-X AI Auto-Triage',
            updatedAtIso: nowStr,
          };
        }
        if (r.reportStatus === 'IN_MAINTENANCE') {
          return {
            ...r,
            reportStatus: 'RESOLVED_READY',
            handledByEmail: 'AURA-X AI Auto-Triage',
            updatedAtIso: nowStr,
          };
        }
        return r;
      })
    );

    setEquipmentsList((prev) =>
      prev.map((eq) => {
        if (eq.status === 'REPORTED_BROKEN' || eq.status === 'BROKEN') {
          return { ...eq, status: 'MAINTENANCE' };
        }
        if (eq.status === 'MAINTENANCE') {
          return { ...eq, status: 'AVAILABLE' };
        }
        return eq;
      })
    );

    playUiSoundEffect('SUCCESS');
    pushRealtimeNotification(
      '[AURA-X AI Tự động Điều phối Thiết bị]',
      'AI đã tự động duyệt các phiếu báo hỏng sang trạng thái Đang bảo trì và nghiệm thu các thiết bị hoàn tất bảo trì sang Sử dụng được.',
      'EQUIPMENT_FAULT_ALERT'
    );
  }, [playUiSoundEffect, pushRealtimeNotification]);

  const handleCancelBooking = useCallback(
    (bookingId: string, viaQrScan = false, customCancelTimeText?: string) => {
      const now = new Date();
      const cancelTimeStr =
        customCancelTimeText ||
        `${now.toLocaleTimeString('vi-VN')} • Ngày ${now.toLocaleDateString(
          'vi-VN'
        )}`;

      const targetBk = bookingsList.find((b) => b.bookingId === bookingId);

      setBookingsList((prev) =>
        prev.map((b) =>
          b.bookingId === bookingId
            ? {
                ...b,
                bookingStatus: 'CANCELLED',
                cancelledViaQr: Boolean(viaQrScan),
                cancelledAtIso: cancelTimeStr,
                cancelledAtTimestampMs: Date.now(),
              }
            : b
        )
      );

      if (targetBk) {
        const matchedNode = workspaceNodes.find(
          (n) => n.nodeCode === targetBk.nodeId
        );
        if (matchedNode) {
          setWorkspaceNodes((prev) =>
            prev.map((n) =>
              n.nodeId === matchedNode.nodeId
                ? { ...n, status: 'AVAILABLE' }
                : n
            )
          );
        }

        pushRealtimeNotification(
          viaQrScan
            ? `[Đã Hủy Đặt Phòng Bằng QR] ${targetBk.nodeId}`
            : `[Đã Hủy Đặt Phòng] ${targetBk.nodeId}`,
          `Đã giải phóng phòng ${targetBk.nodeId} (Mã vé: ${bookingId}) lúc ${cancelTimeStr} và lưu vào Trang Lịch sử Đặt phòng.`,
          'BOOKING_EVENT',
          targetBk.nodeId
        );
      }

      playUiSoundEffect('CLICK');

      fetch(`/api/v1/bookings/${encodeURIComponent(bookingId)}`, {
        method: 'DELETE',
      }).catch(() => {});
    },
    [bookingsList, workspaceNodes, playUiSoundEffect, pushRealtimeNotification]
  );

  // Lắng nghe sự kiện Quét QR Nhận Phòng & Quét QR Hủy Phòng từ Tab Kiosk riêng (/qr-checkin)
  useEffect(() => {
    const handleIncomingQrSync = (payload: QrRealtimeSyncPayload) => {
      if (!payload || !payload.bookingId) return;
      if (payload.actionType === 'CHECKIN') {
        handleCheckInBooking(payload.bookingId, payload.scannedAtText);
      } else if (payload.actionType === 'CANCEL') {
        handleCancelBooking(payload.bookingId, true, payload.scannedAtText);
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(QR_BROADCAST_CHANNEL_NAME);
        channel.onmessage = (ev) => {
          handleIncomingQrSync(ev.data as QrRealtimeSyncPayload);
        };
      }
    } catch {
      // ignore
    }

    const onStorageEvent = (ev: StorageEvent) => {
      if (ev.key === QR_STORAGE_EVENT_KEY && ev.newValue) {
        try {
          const parsed = JSON.parse(ev.newValue) as QrRealtimeSyncPayload;
          handleIncomingQrSync(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorageEvent);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', onStorageEvent);
    };
  }, [handleCheckInBooking, handleCancelBooking]);

  // Bộ quét tự động thu hồi phòng khi quá thời gian cho phép quét QR (mỗi 30 giây, nhẹ nhàng không tốn dữ liệu mạng)
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      bookingsList.forEach((bk) => {
        if (
          bk.bookingStatus === 'CONFIRMED' &&
          bk.approvalStatus === 'APPROVED'
        ) {
          const dateStr = bk.bookingDateIso || now.toISOString().slice(0, 10);
          const { latestCheckinTime } = buildNormalizedMeetingDateRange(
            dateStr,
            bk.startTimeIso,
            bk.endTimeIso
          );
          if (now.getTime() > latestCheckinTime.getTime()) {
            handlePenalizeNoShowBooking(bk.bookingId, bk.userEmail, bk.nodeId);
          }
        }
      });
    }, 30000);
    return () => window.clearInterval(timer);
  }, [bookingsList, handlePenalizeNoShowBooking]);

  const handleChangeUserRole = (
    username: string,
    targetUserEmail: string,
    nextRole: 'EMPLOYEE' | 'MANAGER'
  ) => {
    if (userSession?.userProfile.role !== 'SYS_ADMIN') return;
    if (nextRole !== 'EMPLOYEE' && nextRole !== 'MANAGER') return;

    setManagedUsers((prev) =>
      prev.map((u) => {
        if (u.role === 'SYS_ADMIN') return u;
        if (
          u.username.toLowerCase() === username.toLowerCase() ||
          u.userEmail.toLowerCase() === targetUserEmail.toLowerCase()
        ) {
          return { ...u, role: nextRole };
        }
        return u;
      })
    );

    setTrustProfiles((prev) =>
      prev.map((tp) => {
        if (tp.role === 'SYS_ADMIN') return tp;
        if (tp.userEmail.toLowerCase() === targetUserEmail.toLowerCase()) {
          return { ...tp, role: nextRole };
        }
        return tp;
      })
    );

    playUiSoundEffect('SUCCESS');

    recordRealtimeAuditLog(
      'POLICY_CONFIG_UPDATED',
      userSession.userProfile.userEmail,
      targetUserEmail,
      `[Admin Phân quyền Role] @${userSession.userProfile.username} đã chuyển đổi vai trò của @${username} (${targetUserEmail}) sang [${nextRole}].`
    );
  };

  const handleToggleBlockUser = (username: string) => {
    setManagedUsers((prev) =>
      prev.map((u) =>
        u.username === username
          ? {
              ...u,
              accountStatus:
                u.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED',
            }
          : u
      )
    );
    playUiSoundEffect('CLICK');
  };

  const handleDeleteUserAccount = (username: string) => {
    setManagedUsers((prev) => prev.filter((u) => u.username !== username));
    playUiSoundEffect('ERROR');
  };

  const currentUsernameKey = userSession?.userProfile.username || 'default';
  const currentCustomProfile = profileCustomMap[currentUsernameKey] || {
    avatarUrl: null,
    backgroundUrl: null,
    phoneNumber: '0908 123 456',
    jobTitle: 'Senior System Member',
    bioText:
      'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
  };

  const handleSaveProfileCustomization = async (
    updated: UserProfileCustomization
  ) => {
    const nextMap = {
      ...profileCustomMap,
      [currentUsernameKey]: {
        avatarUrl: updated.avatarUrl,
        backgroundUrl: updated.backgroundUrl,
        phoneNumber: updated.phoneNumber,
        jobTitle: updated.jobTitle,
        bioText: updated.bioText,
      },
    };
    setProfileCustomMap(nextMap);
    playUiSoundEffect('SUCCESS');
    try {
      localStorage.setItem(
        PROFILE_CUSTOM_STORAGE_KEY,
        JSON.stringify(nextMap)
      );
    } catch {
      // Bỏ qua
    }

    if (updated.departmentName && updated.userEmail) {
      handleAssignUserSingleDepartment(
        updated.userEmail,
        updated.departmentName
      );
    }

    if (userSession) {
      const nextSession: AuthenticatedUserSession = {
        ...userSession,
        userProfile: {
          ...userSession.userProfile,
          fullName: updated.fullName,
          userEmail: updated.userEmail,
          departmentName: updated.departmentName,
        },
      };
      setUserSession(nextSession);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    }

    setIsSyncingMongo(true);
    try {
      await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: updated.username,
          fullName: updated.fullName,
          userEmail: updated.userEmail,
          departmentName: updated.departmentName,
          phoneNumber: updated.phoneNumber,
          jobTitle: updated.jobTitle,
          bioText: updated.bioText,
          avatarUrl: updated.avatarUrl,
          backgroundUrl: updated.backgroundUrl,
        }),
      });
    } catch {
      // Giữ bản lưu cục bộ
    } finally {
      setIsSyncingMongo(false);
    }
  };

  // Chỉ SYS_ADMIN mới được phép Tạo / Sửa / Xóa Phòng ban
  const handleUpsertDepartment = (dept: OrganizationDepartmentItem) => {
    if (userSession?.userProfile.role !== 'SYS_ADMIN') return;
    setDepartmentsList((prev) => {
      const idx = prev.findIndex((d) => d.departmentId === dept.departmentId);
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = dept;
        return clone;
      }
      return [...prev, dept];
    });
    playUiSoundEffect('SUCCESS');
    fetch('/api/v1/organization/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dept),
    }).catch(() => {});
  };

  const handleDeleteDepartment = (departmentId: string) => {
    if (userSession?.userProfile.role !== 'SYS_ADMIN') return;
    setDepartmentsList((prev) =>
      prev.filter((d) => d.departmentId !== departmentId)
    );
    playUiSoundEffect('CLICK');
    fetch(
      `/api/v1/organization/departments/${encodeURIComponent(departmentId)}`,
      {
        method: 'DELETE',
      }
    ).catch(() => {});
  };

  const handleAssignUserSingleDepartment = (
    targetUserEmail: string,
    nextDepartmentName: string
  ) => {
    const cleanEmail = targetUserEmail.trim().toLowerCase();

    setDepartmentsList((prev) =>
      prev.map((dept) => {
        const filtered = dept.memberEmails.filter(
          (em) => em.trim().toLowerCase() !== cleanEmail
        );
        const isTarget =
          dept.departmentName.trim().toLowerCase() ===
          nextDepartmentName.trim().toLowerCase();
        return {
          ...dept,
          memberEmails: isTarget ? [...filtered, targetUserEmail] : filtered,
          updatedAtIso: new Date().toISOString(),
        };
      })
    );

    setTrustProfiles((prev) =>
      prev.map((tp) =>
        tp.userEmail.trim().toLowerCase() === cleanEmail
          ? { ...tp, departmentName: nextDepartmentName }
          : tp
      )
    );

    setManagedUsers((prev) =>
      prev.map((u) =>
        u.userEmail.trim().toLowerCase() === cleanEmail
          ? { ...u, departmentName: nextDepartmentName }
          : u
      )
    );

    if (
      userSession &&
      userSession.userProfile.userEmail.trim().toLowerCase() === cleanEmail
    ) {
      const updatedSession: AuthenticatedUserSession = {
        ...userSession,
        userProfile: {
          ...userSession.userProfile,
          departmentName: nextDepartmentName,
        },
      };
      setUserSession(updatedSession);
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(updatedSession)
      );
    }

    playUiSoundEffect('SUCCESS');

    fetch('/api/v1/organization/departments/assign-user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: targetUserEmail,
        departmentName: nextDepartmentName,
      }),
    }).catch(() => {});
  };

  // MANAGER và SYS_ADMIN được phép Tạo / Đổi tên / Quản lý thành viên Nhóm (Squad)
  const handleUpsertGroup = (group: OrganizationGroupItem) => {
    if (userSession?.userProfile.role === 'EMPLOYEE') return;
    setGroupsList((prev) => {
      const idx = prev.findIndex((g) => g.groupId === group.groupId);
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = group;
        return clone;
      }
      return [...prev, group];
    });
    playUiSoundEffect('SUCCESS');
    fetch('/api/v1/organization/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group),
    }).catch(() => {});
  };

  const handleDeleteGroup = (groupId: string) => {
    if (userSession?.userProfile.role === 'EMPLOYEE') return;
    setGroupsList((prev) => prev.filter((g) => g.groupId !== groupId));
    playUiSoundEffect('CLICK');
    fetch(`/api/v1/organization/groups/${encodeURIComponent(groupId)}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  const handleToggleGroupMember = (
    groupId: string,
    targetUserEmail: string
  ) => {
    if (userSession?.userProfile.role === 'EMPLOYEE') return;
    const cleanEmail = targetUserEmail.trim().toLowerCase();
    setGroupsList((prev) =>
      prev.map((g) => {
        if (g.groupId !== groupId) return g;
        const exists = g.memberEmails.some(
          (em) => em.trim().toLowerCase() === cleanEmail
        );
        return {
          ...g,
          memberEmails: exists
            ? g.memberEmails.filter(
                (em) => em.trim().toLowerCase() !== cleanEmail
              )
            : [...g.memberEmails, targetUserEmail],
        };
      })
    );
    playUiSoundEffect('CLICK');
    fetch(
      `/api/v1/organization/groups/${encodeURIComponent(
        groupId
      )}/toggle-member`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: targetUserEmail }),
      }
    ).catch(() => {});
  };

  // Hành động AI dành riêng cho SYS_ADMIN: Đổi tên Phòng ban đồng bộ toàn hệ thống & MongoDB
  const handleAiRenameDepartment = useCallback(
    (departmentId: string, newDepartmentName: string) => {
      if (userSession?.userProfile.role !== 'SYS_ADMIN') return;
      const targetDept = departmentsList.find(
        (d) => d.departmentId === departmentId
      );
      if (!targetDept) return;
      const oldName = targetDept.departmentName;
      const updatedDept: OrganizationDepartmentItem = {
        ...targetDept,
        departmentName: newDepartmentName,
        updatedAtIso: new Date().toISOString(),
      };

      setDepartmentsList((prev) =>
        prev.map((d) => (d.departmentId === departmentId ? updatedDept : d))
      );

      setGroupsList((prev) =>
        prev.map((g) =>
          g.departmentName.toLowerCase() === oldName.toLowerCase()
            ? { ...g, departmentName: newDepartmentName }
            : g
        )
      );

      setTrustProfiles((prev) =>
        prev.map((tp) =>
          tp.departmentName.toLowerCase() === oldName.toLowerCase()
            ? { ...tp, departmentName: newDepartmentName }
            : tp
        )
      );

      setManagedUsers((prev) =>
        prev.map((u) =>
          u.departmentName.toLowerCase() === oldName.toLowerCase()
            ? { ...u, departmentName: newDepartmentName }
            : u
        )
      );

      fetch('/api/v1/organization/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDept),
      }).catch(() => {});

      playUiSoundEffect('SUCCESS');
      pushRealtimeNotification(
        '[AURA-X AI] Đã đổi tên Phòng ban',
        `Đã đổi tên phòng ban "${oldName}" thành "${newDepartmentName}" và đồng bộ lên MongoDB.`,
        'SYSTEM_POLICY'
      );
    },
    [userSession, departmentsList, playUiSoundEffect, pushRealtimeNotification]
  );

  // Hành động AI dành riêng cho SYS_ADMIN: Đổi trạng thái thiết bị hàng loạt theo Tầng hoặc Phòng
  const handleAiBatchUpdateEquipmentStatus = useCallback(
    (targetRoomCodes: string[], nextStatus: EquipmentStatusType) => {
      if (userSession?.userProfile.role !== 'SYS_ADMIN') return;
      const codeSet = new Set(targetRoomCodes.map((c) => c.toUpperCase()));

      setEquipmentsList((prev) =>
        prev.map((eq) => {
          if (codeSet.has((eq.assignedNodeId || '').toUpperCase())) {
            fetch(
              `/api/v1/datamanager/equipments/${encodeURIComponent(
                eq.equipmentId
              )}/status`,
              {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus }),
              }
            ).catch(() => {});
            return { ...eq, status: nextStatus };
          }
          return eq;
        })
      );

      playUiSoundEffect('SUCCESS');
      pushRealtimeNotification(
        `[AURA-X AI] Đã cập nhật Thiết bị (${targetRoomCodes.length} phòng)`,
        `Đã chuyển trạng thái thiết bị thuộc [${targetRoomCodes.join(
          ', '
        )}] sang [${nextStatus}].`,
        'EQUIPMENT_FAULT_ALERT'
      );
    },
    [userSession, playUiSoundEffect, pushRealtimeNotification]
  );

  // Đa ngôn ngữ cho cả Sidebar, Header và Menu Avatar
  const sidebarItems = [
    {
      id: 'OVERVIEW' as ActiveSidebarPage,
      label:
        webLanguage === 'en'
          ? 'Overview (Dashboard)'
          : webLanguage === 'ja'
          ? 'ダッシュボード概要'
          : 'Tổng quan (Dashboard)',
      shortLabel:
        webLanguage === 'en'
          ? 'Overview'
          : webLanguage === 'ja'
          ? '概要'
          : 'Tổng quan',
      sub:
        webLanguage === 'en'
          ? 'Live Telemetry & AI Voice'
          : webLanguage === 'ja'
          ? 'リアルタイム統計・AI音声'
          : 'Số liệu thật & Trợ lý Chat',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      id: 'FLOORPLAN' as ActiveSidebarPage,
      label:
        webLanguage === 'en'
          ? '3D/2D Floorplan'
          : webLanguage === 'ja'
          ? '3D/2D フロアマップ'
          : 'Sơ đồ Phòng họp',
      shortLabel:
        webLanguage === 'en'
          ? '3D/2D Map'
          : webLanguage === 'ja'
          ? '3D/2D図'
          : 'Sơ đồ 3D/2D',
      sub:
        webLanguage === 'en'
          ? '5 Floors 3D/2D & Hall'
          : webLanguage === 'ja'
          ? '5階3Dモデル・大ホール'
          : '5 Tầng 3D/2D & Hội trường',
      icon: Map,
      adminOnly: false,
    },
    {
      id: 'BOOKING' as ActiveSidebarPage,
      label:
        webLanguage === 'en'
          ? 'Room & Hall Booking'
          : webLanguage === 'ja'
          ? '会議室・ホール予約'
          : 'Đặt lịch Phòng họp',
      shortLabel:
        webLanguage === 'en'
          ? 'Booking'
          : webLanguage === 'ja'
          ? '会議室予約'
          : 'Đặt phòng',
      sub:
        webLanguage === 'en'
          ? '2-Mode Hall & QR ±30m'
          : webLanguage === 'ja'
          ? '2モード大ホール・QR ±30分'
          : 'Hội trường 2 chế độ & QR ±30p',
      icon: CalendarCheck,
      adminOnly: false,
    },
    {
      id: 'ORGANIZATION' as ActiveSidebarPage,
      label:
        webLanguage === 'en'
          ? 'Organization & Teams'
          : webLanguage === 'ja'
          ? '組織・部署・グループ'
          : 'Tổ chức & Phòng ban',
      shortLabel:
        webLanguage === 'en'
          ? 'Organization'
          : webLanguage === 'ja'
          ? '組織・部署'
          : 'Phòng ban',
      sub:
        webLanguage === 'en'
          ? '1 Dept & Fault Report'
          : webLanguage === 'ja'
          ? '部署・設備故障報告'
          : 'Phòng ban & Báo lỗi Thiết bị',
      icon: Building2,
      adminOnly: false,
    },
    {
      id: 'DATAMANAGER' as ActiveSidebarPage,
      label:
        userSession?.userProfile.role === 'SYS_ADMIN'
          ? webLanguage === 'en'
            ? 'Equipment & Trust'
            : webLanguage === 'ja'
            ? '設備・信頼スコア'
            : 'Thiết bị & Tín nhiệm'
          : webLanguage === 'en'
          ? 'Personal Trust Score'
          : webLanguage === 'ja'
          ? '個人信頼スコア履歴'
          : 'Điểm & Lịch sử Tín nhiệm',
      shortLabel:
        userSession?.userProfile.role === 'SYS_ADMIN'
          ? webLanguage === 'en'
            ? 'Equipment'
            : webLanguage === 'ja'
            ? '設備・信頼'
            : 'Thiết bị & Điểm'
          : webLanguage === 'en'
          ? 'Trust Score'
          : webLanguage === 'ja'
          ? '信頼スコア'
          : 'Điểm tín nhiệm',
      sub:
        userSession?.userProfile.role === 'SYS_ADMIN'
          ? webLanguage === 'en'
            ? '25 Rooms Devices & Score'
            : webLanguage === 'ja'
            ? '全25室設備・信頼スコア'
            : 'Thiết bị 25 phòng & Điểm số'
          : webLanguage === 'en'
          ? '+20 Monthly & QR Ledger'
          : webLanguage === 'ja'
          ? '毎月+20・QR加減点履歴'
          : 'Cộng +20đ/tháng & Sổ cái QR',
      icon: Database,
      adminOnly: false,
    },
    {
      id: 'AUDIT' as ActiveSidebarPage,
      label:
        webLanguage === 'en'
          ? 'Audit & IP Security'
          : webLanguage === 'ja'
          ? '監査ログ・IPセキュリティ'
          : 'Nhật ký & Quản trị User',
      shortLabel:
        webLanguage === 'en'
          ? 'Audit & IP'
          : webLanguage === 'ja'
          ? '監査・IP'
          : 'Quản trị User',
      sub:
        webLanguage === 'en'
          ? 'SYS_ADMIN Exclusive'
          : webLanguage === 'ja'
          ? 'SYS_ADMIN 専用管理'
          : 'Chỉ dành cho SYS_ADMIN',
      icon: ShieldAlert,
      adminOnly: true,
    },
  ].filter((item) => !item.adminOnly || isSysAdmin);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={userSession ? '/dashboard' : '/welcome'} replace />
        }
      />

      <Route
        path="/welcome"
        element={
          <LandingShowcasePages
            isDark={isDark}
            webLanguage={webLanguage}
            isAuthenticated={Boolean(userSession)}
            onToggleTheme={toggleThemeMode}
            onChangeWebLanguage={(lang) => {
              setWebLanguage(lang);
              playUiSoundEffect('CLICK');
            }}
            onNavigateToLogin={() => navigate('/login')}
            onNavigateToDashboard={() => navigate('/dashboard')}
          />
        }
      />

      <Route
        path="/qr-checkin"
        element={
          <QrCheckinConfirmPages
            isDark={isDark}
            webLanguage={webLanguage}
            onConfirmCheckinFromUrl={handleCheckInBooking}
            onConfirmCancelFromUrl={(bkId, cancelTime) =>
              handleCancelBooking(bkId, true, cancelTime)
            }
          />
        }
      />

      <Route
        path="/login"
        element={
          userSession ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPages
              onLoginSuccess={handleLoginSuccess}
              onOpenLandingShowcase={() => navigate('/welcome')}
            />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          !userSession ? (
            <Navigate to="/login" replace />
          ) : (
            <div
              className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-200 ${
                isDark
                  ? 'bg-[#0B1120] text-slate-100'
                  : 'bg-[#F4F7FB] text-slate-800'
              }`}
            >
              {/* ===================================================================
                  1. SIDEBAR CỐ ĐỊNH TRÊN MÁY TÍNH (DESKTOP >= 1024px) & DRAWER TRÊN ĐIỆN THOẠI / IPAD
                 =================================================================== */}
              {isMobileSidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
                  onClick={() => setIsMobileSidebarOpen(false)}
                />
              )}

              <aside
                className={`w-72 lg:w-64 shrink-0 fixed inset-y-0 left-0 h-screen overflow-y-auto z-50 lg:z-40 border-r flex flex-col justify-between p-4 sm:p-5 transition-transform duration-200 ${
                  isMobileSidebarOpen
                    ? 'translate-x-0'
                    : '-translate-x-full lg:translate-x-0'
                } ${
                  isDark
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-slate-200/90'
                }`}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-2">
                    <SpotMatrixLogo
                      theme={isDark ? 'dark' : 'light'}
                      variant="full"
                    />
                    <button
                      type="button"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:bg-slate-800/40"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <nav className="space-y-1.5">
                    <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                      {webLanguage === 'en'
                        ? 'Navigation Menu'
                        : webLanguage === 'ja'
                        ? 'ナビゲーションメニュー'
                        : 'Danh mục Chức năng'}
                    </p>
                    {sidebarItems.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = activePage === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActivePage(item.id);
                            setIsMobileSidebarOpen(false);
                            playUiSoundEffect('CLICK');
                          }}
                          className={`relative w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-colors ${
                            isActive
                              ? 'text-white font-bold'
                              : isDark
                              ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="smxSidebarActivePill"
                              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                              className="absolute inset-0 rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/25"
                            />
                          )}
                          <div className="relative z-10 flex items-center gap-3 min-w-0">
                            <IconComponent
                              className={`w-4 h-4 shrink-0 ${
                                isActive
                                  ? 'text-white'
                                  : 'text-indigo-600 dark:text-indigo-400'
                              }`}
                            />
                            <div className="truncate">
                              <p className="text-xs font-bold leading-tight">
                                {item.label}
                              </p>
                              <p
                                className={`text-[10px] truncate mt-0.5 ${
                                  isActive
                                    ? 'text-indigo-100'
                                    : 'text-slate-400'
                                }`}
                              >
                                {item.sub}
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            className={`relative z-10 w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'opacity-100' : 'opacity-25'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      playUiSoundEffect('CLICK');
                      setIsMobileSidebarOpen(false);
                      navigate('/welcome');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-extrabold flex items-center justify-between transition"
                  >
                    <span>
                      {webLanguage === 'en'
                        ? '3D WebGL Showcase'
                        : webLanguage === 'ja'
                        ? '3D WebGL 紹介ページ'
                        : 'Trang Giới Thiệu 3D WebGL'}
                    </span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <div className="text-[11px] text-slate-400">
                    SpotMatrix 5-Floor 3D v5.0 (MongoDB & AI Agent)
                  </div>
                </div>
              </aside>

              {/* ===================================================================
                  2. KHUNG NỘI DUNG CHÍNH (RESPONSIVE CHO ĐIỆN THOẠI, IPAD & MÁY TÍNH)
                 =================================================================== */}
              <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
                <header
                  className={`sticky top-0 z-30 backdrop-blur-md border-b px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col gap-2 ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800'
                      : 'bg-white/95 border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Nút mở Menu Drawer trên Điện thoại & iPad (< lg) */}
                      <button
                        type="button"
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className={`lg:hidden p-2 rounded-xl border transition ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-200'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                        aria-label="Open Navigation Menu"
                      >
                        <Menu className="w-4 h-4" />
                      </button>

                      <NotificationHeaderBell
                        notifications={notificationsList}
                        userRole={userSession.userProfile.role}
                        webLanguage={webLanguage}
                        isDark={isDark}
                        onSelectAndNavigateNotification={
                          handleSelectAndNavigateNotification
                        }
                        onHandleApprovalDecision={handleApprovalDecision}
                        onMarkAllRead={() =>
                          setNotificationsList((prev) =>
                            prev.map((item) => ({ ...item, isRead: true }))
                          )
                        }
                        onNavigateNotificationPage={() =>
                          setActivePage('NOTIFICATION')
                        }
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setIsCommandPaletteOpen(true);
                          playUiSoundEffect('CLICK');
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:border-indigo-500/60'
                            : 'bg-slate-100/90 border-slate-200 text-slate-600 hover:border-indigo-300'
                        }`}
                        title="Ctrl + K"
                      >
                        <Search className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="hidden md:inline">
                          {webLanguage === 'en'
                            ? 'Quick Search'
                            : webLanguage === 'ja'
                            ? 'クイック検索'
                            : 'Tìm nhanh'}
                        </span>
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-900 text-[10px] font-mono text-slate-500">
                          ⌘K
                        </kbd>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const bestNode = workspaceNodes.find(
                            (n) => n.status === 'AVAILABLE'
                          );
                          if (bestNode) {
                            setSelectedNode(bestNode);
                            setActivePage('FLOORPLAN');
                            pushRealtimeNotification(
                              `Gợi ý Phòng họp Tối ưu: ${bestNode.nodeCode}`,
                              `"${bestNode.nodeLabel}" đang trống và phù hợp nhất.`,
                              'BOOKING_EVENT',
                              bestNode.nodeId
                            );
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {webLanguage === 'en'
                            ? 'Smart Room Suggest'
                            : webLanguage === 'ja'
                            ? '最適な会議室を提案'
                            : 'Gợi ý Phòng họp'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nextLofi = !audioSettings.lofiEnabled;
                          persistAudioSettings({
                            ...audioSettings,
                            lofiEnabled: nextLofi,
                          });
                          playUiSoundEffect('CLICK');
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold border transition ${
                          audioSettings.lofiEnabled
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {audioSettings.lofiEnabled ? (
                          <>
                            <Music className="w-3.5 h-3.5 animate-bounce" />
                            <span className="hidden md:inline">
                              {webLanguage === 'en'
                                ? 'Lofi Music: ON'
                                : webLanguage === 'ja'
                                ? 'Lofi BGM: オン'
                                : 'Nhạc Lofi: Đang bật'}
                            </span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">
                              {webLanguage === 'en'
                                ? 'Enable Lofi Music'
                                : webLanguage === 'ja'
                                ? 'Lofi BGM を再生'
                                : 'Bật Nhạc Lofi'}
                            </span>
                          </>
                        )}
                      </button>

                      <div
                        className={`inline-flex items-center rounded-xl p-1 border ${
                          isDark
                            ? 'bg-slate-800 border-slate-700'
                            : 'bg-slate-100 border-slate-200'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 ml-1 mr-1 text-indigo-500 hidden sm:inline" />
                        {(['vi', 'en', 'ja'] as WebLanguageCodeType[]).map(
                          (langCode) => (
                            <button
                              key={langCode}
                              type="button"
                              onClick={() => {
                                setWebLanguage(langCode);
                                try {
                                  localStorage.setItem(
                                    WEB_LANGUAGE_STORAGE_KEY,
                                    langCode
                                  );
                                } catch {
                                  // ignore
                                }
                                playUiSoundEffect('CLICK');
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase transition ${
                                webLanguage === langCode
                                  ? 'bg-indigo-600 text-white'
                                  : isDark
                                  ? 'text-slate-400 hover:text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {langCode}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="relative ml-auto" ref={avatarDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAvatarMenuOpen(!isAvatarMenuOpen);
                          playUiSoundEffect('CLICK');
                        }}
                        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center font-extrabold text-sm transition shadow-sm ${
                          isDark
                            ? 'bg-indigo-950 border-indigo-500/70 text-indigo-200'
                            : 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        }`}
                        title={`Đang trực tuyến: ${userSession.userProfile.fullName} (${userSession.userProfile.departmentName})`}
                      >
                        <span className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                          {currentCustomProfile.avatarUrl ? (
                            <img
                              src={currentCustomProfile.avatarUrl}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (userSession.userProfile.fullName || 'U')
                              .charAt(0)
                              .toUpperCase()
                          )}
                        </span>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 z-20 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-md"
                          title="Trạng thái: Đang Online"
                        />
                      </button>

                      {isAvatarMenuOpen && (
                        <div
                          className={`absolute right-0 mt-2.5 w-72 rounded-2xl border shadow-2xl z-50 overflow-hidden transition-all ${
                            isDark
                              ? 'bg-slate-900 border-slate-800 text-slate-100'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <div
                            className={`p-4 border-b ${
                              isDark
                                ? 'bg-slate-950/70 border-slate-800'
                                : 'bg-slate-50/80 border-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {currentCustomProfile.avatarUrl ? (
                                <img
                                  src={currentCustomProfile.avatarUrl}
                                  alt="Avatar"
                                  className="w-11 h-11 rounded-full object-cover shrink-0 border border-indigo-500/30"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-base shrink-0">
                                  {(userSession.userProfile.fullName || 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-extrabold truncate">
                                  {userSession.userProfile.fullName}
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                  @{userSession.userProfile.username}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
                              <p className="flex items-center justify-between">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5" /> Email:
                                </span>
                                <strong className="font-semibold truncate max-w-[155px]">
                                  {userSession.userProfile.userEmail}
                                </strong>
                              </p>
                              <p className="flex items-center justify-between">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5" /> Role:
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                                  {userSession.userProfile.role}
                                </span>
                              </p>
                              <p className="flex items-center justify-between">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                  <Award className="w-3.5 h-3.5" /> Trust Score:
                                </span>
                                <strong className="font-extrabold text-indigo-600 dark:text-indigo-400">
                                  {userSession.userProfile.trustScore} pts
                                </strong>
                              </p>
                            </div>
                          </div>

                          <div className="p-2 space-y-1 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAvatarMenuOpen(false);
                                setActivePage('PROFILE');
                                playUiSoundEffect('CLICK');
                              }}
                              className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
                                isDark
                                  ? 'hover:bg-slate-800'
                                  : 'hover:bg-slate-100'
                              }`}
                            >
                              <User className="w-4 h-4 text-indigo-600" />
                              <span>
                                {webLanguage === 'en'
                                  ? 'Profile & AI Banner Studio'
                                  : webLanguage === 'ja'
                                  ? 'プロフィール＆AI背景生成'
                                  : 'Hồ sơ Cá nhân & Tạo Nền AI'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={toggleThemeMode}
                              className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition ${
                                isDark
                                  ? 'hover:bg-slate-800'
                                  : 'hover:bg-slate-100'
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                {isDark ? (
                                  <Sun className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <Moon className="w-4 h-4 text-indigo-600" />
                                )}
                                <span>
                                  {webLanguage === 'en'
                                    ? 'Light / Dark Theme'
                                    : webLanguage === 'ja'
                                    ? 'ライト / ダークモード'
                                    : 'Chế độ Sáng / Tối'}
                                </span>
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">
                                {isDark ? 'Dark' : 'Light'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsAvatarMenuOpen(false);
                                setActivePage('SETTINGS');
                                playUiSoundEffect('CLICK');
                              }}
                              className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
                                isDark
                                  ? 'hover:bg-slate-800'
                                  : 'hover:bg-slate-100'
                              }`}
                            >
                              <Settings className="w-4 h-4 text-indigo-600" />
                              <span>
                                {webLanguage === 'en'
                                  ? 'System Settings & Security'
                                  : webLanguage === 'ja'
                                  ? 'システム設定・セキュリティ'
                                  : 'Cài đặt Nhạc Lofi, Bảo mật & Ngôn ngữ'}
                              </span>
                            </button>

                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                            <button
                              type="button"
                              onClick={handleLogout}
                              className="w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-rose-600 hover:bg-rose-500/10 font-bold transition"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>
                                {webLanguage === 'en'
                                  ? 'Sign Out'
                                  : webLanguage === 'ja'
                                  ? 'ログアウト'
                                  : 'Đăng xuất tài khoản'}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thanh chuyển trang nhanh trượt ngang trên Điện thoại & iPad (< lg) */}
                  <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                    {sidebarItems.map((item) => {
                      const IconComp = item.icon;
                      const isActive = activePage === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActivePage(item.id);
                            playUiSoundEffect('CLICK');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : isDark
                              ? 'bg-slate-800/80 text-slate-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{item.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </header>

                <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
                  {activePage === 'OVERVIEW' && (
                    <>
                      <DashboardMainPages
                        workspaceNodes={workspaceNodes}
                        bookingsList={bookingsList}
                        equipmentsList={equipmentsList}
                        trustProfiles={trustProfiles}
                        auditLogs={auditLogs}
                        isDark={isDark}
                        userRole={userSession.userProfile.role}
                        userEmail={userSession.userProfile.userEmail}
                        webLanguage={webLanguage}
                        onNavigateSection={(sec) => {
                          setActivePage(sec);
                          playUiSoundEffect('CLICK');
                        }}
                        onHandleApprovalDecision={handleApprovalDecision}
                      />

                      <FloorplanMainPages
                        workspaceNodes={workspaceNodes}
                        bookingsList={bookingsList}
                        selectedNode={selectedNode}
                        userRole={userSession.userProfile.role}
                        userDepartment={
                          userSession.userProfile.departmentName
                        }
                        webLanguage={webLanguage}
                        isDark={isDark}
                        onSelectNode={(n) => {
                          setSelectedNode(n);
                          playUiSoundEffect('CLICK');
                        }}
                        onNavigateToBookingWithSlot={
                          handleNavigateToBookingWithSlot
                        }
                        onUpdateNodeCoords={handleUpdateNodeCoords}
                        onUpdateNodeStatus={handleUpdateNodeStatus}
                        onCreateNewNode={handleCreateNewNode}
                      />
                    </>
                  )}

                  {activePage === 'FLOORPLAN' && (
                    <FloorplanMainPages
                      workspaceNodes={workspaceNodes}
                      bookingsList={bookingsList}
                      selectedNode={selectedNode}
                      userRole={userSession.userProfile.role}
                      userDepartment={userSession.userProfile.departmentName}
                      webLanguage={webLanguage}
                      isDark={isDark}
                      onSelectNode={(n) => {
                        setSelectedNode(n);
                        playUiSoundEffect('CLICK');
                      }}
                      onNavigateToBookingWithSlot={
                        handleNavigateToBookingWithSlot
                      }
                      onUpdateNodeCoords={handleUpdateNodeCoords}
                      onUpdateNodeStatus={handleUpdateNodeStatus}
                      onCreateNewNode={handleCreateNewNode}
                    />
                  )}

                  {activePage === 'BOOKING' && (
                    <BookingCalendarPages
                      bookingsList={bookingsList}
                      workspaceNodes={workspaceNodes}
                      departmentsList={departmentsList}
                      selectedNode={selectedNode}
                      preselectedSlot={preselectedSlot}
                      userEmail={userSession.userProfile.userEmail}
                      userRole={userSession.userProfile.role}
                      userDepartment={userSession.userProfile.departmentName}
                      webLanguage={webLanguage}
                      isDark={isDark}
                      onCreateNewBooking={(
                        email: string,
                        purpose: string,
                        targetCode?: string,
                        timeWin?: BookingTimeWindowInput
                      ) => {
                        const matchedNode =
                          workspaceNodes.find(
                            (n) => n.nodeCode === targetCode
                          ) ||
                          selectedNode ||
                          workspaceNodes[0];
                        if (matchedNode) {
                          handleQuickBooking(
                            matchedNode,
                            email,
                            purpose,
                            targetCode,
                            timeWin
                          );
                        }
                      }}
                      onCheckInBooking={handleCheckInBooking}
                      onCancelBooking={handleCancelBooking}
                      onUpdateNodeStatus={handleUpdateNodeStatus}
                      onRecordConcurrencyAudit={recordRealtimeAuditLog}
                      onPenalizeNoShowBooking={handlePenalizeNoShowBooking}
                    />
                  )}

                  {activePage === 'ORGANIZATION' && (
                    <OrganizationPages
                      departmentsList={departmentsList}
                      groupsList={groupsList}
                      trustProfiles={trustProfiles}
                      bookingsList={bookingsList}
                      equipmentsList={equipmentsList}
                      workspaceNodes={workspaceNodes}
                      userEmail={userSession.userProfile.userEmail}
                      userRole={userSession.userProfile.role}
                      userDepartment={userSession.userProfile.departmentName}
                      webLanguage={webLanguage}
                      isDark={isDark}
                      onUpsertDepartment={handleUpsertDepartment}
                      onDeleteDepartment={handleDeleteDepartment}
                      onAssignUserSingleDepartment={
                        handleAssignUserSingleDepartment
                      }
                      onUpsertGroup={handleUpsertGroup}
                      onDeleteGroup={handleDeleteGroup}
                      onToggleGroupMember={handleToggleGroupMember}
                      onNavigateToHallBooking={() => {
                        const hallNode = workspaceNodes.find(
                          (n) => n.nodeCode === 'H-01'
                        );
                        if (hallNode) setSelectedNode(hallNode);
                        setActivePage('BOOKING');
                        playUiSoundEffect('CLICK');
                      }}
                      onSubmitEquipmentFaultReport={
                        handleSubmitEquipmentFaultReport
                      }
                    />
                  )}

                  {activePage === 'NOTIFICATION' && (
                    <NotificationCenterPages
                      notifications={notificationsList}
                      userRole={userSession.userProfile.role}
                      webLanguage={webLanguage}
                      isDark={isDark}
                      onSelectAndNavigateNotification={
                        handleSelectAndNavigateNotification
                      }
                      onHandleApprovalDecision={handleApprovalDecision}
                      onMarkAllRead={() =>
                        setNotificationsList((prev) =>
                          prev.map((item) => ({ ...item, isRead: true }))
                        )
                      }
                      onDeleteNotification={handleDeleteNotification}
                      onTriggerTestNotification={(title, content) =>
                        pushRealtimeNotification(
                          title,
                          content,
                          'BOOKING_EVENT',
                          'NODE-M101'
                        )
                      }
                    />
                  )}

                  {activePage === 'DATAMANAGER' && (
                    <DataOverviewPages
                      workspaceNodes={workspaceNodes}
                      equipmentsList={equipmentsList}
                      equipmentFaultReports={equipmentFaultReports}
                      trustProfiles={trustProfiles}
                      trustScoreHistory={trustScoreHistory}
                      selectedNode={selectedNode}
                      userRole={userSession.userProfile.role}
                      userEmail={userSession.userProfile.userEmail}
                      webLanguage={webLanguage}
                      isDark={isDark}
                      onUpdateEquipmentStatus={handleUpdateEquipmentStatus}
                      onHandleEquipmentFaultDecision={
                        handleEquipmentFaultDecision
                      }
                      onTriggerAiAutoProcessFaults={
                        handleTriggerAiAutoProcessFaults
                      }
                      onTriggerMonthlyTrustBonus={
                        handleTriggerMonthlyTrustBonus
                      }
                    />
                  )}

                  {activePage === 'AUDIT' && isSysAdmin && (
                    <AuditLogPages
                      auditLogs={auditLogs}
                      managedUsers={managedUsers}
                      bookingsList={bookingsList}
                      webLanguage={webLanguage}
                      isDark={isDark}
                      onToggleBlockUser={handleToggleBlockUser}
                      onDeleteUserAccount={handleDeleteUserAccount}
                      onChangeUserRole={handleChangeUserRole}
                      onAdminOverrideBookingApproval={handleApprovalDecision}
                      onAdminDeleteBookingWithNotification={
                        handleAdminDeleteBookingWithNotification
                      }
                    />
                  )}

                  {activePage === 'PROFILE' && (
                    <ProfilePages
                      profileData={{
                        fullName: userSession.userProfile.fullName,
                        userEmail: userSession.userProfile.userEmail,
                        username: userSession.userProfile.username,
                        role: userSession.userProfile.role,
                        departmentName: userSession.userProfile.departmentName,
                        accountCode: userSession.userProfile.accountCode,
                        trustScore: userSession.userProfile.trustScore,
                        phoneNumber: currentCustomProfile.phoneNumber,
                        jobTitle: currentCustomProfile.jobTitle,
                        bioText: currentCustomProfile.bioText,
                        avatarUrl: currentCustomProfile.avatarUrl,
                        backgroundUrl: currentCustomProfile.backgroundUrl,
                      }}
                      userBookings={bookingsList}
                      isDark={isDark}
                      webLanguage={webLanguage}
                      isSyncingMongo={isSyncingMongo}
                      onSaveProfileCustomization={
                        handleSaveProfileCustomization
                      }
                    />
                  )}

                  {activePage === 'SETTINGS' && (
                    <SettingsPages
                      isDark={isDark}
                      userRole={userSession.userProfile.role}
                      username={userSession.userProfile.username}
                      userEmail={userSession.userProfile.userEmail}
                      userDepartment={userSession.userProfile.departmentName}
                      departmentsList={departmentsList}
                      groupsList={groupsList}
                      webLanguage={webLanguage}
                      onChangeWebLanguage={(lang) => {
                        setWebLanguage(lang);
                        playUiSoundEffect('CLICK');
                      }}
                      onChangeUserDepartment={(nextDept) =>
                        handleAssignUserSingleDepartment(
                          userSession.userProfile.userEmail,
                          nextDept
                        )
                      }
                      onNavigateOrganization={() => {
                        setActivePage('ORGANIZATION');
                        playUiSoundEffect('CLICK');
                      }}
                      onToggleTheme={toggleThemeMode}
                      lofiEnabled={audioSettings.lofiEnabled}
                      sfxEnabled={audioSettings.sfxEnabled}
                      lofiVolume={audioSettings.lofiVolume}
                      lofiTrackStyle={audioSettings.lofiTrackStyle}
                      onToggleLofi={(nextVal) =>
                        persistAudioSettings({
                          ...audioSettings,
                          lofiEnabled: nextVal,
                        })
                      }
                      onToggleSfx={(nextVal) =>
                        persistAudioSettings({
                          ...audioSettings,
                          sfxEnabled: nextVal,
                        })
                      }
                      onChangeLofiVolume={(nextVol) =>
                        persistAudioSettings({
                          ...audioSettings,
                          lofiVolume: nextVol,
                        })
                      }
                      onChangeLofiTrackStyle={(nextStyle) =>
                        persistAudioSettings({
                          ...audioSettings,
                          lofiTrackStyle: nextStyle,
                          lofiEnabled: true,
                        })
                      }
                      onPlayPreviewSfx={(type) =>
                        playUiSoundEffect(type, true)
                      }
                    />
                  )}
                </main>
              </div>

              <RealtimePopupToast
                activePopup={activePopupNotification}
                isDark={isDark}
                webLanguage={webLanguage}
                onDismissPopup={() => setActivePopupNotification(null)}
                onOpenNotificationPage={() => {
                  if (activePopupNotification) {
                    handleSelectAndNavigateNotification(
                      activePopupNotification
                    );
                  } else {
                    setActivePage('NOTIFICATION');
                  }
                }}
              />

              <QuickCommandPalette
                isOpen={isCommandPaletteOpen}
                isDark={isDark}
                userRole={userSession.userProfile.role}
                webLanguage={webLanguage}
                workspaceNodes={workspaceNodes}
                onClose={() => setIsCommandPaletteOpen(false)}
                onNavigatePage={(page) => {
                  setActivePage(page);
                  playUiSoundEffect('CLICK');
                }}
                onSelectRoomAndBook={(node) => {
                  setSelectedNode(node);
                  setActivePage('BOOKING');
                  playUiSoundEffect('CLICK');
                }}
                onToggleTheme={toggleThemeMode}
                onChangeLanguage={(lang) => {
                  setWebLanguage(lang);
                  try {
                    localStorage.setItem(WEB_LANGUAGE_STORAGE_KEY, lang);
                  } catch {
                    // ignore
                  }
                  playUiSoundEffect('CLICK');
                }}
              />

              <SpotMatrixAiCloudWidget
                workspaceNodes={workspaceNodes}
                bookingsList={bookingsList}
                equipmentsList={equipmentsList}
                trustProfiles={trustProfiles}
                trustScoreHistory={trustScoreHistory}
                departmentsList={departmentsList}
                groupsList={groupsList}
                auditLogs={auditLogs}
                userProfile={userSession.userProfile}
                webLanguage={webLanguage}
                isDark={isDark}
                onAiSyncBookingDraft={(node, slot) => {
                  setSelectedNode(node);
                  setPreselectedSlot({
                    dateIso: slot.dateIso,
                    start: slot.start,
                    end: slot.end,
                    purposeNote: slot.purposeNote,
                    approvalRequestReason: slot.approvalRequestReason,
                  });
                }}
                onAiNavigateAndPrefillBooking={(node, slot) => {
                  handleNavigateToBookingWithSlot(node, {
                    dateIso: slot.dateIso,
                    start: slot.start,
                    end: slot.end,
                    purposeNote: slot.purposeNote,
                    approvalRequestReason: slot.approvalRequestReason,
                  });
                }}
                onAiExecuteDirectBooking={(node, slot) => {
                  handleQuickBooking(
                    node,
                    userSession.userProfile.userEmail,
                    slot.purposeNote,
                    node.nodeCode,
                    {
                      dateIso: slot.dateIso,
                      start: slot.start,
                      end: slot.end,
                      approvalRequestReason: slot.approvalRequestReason,
                      recurringOption: 'NONE',
                      occurrenceDates: [slot.dateIso],
                      lockVersion: (node.lockVersion || 1) + 1,
                    }
                  );
                }}
                onAiUpsertGroup={handleUpsertGroup}
                onAiToggleGroupMember={handleToggleGroupMember}
                onAiRenameDepartment={handleAiRenameDepartment}
                onAiBatchUpdateEquipmentStatus={
                  handleAiBatchUpdateEquipmentStatus
                }
              />
            </div>
          )
        }
      />

      <Route
        path="*"
        element={
          <Navigate to={userSession ? '/dashboard' : '/welcome'} replace />
        }
      />
    </Routes>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <ErrorBoundaryLayout>
      <BrowserRouter>
        <MainWorkspaceRoutes />
      </BrowserRouter>
    </ErrorBoundaryLayout>
  );
};