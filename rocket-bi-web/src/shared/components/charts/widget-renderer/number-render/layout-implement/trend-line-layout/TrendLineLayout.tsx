import { KPILayout } from '../KPILayout';
import NumberWidget from '@chart/number-widget/NumberWidget';
import '../../NumberRenderer.scss';
import { ColorUtils } from '@/utils';

export class TrendLineLayout extends KPILayout {
  canRender(widget: NumberWidget): boolean {
    return widget.canRenderTrendLine;
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
        <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="trend-line-kpi-widget">
          <div class="trend-line-kpi-widget--content">
            <div class="trend-line-kpi-widget--header">
              {this.renderNumber(widget, h)}
              {this.renderIcon(widget, h)}
            </div>
            <div class="trend-line-kpi-widget--info">
              {this.renderTitle(widget, h)}
              {this.renderSubtitle(widget, h)}
            </div>
            <div class="trend-line-kpi-widget--percentage" style={percentageStyle}>
              {this.renderPercentage(widget, h)}
            </div>
          </div>
        </div>
        <div class="trend-line-kpi-widget--opacity"></div>
        {this.renderTrendChart(widget, h)}
      </div>
    );
  }

  protected renderTrendChart(widget: NumberWidget, h: any): string | JSX.Element {
    const chart = super.renderTrendChart(widget, h);
    return <div class="trend-line-kpi-widget--line">{chart}</div>;
  }
}
