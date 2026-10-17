import React, { ReactNode } from 'react';

export const AiChatPanelLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <div className="w-full">{children}</div>;
};
