## Tóm tắt thay đổi (Summary)
- Module tác động: `[Main/Floorplan | Main/Booking | Main/Datamanager | Ai | Error]`
- Mô tả ngắn gọn:

## Checklist Quy chuẩn Code (Code Rules Verification)
- [ ] Tên thư mục viết hoa chữ cái đầu duy nhất (VD: `Main`, `Floorplan`, `Pages`, `Layout`, `Function`)
- [ ] Tên file viết hoa chữ cái đầu mỗi từ theo chuẩn `PascalCase` (VD: `MainPages.tsx`, `BookingController.ts`)
- [ ] Tên hàm và biến tuân thủ tuyệt đối `camelCase` (VD: `calculateZoneOccupancy`, `createBookingSlot`)
- [ ] Giao diện đã kiểm tra Responsive trên Mobile (375px), iPad/Tablet (768px) và Desktop (1440px)
- [ ] Mọi API đều đi qua tầng `Error/Function/Middlewares/GlobalErrorMiddleware.ts`
