/*
 * @author: tvc12 - Thien Vi
 * @created: 12/31/20, 10:44 AM
 */

import { Component, Prop, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import moment from 'moment';
import {
  CheckboxGroupOption,
  DateHistogramConditionTypes,
  DateRange,
  DateTimeConstants,
  FilterSelectOption,
  InputType,
  NumberConditionTypes,
  SelectOption,
  StringConditionTypes
} from '@/shared';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { ChartControlData, ChartControl, MainDateMode, ValueControlInfo, WidgetId } from '@core/common/domain/model';
import { CalendarData } from '@/shared/models';
import { ChartUtils, DateTimeUtils, DateUtils, ListUtils, RandomUtils } from '@/utils';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import { Log } from '@core/utils';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import MultiSelection from '@/shared/components/MultiSelection.vue';
import { cloneDeep } from 'lodash';

@Component({
  components: { DiInputComponent, DiCalendar, DiDatePicker, SingleChoiceItem, MultiSelection }
})
export default class SelectionInput extends Vue {
  protected readonly selectionPanelInputId = `selection-input-panel-${RandomUtils.nextString()}`;
  protected readonly selectionInputId = `chart-control-value-section-${RandomUtils.nextString()}`;
  private readonly MainDateModeOptions = DateTimeConstants.DATE_RANGE_MODE_OPTION_LIST;
  private readonly InputTypes = InputType;

  private cacheObject: any = {};

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
  protected currentSelected: FilterSelectOption | null = null;

  @Prop({ type: Array, default: () => [] })
  readonly options!: FilterSelectOption[];

  @PropSync('optionSelected', { type: String, default: '' })
  optionSelectedProp!: DateHistogramConditionTypes | StringConditionTypes | NumberConditionTypes;

  @PropSync('values', { type: Array, default: () => [] })
  protected valuesProp!: string[];

  @Prop({ required: false, default: false })
  private readonly enableControlConfig!: boolean;

  @Prop({ required: false, type: Number })
  private readonly selectedControlId?: WidgetId;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isManualInput!: boolean;

  @Prop({ required: false, type: Array, default: () => [] })
  private readonly chartControls!: ChartControl[];

  @Ref()
  private controlButton!: any;

  private get singleValue(): string {
    return this.valuesProp[0];
  }

  private set singleValue(newValue: string) {
    this.valuesProp.splice(0, 1, newValue);
  }

  protected get selectedDate(): Date | null {
    if (this.singleValue) {
      return moment(this.singleValue).toDate();
    } else {
      return null;
    }
  }

  protected set selectedDate(newDate: Date | null) {
    if (newDate) {
      this.singleValue = DateTimeUtils.formatDateTime(newDate);
    } else {
      this.singleValue = '';
    }
  }

  private get selectedWidgetControl(): ChartControl | null {
    if (this.selectedControlId) {
      return this.chartControls.find(control => control.getControlId() === this.selectedControlId) ?? null;
    } else {
      return null;
    }
  }

  protected get supportedControlValues(): ValueControlInfo[] {
    return this.selectedWidgetControl?.getValueController()?.getSupportedControls() ?? [];
  }

  protected selectChartControl(controlId?: WidgetId) {
    this.$emit('update:selectedControlId', controlId);
  }

  protected getChartControlIconSrc(chartData: ChartControlData): string {
    return ChartUtils.getControlIconSrc(chartData.chartInfoType, chartData.chartType);
  }

  protected get chartControlDataList(): ChartControlData[] {
    return this.chartControls.map(control => control.getChartControlData());
  }

  @Watch('optionSelectedProp', { immediate: true })
  onOptionSelectedChanged() {
    this.currentSelected = this.options.find(option => option.id === this.optionSelectedProp) ?? null;
  }

  private get inputType(): InputType {
    return this.currentSelected?.inputType ?? InputType.None;
  }

  protected applyFilter(): void {
    this.$emit('applyFilter');
  }

  protected parentElement(): Element {
    return this.$el;
  }

  protected get defaultDateRange(): DateRange | undefined {
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

  protected get mainDateFilterMode(): MainDateMode {
    if (this.defaultDateRange) {
      return MainDateMode.custom;
    } else {
      return MainDateMode.allTime;
    }
  }

  protected getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  protected handleCalendarSelected(calendarData: CalendarData) {
    switch (calendarData.filterMode) {
      case MainDateMode.allTime:
        this.valuesProp = [];
        break;
      default:
        if (calendarData.chosenDateRange) {
          this.valuesProp = [
            DateTimeUtils.formatDateTime(calendarData.chosenDateRange.start),
            DateTimeUtils.formatDateTime(calendarData.chosenDateRange.end, true)
          ];
        } else {
          this.valuesProp = [];
        }
    }
  }

  protected changeManualInput(event: MouseEvent, isManualInput: boolean): void {
    event.stopPropagation();
    this.$emit('update:isManualInput', isManualInput);

    const { selectedValues, controlId } = this.cacheObject;
    this.cacheObject = {
      selectedValues: [...this.valuesProp],
      controlId: this.selectedControlId
    };
    // from chart control to manual
    if (isManualInput) {
      this.selectChartControl(void 0);
      this.valuesProp = cloneDeep(selectedValues);
    } else {
      this.selectChartControl(controlId);
      this.valuesProp = cloneDeep(selectedValues ?? []);
    }
  }
}
