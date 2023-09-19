/*
 * @author: tvc12 - Thien Vi
 * @created: 1/19/21, 5:49 PM
 */

import { WidgetRenderer } from '@chart/widget-renderer/WidgetRenderer';
import NumberWidget from '@chart/number-widget/NumberWidget';
import './NumberRenderer.scss';
import { KPILayout } from '@chart/widget-renderer/number-render/layout-implement/KPILayout';
import { NormalLayout } from '@chart/widget-renderer/number-render/layout-implement/normal-layout/NormalLayout';
import { TrendLineLayout } from '@chart/widget-renderer/number-render/layout-implement/trend-line-layout/TrendLineLayout';
import { AreaLayout } from '@chart/widget-renderer/number-render/layout-implement/trend-line-layout/AreaLayout';
import { NoneThemeLayout } from '@chart/widget-renderer/number-render/layout-implement/normal-layout/NoneThemeLayout';

export class NumberRenderer implements WidgetRenderer<NumberWidget> {
  private readonly renderers: KPILayout[] = [
    // new KPILayout9(), new KPILayout6(), new KPILayout8(), new KPILayout7(), new OnlyTitleLayout(),
    new NoneThemeLayout(),
    new AreaLayout(),
    new TrendLineLayout(),
    new NormalLayout()
  ];

  render(widget: NumberWidget, h: any): any {
    const renderer = this.renderers.find(renderer => renderer.canRender(widget)) ?? this.renderers[0];
    return renderer.render(widget, h);
    // <div id={`chart-${widget.id}`} key={`chart-${widget.id}`} class="number-widget-container" style={widget.numberWidgetStyle}>
    //   <div class="default-number-widget">
    //     <TableHeader {...{ props: widget.headerProps }} />
    //     <div id={`value-${widget.id}`} class="display-value" style={widget.valueBarStyle} oncontextmenu={widget.handleShowContextMenu}>
    //       <span style={widget.prefixStyle}>{widget.prefix}</span>
    //       <span style={widget.valueStyle}>{widget.formattedValue}</span>
    //       <span style={widget.postfixStyle}>{widget.postfix} </span>
    //     </div>

    //
    //     <b-tooltip popover-style={{ background: '#ffffff' }} {...{ props: widget.tooltipConfig }} target={`value-${widget.id}`} custom-class="number-tooltip">
    //       <div style={widget.tooltipStyle}>{widget.tooltipValue}</div>
    //     </b-tooltip>
    //   </div>
    // </div>
  }
}
