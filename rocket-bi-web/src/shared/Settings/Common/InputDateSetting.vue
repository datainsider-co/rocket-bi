<template>
  <div :class="{ 'disabled-setting': disable }" class="input-date-setting setting-container dropdown-setting no-gutters">
    <p v-if="label != null" class="label text-break mb-2">{{ label }}</p>
    <div class="calendar-area">
      <DiCalendar
        ref="diCalendar"
        :id="id"
        :custom-class="diCalendarClass"
        :defaultDateRange="dateRange"
        :get-date-range-by-mode="getDateRangeByMode"
        :isShowResetFilterButton="false"
        :mainDateFilterMode="dateMode"
        :mode-options="modeOptions"
        @onCalendarSelected="onCalendarChanged"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator';
import DiCalendar from '@filter/MainDateFilterV2/DiCalendar.vue';
import { CalendarData } from '@/shared/models';
import { DateRange, DateTimeConstants } from '@/shared';
import { DataRange, MainDateMode } from '@core/domain';
import { DateUtils } from '@/utils';
import { ComparisonUtils } from '@core/utils/ComparisonUtils';

export enum InputDateType {
  DateRange = 'date_range',
  DateCompare = 'date_compare'
}

@Component({
  components: {
    DiCalendar
  }
})
export default class InputDateSetting extends Vue {
  @Prop({ required: true, type: String })
  private readonly id!: string;

  @Prop({ required: false, type: String })
  private readonly label!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  @Prop({ required: true })
  private readonly dateRange!: DateRange;

  @Prop({ required: true })
  private readonly dateMode!: MainDateMode;

  @Prop({ required: false, type: String, default: InputDateType.DateRange })
  private readonly inputDateType!: InputDateType;

  @Prop({ required: false })
  private readonly defaultDataRange!: DataRange | null;

  @Ref()
  private readonly diCalendar!: DiCalendar;

  private get modeOptions() {
    if (this.inputDateType === InputDateType.DateRange) {
      return DateTimeConstants.ListDateRangeModeOptions;
    } else {
      return DateTimeConstants.ListCompareModeOptions;
    }
  }

  private get diCalendarClass() {
    if (this.inputDateType === InputDateType.DateRange) {
      return 'di-calendar-date-range';
    } else {
      return 'di-calendar-date-compare';
    }
  }

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    if (this.inputDateType === InputDateType.DateRange) {
      return DateUtils.getDateRange(mode);
    } else {
      if (this.defaultDataRange) {
        const dateRange: DateRange =
          ComparisonUtils.getDateRange(this.defaultDataRange.mode ?? MainDateMode.custom) ?? this.defaultDataRange.dateRange ?? DateUtils.getAllTime();
        return DateUtils.getPeriodDateRange(mode, dateRange);
      } else {
        return null;
      }
    }
  }

  @Emit('onDateChanged')
  private onCalendarChanged(calendarData: CalendarData) {
    return calendarData;
  }

  setDateRange(dateRange: DateRange | null) {
    this.diCalendar.applyDateRange(dateRange);
  }
}
</script>

<style lang="scss">
.input-date-setting .calendar-area {
  background-color: var(--hover-color);
  width: 100%;

  .di-calendar-input-container {
    > span {
      flex: 1;
      //order: 0;

      > input {
        margin-left: 0;
        text-align: left;
      }
    }

    > img {
      opacity: var(--normal-opacity) !important;
      //order: 1;
    }

    > div.icon-title {
      order: 1;
    }
  }
}

.di-calendar-date-compare .select-container {
  min-width: 120px !important;
  width: unset !important;
}
</style>
