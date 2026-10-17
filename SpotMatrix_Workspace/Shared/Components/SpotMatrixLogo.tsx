import React from 'react';

interface SpotMatrixLogoProps {
  variant?: 'full' | 'icon';
  theme?: 'light' | 'dark';
  className?: string;
}

export const SpotMatrixLogo: React.FC<SpotMatrixLogoProps> = ({
  variant = 'full',
  theme = 'light',
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        viewBox="0 0 48 48"
        className="w-10 h-10 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="smGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="spotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        <rect
          x="0"
          y="0"
          width="48"
          height="48"
          rx="12"
          fill={theme === 'dark' ? '#1E293B' : '#0F172A'}
        />

        <rect x="8" y="8" width="20" height="8" rx="2.5" fill="url(#smGrad)" />
        <rect x="8" y="20" width="8" height="20" rx="2.5" fill="#334155" />
        <rect x="20" y="20" width="8" height="8" rx="2.5" fill="url(#smGrad)" />
        <rect x="32" y="20" width="8" height="8" rx="2.5" fill="#334155" />
        <rect x="20" y="32" width="20" height="8" rx="2.5" fill="url(#smGrad)" opacity="0.9" />

        <circle cx="36" cy="12" r="6.5" stroke="#10B981" strokeWidth="1.2" opacity="0.45" />
        <circle cx="36" cy="12" r="4.5" fill="url(#spotGrad)" />
        <circle cx="36" cy="12" r="1.8" fill="#FFFFFF" />
      </svg>

      {variant === 'full' && (
        <div className="flex items-baseline tracking-tight text-2xl">
          <span
            className={`font-extrabold ${
              theme === 'dark' ? 'text-slate-50' : 'text-slate-900'
            }`}
          >
            Spot
          </span>
          <span
            className={`font-medium ${
              theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
            }`}
          >
            Matrix
          </span>
          <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500 inline-block" />
        </div>
      )}
    </div>
  );
};