/*
 * @author: tvc12 - Thien Vi
 * @created: 4/7/22, 2:28 PM
 */

import { CohortInfo } from '@core/cdp';
import { CohortFilter, MultiCohortFilter, SingleCohortFilter } from '@/screens/cdp/components/cohort-filter/CohortFilter';
import { ConditionType, FunctionType } from '@core/common/domain';
import { IdGenerator } from '@/utils/IdGenerator';
import { RandomUtils } from '@/utils';

export enum FilterGroupOperator {
  And = 'and',
  Or = 'or'
}

export class FilterGroup {
  id: string;
  constructor(
    public cohorts: CohortInfo[] = [],
    public filters: SingleCohortFilter[] = [],
    public cohortOperator: FilterGroupOperator = FilterGroupOperator.And,
    public filterOperator: FilterGroupOperator = FilterGroupOperator.And,
    public nextOperator: FilterGroupOperator = FilterGroupOperator.And
  ) {
    this.id = RandomUtils.nextString();
  }

  get isAndCohorts(): boolean {
    return this.cohortOperator === FilterGroupOperator.And;
  }

  set isAndCohorts(value: boolean) {
    this.cohortOperator = value ? FilterGroupOperator.And : FilterGroupOperator.Or;
  }

  get isAndFilters(): boolean {
    return this.filterOperator === FilterGroupOperator.And;
  }

  set isAndFilters(value: boolean) {
    this.filterOperator = value ? FilterGroupOperator.And : FilterGroupOperator.Or;
  }

  get isAndWithNext(): boolean {
    return this.nextOperator === FilterGroupOperator.And;
  }

  set isAndWithNext(value: boolean) {
    this.nextOperator = value ? FilterGroupOperator.And : FilterGroupOperator.Or;
  }

  get isEmpty(): boolean {
    return this.cohorts.length + this.filters.length <= 0;
  }

  static default() {
    return new FilterGroup();
  }

  static fromEventName(eventName: string) {
    return new FilterGroup([], [SingleCohortFilter.fromEventName(eventName)]);
  }

  static fromCohort(cohort: CohortInfo) {
    return new FilterGroup([cohort], []);
  }
}
