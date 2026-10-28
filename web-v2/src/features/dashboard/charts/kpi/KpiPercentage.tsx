import type { KpiComparison } from './kpiComparison.utils';

/** The comparison of a themed layout: the signed change, in its color (v1 `KPILayout.renderPercentage`). */
export function KpiPercentage({ comparison, className = '' }: { comparison: KpiComparison | undefined; className?: string }) {
  if (!comparison) return null;
  return (
    <span className={`kpi__percentage ${className}`} style={{ color: comparison.color }}>
      {comparison.text}
    </span>
  );
}
