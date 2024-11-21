/*
 * @author: tvc12 - Thien Vi
 * @created: 12/31/20, 4:32 PM
 */

import { Component, Emit, Prop, PropSync, Provide, Ref, Vue, Watch } from 'vue-property-decorator';
import ClickOutside from 'vue-click-outside';
import { InternalFilter, Field, FilterMode, ChartControl } from '@core/common/domain/model';
import { FilterProp } from '@/shared/components/filters/FilterProp';
import {
  DateHistogramConditionTypes,
  FilterConstants,
  FilterSelectOption,
  InputType,
  NumberConditionTypes,
  SelectOption,
  StringConditionTypes
} from '@/shared';
import { ChartUtils, DomUtils } from '@/utils';
import { cloneDeep } from 'lodash';
import { StringUtils } from '@/utils/StringUtils';
import { BPopover } from 'bootstrap-vue';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { Log } from '@core/utils';
import NumberFilter from '@/shared/components/filters/NumberFilter.vue';
import DateHistogramFilter from '@/shared/components/filters/DateHistogramFilter.vue';
import SelectionFilter from '@/shared/components/filters/SelectionFilter.vue';

export interface InternalFilterPopoverData {
  currentValues: string[];
  currentOptionSelected: StringConditionTypes | DateHistogramConditionTypes | NumberConditionTypes;
  currentInputType: InputType;
  currentFilterMode: FilterMode;
  selectedControlId?: number;
}

@Component({
  directives: {
    ClickOutside
  }
})
export default class InternalFilterPopover extends Vue {
  private popupItem: Element | null = null;
  private currentFilter = InternalFilter.empty();

  @Prop({ required: true, type: String })
  private readonly targetId!: string;

  @Prop({ required: false, type: String })
  private readonly containerId!: string;

  @PropSync('isShowPopover', { type: Boolean, required: true })
  private isShowPopoverSynced!: boolean;

  @Prop({ required: true, type: InternalFilter })
  private readonly internalFilter!: InternalFilter;

  @Prop({ required: false, type: String, default: 'bottom' })
  private readonly placement!: string;

  @Prop({ required: true, type: String })
  private readonly boundaryOption!: string;

  @Prop({ required: false, default: false })
  private readonly enableControlConfig!: boolean;

  @Prop({ required: false, default: false })
  private readonly isDefaultStyle!: boolean;

  @Prop({ required: false, type: Array, default: () => [] })
  private readonly chartControls!: ChartControl[];

  @Ref()
  private filterComponent?: any;

  @Ref()
  private readonly popover!: BPopover;

  get currentValues(): string[] {
    return this.currentFilter.currentValues;
  }

  set currentValues(newValue: string[]) {
    this.currentFilter.currentValues = newValue ?? [];
  }

  private get filterName(): string {
    return this.currentFilter.name;
  }

  private get filterModeOptions(): SelectOption[] {
    return [
      {
        id: FilterMode.Range,
        displayName: 'Range'
      },
      {
        id: FilterMode.Selection,
        displayName: 'Selection'
      }
    ];
  }

  protected get selectedFilterMode(): FilterMode {
    return this.currentFilter.filterModeSelected ?? FilterMode.Range;
  }

  handleSelectFilterMode(newValue: FilterMode) {
    this.currentFilter.filterModeSelected = newValue;
    this.currentOptionSelected = this.defaultOptionSelected;
  }

  private get defaultOptionSelected(): StringConditionTypes | DateHistogramConditionTypes | NumberConditionTypes {
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

  private get isSupportChangeFilterMode(): boolean {
    if (this.isDateType) {
      return true;
    }
    if (this.isNumberType) {
      return true;
    }
    if (this.isStringType) {
      return false;
    }
    return false;
  }

  private get toComponent(): any | null {
    if (this.isSelectionMode) {
      return SelectionFilter;
    }
    if (this.isDateType) {
      return DateHistogramFilter;
    }
    if (this.isNumberType) {
      return NumberFilter;
    }
    if (this.isStringType) {
      return SelectionFilter;
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
    return this.selectedFilterMode == FilterMode.Selection;
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

  private get currentOptionSelected(): StringConditionTypes | DateHistogramConditionTypes | NumberConditionTypes {
    return this.currentFilter.currentOptionSelected || this.defaultOptionSelected;
  }

  private set currentOptionSelected(newValue: StringConditionTypes | DateHistogramConditionTypes | NumberConditionTypes) {
    this.currentFilter.currentOptionSelected = newValue ?? '';
  }

  private get currentInputType(): InputType {
    return this.currentFilter.currentInputType ?? InputType.Text;
  }

  private set currentInputType(newInputType: InputType) {
    this.currentFilter.currentInputType = newInputType;
  }

  private get profileField(): FieldDetailInfo {
    return this.internalFilter.getProfileField();
  }

  @Watch('isShowPopoverSynced')
  onShown() {
    if (this.isShowPopoverSynced && this.internalFilter) {
      this.currentFilter = cloneDeep(this.internalFilter);
    }
  }

  mounted() {
    this.popupItem = this.$parent.$el;
  }

  protected handleRelocation() {
    window.dispatchEvent(new Event('resize'));
  }

  private hidePopover(): void {
    this.isShowPopoverSynced = false;
  }

  @Emit('onRemove')
  private handleDeleteFilter() {
    this.hidePopover();
  }

  private handleApplyFilter(): void {
    this.hidePopover();
    const component = this.filterComponent as FilterProp;
    this.currentValues = component.getCurrentValues().filter((item: any) => StringUtils.isNotEmpty(item));
    this.currentOptionSelected = component.getSelectedCondition();
    this.currentInputType = component.getCurrentInputType();
    Log.debug('currentValues', Array.from(this.currentValues));
    const data: InternalFilterPopoverData = cloneDeep({
      currentValues: this.currentValues,
      currentOptionSelected: this.currentOptionSelected,
      currentInputType: this.currentInputType,
      currentFilterMode: this.selectedFilterMode,
      selectedControlId: this.currentFilter.controlId || void 0
    });
    // fix-here: validate here
    this.$emit('onApplyFilter', data);
  }

  private get customPopoverClass(): string {
    if (this.isDefaultStyle) {
      return 'filter-popover-area filter-popover-area-default-style';
    } else {
      return 'filter-popover-area';
    }
  }
}
