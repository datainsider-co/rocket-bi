import { Component, Prop, Watch } from 'vue-property-decorator';
import { BaseWidget } from '@/screens/dashboard-detail/components/widget-container/BaseWidget';
import {
  ChartInfo,
  Condition,
  DateSelectFilterOption,
  ExportType,
  FilterMode,
  FilterRequest,
  GroupTableResponse,
  InputControlQuerySetting,
  MainDateMode,
  ValueControlType
} from '@core/common/domain';
import { WidgetRenderer } from '@chart/widget-renderer';
import { ConditionData, DateHistogramConditionTypes, DateRange, InputType, TableSettingColor } from '@/shared';
import { ConditionBuilder } from '@core/common/services';
import { Di } from '@core/common/modules';
import { ConditionUtils, Log } from '@core/utils';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import moment from 'moment/moment';
import { DateTimeUtils, DateUtils, ListUtils } from '@/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { DefaultDateFilter2 } from '@chart/date-filter/DefaultDateFilter2';
import { DateFilterUtils } from '@chart/date-filter/DateFilterUtils';
import { DateFilterData } from '@chart/date-filter/DateFilterData';

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
    return `tab-filter-container flex-column`;
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
    return 'filter-chart single-line mb-1 single-line';
  }

  get titleStyle() {
    return {
      ...this.setting.options.title?.style,
      textAlign: 'left'
    };
  }

  get filterClass(): string {
    return `ml-1 mt-3`;
  }

  handleDatesSelected(dates: string[], dateMode: MainDateMode) {
    const formatDates: string[] = this.formatDate(this.getDateTimeWithMode(dateMode, dates));
    this.setFilterDate(formatDates, dateMode);
    Log.debug('handleDatesSelected', dates, dateMode);
    this.applyFilter(formatDates, dateMode);
  }

  private applyFilter(dates: string[], dateMode: MainDateMode): void {
    const subType = DateHistogramConditionTypes.betweenAndIncluding;
    const filterRequest: FilterRequest | undefined = ListUtils.isEmpty(dates) ? void 0 : this.buildFilterRequest(dates, subType);
    Log.debug('handleDateFilterSelected::', dates, filterRequest);
    if (this.isPreview) {
      //In Data builder
      this.saveTempSelectedValue(filterRequest?.condition ?? void 0);
    } else {
      const filterValueMap: Map<ValueControlType, string[]> | undefined = this.getFilterValueMap(dates, dateMode);
      this.applyFilterRequest({
        filterRequest: filterRequest,
        filterValueMap: filterValueMap
      });
    }
  }

  private getFilterValueMap(dates: string[], dateMode: MainDateMode): Map<ValueControlType, string[]> | undefined {
    if (dateMode === MainDateMode.allTime) {
      return void 0;
    } else {
      return new Map([
        [ValueControlType.MinValue, [dates[0]]],
        [ValueControlType.MaxValue, [dates[1]]]
      ]);
    }
  }

  private formatDate(date: (string | Date)[]): string[] {
    if (date.length < 2) {
      return [];
    } else {
      const startDate = DateTimeUtils.formatDateTime(date[0]);
      const endDate = DateTimeUtils.formatDateTime(date[1], true);
      return [startDate, endDate];
    }
  }

  private getDateTimeWithMode(mode: MainDateMode, customDates: string[]): (string | Date)[] {
    switch (mode) {
      case MainDateMode.allTime:
        return [];
      case MainDateMode.custom:
        return customDates;
      default: {
        const dateRange: DateRange | null = DateUtils.getDateRange(mode);
        return dateRange ? [dateRange.start, dateRange.end] : [];
      }
    }
  }

  private saveTempSelectedValue(condition: Condition | undefined) {
    _ConfigBuilderStore.setTempFilterValue({
      value: this.filterData,
      conditions: condition
    });
  }

  private buildFilterRequest(dates: string[], type: DateHistogramConditionTypes): any {
    if (ListUtils.isNotEmpty(this.query.values)) {
      const familyType = ConditionUtils.getFamilyTypeFromFieldType(this.query.getFilterColumn().function.field.fieldType);
      if (familyType) {
        const conditionData: ConditionData = {
          field: this.query.getFilterColumn().function.field,
          familyType: familyType,
          subType: type,
          isNested: false,
          id: +this.id,
          groupId: -1,
          firstValue: dates[0] ?? void 0,
          secondValue: dates[1] ?? void 0,
          allValues: dates,
          currentInputType: InputType.Date,
          currentOptionSelected: type,
          filterModeSelected: FilterMode.Selection
        };
        const conditionBuilder: ConditionBuilder = Di.get(ConditionBuilder);
        const condition: Condition | undefined = conditionBuilder.buildCondition(conditionData);
        return condition ? new FilterRequest(+this.id, condition) : void 0;
      }
    }
    return void 0;
  }

  private setFilterDate(dates: string[], mode: MainDateMode) {
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
      return DateFilterUtils.DEFAULT_DATE_FILTER_DATA;
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

  async export(type: ExportType): Promise<void> {
    PopupUtils.showError('Unsupported Download CSV');
  }
}
