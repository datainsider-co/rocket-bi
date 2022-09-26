import { Condition, Field, FieldRelatedCondition, FieldRelatedFunction, Function, Widget, Widgets } from '@core/domain/Model';
import { ListUtils } from '@/utils';
import { QueryRelatedWidget } from '@core/domain/Model/Widget/Chart/QueryRelatedWidget';

export abstract class WidgetUtils {
  static isChart(widget: Widget): boolean {
    return widget.className === Widgets.Chart;
  }

  static getMainDatabase(widgets: QueryRelatedWidget[]): string | null {
    const databaseNames = this.getDatabaseNamesFromQueryRelatedWidget(widgets);
    if (ListUtils.isEmpty(databaseNames)) {
      return null;
    } else {
      const counter: { [key: string]: number } = databaseNames.reduce((counter: any, dbName: string) => {
        counter[dbName] = 1 + (counter[dbName] ?? 0);
        return counter;
      }, {});
      const maybeDatabaseName = Object.entries(counter)
        .sort(([key1, value1], [key2, value2]) => (value1 > value2 ? 1 : -1))
        .pop();
      if (maybeDatabaseName) {
        return maybeDatabaseName[0];
      } else {
        return null;
      }
    }
  }
  static getMainTables(widgets: QueryRelatedWidget[], dbName: string): string[] {
    return this.getFieldsFromQueryWidgets(widgets)
      .filter(field => field.dbName === dbName)
      .map(field => field.tblName);
  }

  static getDatabaseNamesFromQueryRelatedWidget(widgets: QueryRelatedWidget[]): string[] {
    return this.getFieldsFromQueryWidgets(widgets).map((field: Field) => field.dbName);
  }

  static getFieldsFromQueryWidgets(widgets: QueryRelatedWidget[]): Field[] {
    return widgets.map(widget => this.getFieldsFromQueryRelated(widget)).flat();
  }

  static getFieldsFromQueryRelated(widget: QueryRelatedWidget): Field[] {
    const functions: Function[] = widget.setting.getAllFunction() ?? [];
    const conditions: Condition[] = widget.setting.filters ?? [];
    return [...this.getFieldsFromFunctions(functions), ...this.getFieldsFromConditions(conditions)];
  }

  static getFieldsFromFunctions(functions: Function[]): Field[] {
    return functions.filter((fn): fn is FieldRelatedFunction => fn instanceof FieldRelatedFunction).map(fn => fn.field);
  }

  static getFieldsFromConditions(conditions: Condition[]): Field[] {
    return conditions.filter((fn): fn is FieldRelatedCondition => fn instanceof FieldRelatedCondition).map(fn => fn.field);
  }
}
