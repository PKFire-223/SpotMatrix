import React, { ReactNode } from 'react';

export const NotificationPanelLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <div className="w-full max-w-5xl mx-auto space-y-4">{children}</div>;
};