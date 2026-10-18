import React, { ReactNode } from 'react';

export const DashboardGridLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <div className="space-y-5">{children}</div>;
};