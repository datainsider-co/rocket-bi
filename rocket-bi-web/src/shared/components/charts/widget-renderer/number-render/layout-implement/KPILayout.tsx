import NumberWidget from '@chart/number-widget/NumberWidget';
import { DisplayValue } from '@core/common/domain';
import IconSettingPopover from '@/shared/components/icon-picker/IconSettingPopover.vue';
import { Log } from '@core/utils';
import { set } from 'lodash';
import { ChartType } from '@/shared';
import TrendAreaChart from '@chart/widget-renderer/number-render/layout-implement/trend-line-layout/TrendAreaChart.vue';
import TrendLineChart from '@chart/widget-renderer/number-render/layout-implement/trend-line-layout/TrendLineChart.vue';

export abstract class KPILayout {
  abstract render(widget: NumberWidget, h: any): any;

  abstract canRender(widget: NumberWidget): boolean;

  protected renderTitle(widget: NumberWidget, h: any) {
    const enableTitle = widget.headerProps.enableTitle;
    return enableTitle ? (
      <div style={widget.headerProps.titleStyle} class="kpi-widget--title">
        {widget.headerProps.title}
      </div>
    ) : (
      ''
    );
  }

  protected renderSubtitle(widget: NumberWidget, h: any) {
    const enableSubtitle = widget.headerProps.enableSubtitle;
    return enableSubtitle ? (
      <div style={widget.headerProps.subtitleStyle} class="kpi-widget--subtitle">
        {widget.headerProps.subTitle}
      </div>
    ) : (
      ''
    );
  }

  protected renderHeader(widget: NumberWidget, h: any) {
    return (
      <div class="kpi-widget--header">
        {this.renderIcon(widget, h)}
        {this.renderPercentage(widget, h)}
      </div>
    );
  }

  protected renderIcon(widget: NumberWidget, h: any) {
    const iconEnabled = widget.setting.options.icon?.enabled ?? false;
    if (!iconEnabled) {
      return '';
    }
    const style = {
      '--shape-background': widget.setting.options.icon?.background,
      '--shape-box-shadow': widget.setting.options.icon?.shadow,
      '--icon-color': widget.setting.options.icon?.color,
      '--border-shape': widget.setting.options.icon?.border,
      cursor: widget.showEditComponent ? 'pointer' : null
    };
    const iconId = 'kpi-icon-' + widget.id;
    const iconClass = widget.setting.options.icon?.iconClass ?? 'setting-icon-dollar';
    const iconColor = widget.setting.options.icon?.color ?? '#4f4f4f';
    const border = widget.setting.options.icon?.border ?? '4px';
    const background = widget.setting.options.icon?.background ?? '#fff';
    Log.debug('showEditComponent::', widget.showEditComponent);
    return (
      <div id={iconId} class="kpi-widget--icon" style={style}>
        <i style={{ color: iconColor }} class={iconClass} alt="" />
        {widget.showEditComponent && (
          <IconSettingPopover
            onSelectIcon={(iconClass: string) => this.handleUpdateIcon(widget, iconClass)}
            onRevertDefault={() => this.handleResetDefault(widget)}
            onSelectIconColor={(color: string) => this.handleUpdateIconColor(widget, color)}
            onChangeIconBackground={(color: string) => this.handleUpdateIconBackground(widget, color)}
            onChangeBorderRadius={(value: string) => this.handleUpdateBorderRadius(widget, value)}
            onChangeBorderColor={(value: string) => this.handleUpdateBorderColor(widget, value)}
            targetId={iconId}
            selected-icon={iconClass}
            selected-icon-color={iconColor}
            border-radius={border}
            background={background}></IconSettingPopover>
        )}
      </div>
    );
  }

  private async handleUpdateIcon(widget: NumberWidget, iconClass: string) {
    set(widget.setting, 'options.icon.iconClass', iconClass);
    Log.debug('KPILayout::updateIcon::', widget.setting, iconClass);
    await widget.saveChart(widget.chartInfo);
  }

  private async handleResetDefault(widget: NumberWidget) {
    Log.debug('KPILayout::handleResetDefault::', widget.setting.options.theme);

    try {
      if (widget.setting.options.theme) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const themeSettings = require('@/shared/settings/number-setting/themeSettings.json');
        Log.debug('KPILayout::handleResetDefault::', widget.setting.options.theme);
        Log.debug('KPILayout::handleResetDefault::themeSettings::', themeSettings[widget.setting.options.theme]);
        set(widget.setting, 'options.icon', themeSettings[widget.setting.options.theme].icon);
        await widget.saveChart(widget.chartInfo);
      }
    } catch (e) {
      Log.error('KPILayout::handleResetDefault::', e);
    }
  }

  private async handleUpdateIconColor(widget: NumberWidget, color: string) {
    set(widget.setting, 'options.icon.color', color);
    Log.debug('KPILayout::handleUpdateIconColor::', widget.setting.options.theme, color);
    await widget.saveChart(widget.chartInfo);
  }

  private async handleUpdateIconBackground(widget: NumberWidget, color: string) {
    set(widget.setting, 'options.icon.background', color);
    Log.debug('KPILayout::handleUpdateIconBackground::', widget.setting, color);
    await widget.saveChart(widget.chartInfo);
  }

  private async handleUpdateBorderRadius(widget: NumberWidget, value: string) {
    set(widget.setting, 'options.icon.border', value);
    Log.debug('KPILayout::handleUpdateBorderRadius::', widget.setting, value);
    await widget.saveChart(widget.chartInfo);
  }

  private async handleUpdateBorderColor(widget: NumberWidget, color: string) {
    set(widget.setting, 'options.icon.borderColor', color);
    Log.debug('KPILayout::handleUpdateBorderColor::', widget.setting, color);
    await widget.saveChart(widget.chartInfo);
  }

  protected renderPercentage(widget: NumberWidget, h: any) {
    if (!widget.hasCompareValue) {
      return '';
    }
    const colorByInherit: boolean = widget.setting.options.percentage?.colorByInherit ?? false;
    const isDecrease: boolean = widget.hasCompareValue && widget.isDecrease;
    const manualTextColor = isDecrease ? widget.setting.options.percentage?.decreaseColor : widget.setting.options.percentage?.increaseColor;
    const style = {
      '--percentage-text-color': colorByInherit ? widget.setting.options.style?.color : manualTextColor
    };
    const value = widget.setting.options.percentage?.display === DisplayValue.Percentage ? `${widget.comparePercentage}%` : `${widget.compareValue}`;
    const sign = widget.comparePercentage > 0 ? '+' : '';
    return (
      <div class="percentage" style={style}>
        {sign}
        {value}
      </div>
    );
  }

  protected renderNumber(widget: NumberWidget, h: any) {
    return (
      <div class="kpi-widget--value" style={widget.valueStyle}>
        <span style={widget.prefixStyle}>{widget.prefix}</span>
        <span>{widget.formattedValue}</span>
        <span style={widget.postfixStyle}>{widget.postfix} </span>
      </div>
    );
  }

  private getColorFromPercentage(widget: NumberWidget): string | undefined {
    const colorByInherit: boolean = widget.setting.options.percentage?.colorByInherit ?? false;
    const isDecrease: boolean = widget.hasCompareValue && widget.isDecrease;
    const manualTextColor = isDecrease ? widget.setting.options.percentage?.decreaseColor : widget.setting.options.percentage?.increaseColor;
    return colorByInherit ? widget.setting.options.style?.color : manualTextColor;
  }

  protected renderTrendChart(widget: NumberWidget, h: any): string | JSX.Element {
    if (!widget.canRenderTrendLine) {
      return '';
    }
    const colorByPercentage = widget.setting.options.trendLine?.colorByPercentage ?? false;
    const color: string | undefined = colorByPercentage ? this.getColorFromPercentage(widget) : widget.setting.options.trendLine?.color;
    switch (widget.setting.options.trendLine?.displayAs) {
      case ChartType.Line:
        return <TrendLineChart chartInfo={widget.trendLineChartInfo} color={color} />;
      case ChartType.Area:
        return <TrendAreaChart chartInfo={widget.trendLineChartInfo} color={color} />;
      default:
        return '';
    }
  }
}
