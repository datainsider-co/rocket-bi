import { AggregationType, RangeValue } from '@core/cdp';
import { DateRange } from '@/shared';
import { isNumber } from 'lodash';
import { DateUtils } from '@/utils';

export enum CompareOperator {
  Equal = 'Equal',
  NotEqual = 'NotEqual',
  Contain = 'Contain',
  NotContain = 'NotContain',
  // IsSet = 'IsSet',
  // NotSet = 'NotSet',
  // In = 'In',
  // NotIn = 'NotIn',
  Gt = 'Gt',
  Gte = 'Gte',
  Lt = 'Lt',
  Lte = 'Lte',
  Between = 'Between',
  // BetweenAndIncluding = 'BetweenAndIncluding',
  NotBetween = 'NotBetween'
  // NotBetweenAndIncluding = 'NotBetweenAndIncluding'
}

export class AggregationFilter {
  aggregationType: AggregationType;
  operator: CompareOperator;
  fieldName?: string | null;
  singleValue?: string | null;
  rangeValue?: RangeValue<string> | null;
  listValue?: string[] | null;

  constructor(
    aggregationType: AggregationType,
    operator: CompareOperator,
    fieldName?: string | null,
    singleValue?: string | null,
    rangeValue?: RangeValue<string> | null,
    listValue?: string[] | null
  ) {
    this.aggregationType = aggregationType;
    this.operator = operator;
    this.fieldName = fieldName;
    this.singleValue = singleValue;
    this.rangeValue = rangeValue;
    this.listValue = listValue;
  }

  static fromObject(obj: any): AggregationFilter {
    return new AggregationFilter(obj.aggregationType, obj.operator, obj.fieldName, obj.singleValue, obj.rangeValue, obj.listValue);
  }

  get dateRange(): DateRange {
    if (isNumber(this.rangeValue?.from)) {
      const fromAsNumber = +this.rangeValue!.from;
      const toAsNumber = +this.rangeValue!.to;
      return DateUtils.toDateRange(new RangeValue<number>(fromAsNumber, toAsNumber));
    }
    return DateUtils.toDateRange(new RangeValue<number>(0, 0));
  }
}
