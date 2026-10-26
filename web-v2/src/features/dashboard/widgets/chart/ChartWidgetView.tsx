import type { ChartWidget } from '@/core/dashboard/Widget';
import { chartSubtitle, chartTitle } from './chartWidget.utils';

/**
 * Title and subtitle of a chart, styled by the dashboard's widget setting. The chart itself is rendered once the query
 * pipeline lands (MIGRATION.md, dashboard M2).
 */
export function ChartWidgetView({ widget }: { widget: ChartWidget }) {
  const subtitle = chartSubtitle(widget);
  return (
    <div className="flex h-full flex-col">
      <div
        className="truncate"
        style={{
          fontFamily: 'var(--widget-primary-font-family)',
          fontSize: 'var(--widget-primary-font-size)',
          fontWeight: 'var(--widget-primary-font-weight)',
          fontStyle: 'var(--widget-primary-font-style)',
          textDecoration: 'var(--widget-primary-font-underlined)',
          textAlign: 'var(--widget-primary-font-align)' as 'center'
        }}
      >
        {chartTitle(widget)}
      </div>
      {subtitle && (
        <div className="truncate" style={{ color: 'var(--secondary-text-color)', fontSize: 'var(--widget-secondary-font-size)' }}>
          {subtitle}
        </div>
      )}
      <div className="flex flex-1 items-center justify-center text-xs" style={{ color: 'var(--secondary-text-color)' }}>
        {String(widget.setting['class_name'] ?? 'chart')}
      </div>
    </div>
  );
}
