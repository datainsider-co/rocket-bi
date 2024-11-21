import { Condition, Field, FieldRelatedCondition, FieldRelatedFunction, Function, Widget, Widgets } from '@core/common/domain/model';
import { ListUtils } from '@/utils';
import { QueryRelatedWidget } from '@core/common/domain/model/widget/chart/QueryRelatedWidget';
import { Log } from '@core/utils/Log';

export abstract class WidgetUtils {
  static isChart(widget: Widget): boolean {
    return widget.className === Widgets.Chart;
  }

  static getMainDatabase(widgets: QueryRelatedWidget[]): string | null {
    try {
      const databaseNames = this.getDatabaseNames(widgets);
      if (ListUtils.isEmpty(databaseNames)) {
        return null;
      } else {
        return this.getTopDatabase(databaseNames) ?? null;
      }
    } catch (ex) {
      Log.error('WidgetUtils.getMainDatabase::error', ex);
      return null;
    }
  }

  private static getTopDatabase(databaseNames: string[]): string | null {
    const counter: { [key: string]: number } = databaseNames.reduce((counter: any, dbName: string) => {
      counter[dbName] = 1 + (counter[dbName] ?? 0);
      return counter;
    }, {});
    const dbNameAndValue = Object.entries(counter)
      .sort(([key1, value1], [key2, value2]) => (value1 > value2 ? 1 : -1))
      .pop();
    if (dbNameAndValue) {
      return dbNameAndValue[0];
    } else {
      return null;
    }
  }

  static getMainTables(widgets: QueryRelatedWidget[], dbName: string): string[] {
    return this.getFields(widgets)
      .filter(field => field.dbName === dbName)
      .map(field => field.tblName);
  }

  static getDatabaseNames(widgets: QueryRelatedWidget[]): string[] {
    return this.getFields(widgets).map((field: Field) => field.dbName);
  }

  static getFields(widgets: QueryRelatedWidget[]): Field[] {
    return widgets.map(widget => this.getFieldsFromWidget(widget)).flat();
  }

  static getFieldsFromWidget(widget: QueryRelatedWidget): Field[] {
    const functions: Function[] = widget.setting.getAllFunction() ?? [];
    const conditions: Condition[] = widget.setting.filters ?? [];
    return [...this.getFieldsFromFunctions(functions), ...this.getFieldsFromConditions(conditions)];
  }

  static getFieldsFromFunctions(functions: Function[]): Field[] {
    return functions.filter((fn): fn is FieldRelatedFunction => FieldRelatedFunction.isFieldRelatedFunction(fn)).map(fn => fn.field);
  }

  static getFieldsFromConditions(conditions: Condition[]): Field[] {
    return conditions.filter((fn): fn is FieldRelatedCondition => FieldRelatedFunction.isFieldRelatedFunction(fn)).map(fn => fn.field);
  }
}
