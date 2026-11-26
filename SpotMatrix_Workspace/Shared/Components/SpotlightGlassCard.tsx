import React from 'react';

export interface SpotlightGlassCardProps {
  isDark: boolean;
  onClick?: () => void;
  spotlightColor?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Thẻ kính Hairline Shadow kết hợp hiệu ứng ánh sáng Spotlight theo con trỏ chuột
 * (Học từ DavidHDev/react-bits & emilkowalski/skills).
 * Cập nhật tọa độ chuột trực tiếp qua CSS Custom Properties để không gây re-render React.
 */
export const SpotlightGlassCard: React.FC<SpotlightGlassCardProps> = ({
  isDark,
  onClick,
  spotlightColor,
  className = '',
  children,
}) => {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
    if (spotlightColor) {
      e.currentTarget.style.setProperty('--spotlight-color', spotlightColor);
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      className={`smx-spotlight-host relative overflow-hidden rounded-3xl ${
        isDark ? 'smx-hairline-card-dark' : 'smx-hairline-card-light'
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${className}`}
    >
      <div className="smx-spotlight-overlay" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
