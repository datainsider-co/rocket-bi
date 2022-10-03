/*
 * @author: tvc12 - Thien Vi
 * @created: 1/19/21, 5:49 PM
 */

import { WidgetRenderer } from '@chart/widget-renderer/WidgetRenderer';
import NumberWidget from '@chart/number-widget/NumberWidget';
import TableHeader from '@chart/table/TableHeader.vue';
import ChartHolder from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder.vue';
import './KPIRenderer.scss';
import PercentageBar from '@chart/widget-renderer/number-render/PercentageBar.vue';
import DateRangeDropdown from '@/shared/components/common/DateRangeDropdown.vue';
import { MainDateMode } from '@core/common/domain';
import { DateUtils } from '@/utils';
import { ComparisonUtils } from '@core/utils/ComparisonUtils';

export class KPIRenderer implements WidgetRenderer<NumberWidget> {
  render(widget: NumberWidget, h: any): any {
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
