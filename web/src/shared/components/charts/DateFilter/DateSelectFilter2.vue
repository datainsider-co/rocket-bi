<template>
  <div class="filter-date-select-container">
    <DiCalendar
      ref="diCalendar"
      :id="`${id}`"
      :isHiddenCompareToSection="true"
      :isShowResetFilterButton="false"
      :mainDateFilterMode="mainDateFilterMode"
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
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { DateRange, DateTimeConstants } from '@/shared';
import moment from 'moment';
import { DateTimeFormatter, DateUtils, ListUtils, RandomUtils } from '@/utils';
import { MainDateMode } from '@core/domain';
import DiCalendar from '@filter/MainDateFilterV2/DiCalendar.vue';
import { CalendarData } from '@/shared/models';
import { Log } from '@core/utils';

@Component({ components: { DiCalendar } })
export default class DateSelectFilter2 extends Vue {
  private readonly MainDateModeOptions = DateTimeConstants.ListDateRangeModeOptions;
  private id = RandomUtils.nextInt(0, 10000);

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  @Prop({ type: Array, default: () => [] })
  dates!: string[];

  private isShowCalendar = false;

  private get defaultDateRange(): DateRange | undefined {
    Log.debug('defaultDateRange::', this.dates, ListUtils.isNotEmpty(this.dates));
    if (ListUtils.isNotEmpty(this.dates)) {
      return {
        start: moment(this.dates[0]).toDate(),
        end: moment(this.dates[1]).toDate()
      };
    } else {
      return void 0;
    }
  }

  private get mainDateFilterMode(): MainDateMode {
    if (this.defaultDateRange) {
      return MainDateMode.custom;
    } else {
      return MainDateMode.allTime;
    }
  }

  private handleCalendarSelected(calendarData: CalendarData) {
    Log.debug('handleCalendarSelected', calendarData);
    const dates = [];
    switch (calendarData.filterMode) {
      case MainDateMode.allTime:
        break;
      default:
        if (calendarData.chosenDateRange) {
          dates.push(DateTimeFormatter.formatDate(calendarData.chosenDateRange.start), DateTimeFormatter.formatDate(calendarData.chosenDateRange.end));
        }
        break;
    }
    this.$emit('selected', dates);
  }

  private get dateRange(): string {
    if (ListUtils.isNotEmpty(this.dates)) {
      const startDate = DateTimeFormatter.formatAsDDMMYYYY(this.dates[0]);
      const endDate = DateTimeFormatter.formatAsDDMMYYYY(this.dates[1]);
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
