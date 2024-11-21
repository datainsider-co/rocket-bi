import { KPILayout } from '../KPILayout';
import NumberWidget from '@chart/number-widget/NumberWidget';
import '../../NumberRenderer.scss';
import { ColorUtils } from '@/utils';
import { Log } from '@core/utils';
import TrendAreaChart from '@chart/widget-renderer/number-render/layout-implement/trend-line-layout/TrendAreaChart.vue';
import { KPITheme } from '@core/common/domain';

export class AreaLayout extends KPILayout {
  canRender(widget: NumberWidget): boolean {
    return widget.setting.options.theme === KPITheme.StyleArea1;
    // return widget.canRenderTrendLine && widget.setting.options.trendLine?.displayAs === ChartType.Area;
  }

  render(widget: NumberWidget, h: any): any {
    const background = widget.setting.options.background;
    const style = {
      '--kpi-background-color': background
    };
    const percentageStyle = {
      '--kpi-background-color': ColorUtils.isGradientColor(background) ? 'transparent' : background
    };
    return (
      <div style={style}>
        <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="trend-area-kpi-widget">
          <div class="trend-area-kpi-widget--content">
            {this.renderIcon(widget, h)}
            <div class="trend-area-kpi-widget--info">
              {this.renderTitle(widget, h)}
              {this.renderSubtitle(widget, h)}
              <div class="trend-area-kpi-widget--content-value" style={percentageStyle}>
                {this.renderNumber(widget, h)}
                {this.renderPercentage(widget, h)}
              </div>
            </div>
          </div>
          <div class="trend-area-kpi-widget--opacity"></div>
        </div>
        {this.renderTrendChart(widget, h)}
      </div>
    );
  }

  protected renderTrendChart(widget: NumberWidget, h: any): string | JSX.Element {
    const chart = super.renderTrendChart(widget, h);
    return <div class="trend-area-kpi-widget--line">{chart}</div>;
  }
}
