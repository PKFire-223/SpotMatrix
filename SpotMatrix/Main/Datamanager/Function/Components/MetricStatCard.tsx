import React from 'react';

interface MetricStatCardProps {
  metricTitle: string;
  metricValue: string | number;
  metricTrend: string;
}

export const MetricStatCard: React.FC<MetricStatCardProps> = ({
  metricTitle,
  metricValue,
  metricTrend,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow">
      <p className="text-xs text-slate-400 font-medium">{metricTitle}</p>
      <p className="text-2xl font-extrabold text-white mt-1">{metricValue}</p>
      <p className="text-[11px] text-emerald-400 mt-1">{metricTrend}</p>
    </div>
  );
};
