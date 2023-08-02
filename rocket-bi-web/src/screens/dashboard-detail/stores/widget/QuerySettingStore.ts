import { getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { FlattenPivotTableQuerySetting, PivotTableQuerySetting, TransformQuery, WidgetId, Zoomable } from '@core/common/domain/model';
import { ZoomModule } from '@/store/modules/ZoomStore';
import { QueryRelatedWidget } from '@core/common/domain/model/widget/chart/QueryRelatedWidget';
import { DIException } from '@core/common/domain/exception';
import { SortDirection } from '@core/common/domain/request';
import { Sortable } from '@core/common/domain/model/query/features/Sortable';

const toFlattenPivotIfPossible = (querySetting: QuerySetting): QuerySetting => {
  if (PivotTableQuerySetting.isPivotChartSetting(querySetting)) {
    return FlattenPivotTableQuerySetting.fromObject(querySetting as any);
  } else {
    return querySetting;
  }
};

/**
 * Store chứa tất cả các query của Widget trong một Dashboard
 */
@Module({ dynamic: true, namespaced: true, store: store, name: Stores.QuerySettingStore })
export class QuerySettingStore extends VuexModule {
  querySettingAsMap: Map<WidgetId, QuerySetting> = new Map<WidgetId, QuerySetting>();
  /**
   * Build Query setting; the final Query is combined by Zoom and Server Query
   * @param widgetId id of widget
   * @param isFlattenPivot if true, will return flatten pivot instead of pivot table
   */
  get buildQuerySetting(): (id: WidgetId, isFlattenPivot?: boolean) => QuerySetting {
    return (id: WidgetId, isFlattenPivot?: boolean) => {
      const querySetting = this.querySettingAsMap.get(id);
      if (querySetting) {
        const zoomData = ZoomModule.zoomDataAsMap.get(id);
        if (Zoomable.isZoomable(querySetting) && zoomData) {
          querySetting.setZoomData(zoomData);
        }
        if (isFlattenPivot) {
          return toFlattenPivotIfPossible(querySetting);
        } else if (PivotTableQuerySetting.isPivotChartSetting(querySetting)) {
          return querySetting.getCurrentQuery();
        } else if (TransformQuery.isTransformQuery(querySetting)) {
          return querySetting.transform();
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
