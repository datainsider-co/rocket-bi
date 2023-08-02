import Highcharts from 'highcharts';
import { Component, Ref, Watch } from 'vue-property-decorator';
import { ChartOption, DrilldownPieChartOption, DrilldownPieQueryChartSetting } from '@core/common/domain/model';
import { DIException } from '@core/common/domain/exception';
import { merge } from 'lodash';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { DrilldownResponse } from '@core/common/domain/response/query/DrilldownResponse';
import { HighchartUtils } from '@/utils';
import { Log } from '@core/utils';

@Component({
  props: PropsBaseChart
})
export default class DrilldownPieChart extends BaseHighChartWidget<DrilldownResponse, DrilldownPieChartOption, DrilldownPieQueryChartSetting> {
  @Ref()
  chart: any;

  constructor() {
    super();
    const manualOptions = {
      chart: {
        type: 'pie'
      },
      subtitle: {
        useHTML: true
      }
    };
    this.updateOptions(manualOptions);
  }

  @Watch('setting')
  onChartSettingChanged() {
    this.reRenderChart();
  }

  @Watch('data')
  onChartDataChanged() {
    this.reRenderChart();
  }

  @Watch('textColor')
  onTextColorChanged() {
    this.updateTextColor(this.textColor, true);
  }

  mounted() {
    this.reRenderChart();
  }

  toDrilldown(chartData: DrilldownResponse): any {
    const colorSetting = {
      activeDataLabelStyle: {
        color: this.textColor || 'var(--text-color)'
      }
    };
    return merge(
      {},
      {
        series: chartData.drilldown
      },
      ChartOption.DRILL_DOWN_CONFIG,
      colorSetting
    );
  }

  updateOptions(newOptions: any) {
    this.options = merge({}, ChartOption.CONFIG, DrilldownPieChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  isHorizontalZoomIn(): boolean {
    return false;
  }

  isHorizontalZoomOut(): boolean {
    return false;
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart?.getChart();
  }

  protected buildHighchart() {
    try {
      HighchartUtils.reset(this.getChart());
      this.load(this.data);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.updateChartInfo();
      HighchartUtils.drawChart(this.getChart());
      this.assignDrilldownClick();
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`HighchartsDrilldownPieChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(chartData: DrilldownResponse) {
    const series = [
      {
        name: '',
        colorByPoint: true,
        data: chartData.series
      }
    ];
    HighchartUtils.addSeries(this.getChart(), series);
    const drillDown = this.toDrilldown(chartData);
    HighchartUtils.updateChart(this.getChart(), { drilldown: drillDown });
  }

  protected resizeHighchart(): void {
    this.getChart()?.reflow();
  }

  private updateTextColor(color: string | undefined, reDraw: boolean): void {
    if (color) {
      const newStyle = {
        color: color
      };
      const newColorOption = {
        legend: {
          itemStyle: newStyle
        },
        plotOptions: {
          pie: {
            dataLabels: {
              color: color
            }
          }
        }
      };
      HighchartUtils.updateChart(this.getChart(), newColorOption, reDraw);
    }
  }
}
