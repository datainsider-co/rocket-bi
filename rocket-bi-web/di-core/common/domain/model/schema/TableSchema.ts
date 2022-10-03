import {
  ChartInfo,
  Column,
  Condition,
  Field,
  FieldRelatedCondition,
  FilterMode,
  Id,
  NestedCondition,
  QuerySetting,
  TableChartOption,
  WidgetCommonData
} from '@core/common/domain/model';
import { DisplayName, FieldName } from '@core/schema/service/ExpressionParser';
import { ChartUtils, ListUtils, RandomUtils, SchemaUtils } from '@/utils';
import { DIException, SortDirection } from '@core/common/domain';
import { Log } from '@core/utils';
import { join } from 'lodash';
import { ChartType, ConditionData, ConfigType, FunctionData, FunctionFamilyInfo, FunctionFamilyTypes, InputType } from '@/shared';

export enum TableType {
  View = 'view',
  Materialized = 'materialized',
  Default = 'default',
  InMemory = 'in_memory',
  EtlView = 'etl_view',
  Replacing = 'replacing'
}

export enum TableStatus {
  Normal = 'Normal',
  Processing = 'Processing'
}

export class TableSchema {
  name!: string;
  dbName!: string;
  organizationId!: number;
  displayName!: string;
  columns!: Column[];
  primaryKeys: string[] = [];
  orderBys: string[] = [];
  tableType!: TableType;
  tableStatus!: TableStatus;
  query?: string;
  expressionColumns: Column[];
  calculatedColumns: Column[];

  constructor(
    name: string,
    dbName: string,
    organizationId: number,
    displayName: string,
    columns: Column[],
    tableType: TableType,
    primaryKeys?: string[],
    orderBys?: string[],
    tableStatus?: TableStatus,
    query?: string,
    expressionColumns?: Column[],
    calculatedColumns?: Column[]
  ) {
    this.name = name;
    this.dbName = dbName;
    this.organizationId = organizationId;
    this.displayName = displayName;
    this.columns = columns;
    this.primaryKeys = primaryKeys || [];
    this.orderBys = orderBys || [];
    this.tableType = tableType;
    this.tableStatus = tableStatus || TableStatus.Normal;
    this.query = query;
    this.expressionColumns = expressionColumns || [];
    this.calculatedColumns = calculatedColumns || [];
  }

  get allColumns(): Column[] {
    return [...this.columns, ...this.expressionColumns, ...this.calculatedColumns];
  }

  static fromObject(obj: TableSchema): TableSchema {
    const columns = obj.columns?.map(col => Column.fromObject(col)).filter((item): item is Column => !!item);
    // const sortedColumns = columns.sort((col1: Column, col2: Column) => col1.name.localeCompare(col2.name));
    const expressionColumns = obj.expressionColumns
      ? obj.expressionColumns.map(column => Column.fromObject(column)).filter((item): item is Column => !!item)
      : [];
    const calculatedColumns = obj.calculatedColumns
      ? obj.calculatedColumns.map(column => Column.fromObject(column)).filter((item): item is Column => !!item)
      : [];
    return new TableSchema(
      obj.name,
      obj.dbName,
      obj.organizationId,
      obj.displayName,
      columns,
      obj.tableType,
      [],
      [],
      obj.tableStatus,
      obj.query,
      expressionColumns,
      calculatedColumns
    );
  }

  toMapFieldNameAndDisplayName(): Map<FieldName, DisplayName> {
    const listNameAndDisplayName: [FieldName, DisplayName][] = this.columns.map(column => [column.name, column.displayName.trim()]);
    return new Map<FieldName, DisplayName>(listNameAndDisplayName);
  }

  /**
   *     tạo ra 1 map bao gồm:
   *     @Key tên rút gọn (Field Name)
   *     @Value name [FFieldName]
   */
  toMapDisplayNameAndFieldName(): Map<DisplayName, FieldName> {
    const displayNameAndFieldNames: [DisplayName, FieldName][] = this.columns.map((column: Column) => {
      const displayName: DisplayName = column.displayName.trim();
      const fieldName: FieldName = column.name;
      return [displayName, fieldName];
    });
    return new Map<DisplayName, FieldName>(displayNameAndFieldNames);
  }

  get sqlAddress() {
    return [this.dbName, this.name].join('.');
  }

  removeColumns(columnNames: Set<string>) {
    this.columns = ListUtils.remove(this.columns, target => columnNames.has(target.name));
    return this;
  }

  addColumns(targets: Column[]) {
    const columnNames = this.columns.map(column => column.name);
    const columnNamesToAdd = targets.map(column => column.name);
    const columnsExisted = columnNamesToAdd.filter(name => columnNames.includes(name));
    if (ListUtils.isNotEmpty(columnsExisted)) {
      throw new DIException(`Columns ${join(columnsExisted)} is existed!`);
    } else {
      this.columns.push(...targets);
    }
    return this;
  }

  static empty(): TableSchema {
    return new TableSchema('', '', -1, '', [], TableType.Default, [], []);
  }

  isTableView(): boolean {
    return this.tableType === TableType.View && this.dbName === '';
  }

  /** convert table schema to chart info to show chart builder modal
   * */
  toTableChart(filters: Condition[]): ChartInfo {
    const querySetting: QuerySetting = SchemaUtils.buildQuery(this, filters);
    const defaultChartOption = TableChartOption.getDefaultChartOption();
    defaultChartOption.setOption('header.color', '#FFFFFF');
    querySetting.setChartOption(defaultChartOption);
    const functions: FunctionData[] = this.columns.map(col => {
      return {
        id: RandomUtils.nextInt(),
        name: col.displayName,
        functionFamily: FunctionFamilyTypes.none,
        field: Field.new(this.dbName, this.name, col.name, col.className),
        isNested: SchemaUtils.isNested(this.name),
        sorting: SortDirection.Asc
      };
    });
    const extraDataFilters: Record<number, ConditionData[]> = this.toFilters(filters);
    const commonSetting: WidgetCommonData = {
      id: -1,
      name: '',
      description: '',
      extraData: {
        configs: {
          [ConfigType.columns]: functions
        },
        filters: extraDataFilters,
        currentChartType: ChartType.Table as string
      }
    } as WidgetCommonData;
    return new ChartInfo(commonSetting, querySetting);
  }

  private toFilters(filters: Condition[]): Record<number, ConditionData[]> {
    //key là groupId, value là danh sách condition của group đó
    const recordAsMap: Record<number, ConditionData[]> = {};
    //lớp 1 các events or với nhau. filters đều là and condition
    filters.forEach(filter => {
      if (NestedCondition.isNestedCondition(filter)) {
        const groupId = RandomUtils.nextInt();
        //condition đều là FieldRelatedCondition
        filter
          .getConditions()
          .filter((con): con is FieldRelatedCondition => FieldRelatedCondition.isFieldRelatedCondition(con))
          .forEach(condition => {
            const conditionData: ConditionData = condition.toConditionData(groupId);
            if (recordAsMap[groupId]) {
              recordAsMap[groupId].push(conditionData);
            } else {
              recordAsMap[groupId] = [conditionData];
            }
          });
      }
    });
    return recordAsMap;
  }

  static isTableSchema(obj: any): obj is TableSchema {
    return !!obj?.tableType;
  }
}
