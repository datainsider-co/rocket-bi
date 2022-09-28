import { Component, Emit, Inject, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { CompareMode, DateModeOption, DateRange } from '@/shared';
import { DateUtils } from '@/utils';
import { CalendarData } from '@/shared/models';
import DiDropdown from '@/shared/components/Common/DiDropdown/DiDropdown.vue';
import { MainDateMode } from '@core/domain/Model';
import { cloneDeep } from 'lodash';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils/string.utils';

@Component({
  components: {
    DiDropdown
  }
})
export default class DiCalendar extends Vue {
  @Prop({ required: false, type: String, default: '' })
  private readonly id!: string;

  // @Prop({ type: Date, default: () => new Date() })
  // private readonly maxDate!: Date;
  //
  // @Prop({ type: Date, default: null })
  // private readonly minDate!: Date;

  @Prop({ type: String, default: 'bottom' })
  private readonly placement!: string;

  @Prop({ type: Boolean, default: false })
  private readonly isHiddenCompareToSection!: boolean;

  @Prop({ type: Boolean, default: true })
  private readonly isShowAllTime!: boolean;

  @Prop({ type: Boolean, default: true })
  private readonly isShowIconDate!: boolean;

  @Prop({ required: true })
  private readonly mainDateFilterMode!: MainDateMode;

  @Prop({ type: String, default: 'Apply' })
  private readonly applyTextButton!: string;

  @Prop()
  private readonly defaultDateRange!: DateRange;

  @Prop({ required: true, type: Function })
  private readonly getDateRangeByMode!: (mode: MainDateMode) => DateRange;

  @Prop({ required: true, type: Array })
  private readonly modeOptions!: DateModeOption[];

  @Prop({ required: false, type: String, default: 'DD/MM/YYYY' })
  private readonly dateFormatPattern!: string;

  @Ref()
  private datePicker!: any;

  @Ref()
  private datePickerInput!: any;

  @Prop({ required: false, default: false })
  private readonly canEditCalendar!: boolean;

  @Prop({ required: false, type: Function, default: () => document.body })
  private readonly container!: () => HTMLElement;

  @Prop({ required: false, type: String, default: '' })
  private readonly customClass!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isShowRemove!: boolean;

  @Prop({ required: false, default: DateUtils.DefaultLocale })
  private readonly locale!: string;

  // Provide from DashboardControlBar.ts
  @Inject({ default: undefined })
  private handleResetMainDate?: () => void;

  private currentCalendarData = CalendarData.default();

  private oldCalendarData = CalendarData.default();

  private submittedPresetDateRange: DateRange = {
    start: new Date(),
    end: new Date()
  };

  isShowDatePicker = false;
  private isFullSize = true;

  private errorMessage = '';

  private get endDate() {
    return this.currentCalendarData.chosenDateRange?.end ?? new Date();
  }

  private get startDate() {
    return this.currentCalendarData.chosenDateRange?.start ?? new Date();
  }

  private get minDate() {
    return this.currentCalendarData.chosenDateRange?.start ?? new Date();
  }

  private get maxDate() {
    return this.currentCalendarData.chosenDateRange?.end ?? new Date();
  }

  private get startDatePickerAttributes() {
    if (this.currentCalendarData.chosenDateRange) {
      return [
        {
          highlight: {
            base: { fillMode: 'light' },
            end: { fillMode: 'outline' }
          },
          dates: {
            start: this.currentCalendarData.chosenDateRange?.start,
            end: this.currentCalendarData.chosenDateRange?.end
          }
        },
        {
          highlight: {
            color: 'blue',
            fillMode: 'outline',
            contentClass: 'highlight-solid'
          },
          dates: new Date()
        },
        {
          highlight: {
            color: 'blue',
            contentClass: 'highlight'
          },
          dates: this.currentCalendarData.chosenDateRange?.start
        },
        {
          highlight: {
            color: 'none'
          },
          dates: this.currentCalendarData.chosenDateRange?.end
        }
      ];
    }
    return [];
  }

  private get endDatePickerAttributes() {
    if (this.currentCalendarData.chosenDateRange) {
      return [
        {
          highlight: {
            base: { fillMode: 'light' },
            start: { fillMode: 'outline' }
          },
          dates: {
            start: this.currentCalendarData.chosenDateRange?.start,
            end: this.currentCalendarData.chosenDateRange?.end
          }
        },
        {
          highlight: {
            color: 'blue',
            fillMode: 'outline',
            contentClass: 'highlight-solid'
          },
          dates: new Date()
        },
        {
          highlight: {
            color: 'blue',
            contentClass: 'highlight'
          },
          dates: this.currentCalendarData.chosenDateRange?.end
        },
        {
          highlight: {
            color: 'none'
          },
          dates: this.currentCalendarData.chosenDateRange?.start
        }
      ];
    } else {
      return [
        {
          highlight: {
            color: 'blue',
            fillMode: 'outline',
            contentClass: 'highlight-solid'
          },
          dates: new Date()
        }
      ];
    }
  }

  private get isDisabledApplyButton() {
    return StringUtils.isNotEmpty(this.errorMessage);
  }

  private get calendarClass() {
    if (this.isFullSize) return 'full-size-container';
    return 'cropped-container';
  }

  private get listTimePresetOptions() {
    if (this.isShowAllTime) {
      return this.modeOptions;
    } else {
      return this.modeOptions.filter(mode => mode.value !== MainDateMode.allTime);
    }
  }

  private get timePresetHeight() {
    if (this.isFullSize) {
      return {
        '--di-calendar-time-preset-height': this.isHiddenCompareToSection ? '250px' : '150px',
        '--di-calendar-time-preset-height-ul': this.isHiddenCompareToSection ? '242px' : '142px'
      };
    }
    return {
      '--di-calendar-time-preset-height': this.isHiddenCompareToSection ? '230px' : '130px',
      '--di-calendar-time-preset-height-ul': this.isHiddenCompareToSection ? '222px' : '122px'
    };
  }

  private get compareClass(): string {
    if (this.currentCalendarData.isDisableCompare) {
      return 'disable-compare';
    } else {
      return '';
    }
  }

  mounted() {
    Log.debug('defaultDateRange::', this.defaultDateRange);
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
      this.onResize();
    });
    this.datePicker?.$refs?.calendar.move(this.currentCalendarData.chosenDateRange?.end);
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
  }

  @Watch('mainDateFilterMode', { immediate: true, deep: true })
  onMainDateFilterModeChanged(newMode: MainDateMode) {
    this.timePresetOptionsSelected(newMode);
    this.oldCalendarData = this.currentCalendarData;
    this.submittedPresetDateRange = this.currentCalendarData.chosenDateRange!;
  }

  private onResize(): void {
    this.isFullSize = window.innerWidth >= 700;
  }

  private timePresetOptionsSelected(mode: MainDateMode): void {
    this.setActiveForTimePreset(mode);
    if (mode == MainDateMode.custom) {
      const range = this.defaultDateRange ? DateUtils.cloneDateRange(this.defaultDateRange) : DateUtils.getLast30Days();
      this.updateDateRange(range);
    } else {
      const range = this.getDateRangeByMode(mode);
      this.updateDateRange(range);
    }
  }

  private ddlCompareToChanged(mode: CompareMode) {
    if (this.currentCalendarData.chosenDateRange) {
      const compareRange = DateUtils.getCompareDateRange(mode, this.currentCalendarData.chosenDateRange);
      if (compareRange) {
        this.currentCalendarData.updateCompareRange(compareRange);
      }
    }
  }

  private handleResetMainDateFilter() {
    if (this.handleResetMainDate) {
      this.handleResetMainDate();
    }
  }

  private cancel() {
    this.togglePicker(false);
    this.currentCalendarData = this.oldCalendarData;
  }

  private remove() {
    this.togglePicker(false);
    this.$emit('remove');
  }

  @Emit('onCalendarSelected')
  apply(): CalendarData {
    this.togglePicker(false);
    if (this.currentCalendarData.isAllTime) {
      this.currentCalendarData.showAllTime();
    }
    this.submittedPresetDateRange = this.currentCalendarData.chosenDateRange!;
    this.oldCalendarData = this.currentCalendarData;
    return this.currentCalendarData;
  }

  applyDateRange(newDateRange: DateRange | null): void {
    this.togglePicker(false);
    this.updateDateRange(newDateRange);
    if (this.currentCalendarData.isAllTime) {
      this.currentCalendarData.showAllTime();
    }
    this.submittedPresetDateRange = this.currentCalendarData.chosenDateRange!;
    this.oldCalendarData = this.currentCalendarData;
  }

  private submittedDateRangeChanged(value: DateRange) {
    if (value === null) {
      this.currentCalendarData.showAllTime();
    }
    this.currentCalendarData.chosenDateRange = this.submittedPresetDateRange;
    return this.apply();
  }

  private showDatePicker() {
    this.currentCalendarData = cloneDeep(this.oldCalendarData);
    this.errorMessage = '';
    this.togglePicker(!this.isShowDatePicker);
    this.$nextTick(() => {
      this.scrollTimePresetToElement(`li-${this.currentCalendarData.filterMode}`);
    });
  }

  private startDateSelectedManually(value: Date) {
    if (value) {
      this.errorMessage = '';
      this.selectCompareDateManually();
      this.currentCalendarData.updateCompareRange({
        start: value,
        end: this.currentCalendarData.compareDateRange?.end as Date
      });
    } else {
      this.errorMessage =
        this.calendarClass === 'full-size-container' ? 'The "Start Date" must be less than or equal to the "End Date"!' : 'The "Start Date" is invalid!';
    }
  }

  private endDateSelectedManually(value: Date) {
    if (value) {
      this.errorMessage = '';
      this.selectCompareDateManually();
      this.currentCalendarData.updateCompareRange({
        start: this.currentCalendarData.compareDateRange?.start as Date,
        end: value
      });
    } else {
      this.errorMessage =
        this.calendarClass === 'full-size-container' ? 'The "End Date" must be greater than or equal to the "Start Date"!' : 'The "End Date" is invalid!';
    }
  }

  private datePickerDragged(value: DateRange) {
    this.currentCalendarData.filterMode = MainDateMode.custom;
    if (value === null && this.currentCalendarData.chosenDateRange) {
      const compareRange = DateUtils.getCompareDateRange(this.currentCalendarData.compareMode, this.currentCalendarData.chosenDateRange);
      if (compareRange) {
        this.currentCalendarData.updateCompareRange(compareRange);
      }
    }
  }

  private togglePicker(value: boolean): void {
    this.isShowDatePicker = value;
    this.$emit('togglePicker', value);
  }

  updateDateRange(newDateRange: DateRange | null): void {
    this.errorMessage = '';

    if (newDateRange && newDateRange.start && newDateRange.end) {
      this.currentCalendarData.updateChosenDateRange(newDateRange);
      const compareRange = DateUtils.getCompareDateRange(this.currentCalendarData.compareMode, newDateRange);
      if (compareRange) {
        this.currentCalendarData.updateCompareRange(compareRange);
      }
    } else {
      this.currentCalendarData.showAllTime();
    }
    // this.datePicker?.$refs?.calendar.move(this.currentCalendarData.chosenDateRange?.end);
  }

  private selectCompareDateManually() {
    this.currentCalendarData.compareMode = CompareMode.custom;
  }

  private scrollTimePresetToElement(elementId: string) {
    const ulTimePreset = document.getElementById('ulTimePreset');
    const liElement = document.getElementById(elementId);
    if (ulTimePreset && liElement) {
      const bottom = ulTimePreset.scrollTop + ulTimePreset.offsetHeight - liElement.offsetHeight;
      const top = ulTimePreset.scrollTop;
      if (liElement.offsetTop <= top) {
        ulTimePreset.scrollTop = liElement.offsetTop;
      } else if (liElement.offsetTop >= bottom) {
        ulTimePreset.scrollTop = liElement.offsetTop - (ulTimePreset.offsetHeight - liElement.offsetHeight);
      }
    }
  }

  private setActiveForTimePreset(value: MainDateMode) {
    this.currentCalendarData.filterMode = value;
  }

  private isTimePresetSelected(currentItem: DateModeOption) {
    return this.currentCalendarData.filterMode == currentItem.value;
  }

  private validDateRange(dateRange: DateRange): boolean {
    if (new Date(dateRange.start).getTime() <= new Date(dateRange.end).getTime()) {
      return true;
    } else {
      return false;
    }
  }

  private handleSelectStartTime(startRange: any) {
    try {
      const startDate = startRange.date;
      const endDate = this.currentCalendarData.chosenDateRange?.end ?? new Date();
      const selectedDateRange: DateRange = { start: startDate, end: endDate };
      if (this.validDateRange(selectedDateRange)) {
        this.currentCalendarData.setChosenDateRange(selectedDateRange);
        Log.debug('handleSelectStartTime::', this.currentCalendarData.chosenDateRange, startRange.date);
        this.datePickerDragged(selectedDateRange);
      }
    } catch (e) {
      Log.error('DiCalendar::handleSelectStartTime::exception::', e.message);
    }
  }

  private handleSelectEndTime(endRange: any) {
    try {
      const startDate = this.currentCalendarData.chosenDateRange?.start ?? new Date();
      const endDate = endRange.date;
      const selectedDateRange: DateRange = { start: startDate, end: endDate };
      if (this.validDateRange(selectedDateRange)) {
        this.currentCalendarData.setChosenDateRange(selectedDateRange);
        this.datePickerDragged(selectedDateRange);
      }
    } catch (e) {
      Log.error('DiCalendar::handleSelectEndTime::exception::', e.message);
    }
  }
}
