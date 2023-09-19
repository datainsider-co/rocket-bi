import {
  AggregationFunctionTypes,
  ConditionData,
  ConditionTypes,
  ConditionTreeNode,
  DataBuilderConstants,
  DateFunctionTypes,
  DateHistogramConditionTypes,
  FilterConstants,
  FunctionData,
  FunctionFamilyTypes,
  FunctionTreeNode,
  InputType,
  NumberConditionTypes,
  SortTypes,
  StringConditionTypes,
  DataBuilderConstantsV35,
  ChartType
} from '@/shared';
import { SlTreeNodeModel } from '@/shared/components/builder/treemenu/SlVueTree';
import { ListUtils } from '@/utils/ListUtils';
import {
  ChartControlData,
  ChartInfoType,
  ColumnType,
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
import { DownloadableFileWriter } from '@core/common/misc/csv/AbstractFileWriter';

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
      case ConditionTypes.DateHistogram:
        return DateHistogramConditionTypes.earlierThan;
      case ConditionTypes.Number:
        return NumberConditionTypes.equal;
      case ConditionTypes.String:
        return StringConditionTypes.equal;
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
        return ConditionTypes.Number;
      case ColumnType.string:
        return ConditionTypes.String;
      case ColumnType.date:
      case ColumnType.datetime:
      case ColumnType.datetime64:
        return ConditionTypes.DateHistogram;
      default:
        return ConditionTypes.DateHistogram;
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
      // case FunctionFamilyTypes.geospatial:
      //   return GeospatialFunctionTypes.cityOf;
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

  /**
   * check two field different field type.
   */
  static isDiffFieldType(first?: Field, second?: Field): boolean {
    Log.debug('isDifferentFieldType::', first?.getDataType(), second?.getDataType());
    if (first && second) {
      if (first.getDataType() === DataType.Expression || second.getDataType() === DataType.Expression) {
        return true;
      } else if (ChartUtils.isNumberType(first.fieldType) && ChartUtils.isNumberType(second.fieldType)) {
        return false;
      } else if (ChartUtils.isDateType(first.fieldType) && ChartUtils.isDateType(second.fieldType)) {
        return false;
      } else if (ChartUtils.isTextType(first.fieldType) && ChartUtils.isTextType(second.fieldType)) {
        return false;
      }
    }
    return true;
  }

  /**
   * check two field is different value.
   */
  static isDiffFieldValue(first?: Field, second?: Field): boolean {
    if (first && second) {
      return first.className !== second.className || !first.equals(second);
    }
    if (!first && !second) {
      return false;
    }
    // otherwise, one of them is null
    return true;
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
      filterModeSelected: node.filterModeSelected ?? FilterMode.Range,
      currentOptionSelected: node.currentOptionSelected ?? FilterConstants.DEFAULT_SELECTED,
      currentInputType: node.currentInputType ?? FilterConstants.DEFAULT_STRING_SELECTED,
      controlId: node.controlId
    };
  }

  /**
   * set default value for condition node
   */
  static setDefaultValue(node: ConditionTreeNode): void {
    node.allValues = [];
    node.secondValue = '';
    node.firstValue = '';
    if (node.field) {
      node.filterFamily = ChartUtils.getFilterFamily(node);
      if (ChartUtils.isDateType(node.field.fieldType)) {
        node.filterType = node.currentOptionSelected = node.filterType = FilterConstants.DEFAULT_DATE_SELECTED;
        node.filterModeSelected = FilterMode.Range;
        node.currentInputType = InputType.DateRange;
      } else if (ChartUtils.isTextType(node.field.fieldType)) {
        node.filterType = node.currentOptionSelected = node.filterType = FilterConstants.DEFAULT_STRING_SELECTED;
        node.filterModeSelected = FilterMode.Selection;
        node.currentInputType = InputType.MultiSelect;
      } else if (ChartUtils.isNumberType(node.field.fieldType)) {
        node.filterType = node.currentOptionSelected = node.filterType = FilterConstants.DEFAULT_NUMBER_SELECTED;
        node.filterModeSelected = FilterMode.Range;
        node.currentInputType = InputType.Text;
      }
    }
  }

  static isMobile() {
    return document.body.clientWidth < 768;
  }

  static isDesktop() {
    return !this.isMobile();
  }

  static isAggregationFunction(fieldRelatedFunction: FieldRelatedFunction) {
    const [family, type] = fieldRelatedFunction.getFunctionTypes();
    return family == FunctionFamilyTypes.aggregation;
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
   * @deprecated call api download instead of
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

  static async writeCsvFile(fileName: string, data: string) {
    const writer = new DownloadableFileWriter(`${fileName}.csv`, true);
    await writer.write(data);
    writer.close();
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

  static getControlIconSrc(chartInfoType: ChartInfoType | undefined, chartType: ChartType): string {
    switch (chartInfoType) {
      case ChartInfoType.FunctionController:
        return require('@/assets/icon/charts/chart_control.svg');
      default: {
        const iconName = DataBuilderConstantsV35.ALL_ICON_MAP.get(chartType) ?? 'chart_control.svg';
        return require(`@/assets/icon/charts/${iconName}`);
      }
    }
  }
}
