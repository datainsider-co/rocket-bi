import { KPILayout } from '../KPILayout';
import NumberWidget from '@chart/number-widget/NumberWidget';
import './NormalLayout.scss';
import { ColorUtils } from '@/utils';

export class NormalLayout extends KPILayout {
  canRender(widget: NumberWidget): boolean {
    return true;
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
      <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="kpi-widget" style={style}>
        <div class="kpi-widget--content">
          {this.renderIcon(widget, h)}
          <div class="kpi-widget--info">
            {this.renderTitle(widget, h)}
            {this.renderSubtitle(widget, h)}
          </div>
          {this.renderNumber(widget, h)}
        </div>

        <div class="kpi-widget--percentage" style={percentageStyle}>
          {this.renderPercentage(widget, h)}
        </div>
      </div>
    );
  }
}
