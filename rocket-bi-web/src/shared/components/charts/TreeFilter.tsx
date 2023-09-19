import { Component, Inject, Prop, Watch } from 'vue-property-decorator';
import { DefaultFilterValue, Direction, TabFilterDisplay, TableSettingColor } from '@/shared';
import { BaseChartWidget, PropsBaseChart } from '@chart/BaseChart';
import {
  And,
  Condition,
  Equal,
  FilterableSetting,
  Or,
  TableColumn,
  TreeFilterOption,
  TreeFilterQuerySetting,
  ValueControlType,
  WidgetId
} from '@core/common/domain/model';
import { TableResponse } from '@core/common/domain/response/query/TableResponse';
import { WidgetRenderer } from './widget-renderer';
import { BaseWidget } from '@/screens/dashboard-detail/components/widget-container/BaseWidget';
import '@chart/table/TableStyle.scss';
import './TabFilter.scss';
import { ConditionUtils, Log } from '@core/utils';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { clone, cloneDeep, difference } from 'lodash';
import { PopupUtils } from '@/utils/PopupUtils';
import { ListUtils, StringUtils } from '@/utils';
import { DefaultTreeFilter } from '@chart/widget-renderer/DefaultTreeFilter';
import { ExportType, FilterRequest, QueryRequest } from '@core/common/domain';
import { ChartDataModule, FilterModule } from '@/screens/dashboard-detail/stores';
import NProgress from 'nprogress';
import { FilterStoreUtils } from '@/screens/dashboard-detail/stores/widget/FilterStoreUtils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';

@Component({
  props: PropsBaseChart
})
export default class TreeFilter extends BaseChartWidget<TableResponse, TreeFilterOption, TreeFilterQuerySetting> {
  protected renderer: WidgetRenderer<BaseWidget> = new DefaultTreeFilter();

  static readonly DISPLAY_INDEX = 0;

  static readonly VALUE_INDEX = 1;

  @Prop({ type: Boolean, default: false })
  showEditComponent!: boolean;

  private subRows: Map<string, any[]> = new Map();

  keyword = '';

  @Inject({ default: undefined })
  private getExpandedKeys?: (id: WidgetId) => string[] | undefined;

  @Inject({ default: undefined })
  private getSelectedKeys?: (id: WidgetId) => string[] | undefined;

  @Inject({ default: undefined })
  private setExpandedKeys?: (id: WidgetId, keys: string[]) => void;

  @Inject({ default: undefined })
  private setSelectedKeys?: (id: WidgetId, keys: string[]) => void;

  get direction(): Direction {
    return this.setting.options.direction ?? Direction.row;
  }

  get displayAs(): TabFilterDisplay {
    return this.setting.options.displayAs ?? TabFilterDisplay.Normal;
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
    return this.setting.options.choiceActiveColor;
  }

  get deActiveColor() {
    return this.setting.options.choiceDeActiveColor;
  }

  get titleStyle() {
    return {
      ...this.setting.options.title?.style,
      color: this.setting.getTitleColor()
      // 'padding-bottom': this.displayAs === TabFilterDisplay.dropDown ? '0' : '1rem'
    };
  }
  get containerClass(): any {
    return `tab-filter-container`;
  }

  get infoClass(): string {
    const margin = 'mb-2';
    return `vert-tab-filter-info ${margin}`;
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
    this.updateSubRow(this.query.values[0].name, this.data.records);
    this.renderer = new DefaultTreeFilter();
  }

  private updateSubRow(key: string, value: any[]) {
    this.subRows.set(key, value);
    this.subRows = new Map(this.subRows);
    // if (!this.expandedKeys.includes(key)) {
    //   this.expandedKeys.push(key);
    // }
  }

  private getDefaultKeys(setting: TreeFilterOption) {
    Log.debug('getDefaultKeys::', setting.options.default);
    const isUsingDefault = setting.options.default?.setting?.value != null;
    const values = setting.options.default?.setting?.value?.selectedKeys as Array<string>;
    return isUsingDefault ? values : [];
  }

  private getDefaultExpanded(setting: TreeFilterOption) {
    Log.debug('getDefaultExpanded::', setting.options.default);
    const isUsingDefault = setting.options.default?.setting?.value != null;
    const values = setting.options.default?.setting?.value?.expandedKeys as Array<string>;
    return isUsingDefault ? values : [this.query.values[0].name];
  }

  export(type: ExportType): Promise<void> {
    PopupUtils.showError('Unsupported Download CSV');
    return Promise.reject();
  }

  private buildId(prefixKey: string, value: string): string {
    return `${prefixKey}//${value}`;
  }

  handleChangeKeyword(text: string) {
    this.keyword = text;
  }

  selectedKeys: string[] = this.initSelectedKeys(+this.id, this.setting);

  expandedKeys: string[] = this.initExpandedKeys(+this.id, this.setting);

  private initSelectedKeys(id: WidgetId, options: TreeFilterOption): string[] {
    Log.debug('initSelectedKeys::', this.subRows);
    if (this.getSelectedKeys && !!this.getSelectedKeys(id)) {
      return this.getSelectedKeys(id)!;
    }
    return this.getDefaultKeys(options);
  }

  private initExpandedKeys(id: WidgetId, options: TreeFilterOption): string[] {
    if (this.getExpandedKeys && !!this.getExpandedKeys(id)) {
      return this.getExpandedKeys(id)!;
    }
    return this.getDefaultExpanded(options);
  }

  onCheck(keys: string[]) {
    this.selectKeys(keys);
    const orCondition: Or = this.buildOrCondition(keys);
    if (this.isPreview) {
      this.saveTempSelectedValue({
        value: {
          expandedKeys: this.expandedKeys,
          selectedKeys: this.selectedKeys
        },
        conditions: orCondition
      });
    } else {
      const filterRequest: FilterRequest | undefined = this.toFilterRequest(orCondition);
      const filterValueMap: Map<ValueControlType, string[]> | undefined = this.getFilterValueMap(orCondition, keys);
      this.applyFilterRequest({
        filterRequest: filterRequest,
        filterValueMap: filterValueMap
      });
    }
  }

  private toFilterRequest(condition: Condition): FilterRequest | undefined {
    if (FilterableSetting.isFilterable(this.setting) && this.setting.isEnableFilter()) {
      return new FilterRequest(+this.id, condition);
    } else {
      return void 0;
    }
  }

  private getFilterValueMap(orCondition: Or, keys: string[]): Map<ValueControlType, string[]> | undefined {
    if (ListUtils.isNotEmpty(orCondition.conditions)) {
      return new Map([[ValueControlType.SelectedValue, this.getSelectedValues(keys)]]);
    } else {
      return void 0;
    }
  }

  private selectKeys(keys: string[]): void {
    this.selectedKeys = keys;
    this.setSelectedKeys && !this.isPreview ? this.setSelectedKeys(+this.id, keys) : void 0;
  }

  private expandKeys(keys: string[]) {
    this.expandedKeys = keys;
    this.setExpandedKeys && !this.isPreview ? this.setExpandedKeys(+this.id, keys) : void 0;
  }

  @Watch('expandedKeys', { immediate: true })
  async onExpandedKeysChanged(newKeys: string[], oldKeys: string[] | undefined) {
    Log.debug('Watch::onExpandedKeysChanged', newKeys, oldKeys);
    const old = oldKeys ?? [];
    if (newKeys.length > old.length) {
      const expandedKeys: string[] = difference(newKeys, old);
      for (const key of expandedKeys) {
        await this.loadSubRows(key);
      }
    }
  }

  async onExpand(keys: string[], expanded: boolean) {
    const oldKeys = this.expandedKeys;
    this.expandKeys(keys);
    await this.onExpandedKeysChanged(keys, oldKeys);
  }

  get isSingleChoice(): boolean {
    return this.setting.options.displayAs === TabFilterDisplay.SingleChoice;
  }

  async loadSubRows(expandedKey: string) {
    try {
      const existSubRows = this.subRows.has(expandedKey);
      Log.debug('loadSubRows::', expandedKey, existSubRows, this.isPreview);
      if (StringUtils.isNotEmpty(expandedKey) && !existSubRows) {
        const filterCondition: And = this.buildFilterByTreeKey(this.query, expandedKey);
        if (ListUtils.isNotEmpty(filterCondition.conditions)) {
          const queryRequest = this.buildSubRowRequest(filterCondition, filterCondition.conditions.length);
          Log.debug('loadSubRows::queryRequest', expandedKey, queryRequest);
          this.showLoading();
          const response: TableResponse = (await ChartDataModule.query(queryRequest)) as TableResponse;
          this.updateSubRow(expandedKey, response.records);
        }
      }
    } catch (ex) {
      Log.error(ex);
    } finally {
      this.hideLoading();
    }
  }

  private buildChildren(key: string, depth: number): any[] {
    const rows = this.subRows.get(key) ?? [];
    return rows.map(row => {
      const displayName = row[0];
      const id = this.buildId(key, displayName);
      return {
        title: displayName,
        key: id,
        children: this.buildChildren(id, depth + 1),
        isLeaf: depth === this.query.values.length - 1,
        scopedSlots: { icon: 'single-choice' }
      };
    });
  }

  get treeData(): any[] {
    const depth = 0;
    return [
      {
        title: this.query.values[0].name,
        key: this.query.values[0].name,
        children: this.buildChildren(this.query.values[0].name, depth),
        scopedSlots: { icon: 'single-choice' }
      }
    ];
  }

  private buildOrCondition(keys: string[]): Or {
    const sortedKeys = clone(keys).sort();
    const filters: Condition[] = [];
    if (sortedKeys.includes(this.query.values[0].name)) {
      return new Or([]);
    }
    sortedKeys.forEach(key => {
      filters.push(this.buildFilterByTreeKey(this.query, key));
    });
    Log.debug('buildFilterCondition::', filters);
    return new Or(filters);
  }

  private buildFilterByTreeKey(querySetting: TreeFilterQuerySetting, key: string): And {
    //key: showAll//subValue1//subValue2//subValue3
    const depthValues = key.split('//');
    depthValues.shift(); //Remove All Value
    const conditions: Equal[] = [];
    for (let i = 0; i < depthValues.length; i++) {
      const column: TableColumn = querySetting.values[i];
      const equal = ConditionUtils.buildEqualCondition(column, depthValues[i]);
      conditions.push(equal);
    }
    return new And(conditions);
  }

  private getSelectedValues(keys: string[]): string[] {
    const sortedKeys = clone(keys).sort();
    if (sortedKeys.includes(this.query.values[0].name)) {
      return [];
    }
    const values: string[] = [];
    sortedKeys.forEach(key => {
      //key: showAll//subValue1//subValue2//subValue3
      const depthValues = key.split('//');
      depthValues.shift(); //Remove All Value
      values.push(...depthValues);
    });
    return values;
  }

  private buildSubRowRequest(condition: Condition, depth: number): QueryRequest {
    const currentRequest: QueryRequest = FilterStoreUtils.buildQueryRequest({
      widgetId: +this.id,
      mainDateFilter: FilterModule.mainDateFilterRequest
    });
    const cloneQuerySetting: TreeFilterQuerySetting = cloneDeep(this.currentQuery);
    const nextFunction = cloneQuerySetting.values[depth];
    cloneQuerySetting.values = [nextFunction];
    cloneQuerySetting.filters.push(condition);
    currentRequest.querySetting = cloneQuerySetting;
    return currentRequest;
  }

  private showLoading() {
    NProgress.configure({ parent: `#${this.nprocessParentId}` }).start();
  }

  private hideLoading() {
    NProgress.configure({ parent: `#${this.nprocessParentId}` }).done();
  }

  get nprocessParentId() {
    return `tree-filter-${this.id}`;
  }

  get options(): any {
    return {
      deActiveColor: this.setting.options.deActiveColor,
      activeColor: this.setting.options.activeColor,
      textSetting: this.setting.options.choice?.style,
      switchColor: this.setting.options.switchColor
    };
  }

  mounted() {
    this.$root.$on(DashboardEvents.UpdateFilter, this.handleUpdateFilter);
  }

  beforeDestroy() {
    this.$root.$off(DashboardEvents.UpdateFilter, this.handleUpdateFilter);
  }

  private async handleUpdateFilter(id: WidgetId) {
    Log.debug('TreeFilter::handleUpdateFilter', id);
    if (id === this.id) {
      await this.onExpand(this.query.getExpandedKeys(), true);
      this.selectKeys(this.query.getSelectedKeys());
    }
    return;
  }
}
