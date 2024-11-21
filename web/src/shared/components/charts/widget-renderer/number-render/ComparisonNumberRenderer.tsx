/*
 * @author: tvc12 - Thien Vi
 * @created: 1/19/21, 5:49 PM
 */

import { WidgetRenderer } from '@chart/widget-renderer/WidgetRenderer';
import NumberWidget from '@chart/number-widget/NumberWidget';
import TableHeader from '@chart/table/TableHeader.vue';
import PercentageBar from './PercentageBar.vue';
import './ComparisonNumberRenderer.scss';
import { MainDateMode } from '@core/common/domain';
import { DateUtils } from '@/utils';
import DateRangeDropdown from '@/shared/components/common/DateRangeDropdown.vue';
import { Log } from '@core/utils';

export class ComparisonNumberRenderer implements WidgetRenderer<NumberWidget> {
  render(widget: NumberWidget, h: any): any {
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
    if (widget.data.compareResponses && widget.hasCompareValue) {
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

  private renderComparisonTitle(widget: NumberWidget, h: any) {
    if (widget.enableComparisonTitle) {
      const mode: string = widget.setting.options.dataRange?.mode ?? MainDateMode.last30Days;
      Log.debug('KPI::renderComparisonTitle, ', widget.setting.options.dataRange);
      const dateRange = widget.setting.options.dataRange?.dateRange ?? DateUtils.getLast30Days();
      return (
        <div class="comparison-title">
          <DateRangeDropdown id={`compare-${widget.id}`} dateRange={dateRange} dateMode={mode} onDateChanged={widget.onDateRangeChanged} />
        </div>
      );
    }
  }
}
