import React from 'react';

export const RoleBadgeView: React.FC<{ roleName: string }> = ({ roleName }) => {
  return <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs">{roleName}</span>;
};
