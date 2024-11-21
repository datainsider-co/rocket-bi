import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import {
  ChartControl,
  FlattenPivotTableQuerySetting,
  PivotTableQuerySetting,
  TransformQuery,
  ValueController,
  ValueControlType,
  WidgetId,
  Zoomable,
  MainDateFilter
} from '@core/common/domain/model';
import { ZoomModule } from '@/store/modules/ZoomStore';
import { QueryRelatedWidget } from '@core/common/domain/model/widget/chart/QueryRelatedWidget';
import { DIException } from '@core/common/domain/exception';
import { SortDirection } from '@core/common/domain/request';
import { Sortable } from '@core/common/domain/model/query/features/Sortable';
import { Log } from '@core/utils';

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
  querySettingMap: Map<WidgetId, QuerySetting> = new Map<WidgetId, QuerySetting>();

  /**
   * Key: is widget id
   * Value: Map chứa các giá trị của các widget có Dynamic Values
   */
  allDynamicValuesMap: Map<WidgetId, Map<ValueControlType, string[]>> = new Map();

  /**
   * computed all dynamic values of this widget
   */
  get getDynamicValueAsList(): (id: WidgetId) => string[] {
    return (id: WidgetId) => {
      const dynamicValues = this.allDynamicValuesMap.get(id);
      if (dynamicValues) {
        return Array.from(dynamicValues.values()).flat();
      } else {
        return [];
      }
    };
  }

  get getDynamicValueAsMap(): (id: WidgetId) => Map<ValueControlType, string[]> {
    return (id: WidgetId) => {
      const valueMap = this.allDynamicValuesMap.get(id);
      if (valueMap) {
        return valueMap;
      } else {
        return new Map();
      }
    };
  }

  get getQueryHasFunctionControlMap(): (controlId: WidgetId) => Map<WidgetId, QuerySetting> {
    return (controlId: WidgetId) => {
      const affectedQueryMap = new Map<WidgetId, QuerySetting>();
      this.querySettingMap.forEach((setting, key) => {
        if (setting.canControlFunction(controlId)) {
          affectedQueryMap.set(key, setting);
        }
      });
      return affectedQueryMap;
    };
  }

  /**
   * Build Query setting; the final Query is combined by Zoom and Server Query
   * @param widgetId id of widget
   * @param isFlattenPivot if true, will return flatten pivot instead of pivot table
   */
  get buildQuerySetting(): (id: WidgetId, isFlattenPivot?: boolean) => QuerySetting {
    return (id: WidgetId, isFlattenPivot?: boolean) => {
      const querySetting = this.querySettingMap.get(id);
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

  get getAffectedIdByControlId(): (controlId: WidgetId) => WidgetId[] {
    return (controlId: WidgetId) => {
      const affectedWidgets: WidgetId[] = [];
      this.querySettingMap.forEach((querySetting, widgetId) => {
        if (widgetId !== controlId && querySetting.canApplyValueControl(controlId)) {
          affectedWidgets.push(widgetId);
        }
      });
      return affectedWidgets;
    };
  }

  @Action
  public async init(widgets: QueryRelatedWidget[]): Promise<void> {
    this.setQuerySettings(widgets);
    for (const widget of widgets) {
      if (widget && ChartControl.isChartControl(widget)) {
        const controller: ValueController | undefined = widget.getValueController();
        if (controller && controller.isEnableControl()) {
          const defaultValueMap = controller.getDefaultValueAsMap() || new Map();
          this.setDynamicValues({ id: widget.id, valueMap: defaultValueMap });
        }
      }
    }
  }

  /**
   * Load tất cả query setting của ChartInfo vào Store
   */
  @Mutation
  private setQuerySettings(widgets: QueryRelatedWidget[]): void {
    this.querySettingMap.clear();
    const querySettings: [WidgetId, QuerySetting][] = widgets.map(widget => [widget.id, widget.setting]);
    this.querySettingMap = new Map<WidgetId, QuerySetting>([...querySettings]);
  }

  @Mutation
  setDynamicValues(payload: { id: WidgetId; valueMap: Map<ValueControlType, string[]> | undefined }): void {
    const { id, valueMap } = payload;
    if (valueMap && valueMap.size > 0) {
      this.allDynamicValuesMap.set(id, valueMap);
    } else {
      this.allDynamicValuesMap.delete(id);
    }
    this.querySettingMap.forEach((querySetting, widgetId) => {
      Log.debug('QuerySettingStore.setDynamicValues', 'widgetId', widgetId, 'id', id);
      if (id !== widgetId && querySetting.canApplyValueControl(id)) {
        // apply current dynamic values to other query
        const newDynamicValueMap = new Map([[id, this.allDynamicValuesMap.get(id) ?? new Map()]]);
        querySetting.applyDynamicFilters(newDynamicValueMap);
      }
    });
  }

  @Mutation
  setQuerySetting(payload: { id: WidgetId; query: QuerySetting }): void {
    const { id, query } = payload;
    this.querySettingMap.set(id, query);
  }

  @Mutation
  applySort(payload: { id: WidgetId; sortAsMap: Map<string, SortDirection> }): void {
    const { id, sortAsMap } = payload;
    const query = this.querySettingMap.get(id);
    const hasCustomSort = sortAsMap.size > 0;
    if (hasCustomSort && query && Sortable.isSortable(query)) {
      query.applySort(sortAsMap);
    }
  }

  @Mutation
  reset(): void {
    this.querySettingMap.clear();
    this.allDynamicValuesMap.clear();
  }
}

export const QuerySettingModule: QuerySettingStore = getModule(QuerySettingStore);
