/*
 * @author: tvc12 - Thien Vi
 * @created: 4/7/22, 4:16 PM
 */

/* eslint-disable @typescript-eslint/no-use-before-define */

import { DateRange } from '@/shared';
import { AggregationType, CohortType, CompareOperator, EventOperator, RangeValue } from '@core/CDP';
import { UnsupportedException } from '@core/domain/Exception/UnsupportedException';
import { DateUtils } from '@/utils';

export const COHORT_DATE_FORMAT = 'YYYY-MM-DD';
export const COHORT_WEEK_FORMAT = 'YYYY-[W]W';
export const COHORT_MONTH_FORMAT = 'YYYY-MM';
export const COHORT_YEAR_FORMAT = 'YYYY';

export abstract class CohortFilter {
  protected constructor(public className: CohortType) {}

  get isAndCohort() {
    return this.className === CohortType.And;
  }

  get isOrCohort() {
    return this.className === CohortType.Or;
  }

  get isSingleCohort() {
    return this.className === CohortType.Single;
  }

  static fromObject(obj: CohortFilter & object): CohortFilter {
    switch (obj.className) {
      case CohortType.Single:
        return SingleCohortFilter.fromObject(obj);
      case CohortType.And:
        return AndCohortFilter.fromObject(obj);
      case CohortType.Or:
        return OrCohortFilter.fromObject(obj);
      default:
        throw new UnsupportedException(`unsupported cohort ${obj.className}`);
    }
  }
}

export class SingleCohortFilter extends CohortFilter {
  constructor(
    public eventName: string,
    public eventOperator: EventOperator,
    public aggregationType: AggregationType,
    public operator: CompareOperator,
    public dateRange: DateRange,
    public value: any = 0,
    public rangeValue: RangeValue<any> = { from: 0, to: 0 },
    public values: any[] = []
  ) {
    super(CohortType.Single);
  }

  get isSingleValue() {
    switch (this.operator) {
      case CompareOperator.Equal:
      case CompareOperator.NotEqual:
      case CompareOperator.Gt:
      case CompareOperator.Gte:
      case CompareOperator.Lt:
      case CompareOperator.Lte:
      case CompareOperator.Contain:
      case CompareOperator.NotContain:
        return true;
      default:
        return false;
    }
  }

  get isRangeValue() {
    switch (this.operator) {
      case CompareOperator.Between:
      case CompareOperator.NotBetween:
        // case CompareOperator.BetweenAndIncluding:
        // case CompareOperator.NotBetweenAndIncluding:
        return true;
      default:
        return false;
    }
  }

  get isMultipleValue() {
    return false;
    // in & not in not supported
    // switch (this.operator) {
    //   case CompareOperator.In:
    //   case CompareOperator.NotIn:
    //     return true;
    //   default:
    // }
  }

  static isSingleCohort(obj?: CohortFilter | null): obj is SingleCohortFilter {
    return obj?.isSingleCohort ?? false;
  }

  static fromEventName(eventName: string) {
    return new SingleCohortFilter(eventName, EventOperator.Did, AggregationType.CountDistinct, CompareOperator.Gt, DateUtils.getLast30Days());
  }
}

export abstract class MultiCohortFilter extends CohortFilter {
  abstract cohorts: SingleCohortFilter[];

  static isMultiCohort(cohort?: CohortFilter | null): cohort is CohortFilter {
    return cohort != null && !cohort.isSingleCohort;
  }
}

export class AndCohortFilter extends MultiCohortFilter {
  cohorts: SingleCohortFilter[];

  constructor(cohorts: SingleCohortFilter[] = []) {
    super(CohortType.And);
    this.cohorts = cohorts;
  }

  static fromObject(obj: any): MultiCohortFilter {
    const cohorts: SingleCohortFilter[] = obj.cohorts.map((cohort: any) => SingleCohortFilter.fromObject(cohort));
    return new AndCohortFilter(cohorts);
  }
}

export class OrCohortFilter extends CohortFilter {
  cohorts: SingleCohortFilter[];

  constructor(cohorts: SingleCohortFilter[] = []) {
    super(CohortType.Or);
    this.cohorts = cohorts;
  }

  static fromObject(obj: any): OrCohortFilter {
    const cohorts: SingleCohortFilter[] = obj.cohorts.map((cohort: any) => SingleCohortFilter.fromObject(cohort));
    return new OrCohortFilter(cohorts);
  }
}

export const CohortActionName = {
  ViewCustomers: 'View Customers',
  CohortAnalysis: 'Cohort Analysis',
  Duplicate: 'Duplicate',
  Share: 'Share',
  Delete: 'Delete'
};
