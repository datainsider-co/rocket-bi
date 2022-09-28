/*
 * @author: tvc12 - Thien Vi
 * @created: 12/31/20, 4:32 PM
 */

import { Component, Emit, Prop, PropSync, Provide, Ref, Vue, Watch } from 'vue-property-decorator';
import ClickOutside from 'vue-click-outside';
import { DynamicFilter, Field, FilterMode, TabControlData } from '@core/domain/Model';
import { FilterProp } from '@/shared/components/filters/filter_prop.abstract';
import { FilterComponentType, FilterConstants, FilterSelectOption, InputType, SelectOption } from '@/shared';
import { ChartUtils, TimeoutUtils } from '@/utils';
import { cloneDeep } from 'lodash';
import { StringUtils } from '@/utils/string.utils';
import { BPopover } from 'bootstrap-vue';
import { FieldDetailInfo } from '@core/domain/Model/Function/FieldDetailInfo';
import { Log } from '@core/utils';
import { WidgetModule } from '@/screens/DashboardDetail/stores';

export interface DynamicFilterPopoverData {
  currentValues: string[];
  currentOptionSelected: string;
  currentInputType: InputType;
  currentFilterMode: FilterMode;
  control?: TabControlData;
}

@Component({
  directives: {
    ClickOutside
  }
})
export default class DynamicFilterPopover extends Vue {
  private popupItem: Element | null = null;
  private currentFilter = DynamicFilter.empty();

  @Prop({ required: true, type: String })
  private btnId!: string;

  @PropSync('isShowPopover', { type: Boolean, required: true })
  private isShowPopoverSynced!: boolean;

  @Prop({ required: true, type: DynamicFilter })
  private dynamicFilter!: DynamicFilter;

  @Prop({ required: false, type: String, default: 'bottom' })
  private placement!: string;

  @Prop({ required: true, type: String })
  private readonly boundaryOption!: string;

  @Prop({ required: false, default: false })
  private readonly enableControlConfig!: boolean;

  @Prop({ required: false, default: false })
  private readonly isDefaultStyle!: boolean;

  @Ref()
  private filterRef!: FilterProp;

  @Ref()
  private popover!: BPopover;

  get currentValues(): string[] {
    return this.currentFilter.currentValues;
  }

  set currentValues(newValue: string[]) {
    this.currentFilter.currentValues = newValue ?? [];
  }

  private get filterName(): string {
    return this.currentFilter.name;
  }

  private get options(): SelectOption[] {
    return FilterConstants.SELECT_MODE_OPTIONS;
  }

  private get filterModeSelected(): FilterMode {
    return this.currentFilter.filterModeSelected ?? FilterMode.range;
  }

  private set filterModeSelected(newValue) {
    this.currentFilter.filterModeSelected = newValue;
    this.currentOptionSelected = this.defaultOptionSelected;
  }

  private get defaultOptionSelected(): string {
    if (this.isSelectionMode) {
      return FilterConstants.DEFAULT_SELECTED;
    } else {
      if (this.isDateType) {
        return FilterConstants.DEFAULT_DATE_SELECTED;
      }
      if (this.isNumberType) {
        return FilterConstants.DEFAULT_NUMBER_SELECTED;
      }
      if (this.isStringType) {
        return FilterConstants.DEFAULT_STRING_SELECTED;
      }
      return FilterConstants.DEFAULT_SELECTED;
    }
  }

  private get isShowOptionRangeFilter(): boolean {
    if (this.filterModeSelected == FilterMode.selection) {
      return true;
    } else {
      return this.toComponent != FilterComponentType.selectionFilter;
    }
  }

  private get toComponent(): FilterComponentType | null {
    if (this.isSelectionMode) {
      return FilterComponentType.selectionFilter;
    }
    if (this.isDateType) {
      return FilterComponentType.dateHistogramFilter;
    }
    if (this.isNumberType) {
      return FilterComponentType.numberFilter;
    }
    if (this.isStringType) {
      return FilterComponentType.selectionFilter;
    }
    return null;
  }

  private get isDateType(): boolean {
    return ChartUtils.isDateType(this.field.fieldType);
  }

  private get isNumberType(): boolean {
    return ChartUtils.isNumberType(this.field.fieldType);
  }

  private get isStringType(): boolean {
    return ChartUtils.isTextType(this.field.fieldType);
  }

  private get isSelectionMode(): boolean {
    return this.filterModeSelected == FilterMode.selection;
  }

  private get selectOptions(): FilterSelectOption[] {
    if (this.isDateType) {
      return FilterConstants.DATE_SELECTION_OPTIONS;
    }
    if (this.isNumberType) {
      return FilterConstants.NUMBER_SELECTION_OPTIONS;
    }
    if (this.isStringType) {
      return FilterConstants.STRING_SELECTION_OPTIONS;
    }
    return [];
  }

  private get field(): Field {
    return this.currentFilter.field;
  }

  private get currentOptionSelected(): string {
    return this.currentFilter.currentOptionSelected || this.defaultOptionSelected;
  }

  private set currentOptionSelected(newValue: string) {
    this.currentFilter.currentOptionSelected = newValue ?? '';
  }

  private get currentInputType(): InputType {
    return this.currentFilter.currentInputType ?? InputType.text;
  }

  private set currentInputType(newInputType: InputType) {
    this.currentFilter.currentInputType = newInputType;
  }

  private get profileField(): FieldDetailInfo {
    return this.dynamicFilter.getProfileField();
  }

  @Watch('isShowPopoverSynced')
  onShown() {
    if (this.isShowPopoverSynced && this.dynamicFilter) {
      this.currentFilter = cloneDeep(this.dynamicFilter);
    }
  }

  mounted() {
    Log.debug('DynamicFilter::mounted', this.btnId);
    this.popupItem = this.$parent.$el;
    this.registerEvents();
  }

  private registerEvents() {
    this.$root.$on('filter-content-changed', this.handleFilterContentChanged);
  }

  beforeDestroy() {
    Log.debug('DynamicFilter::beforeDestroy', this.btnId);
    this.unregisterEvents();
  }

  private unregisterEvents() {
    this.$root.$off('filter-content-changed', this.handleFilterContentChanged);
  }

  private handleFilterContentChanged() {
    window.dispatchEvent(new Event('resize'));
  }

  private hidePopover(): void {
    this.isShowPopoverSynced = false;
  }

  @Emit('onRemove')
  private handleDeleteFilter() {
    this.hidePopover();
  }

  @Provide()
  @Emit('onApplyFilter')
  private handleApplyFilter(): DynamicFilterPopoverData {
    this.hidePopover();
    this.currentValues = this.filterRef.getCurrentValues().filter(item => StringUtils.isNotEmpty(item));
    this.currentOptionSelected = this.filterRef.getCurrentOptionSelected();
    this.currentInputType = this.filterRef.getCurrentInputType();
    Log.debug('handleApplyFilter::', this.filterRef.getCurrentValues(), this.currentValues);
    return {
      currentValues: this.currentValues,
      currentOptionSelected: this.currentOptionSelected,
      currentInputType: this.currentInputType,
      currentFilterMode: this.filterModeSelected,
      control: this.currentFilter.control
    };
  }

  private get dashboardControls(): TabControlData[] {
    return WidgetModule.allTabControls.map(tabControl => tabControl.toTreeNode().data);
  }
}
