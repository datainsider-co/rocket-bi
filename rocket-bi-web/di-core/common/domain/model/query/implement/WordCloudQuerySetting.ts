/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import {
  Condition,
  CrossFilterable,
  Equal,
  FieldRelatedFunction,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingType,
  TableColumn,
  WidgetId,
  WordCloudChartOption,
  Zoomable
} from '@core/common/domain/model';
import { Drilldownable, DrilldownData } from '@core/common/domain/model/query/features/Drilldownable';
import { ZoomData } from '@/shared';
import { ConditionUtils } from '@core/utils';
import { isEqual } from 'lodash';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class WordCloudQuerySetting extends QuerySetting<WordCloudChartOption> implements Zoomable, Drilldownable, CrossFilterable {
  readonly className = QuerySettingType.WordCloud;

  constructor(
    public legend: TableColumn,
    public value: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},

    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  get zoomData(): ZoomData {
    return new ZoomData(this.legend.function);
  }

  static fromObject(obj: WordCloudQuerySetting): WordCloudQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const legend = TableColumn.fromObject(obj.legend);
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new WordCloudQuerySetting(legend, value, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    return [this.legend.function, this.value.function];
  }

  getAllTableColumn(): TableColumn[] {
    return [this.legend, this.value];
  }

  buildQueryDrilldown(drilldownData: DrilldownData): WordCloudQuerySetting {
    const newLegend: TableColumn = this.legend.copyWith({
      name: drilldownData.name,
      fieldRelatedFunction: drilldownData.toField
    });
    const currentConditions: Condition[] = this.filters ?? [];
    const equal: Equal = ConditionUtils.buildEqualCondition(this.legend, drilldownData.value);
    const drilldownConditions: Condition[] = ConditionUtils.buildDrilldownConditions(currentConditions, equal);
    return new WordCloudQuerySetting(newLegend, this.value, drilldownConditions, this.sorts, this.options, this.sqlViews);
  }

  getColumnWillDrilldown(): TableColumn {
    return this.legend;
  }
  buildNewZoomData(data: ZoomData, nextLvl: string): ZoomData {
    return data.createNewHorizontalField(nextLvl);
  }

  setZoomData(data: ZoomData): void {
    if (data.horizontalLevel?.scalarFunction) {
      const newScalarFn = data.horizontalLevel.scalarFunction;
      this.sorts
        .filter(sort => sort.function instanceof FieldRelatedFunction && isEqual(sort.function.field, data.horizontalLevel.field))
        .forEach(sort => (sort.function as FieldRelatedFunction).setScalarFunction(newScalarFn));
      this.value.function.setScalarFunction(newScalarFn);
    }
  }
  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }

  getFilter(): TableColumn {
    return this.legend;
  }

  isEnableCrossFilter(): boolean {
    return true;
  }
}
