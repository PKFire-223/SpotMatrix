import React from 'react';

export const NotFoundPages: React.FC = () => {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-rose-400">404 - Không tìm thấy phân khu</h2>
      <p className="text-slate-400 mt-2">Đường dẫn bạn truy cập không tồn tại trong hệ thống.</p>
    </div>
  );
};
