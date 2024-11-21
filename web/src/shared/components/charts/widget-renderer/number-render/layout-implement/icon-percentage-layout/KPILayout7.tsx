import { KPILayout } from '@chart/widget-renderer/number-render/layout-implement/KPILayout';
import NumberWidget from '@chart/number-widget/NumberWidget';
import '@chart/widget-renderer/number-render/layout-implement/normal-layout/NormalLayout.scss';
import { Log } from '@core/utils';
import { KPITheme } from '@core/common/domain';

export class KPILayout7 extends KPILayout {
  canRender(widget: NumberWidget): boolean {
    return widget.setting.options.theme === KPITheme.Style7;
  }

  render(widget: NumberWidget, h: any): any {
    const style = {
      '--kpi-background-color': widget.setting.options.backgroundColor?.value
    };
    Log.debug('IconPercentageLayout::render', style);
    return (
      <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="kpi-widget--style-7" style={style}>
        {this.renderContent(widget, h)}
        {this.renderIcon(widget, h)}
      </div>
    );
  }

  private renderContent(widget: NumberWidget, h: any): any {
    return (
      <div class="kpi-widget--style-7--content">
        <div>
          {this.renderNumber(widget, h)}
          {this.renderTitle(widget, h)}
          {this.renderSubtitle(widget, h)}
        </div>
        {this.renderPercentage(widget, h)}
      </div>
    );
  }

  protected renderPercentage(widget: NumberWidget, h: any): JSX.Element {
    // if (!widget.hasCompareValue) {
    //   return <div></div>;
    // }

    const colorByInherit: boolean = widget.setting.options.percentage?.colorByInherit ?? false;
    const isDecrease: boolean = widget.hasCompareValue && widget.isDecrease;
    const manualTextColor = isDecrease ? widget.setting.options.percentage?.decreaseColor : widget.setting.options.percentage?.increaseColor;
    const style = {
      '--percentage-text-color': colorByInherit ? widget.setting.options.style?.color : manualTextColor
    };
    return (
      <div class="percentage" style={style}>
        {this.renderIconPercentage(widget, h)}
        15%
        {/*{widget.comparePercentage}*/}
      </div>
    );
  }

  private renderIconPercentage(widget: NumberWidget, h: any): JSX.Element {
    const iconClass = widget.isDecrease ? 'icon-percentage-decrease' : 'icon-percentage-increase';
    return (
      <div class={iconClass}>
        <i class="di-icon-shape" />
      </div>
    );
  }
}
