import { KPILayout } from './KPILayout';
import NumberWidget from '@chart/number-widget/NumberWidget';
import '../NumberRenderer.scss';

export class OnlyTitleLayout extends KPILayout {
  canRender(widget: NumberWidget): boolean {
    return false;
  }

  render(widget: NumberWidget, h: any): any {
    return (
      <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="kpi-widget">
        {this.renderHeader(widget, h)}
        <div class="kpt-widget--content">{this.renderNumber(widget, h)}</div>
      </div>
    );
  }

  protected renderHeader(widget: NumberWidget, h: any): JSX.Element {
    return (
      <div class="kpi-widget--header">
        {this.renderTitle(widget, h)}
        {this.renderPercentage(widget, h)}
      </div>
    );
  }
}
