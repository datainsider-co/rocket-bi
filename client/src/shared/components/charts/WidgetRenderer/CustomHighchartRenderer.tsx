/*
 * @author: tvc12 - Thien Vi
 * @created: 1/19/21, 8:01 PM
 */

import { WidgetRenderer } from '@chart/WidgetRenderer/WidgetRenderer';
import { BaseHighChartWidget } from '@chart/BaseChart';

export class CustomHighchartRenderer implements WidgetRenderer<BaseHighChartWidget<any, any, any>> {
  render(widget: BaseHighChartWidget<any, any, any>, h: any): any {
    return (
      <div class="h-100 w-100">
        <div class="h-100 w-100" id={widget.containerId}></div>
      </div>
    );
  }
}
