/*
 * @author: tvc12 - Thien Vi
 * @created: 1/8/21, 4:50 PM
 */

import { Component, Ref, Watch } from 'vue-property-decorator';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart';
import { ClassProfiler } from '@/shared/profiler/Annotation';
import { MapItem, MapResponse } from '@core/common/domain/response';
import { ChartOption, MapChartChartOption, MapQuerySetting } from '@core/common/domain/model';
import { DIException } from '@core/common/domain/exception';
import Highcharts from 'highcharts/highmaps';
import mapInit from 'highcharts/modules/map';
import { cloneDeep, merge } from 'lodash';
import { HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import { Log } from '@core/utils';
import { DebounceAction } from '@/shared/anotation/DebounceAction';
import { Series, TooltipFormatterContextObject } from 'highcharts';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { NumberFormatter, RangeData } from '@core/common/services';
import { CrossFilterData } from '@/screens/dashboard-detail/stores';
import { GeolocationModule } from '@/store/modules/data-builder/GeolocationStore';

mapInit(Highcharts);

@Component({
  props: PropsBaseChart
})
@ClassProfiler({ prefix: 'MapChart' })
export default class MapChart extends BaseHighChartWidget<MapResponse, MapChartChartOption, MapQuerySetting> {
  @Ref()
  chart: any;
  options: any;
  highcharts = Highcharts;
  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const selectSeriesItem = this.handleSelectSeriesItem;
    const tooltipFormatter = this.tooltipFormatter;
    const dataLabelsFormatter = this.dataLabelsFormatter;
    const manualOptions = {
      chart: {
        spacing: this.getSpacingOfMap()
      },
      mapNavigation: {
        buttonOptions: {
          align: 'left',
          verticalAlign: 'bottom',
          theme: {
            fill: '#00000033',
            'stroke-width': 0.5,
            stroke: 'var(--transparent)',
            r: 0,
            style: {
              color: '#ffffff'
            },
            states: {
              hover: {
                fill: '#00000033'
              },
              select: {
                stroke: 'var(--transparent)',
                fill: '#00000033'
              }
            }
          }
        }
      },
      subtitle: {
        useHTML: true
      },
      tooltip: {
        useHTML: true,
        outside: !this.isPreview,
        formatter: function() {
          return tooltipFormatter((this as any) as Highcharts.TooltipFormatterContextObject);
        }
      },
      plotOptions: {
        series: {
          point: {
            events: {
              click: function() {
                const item: MapItem = MapItem.fromObject((this as any).options);
                selectSeriesItem(item);
              }
            }
          },
          dataLabels: {
            formatter: function() {
              return dataLabelsFormatter((this as any) as Highcharts.PointLabelObject);
            }
          }
        }
      }
    };
    this.numberFormatter = this.buildFormatterByMetricNumber(
      this.setting.options?.plotOptions?.series?.dataLabels?.displayUnit ?? MetricNumberMode.Default,
      this.setting.options.precision ?? 2,
      this.setting.options.decimalPoint,
      this.setting.options.thousandSep
    );

    this.updateOptions(manualOptions);
  }

  resize(): void {
    this.getChart()?.reflow();
  }

  @Watch('setting')
  onChartSettingChanged() {
    this.$nextTick(() => {
      this.buildHighchart();
    });
  }

  @Watch('data')
  onChartDataChanged() {
    this.buildHighchart();
  }

  mounted() {
    this.buildHighchart();
  }

  updateOptions(newOptions: any) {
    this.options = merge({}, ChartOption.CONFIG, MapChartChartOption.DEFAULT_SETTING, this.options, newOptions);
  }

  getChart(): Highcharts.Chart | undefined {
    return this.chart?.getChart();
  }

  handleSelectSeriesItem(mapItem: MapItem) {
    if (this.setting.options.isCrossFilter) {
      const crossFilterData = new CrossFilterData(this.chartInfo.id, mapItem.name, { map: mapItem });
      this.$root.$emit(DashboardEvents.ApplyCrossFilter, crossFilterData);
    }
  }

  @Watch('setting.options.plotOptions.series.dataLabels.displayUnit')
  onNumberMetricChanged(newMetricNumberMode: MetricNumberMode) {
    const newMetricNumber: string[] | undefined = HighchartUtils.toMetricNumbers(newMetricNumberMode);
    const newRanges: RangeData[] | undefined = HighchartUtils.buildRangeData(newMetricNumber);
    this.numberFormatter.setRanges(newRanges);
  }

  @Watch('setting.options.precision')
  onPrecisionChanged(precision: number) {
    this.numberFormatter.precision = precision;
  }

  @Watch('setting.options.decimalPoint')
  onDecimalPointChanged(decimalPoint: string) {
    this.numberFormatter.decimalPoint = decimalPoint;
  }

  @Watch('setting.options.thousandSep')
  onThousandSepChanged(thousandSep: string) {
    this.numberFormatter.thousandSep = thousandSep;
  }

  @DebounceAction({ timeDebounce: 100 })
  protected async buildHighchart() {
    try {
      HighchartUtils.reset(this.getChart());
      this.getChart()?.zoomOut();
      const code = this.currentQuery.geoArea?.mapUrl ?? this.query.geoArea?.mapUrl ?? this.setting.options.geoArea;
      Log.debug('buildHighchart::', code);
      const mapModule = GeolocationModule.getMapData(code) ?? (await HighchartUtils.initMapData(code));
      const series: Series[] = this.load(mapModule);
      HighchartUtils.updateChart(this.getChart(), this.setting.options);
      this.updateChartInfo();
      HighchartUtils.drawChart(this.getChart());
      this.assignRightClick(series, 'options.name');
      this.assignDrilldownClick();
    } catch (e) {
      if (e instanceof DIException) {
        throw e;
      } else {
        Log.error(`SeriesChart:: buildChart:: ${e}`);
        throw new DIException('Error when display chart. Please try again!');
      }
    }
  }

  protected load(map: any) {
    const cloneData = cloneDeep(this.data.data);
    const series = [
      {
        mapData: map,
        data: cloneData,
        name: this.query.value.name,
        joinBy: ['hc-key', 'code']
      }
    ];
    return HighchartUtils.addSeries(this.getChart(), series);
  }

  protected resizeHighchart(): void {
    Log.debug('resizeHighchart in series', this.id);
    this.getChart()?.reflow();
  }
  private getSpacingOfMap(): number[] {
    if (this.isPreview && ListUtils.isNotEmpty(this.data.unknownData)) {
      return [10, 10, 15 + 48, 10];
    }
    return [10, 10, 15, 10];
  }

  private tooltipFormatter(point: TooltipFormatterContextObject) {
    // Log.debug("Map::Tooltip::Point:: ", point);
    const x = point.series.name;
    const name = point.key;
    const value = this.numberFormatter.format(point.point.value ?? 0);
    const color = point.color;
    const textColor = this.setting.options.tooltip?.style?.color ?? '#fff';
    const fontFamily = this.setting.options.tooltip?.style?.fontFamily ?? 'Roboto';
    return `<div style="text-align: left; color: ${textColor}; font-family: ${fontFamily}">
                <span>${x}</span></br>
                <span style="color:${color}; padding-right: 5px;">●</span>${name}: <b>${value}</b>
            </div>`;
  }

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number, decimalPoint?: string, thousandSep?: string) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision, decimalPoint, thousandSep);
  }

  private dataLabelsFormatter(point: Highcharts.PointLabelObject): string {
    const isShow = this.setting.options?.plotOptions?.map?.dataLabels?.enabled;
    if (isShow) {
      const textColor = this.setting.options?.plotOptions?.map?.dataLabels?.style?.color ?? '#fff';
      const fontSize = this.setting.options?.plotOptions?.map?.dataLabels?.style?.fontSize ?? '11px';
      const fontFamily = this.setting.options?.plotOptions?.map?.dataLabels?.style?.fontFamily ?? 'Roboto';
      const formattedData = this.numberFormatter.format(point.point.value ?? 0);
      return `<div style="color: ${textColor}, font-family: ${fontFamily}, font-size: ${fontSize}"> ${formattedData}</div>`;
    } else {
      return '';
    }
  }
}
