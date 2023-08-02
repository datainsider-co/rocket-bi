import { merge } from 'lodash';
import Highcharts from 'highcharts';
import { Component, Prop, Ref, Watch } from 'vue-property-decorator';
import { DIException } from '@core/common/domain/exception';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart.ts';
import { ChartOption, ChartOptionData, DrilldownChartOption, DrilldownQueryChartSetting } from '@core/common/domain/model';
import { DrilldownResponse } from '@core/common/domain/response/query/DrilldownResponse';
import { HighchartUtils, MetricNumberMode } from '@/utils';
import { Log } from '@core/utils';

@Component({
  props: PropsBaseChart
})
export default class DrilldownChart extends BaseHighChartWidget<DrilldownResponse, DrilldownChartOption, DrilldownQueryChartSetting> {
  @Prop({ default: -1 })
  id!: string | number;

  @Ref()
  chart: any;

  constructor() {
    super();
    const manualOption = {
      chart: {
        type: 'column'
      },
      accessibility: {
        announceNewData: {
          enabled: true
        }
      },
      xAxis: {
        type: 'category'
      },
      subtitle: {
        useHTML: true
      },
      tooltip: {
        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
        pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y}</b><br/>'
      }
    };

    this.updateOptions(manualOption);
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
      activeAxisLabelStyle: {
        color: this.textColor || 'var(--text-color)'
      },
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
    this.options = merge({}, ChartOption.CONFIG, DrilldownChartOption.DEFAULT_SETTING, this.options, newOptions);
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
      this.updateMetricNumber(this.setting.options);
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
        Log.error(`HighchartsDrilldownChart:: buildChart:: ${e}`);
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
        xAxis: {
          title: {
            style: newStyle
          },
          labels: {
            style: newStyle
          }
        },
        yAxis: {
          title: {
            style: newStyle
          },
          labels: {
            style: newStyle
          }
        }
      };
      HighchartUtils.updateChart(this.getChart(), newColorOption, reDraw);
    }
  }

  private updateMetricNumber(options: ChartOptionData) {
    const metrixNumber: string[] | undefined = HighchartUtils.toMetricNumbers(options.metricNumbers ?? MetricNumberMode.Default);
    Highcharts.setOptions({
      lang: {
        numericSymbols: metrixNumber
      }
    });
  }
}
