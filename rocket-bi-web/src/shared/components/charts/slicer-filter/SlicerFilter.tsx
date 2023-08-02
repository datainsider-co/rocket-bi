import { Component, Inject, Prop, Watch } from 'vue-property-decorator';
import { BaseWidget } from '@/screens/dashboard-detail/components/widget-container/BaseWidget';
import {
  And,
  ChartInfo,
  Condition,
  DIException,
  ExportType,
  InputControlQuerySetting,
  SlicerConfig,
  SlicerFilterOption,
  TableResponse
} from '@core/common/domain';
import { WidgetRenderer } from '@chart/widget-renderer';
import { DefaultSlicerFilter } from '@chart/slicer-filter/DefaultSlicerFilter';
import { DefaultFilterValue, SlicerRange } from '@/shared';
import NumberSlicer, { SlicerDisplay } from '@chart/slicer-filter/NumberSlicer.vue';
import { get, isArray, toNumber } from 'lodash';
import { ConditionUtils } from '@core/utils';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { ChartUtils, DateTimeFormatter, ListUtils } from '@/utils';
import { PopupUtils } from '@/utils/PopupUtils';

// import '@/shared/components/charts/InputFilter/input-filter.scss';
enum SlicerMode {
  DynamicValues = 'DynamicValues',
  Filter = 'Filter'
}

@Component({ components: { NumberSlicer } })
export default class SlicerFilter extends BaseWidget {
  protected renderer: WidgetRenderer<BaseWidget> = new DefaultSlicerFilter();

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
  setting!: SlicerFilterOption;

  @Prop({ type: Boolean, default: false })
  showEditComponent!: boolean;

  @Prop({ required: true, type: Object })
  data?: TableResponse;

  @Prop({ required: true, type: Object })
  query!: InputControlQuerySetting;

  @Prop({ type: Object, required: true })
  chartInfo!: ChartInfo;
  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private onAddCondition?: (condition: Condition) => void;

  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private onChangeDynamicValues?: (values: string[]) => void;

  resize(): void {
    //Todo: Add resize method
  }

  mounted() {
    this.validQuerySetting(this.query);
  }

  get subTitle(): string {
    return this.setting.options.subtitle?.text ?? '';
  }

  @Watch('setting', { immediate: true, deep: true })
  onChartSettingChanged() {
    this.updateChartData();
  }

  private updateChartData() {
    this.renderer = new DefaultSlicerFilter();
  }

  get containerClass(): any {
    const padding = this.id === -2 ? 'p-2' : '';
    const disable = this.showEditComponent ? 'disable' : '';
    return `tab-filter-container flex-column w-100 ${padding} ${disable}`;
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
    return 'filter-chart single-line mb-2 text-left';
  }

  get titleStyle() {
    return {
      ...this.setting.options.title?.style
      // justifyContent: this.setting.options.title?.align
    };
  }

  get filterClass(): string {
    return this.showEditComponent ? `disable ml-1 mt-3` : `ml-1 mt-3`;
  }

  get useFormat(): boolean {
    switch (this.slicerDisplay) {
      case SlicerDisplay.number:
        return true;
      case SlicerDisplay.date:
      case SlicerDisplay.dateAsNumber:
        return false;
    }
  }

  get isDate(): boolean {
    switch (this.slicerDisplay) {
      case SlicerDisplay.number:
      case SlicerDisplay.dateAsNumber:
        return false;
      case SlicerDisplay.date:
        return true;
    }
  }

  get max(): number {
    switch (this.slicerDisplay) {
      case SlicerDisplay.number:
      case SlicerDisplay.dateAsNumber:
        return this.getNumberMax(this.data, this.setting.options.to);
      case SlicerDisplay.date:
        return this.getDateMax(this.data, this.setting.options.to);
    }
  }

  get min(): number {
    switch (this.slicerDisplay) {
      case SlicerDisplay.number:
      case SlicerDisplay.dateAsNumber:
        return this.getNumberMin(this.data, this.setting.options.from);
      case SlicerDisplay.date:
        return this.getDateMin(this.data, this.setting.options.from);
    }
  }

  getDateMax(data: TableResponse | undefined | null, setting: SlicerConfig | undefined): number {
    if (data && ListUtils.isNotEmpty(data.records)) {
      return data.records[0][1];
      // return moment(data.records[0][1]).valueOf();
    } else if (setting?.value !== undefined) {
      return setting.value;
    }
    return 0;
  }

  getNumberMax(data: TableResponse | undefined | null, setting: SlicerConfig | undefined): number {
    if (data && ListUtils.isNotEmpty(data.records)) {
      return toNumber(data.records[0][1]);
    } else if (setting?.value !== undefined) {
      return setting.value;
    }
    return 0;
  }

  getDateMin(data: TableResponse | undefined | null, setting: SlicerConfig | undefined): number {
    if (data && ListUtils.isNotEmpty(data.records)) {
      return data.records[0][0];
      // return moment(record[data.records[0][0]]).valueOf();
    } else if (setting?.value !== undefined) {
      return setting.value;
    }
    return 0;
  }

  getNumberMin(data: TableResponse | undefined | null, setting: SlicerConfig | undefined): number {
    if (data && ListUtils.isNotEmpty(data.records)) {
      return toNumber(data.records[0][0]);
    } else if (setting?.value !== undefined) {
      return setting.value;
    }
    return 0;
  }

  get range(): SlicerRange {
    const isUsingDefault = this.setting.options.default?.setting?.value != null;
    if (isUsingDefault && isArray(this.setting.options.default?.setting?.value)) {
      const from = get(this.setting, 'options.default.setting.value[0]', this.min);
      const to = get(this.setting, 'options.default.setting.value[1]', this.max);
      return {
        from: {
          value: from,
          equal: false
        },
        to: {
          value: to,
          equal: false
        }
      };
    } else {
      const fromEqual = this.setting.options.from?.equal ?? false;
      const toEqual = this.setting.options.to?.equal ?? false;
      const fromValue = isUsingDefault ? this.setting.options.default?.setting?.value?.from?.value : this.min;
      const toValue = isUsingDefault ? this.setting.options.default?.setting?.value?.to?.value : this.max;
      return {
        from: {
          value: fromValue,
          equal: fromEqual
        },
        to: {
          value: toValue,
          equal: toEqual
        }
      };
    }
  }

  private handleFilterChanged(range: SlicerRange) {
    const condition: Condition = this.buildCondition(range);
    if (this.onAddCondition && !this.isPreview) {
      this.onAddCondition(condition);
    } else if (this.isPreview) {
      this.saveTempSelectedValue({
        value: range,
        conditions: condition
      });
    }
  }

  private handleDynamicValuesChanged(range: SlicerRange) {
    const values: string[] = [];
    if (range.to.value !== this.max || range.from.value !== this.min) {
      const fromValueAsString = this.slicerDisplay === SlicerDisplay.date ? DateTimeFormatter.formatDateWithTime(range.from.value, '') : `${range.from.value}`;
      const toValueAsString = this.slicerDisplay === SlicerDisplay.date ? DateTimeFormatter.formatDateWithTime(range.to.value, '') : `${range.to.value}`;
      values.push(fromValueAsString, toValueAsString);
    }
    if (this.isPreview) {
      this.saveTempSelectedValue({
        value: values,
        conditions: void 0
      });
    } else {
      this.onChangeDynamicValues ? this.onChangeDynamicValues(values) : void 0;
    }
  }

  handleSlicerChanged(range: SlicerRange): void {
    const mode = this.getSlicerMode(this.query);
    switch (mode) {
      case SlicerMode.DynamicValues:
        this.handleDynamicValuesChanged(range);
        break;
      case SlicerMode.Filter:
        this.handleFilterChanged(range);
        break;
    }
  }

  private saveTempSelectedValue(value: DefaultFilterValue) {
    _ConfigBuilderStore.setTempFilterValue(value);
  }

  private buildCondition(range: SlicerRange) {
    const { from, to } = range;
    const filterColumn = this.query.getFilter();
    const fromCondition: Condition = ConditionUtils.buildFromCondition(filterColumn, from);
    const toCondition: Condition = ConditionUtils.buildToCondition(filterColumn, to);
    return new And([fromCondition, toCondition]);
  }

  private validQuerySetting(query: InputControlQuerySetting) {
    if (ListUtils.isNotEmpty(query.values)) {
      const fieldType: string = get(query, 'values[0].function.field.fieldType', '');
      if (ChartUtils.isNumberType(fieldType)) {
        return;
      }
      if (ChartUtils.isDateType(fieldType)) {
        return;
      }
      throw new DIException('Slicer Filter only support config with Number Field or Date Field!');
    }
  }

  async export(type: ExportType) {
    PopupUtils.showError('Unsupported Download CSV');
  }

  private get slicerDisplay(): SlicerDisplay {
    const mode = this.getSlicerMode(this.query);
    if (mode === SlicerMode.Filter) {
      const fieldType: string = get(this.query, 'values[0].function.field.fieldType', '');
      //column là cột date thì check xem phải predior k
      if (ChartUtils.isDateType(fieldType)) {
        const dateFunctionType = this.query.values[0]!.function?.scalarFunction?.className ?? '';
        return ChartUtils.isDateHistogramPeriodic(dateFunctionType) ? SlicerDisplay.dateAsNumber : SlicerDisplay.date;
      }
      return SlicerDisplay.number;
    } else {
      return this.setting.options.dynamicSettings?.isNumber ?? true ? SlicerDisplay.number : SlicerDisplay.date;
    }
  }

  private getSlicerMode(query: InputControlQuerySetting) {
    if (query.enableDynamicValues()) {
      return SlicerMode.DynamicValues;
    }
    return SlicerMode.Filter;
  }
}
