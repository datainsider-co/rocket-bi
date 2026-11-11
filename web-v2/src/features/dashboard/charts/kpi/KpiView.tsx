import type { ReactNode } from 'react';
import type { KpiModel } from './kpi.utils';
import { KpiComparisonBar } from './KpiComparisonBar';
import { KpiHeading } from './KpiHeading';
import { KpiIcon } from './KpiIcon';
import { KpiPercentage } from './KpiPercentage';
import { KpiPlainHeader } from './KpiPlainHeader';
import { KpiTrendChart } from './KpiTrendChart';
import { KpiValue } from './KpiValue';
import './Kpi.css';

interface KpiViewProps {
  kpi: KpiModel;
  /** The plain layouts' date range picker (v1 `DateRangeDropdown`): above the value, or under the comparison beside a trend line. */
  dateRange?: ReactNode;
}

/**
 * The KPI widget (v1 `NumberWidget`), by layout (`KpiLayout`): plain, centered, with its date range and v1's
 * `PercentageBar`; plain with a trend line below, the comparison at the top right; themed, from the top left, the
 * comparison as a pill; with a trend line on the right; or the area layout, the trend line along the bottom.
 */
export function KpiView({ kpi, dateRange }: KpiViewProps) {
  switch (kpi.layout) {
    case 'plain':
    case 'plainComparison':
      return (
        <div className={`kpi kpi--plain${kpi.layout === 'plainComparison' ? ' kpi--comparison' : ''}`}>
          <KpiPlainHeader kpi={kpi} />
          {dateRange}
          <KpiValue kpi={kpi} />
          <KpiComparisonBar comparison={kpi.comparison} />
        </div>
      );
    case 'plainTrend':
      return (
        <div className="kpi kpi--plain-trend">
          <div className="kpi__summary">
            <div className="kpi__summary-row">
              <div className="kpi__summary-info">
                <KpiPlainHeader kpi={kpi} />
                <KpiValue kpi={kpi} />
              </div>
              <div className="kpi__summary-comparison">
                <KpiComparisonBar comparison={kpi.comparison} />
                {dateRange}
              </div>
            </div>
          </div>
          <div className="kpi__trend-body">
            <KpiTrendChart trend={kpi.trend} className="kpi__trend--below" />
          </div>
        </div>
      );
    case 'trend':
      return (
        <div className="kpi kpi--trend">
          <div className="kpi__trend-header">
            <KpiValue kpi={kpi} />
            <KpiIcon icon={kpi.icon} />
          </div>
          <KpiHeading kpi={kpi} />
          <KpiPercentage comparison={kpi.comparison} className="kpi__percentage--pill kpi__percentage--under" />
          <KpiTrendChart trend={kpi.trend} className="kpi__trend--right" />
        </div>
      );
    case 'area':
      return (
        <div className="kpi kpi--area">
          <div className="kpi__area-content">
            <KpiIcon icon={kpi.icon} large />
            <div className="min-w-0">
              <KpiHeading kpi={kpi} />
              <div className="kpi__area-value">
                <KpiValue kpi={kpi} />
                <KpiPercentage comparison={kpi.comparison} className="kpi__percentage--pill" />
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
          <KpiPercentage comparison={kpi.comparison} className="kpi__percentage--pill kpi__percentage--corner" />
        </div>
      );
  }
}
