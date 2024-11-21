import { KPILayout } from './KPILayout';
import NumberWidget from '@chart/number-widget/NumberWidget';
import './normal-layout/NormalLayout.scss';
import { KPITheme } from '@core/common/domain';

export class KPILayout8 extends KPILayout {
  canRender(widget: NumberWidget): boolean {
    return widget.setting.options.theme === KPITheme.Style8;
  }

  render(widget: NumberWidget, h: any): any {
    const style = {
      '--kpi-background-color': widget.setting.options.backgroundColor?.value
    };
    return (
      <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="kpi-widget--style-8" style={style}>
        <div class="kpi-widget--style-8--content">
          {this.renderIcon(widget, h)}
          <div>
            {this.renderTitle(widget, h)}
            {this.renderSubtitle(widget, h)}
            {this.renderNumber(widget, h)}
          </div>
        </div>
        <div class="kpi-widget--style-8--percentage">{this.renderPercentage(widget, h)}</div>
      </div>
    );
  }
}
