import React, { useState } from 'react';
import { BookingPayloadItem } from '../../../../Shared/Types/GlobalSystemTypes';

interface BookingFormModalProps {
  bookingsList: BookingPayloadItem[];
  onCreateNewBooking: (userEmail: string, purposeNote: string) => void;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  bookingsList,
  onCreateNewBooking,
}) => {
  const [userEmail, setUserEmail] = useState('developer@smartspace.io');
  const [purposeNote, setPurposeNote] = useState('Coding Sprint & System Design');

  const handleSubmitForm = (event: React.FormEvent) => {
    event.preventDefault();
    onCreateNewBooking(userEmail, purposeNote);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <form
        onSubmit={handleSubmitForm}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3"
      >
        <h3 className="text-sm font-bold text-indigo-400 uppercase">
          Tạo Lịch Đặt Chỗ Nhanh (Quick Booking)
        </h3>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email người đặt</label>
          <input
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Mục đích sử dụng</label>
          <input
            value={purposeNote}
            onChange={(e) => setPurposeNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
        >
          Xác nhận Đặt chỗ vị trí đang chọn
        </button>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-2">
        <h3 className="text-sm font-bold text-emerald-400 uppercase">
          Danh sách Đặt chỗ Thời gian thực
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {bookingsList.map((item) => (
            <div
              key={item.bookingId}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-white">
                  {item.nodeId} — {item.purposeNote}
                </p>
                <p className="text-slate-400">{item.userEmail}</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                {item.bookingStatus}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
