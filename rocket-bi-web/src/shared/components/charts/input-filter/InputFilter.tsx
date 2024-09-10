import { Component, Inject, Prop, Watch } from 'vue-property-decorator';
import { BaseWidget } from '@/screens/dashboard-detail/components/widget-container/BaseWidget';
import {
  ChartInfo,
  Condition,
  ExportType,
  FilterMode,
  FilterRequest,
  InputControlQuerySetting,
  InputFilterOption,
  QueryRequest,
  TableResponse,
  ValueControlType,
  WidgetId
} from '@core/common/domain';
import { WidgetRenderer } from '@chart/widget-renderer';
import { ConditionData, ConditionTypes, InputType, NumberConditionTypes, StringConditionTypes, TableSettingColor } from '@/shared';
import { ConditionBuilder } from '@core/common/services';
import { Di } from '@core/common/modules';
import { ConditionUtils, Log } from '@core/utils';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { ChartUtils, ListUtils } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';
import { DefaultInputFilter } from '@chart/input-filter/DefaultInputFilter';
import { PopupUtils } from '@/utils/PopupUtils';
import './input-filter.scss';

@Component({ components: {} })
export default class InputFilter extends BaseWidget {
  protected renderer: WidgetRenderer<BaseWidget> = new DefaultInputFilter();

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
  setting!: InputFilterOption;

  @Prop({ type: Boolean, default: false })
  showEditComponent!: boolean;

  @Prop({ required: true })
  data!: TableResponse;

  @Prop({ required: true, type: Object })
  query!: InputControlQuerySetting;

  @Prop({ type: Object, required: true })
  chartInfo!: ChartInfo;

  currentValue: any = this.getInputValue();

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
    this.currentValue = this.getInputValue();
    this.renderer = new DefaultInputFilter();
    this.$forceUpdate();
  }

  get containerClass(): any {
    const color = !this.backgroundColor ? `${TableSettingColor.secondaryBackgroundColor}` : '';
    return `input-filter-container input-filter ${color}`;
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
    return 'filter-chart input-filter-title single-line';
  }

  get titleStyle() {
    return {
      ...this.setting.options.title?.style,
      justifyContent: this.setting.options.title?.align
    };
  }

  get filterClass(): string {
    return `ml-1 mt-3`;
  }

  handleFilterChange(value: string | Date | number) {
    const valueAsString = String(value ?? '');
    this.saveCurrentValue(valueAsString);
    this.applyFilter(valueAsString);
  }

  protected applyFilter(value: string): void {
    const filterRequest: FilterRequest | undefined = StringUtils.isEmpty(value) ? void 0 : this.buildFilterRequest(value);
    if (this.isPreview) {
      this.saveTempSelectedValue(filterRequest?.condition);
    } else {
      const filterValueMap: Map<ValueControlType, string[]> | undefined = this.getFilterValueMap(value);
      this.applyFilterRequest({
        filterRequest: filterRequest,
        filterValueMap: filterValueMap
      });
    }
  }

  private getFilterValueMap(value: string): Map<ValueControlType, string[]> | undefined {
    if (StringUtils.isEmpty(value)) {
      return undefined;
    } else {
      return new Map([[ValueControlType.SelectedValue, [value]]]);
    }
  }

  private saveTempSelectedValue(condition: Condition | undefined) {
    _ConfigBuilderStore.setTempFilterValue({
      value: this.currentValue,
      conditions: condition
    });
  }

  private buildFilterRequest(value: string | Date): FilterRequest | undefined {
    if (this.query.values.length === 1) {
      const familyType = ConditionUtils.getFamilyTypeFromFieldType(this.query.getFilterColumn().function.field.fieldType);
      if (familyType) {
        const subType = this.getSubType(familyType);
        const conditionData: ConditionData = {
          currentOptionSelected: '',
          field: this.query.getFilterColumn().function.field,
          familyType: familyType,
          subType: subType,
          isNested: false,
          id: +this.id,
          groupId: -1,
          firstValue: `${value}`.toLowerCase(),
          secondValue: void 0,
          allValues: [],
          currentInputType: InputType.Date,
          filterModeSelected: FilterMode.Selection
        };
        const conditionBuilder: ConditionBuilder = Di.get(ConditionBuilder);
        const condition: Condition | undefined = conditionBuilder.buildCondition(conditionData);
        Log.debug('DateFilter:: buildFilterRequest:', '\n Filter data::', value, ' \n Condition built', condition);
        return condition ? new FilterRequest(+this.id, condition) : void 0;
      }
    }
    return void 0;
  }

  private saveCurrentValue(value: string) {
    this.currentValue = value;
  }

  getInputValue(): string {
    const currentValues: string[] = this.getCurrentValues ? this.getCurrentValues(this.chartInfo.id) : [];
    const isUsingDefault = !!this.setting.options.default?.setting?.value;
    ///sử dụng data của store
    if (!this.isPreview && ListUtils.isNotEmpty(currentValues)) {
      return ListUtils.getHead(currentValues) ?? '';
    } else if (!this.isPreview) {
      ///sử dụng data của setting
      return isUsingDefault ? String(this.setting.options.default?.setting?.value) : '';
    } else {
      ///default
      Log.debug('getInputValue::', this.isPreview);
      return isUsingDefault ? String(this.setting.options.default?.setting?.value) : '';
    }
  }

  get idAsString() {
    if (!this.isPreview || this.id == -2) {
      return `${this.id}-input-filter`;
    }
    return 'preview-input-filter';
  }

  get isNumber(): boolean {
    if (this.query.values[0]) {
      return ChartUtils.isNumberType(this.query.values[0].function.field.fieldType);
    } else {
      return this.setting.options?.isNumber ?? false;
    }
  }

  private getSubType(familyType: ConditionTypes) {
    switch (familyType) {
      case ConditionTypes.DateHistogram:
      case ConditionTypes.Number:
        return NumberConditionTypes.equal;
      case ConditionTypes.String:
        return StringConditionTypes.likeCaseInsensitive;
    }
  }

  get suggestTexts(): string[] {
    if (this.isNumber) {
      return [];
    } else {
      return (
        this.data?.records
          ?.map(row => row[0])
          ?.slice(100)
          ?.sort(StringUtils.compare) ?? []
      );
    }
  }

  get placeHolder(): string {
    if (StringUtils.isNotEmpty(this.setting.options.placeHolder)) {
      return this.setting.options.placeHolder;
    }
    return 'Typing ...';
  }

  async export(type: ExportType) {
    PopupUtils.showError('Unsupported Download CSV');
  }

  async copyToAssistant(): Promise<void> {
    PopupUtils.showError('Unsupported Copy to Assistant');
  }

  summarize(): Promise<void> {
    PopupUtils.showError('Unsupported Summarize');
    return Promise.reject('Unsupported Summarize');
  }
}
