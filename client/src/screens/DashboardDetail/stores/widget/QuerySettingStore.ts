import { getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { QuerySetting } from '@core/domain/Model/Query/QuerySetting';
import { ChartInfo, PivotTableQuerySetting, WidgetId, Zoomable } from '@core/domain/Model';
import { ZoomModule } from '@/store/modules/zoom.store';
import { QueryRelatedWidget } from '@core/domain/Model/Widget/Chart/QueryRelatedWidget';
import { DIException } from '@core/domain/Exception';
import { SortDirection } from '@core/domain/Request';
import { Sortable } from '@core/domain/Model/Query/Features/Sortable';

/**
 * Store chứa tất cả các query của Widget trong một Dashboard
 */
@Module({ dynamic: true, namespaced: true, store: store, name: Stores.querySettingStore })
export class QuerySettingStore extends VuexModule {
  querySettingAsMap: Map<WidgetId, QuerySetting> = new Map<WidgetId, QuerySetting>();
  /**
   * Build Query setting; the final Query is combined by Zoom and Server Query
   */
  get buildQuerySetting(): (id: WidgetId) => QuerySetting {
    return (id: WidgetId) => {
      const querySetting = this.querySettingAsMap.get(id);
      if (querySetting) {
        const zoomData = ZoomModule.zoomDataAsMap.get(id);
        if (Zoomable.isZoomable(querySetting) && zoomData) {
          querySetting.setZoomData(zoomData);
        }
        if (PivotTableQuerySetting.isPivotChartSetting(querySetting)) {
          return querySetting.getCurrentQuery();
        } else {
          return querySetting;
        }
      } else {
        throw new DIException('Query not found!');
      }
    };
  }

  /**
   * Load tất cả query setting của ChartInfo vào Store
   */
  @Mutation
  saveQuerySetting(widgetInfos: QueryRelatedWidget[]) {
    this.querySettingAsMap.clear();
    const querySettings: [WidgetId, QuerySetting][] = widgetInfos.map(info => [info.id, info.setting]);
    this.querySettingAsMap = new Map<WidgetId, QuerySetting>([...querySettings]);
  }

  @Mutation
  setQuerySetting(payload: { id: WidgetId; query: QuerySetting }) {
    const { id, query } = payload;
    this.querySettingAsMap.set(id, query);
  }

  @Mutation
  applySort(payload: { id: WidgetId; sortAsMap: Map<string, SortDirection> }) {
    const { id, sortAsMap } = payload;
    const query = this.querySettingAsMap.get(id);
    const hasCustomSort = sortAsMap.size > 0;
    if (hasCustomSort && query && Sortable.isSortable(query)) {
      query.applySort(sortAsMap);
    }
  }

  @Mutation
  applyForceRefresh() {
    // this.querySettingAsMap.forEach(query => {
    //   query.useBoost = true;
    // });
  }

  @Mutation
  reset() {
    this.querySettingAsMap.clear();
  }
}

export const QuerySettingModule: QuerySettingStore = getModule(QuerySettingStore);
