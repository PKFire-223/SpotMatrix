import React, { ReactNode } from 'react';

export const DataDashboardLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{children}</div>;
};
