import { Component, Prop, Watch } from 'vue-property-decorator';
import { DefaultFilterValue, Direction, SelectOption, TabFilterDisplay, TableSettingColor } from '@/shared';
import { PropsBaseChart } from '@chart/BaseChart';
import { ChartInfo, GroupMeasurementOption, GroupMeasurementQuerySetting, TableColumn } from '@core/domain/Model';
import { WidgetRenderer } from './WidgetRenderer';
import { BaseWidget } from '@/screens/DashboardDetail/components/WidgetContainer/BaseWidget';
import { DefaultTabFilter } from '@chart/WidgetRenderer/DefaultTabFilter';
import { IdGenerator } from '@/utils/id_generator';
import '@/shared/components/charts/Table/table.style.scss';
import './tab-filter.scss';
import { Log } from '@core/utils';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';
import { PopupUtils } from '@/utils/popup.utils';
import TabSelection from '@/shared/components/TabSelection.vue';
import { ListUtils } from '@/utils';
import { isString, toNumber } from 'lodash';

@Component({
  props: PropsBaseChart
})
export default class MeasureControl extends BaseWidget {
  protected renderer: WidgetRenderer<BaseWidget> = new DefaultTabFilter();

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
  setting!: GroupMeasurementOption;

  @Prop({ type: Boolean, default: false })
  showEditComponent!: boolean;

  @Prop({ required: true, type: Object })
  query!: GroupMeasurementQuerySetting;

  @Prop({ type: Object, required: true })
  chartInfo!: ChartInfo;

  private selected: Set<any> = this.getSelected();

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
      '--background-color': this.backgroundColor,
      // '--text-color': this.setting.options.textColor,
      [alignKey]: this.setting.options.align ?? 'center',
      '--background-active': this.setting.options.activeColor,
      '--background-de-active': this.setting.options.deActiveColor
    };
  }

  //
  // get selectionStyle() {
  //   return {
  //     '--background-color': this.backgroundColor
  //     // '--text-color': this.textColor
  //   };
  // }

  get titleStyle() {
    return this.setting.options?.title?.style;
  }

  private buildId(colum: TableColumn, index: number): string {
    return `${colum.normalizeName}_${index}`;
  }

  get selectOptionAsMap(): Map<string, SelectOption> {
    return new Map(
      this.query.values.map((value, index) => {
        const id = this.buildId(value, index);
        return [
          id,
          {
            displayName: value.name,
            id: id
          }
        ];
      })
    );
  }

  private get directionClass(): string {
    switch (this.direction) {
      case Direction.row:
        return 'flex-row tab-display-row';
      case Direction.column:
        return 'flex-column h-100 overflow-auto';
    }
  }

  get containerClass(): any {
    if (this.isPreview) {
      if (this.backgroundColor) {
        return `tab-filter-container ${this.directionClass}`;
      } else {
        return `tab-filter-container ${this.directionClass} ${TableSettingColor.secondaryBackgroundColor}`;
      }
    }
    return `tab-filter-container ${this.directionClass}`;
  }

  get isFreezeTitle(): boolean {
    return false;
  }

  get infoClass(): string {
    switch (this.direction) {
      case Direction.row:
        return 'horizon-tab-filter-info';
      case Direction.column:
        return 'vert-tab-filter-info';
    }
  }

  get filterClass(): string {
    const margin = this.direction === Direction.column ? 'mt-3' : 'ml-2';
    return this.showEditComponent ? `disable ml-1 ${margin}` : `ml-1 ${margin}`;
  }

  private getIndex(key: string): number {
    Log.debug('getIndex::key::', key);
    return toNumber(ListUtils.getLast(key.split('_')));
  }

  handleFilterChanged(option: string | SelectOption) {
    this.updateSelected(option);
    //In Preview
    if (this.isPreview) {
      const indexes = Array.from(this.selected).map(value => this.getIndex(value));
      const tblColumnSelected = indexes.map(index => this.query.values[index]);
      this.saveTempSelectedValue({
        value: {
          values: indexes,
          columns: tblColumnSelected
        }
      });
    }
  }

  private handleMultiChoiceSelect(id: string) {
    const isSelected = this.selected.has(id);
    if (isSelected) {
      this.selected.delete(id);
    } else {
      this.selected.add(id);
    }
    // const isSelectAll = item.id === TabSelection.OPTION_SHOW_ALL.id;
    // const isAll = this.selected.size === this.selectOptionAsMap.size; ///options + all
    // const isSelected = this.selected.has(item.id);
    // ///Đang all => click all => clear hết
    // if (isAll && isSelectAll) {
    //   this.selected.clear();
    // }
    // ///Chưa all => click all => add hết
    // else if (!isAll && isSelectAll) {
    //   this.selected = new Set([TabSelection.OPTION_SHOW_ALL.id, ...this.selectOptionAsMap.keys()]);
    // }
    // ///Item selected => click => unselect + remove all nếu đang all
    // else if (isSelected) {
    //   this.selected.delete(item.id);
    //   this.selected.delete(TabSelection.OPTION_SHOW_ALL.id);
    // }
    // ///Item unselect => click => select + add all nếu tổng số item = options
    // else if (!isSelected) {
    //   this.selected.add(item.id);
    //   if (this.selected.size === this.selectOptionAsMap.size - 1) {
    //     this.selected.add(TabSelection.OPTION_SHOW_ALL.id);
    //   }
    // } else {
    //   //Nothing case
    // }
  }

  private handleSingleChoiceSelect(id: string) {
    this.selected.clear();
    this.selected.add(id);
  }

  private updateSelected(value: string | SelectOption) {
    const isMultiChoice = this.displayAs === TabFilterDisplay.multiChoice;
    const id = isString(value) ? value : `${(value as SelectOption).id}`;
    isMultiChoice ? this.handleMultiChoiceSelect(id) : this.handleSingleChoiceSelect(id);
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
      selectOptions: Array.from(this.selectOptionAsMap.values()),
      id: IdGenerator.generateMultiSelectionId('tab-filter', +this.id),
      selected: Array.from(this.selected.values()),
      displayAs: this.displayAs,
      direction: this.direction,
      appendAtRoot: true
      // allowScroll: !this.isFreezeTitle
    };
  }

  private getSelected(): Set<string> {
    Log.debug('getSelected()', this.setting.options.default);
    const isUsingSetting = this.setting.options.default?.dynamicFunction?.values != null;
    const valuesInSetting = (this.setting.options.default?.dynamicFunction?.values as Array<number>).map(index =>
      this.buildId(this.query.values[index], index)
    );
    const valuesDefault = ListUtils.isNotEmpty(this.query.values) ? [this.buildId(this.query.values[0]!, 0)] : [];
    return new Set<string>(isUsingSetting ? valuesInSetting : valuesDefault);
  }

  downloadCSV(): void {
    PopupUtils.showError('Unsupported Download CSV');
  }
}
