import type { CSSProperties } from 'react';
import type { KpiComparison } from './kpiComparison.utils';

/**
 * The comparison of a plain layout (v1 `PercentageBar`), by `compareStyle`: the trend icon, the change without its
 * sign and the compared value; the value or the change alone; or the value on a line of its own. Only the icon and
 * the change take the trend's color.
 */
export function KpiComparisonBar({ comparison }: { comparison: KpiComparison | undefined }) {
  if (!comparison) return null;
  const { displayAs, icon, color, percentage, value } = comparison.bar;
  const change = displayAs !== 'number' && <span className="kpi__bar-change">{percentage}</span>;
  return (
    <div className={`kpi__bar kpi__bar--${displayAs}`} style={{ '--kpi-trend-color': color } as CSSProperties}>
      <span className="kpi__bar-line">
        <i className={icon} aria-hidden />
        {change}
        {(displayAs === 'default' || displayAs === 'number') && <span>({value})</span>}
      </span>
      {displayAs === 'text' && <span className="kpi__bar-line">Compare period: {value}</span>}
    </div>
  );
}
