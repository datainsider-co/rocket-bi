import { CohortInfo, TimeMetric } from '@core/cdp';
import { EventFilter } from '@/screens/cdp/components/manage-path-explorer/PathExplorerInfo';
import { ChartOption, ColumnType, DIException, Field, FilterMode, FunctionType, QuerySetting } from '@core/common/domain';
import {
  AggregationFunctionTypes,
  ChartType,
  ConditionData,
  ConfigType,
  DateFunctionTypes,
  DateHistogramConditionTypes,
  DateRange,
  FunctionData,
  FunctionFamilyTypes,
  InputType,
  SortTypes,
  StringConditionTypes
} from '@/shared';
import { Di } from '@core/common/modules';
import { QuerySettingResolver } from '@/shared/resolver';
import { DateUtils, ListUtils, RandomUtils } from '@/utils';
import { ConditionUtils, Log } from '@core/utils';
import { EventAnalysisStep } from '@/screens/cdp/components/manage-event-analysis/EventAnalysisInfo';
import { DataType } from '@core/schema/service/FieldFilter';

export abstract class EventAnalysisBuilder {
  abstract withChartType(chartType: ChartType): EventAnalysisBuilder;

  abstract initDateTime(dateRange: DateRange, metric: TimeMetric): EventAnalysisBuilder;

  abstract withSteps(steps: EventAnalysisStep[], aggregationType: FunctionType): EventAnalysisBuilder;

  abstract withBreakdowns(breakdowns: CohortInfo[]): EventAnalysisBuilder;

  abstract withFilters(filters: EventFilter[]): EventAnalysisBuilder;

  abstract getResult(): QuerySetting;

  static builder(field: Map<string, Field>): EventAnalysisBuilder {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new EventAnalysisBuilderImpl(field);
  }
}

export class EventAnalysisBuilderImpl extends EventAnalysisBuilder {
  private readonly DATE_TIME_FIELD = 'timestamp';
  private readonly CUSTOMER_FIELD = 'customerId';
  private readonly EVENT_FIELD = 'eventName';
  private static readonly AggregationAsMap = {
    [FunctionType.Count.toString()]: AggregationFunctionTypes.countAll,
    [FunctionType.CountDistinct.toString()]: AggregationFunctionTypes.countOfDistinct
  };

  private static readonly DateHistogramAsMap = {
    [TimeMetric.Day.toString()]: DateFunctionTypes.dayOf,
    [TimeMetric.Week.toString()]: DateFunctionTypes.weekOf,
    [TimeMetric.Month.toString()]: DateFunctionTypes.monthOf,
    [TimeMetric.Quarter.toString()]: DateFunctionTypes.quarterOf,
    [TimeMetric.Year.toString()]: DateFunctionTypes.yearlyOf
  };

  private chartType: ChartType = ChartType.Line;
  private configAsMap: Map<ConfigType, FunctionData[]> = new Map();
  private filterAsMap: Map<number, ConditionData[]> = new Map();

  private fields: Map<string, Field>;
  private dateRange: DateRange = DateUtils.getAllTime();
  private timeMetric: TimeMetric = TimeMetric.Day;

  constructor(fields: Map<string, Field>) {
    super();
    this.fields = fields;
  }

  getResult(): QuerySetting {
    const queryBuilder: QuerySettingResolver = Di.get(QuerySettingResolver);
    Log.info('Build query::Input:: \nChart Type', this.chartType, '\nconfig::', this.configAsMap, '\nfilter::', this.filterAsMap);
    const query = queryBuilder.toQuerySetting(this.chartType, this.configAsMap, this.filterAsMap);
    const options = ChartOption.getDefaultChartOption(this.chartType);
    // options.setOption('legend.enabled', false);
    options.setOption('title.text', '');
    query.setChartOption(options);
    Log.info('Build query::Output \n', query);
    return query;
  }

  withBreakdowns(breakdowns: CohortInfo[]): EventAnalysisBuilder {
    return this;
  }

  withFilters(filters: EventFilter[]): EventAnalysisBuilder {
    return this;
  }

  withSteps(steps: EventAnalysisStep[], aggregationType: FunctionType): EventAnalysisBuilder {
    // Steps sẽ tương ứng với Y-Axis của Series Query
    // Steps sẽ build các In Filter, giá trị = event name
    const eventField: Field | undefined = this.fields.get(this.EVENT_FIELD);
    const customerField: Field | undefined = this.fields.get(this.CUSTOMER_FIELD);
    if (eventField && customerField) {
      ///Build Y-Axis
      const yFunctionData: FunctionData = {
        id: RandomUtils.nextInt(),
        name: customerField.fieldName,
        functionFamily: FunctionFamilyTypes.aggregation,
        functionType: EventAnalysisBuilderImpl.AggregationAsMap[aggregationType],
        isNested: false,
        sorting: SortTypes.Unsorted,
        field: customerField
      };
      this.configAsMap.set(ConfigType.yAxis, [yFunctionData]);

      // Build legend
      const legendFunctionData: FunctionData = {
        id: RandomUtils.nextInt(),
        name: eventField.fieldName,
        functionFamily: FunctionFamilyTypes.groupBy,
        isNested: false,
        sorting: SortTypes.Unsorted,
        field: eventField
      };
      this.configAsMap.set(ConfigType.legendOptional, [legendFunctionData]);

      //Build Filters
      const familyType = ConditionUtils.getFamilyTypeFromFieldType(eventField.fieldType);
      steps.forEach((step, index) => {
        const conditionData: ConditionData = {
          id: RandomUtils.nextInt(index),
          groupId: index,
          field: eventField,
          isNested: false,
          subType: StringConditionTypes.equal,
          familyType: familyType ?? '',
          allValues: [step.eventName],
          firstValue: step.eventName,
          currentInputType: InputType.text,
          filterModeSelected: FilterMode.selection,
          currentOptionSelected: ''
        };
        const timestampCondition: ConditionData = this.buildTimeStampCondition(index, this.dateRange);
        this.filterAsMap.set(index, [conditionData, timestampCondition]);
      });
    }
    return this;
  }

  withChartType(chartType: ChartType): EventAnalysisBuilder {
    this.chartType = chartType;
    return this;
  }

  initDateTime(dateRange: DateRange, metric: TimeMetric): EventAnalysisBuilder {
    this.dateRange = dateRange;
    this.timeMetric = metric;
    const field: Field | undefined = this.fields.get(this.DATE_TIME_FIELD);
    if (!field) {
      throw new DIException('Time field not found!');
    } else {
      ///Build X-Axis
      // field.fieldType = ColumnType.string; ///Hard code, fix build time stamp as mili seconds
      const dateFunctionData: FunctionData = {
        id: RandomUtils.nextInt(),
        name: field.fieldName,
        functionFamily: FunctionFamilyTypes.dateHistogram,
        functionType: EventAnalysisBuilderImpl.DateHistogramAsMap[metric],
        isNested: false,
        sorting: SortTypes.AscendingOrder,
        field: field
      };
      this.configAsMap.set(ConfigType.xAxis, [dateFunctionData]);
      this.configAsMap.set(ConfigType.sorting, [dateFunctionData]);
      ///Build Filters
      this.filterAsMap.forEach((filterConditions, index) => {
        const conditions = filterConditions.filter(condition => condition.field.fieldName !== this.DATE_TIME_FIELD);
        const timestampCondition: ConditionData = this.buildTimeStampCondition(index, dateRange);
        this.filterAsMap.set(index, [...conditions, timestampCondition]);
      });
    }

    return this;
  }

  private buildTimeStampCondition(groupId: number, dateRange: DateRange): ConditionData {
    const field: Field | undefined = this.fields.get(this.DATE_TIME_FIELD);
    if (!field) {
      throw new DIException('Time field not found!');
    } else {
      const familyType = ConditionUtils.getFamilyTypeFromFieldType(field.fieldType);
      const { start, end } = dateRange;
      return {
        id: RandomUtils.nextInt(groupId),
        groupId: groupId,
        field: field,
        isNested: false,
        subType: DateHistogramConditionTypes.betweenAndIncluding,
        familyType: familyType ?? '',
        allValues: [`${+start}`, `${+end}`],
        firstValue: `${+start}`,
        secondValue: `${+end}`,
        currentInputType: InputType.date,
        filterModeSelected: FilterMode.selection,
        currentOptionSelected: ''
      };
    }
  }
}
