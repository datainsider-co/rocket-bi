import type { ReactNode } from 'react';
import type { KpiModel } from './kpi.utils';
import { KpiHeading } from './KpiHeading';
import { KpiIcon } from './KpiIcon';
import { KpiPercentage } from './KpiPercentage';
import { KpiTrendChart } from './KpiTrendChart';
import { KpiValue } from './KpiValue';
import './Kpi.css';

interface KpiViewProps {
  kpi: KpiModel;
  /** The plain layout's date range picker (v1 `DateRangeDropdown`), shown above the value. */
  dateRange?: ReactNode;
}

/**
 * The KPI widget (v1 `NumberWidget`), by layout (`KpiLayout`): plain, centered, with its date range, v1's
 * `PercentageBar` and the trend line below; themed, from the top left, the comparison as a pill; with a trend line on
 * the right; or the area layout, the trend line along the bottom.
 */
export function KpiView({ kpi, dateRange }: KpiViewProps) {
  switch (kpi.layout) {
    case 'plain':
      return (
        <div className="kpi kpi--plain">
          {(kpi.title || kpi.subtitle) && (
            <div className="kpi__header">
              {kpi.title && <div className="kpi__title" style={kpi.title.style} title={kpi.title.text}>{kpi.title.text}</div>}
              {kpi.subtitle && <div className="kpi__subtitle" style={kpi.subtitle.style} title={kpi.subtitle.text}>{kpi.subtitle.text}</div>}
            </div>
          )}
          {dateRange}
          <KpiValue kpi={kpi} />
          {kpi.comparison && (
            <div className="kpi__bar" style={{ color: kpi.comparison.barColor }}>
              <i className={kpi.comparison.barIcon} aria-hidden />
              <span>{kpi.comparison.barText}</span>
            </div>
          )}
          <KpiTrendChart trend={kpi.trend} className="kpi__trend--below" />
        </div>
      );
    case 'trend':
      return (
        <div className="kpi kpi--themed kpi--trend">
          <div className="flex items-center gap-4">
            <KpiIcon icon={kpi.icon} />
            <KpiValue kpi={kpi} />
          </div>
          <KpiHeading kpi={kpi} />
          <KpiPercentage comparison={kpi.comparison} className="mt-6" />
          <KpiTrendChart trend={kpi.trend} className="kpi__trend--right" />
        </div>
      );
    case 'area':
      return (
        <div className="kpi kpi--themed kpi--area">
          <div className="flex items-start gap-4">
            <KpiIcon icon={kpi.icon} large />
            <div className="flex min-w-0 flex-col gap-2">
              <KpiHeading kpi={kpi} />
              <div className="flex items-center gap-5">
                <KpiValue kpi={kpi} />
                <KpiPercentage comparison={kpi.comparison} />
              </div>
            </div>
          </div>
          <KpiTrendChart trend={kpi.trend} className="kpi__trend--bottom" />
        </div>
      );
    default:
      return (
        <div className="kpi kpi--themed">
          <KpiIcon icon={kpi.icon} />
          <KpiHeading kpi={kpi} />
          <KpiValue kpi={kpi} />
          <KpiPercentage comparison={kpi.comparison} className="kpi__percentage--pill" />
        </div>
      );
  }
}
