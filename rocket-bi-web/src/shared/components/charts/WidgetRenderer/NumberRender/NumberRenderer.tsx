/*
 * @author: tvc12 - Thien Vi
 * @created: 1/19/21, 5:49 PM
 */

import { WidgetRenderer } from '@chart/WidgetRenderer/WidgetRenderer';
import NumberWidget from '@chart/NumberWidget/NumberWidget';
import TableHeader from '@chart/Table/TableHeader.vue';
import './number-renderer.scss';

export class NumberRenderer implements WidgetRenderer<NumberWidget> {
  render(widget: NumberWidget, h: any): any {
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
}
