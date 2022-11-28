import { Component, Inject, Prop, Watch } from 'vue-property-decorator';
import { BaseWidget } from '@/screens/dashboard-detail/components/widget-container/BaseWidget';
import {
  ChartInfo,
  Condition,
  DateSelectFilterOption,
  FilterMode,
  FilterRequest,
  GroupTableResponse,
  InputControlQuerySetting,
  MainDateMode
} from '@core/common/domain';
import { WidgetRenderer } from '@chart/widget-renderer';
import { ConditionData, DateHistogramConditionTypes, InputType, TableSettingColor } from '@/shared';
import { ConditionBuilder } from '@core/common/services';
import { Di } from '@core/common/modules';
import { ConditionUtils, Log } from '@core/utils';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import moment from 'moment/moment';
import { DateUtils, ListUtils } from '@/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { DefaultDateFilter2 } from '@chart/date-filter/DefaultDateFilter2';
import { DateFilterUtils } from '@chart/date-filter/DateFilterUtils';
import { DateFilterData } from '@chart/date-filter/DateFilterData';

enum DateFilterMode {
  DynamicValues = 'DynamicValues',
  Filter = 'Filter'
}

@Component({ components: {} })
export default class DateFilter2 extends BaseWidget {
  protected renderer: WidgetRenderer<BaseWidget> = new DefaultDateFilter2();

  @Prop({ default: -1 })
  id!: string | number;

  @Prop({ type: String, default: '' })
  title!: string;

  @Prop()
  textColor?: string;

  @Prop()
  backgroundColor?: string;

  @Prop({ type: Boolean, default: false })
  isPreview!: boolean;

  @Prop({ required: true, type: Object })
  setting!: DateSelectFilterOption;

  @Prop({ type: Boolean, default: false })
  showEditComponent!: boolean;

  @Prop({ required: true, type: Object })
  data!: GroupTableResponse;

  @Prop({ required: true, type: Object })
  query!: InputControlQuerySetting;

  @Prop({ type: Object, required: true })
  chartInfo!: ChartInfo;
  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private addFilter?: (request: FilterRequest) => void;

  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private onRemoveFilter?: () => void;

  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private onChangeDynamicValues?: (values: string[]) => void;

  filterData: DateFilterData = this.getDateSelected();

  mounted() {
    this.filterData = this.getDateSelected();
  }

  resize(): void {
    //Todo: Add resize method
  }

  @Watch('setting', { immediate: true, deep: true })
  onChartSettingChanged() {
    this.updateChartData();
  }

  get subTitle(): string {
    return this.setting.options.subtitle?.text ?? '';
  }

  private updateChartData() {
    this.renderer = new DefaultDateFilter2();
    this.$forceUpdate();
  }

  get containerClass(): any {
    if (this.id == -2) {
      if (this.backgroundColor) {
        return `p-2 flex-column`;
      } else {
        return `tab-filter-container${TableSettingColor.secondaryBackgroundColor}`;
      }
    } else if (this.isPreview) {
      if (this.backgroundColor) {
        return `p-2 flex-column`;
      } else {
        return `tab-filter-container${TableSettingColor.secondaryBackgroundColor}`;
      }
    }
    return `tab-filter-container flex-column pt-1`;
  }

  get containerStyle() {
    return {
      '--background-color': this.backgroundColor
    };
  }

  get subtitleClass(): any {
    return 'd-flex row m-0 mb-1 w-100 single-line';
  }

  get subtitleStyle() {
    return {
      ...this.setting.options.subtitle?.style,
      justifyContent: this.setting.options.subtitle?.align
    };
  }

  get titleClass() {
    return 'd-flex row filter-chart single-line px-3 mb-1 single-line';
  }

  get titleStyle() {
    return {
      ...this.setting.options.title?.style,
      justifyContent: this.setting.options.title?.align
    };
  }

  get filterClass(): string {
    return this.showEditComponent ? `disable ml-1 mt-3` : `ml-1 mt-3`;
  }

  private handleDateFilterSelected(dates: string[]) {
    const subType = DateHistogramConditionTypes.betweenAndIncluding;
    const filterRequest: FilterRequest | undefined = ListUtils.isEmpty(dates) ? void 0 : this.buildFilterRequest(dates, subType);
    Log.debug('handleDateFilterSelected::', dates, filterRequest);
    if (this.isPreview) {
      //In Data builder
      this.saveTempSelectedValue(filterRequest?.condition ?? void 0);
    } else {
      //In Dashboard
      if (filterRequest) {
        this.addFilter ? this.addFilter(filterRequest) : void 0;
      } else {
        this.onRemoveFilter ? this.onRemoveFilter() : void 0;
      }
    }
  }

  private handleDynamicValueChanged(dates: string[]): void {
    if (this.isPreview) {
      this.saveTempSelectedValue(void 0);
    } else {
      this.onChangeDynamicValues ? this.onChangeDynamicValues(dates) : void 0;
    }
  }

  handleDatesSelected(dates: string[], dateMode: MainDateMode) {
    this.saveFilterDate(dates, dateMode);
    Log.debug('handleDatesSelected', dates, dateMode);
    const mode = this.getMode(this.query);
    switch (mode) {
      case DateFilterMode.DynamicValues:
        this.handleDynamicValueChanged(dates);
        break;
      case DateFilterMode.Filter:
        this.handleDateFilterSelected(dates);
        break;
    }
  }

  private saveTempSelectedValue(condition: Condition | undefined) {
    _ConfigBuilderStore.setTempFilterValue({
      value: this.filterData,
      conditions: condition
    });
  }

  private buildFilterRequest(dates: string[], type: DateHistogramConditionTypes) {
    const familyType = ConditionUtils.getFamilyTypeFromFieldType(this.query.getFilter().function.field.fieldType);
    if (familyType) {
      const conditionData: ConditionData = {
        field: this.query.getFilter().function.field,
        familyType: familyType,
        subType: type,
        isNested: false,
        id: +this.id,
        groupId: -1,
        firstValue: dates[0] ?? void 0,
        secondValue: dates[1] ?? void 0,
        allValues: dates,
        currentInputType: InputType.date,
        currentOptionSelected: type,
        filterModeSelected: FilterMode.selection
      };
      const conditionBuilder: ConditionBuilder = Di.get(ConditionBuilder);
      const condition: Condition | undefined = conditionBuilder.buildCondition(conditionData);
      return condition ? new FilterRequest(+this.id, condition) : void 0;
    }
    return void 0;
  }

  private saveFilterDate(dates: string[], mode: MainDateMode) {
    this.filterData = {
      dates: dates,
      mode: mode
    };
  }
  @Watch('setting.options', { deep: true })
  onSettingChanged() {
    this.filterData = this.getDateSelected();
  }

  getDateSelected(): DateFilterData {
    const defaultValue: any = this.setting.options.default?.setting?.value;
    const isUsingDefault = this.setting.options.default?.setting?.value != null;
    Log.debug('getDateSelected::', defaultValue, isUsingDefault, DateFilterUtils.isDateFilterData(defaultValue));
    if (isUsingDefault && Array.isArray(defaultValue)) {
      return {
        dates: defaultValue,
        mode: MainDateMode.custom
      };
    } else if (isUsingDefault && DateFilterUtils.isDateFilterData(defaultValue)) {
      const dates: string[] = DateFilterUtils.calculatedDates(defaultValue);
      Log.debug('getDateSelected::object::', {
        dates: dates,
        mode: defaultValue.mode
      });
      return {
        dates: dates,
        mode: defaultValue.mode
      };
    } else {
      return DateFilterUtils.defaultDateFilterData;
    }
  }

  get idAsString() {
    if (!this.isPreview || this.id == -2) {
      return `${this.id}-date-filter`;
    }
    return 'preview-date-filter';
  }

  get max(): Date | undefined {
    const key = this.data?.headers[1].key ?? '';
    if (key) {
      const record: Record<string, any> = this.data?.records[0];
      return moment(record[key]).toDate();
    }
    return DateUtils.DefaultMaxDate;
  }

  get min(): Date | undefined {
    const key = this.data?.headers[0].key ?? '';
    if (key) {
      const record: Record<string, any> = this.data?.records[0];
      return moment(record[key]).toDate();
    }
    return DateUtils.DefaultMinDate;
  }

  downloadCSV(): void {
    PopupUtils.showError('Unsupported Download CSV');
  }

  private getMode(query: InputControlQuerySetting) {
    if (query.enableDynamicValues()) {
      return DateFilterMode.DynamicValues;
    }
    return DateFilterMode.Filter;
  }
}
