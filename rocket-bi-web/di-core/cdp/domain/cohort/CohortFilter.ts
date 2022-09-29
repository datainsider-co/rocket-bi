/* eslint-disable @typescript-eslint/no-use-before-define */

/*
 * @author: tvc12 - Thien Vi
 * @created: 4/6/22, 3:31 PM
 */

import { AggregationFilter, CohortType, EventOperator, RangeValue } from '@core/cdp';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';
import { ListUtils } from '@/utils';

export abstract class CohortFilter {
  protected constructor(public className: CohortType) {}

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
  eventName: string;
  dateRange: RangeValue<number>;
  aggregationFilter: AggregationFilter;
  eventOperator: EventOperator;

  constructor(eventName: string, eventOperator: EventOperator = EventOperator.Did, aggregationFilter: AggregationFilter, dateRange: RangeValue<number>) {
    super(CohortType.Single);
    this.eventName = eventName;
    this.eventOperator = eventOperator;
    this.aggregationFilter = aggregationFilter;
    this.dateRange = dateRange;
  }

  static fromObject(obj: any): SingleCohortFilter {
    const aggregationFilter: AggregationFilter = AggregationFilter.fromObject(obj.aggregationFilter);
    return new SingleCohortFilter(obj.eventName, obj.eventOperator ?? EventOperator.Did, aggregationFilter, obj.dateRange);
  }
}

export class AndCohortFilter extends CohortFilter {
  cohorts: CohortFilter[];

  constructor(cohorts: CohortFilter[]) {
    super(CohortType.And);
    this.cohorts = cohorts;
  }

  add(cohort: CohortFilter) {
    this.cohorts.push(cohort);
  }

  isEmpty(): boolean {
    return ListUtils.isEmpty(this.cohorts);
  }

  isNotEmpty(): boolean {
    return !this.isEmpty();
  }

  static default(): AndCohortFilter {
    return new AndCohortFilter([]);
  }

  static fromObject(obj: any): CohortFilter {
    const cohorts: CohortFilter[] = obj.cohorts.map((cohort: any) => CohortFilter.fromObject(cohort));
    return new AndCohortFilter(cohorts);
  }
}

export class OrCohortFilter extends CohortFilter {
  cohorts: CohortFilter[];

  constructor(cohorts: CohortFilter[]) {
    super(CohortType.Or);
    this.cohorts = cohorts;
  }

  isEmpty(): boolean {
    return ListUtils.isEmpty(this.cohorts);
  }

  isNotEmpty(): boolean {
    return !this.isEmpty();
  }

  static default(): OrCohortFilter {
    return new OrCohortFilter([]);
  }

  add(cohort: CohortFilter) {
    this.cohorts.push(cohort);
  }

  static fromObject(obj: any): OrCohortFilter {
    const cohorts: CohortFilter[] = obj.cohorts.map((cohort: any) => CohortFilter.fromObject(cohort));
    return new OrCohortFilter(cohorts);
  }
}
