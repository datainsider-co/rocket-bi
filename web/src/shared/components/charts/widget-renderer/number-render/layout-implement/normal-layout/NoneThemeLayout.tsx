import { KPILayout } from '../KPILayout';
import NumberWidget from '@chart/number-widget/NumberWidget';
import './NormalLayout.scss';
import '@/shared/components/charts/widget-renderer/number-render/KPIRenderer.scss';
import { DateUtils, StringUtils } from '@/utils';
import TableHeader from '@/shared/components/charts/table/TableHeader.vue';
import { ComparisonUtils } from '@core/utils';
import PercentageBar from '@chart/widget-renderer/number-render/PercentageBar.vue';
import ChartHolder from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder.vue';
import { MainDateMode } from '@core/common/domain';
import DateRangeDropdown from '@/shared/components/common/DateRangeDropdown.vue';

export class NoneThemeLayout extends KPILayout {
  canRender(widget: NumberWidget): boolean {
    return StringUtils.isEmpty(widget.setting.options.theme ?? '');
  }

  render(widget: NumberWidget, h: any): any {
    if (widget.canRenderTrendLine) {
      return this.renderTrendLineKPI(widget, h);
    }
    if (ComparisonUtils.isDataRangeOn(widget.setting.options) || ComparisonUtils.isComparisonOn(widget.setting.options)) {
      return this.renderComparisonNumberRenderer(widget, h);
    }
    return this.renderDefault(widget, h);
  }

  private renderDefault(widget: NumberWidget, h: any) {
    return (
      <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="number-widget-container" style={widget.numberWidgetStyle}>
        <div class="default-number-widget">
          <TableHeader {...{ props: widget.headerProps }} />
          <div id={`value-${widget.id}`} class="display-value" style={widget.valueBarStyle} oncontextmenu={widget.handleShowContextMenu}>
            <span style={widget.prefixStyle}>{widget.prefix}</span>
            <span style={widget.valueStyle}>{widget.formattedValue}</span>
            <span style={widget.postfixStyle}>{widget.postfix} </span>
          </div>

          <b-tooltip popover-style={{ background: '#ffffff' }} {...{ props: widget.tooltipConfig }} target={`value-${widget.id}`} custom-class="number-tooltip">
            <div style={widget.tooltipStyle}>{widget.tooltipValue}</div>
          </b-tooltip>
        </div>
      </div>
    );
  }

  private renderTrendLineKPI(widget: NumberWidget, h: any) {
    return (
      <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="number-widget-container" style={widget.numberWidgetStyle}>
        <div class="kpi-number-widget">
          <div class="kpi-number-widget--header">
            <div class="kpi--header">
              <div class="kpi--header-info">
                <TableHeader {...{ props: widget.headerProps }} />
                <div id={`value-${widget.id}`} class="display-value" style={widget.valueBarStyle} oncontextmenu={widget.handleShowContextMenu}>
                  <span style={widget.prefixStyle}>{widget.prefix}</span>
                  <span style={widget.valueStyle}>{widget.formattedValue}</span>
                  <span style={widget.postfixStyle}>{widget.postfix} </span>
                </div>
              </div>
              <div class="kpi--header-comparison">
                {this.renderComparisonArea(widget, h)}
                {this.renderComparisonTitle(widget, h)}
              </div>
            </div>
          </div>
          <div class="kpi-number-widget--body">{this.renderTrendline(widget, h)}</div>

          <b-tooltip popover-style={{ background: '#ffffff' }} {...{ props: widget.tooltipConfig }} target={`value-${widget.id}`} custom-class="number-tooltip">
            <div style={widget.tooltipStyle}>{widget.tooltipValue}</div>
          </b-tooltip>
        </div>
      </div>
    );
  }

  private renderComparisonNumberRenderer(widget: NumberWidget, h: any) {
    return (
      <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="number-widget-container" style={widget.numberWidgetStyle}>
        <div class="comparison-number-widget">
          <TableHeader {...{ props: widget.headerProps }} />
          {this.renderComparisonTitle(widget, h)}
          <div id={`value-${widget.id}`} class="display-value" style={widget.valueBarStyle} oncontextmenu={widget.handleShowContextMenu}>
            <span style={widget.prefixStyle}>{widget.prefix}</span>
            <span style={widget.valueStyle}>{widget.formattedValue}</span>
            <span style={widget.postfixStyle}>{widget.postfix} </span>
          </div>

          <b-tooltip popover-style={{ background: '#ffffff' }} {...{ props: widget.tooltipConfig }} target={`value-${widget.id}`} custom-class="number-tooltip">
            <div style={widget.tooltipStyle}>{widget.tooltipValue}</div>
          </b-tooltip>
          {this.renderComparisonArea(widget, h)}
        </div>
      </div>
    );
  }

  private renderComparisonArea(widget: NumberWidget, h: any) {
    if (widget.data.compareResponses) {
      return (
        <PercentageBar
          formattedValue={widget.compareValueAsText}
          percentageValue={widget.comparePercentage}
          rawValue={widget.compareValue}
          comparisonDisplayAs={widget.comparisonDisplayAs}
          isShowDownIcon={widget.isDecrease}
          trendIcon={widget.trendIcon}
        />
      );
    }
  }

  private renderTrendline(widget: NumberWidget, h: any) {
    if (widget.canRenderTrendLine) {
      return <ChartHolder ref="trendLineChartHolder" autoRenderChart={true} showEditComponent={false} metaData={widget.trendLineChartInfo} isPreview={true} />;
    } else {
      return <div></div>;
    }
  }

  private renderComparisonTitle(widget: NumberWidget, h: any) {
    if (widget.enableComparisonTitle) {
      const mode: MainDateMode = widget.setting.options.dataRange?.mode ?? MainDateMode.custom;
      const dateRange = ComparisonUtils.getDateRange(mode) ?? widget.setting.options.dataRange?.dateRange ?? DateUtils.getAllTime();

      return (
        <div class="comparison-title">
          <DateRangeDropdown id={`compare-${widget.id}`} dateRange={dateRange} dateMode={mode} onDateChanged={widget.onDateRangeChanged} />
        </div>
      );
    }
  }
}
