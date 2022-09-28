/*
 * @author: tvc12 - Thien Vi
 * @created: 4/7/22, 3:21 PM
 */

import * as ui from './CohortFilter.entity';
import * as core from '@core/CDP/Domain';
import { AggregationFilter } from '@core/CDP/Domain';
import { DateUtils, ListUtils } from '@/utils';
import { FilterGroup } from '@/screens/CDP/components/CohortFilter/FilterGroup.entity';

export class UICohortFilterUtils {
  /**
   * Build cohorts of ui to cohort filter
   * Cohort Filter được build ra với cấu trúc sau.
   * + OrCohort -> AndCohort -> AndCohort hoặc OrCohort -> SingleCohort
   * + OrCohort -> OrCohort hoặc AndCohort -> SingleCohort
   * Ex:
   * OrCohort(
   *  AndCohort(
   *    OrCohort(SingleCohort1, SingleCohort2, SingleCohort3),
   *    AndCohort(SingleCohort1, SingleCohort2, SingleCohort3),
   *    OrCohort(SingleCohort1, SingleCohort2, SingleCohort3),
   *    ... (Chỉ Or Hoặc And Cohort)
   *  ),
   *  OrCohort(SingleCohort1, SingleCohort2, SingleCohort3, ... (Chỉ SingleCohort)),
   *  .... (Chỉ OrCohort hoặc AndCohort theo ui)
   *)
   *
   */
  static toCohortFilter(filterGroups: FilterGroup[]): core.CohortFilter | null {
    if (ListUtils.isEmpty(filterGroups)) {
      return null;
    } else {
      const rootFilter = new core.OrCohortFilter([]);
      let andCohort: core.AndCohortFilter = core.AndCohortFilter.default();
      filterGroups.forEach(filterGroup => {
        const filters: core.SingleCohortFilter[] = filterGroup.filters.map(filter => this.toSingleFilter(filter));
        if (ListUtils.isNotEmpty(filters)) {
          const currentCohort = filterGroup.isAndFilters ? new core.AndCohortFilter(filters) : new core.OrCohortFilter(filters);
          if (filterGroup.isAndWithNext) {
            andCohort.add(currentCohort);
          } else {
            // add and cohort to root, cause next condition is or group filter
            if (andCohort.isNotEmpty()) {
              rootFilter.add(andCohort);
              andCohort = core.AndCohortFilter.default();
            }
            rootFilter.add(currentCohort);
          }
        }
      });
      // ensure don't missing and group
      if (andCohort.isNotEmpty()) {
        rootFilter.add(andCohort);
      }
      return rootFilter;
    }
  }

  private static toSingleFilter(cohortFilter: ui.SingleCohortFilter): core.SingleCohortFilter {
    const aggregationFilter: core.AggregationFilter = UICohortFilterUtils.toAggregationFilter(cohortFilter);
    return new core.SingleCohortFilter(
      cohortFilter.eventName,
      cohortFilter.eventOperator,
      aggregationFilter,
      DateUtils.toTimestampRange(cohortFilter.dateRange)
    );
  }

  private static toAggregationFilter(cohortFilter: ui.SingleCohortFilter): core.AggregationFilter {
    const filter = new AggregationFilter(cohortFilter.aggregationType, cohortFilter.operator);
    if (cohortFilter.isSingleValue) {
      filter.singleValue = cohortFilter.value;
    }
    if (cohortFilter.isMultipleValue) {
      filter.listValue = cohortFilter.values;
    }
    if (cohortFilter.isRangeValue) {
      filter.rangeValue = cohortFilter.rangeValue;
    }

    return filter;
  }
}
