/*
 * @author: tvc12 - Thien Vi
 * @created: 1/8/21, 4:50 PM
 */

import { Component, Ref, Watch } from 'vue-property-decorator';
import { BaseHighChartWidget, PropsBaseChart } from '@chart/BaseChart';
import { ClassProfiler } from '@/shared/profiler/annotation';
import { MapItem, MapResponse } from '@core/domain/Response';
import { ChartOption, MapChartChartOption, MapQuerySetting } from '@core/domain/Model';
import { DIException } from '@core/domain/Exception';
import Highcharts from 'highcharts/highmaps';
import mapInit from 'highcharts/modules/map';
import { cloneDeep, merge } from 'lodash';
import { HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import { RenderController } from '@chart/custom/RenderController';
import { DI } from '@core/modules';
import { PageRenderService } from '@chart/custom/PageRenderService';
import { RenderProcessService } from '@chart/custom/RenderProcessService';
import { Log } from '@core/utils';
import { DebounceAction } from '@/shared/anotation/DebounceAction';
import { Series, TooltipFormatterContextObject } from 'highcharts';
import { DashboardEvents } from '@/screens/DashboardDetail/enums/DashboardEvents';
import { NumberFormatter, RangeData } from '@core/services';
import { CrossFilterData } from '@/screens/DashboardDetail/stores';
import { GeolocationModule } from '@/store/modules/data_builder/geolocation.store';

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
  protected renderController: RenderController<MapResponse>;
  private numberFormatter: NumberFormatter;

  constructor() {
    super();
    const selectSeriesItem = this.handleSelectSeriesItem;
    const tooltipFormatter = this.tooltipFormatter;
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
          }
        }
      }
    };
    this.numberFormatter = this.buildFormatterByMetricNumber(
      this.setting.options?.plotOptions?.series?.dataLabels?.displayUnit ?? MetricNumberMode.Default,
      this.setting.options.precision ?? 2
    );
    this.updateOptions(manualOptions);
    this.renderController = this.createRenderController();
  }

  resize(): void {
    this.getChart()?.reflow();
  }

  @Watch('setting')
  onChartSettingChanged() {
    this.handleSwitchRenderer();
    this.$nextTick(() => {
      if (this.isCustomDisplay()) {
        this.buildCustomChart();
      } else {
        this.buildHighchart();
      }
    });
  }

  @Watch('data')
  onChartDataChanged() {
    if (this.isCustomDisplay()) {
      this.buildCustomChart();
    } else {
      this.buildHighchart();
    }
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

  beforeDestroy() {
    this.renderController.dispose();
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

  @DebounceAction({ timeDebounce: 100 })
  protected buildHighchart() {
    try {
      HighchartUtils.reset(this.getChart());
      this.getChart()?.zoomOut();
      const code = this.currentQuery.geoArea?.mapUrl ?? this.query.geoArea?.mapUrl ?? this.setting.options.geoArea;
      const mapModule = GeolocationModule.getMapData(code) ?? HighchartUtils.initMapData(code);
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

  private createRenderController(): RenderController<MapResponse> {
    const pageRenderService = DI.get(PageRenderService);
    const processRenderService = DI.get(RenderProcessService);
    return new RenderController(pageRenderService, processRenderService);
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

  private buildFormatterByMetricNumber(metricNumber: MetricNumberMode, precision: number) {
    const metricNumbers = HighchartUtils.toMetricNumbers(metricNumber);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision);
  }
}
