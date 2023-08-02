import { getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { DateFunctionTypes, Stores, ZoomData, ZoomLevelNode } from '@/shared';
import { ChartInfo, QueryRelatedWidget, ScalarFunctionType, WidgetId, Zoomable } from '@core/common/domain/model';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { Log } from '@core/utils';

export interface ZoomState {
  zoomLevels: ZoomLevelNode[][];
  zoomLevelsAsMap: Map<string, number>;
  zoomDataAsMap: Map<WidgetId, ZoomData>;
}

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.ZoomStore })
export class ZoomStore extends VuexModule {
  zoomNodes: ZoomState['zoomLevels'] = [];
  zoomLevelsAsMap: ZoomState['zoomLevelsAsMap'] = new Map<string, number>();
  zoomDataAsMap: ZoomState['zoomDataAsMap'] = new Map<WidgetId, ZoomData>();

  @Mutation
  initMultiZoomData(widgets: QueryRelatedWidget[]) {
    widgets.forEach(widget => {
      const isEnableZoom: boolean = widget.setting.getChartOption()?.isEnableZoom() ?? false;
      if (isEnableZoom && Zoomable.isZoomable(widget.setting)) {
        this.zoomDataAsMap.set(widget.id, widget.setting.zoomData);
      }
    });
  }

  @Mutation
  registerZoomData(widget: QueryRelatedWidget) {
    const isEnableZoom: boolean = widget.setting.getChartOption()?.isEnableZoom() ?? false;
    if (isEnableZoom && Zoomable.isZoomable(widget.setting)) {
      this.zoomDataAsMap.set(widget.id, widget.setting.zoomData);
    }
  }

  @Mutation
  registerZoomDataById(payload: { id: WidgetId; query: QuerySetting }) {
    const isEnableZoom: boolean = payload.query.getChartOption()?.isEnableZoom() ?? false;
    if (isEnableZoom && Zoomable.isZoomable(payload.query)) {
      this.zoomDataAsMap.set(payload.id, payload.query.zoomData);
    }
  }

  @Mutation
  deleteZoomData(id: WidgetId) {
    this.zoomDataAsMap.delete(id);
  }

  @Mutation
  initZoomLevels(widgets: QueryRelatedWidget[]) {
    const zoomNodes = [
      [
        new ZoomLevelNode(ScalarFunctionType.ToYear, DateFunctionTypes.year),
        new ZoomLevelNode(ScalarFunctionType.ToQuarter, DateFunctionTypes.quarterOfYear),
        new ZoomLevelNode(ScalarFunctionType.ToMonth, DateFunctionTypes.monthOfYear),
        new ZoomLevelNode(ScalarFunctionType.ToWeek, DateFunctionTypes.weekOfYear),
        new ZoomLevelNode(ScalarFunctionType.ToDayOfYear, DateFunctionTypes.dayOfYear),
        new ZoomLevelNode(ScalarFunctionType.ToDayOfMonth, DateFunctionTypes.dayOfMonth),
        new ZoomLevelNode(ScalarFunctionType.ToDayOfWeek, DateFunctionTypes.dayOfWeek),
        new ZoomLevelNode(ScalarFunctionType.ToHour, DateFunctionTypes.hourOfDay),
        new ZoomLevelNode(ScalarFunctionType.ToMinute, DateFunctionTypes.minuteOfHour),
        new ZoomLevelNode(ScalarFunctionType.ToSecond, DateFunctionTypes.secondOfMinute),

        new ZoomLevelNode(ScalarFunctionType.ToYearNum, DateFunctionTypes.yearlyOf),
        new ZoomLevelNode(ScalarFunctionType.ToQuarterNum, DateFunctionTypes.quarterOf),
        new ZoomLevelNode(ScalarFunctionType.ToMonthNum, DateFunctionTypes.monthOf),
        new ZoomLevelNode(ScalarFunctionType.ToWeekNum, DateFunctionTypes.weekOf),
        new ZoomLevelNode(ScalarFunctionType.ToDayNum, DateFunctionTypes.dayOf),
        new ZoomLevelNode(ScalarFunctionType.ToHourNum, DateFunctionTypes.hourOf),
        new ZoomLevelNode(ScalarFunctionType.ToMinuteNum, DateFunctionTypes.minuteOf),
        new ZoomLevelNode(ScalarFunctionType.ToSecondNum, DateFunctionTypes.secondOf),

        new ZoomLevelNode(ScalarFunctionType.DateTimeToSeconds, DateFunctionTypes.second),
        new ZoomLevelNode(ScalarFunctionType.DateTimeToMillis, DateFunctionTypes.millisecond),
        new ZoomLevelNode(ScalarFunctionType.DateTimeToNanos, DateFunctionTypes.nanosecond)
      ]
    ];
    this.zoomNodes = Array.from(zoomNodes);
    this.zoomLevelsAsMap.clear();
    this.zoomNodes.forEach((hierarchy, index) => {
      hierarchy.forEach(item => {
        this.zoomLevelsAsMap.set(item.level, index);
      });
    });
  }

  @Mutation
  zoomChart(payload: { chart: ChartInfo; nextLvl: string }): void {
    const { chart, nextLvl } = payload;
    const currentZoom: ZoomData | undefined = this.zoomDataAsMap.get(chart?.id);
    if (currentZoom && Zoomable.isZoomable(chart.setting)) {
      const zoomData = chart.setting.buildNewZoomData(currentZoom, nextLvl);
      currentZoom.setHorizontalLevel(zoomData.currentHorizontalLevel ?? '');
    }
    Log.debug('zoomChart', this.zoomDataAsMap.get(chart?.id));
  }

  @Mutation
  reset() {
    this.zoomNodes = [];
    this.zoomLevelsAsMap.clear();
    this.zoomDataAsMap.clear();
  }

  get zoomLevelData(): { levels: string[][]; levelsAsMap: Map<string, number> } {
    return {
      levels: this.zoomNodes.map(node => node.map(item => item.level)),
      levelsAsMap: this.zoomLevelsAsMap
    };
  }

  get canZoom(): (id: WidgetId) => boolean {
    return (id: WidgetId) => {
      Log.debug('canZoom', id, this.zoomDataAsMap);
      return !!this.zoomDataAsMap.get(id)?.currentHorizontalLevel;
    };
  }
}

export const ZoomModule: ZoomStore = getModule(ZoomStore);

export function getZoomNode(level: string): ZoomLevelNode[] {
  const nodeIndex: number = ZoomModule.zoomLevelsAsMap.get(level) ?? -1;
  return nodeIndex == -1 ? [] : ZoomModule.zoomNodes[nodeIndex];
}
