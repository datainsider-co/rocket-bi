<template>
  <div class="w-100">
    <DiCalendar
      id="main-date"
      @onCalendarSelected="handleCalendarSelected"
      :mainDateFilterMode="mainDateFilterMode"
      :canEditCalendar="canEditMainDateFilter"
      :defaultDateRange="defaultDateRange"
      :mode-options="MainDateModeOptions"
      :get-date-range-by-mode="getDateRangeByMode"
      :isShowRemove="canEditMainDateFilter"
      @remove="handleRemoveMainDateFilter"
    />
  </div>
</template>

<script lang="ts">
import { DashboardControllerModule, FilterModule } from '@/screens/dashboard-detail/stores';
import { Log } from '@core/utils';
import { Component, Inject, Prop, Vue } from 'vue-property-decorator';
import { DateRange, DateTimeConstants } from '@/shared';
import { MainDateFilter2, MainDateMode } from '@core/common/domain/model';
import { CalendarData } from '@/shared/models';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { DashboardModule } from '@/screens/dashboard-detail/stores/dashboard/DashboardStore';
import { DateUtils } from '@/utils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';

@Component({
  components: {
    DiCalendar
  }
})
export default class MainDateFilter extends Vue {
  private readonly MainDateModeOptions = DateTimeConstants.DATE_RANGE_MODE_OPTION_LIST;

  @Prop({ required: true })
  private readonly mainDateFilterMode!: MainDateMode;

  @Prop()
  private readonly defaultDateRange!: DateRange;

  @Prop({ required: true })
  private canEditMainDateFilter!: boolean;

  // Inject from DashboardHeader.vue
  @Inject({ default: undefined })
  private applyMainDateFilter?: (calendar: CalendarData) => void;

  // Inject from DashboardHeader.vue
  @Inject({ default: undefined })
  private applyMainDateAllTime?: () => void;

  private handleCalendarSelected(calendarData: CalendarData) {
    DashboardModule.saveMainDate({
      mode: calendarData.filterMode,
      chosenDateRange: calendarData.chosenDateRange
    });
    Log.debug('MainDateFilter::handleCalendarSelected', calendarData, calendarData.isAllTime);
    if (calendarData.isAllTime && this.applyMainDateAllTime) {
      this.applyMainDateAllTime();
    } else if (this.applyMainDateFilter) {
      this.applyMainDateFilter(calendarData);
    }
  }

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  private async handleRemoveMainDateFilter() {
    try {
      //@ts-ignore
      const { isConfirmed } = await this.$alert.fire({
        icon: 'warning',
        title: 'Remove main date filter',
        html: `Are you sure that you want to remove the main date filter?`,
        confirmButtonText: 'Yes',
        showCancelButton: true,
        cancelButtonText: 'No'
      });
      if (!isConfirmed) return;
      if (DashboardModule.id) {
        await DashboardModule.handleRemoveMainDateFilter(DashboardModule.id);
        DashboardModule.setMainDateFilter(null);
        FilterModule.removeMainDateData();
        DashboardModule.updateMainDateFilter(void 0);
        await DashboardControllerModule.applyDynamicValues({
          id: MainDateFilter2.MAIN_DATE_ID,
          valueMap: void 0
        });
      } else {
        //@ts-ignore
        await this.$alert.fire({
          icon: 'error',
          title: 'Remove the main date filter Failed',
          confirmButtonText: 'OK',
          showCancelButton: false
        });
      }
    } catch (e) {
      //@ts-ignore
      await this.$alert.fire({
        icon: 'error',
        title: 'Remove the main date filter Failed',
        confirmButtonText: 'OK',
        showCancelButton: false
      });
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.hover {
  cursor: pointer;
}

img.ic-16 {
  margin-right: 8px;
}

.date-input {
  opacity: 0.5;
  @include regular-text;
}
</style>
