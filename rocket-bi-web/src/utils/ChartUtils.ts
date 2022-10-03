import {
  AggregationFunctionTypes,
  ChartType,
  ConditionData,
  ConditionFamilyTypes,
  ConditionTreeNode,
  DataBuilderConstants,
  DateFunctionTypes,
  DateHistogramConditionTypes,
  FilterConstants,
  FunctionData,
  FunctionFamilyTypes,
  FunctionTreeNode,
  GeospatialConditionTypes,
  GeospatialFunctionTypes,
  InputType,
  NumberConditionTypes,
  SettingItemType,
  SortTypes,
  StringConditionTypes
} from '@/shared';
import { SlTreeNodeModel } from '@/shared/components/builder/treemenu/SlVueTree';
import { CustomCssAsMap, DefaultCss } from '@/shared/constants/CustomChartCss';
import { CustomHtmlAsMap, DefaultHtml } from '@/shared/constants/CustomChartHtml';
import { CustomJsAsMap, DefaultJs } from '@/shared/constants/CustomTableJs';
import { ListUtils } from '@/utils/ListUtils';
import { SchemaUtils } from '@/utils/SchemaUtils';
import {
  Column,
  ColumnType,
  DatabaseSchema,
  Field,
  FieldRelatedFunction,
  FilterMode,
  FilterWidget,
  FunctionType,
  Group,
  MinMaxCondition,
  OrderBy,
  ScalarFunctionType,
  TableColumn,
  TableSchema,
  TableType
} from '@core/common/domain/model';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { FilterRequest, SortDirection } from '@core/common/domain/request';
import { AbstractTableResponse, MinMaxData } from '@core/common/domain/response/query/AbstractTableResponse';
import { CsvWriterFactory } from '@core/common/misc/csv/CsvWriterFactory';
import { CSVData } from '@core/common/misc/csv/Record';
import { CsvStringifierFactory } from '@core/common/misc/csv/stringifiers/CsvStringifierFactory';
import { Di } from '@core/common/modules';
import { DataType } from '@core/schema/service/FieldFilter';
import { FunctionResolver } from '@core/common/services/function-builder/FunctionResolver';
import { Log, NumberUtils } from '@core/utils';
import { Function } from '@core/common/domain/model/function/Function';

export abstract class ChartUtils {
  private static SETTING_NEED_KEEPS = ['title', 'subtitle', 'background', 'text_color'];

  static isColumnNumber(tableColumn: TableColumn): boolean {
    return ChartUtils.isNumberType(tableColumn.function.field.fieldType);
  }

  static isNumberType(type: string): boolean {
    switch (type.toLowerCase()) {
      case ColumnType.int8:
      case ColumnType.int16:
      case ColumnType.int32:
      case ColumnType.int64:
      case ColumnType.uint8:
      case ColumnType.uint16:
      case ColumnType.uint32:
      case ColumnType.uint64:
      case ColumnType.float:
      case ColumnType.float64:
      case ColumnType.double:
        return true;
      default:
        return false;
    }
  }

  static isTimeStampType(type: string): boolean {
    switch (type.toLowerCase()) {
      case ScalarFunctionType.DateTimeToSeconds:
      case ScalarFunctionType.DateTimeToMillis:
      case ScalarFunctionType.DateTimeToNanos:
        return true;
      default:
        return false;
    }
  }

  static isDateType(type: string): boolean {
    switch (type.toLowerCase()) {
      case ColumnType.date:
      case ColumnType.datetime:
      case ColumnType.datetime64:
        return true;
      default:
        return false;
    }
  }

  static isTextType(type: string): boolean {
    switch (type.toLowerCase()) {
      case ColumnType.string:
        return true;
      default:
        return false;
    }
  }

  static isReadonlyTable(type: string): boolean {
    switch (type) {
      case TableType.Default:
      case TableType.Materialized:
      case TableType.EtlView:
      case TableType.InMemory:
      case TableType.Replacing:
        return false;
      default:
        return true;
    }
  }

  static getFilterType(familyType: string): string {
    // TODO: be-careful if nodeName change, function will return wrong value
    switch (familyType) {
      case ConditionFamilyTypes.dateHistogram:
        return DateHistogramConditionTypes.earlierThan;
      case ConditionFamilyTypes.number:
        return NumberConditionTypes.equal;
      case ConditionFamilyTypes.string:
        return StringConditionTypes.equal;
      case ConditionFamilyTypes.geospatial:
        return GeospatialConditionTypes.countryOf;
      default:
        return '';
    }
  }

  static getDefaultFilterByColumnType(type: string): string {
    switch (type) {
      case ColumnType.int8:
      case ColumnType.int16:
      case ColumnType.int32:
      case ColumnType.int64:
      case ColumnType.uint8:
      case ColumnType.uint16:
      case ColumnType.uint32:
      case ColumnType.uint64:
      case ColumnType.float:
      case ColumnType.double:
        return ConditionFamilyTypes.number;
      case ColumnType.string:
        return ConditionFamilyTypes.string;
      case ColumnType.date:
      case ColumnType.datetime:
      case ColumnType.datetime64:
        return ConditionFamilyTypes.dateHistogram;
      default:
        return ConditionFamilyTypes.dateHistogram;
    }
  }

  static buildNameOfFilter(filterType: string, firstValue: string, secondValue: string): string {
    switch (filterType) {
      case DateHistogramConditionTypes.between:
      case DateHistogramConditionTypes.betweenAndIncluding:
        return `${filterType} ${firstValue} and ${secondValue}`;
      case DateHistogramConditionTypes.lastNDays:
      case DateHistogramConditionTypes.lastNHours:
      case DateHistogramConditionTypes.lastNMinutes:
      case DateHistogramConditionTypes.lastNMonths:
      case DateHistogramConditionTypes.lastNWeeks:
      case DateHistogramConditionTypes.lastNYears: {
        const regex = new RegExp('\\s+N\\s+');
        return filterType.replace(regex, ` ${firstValue} `);
      }
      case DateHistogramConditionTypes.currentYear:
      case DateHistogramConditionTypes.currentWeek:
      case DateHistogramConditionTypes.currentQuarter:
      case DateHistogramConditionTypes.currentMonth:
      case DateHistogramConditionTypes.currentDay:
      case StringConditionTypes.isnull:
      case StringConditionTypes.notNull:
        return filterType;
      default:
        return `${filterType} ${firstValue}`;
    }
  }

  static getColumnType(node: ConditionTreeNode): string | undefined {
    if (node.field) {
      return node.field.fieldType;
    } else {
      const index = node.ind;
      const table = node.parent.tag as TableSchema;
      if (table) {
        return table.columns[index].className;
      }
    }
    return void 0;
  }

  static getField(node: ConditionTreeNode | FunctionTreeNode): Field | undefined {
    if (node.field) {
      return node.field;
    } else {
      const path = Array.from(node.path);
      if (path.length === 2) {
        const index = node.ind;
        if (node.parent.children) {
          return node.parent.children[index].tag as Field;
        }
      } else {
        return this.getFieldNested(node, path);
      }
    }
  }

  static isDisplayColumn(functionFamily: string | undefined) {
    return functionFamily === FunctionFamilyTypes.groupBy || functionFamily === FunctionFamilyTypes.dateHistogram;
  }

  static toFilterRequests(filters: FilterWidget[]) {
    return filters.map(filter => filter.toFilterRequest()).filter((filter): filter is FilterRequest => filter instanceof FilterRequest);
  }

  static mergeConfig(currentNode: FunctionTreeNode, newNode: FunctionTreeNode): FunctionTreeNode {
    // return undefined;
    return {
      ...newNode,
      functionFamily: currentNode.functionFamily,
      functionType: currentNode.functionType,
      id: currentNode.id,
      displayAsColumn: currentNode.displayAsColumn
    };
  }

  static mergeCondition(currentNode: ConditionTreeNode, newNode: ConditionTreeNode): ConditionTreeNode {
    return {
      ...newNode,
      id: currentNode.id,
      groupId: currentNode.groupId,
      filterCondition: this.buildNameOfFilter(currentNode.filterType, currentNode.firstValue, currentNode.secondValue),
      firstValue: currentNode.firstValue,
      secondValue: currentNode.secondValue,
      filterFamily: currentNode.filterFamily,
      filterType: currentNode.filterType,
      parent: {
        ...newNode.parent
      },
      title: newNode.title
    };
  }

  static getDefaultFnType(functionFamily: string): string {
    switch (functionFamily) {
      case FunctionFamilyTypes.dateHistogram:
        return DateFunctionTypes.year;
      case FunctionFamilyTypes.geospatial:
        return GeospatialFunctionTypes.cityOf;
      case FunctionFamilyTypes.aggregation:
        return AggregationFunctionTypes.countAll;
      default:
        return '';
    }
  }

  static buildTableColumnsFromFunctionData(listFunctionData: FunctionData[]): TableColumn[] {
    const functionBuilder: FunctionResolver = Di.get(FunctionResolver);
    Log.debug('buildTableColumnsFromFunctionData::', listFunctionData);
    return listFunctionData
      .map(data => {
        if (data.dynamicFunction) {
          return data.dynamicFunction.defaultTableColumns;
        } else {
          const func = functionBuilder.buildFunction(data) as FieldRelatedFunction;
          return new TableColumn(data.name, func, data.displayAsColumn || false, false, true);
        }
      })
      .flat();
  }

  static buildOrderFunction(func: Function, sorting: string, isShowNElements?: boolean, numElemsShown?: number | null): OrderBy | undefined {
    const nElements: number | undefined | null = isShowNElements ? numElemsShown : void 0;
    switch (sorting) {
      case SortTypes.AscendingOrder:
        return new OrderBy(func, SortDirection.Asc, nElements);
      case SortTypes.DescendingOrder:
        return new OrderBy(func, SortDirection.Desc, nElements);
      default:
        return void 0;
    }
  }

  static isNoneComponent(type: string): boolean {
    return type == SettingItemType.none;
  }

  static isGroupSettingComponent(type: string): boolean {
    return type == SettingItemType.group;
  }

  static isDifferentFieldType(firstField: Field | undefined, secondField: Field | undefined) {
    Log.debug('isDifferentFieldType::', firstField?.getDataType(), secondField?.getDataType());
    if (firstField && secondField) {
      if (firstField.getDataType() === DataType.Expression || secondField.getDataType() === DataType.Expression) {
        return true;
      } else if (ChartUtils.isNumberType(firstField.fieldType) && ChartUtils.isNumberType(secondField.fieldType)) {
        return false;
      } else if (ChartUtils.isDateType(firstField.fieldType) && ChartUtils.isDateType(secondField.fieldType)) {
        return false;
      } else if (ChartUtils.isTextType(firstField.fieldType) && ChartUtils.isTextType(secondField.fieldType)) {
        return false;
      }
    }
    return true;
  }

  static getProfileFieldsFromDBSchemaTblName(dbSchema: DatabaseSchema, tblName: string): FieldDetailInfo[] {
    const selectedTable = dbSchema.tables.find(table => table.name === tblName);
    if (selectedTable) {
      return selectedTable.columns.map((column: Column) => {
        return new FieldDetailInfo(
          Field.new(selectedTable.dbName, selectedTable.name, column.name, column.className),
          column.name,
          column.displayName,
          SchemaUtils.isNested(selectedTable.name),
          false
        );
      });
    }
    return [];
  }

  static getFilterFamily(node: ConditionTreeNode): string {
    const columnType = ChartUtils.getColumnType(node);

    if (columnType) {
      return ChartUtils.getDefaultFilterByColumnType(columnType);
    } else {
      return DataBuilderConstants.FILTER_NODES[0].label;
    }
  }

  static toConditionData(node: ConditionTreeNode): ConditionData {
    const field = ChartUtils.getField(node) as Field;
    return {
      id: node.id,
      groupId: node.groupId,
      familyType: node.filterFamily,
      subType: node.filterType,
      firstValue: node.firstValue,
      secondValue: node.secondValue,
      field: field,
      tableName: node.parent.title,
      columnName: node.title,
      isNested: node.isNested || node?.path?.length > 2 || false,
      allValues: node.allValues,
      filterModeSelected: node.filterModeSelected ?? FilterMode.range,
      currentOptionSelected: node.currentOptionSelected ?? FilterConstants.DEFAULT_SELECTED,
      currentInputType: node.currentInputType ?? FilterConstants.DEFAULT_STRING_SELECTED,
      tabControl: node.tabControl ?? void 0
    };
  }

  static resetNodeData(newNode: ConditionTreeNode) {
    newNode.allValues = [];
    newNode.secondValue = '';
    newNode.firstValue = '';
    if (newNode.field) {
      newNode.filterFamily = ChartUtils.getFilterFamily(newNode);
      if (ChartUtils.isDateType(newNode.field.fieldType)) {
        newNode.filterType = newNode.currentOptionSelected = newNode.filterType = FilterConstants.DEFAULT_DATE_SELECTED;
        newNode.filterModeSelected = FilterMode.range;
        newNode.currentInputType = InputType.dateRange;
      } else if (ChartUtils.isTextType(newNode.field.fieldType)) {
        newNode.filterType = newNode.currentOptionSelected = newNode.filterType = FilterConstants.DEFAULT_STRING_SELECTED;
        newNode.filterModeSelected = FilterMode.selection;
        newNode.currentInputType = InputType.multiSelect;
      } else if (ChartUtils.isNumberType(newNode.field.fieldType)) {
        newNode.filterType = newNode.currentOptionSelected = newNode.filterType = FilterConstants.DEFAULT_NUMBER_SELECTED;
        newNode.filterModeSelected = FilterMode.range;
        newNode.currentInputType = InputType.text;
      }
    }
  }

  static getDefaultJs(chartType: ChartType) {
    return CustomJsAsMap.get(chartType) ?? DefaultJs;
  }

  static getDefaultHtml(chartType: ChartType) {
    return CustomHtmlAsMap.get(chartType) ?? DefaultHtml;
  }

  static getDefaultCss(chartType: ChartType) {
    return CustomCssAsMap.get(chartType) ?? DefaultCss;
  }

  static isMobile() {
    return document.body.clientWidth < 800;
  }

  static isDesktop() {
    return !this.isMobile();
  }

  static isAggregationFunction(fieldRelatedFunction: FieldRelatedFunction) {
    const [family, type] = fieldRelatedFunction.getFunctionTypes();
    return family == FunctionFamilyTypes.aggregation;
  }

  static findTableColumnIsNumber(columns: TableColumn[]): TableColumn[] {
    return columns.filter(column => ChartUtils.isNumberType(column.function.field.fieldType) || ChartUtils.isAggregationFunction(column.function));
  }

  private static getFieldNested(node: ConditionTreeNode | FunctionTreeNode, path: number[]): Field | undefined {
    const firstIndex = path.shift();
    const tailNode = this.getTailNodeInNestedColumn(node.parent, path);
    if (tailNode) {
      Log.debug('getField::tailNode', tailNode);
      return tailNode.tag as Field;
    } else {
      return void 0;
    }
  }

  private static getTailNodeInNestedColumn(node: SlTreeNodeModel<any>, indexes: number[]): SlTreeNodeModel<any> | undefined {
    if (ListUtils.isEmpty(indexes)) {
      return node;
    } else {
      const nextIndex = indexes.shift();
      if (node.children) {
        return this.getTailNodeInNestedColumn(node.children[nextIndex!], indexes);
      } else {
        return void 0;
      }
    }
  }

  static calculateRatio(value: number, minMaxData: MinMaxData): number {
    if (minMaxData.max === minMaxData.min) {
      return 1;
    } else {
      const ratio = (value - minMaxData.min) / (minMaxData.max - minMaxData.min);
      return NumberUtils.limit(ratio, 0, 1);
    }
  }

  static hasOnlyNoneFunction(columns: TableColumn[]): boolean {
    return !columns.some(column => column.function.className !== FunctionType.Select && column.function.className !== FunctionType.SelectDistinct);
  }

  static isGroupByFunction(relatedFunction: FieldRelatedFunction): relatedFunction is Group {
    return relatedFunction.className === FunctionType.Group;
  }

  /**
   * @throws Exception
   */
  static async downloadAsCSV(fileName: string, tableResponse: AbstractTableResponse) {
    const csvWriterFactory = new CsvWriterFactory(new CsvStringifierFactory());
    const csv: CSVData = tableResponse.toCSV();
    const csvWriter = csvWriterFactory.createArrayCsvWriter({
      path: `${fileName}.csv`,
      header: csv.header
    });
    await csvWriter.writeRecords(csv.records);
    csvWriter.close();
  }

  //trả về giá trị data label có được hiển thị với điều kiện tương ứng
  static isShowValue(value: number, condition: MinMaxCondition | undefined | null): boolean {
    if (!condition || !condition.enabled) {
      return true;
    } else if (value) {
      return false;
    } else {
      let show = false;
      Log.debug('');
      const enableMin = condition.min?.enabled ?? false;
      if (enableMin) {
        const min = condition.min?.value ?? 0;
        show = condition.min?.equal ?? false ? value >= min : value > min;
      }
      const enableMax = condition.max?.enabled ?? false;
      if (enableMax) {
        const max = condition.max?.value ?? 0;
        show = condition.max?.equal ?? false ? value <= max : value < max;
      }
      return show;
    }
  }

  static isDateHistogramPeriodic(className: string): boolean {
    switch (className) {
      case ScalarFunctionType.ToYear:
      case ScalarFunctionType.ToQuarter:
      case ScalarFunctionType.ToMonth:
      case ScalarFunctionType.ToWeek:
      case ScalarFunctionType.ToDayOfYear:
      case ScalarFunctionType.ToDayOfMonth:
      case ScalarFunctionType.ToDayOfWeek:
      case ScalarFunctionType.ToHour:
      case ScalarFunctionType.ToMinute:
      case ScalarFunctionType.ToSecond:
        return true;
      default:
        return false;
    }
  }
}
