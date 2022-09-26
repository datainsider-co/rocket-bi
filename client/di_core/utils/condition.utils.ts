import {
  And,
  Between,
  BetweenAndIncluding,
  Condition,
  ConditionType,
  CurrentDay,
  CurrentMonth,
  CurrentQuarter,
  CurrentWeek,
  CurrentYear,
  DynamicConditionWidget,
  Equal,
  Field,
  FieldRelatedCondition,
  GetArrayElement,
  GreaterThan,
  GreaterThanOrEqual,
  Id,
  In,
  LastNDay,
  LastNMonth,
  LastNQuarter,
  LastNWeek,
  LastNYear,
  LessThan,
  LessThanOrEqual,
  MainDateMode,
  Or,
  TableColumn
} from '@core/domain/Model';
import { ConditionFamilyTypes, ConditionTreeNode, DateRange, SlicerValue } from '@/shared';
import { ConditionData } from '@/shared/interfaces/condition_data.interface';
import { ChartUtils, DateUtils, DateTimeFormatter, ListUtils, SchemaUtils } from '@/utils';
import { Log } from '@core/utils/Log';
import { FunctionDataUtils } from '@core/utils/function.utils';

export abstract class ConditionUtils {
  static getFamilyTypeFromFieldType(fieldType: string): ConditionFamilyTypes | undefined {
    if (ChartUtils.isDateType(fieldType)) {
      return ConditionFamilyTypes.dateHistogram;
    }
    if (ChartUtils.isTextType(fieldType)) {
      return ConditionFamilyTypes.string;
    }
    if (ChartUtils.isNumberType(fieldType)) {
      return ConditionFamilyTypes.number;
    } else {
      return void 0;
    }
  }

  static buildMainDateCondition(field: Field, currentRange: DateRange, mainDateMode: MainDateMode): FieldRelatedCondition | undefined {
    const condition: FieldRelatedCondition | undefined = this.buildMainDateModeCondition(field, currentRange, mainDateMode);
    if (condition) {
      if (SchemaUtils.isNested(field.tblName)) {
        condition.setScalarFunction(new GetArrayElement());
      }
      return condition;
    } else {
      return void 0;
    }
  }

  private static buildMainDateModeCondition(field: Field, currentRange: DateRange, mainDateMode: MainDateMode): FieldRelatedCondition | undefined {
    switch (mainDateMode) {
      case MainDateMode.thisDay:
        return new CurrentDay(field);
      case MainDateMode.thisWeek:
        return new CurrentWeek(field);
      case MainDateMode.thisMonth:
        return new CurrentMonth(field);
      case MainDateMode.thisQuarter:
        return new CurrentQuarter(field);
      case MainDateMode.thisYear:
        return new CurrentYear(field);
      case MainDateMode.lastDay:
        return new LastNDay(field, '1');
      case MainDateMode.lastWeek:
        return new LastNWeek(field, '1');
      case MainDateMode.lastMonth:
        return new LastNMonth(field, '1');
      case MainDateMode.lastQuarter:
        return new LastNQuarter(field, '1');
      case MainDateMode.lastYear:
        return new LastNYear(field, '1');
      case MainDateMode.last7Days:
        return new LastNDay(field, '7');
      case MainDateMode.last30Days:
        return new LastNDay(field, '30');
      case MainDateMode.custom: {
        const rangeFormatted = {
          start: DateTimeFormatter.formatDate(currentRange.start),
          end: DateTimeFormatter.formatDateWithTime(currentRange.end, '23:59:59')
        };
        return new BetweenAndIncluding(field, rangeFormatted.start.toString(), rangeFormatted.end.toString());
      }
      default:
        return void 0;
    }
  }

  static buildDateCondition(field: Field, currentRange: DateRange | null | undefined): FieldRelatedCondition {
    const dateRange = ConditionUtils.formatDateRange(currentRange);
    const condition = new BetweenAndIncluding(field, dateRange.start, dateRange.end);
    if (SchemaUtils.isNested(field.tblName)) {
      condition.setScalarFunction(new GetArrayElement());
    }
    return condition;
  }

  static formatDateRange(currentRange: DateRange | null | undefined): { start: string; end: string } {
    return {
      start: DateTimeFormatter.formatDate(currentRange?.start || DateUtils.DefaultMinDate),
      end: DateTimeFormatter.formatDateWithTime(currentRange?.end || DateUtils.DefaultMaxDate, '23:59:59')
    };
  }

  static buildEqualCondition(column: TableColumn, value: string): Equal {
    return new Equal(column.function.field, value, column.function.scalarFunction);
  }

  static buildInCondition(column: TableColumn, values: string[]): In {
    return new In(column.function.field, values, column.function.scalarFunction);
  }

  static buildBetweenAndIncludingCondition(column: TableColumn, min: number, max: number): BetweenAndIncluding {
    return new BetweenAndIncluding(column.function.field, `${min}`, `${max}`, column.function.scalarFunction);
  }

  /// Build conditions for drilldown
  ///
  /// nếu currentConditions rỗng => And với equal condition
  ///
  /// Nếu currentCondition có 1 item và là And condition => And với toàn bộ conditions trong firstItem và
  /// equal
  ///
  /// Trường hợp còn lại:
  ///
  /// Bọc toàn bộ condition đang có vô OR. Tạo And([Or, equal])
  static buildDrilldownConditions(currentConditions: Condition[], equal: Equal): Condition[] {
    if (ListUtils.isEmpty(currentConditions)) {
      return [new And([equal])];
    } else {
      const firstItem: Condition = currentConditions[0];
      if (ListUtils.hasOnlyOneItem(currentConditions) && firstItem instanceof And) {
        return [new And([...firstItem.conditions, equal])];
      } else {
        return [new And([new Or(currentConditions), equal])];
      }
    }
  }

  static getAllFieldRelatedConditions(conditions: Condition[]): FieldRelatedCondition[] {
    return conditions.flatMap((condition: Condition) => {
      switch (condition.className) {
        case ConditionType.And: {
          const andCondition: And = condition as And;
          return ConditionUtils.getAllFieldRelatedConditions(andCondition.conditions);
        }
        case ConditionType.Or: {
          const orCondition: Or = condition as Or;
          return ConditionUtils.getAllFieldRelatedConditions(orCondition.conditions);
        }
        default:
          return condition as FieldRelatedCondition;
      }
    });
  }

  static cloneListConditionData(listConditionData: ConditionData[]) {
    return listConditionData.map(conditionData => ConditionUtils.cloneConditionData(conditionData));
  }

  private static cloneConditionData(conditionData: ConditionData) {
    return {
      ...conditionData,
      field: Field.fromObject(conditionData.field),
      tabControl: conditionData.tabControl ? FunctionDataUtils.cloneTabControlData(conditionData.tabControl) : void 0
    };
  }

  static buildFromCondition(filterColumn: TableColumn, from: SlicerValue): GreaterThan | GreaterThanOrEqual {
    const { value, equal } = from;
    if (equal) {
      return new GreaterThanOrEqual(filterColumn.function.field, `${value}`, filterColumn.function.scalarFunction);
    } else {
      return new GreaterThan(filterColumn.function.field, `${value}`, filterColumn.function.scalarFunction);
    }
  }

  static buildToCondition(filterColumn: TableColumn, to: SlicerValue): LessThan | LessThanOrEqual {
    const { value, equal } = to;
    if (equal) {
      return new LessThanOrEqual(filterColumn.function.field, `${value}`, filterColumn.function.scalarFunction);
    } else {
      return new LessThan(filterColumn.function.field, `${value}`, filterColumn.function.scalarFunction);
    }
  }
}

export abstract class ConditionDataUtils {
  static toConditionTreeNodes(map: Map<number, ConditionData[]>): ConditionTreeNode[][] {
    const data: ConditionTreeNode[][] = [];
    map.forEach((conditions, groupId) => {
      const dataFlavors: ConditionTreeNode[] = conditions.map(condition => {
        const allValues = condition.allValues ?? [condition.firstValue, condition.secondValue];

        return {
          id: condition.id,
          groupId: condition.groupId,
          firstValue: condition.firstValue,
          secondValue: condition.secondValue,
          filterFamily: condition.familyType,
          filterType: condition.subType,
          filterCondition: ChartUtils.buildNameOfFilter(condition.subType || '', condition.firstValue || '', condition.secondValue || ''),
          isExpanded: true,
          field: condition.field,
          title: condition.columnName || 'Unknown',
          parent: {
            title: condition.tableName || 'Unknown'
          },
          isNested: condition.isNested || false,
          currentInputType: condition.currentInputType,
          currentOptionSelected: condition.currentOptionSelected,
          filterModeSelected: condition.filterModeSelected,
          allValues: allValues.filter(item => item !== ''),
          tabControl: condition?.tabControl
        } as ConditionTreeNode;
      });
      data.push(dataFlavors);
    });
    return data;
  }

  static toFilters(filters: Record<Id, ConditionData[]>): Map<Id, ConditionData[]> {
    const entries: [number, ConditionData[]][] = Object.entries(filters).map(([key, listConditionData], index) => {
      return [parseInt(key), ConditionUtils.cloneListConditionData(listConditionData)];
    });
    return new Map<Id, ConditionData[]>(entries);
  }
}
