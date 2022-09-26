import { MethodProfiler } from '@/shared/profiler/annotation';
import { VisualizationResponse } from '@core/domain/Response/Query/VisualizationResponse';
import { ChartInfo, ChartOption, Drilldownable, DrilldownData, ThemeColor } from '@core/domain/Model';
import { QuerySetting } from '@core/domain/Model/Query/QuerySetting';
import { BaseWidget } from '@/screens/DashboardDetail/components/WidgetContainer/BaseWidget';
import Highcharts, { Point, Series } from 'highcharts';
import { HighchartRenderer } from '@chart/WidgetRenderer/HighchartRenderer';
import { WidgetRenderer } from '@chart/WidgetRenderer';
import { CustomHighchartRenderer } from '@chart/WidgetRenderer/CustomHighchartRenderer';
import { RenderController } from '@chart/custom/RenderController';
import { get } from 'lodash';
import { HighchartUtils, ListUtils, TimeoutUtils } from '@/utils';
import { DashboardControllerModule, DrilldownDataStoreModule, QuerySettingModule } from '@/screens/DashboardDetail/stores';
import './base-chart.scss';
import '@/themes/scss/mixin.scss';
import { ZoomModule } from '@/store/modules/zoom.store';
import { Log } from '@core/utils';
import { DashboardEvents } from '@/screens/DashboardDetail/enums/DashboardEvents';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { DefaultProps, PropsDefinition } from 'vue/types/options';
import { Watch } from 'vue-property-decorator';

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

  get colorStyle() {
    return {
      '--background-color': this.backgroundColor
    };
  }

  // fixme: function is not correct
  get chartClass(): string {
    if (this.backgroundColor) {
      if (this.isPreview) {
        return 'h-100 w-100 m-0 p-0 highcharts-container';
      } else {
        return 'h-100 w-100 m-0 p-0 highcharts-container';
      }
    }
    return 'h-100 w-100 m-0 p-0 secondary-chart-background-color highcharts-container';
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
  protected abstract renderController: RenderController<Response>;
  // protected abstract customRenderController: CustomRenderController<Response>;
  private processId: null | number = null;

  get containerId(): string {
    return this.renderController.containerId;
  }

  protected get themeColors(): string[] {
    return _ThemeStore.paletteColors;
  }

  resize(): void {
    if (this.isCustomDisplay()) {
      this.resizeCustomChart();
    } else {
      this.resizeHighchart();
    }
  }

  abstract getChart(): Highcharts.Chart | undefined;

  protected isCustomDisplay(): boolean {
    return this.setting?.options.isCustomDisplay ?? false;
  }

  protected handleSwitchRenderer() {
    if (this.isCustomDisplay()) {
      if (this.renderer instanceof HighchartRenderer) {
        this.renderer = new CustomHighchartRenderer();
      }
    } else {
      if (this.renderer instanceof CustomHighchartRenderer) {
        this.renderer = new HighchartRenderer();
      }
    }
  }

  protected abstract buildHighchart(): void;

  protected abstract resizeHighchart(): void;

  protected resizeCustomChart(): void {
    this.buildCustomChart();
  }

  protected buildCustomChart(): void {
    this.renderController.processAndRender(
      {
        html: this.setting.options.html ?? '',
        css: this.setting.options.css ?? '',
        js: this.setting.options.js ?? ''
      },
      {
        data: this.data,
        options: this.setting.options
      }
    );
  }

  @MethodProfiler({ name: 'reRenderChart' })
  protected reRenderChart() {
    // avoid duplicate render
    this.processId = TimeoutUtils.waitAndExec(
      this.processId,
      () => {
        Log.debug('buildHighchart::', this.id);
        this.handleSwitchRenderer();
        this.$nextTick(() => {
          if (this.isCustomDisplay()) {
            this.buildCustomChart();
          } else {
            this.buildHighchart();
          }
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
    if (this.isCustomDisplay()) {
      this.buildCustomChart();
    } else {
      this.updateChartInfo();
    }
  }

  @Watch('subTitle')
  protected onSubtitleChanged() {
    if (this.isCustomDisplay()) {
      this.buildCustomChart();
    } else {
      this.updateChartInfo();
    }
  }

  protected renderSubtitle(): string {
    const subtitleText = this.setting.options.subtitle?.text
      ? `<p style="${this.setting.options.subtitle?.style}">${this.setting.options.subtitle?.text}</p>`
      : '';
    if (this.id && !this.isPreview) {
      const drilldownPaths: DrilldownData[] = DrilldownDataStoreModule.drilldownPaths(+this.id);
      const drilldownPathsAsHTML = this.buildDrilldownPath(drilldownPaths);
      return `<div class="d-flex flex-column mb-3 align-items-center"">
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
      DashboardControllerModule.renderChartOrFilter({ widget: this.chartInfo });
    }
  }

  protected drilldown(paths: DrilldownData[], index: number) {
    const { id, setting } = this.chartInfo;
    const path: DrilldownData = paths[index];
    Log.debug('drilldown:', paths, index);
    const newPaths = Array.from(paths).slice(0, index);
    Log.debug('drilldown: newPaths', newPaths);
    DrilldownDataStoreModule.updatePaths({ id: id, paths: newPaths });
    DrilldownDataStoreModule.sliceQueries({ id: id, from: 0, to: index });
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
      DashboardControllerModule.renderChartOrFilter({ widget: this.chartInfo });
    }
  }

  protected assignDrilldownClick() {
    const drilldownPaths: DrilldownData[] = DrilldownDataStoreModule.drilldownPaths(+this.id);
    drilldownPaths.forEach((path, index, paths) => {
      document.getElementById(`${this.id}_path_${index}`)?.addEventListener('click', () => this.drilldown(paths, index));
    });
    document.getElementById(`${this.id}_path_selected`)?.addEventListener('click', () => this.drilldownToSelected());
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
    let drilldownPathsAsHTML = '';
    if (ListUtils.isNotEmpty(paths)) {
      drilldownPathsAsHTML += '<i class="di-icon-drilldown ic-16 mr-2" ></i>';
      paths.forEach((path, index, paths) => {
        const isSelected = index === paths.length - 1;
        if (isSelected) {
          drilldownPathsAsHTML += `
              <div id="${this.id}_path_selected" class="path"> ${path.value}</div>
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

  downloadCSV(): void {
    const chart = this.getChart();
    if (chart) {
      return chart.downloadCSV();
    }
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
