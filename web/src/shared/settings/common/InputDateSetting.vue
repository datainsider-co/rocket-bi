<template>
  <div :class="{ 'disabled-setting': disable }" class="input-date-setting setting-container dropdown-setting no-gutters">
    <div v-if="showHint || isLabel" class="label d-flex flex-row align-items-center">
      <p v-if="isLabel">{{ label }}</p>
      <span v-if="showHint" class="di-icon-help ml-2" v-b-tooltip.auto="hint"></span>
    </div>
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
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { CalendarData } from '@/shared/models';
import { DateRange, DateTimeConstants } from '@/shared';
import { DataRange, MainDateMode } from '@core/common/domain';
import { DateUtils, StringUtils } from '@/utils';
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
  @Prop({ type: String, default: '' })
  private readonly hint!: string;
  @Ref()
  private readonly diCalendar!: DiCalendar;

  private get modeOptions() {
    if (this.inputDateType === InputDateType.DateRange) {
      return DateTimeConstants.DATE_RANGE_MODE_OPTION_LIST;
    } else {
      return DateTimeConstants.COMPARE_MODE_OPTION_LIST;
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

  private get showHint(): boolean {
    return StringUtils.isNotEmpty(this.hint);
  }

  private get isLabel(): boolean {
    return StringUtils.isNotEmpty(this.label);
  }
}
</script>
