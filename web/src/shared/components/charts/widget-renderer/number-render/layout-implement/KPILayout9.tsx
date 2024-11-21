import { KPILayout } from './KPILayout';
import NumberWidget from '@chart/number-widget/NumberWidget';
import './normal-layout/NormalLayout.scss';
import { KPITheme } from '@core/common/domain';

export class KPILayout9 extends KPILayout {
  canRender(widget: NumberWidget): boolean {
    switch (widget.setting.options.theme) {
      case KPITheme.Style9:
      case KPITheme.Style10:
      case KPITheme.Style11:
      case KPITheme.Style12:
        return true;
      default:
        return false;
    }
  }

  render(widget: NumberWidget, h: any): any {
    const style = {
      '--kpi-background-color': widget.setting.options.backgroundColor?.value
    };
    return (
      <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="kpi-widget--style-9" style={style}>
        <div class="kpi-widget--style-9--header">
          {this.renderIcon(widget, h)}
          {this.renderPercentage(widget, h)}
        </div>
        {this.renderTitle(widget, h)}
        {this.renderSubtitle(widget, h)}
        {this.renderNumber(widget, h)}
      </div>
    );
  }
}
