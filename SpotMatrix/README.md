# SmartSpace 2D/3D — Hệ Thống Quản Lý Dữ Liệu & Đặt Chỗ Không Gian Làm Việc Tương Tác

Bộ khung khởi tạo chuẩn kiến trúc **Feature-Driven Modular Architecture** kết hợp hiển thị mặt bằng 2D/3D tương tác trực tiếp, gợi ý chỗ ngồi bằng AI (`Ai/`), và cơ chế phòng ngừa lỗi tập trung (`Error/`).

## 1. Quy tắc Đặt tên (Naming Conventions)
- **Thư mục (Folders)**: Chỉ viết hoa chữ cái đầu tiên (ví dụ: `Main`, `Floorplan`, `Booking`, `Datamanager`, `Ai`, `Error`, `Shared`, `Pages`, `Layout`, `Function`, `Components`, `Routes`, `Controllers`, `Services`, `Models`, `Middlewares`).
- **Tập tin (Files)**: Viết hoa chữ cái đầu của từng từ theo chuẩn `PascalCase` (ví dụ: `FloorplanMainPages.tsx`, `InteractiveMap2D.tsx`, `BookingController.ts`, `GlobalErrorMiddleware.ts`).
- **Hàm & Biến (Functions & Variables)**: Viết theo chuẩn `camelCase` rõ nghĩa (ví dụ: `fetchAllFloorplanNodes`, `createWorkspaceBooking`, `recommendOptimalSeat`, `handleGlobalException`).

## 2. Hướng dẫn chạy ngay trên VS Code
1. Giải nén thư mục dự án và mở bằng **VS Code**.
2. Copy file môi trường:
   ```bash
   cp .env.example .env
   ```
3. Cài đặt toàn bộ thư viện:
   ```bash
   npm install
   ```
4. Khởi chạy đồng thời cả Frontend (Vite + React + Tailwind + 2D/3D) và Backend (Express + TypeScript + MongoDB/Fallback):
   ```bash
   npm run dev
   ```
5. Mở trình duyệt tại `http://localhost:5173` (hỗ trợ kiểm tra Responsive cho iPhone, iPad và Desktop ngay trên DevTools).
