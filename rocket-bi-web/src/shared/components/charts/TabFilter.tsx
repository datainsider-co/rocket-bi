import { Component, Inject, Prop, Watch } from 'vue-property-decorator';
import { DefaultFilterValue, Direction, SelectOption, TabFilterDisplay } from '@/shared';
import { BaseChartWidget, PropsBaseChart } from '@chart/BaseChart';
import { Condition, TabFilterOption, TabFilterQuerySetting, TableColumn } from '@core/common/domain/model';
import { TableResponse } from '@core/common/domain/response/query/TableResponse';
import { WidgetRenderer } from './widget-renderer';
import { BaseWidget } from '@/screens/dashboard-detail/components/widget-container/BaseWidget';
import { DefaultTabFilter } from '@chart/widget-renderer/DefaultTabFilter';
import { IdGenerator } from '@/utils/IdGenerator';
import '@chart/table/TableStyle.scss';
import './TabFilter.scss';
import { ConditionUtils, Log } from '@core/utils';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { cloneDeep, compact, toNumber } from 'lodash';
import { PopupUtils } from '@/utils/PopupUtils';
import TabSelection from '@/shared/components/TabSelection.vue';
import { ListUtils } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';
import { ExportType } from '@core/common/domain';

enum TabMode {
  DynamicFunction = 'DynamicFunction',
  Filter = 'Filter'
}

@Component({
  props: PropsBaseChart
})
export default class TabFilter extends BaseChartWidget<TableResponse, TabFilterOption, TabFilterQuerySetting> {
  protected renderer: WidgetRenderer<BaseWidget> = new DefaultTabFilter();

  static readonly DISPLAY_INDEX = 0;

  static readonly VALUE_INDEX = 1;

  @Prop({ type: Boolean, default: false })
  showEditComponent!: boolean;

  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private onAddMultiFilter?: (filters: SelectOption[]) => void;

  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private onChangeDynamicFunction?: (tableColumns: TableColumn[]) => void;

  private selected: Set<any> = this.getSelected();

  keyword = '';

  get direction(): Direction {
    return this.setting.options.direction ?? Direction.row;
  }

  get displayAs(): TabFilterDisplay {
    return this.setting.options.displayAs ?? TabFilterDisplay.normal;
  }

  get colorStyle() {
    return {
      '--background-color': this.backgroundColor || '#333645',
      color: this.textColor || '#FFFFFF'
    };
  }

  get containerStyle() {
    const alignKey = this.direction == Direction.column ? 'justify-content' : 'align-self';
    return {
      'background-color': 'transparent',
      color: this.setting.options.textColor,
      // [alignKey]: this.setting.options.align ?? 'center',
      '--background-active': this.activeColor,
      '--background-de-active': this.deActiveColor
    };
  }

  get activeColor() {
    switch (this.setting.options.displayAs) {
      case TabFilterDisplay.multiChoice:
      case TabFilterDisplay.singleChoice:
        return this.setting.options.choiceActiveColor;
      default:
        return this.setting.options.activeColor;
    }
  }

  get deActiveColor() {
    switch (this.setting.options.displayAs) {
      case TabFilterDisplay.multiChoice:
      case TabFilterDisplay.singleChoice:
        return this.setting.options.choiceDeActiveColor;
      default:
        return this.setting.options.deActiveColor;
    }
  }

  //
  get selectionStyle() {
    return {
      '--background-color': this.backgroundColor,
      '--text-color': this.textColor
    };
  }

  get titleStyle() {
    return {
      ...this.setting.options.title?.style,
      color: this.setting.getTitleColor()
      // 'padding-bottom': this.displayAs === TabFilterDisplay.dropDown ? '0' : '1rem'
    };
  }

  private getTabMode(query: TabFilterQuerySetting) {
    if (query.enableFunctionControl()) {
      return TabMode.DynamicFunction;
    }
    return TabMode.Filter;
  }

  private buildFunctionOptions(query: TabFilterQuerySetting): SelectOption[] {
    return cloneDeep(query.values).map((value, index) => {
      const id = this.buildId(value, index);
      return {
        id: id,
        displayName: value.name
      } as SelectOption;
    });
  }

  private buildFilterOptions(response: TableResponse): SelectOption[] {
    const haveLabelColumn: boolean = response.headers.length === 2;
    const valueIndex = haveLabelColumn ? TabFilter.VALUE_INDEX : TabFilter.DISPLAY_INDEX;
    const options: SelectOption[] = cloneDeep(response.records).map(row => {
      return {
        displayName: row[TabFilter.DISPLAY_INDEX],
        id: row[valueIndex]
      };
    });

    return options;
  }

  get selectOptionAsMap(): Map<string, SelectOption> {
    const mode = this.getTabMode(this.query);
    switch (mode) {
      case TabMode.DynamicFunction:
        return this.toMap(this.sort(this.buildFunctionOptions(this.query)));
      case TabMode.Filter:
        return this.toMap([TabSelection.OPTION_SHOW_ALL, ...this.sort(this.buildFilterOptions(this.data))]);
    }
  }

  get searchOptionAsMap(): Map<string, SelectOption> {
    const mode = this.getTabMode(this.query);
    switch (mode) {
      case TabMode.DynamicFunction:
        return this.toMap(this.search(this.sort(this.buildFunctionOptions(this.query))));
      case TabMode.Filter:
        return this.toMap([TabSelection.OPTION_SHOW_ALL, ...this.search(this.sort(this.buildFilterOptions(this.data)))]);
    }
  }

  private search(options: SelectOption[]): SelectOption[] {
    return options.filter(option => StringUtils.isIncludes(this.keyword, `${option.displayName}`));
  }

  private sort(options: SelectOption[]): SelectOption[] {
    return options.sort((a, b) => StringUtils.compare(`${a.displayName}`, `${b.displayName}`));
  }

  private toMap(options: SelectOption[]): Map<string, SelectOption> {
    return new Map(options.map(option => [`${option.id}`, option]));
  }

  private get directionClass(): string {
    switch (this.direction) {
      case Direction.row:
        return 'flex-row tab-display-row';
      case Direction.column:
        return 'flex-column h-100 overflow-auto';
    }
  }

  get enableSearch(): boolean {
    const isDropdown = this.displayAs === TabFilterDisplay.dropDown;
    const enableSearchInOptions = this.setting.options.search?.enabled ?? true;
    return !isDropdown && enableSearchInOptions;
  }

  get containerClass(): any {
    const searchClass = this.enableSearch ? 'search' : '';
    const directionClass = this.direction === Direction.column ? 'vertical' : 'horizontal';
    const padding = this.isPreview ? 'p-2' : '';
    return `tab-filter-container ${directionClass} ${searchClass} ${padding}`;
  }

  get isFreezeTitle(): boolean {
    return false;
  }

  get infoClass(): string {
    const searchClass = this.enableSearch ? ' search' : '';
    switch (this.direction) {
      case Direction.row:
        return `horizon-tab-filter-info${searchClass}`;
      case Direction.column:
        return `vert-tab-filter-info${searchClass}`;
    }
  }

  get filterClass(): string {
    const dropdownClass = this.displayAs === TabFilterDisplay.dropDown ? 'dropdown' : '';
    return this.showEditComponent ? `disable ${dropdownClass}` : `${dropdownClass}`;
  }

  private handleFilterChanged(items: Set<any>) {
    //In dashboard
    if (this.onAddMultiFilter && !this.isPreview) {
      const isSelectAll = this.selected.has(TabSelection.OPTION_SHOW_ALL.id);
      const valueAsArray = isSelectAll ? [] : Array.from(items);
      const selectedOptions: SelectOption[] = compact(valueAsArray.map(value => this.selectOptionAsMap.get(value)));
      this.onAddMultiFilter(selectedOptions);
    }
    // in preview
    else if (this.isPreview) {
      const condition: Condition | undefined = this.buildCondition();
      this.saveTempSelectedValue({
        value: condition ? Array.from(items) : void 0,
        conditions: condition
      });
    }
  }

  private handleDynamicFunctionChanged(items: Set<any>, query: TabFilterQuerySetting) {
    Log.debug('handleDynamicFunctionChanged', items);
    //In dashboard
    if (this.onChangeDynamicFunction && !this.isPreview) {
      const tblColumn: TableColumn[] = Array.from(items)
        .filter(item => item !== TabSelection.OPTION_SHOW_ALL.id)
        .map(item => {
          const index = this.getIndex(item);
          return query.values[index];
        });
      this.onChangeDynamicFunction(tblColumn);
    }
    // in preview
    else if (this.isPreview) {
      this.saveTempSelectedValue({
        value: Array.from(items),
        conditions: void 0
      });
    }
  }

  handleItemChanged(item: SelectOption) {
    const mode = this.getTabMode(this.query);
    switch (mode) {
      case TabMode.DynamicFunction:
        this.updateDynamicFunctionSelected(item);
        return this.handleDynamicFunctionChanged(this.selected, this.query);
      case TabMode.Filter:
        this.updateSelected(item);
        return this.handleFilterChanged(this.selected);
    }
  }

  private handleMultiChoiceSelect(item: SelectOption) {
    const isSelectAll = item.id === TabSelection.OPTION_SHOW_ALL.id;
    const isAll = this.selected.size === this.selectOptionAsMap.size; ///options + all
    const isSelected = this.selected.has(item.id);
    ///Đang all => click all => clear hết
    if (isAll && isSelectAll) {
      this.selected.clear();
    }
    ///Chưa all => click all => add hết
    else if (!isAll && isSelectAll) {
      this.selected = new Set([TabSelection.OPTION_SHOW_ALL.id, ...this.selectOptionAsMap.keys()]);
    }
    ///Item selected => click => unselect + remove all nếu đang all
    else if (isSelected) {
      this.selected.delete(item.id);
      this.selected.delete(TabSelection.OPTION_SHOW_ALL.id);
    }
    ///Item unselect => click => select + add all nếu tổng số item = options
    else if (!isSelected) {
      this.selected.add(item.id);
      this.selected.delete(TabSelection.OPTION_SHOW_ALL.id);
      if (this.selected.size === this.selectOptionAsMap.size - 1) {
        this.selected.add(TabSelection.OPTION_SHOW_ALL.id);
      }
    } else {
      //Nothing case
    }
  }

  private handleMultiDynamicFunctionSelect(item: SelectOption) {
    const isSelected = this.selected.has(item.id);
    if (isSelected && this.selected.size === 1) {
      //Not delete last item
    } else if (isSelected) {
      this.selected.delete(item.id);
    } else if (!isSelected) {
      this.selected.add(item.id);
    } else {
      //Nothing do to
    }
  }

  private handleSingleChoiceSelect(item: SelectOption) {
    this.selected.clear();
    this.selected.add(item.id);
  }

  private updateSelected(item: SelectOption) {
    const isMultiChoice = this.displayAs === TabFilterDisplay.multiChoice;
    isMultiChoice ? this.handleMultiChoiceSelect(item) : this.handleSingleChoiceSelect(item);
    ///Reactive
    this.selected = new Set(this.selected);
    Log.debug('updateSelected::', this.selected);
  }

  private updateDynamicFunctionSelected(item: SelectOption) {
    const isMultiChoice = this.displayAs === TabFilterDisplay.multiChoice;
    isMultiChoice ? this.handleMultiDynamicFunctionSelect(item) : this.handleSingleChoiceSelect(item);
    ///Reactive
    this.selected = new Set(this.selected);
    Log.debug('updateSelected::', this.selected);
  }

  private saveTempSelectedValue(value: DefaultFilterValue) {
    _ConfigBuilderStore.setTempFilterValue(value);
  }

  resize(): void {
    //Todo: Add resize method
  }

  @Watch('setting', { immediate: true, deep: true })
  onChartSettingChanged() {
    this.updateChartData();
  }

  private updateChartData() {
    this.renderer = new DefaultTabFilter();
  }

  get tabSelectionData(): any {
    return {
      selectOptions: Array.from(this.searchOptionAsMap.values()),
      id: IdGenerator.generateMultiSelectionId('tab-filter', +this.id),
      selected: Array.from(this.selected.values()),
      displayAs: this.displayAs,
      direction: this.direction,
      appendAtRoot: true
      // allowScroll: !this.isFreezeTitle
    };
  }

  private getSelected(): Set<string> {
    const mode = this.getTabMode(this.query);
    switch (mode) {
      case TabMode.DynamicFunction:
        return this.getSelectedByFunction(this.setting, this.query);
      case TabMode.Filter:
        return this.getSelectedByFilter(this.setting);
    }
  }

  private getSelectedByFilter(setting: TabFilterOption) {
    const isUsingDefault = setting.options.default?.setting?.value != null;
    const values = setting.options.default?.setting?.value as Array<string>;
    return new Set<string>(isUsingDefault ? values : [TabSelection.OPTION_SHOW_ALL.id]);
  }

  private getSelectedByFunction(setting: TabFilterOption, query: TabFilterQuerySetting) {
    const isUsingDefault = setting.options.default?.setting?.value != null;
    const values = setting.options.default?.setting?.value as Array<string>;
    return new Set<string>(isUsingDefault ? values : [this.buildId(query.values[0], 0)]);
  }

  private buildCondition(): Condition | undefined {
    const isEmptyCondition = this.selected.has(TabSelection.OPTION_SHOW_ALL.id);
    if (isEmptyCondition) {
      return void 0;
    } else {
      const valueAsArray = Array.from(this.selected);
      const filterColumn: TableColumn = this.query.getFilter();
      return ConditionUtils.buildInCondition(filterColumn, valueAsArray);
    }
  }

  async export(type: ExportType) {
    PopupUtils.showError('Unsupported Download CSV');
  }

  private buildId(colum: TableColumn, index: number): string {
    return `${colum.normalizeName}_${index}`;
  }

  private getIndex(key: string): number {
    return toNumber(ListUtils.getLast(key.split('_')));
  }

  handleChangeKeyword(text: string) {
    this.keyword = text;
  }
}
