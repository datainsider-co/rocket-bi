import { FunctionBuilder } from '@core/common/services/function-builder/FunctionBuilder';
import { AggregationFunctionTypes, DateFunctionTypes, FunctionData, FunctionFamilyTypes } from '@/shared';
import {
  Avg,
  TimestampToDate,
  ToDateTime,
  Count,
  CountDistinct,
  Field,
  FieldRelatedFunction,
  Group,
  Max,
  Min,
  Select,
  Sum,
  ToDayNum,
  ToDayOfMonth,
  ToDayOfWeek,
  ToDayOfYear,
  ToHour,
  ToHourNum,
  ToMinute,
  ToMinuteNum,
  ToMonth,
  ToMonthNum,
  ToQuarter,
  ToQuarterNum,
  ToSecond,
  ToSecondNum,
  ToWeekNum,
  ToYear,
  ToYearNum,
  DateTimeToSeconds,
  DateTimeToMillis,
  DateTimeToNanos,
  MillisToDateTime,
  SecondsToDateTime,
  NanosToDateTime,
  SelectExpression,
  ExpressionField
} from '@core/common/domain/model';
import { ChartUtils } from '@/utils';
import { Log } from '@core/utils';

export class GroupByFunctionBuilderEngine implements FunctionBuilder {
  buildFunction(functionData: FunctionData): FieldRelatedFunction | undefined {
    return new Group(functionData.field);
  }
}

export class DateHistogramFunctionBuilder implements FunctionBuilder {
  private readonly builderAsMap: Map<string, (func: FieldRelatedFunction) => FieldRelatedFunction>;
  private readonly textFieldBuilderAsMap: Map<string, (func: FieldRelatedFunction) => FieldRelatedFunction>;
  private readonly numberFieldBuilderAsMap: Map<string, (func: FieldRelatedFunction) => FieldRelatedFunction>;

  constructor() {
    this.builderAsMap = this.buildBuilderForDateHistogram();
    this.textFieldBuilderAsMap = this.buildTextFieldBuilderForDateHistogram();
    this.numberFieldBuilderAsMap = this.buildNumberFieldBuilderForDateHistogram();
  }

  buildFunction(functionData: FunctionData): FieldRelatedFunction | undefined {
    return this.buildFunctionFromField(functionData.field, functionData.functionType);
  }

  buildFunctionFromField(field: Field, functionType?: string): FieldRelatedFunction | undefined {
    const group = new Group(field);
    if (functionType) {
      const builderAsMap: Map<string, (func: FieldRelatedFunction) => FieldRelatedFunction> = this.getListBuilder(field);
      const builder = builderAsMap.get(functionType);
      if (builder) {
        return builder(group);
      }
    } else {
      return group;
    }
  }

  private buildBuilderForDateHistogram(): Map<string, (func: FieldRelatedFunction) => FieldRelatedFunction> {
    return new Map<string, (func: FieldRelatedFunction) => FieldRelatedFunction>([
      [DateFunctionTypes.secondOf, fn => fn.setScalarFunction(new ToSecondNum())],
      [DateFunctionTypes.minuteOf, fn => fn.setScalarFunction(new ToMinuteNum())],
      [DateFunctionTypes.hourOf, fn => fn.setScalarFunction(new ToHourNum())],
      [DateFunctionTypes.dayOf, fn => fn.setScalarFunction(new ToDayNum())],
      [DateFunctionTypes.weekOf, fn => fn.setScalarFunction(new ToWeekNum())],
      [DateFunctionTypes.monthOf, fn => fn.setScalarFunction(new ToMonthNum())],
      [DateFunctionTypes.quarterOf, fn => fn.setScalarFunction(new ToQuarterNum())],
      [DateFunctionTypes.yearlyOf, fn => fn.setScalarFunction(new ToYearNum())],
      [DateFunctionTypes.hourOfDay, fn => fn.setScalarFunction(new ToHour())],
      [DateFunctionTypes.dayOfWeek, fn => fn.setScalarFunction(new ToDayOfWeek())],
      [DateFunctionTypes.dayOfMonth, fn => fn.setScalarFunction(new ToDayOfMonth())],
      [DateFunctionTypes.dayOfYear, fn => fn.setScalarFunction(new ToDayOfYear())],
      [DateFunctionTypes.monthOfYear, fn => fn.setScalarFunction(new ToMonth())],
      [DateFunctionTypes.year, fn => fn.setScalarFunction(new ToYear())],
      [DateFunctionTypes.quarterOfYear, fn => fn.setScalarFunction(new ToQuarter())],
      [DateFunctionTypes.minuteOfHour, fn => fn.setScalarFunction(new ToMinute())],
      [DateFunctionTypes.secondOfMinute, fn => fn.setScalarFunction(new ToSecond())],
      [DateFunctionTypes.second, fn => fn.setScalarFunction(new DateTimeToSeconds())],
      [DateFunctionTypes.millisecond, fn => fn.setScalarFunction(new DateTimeToMillis())],
      [DateFunctionTypes.nanosecond, fn => fn.setScalarFunction(new DateTimeToNanos())]
    ]);
  }

  private buildTextFieldBuilderForDateHistogram(): Map<string, (func: FieldRelatedFunction) => FieldRelatedFunction> {
    const convertStringFn = new MillisToDateTime();
    return new Map<string, (func: FieldRelatedFunction) => FieldRelatedFunction>([
      [DateFunctionTypes.secondOf, fn => fn.setScalarFunction(new ToSecondNum(convertStringFn))],
      [DateFunctionTypes.minuteOf, fn => fn.setScalarFunction(new ToMinuteNum(convertStringFn))],
      [DateFunctionTypes.hourOf, fn => fn.setScalarFunction(new ToHourNum(convertStringFn))],
      [DateFunctionTypes.dayOf, fn => fn.setScalarFunction(new ToDayNum(convertStringFn))],
      [DateFunctionTypes.weekOf, fn => fn.setScalarFunction(new ToWeekNum(convertStringFn))],
      [DateFunctionTypes.monthOf, fn => fn.setScalarFunction(new ToMonthNum(convertStringFn))],
      [DateFunctionTypes.quarterOf, fn => fn.setScalarFunction(new ToQuarterNum(convertStringFn))],
      [DateFunctionTypes.yearlyOf, fn => fn.setScalarFunction(new ToYearNum(convertStringFn))],
      [DateFunctionTypes.hourOfDay, fn => fn.setScalarFunction(new ToHour(convertStringFn))],
      [DateFunctionTypes.dayOfWeek, fn => fn.setScalarFunction(new ToDayOfWeek(convertStringFn))],
      [DateFunctionTypes.dayOfMonth, fn => fn.setScalarFunction(new ToDayOfMonth(convertStringFn))],
      [DateFunctionTypes.dayOfYear, fn => fn.setScalarFunction(new ToDayOfYear(convertStringFn))],
      [DateFunctionTypes.monthOfYear, fn => fn.setScalarFunction(new ToMonth(convertStringFn))],
      [DateFunctionTypes.year, fn => fn.setScalarFunction(new ToYear(convertStringFn))],
      [DateFunctionTypes.quarterOfYear, fn => fn.setScalarFunction(new ToQuarter(convertStringFn))],
      [DateFunctionTypes.minuteOfHour, fn => fn.setScalarFunction(new ToMinute(convertStringFn))],
      [DateFunctionTypes.secondOfMinute, fn => fn.setScalarFunction(new ToSecond(convertStringFn))],
      [DateFunctionTypes.second, fn => fn.setScalarFunction(new DateTimeToSeconds(new SecondsToDateTime()))],
      [DateFunctionTypes.millisecond, fn => fn.setScalarFunction(new DateTimeToMillis(convertStringFn))],
      [DateFunctionTypes.nanosecond, fn => fn.setScalarFunction(new DateTimeToNanos(new NanosToDateTime()))]
    ]);
  }

  private buildNumberFieldBuilderForDateHistogram(): Map<string, (func: FieldRelatedFunction) => FieldRelatedFunction> {
    const convertLongFn = new MillisToDateTime();
    return new Map<string, (func: FieldRelatedFunction) => FieldRelatedFunction>([
      [DateFunctionTypes.secondOf, fn => fn.setScalarFunction(new ToSecondNum(convertLongFn))],
      [DateFunctionTypes.minuteOf, fn => fn.setScalarFunction(new ToMinuteNum(convertLongFn))],
      [DateFunctionTypes.hourOf, fn => fn.setScalarFunction(new ToHourNum(convertLongFn))],
      [DateFunctionTypes.dayOf, fn => fn.setScalarFunction(new ToDayNum(convertLongFn))],
      [DateFunctionTypes.weekOf, fn => fn.setScalarFunction(new ToWeekNum(convertLongFn))],
      [DateFunctionTypes.monthOf, fn => fn.setScalarFunction(new ToMonthNum(convertLongFn))],
      [DateFunctionTypes.quarterOf, fn => fn.setScalarFunction(new ToQuarterNum(convertLongFn))],
      [DateFunctionTypes.yearlyOf, fn => fn.setScalarFunction(new ToYearNum(convertLongFn))],
      [DateFunctionTypes.hourOfDay, fn => fn.setScalarFunction(new ToHour(convertLongFn))],
      [DateFunctionTypes.dayOfWeek, fn => fn.setScalarFunction(new ToDayOfWeek(convertLongFn))],
      [DateFunctionTypes.dayOfMonth, fn => fn.setScalarFunction(new ToDayOfMonth(convertLongFn))],
      [DateFunctionTypes.dayOfYear, fn => fn.setScalarFunction(new ToDayOfYear(convertLongFn))],
      [DateFunctionTypes.monthOfYear, fn => fn.setScalarFunction(new ToMonth(convertLongFn))],
      [DateFunctionTypes.year, fn => fn.setScalarFunction(new ToYear(convertLongFn))],
      [DateFunctionTypes.quarterOfYear, fn => fn.setScalarFunction(new ToQuarter(convertLongFn))],
      [DateFunctionTypes.minuteOfHour, fn => fn.setScalarFunction(new ToMinute(convertLongFn))],
      [DateFunctionTypes.secondOfMinute, fn => fn.setScalarFunction(new ToSecond(convertLongFn))],
      [DateFunctionTypes.second, fn => fn.setScalarFunction(new DateTimeToSeconds(new SecondsToDateTime()))],
      [DateFunctionTypes.millisecond, fn => fn.setScalarFunction(new DateTimeToMillis(convertLongFn))],
      [DateFunctionTypes.nanosecond, fn => fn.setScalarFunction(new DateTimeToNanos(new NanosToDateTime()))]
    ]);
  }

  private getListBuilder(field: Field): Map<string, (func: FieldRelatedFunction) => FieldRelatedFunction> {
    const { fieldType } = field;
    Log.debug('fieldType::', fieldType);
    if (ChartUtils.isTextType(fieldType)) {
      return this.textFieldBuilderAsMap;
    }
    if (ChartUtils.isNumberType(fieldType)) {
      return this.numberFieldBuilderAsMap;
    }
    return this.builderAsMap;
  }
}

export class AggregationFunctionBuilder implements FunctionBuilder {
  private readonly builderAsMap: Map<string, (functionData: FunctionData) => FieldRelatedFunction>;

  constructor() {
    this.builderAsMap = this.buildBuilderForDateHistogram();
  }

  buildFunction(functionData: FunctionData): FieldRelatedFunction | undefined {
    const builder = this.builderAsMap.get(functionData.functionType || '');
    if (builder) {
      return builder(functionData);
    } else {
      return void 0;
    }
  }

  private buildBuilderForDateHistogram(): Map<string, (functionData: FunctionData) => FieldRelatedFunction> {
    return new Map<string, (functionData: FunctionData) => FieldRelatedFunction>([
      [AggregationFunctionTypes.average, functionData => new Avg(functionData.field)],
      [AggregationFunctionTypes.sum, functionData => new Sum(functionData.field)],
      // [AggregationFunctionTypes.columnRatio, (functionData) => new Avg(functionData.field)],
      [AggregationFunctionTypes.maximum, functionData => new Max(functionData.field)],
      [AggregationFunctionTypes.minimum, functionData => new Min(functionData.field)],
      [AggregationFunctionTypes.countOfDistinct, functionData => new CountDistinct(functionData.field)],
      [AggregationFunctionTypes.countAll, functionData => new Count(functionData.field)],
      [AggregationFunctionTypes.Expression, functionData => new SelectExpression(functionData.field as ExpressionField)]
    ]);
  }
}

export class SelectFunctionBuilder implements FunctionBuilder {
  buildFunction(functionData: FunctionData): FieldRelatedFunction | undefined {
    return new Select(functionData.field);
  }
}

export class MainFunctionBuilder implements FunctionBuilder {
  private readonly builderAsMap: Map<string, FunctionBuilder>;

  constructor() {
    this.builderAsMap = this.buildListBuilder();
  }

  buildFunction(functionData: FunctionData): FieldRelatedFunction | undefined {
    const builder = this.builderAsMap.get(functionData.functionFamily);
    if (builder) {
      return builder.buildFunction(functionData);
    } else {
      return void 0;
    }
  }

  private buildListBuilder(): Map<string, FunctionBuilder> {
    const map = new Map<string, FunctionBuilder>();
    map
      .set(FunctionFamilyTypes.groupBy, new GroupByFunctionBuilderEngine())
      .set(FunctionFamilyTypes.dateHistogram, new DateHistogramFunctionBuilder())
      .set(FunctionFamilyTypes.aggregation, new AggregationFunctionBuilder())
      .set(FunctionFamilyTypes.none, new SelectFunctionBuilder());
    return map;
  }
}
