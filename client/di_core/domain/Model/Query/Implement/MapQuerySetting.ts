/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { QuerySetting } from '@core/domain/Model/Query/QuerySetting';
import {
  Condition,
  Drilldownable,
  DrilldownData,
  Equal,
  Filterable,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  MapChartChartOption,
  OrderBy,
  QuerySettingType,
  TableColumn,
  VizSettingType,
  WidgetId
} from '@core/domain/Model';
import { ConditionUtils, JsonUtils, Log } from '@core/utils';
import { GeoArea } from '@core/domain/Model/Geolocation/GeoArea';
import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { cloneDeep } from 'lodash';
import { GeolocationModule } from '@/store/modules/data_builder/geolocation.store';
import { ConfigDataUtils } from '@/screens/ChartBuilder/ConfigBuilder/ConfigPanel/ConfigDataUtils';

export class MapQuerySetting extends QuerySetting<MapChartChartOption> implements Filterable, Drilldownable {
  readonly className = QuerySettingType.Map;

  constructor(
    public location: TableColumn,
    public value: TableColumn,
    public normalizedNameMap: string,
    public geoArea?: GeoArea,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},

    sqlViews: InlineSqlView[] = []
  ) {
    super(filters, sorts, options, sqlViews);
  }

  static fromObject(obj: MapQuerySetting): MapQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const location = TableColumn.fromObject(obj.location);
    const value = TableColumn.fromObject(obj.value);
    const geoArea = obj.geoArea ? GeoArea.fromObject(obj.geoArea) : void 0;
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new MapQuerySetting(location, value, obj.normalizedNameMap, geoArea, filters, sorts, obj.options, sqlViews);
  }

  getAllFunction(): Function[] {
    return [this.location.function, this.value.function];
  }

  getAllTableColumn(): TableColumn[] {
    return [this.location, this.value];
  }

  setNormalizedMap(normalized: Map<string, string>) {
    this.normalizedNameMap = JsonUtils.toJson(normalized, true);
  }

  setGeoArea(geoArea: GeoArea | undefined) {
    this.geoArea = geoArea;
  }

  getFilter(): TableColumn {
    return this.location;
  }
  //TODO: Fix me => change geolocation value to setting instead of Store
  protected setValueBySetting(setting: ChartOption) {
    const isMapSetting = setting.className == VizSettingType.MapSetting;
    if (isMapSetting) {
      const normalizedNameMap = cloneDeep(GeolocationModule.locationMatchedAsMap);
      const geoArea = GeolocationModule.areaAsMap.get(setting.options.geoArea ?? '');
      this.setGeoArea(geoArea);
      this.setNormalizedMap(normalizedNameMap);
    }
  }

  static isMapQuery(query: any): query is MapQuerySetting {
    return query?.className === QuerySettingType.Map;
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

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.location = ConfigDataUtils.replaceDynamicFunction(this.location, functions);
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }
}
