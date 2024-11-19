import { MethodProfiler } from '@/shared/profiler/Annotation';
import { VisualizationResponse } from '@core/common/domain/response/query/VisualizationResponse';
import { ChartInfo, ChartOption, Drilldownable, DrilldownData, ThemeColor } from '@core/common/domain/model';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { BaseWidget } from '@/screens/dashboard-detail/components/widget-container/BaseWidget';
import Highcharts, { Point, Series } from 'highcharts';
import { HighchartRenderer } from '@chart/widget-renderer/HighchartRenderer';
import { WidgetRenderer } from '@chart/widget-renderer';
import { get } from 'lodash';
import { HighchartUtils, ListUtils, PopupUtils, TimeoutUtils } from '@/utils';
import { DashboardControllerModule, DrilldownDataStoreModule, QuerySettingModule } from '@/screens/dashboard-detail/stores';
import './BaseChart.scss';
import '@/themes/scss/mixin.scss';
import { ZoomModule } from '@/store/modules/ZoomStore';
import { Log } from '@core/utils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { DefaultProps, PropsDefinition } from 'vue/types/options';
import { Watch } from 'vue-property-decorator';
import Swal from 'sweetalert2';
import { DIException, ExportType } from '@core/common/domain';
import { Di } from '@core/common/modules';
import NProgress from 'nprogress';
import { SummarizeFunction } from '@/shared/components/chat/controller/functions/SummarizeFunction';
import { ForecastFunction } from '@/shared/components/chat/controller/functions/ForecastFunction';

export class MouseEventData<T> {
  constructor(readonly event: MouseEvent, readonly data: T, readonly extraData: any = {}) {}
}

/**
 * TODO: Không được phép sử dụng anotion trong base chart
 * Define props xài chung:
 *  + Define tên biến trong BaseChart
 *  + Define Prop trong BaseChartWidget
 * Define Prop xài riêng:
 *  + Define như bình thường trong widget muốn sử dụng
 */

export abstract class BaseChartWidget<Response extends VisualizationResponse, Setting extends ChartOption, Query extends QuerySetting> extends BaseWidget {
  // props
  id!: string | number;
  data!: Response;
  setting!: Setting;
  query!: Query;
  title!: string;
  subTitle!: string;
  backgroundColor?: string;
  textColor?: string;
  isPreview!: boolean;
  chartInfo!: ChartInfo;
  currentQuery!: Query;
  $alert!: typeof Swal;
  showEditComponent!: boolean;

  get colorStyle() {
    return {
      '--background-color': this.backgroundColor
    };
  }

  // fixme: function is not correct
  get chartClass(): string {
    return `h-100 w-100 m-0 p-0 highcharts-container ${this.setting.className}`;
    //todo: check to remove
    // return 'h-100 w-100 m-0 p-0 secondary-chart-background-color highcharts-container';
  }
}

export abstract class BaseHighChartWidget<
  Response extends VisualizationResponse,
  Setting extends ChartOption,
  Query extends QuerySetting
> extends BaseChartWidget<Response, Setting, Query> {
  readonly highcharts = Highcharts;
  options!: any;
  protected renderer: WidgetRenderer<BaseWidget> = new HighchartRenderer();
  private processId: null | number = null;

  protected get themeColors(): string[] {
    return _ThemeStore.paletteColors;
  }

  resize(): void {
    this.resizeHighchart();
  }

  abstract getChart(): Highcharts.Chart | undefined;

  protected abstract buildHighchart(): void;

  protected abstract resizeHighchart(): void;

  @MethodProfiler({ name: 'reRenderChart' })
  protected reRenderChart() {
    // avoid duplicate render
    this.processId = TimeoutUtils.waitAndExec(
      this.processId,
      () => {
        Log.debug('buildHighChart::', this.id);
        this.$nextTick(() => {
          this.buildHighchart();
        });
      },
      50
    );
  }

  @Watch('themeColors')
  protected onThemeColorsChanged(newColors: string[]): void {
    const enableChangeColorByTheme = this.setting.options.themeColor?.enabled ?? true;
    if (enableChangeColorByTheme) {
      HighchartUtils.updateColors(this.getChart(), newColors, true);
    }
  }

  @Watch('setting.options.themeColor', { deep: true })
  protected onColorConfigChanged(newConfig: ThemeColor) {
    const enableChangeColorByTheme = newConfig?.enabled ?? true;
    if (enableChangeColorByTheme) {
      HighchartUtils.updateColors(this.getChart(), this.themeColors);
    } else {
      HighchartUtils.updateColors(this.getChart(), newConfig.colors ?? []);
    }
  }

  @Watch('title')
  protected onTitleChanged() {
    this.updateChartInfo();
  }

  @Watch('subTitle')
  protected onSubtitleChanged() {
    this.updateChartInfo();
  }

  protected renderSubtitle(): string {
    const subtitleText = this.setting.options.subtitle?.text
      ? `<div style="${this.setting.options.subtitle?.style}">${this.setting.options.subtitle?.text}</div>`
      : '';
    if (this.id && !this.isPreview) {
      const drilldownPaths: DrilldownData[] = DrilldownDataStoreModule.drilldownPaths(+this.id);
      const drilldownPathsAsHTML = this.buildDrilldownPath(drilldownPaths);
      return `<div class="d-flex flex-column align-items-center"">
                ${subtitleText}
                <div class="drilldown-path">
                  ${drilldownPathsAsHTML}
                </div>
              </div>`;
    }
    return subtitleText;
  }

  protected drilldownToSelected() {
    const drilldownPaths: DrilldownData[] = DrilldownDataStoreModule.drilldownPaths(+this.id);
    if (drilldownPaths.length >= 2) {
      this.drilldown(drilldownPaths, drilldownPaths.length - 2);
    } else {
      this.resetDrilldown();
    }
  }

  private resetDrilldown() {
    const { id, setting } = this.chartInfo;
    if (Drilldownable.isDrilldownable(setting)) {
      DrilldownDataStoreModule.resetDrilldown(+this.id);
      ZoomModule.registerZoomDataById({ id: id, query: this.query });
      QuerySettingModule.setQuerySetting({ id: id, query: this.query });
      DashboardControllerModule.renderChart({ id: this.chartInfo.id });
    }
  }

  protected drilldown(paths: DrilldownData[], index: number) {
    const { id, setting } = this.chartInfo;

    if (index > 0) {
      const path: DrilldownData = paths[index - 1];
      Log.debug('drilldown:', paths, index, path);
      const newPaths = Array.from(paths).slice(0, index - 1);
      Log.debug('drilldown: newPaths', newPaths);
      DrilldownDataStoreModule.updatePaths({ id: id, paths: newPaths });
      DrilldownDataStoreModule.sliceQueries({ id: id, from: 0, to: index - 1 });
      Log.debug('drilldown:: path to build', DrilldownDataStoreModule.drilldownPaths(id));
      const lastedQuery: QuerySetting = ListUtils.getLast(DrilldownDataStoreModule.getQuerySettings(id)) ?? setting;
      if (Drilldownable.isDrilldownable(lastedQuery)) {
        const newQuery: QuerySetting = lastedQuery.buildQueryDrilldown(path);
        Log.debug('drilldown:: new Query', newQuery);
        DrilldownDataStoreModule.saveDrilldownData({
          id: id,
          newPath: path,
          query: newQuery
        });
        ZoomModule.registerZoomDataById({ id: id, query: newQuery });
        QuerySettingModule.setQuerySetting({ id: id, query: newQuery });
        DashboardControllerModule.renderChart({ id: this.chartInfo.id });
      }
    } else {
      this.resetDrilldown();
    }
  }

  protected assignDrilldownClick() {
    const drilldownPaths: DrilldownData[] = DrilldownDataStoreModule.drilldownPaths(+this.id);
    Log.debug('BaseChart::assignDrilldownClick::drilldownPaths::', drilldownPaths);
    drilldownPaths.forEach((path, index, paths) => {
      document.getElementById(`${this.id}_path_${index}`)?.addEventListener('click', () => this.drilldown(paths, index));
    });
    document.getElementById(`${this.id}-chart`)?.addEventListener('contextmenu', (event: MouseEvent) => this.showContextMenuOnWidget(event));
  }

  protected showContextMenuOnWidget(event: MouseEvent) {
    event.preventDefault();
    this.$root.$emit(DashboardEvents.ShowContextMenuOnWidget, this.chartInfo, event);
  }

  /**
   * assign right click with rude code
   * @param series
   * @param keyGetValue: get value in point
   * @protected
   */
  protected assignRightClick(series: Series[], keyGetValue = 'name') {
    try {
      // use arrow function for keep context of this
      HighchartUtils.addSeriesEvent(series, 'contextmenu', (event, point) => this.showContextMenuOnPointData(event, point, keyGetValue));
    } catch (ex) {
      Log.error('assignRightClick::ex', ex);
    }
  }

  /**
   * Create right click as highchart if chart is supported
   * @param keyGetValue get value from point
   * @protected
   */
  protected createRightClickAsOptions(keyGetValue = 'category'): Highcharts.PlotSeriesOptions {
    // don't remove arrow function cause keep this context in vue
    const showContextMenuOnPoint = (event: MouseEvent, point: Point) => this.showContextMenuOnPointData(event, point, keyGetValue);
    return {
      // allowPointSelect: true,
      cursor: 'pointer',
      point: {
        events: {
          contextmenu: function(event: MouseEvent) {
            showContextMenuOnPoint(event, (this as any) as Point);
          }
        }
      }
    } as any;
  }

  /**
   *
   * @param event
   * @param point: current point in chart
   * @param keyValue: key get value from point
   * @protected
   */
  protected showContextMenuOnPointData(event: MouseEvent, point: Point, keyValue: string) {
    // prevent show default context menu
    event.preventDefault();
    // prevent show context menu on widget
    event.stopPropagation();
    Log.debug('BaseChart::showContextMenu::at', event.clientX, event.clientY, get(point, keyValue, ''));
    const mouseEventDataAString = new MouseEventData<string>(event, get(point, keyValue, ''), { point: point });
    this.$root.$emit(DashboardEvents.ClickDataPoint, this.id, mouseEventDataAString);
  }

  protected updateChartInfo() {
    HighchartUtils.updateChartInfo(this.getChart(), { title: this.title, subTitle: this.renderSubtitle() });
  }

  private buildDrilldownPath(paths: DrilldownData[]) {
    Log.debug('BaseChart::buildDrilldownPath::paths::', paths);
    let drilldownPathsAsHTML = '';
    if (ListUtils.isNotEmpty(paths)) {
      drilldownPathsAsHTML += '<i class="di-icon-drilldown ic-16 mr-2" ></i>';
      paths.forEach((path, index, paths) => {
        const isSelected = index === paths.length - 1;
        if (isSelected) {
          drilldownPathsAsHTML += `
              <div id="${this.id}_path_${index}" class="path"> ${path.value}</div>
              <img class="icon-breadcrumb" src="${require('@/assets/icon/ic-16-arrow-right.svg')}" alt="" />
              <div class="path-selected">${path.name}</div>`;
        } else {
          drilldownPathsAsHTML += `
              <div id="${this.id}_path_${index}" class="path"> ${path.value}</div>
              <img class="icon-breadcrumb" src="${require('@/assets/icon/ic-16-arrow-right.svg')}" alt="">`;
        }
      });
    }
    return drilldownPathsAsHTML;
  }

  async export(type: ExportType): Promise<void> {
    await DashboardControllerModule.handleExport({ widgetId: this.id as number, type: type });
  }

  async copyToAssistant(): Promise<void> {
    try {
      const type = ExportType.CSV;
      const widgetData = await DashboardControllerModule.getWidgetData({ widgetId: this.id as number, type: type });
      Log.debug('copyToAssistant::', widgetData);
      this.$root.$emit(DashboardEvents.ParseToAssistant, widgetData);
    } catch (e) {
      Log.error(e);
    }
  }

  async foreCast(): Promise<void> {
    try {
      this.showLoading();
      const forecastData = (await Di.get(ForecastFunction).execute(this.getForecastPayload())) as Response;
      Log.debug(`foreCast::`, forecastData);
      this.displayForecastData(forecastData);
    } catch (e) {
      Log.error(e);
      PopupUtils.showError(DIException.fromObject(e).getPrettyMessage());
    } finally {
      this.hideLoading();
    }
  }

  async summarize() {
    try {
      this.showLoading();
      const content = await Di.get(SummarizeFunction).execute(this.getForecastPayload());
      this.$root.$emit(DashboardEvents.ShowEditDescriptionModal, this.id, content);
      Log.debug('summarize::', content);
    } catch (ex) {
      Log.error(ex);
      const exception = DIException.fromObject(ex);
      PopupUtils.showError(exception.getPrettyMessage());
    } finally {
      this.hideLoading();
    }
  }

  protected displayForecastData(data: Response): void {
    //Nothing to do
  }

  private getForecastPayload() {
    return {
      type: this.chartInfo.extraData?.currentChartType ?? '',
      response: this.data,
      format: VisualizationResponse.empty(this.data.className)
    };
  }

  protected showLoading() {
    NProgress.configure({ parent: `.di-widget-container--body[widget-id="${this.id}"]` }).start();
  }

  protected hideLoading() {
    NProgress.configure({ parent: `.di-widget-container--body[widget-id="${this.id}"]` }).done();
  }
}

export const PropsBaseChart: PropsDefinition<DefaultProps> = {
  id: { default: -1 },
  subTitle: { type: String, default: '' },
  currentQuery: { required: true, type: Object },
  title: { type: String, default: '' },
  textColor: {},
  backgroundColor: {},
  data: { required: true, type: Object },
  setting: { required: true, type: Object },
  isPreview: { type: Boolean, default: false },
  query: { required: true },
  chartInfo: { type: Object, required: true }
};
