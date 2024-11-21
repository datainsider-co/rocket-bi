/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import {
  Condition,
  CrossFilterable,
  Drilldownable,
  DrilldownData,
  Equal,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingClassName,
  TableColumn,
  ChartOptionClassName,
  WidgetId
} from '@core/common/domain/model';
import { ConditionUtils, JsonUtils } from '@core/utils';
import { GeoArea } from '@core/common/domain/model/geolocation/GeoArea';
import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { cloneDeep } from 'lodash';
import { GeolocationModule } from '@/store/modules/data-builder/GeolocationStore';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class MapQuerySetting extends QuerySetting implements Drilldownable, CrossFilterable {
  readonly className = QuerySettingClassName.Map;

  constructor(
    public location: TableColumn,
    public value: TableColumn,
    public normalizedNameMap: string,
    public geoArea?: GeoArea,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  static fromObject(obj: MapQuerySetting): MapQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const location = TableColumn.fromObject(obj.location);
    const value = TableColumn.fromObject(obj.value);
    const geoArea = obj.geoArea ? GeoArea.fromObject(obj.geoArea) : void 0;
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new MapQuerySetting(location, value, obj.normalizedNameMap, geoArea, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    return [this.location.function, this.value.function];
  }

  getAllTableColumns(): TableColumn[] {
    return [this.location, this.value];
  }

  setNormalizedMap(normalized: Map<string, string>) {
    this.normalizedNameMap = JsonUtils.toJson(normalized, true);
  }

  setGeoArea(geoArea: GeoArea | undefined) {
    this.geoArea = geoArea;
  }

  //TODO: Fix me => change geolocation value to setting instead of Store
  protected assignChartOptionValue(setting: ChartOption) {
    const isMapSetting = setting.className == ChartOptionClassName.MapSetting;
    if (isMapSetting) {
      const normalizedNameMap = cloneDeep(GeolocationModule.locationMatchedAsMap);
      const geoArea = GeolocationModule.areaAsMap.get(setting.options.geoArea ?? '');
      this.setGeoArea(geoArea);
      this.setNormalizedMap(normalizedNameMap);
    }
  }

  static isMapQuery(query: any): query is MapQuerySetting {
    return query?.className === QuerySettingClassName.Map;
  }

  buildQueryDrilldown(drilldownData: DrilldownData): QuerySetting {
    const { name, geoArea, toField, value } = drilldownData;
    const newLocation: TableColumn = this.location.copyWith({
      name: name,
      fieldRelatedFunction: toField
    });
    const currentConditions: Condition[] = this.filters ?? [];
    const equal: Equal = ConditionUtils.buildEqualCondition(this.location, value);
    const drilldownConditions: Condition[] = ConditionUtils.buildDrilldownConditions(currentConditions, equal);
    return new MapQuerySetting(
      newLocation,
      this.value,
      '{}',
      geoArea,
      drilldownConditions,
      this.sorts,
      this.options,

      this.sqlViews
    );
  }

  getColumnWillDrilldown(): TableColumn {
    return this.location;
  }

  applyDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.location = ConfigDataUtils.replaceDynamicFunction(this.location, functions);
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }

  getFilterColumn(): TableColumn {
    return this.value;
  }

  isEnableCrossFilter(): boolean {
    return this.getChartOption()?.options?.isCrossFilter ?? false;
  }
}
