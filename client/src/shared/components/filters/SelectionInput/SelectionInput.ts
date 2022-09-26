/*
 * @author: tvc12 - Thien Vi
 * @created: 12/31/20, 10:44 AM
 */

import { Component, Inject, Prop, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import moment from 'moment';
import { DataBuilderConstantsV35, DateRange, DateTimeConstants, FilterSelectOption, InputType, SelectOption } from '@/shared';
import DiCalendar from '@filter/MainDateFilterV2/DiCalendar.vue';
import { MainDateMode, TabControlData, WidgetId } from '@core/domain/Model';
import { CalendarData } from '@/shared/models';
import { DateTimeFormatter, DateUtils, ListUtils } from '@/utils';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import { Log } from '@core/utils';

@Component({
  components: { DiCalendar, DiDatePicker, SingleChoiceItem }
})
export default class SelectionInput extends Vue {
  private readonly MainDateModeOptions = DateTimeConstants.ListDateRangeModeOptions;

  private readonly ValueTypeOptions: SelectOption[] = [
    {
      displayName: 'Manual Input',
      id: 'Manual input'
    },
    {
      displayName: `Chart Control`,
      id: `Dashboard Control`
    }
  ];

  @Prop({ type: Array, default: () => [] })
  options!: FilterSelectOption[];

  @PropSync('optionSelected', { type: String, default: '' })
  optionSelectedProp!: string;

  @PropSync('values', { type: Array, default: '' })
  valuesProp!: string[];

  @Prop({ type: Array, default: () => [] })
  controlOptions!: TabControlData[];

  @PropSync('control')
  syncControl?: TabControlData;

  @Prop({ required: false, default: false })
  private readonly enableControlConfig!: boolean;

  @Ref()
  private controlButton!: any;

  private get valueProp(): string {
    return this.valuesProp[0];
  }

  private set valueProp(newValue: string) {
    this.valuesProp.splice(0, 1, newValue);
  }

  private get selectedDate(): Date | null {
    if (this.valueProp) {
      return moment(this.valueProp).toDate();
    } else {
      return null;
    }
  }

  private set selectedDate(newDate: Date | null) {
    if (newDate) {
      this.valueProp = DateTimeFormatter.formatDate(newDate);
    } else {
      this.valueProp = '';
    }
  }

  private currentSelected: FilterSelectOption | null = null;

  @Watch('optionSelectedProp', { immediate: true })
  onOptionSelectedChanged() {
    this.currentSelected = this.options.find(option => option.id === this.optionSelectedProp) ?? null;
    switch (this.currentSelected?.inputType) {
      case InputType.multiSelect:
      case InputType.none:
        this.handleValueTypeChanged(true);
    }
  }

  private get selectClass(): string {
    if (this.isDate || this.isText) {
      const col = this.enableControlConfig ? 'col-6' : 'col-8';
      return `pl-0 ${col}`;
    } else if (this.isDateRange) {
      const col = this.enableControlConfig ? 'col-6' : 'col-8';
      return `pl-0 ${col}`;
    } else {
      return 'px-0 col-12';
    }
  }

  private get isDynamicValue(): boolean {
    return this.syncControl !== null && this.syncControl !== undefined;
  }

  private get isText(): boolean {
    return this.currentSelected?.inputType == InputType.text;
  }

  private get isDate(): boolean {
    return this.currentSelected?.inputType == InputType.date;
  }

  private get isDateRange(): boolean {
    return this.currentSelected?.inputType == InputType.dateRange;
  }

  private get isNumberRange(): boolean {
    return this.currentSelected?.inputType == InputType.numberRange;
  }

  //TODO inject from DynamicFilterPanel.ts
  @Inject()
  private handleApplyFilter!: () => void;

  private applyFilter(): void {
    this.handleApplyFilter();
  }

  private parentElement(): Element {
    return this.$el;
  }

  private get defaultDateRange(): DateRange | undefined {
    Log.debug('SelectionInput::defaultDateRange', this.valuesProp);
    if (ListUtils.isNotEmpty(this.valuesProp)) {
      Log.debug('SelectionInput::defaultDateRange::if', this.valuesProp);
      return {
        start: moment(this.valuesProp[0]).toDate(),
        end: moment(this.valuesProp[1]).toDate()
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

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  private handleCalendarSelected(calendarData: CalendarData) {
    switch (calendarData.filterMode) {
      case MainDateMode.allTime:
        this.valuesProp = [];
        break;
      default:
        if (calendarData.chosenDateRange) {
          this.valuesProp = [DateTimeFormatter.formatDate(calendarData.chosenDateRange.start), DateTimeFormatter.formatDate(calendarData.chosenDateRange.end)];
        } else {
          this.valuesProp = [];
        }
    }
  }

  private isManualInput = false;

  mounted() {
    this.isManualInput = this.syncControl === undefined || this.syncControl === null || this.syncControl === void 0;
  }

  private handleValueTypeChanged(isManualInput: boolean, option?: SelectOption, event?: Event | undefined) {
    event?.stopPropagation();
    this.isManualInput = isManualInput;
    this.syncControl = void 0;
  }

  private get controlId(): WidgetId | undefined {
    return this.syncControl?.id;
  }

  private set controlId(controlId: WidgetId | undefined) {
    this.syncControl = this.controlOptions.find(control => control.id === controlId);
  }

  private getControlIcon(control: any) {
    return DataBuilderConstantsV35.ALL_FILTERS.find(filter => filter.type === control.chartType)?.src ?? '';
  }
}
