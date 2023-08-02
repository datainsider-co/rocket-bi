/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:39 AM
 */

import {
  Condition,
  CrossFilterable,
  Equal,
  FieldRelatedFunction,
  Filterable,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingType,
  SeriesChartOption,
  TableColumn,
  VariablepieQuerySetting,
  VizSettingType,
  WidgetId,
  Zoomable
} from '@core/common/domain/model';
import { clone, isEqual } from 'lodash';
import { QuerySetting } from '../QuerySetting';
import { ZoomData } from '@/shared';
import { Drilldownable, DrilldownData } from '@core/common/domain/model/query/features/Drilldownable';
import { ConditionUtils, Log } from '@core/utils';
import { ListUtils } from '@/utils';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class GenericChartQuerySetting extends QuerySetting {
  readonly className = QuerySettingType.GenericChart;

  constructor(
    public columns: TableColumn[],
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  static fromObject(obj: GenericChartQuerySetting): GenericChartQuerySetting {
    switch (obj.options.className) {
      case VizSettingType.VariablepieSetting:
        return VariablepieQuerySetting.fromObject(obj);
      default:
        return this.defaultFromObject(obj);
    }
  }

  private static defaultFromObject(obj: GenericChartQuerySetting): GenericChartQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const column = obj.columns?.map(collumn => TableColumn.fromObject(collumn)) ?? [];
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));
    return new GenericChartQuerySetting(column, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    return this.columns.map(column => column.function);
  }

  getAllTableColumn(): TableColumn[] {
    return this.columns;
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.columns = ConfigDataUtils.replaceDynamicFunctions(this.columns, functions);
  }
}
