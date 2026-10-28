import { useMemo } from 'react';
import { HighchartsChart } from '@/shared/charts/HighchartsChart';
import { trendChartOptions, type KpiTrend } from './kpiComparison.utils';

/** The trend line, filling its box. */
export function KpiTrendChart({ trend, className = '' }: { trend: KpiTrend | undefined; className?: string }) {
  const options = useMemo(() => trend && trendChartOptions(trend), [trend]);
  if (!options) return null;
  return (
    <div className={`kpi__trend ${className}`}>
      <HighchartsChart options={options} fill />
    </div>
  );
}
