<template>
  <VueContext ref="calendarMenu" :close-on-click="false" tab="div" @close="resetDate">
    <v-calendar
      v-if="value"
      ref="calendar"
      mode="single"
      :attributes="datePickerAttrs"
      :locale="locale"
      :masks="{ input: ['DD/MM/YYYY'] }"
      :max-date="maxDate"
      :min-date="minDate"
      :popover="{ visibility: 'visible', positionFixed: true }"
      class="di-date-picker"
      color="blue"
      isDark
      @dayclick="handleDayClick"
    >
    </v-calendar>
  </VueContext>
</template>
<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import VueContext from 'vue-context';
import { MouseEventData } from '@chart/BaseChart';
import { DateUtils } from '@/utils';
import { Log, ObjectUtils } from '@core/utils';
import moment from 'moment';
import { clone, cloneDeep } from 'lodash';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';

export interface CalendarPickerOptions {
  minDate?: Date;
  maxDate?: Date;
}

@Component({ components: { VueContext } })
export default class CalendarContextMenu extends Vue {
  minDate: Date = this.formatDate(DateUtils.DefaultMinDate);
  maxDate: Date = this.formatDate(DateUtils.DefaultMaxDate);
  value: Date | null = null;

  private readonly isHighlightToday: boolean = true;
  @Ref()
  private readonly calendarMenu?: VueContext;

  @Prop({ required: false, default: DateUtils.DefaultLocale })
  private readonly locale!: string;

  private onDateSelected?: (newDate: Date) => void;

  private get datePickerAttrs() {
    const selectedDate = {
      highlight: true,
      dates: this.value
    };
    const today = {
      highlight: {
        color: 'blue',
        fillMode: 'outline',
        contentClass: 'highlight-solid'
      },
      dates: new Date()
    };
    if (this.isHighlightToday) {
      return [today, selectedDate];
    } else {
      return [selectedDate];
    }
  }

  @Watch('date')
  onChange(newDate: Date | string) {
    this.$emit('change', newDate);
  }

  show(event: MouseEventData<Date>, onDateSelected?: (newDate: Date) => void, options?: CalendarPickerOptions) {
    try {
      event.event.stopPropagation();
      this.hideContextMenu();
      this.resetDate();
      this.setDate(event.data, onDateSelected, options);
      this.openContextMenu(event.event, event.extraData.target);
    } catch (e) {
      Log.error('CalendarContextMenu:: show::', e);
    }
  }

  hide() {
    try {
      this.resetDate();
      this.hideContextMenu();
    } catch (e) {
      Log.error('CalendarContextMenu:: show::', e);
    }
  }

  private hideContextMenu() {
    this?.calendarMenu?.close();
  }

  private openContextMenu(event: MouseEvent, targetElement: string) {
    this.$nextTick(() => {
      //@ts-ignore
      this.$refs.calendar?.move(this.value);
      const position: any = HtmlElementRenderUtils.fixMenuOverlapForContextMenu(event, targetElement);
      this.calendarMenu?.open(position, {});
    });
  }

  private handleDayClick(newDate: Date) {
    //Not remove prop id date,
    //@ts-ignore
    const date = this.formatDate(newDate.id);
    Log.debug('handleDayClick', this.onDateSelected, this.isDateValid(date));
    if (this.onDateSelected && this.isDateValid(date)) {
      this.onDateSelected(date);
    }
    this.hideContextMenu();
  }

  private setDate(data: Date, onDateSelected: ((newDate: Date) => void) | undefined, options: CalendarPickerOptions | undefined) {
    this.value = this.formatDate(cloneDeep(data));
    this.onDateSelected = onDateSelected;
    if (options) {
      const { minDate, maxDate } = options;
      this.minDate = this.formatDate(minDate ?? this.minDate);
      this.maxDate = this.formatDate(maxDate ?? this.maxDate);
    }
  }

  private resetDate() {
    this.value = null;
    this.onDateSelected = void 0;
    this.minDate = this.formatDate(DateUtils.DefaultMinDate);
    this.maxDate = this.formatDate(DateUtils.DefaultMaxDate);
    this.$forceUpdate();
  }

  private isDateValid(date: Date): boolean {
    const minDate = this.minDate ?? DateUtils.DefaultMinDate;
    const maxDate = this.maxDate ?? DateUtils.DefaultMaxDate;
    return minDate <= date && date <= maxDate;
  }

  private formatDate(date: any): Date {
    return moment(date).toDate();
  }
}
</script>

<style lang="scss" scoped src="./calendar.scss" />
