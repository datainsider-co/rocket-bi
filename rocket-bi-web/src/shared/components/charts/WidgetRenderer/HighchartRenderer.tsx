import { WidgetRenderer } from '@chart/WidgetRenderer/WidgetRenderer';
import { BaseHighChartWidget } from '@chart/BaseChart';

export class HighchartRenderer implements WidgetRenderer<BaseHighChartWidget<any, any, any>> {
  render(widget: BaseHighChartWidget<any, any, any>, h: any): any {
    return (
      <vue-highcharts
        key={widget.id}
        id={`${widget.id}-chart`}
        options={widget.options}
        highcharts={widget.highcharts}
        class={widget.chartClass}
        style={widget.colorStyle}
        ref="chart"></vue-highcharts>
    );
  }
}
