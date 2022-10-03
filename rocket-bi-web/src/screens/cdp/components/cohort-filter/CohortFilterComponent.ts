import { Component, Model, Prop, Ref, Vue } from 'vue-property-decorator';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { AggregationType, CohortInfo, CompareOperator, EventOperator } from '@core/cdp';
import { MainDateMode } from '@core/common/domain';
import { AggregationFunctionTypes, DateRange, DateTimeConstants, NumberConditionTypes, SelectOption } from '@/shared';
import { DateUtils, ListUtils } from '@/utils';
import { CalendarData } from '@/shared/models';
import { Log } from '@core/utils';
import { CohortFilter, SingleCohortFilter } from '@/screens/cdp/components/cohort-filter/CohortFilter';
import { FilterGroup } from '@/screens/cdp/components/cohort-filter/FilterGroup';
import SelectStepPopover, { TabType } from '@/screens/cdp/components/select-step-popover/SelectStepPopover.vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';

@Component({
  components: {
    DiCalendar: DiCalendar,
    SelectStepPopover,
    DiDropdown
  }
})
export default class CohortFilterComponent extends Vue {
  private readonly DateRangeOptions = DateTimeConstants.ListDateRangeModeOptions;
  private readonly DateMode: MainDateMode = MainDateMode.custom;

  @Prop({ required: false, type: String, default: 'cohort-filter' })
  private readonly id!: string;

  @Model('change', { required: false, type: Array, default: () => [] })
  private value!: FilterGroup[];

  @Ref()
  private selectStepPopover!: SelectStepPopover;

  @Prop({ type: Boolean, default: false })
  private hideSaveActions!: boolean;

  private get operatorOptions(): SelectOption[] {
    return [
      { id: CompareOperator.Equal, displayName: NumberConditionTypes.equal },
      { id: CompareOperator.NotEqual, displayName: NumberConditionTypes.notEqual },
      { id: CompareOperator.Gt, displayName: NumberConditionTypes.greaterThan },
      { id: CompareOperator.Gte, displayName: NumberConditionTypes.greaterThanOrEqual },
      { id: CompareOperator.Lt, displayName: NumberConditionTypes.lessThan },
      { id: CompareOperator.Lte, displayName: NumberConditionTypes.lessThanOrEqual },
      { id: CompareOperator.Between, displayName: NumberConditionTypes.between }
    ];
  }

  protected readonly MapAggregationType = {
    [AggregationType.CountAll]: AggregationFunctionTypes.countAll,
    [AggregationType.CountDistinct]: AggregationFunctionTypes.countOfDistinct
  };

  protected readonly MapEventOperatorType = {
    [EventOperator.Did]: 'did',
    [EventOperator.DidNotDo]: 'did not do'
  };

  private get aggregationTypes(): AggregationType[] {
    return Object.keys(this.MapAggregationType) as AggregationType[];
  }

  private get eventOperatorTypes(): EventOperator[] {
    return Object.keys(this.MapEventOperatorType) as EventOperator[];
  }

  private onCalendarSelected(cohort: SingleCohortFilter, e: CalendarData) {
    Log.info(cohort, e);
    cohort.dateRange = e.chosenDateRange ?? cohort.dateRange;
  }

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  private quickAddFilter(e: MouseEvent) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event, TabType.Cohort], {
      callback: (data: string | CohortInfo, tabType: TabType) => {
        switch (tabType) {
          case TabType.Event:
            this.value.push(FilterGroup.fromEventName(data as string));
            break;
          case TabType.Cohort:
            this.value.push(FilterGroup.fromCohort(data as CohortInfo));
            break;
        }
        this.$emit('addGroup');
      }
    });
  }

  private addFilter(e: MouseEvent, group: FilterGroup) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event, TabType.Cohort], {
      callback: (data: string | CohortInfo, tabType: TabType) => {
        switch (tabType) {
          case TabType.Event:
            group.filters.push(SingleCohortFilter.fromEventName(data as string));
            break;
          case TabType.Cohort:
            group.cohorts.push(data as CohortInfo);
            break;
        }
      }
    });
  }

  private removeFilter(group: FilterGroup, cohortFilter: CohortFilter) {
    group.filters = group.filters.filter(f => f !== cohortFilter);
    if (group.isEmpty) {
      const value = ListUtils.remove(this.value, item => item.id === group.id);
      this.$emit('change', value);
    }
  }

  private removeCohort(group: FilterGroup, cohort: CohortInfo) {
    group.cohorts = group.cohorts.filter(c => c !== cohort);
    if (group.isEmpty) {
      const value = ListUtils.remove(this.value, item => item.id === group.id);
      this.$emit('change', value);
    }
  }

  private toggleGroupCohortOperator(group: FilterGroup) {
    group.isAndCohorts = !group.isAndCohorts;
  }

  private toggleGroupFilterOperator(group: FilterGroup) {
    group.isAndFilters = !group.isAndFilters;
  }

  private toggleGroupNextOperator(group: FilterGroup) {
    group.isAndWithNext = !group.isAndWithNext;
  }

  private changeCohort(group: FilterGroup, cohort: CohortInfo, e: MouseEvent) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Cohort], {
      callback: (newCohort: CohortInfo) => {
        const idx = group.cohorts.indexOf(cohort);
        if (idx >= 0) {
          this.$set(group.cohorts, idx, newCohort);
        }
      }
    });
  }

  private changeEvent(group: FilterGroup, cohortFilter: SingleCohortFilter, e: MouseEvent) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event], {
      callback: (eventName: string) => {
        const idx = group.filters.indexOf(cohortFilter);
        if (idx >= 0 && group.filters[idx].isSingleCohort) {
          (group.filters[idx] as SingleCohortFilter).eventName = eventName;
        }
      }
    });
  }

  private clearAll() {
    this.value = [];
  }

  private save() {
    //
  }

  private isSingleValue(cohort: SingleCohortFilter) {
    return cohort.isSingleValue;
  }

  private isRangeValue(cohort: SingleCohortFilter) {
    return cohort.isRangeValue;
  }
}
