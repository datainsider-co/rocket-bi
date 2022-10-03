/*
 * @author: tvc12 - Thien Vi
 * @created: 1/20/21, 5:26 PM
 */

import { WidgetRenderer } from '@chart/widget-renderer/WidgetRenderer';
import NumberWidget from '@chart/number-widget/NumberWidget';

export class CustomNumberRenderer implements WidgetRenderer<NumberWidget> {
  render(widget: NumberWidget, h: any): any {
    return <div key={widget.containerId} id={widget.containerId} class="number-widget-container" style={widget.numberWidgetStyle}></div>;
  }
}
