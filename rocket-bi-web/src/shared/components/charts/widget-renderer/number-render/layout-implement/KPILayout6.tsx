import { KPILayout } from './KPILayout';
import NumberWidget from '@chart/number-widget/NumberWidget';
import './normal-layout/NormalLayout.scss';
import { KPITheme } from '@core/common/domain';

export class KPILayout6 extends KPILayout {
  canRender(widget: NumberWidget): boolean {
    return widget.setting.options.theme === KPITheme.Style6;
  }

  render(widget: NumberWidget, h: any): any {
    return this.enableIcon(widget) ? this.renderWithIcon(widget, h) : this.renderWithoutIcon(widget, h);
  }

  private enableIcon(widget: NumberWidget): boolean {
    return false;
  }

  private getStyle(widget: NumberWidget): Record<string, any> {
    return {
      '--kpi-background-color': widget.setting.options.backgroundColor?.value
    };
  }

  private renderWithIcon(widget: NumberWidget, h: any) {
    const style = this.getStyle(widget);
    return (
      <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="kpi-widget--style-6" style={style}>
        <div class="kpi-widget--style-6--content">
          {this.renderIcon(widget, h)}
          <div>
            {this.renderTitle(widget, h)}
            {this.renderSubtitle(widget, h)}
          </div>
          <div>
            {this.renderNumber(widget, h)}
            <div class="kpi-widget--style-6--percentage">{this.renderPercentage(widget, h)}</div>
          </div>
        </div>
      </div>
    );
  }

  private renderWithoutIcon(widget: NumberWidget, h: any) {
    const style = this.getStyle(widget);
    return (
      <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="kpi-widget--style-6 no-icon" style={style}>
        <div class="kpi-widget--style-6--content">
          <div class="kpi-widget--style-6--content--title">
            <div>
              {this.renderTitle(widget, h)}
              {this.renderSubtitle(widget, h)}
            </div>
            <div class="kpi-widget--style-6--percentage">{this.renderPercentage(widget, h)}</div>
          </div>
          {this.renderNumber(widget, h)}
        </div>
      </div>
    );
  }
}
