import { Component, Emit, Prop, PropSync, Vue, Watch } from 'vue-property-decorator';
import { DateTimeFormatter, ListUtils } from '@/utils';
import { FilterConstants, InputType } from '@/shared';
import Color from 'color';
import NumberFilter from '@/shared/components/filters/NumberFilter.vue';
import { DynamicFilter } from '@core/domain/Model';
import DateHistogramFilter from '@/shared/components/filters/DateHistogramFilter.vue';
import SelectionFilter from '@/shared/components/filters/SelectionFilter.vue';
import ChipButton from '@/shared/components/ChipButton.vue';
import ChipListing, { ChipData } from '@/shared/components/ChipListing.vue';
import DynamicFilterPopover from '@/shared/components/filters/DynamicFilterPanel/DynamicFilterPopover.vue';
import { DynamicFilterPopoverData } from '@/shared/components/filters/DynamicFilterPanel/DynamicFilterPopover';
import { ColorUtils } from '@/utils/ColorUtils';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { Log } from '@core/utils';

@Component({
  components: {
    ChipListing,
    ChipButton,
    NumberFilter,
    DateHistogramFilter,
    SelectionFilter,
    DynamicFilterPopover
  }
})
export default class DynamicFilterPanel extends Vue {
  private isShowPopover = false;
  private displayFilterType: string = FilterConstants.DEFAULT_SELECTED;
  private baseColor: null | Color = null;

  @PropSync('filter', { required: true, type: DynamicFilter })
  private dynamicFilter!: DynamicFilter;

  @Prop({ required: false, type: String, default: 'bottom' })
  private placement!: string;

  @Prop({ required: false, type: Boolean, default: true })
  private isShowDisable!: boolean;

  @Prop({ type: Number, default: 3 })
  private maxChipShowing!: number;

  @Prop({ required: false, type: String, default: 'window' })
  private readonly boundary!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isDefaultStyle!: boolean;

  @Prop({ required: false, default: false })
  private readonly enableControlConfig!: boolean;
  @Prop()
  id!: string;

  get currentValues(): string[] {
    return this.dynamicFilter.currentValues ?? [];
  }

  set currentValues(newValue: string[]) {
    this.dynamicFilter.currentValues = newValue ?? [];
  }

  private get isEnable(): boolean {
    return this.dynamicFilter.isEnable ?? true;
  }

  private set isEnable(newValue: boolean) {
    this.dynamicFilter.isEnable = newValue;
  }

  get btnId() {
    // return `btn-filter-${RandomUtils.nextInt()}`;
    return this.id;
  }

  private get filterName(): string {
    return this.dynamicFilter.name;
  }

  private get isDisable(): boolean {
    return !this.isEnable;
  }

  private get currentInputType(): InputType {
    return this.dynamicFilter.currentInputType ?? InputType.text;
  }

  private set currentInputType(newInputType: InputType) {
    this.dynamicFilter.currentInputType = newInputType;
  }

  private get isShowTagListing(): boolean {
    switch (this.currentInputType) {
      case InputType.none:
        return true;
      default:
        return ListUtils.isNotEmpty(this.currentValues);
    }
  }

  private get dashboardTheme(): string {
    return _ThemeStore.dashboardTheme;
  }

  @Watch('dashboardTheme', { deep: true })
  onThemeChanged(currentTheme: string) {
    this.baseColor = new Color(ColorUtils.getColorFromCssVariable('var(--filter-color)'));
  }

  private get viewPanelStyle(): CSSStyleDeclaration {
    if (this.isShowDisable) {
      const baseColor = this.baseColor ? this.baseColor : new Color(ColorUtils.getColorFromCssVariable('var(--filter-color)'));
      const alpha = this.isEnable ? baseColor.alpha() : 0.1;
      return {
        background: baseColor.alpha(alpha).toString()
      } as CSSStyleDeclaration;
    } else {
      return {} as any;
    }
  }

  private get currentOptionSelected(): string {
    return this.dynamicFilter.currentOptionSelected || FilterConstants.DEFAULT_SELECTED;
  }

  private set currentOptionSelected(newValue: string) {
    this.dynamicFilter.currentOptionSelected = newValue ?? '';
  }

  private get listChipData(): ChipData[] {
    switch (this.currentInputType) {
      case InputType.none:
        return [
          {
            title: this.currentOptionSelected,
            isShowRemove: true
          }
        ];
      case InputType.date:
        return [
          {
            title: DateTimeFormatter.formatDateDisplay(this.currentValues[0]),
            isShowRemove: true
          }
        ];
      case InputType.dateRange:
        return [
          {
            title: `${DateTimeFormatter.formatDateDisplay(this.currentValues[0])} - ${DateTimeFormatter.formatDateDisplay(this.currentValues[1])}`,
            isShowRemove: true
          }
        ];
      case InputType.text:
        return [
          {
            title: this.currentValues[0],
            isShowRemove: true
          }
        ];

      case InputType.numberRange:
        return [
          {
            title: `${this.currentValues[0]} - ${this.currentValues[1]}`,
            isShowRemove: true
          }
        ];
      default:
        return this.currentValues.map(value => {
          return {
            title: value,
            isShowRemove: true
          };
        });
    }
  }

  mounted() {
    this.displayFilterType = this.getDisplayFilterType(this.currentValues, this.currentOptionSelected, this.currentInputType);
  }

  @Emit('onRemove')
  private handleDeleteFilter() {
    // this.hidePopover();
  }

  @Emit('onApplyFilter')
  private handleApplyFilter(filterPopoverData: DynamicFilterPopoverData) {
    this.currentValues = filterPopoverData.currentValues;
    this.currentInputType = filterPopoverData.currentInputType;
    this.currentOptionSelected = filterPopoverData.currentOptionSelected;
    this.dynamicFilter.filterModeSelected = filterPopoverData.currentFilterMode;
    this.displayFilterType = this.getDisplayFilterType(this.currentValues, this.currentOptionSelected, this.currentInputType);
    this.dynamicFilter.control = filterPopoverData.control;
    Log.debug('DynamicFilterPanel::handleApplyFilter', this.dynamicFilter);
  }

  private getDisplayFilterType(currentValues: string[], currentOptionSelected: string, currentInputType: InputType): string {
    switch (currentInputType) {
      case InputType.none:
        return FilterConstants.DEFAULT_SELECTED;
      default:
        return this.currentOptionSelected;
    }
  }

  showPopover(): void {
    this.isShowPopover = true;
  }

  @Emit('onValuesChanged')
  private handleRemoveChipAt(index: number): void {
    switch (this.currentInputType) {
      case InputType.none:
        this.currentValues = [];
        this.currentInputType = InputType.text;
        this.currentOptionSelected = '';
        this.displayFilterType = FilterConstants.DEFAULT_SELECTED;
        break;
      case InputType.dateRange:
        this.currentValues = [];
        this.currentOptionSelected = '';
        this.displayFilterType = FilterConstants.DEFAULT_DATE_SELECTED;
        break;
      case InputType.text:
        this.currentValues = [];
        this.currentOptionSelected = '';
        this.displayFilterType = FilterConstants.DEFAULT_SELECTED;
        break;
      case InputType.numberRange:
        this.currentValues = [];
        break;
      default:
        if (this.currentValues.length === 1 && index === 0) {
          this.currentValues.splice(-1, 1);
          this.displayFilterType = FilterConstants.DEFAULT_SELECTED;
          this.currentOptionSelected = '';
        } else {
          this.currentValues.splice(index, 1);
        }
    }
  }

  @Emit('onFilterStatusChanged')
  private toggleEnableFilter() {
    this.isEnable = !this.isEnable;
  }

  @Watch('filter.currentOptionSelected')
  private handleCurrentOptionSelectedChanged(newValue: string) {
    Log.debug('handleCurrentOptionSelectedChanged::', newValue);
    this.displayFilterType = newValue;
  }
}
