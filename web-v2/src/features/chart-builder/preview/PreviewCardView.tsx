import type { ReactNode } from 'react';
import type { WidgetSetting } from '@/core/dashboard/DashboardSetting';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { WidgetContainer } from '@/features/dashboard/widgets/WidgetContainer';
import { previewCardSize } from './preview.utils';
import './Preview.css';

export interface PreviewCard {
  /** The dashboard's widget look (v1 `DashboardModule.setting.widgetSetting`). */
  defaults: WidgetSetting;
  /** `data-dashboard-theme` of the dashboard, whose colors the card keeps inside the builder's default look. */
  themeCssName: string;
}

interface PreviewCardViewProps extends PreviewCard {
  chart: ChartWidget;
  children: ReactNode;
}

/**
 * v1 `PreviewPanel` (`widget-preview-area`): the chart on a widget card of the size it gets on the dashboard, in the
 * middle of the panel, with the dashboard's theme.
 */
export function PreviewCardView({ chart, defaults, themeCssName, children }: PreviewCardViewProps) {
  return (
    <div className="dashboard-theme chart-preview" data-dashboard-theme={themeCssName}>
      <div className="chart-preview__card" style={previewCardSize(chart.setting)}>
        <WidgetContainer widget={chart} defaults={defaults}>
          {children}
        </WidgetContainer>
      </div>
    </div>
  );
}
