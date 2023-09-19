<template>
  <div class="filter-date-select-container">
    <DiCalendar
      ref="diCalendar"
      :id="`${id}`"
      :isHiddenCompareToSection="true"
      :isShowResetFilterButton="false"
      :mainDateFilterMode="mainDateMode"
      :defaultDateRange="defaultDateRange"
      :mode-options="MainDateModeOptions"
      :get-date-range-by-mode="getDateRangeByMode"
      applyTextButton="Ok"
      placement="bottomLeft"
      @togglePicker="onCalendarShow"
      @onCalendarSelected="handleCalendarSelected"
    >
      <template #content>
        <div class="d-flex flex-row justify-content-between w-100">
          <div>{{ dateRange }}</div>
          <div class="icon-dropdown" :class="iconClass">
            <slot name="icon-dropdown">
              <img alt="dropdown" src="@/assets/icon/ic-16-arrow-down.svg" />
            </slot>
          </div>
        </div>
      </template>
    </DiCalendar>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { DateRange, DateTimeConstants } from '@/shared';
import moment from 'moment';
import { DateTimeUtils, DateUtils, ListUtils, RandomUtils } from '@/utils';
import { MainDateMode } from '@core/common/domain';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { CalendarData } from '@/shared/models';
import { Log } from '@core/utils';
import { DateFilterData } from '@chart/date-filter/DateFilterData';
import { DateFilterUtils } from '@chart/date-filter/DateFilterUtils';

@Component({ components: { DiCalendar } })
export default class DateSelectFilter2 extends Vue {
  private readonly MainDateModeOptions = DateTimeConstants.DATE_RANGE_MODE_OPTION_LIST;
  private id = RandomUtils.nextInt(0, 10000);
  private readonly dateMode = MainDateMode.custom;

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  @Prop({ required: true })
  filterData!: DateFilterData;

  private localValue = this.filterData;

  private mainDateMode: MainDateMode = this.filterData.mode;

  private isShowCalendar = false;

  @Watch('filterData', { deep: true })
  onFilterDataChanged() {
    this.localValue = this.filterData;
  }

  private get defaultDateRange(): DateRange | undefined {
    if (ListUtils.isNotEmpty(this.localValue.dates)) {
      return {
        start: moment(this.localValue.dates[0]).toDate(),
        end: moment(this.localValue.dates[1]).toDate()
      };
    } else {
      return void 0;
    }
  }

  private handleCalendarSelected(calendarData: CalendarData) {
    Log.debug('handleCalendarSelected::', calendarData);
    const dates = [];
    switch (calendarData.filterMode) {
      case MainDateMode.allTime:
        break;
      default:
        {
          if (calendarData.chosenDateRange) {
            dates.push(DateTimeUtils.formatDate(calendarData.chosenDateRange.start), DateTimeUtils.formatDate(calendarData.chosenDateRange.end, true));
          }
        }
        break;
    }
    this.localValue = {
      dates: dates,
      mode: calendarData.filterMode
    };
    this.$emit('selected', dates, calendarData.filterMode);
  }

  private get dateRange(): string {
    if (ListUtils.isNotEmpty(this.localValue.dates)) {
      const startDate = DateTimeUtils.formatAsDDMMYYYY(this.localValue.dates[0]);
      const endDate = DateTimeUtils.formatAsDDMMYYYY(this.localValue.dates[1]);
      return `${startDate} - ${endDate}`;
    }
    return 'All Time';
  }

  private onCalendarShow(show: boolean) {
    this.isShowCalendar = show;
  }

  private get iconClass() {
    return {
      'showing-calender': this.isShowCalendar
    };
  }
}
</script>

<style lang="scss">
.filter-date-select-container {
  border: solid #d6d6d6 1px !important;
  border-radius: 4px;
  width: 100%;
  height: 32px;
  color: var(--text-color);

  .di-calendar-input-container {
    height: 32px;

    span {
      text-align: left !important;
      width: 100%;

      input {
        width: fit-content;
      }
    }

    .icon-dropdown {
      &.showing-calender {
        transform: rotate(180deg);
      }
    }
  }
}
</style>
