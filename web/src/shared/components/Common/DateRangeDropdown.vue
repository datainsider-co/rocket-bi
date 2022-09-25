<template>
  <DiCalendar
    class="date-range-dropdown btn-ghost"
    :id="id"
    :mainDateFilterMode="dateMode"
    :isShowResetFilterButton="false"
    :defaultDateRange="dateRange"
    :modeOptions="DateRangeOptions"
    dateFormatPattern="MMM D, YYYY"
    @onCalendarSelected="onCalendarChanged"
    :get-date-range-by-mode="getDateRangeByMode"
  >
    <template #icon>
      <DownIcon icon-size="16"></DownIcon>
    </template>
  </DiCalendar>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import DiCalendar from '@filter/MainDateFilterV2/DiCalendar.vue';
import { DateRange, DateTimeConstants } from '@/shared';
import { MainDateMode } from '@core/domain';
import { CalendarData } from '@/shared/models';
import { DateUtils } from '@/utils';
import { InputDateType } from '@/shared/Settings/Common/InputDateSetting.vue';
@Component({
  components: { DiCalendar }
})
export default class DateRangeDropdown extends Vue {
  private readonly DateRangeOptions = DateTimeConstants.ListDateRangeModeOptions;

  @Prop({ required: true, type: String })
  private readonly id!: string;

  @Prop({ required: true })
  private readonly dateRange!: DateRange;

  @Prop({ required: true, type: String })
  private readonly dateMode!: MainDateMode;

  @Emit('dateChanged')
  private onCalendarChanged(calendarData: CalendarData) {
    return calendarData;
  }

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.date-range-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px;

  > svg {
    order: 1;
  }

  > span {
    margin: 0;
    > input {
      margin: 0 !important;
      padding: 0 !important;
      height: unset !important;
      pointer-events: none;
      letter-spacing: 0.23px !important;
      color: var(--secondary-text-color) !important;
      //@include regular-text(0.23px, var(--secondary-text-color));
    }
  }
}
</style>
