import { GenericChartQuerySetting } from '@core/common/domain/model/query/implement/GenericChartQuerySetting.ts';
import {
  Condition,
  CrossFilterable,
  DIException,
  Drilldownable,
  DrilldownData,
  Equal,
  FieldRelatedFunction,
  getFiltersAndSorts,
  InlineSqlView,
  TableColumn,
  Zoomable
} from '@core/common/domain';
import { ZoomData } from '@/shared';
import { compact, isEqual } from 'lodash';
import { ConditionUtils } from '@core/utils';

export class VariablepieQuerySetting extends GenericChartQuerySetting implements CrossFilterable, Zoomable, Drilldownable {
  getFilter(): TableColumn {
    if (!this.legend) {
      throw new DIException('Query is empty!');
    }
    return this.legend;
  }

  isEnableCrossFilter(): boolean {
    return this.getChartOption()?.options?.isCrossFilter ?? false;
  }

  get legend(): TableColumn | null {
    if (this.columns[0]) {
      return this.columns[0];
    }
    return null;
  }

  get value(): TableColumn | null {
    if (this.columns[1]) {
      return this.columns[1];
    }
    return null;
  }

  get weight(): TableColumn | null {
    if (this.columns[2]) {
      return this.columns[2];
    }
    return null;
  }

  buildNewZoomData(data: ZoomData, nextLvl: string): ZoomData {
    return data.createNewHorizontalField(nextLvl);
  }

  setZoomData(data: ZoomData): void {
    if (!this.legend) {
      throw new DIException('Query is empty');
    }
    if (data.horizontalLevel?.scalarFunction) {
      const newScalarFn = data.horizontalLevel.scalarFunction;
      this.sorts
        .filter(sort => sort.function instanceof FieldRelatedFunction && isEqual(sort.function.field, data.horizontalLevel.field))
        .forEach(sort => (sort.function as FieldRelatedFunction).setScalarFunction(newScalarFn));
      this.legend.function.setScalarFunction(newScalarFn);
    }
  }

  get zoomData(): ZoomData {
    if (!this.legend) {
      throw new DIException('Query is empty');
    }
    return new ZoomData(this.legend.function);
  }

  buildQueryDrilldown(drilldownData: DrilldownData): VariablepieQuerySetting {
    if (!this.legend) {
      throw new DIException('Query is empty');
    }
    const newLegend: TableColumn = this.legend.copyWith({
      name: drilldownData.name,
      fieldRelatedFunction: drilldownData.toField
    });
    const currentConditions: Condition[] = this.filters ?? [];
    const equal: Equal = ConditionUtils.buildEqualCondition(this.legend, drilldownData.value);
    const drilldownConditions: Condition[] = ConditionUtils.buildDrilldownConditions(currentConditions, equal);
    return new VariablepieQuerySetting(compact([newLegend, this.value, this.weight]), drilldownConditions, this.sorts, this.options, this.sqlViews);
  }

  getColumnWillDrilldown(): TableColumn {
    if (!this.legend) {
      throw new DIException('Query is empty');
    }
    return this.legend;
  }

  static fromObject(obj: GenericChartQuerySetting): VariablepieQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const column = obj.columns?.map(collumn => TableColumn.fromObject(collumn)) ?? [];
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));
    return new VariablepieQuerySetting(column, filters, sorts, obj.options, sqlViews, obj.parameters);
  }
}
