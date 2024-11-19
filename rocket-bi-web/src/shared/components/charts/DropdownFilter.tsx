import { Component, Inject, Prop, Watch } from 'vue-property-decorator';
import { SelectOption } from '@/shared';
import { BaseChartWidget, PropsBaseChart } from '@chart/BaseChart';
import { DropdownChartOption, DropdownQuerySetting, FilterableSetting, QuerySetting, ValueControlType, WidgetId } from '@core/common/domain/model';
import { TableResponse } from '@core/common/domain/response/query/TableResponse';
import { WidgetRenderer } from './widget-renderer';
import { BaseWidget } from '@/screens/dashboard-detail/components/widget-container/BaseWidget';
import { DefaultDropDownFilter } from '@chart/widget-renderer/DefaultDropDownFilter';
import { PopupUtils } from '@/utils/PopupUtils';
import { ExportType, FilterRequest } from '@core/common/domain';
import { QuerySettingModule } from '@/screens/dashboard-detail/stores';

@Component({
  props: PropsBaseChart
})
/**
 * @deprecated
 */
export default class DropdownFilter extends BaseChartWidget<TableResponse, DropdownChartOption, DropdownQuerySetting> {
  protected renderer: WidgetRenderer<BaseWidget> = new DefaultDropDownFilter();
  static readonly ALL_ID = -1;

  static readonly DISPLAY_INDEX = 0;
  static readonly VALUE_INDEX = 1;

  @Prop({ type: Boolean, default: false })
  showEditComponent!: boolean;

  get colorStyle() {
    return {
      '--background-color': this.backgroundColor || '#333645',
      '--text-color': this.textColor || '#FFFFFF'
    };
  }

  currentValue = '';

  get dropdownOptions(): SelectOption[] {
    if (this.data) {
      const haveLabelColumn: boolean = this.data.headers.length == 2;
      const valueIndex = haveLabelColumn ? DropdownFilter.VALUE_INDEX : DropdownFilter.DISPLAY_INDEX;
      const options = this.data.records.map((row, index) => {
        return {
          displayName: row[DropdownFilter.DISPLAY_INDEX],
          id: index,
          data: row[valueIndex]
        };
      });
      return [this.defaultOption, ...options];
    } else {
      return [this.defaultOption];
    }
  }

  private get defaultOption(): SelectOption {
    return {
      data: DropdownFilter.ALL_ID,
      id: DropdownFilter.ALL_ID,
      displayName: 'Show all'
    };
  }

  get valueProps(): string {
    return 'data';
  }

  get labelProps(): string {
    return 'displayName';
  }

  // Inject from FilterContainer.vue
  @Inject({ default: undefined })
  private readonly defaultValue?: any;

  async handleFilterChanged(data: SelectOption) {
    this.currentValue = data.data;
    const filterRequest: FilterRequest | undefined = this.toFilterRequest(data);
    const filterValueMap: Map<ValueControlType, string[]> | undefined = this.getFilterValueMap(data);
    await this.applyFilterRequest({
      filterRequest: filterRequest,
      filterValueMap: filterValueMap
    });
  }

  private getFilterValueMap(selectOption: SelectOption): Map<ValueControlType, string[]> | undefined {
    const isSelectAll = +this.currentValue == DropdownFilter.ALL_ID;
    if (isSelectAll) {
      return void 0;
    } else {
      const valueMap = new Map<ValueControlType, string[]>();
      valueMap.set(ValueControlType.SelectedValue, [selectOption.data]);
      return valueMap;
    }
  }

  private toFilterRequest(selectOption: SelectOption): FilterRequest | undefined {
    const isSelectAll = +this.currentValue == DropdownFilter.ALL_ID;
    if (isSelectAll) {
      return void 0;
    }
    if (this.setting && FilterableSetting.isFilterable(this.setting!) && this.setting.isEnableFilter()) {
      const widgetId: WidgetId = this.id! as WidgetId;
      const querySetting: QuerySetting = QuerySettingModule.buildQuerySetting(widgetId);
      return FilterRequest.fromValue(widgetId, querySetting, selectOption.data);
    } else {
      return void 0;
    }
  }

  @Watch('dropdownOptions', { immediate: true })
  onDropdownOptionsChanged() {
    return (this.currentValue = this.defaultValue || this.dropdownOptions[0].data);
  }

  isHorizontalZoomIn(): boolean {
    return false;
  }

  isHorizontalZoomOut(): boolean {
    return false;
  }

  resize(): void {
    //Todo: Add resize method
  }

  get filterClass(): string {
    return '';
  }

  async export(type: ExportType): Promise<void> {
    PopupUtils.showError('Unsupported Download CSV');
  }

  async copyToAssistant(): Promise<void> {
    PopupUtils.showError('Unsupported Copy to Assistant');
  }

  foreCast(): Promise<void> {
    PopupUtils.showError('Unsupported Copy to Assistant');
    return Promise.reject('Unsupported Forecast');
  }

  summarize(): Promise<void> {
    PopupUtils.showError('Unsupported Summarize');
    return Promise.reject('Unsupported Summarize');
  }
}
// </script>
//
// <style lang="scss" scoped>
// ::v-deep {
//   .relative > span > button {
//     background-color: var(--background-color);
//
//     span {
//       color: var(--text-color);
//     }
//   }
//
//   .ic-16 {
//     margin-right: 0;
//   }
// }
// </style>
