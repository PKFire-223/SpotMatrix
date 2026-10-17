import React, { ReactNode } from 'react';

export const BookingSplitLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <section className="w-full space-y-4">{children}</section>;
};
