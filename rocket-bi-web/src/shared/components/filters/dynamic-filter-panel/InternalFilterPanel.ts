import { Component, Emit, Prop, PropSync, Vue, Watch } from 'vue-property-decorator';
import { DateTimeUtils, ListUtils } from '@/utils';
import { DateHistogramConditionTypes, FilterConstants, InputType, NumberConditionTypes, StringConditionTypes } from '@/shared';
import Color from 'color';
import { ChartControl, InternalFilter } from '@core/common/domain/model';
import ChipButton from '@/shared/components/ChipButton.vue';
import ChipListing, { ChipData } from '@/shared/components/ChipListing.vue';
import { ColorUtils } from '@/utils/ColorUtils';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { Log } from '@core/utils';
import InternalFilterPopover from '@/shared/components/filters/dynamic-filter-panel/InternalFilterPopover.vue';
import { InternalFilterPopoverData } from '@/shared/components/filters/dynamic-filter-panel/InternalFilterPopover';

@Component({
  components: {
    ChipListing,
    ChipButton,
    InternalFilterPopover
  }
})
export default class InternalFilterPanel extends Vue {
  private isShowPopover = false;
  private displayConditionType: StringConditionTypes | DateHistogramConditionTypes | NumberConditionTypes = FilterConstants.DEFAULT_SELECTED;
  private baseColor: null | Color = null;

  @PropSync('filter', { required: true, type: InternalFilter })
  private internalFilter!: InternalFilter;

  @Prop({ required: false, type: String, default: 'bottom' })
  private readonly placement!: string;

  @Prop({ required: false, type: Boolean, default: true })
  private readonly isShowDisable!: boolean;

  @Prop({ type: Number, default: 3 })
  private readonly maxChipShowing!: number;

  @Prop({ required: false, type: String, default: 'window' })
  private readonly boundary!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isDefaultStyle!: boolean;

  @Prop({ required: false, default: false })
  private readonly enableControlConfig!: boolean;

  @Prop({ required: false, type: String })
  private readonly id!: string;

  @Prop({ required: false, type: String })
  private readonly containerId!: string;

  @Prop({ required: false, type: Array, default: () => [] })
  protected readonly chartControls!: ChartControl[];

  get currentValues(): string[] {
    return this.internalFilter.currentValues ?? [];
  }

  set currentValues(newValue: string[]) {
    this.internalFilter.currentValues = newValue ?? [];
  }

  protected get isEnable(): boolean {
    return this.internalFilter.isEnable ?? true;
  }

  private get filterName(): string {
    return this.internalFilter.name;
  }

  protected get isDisable(): boolean {
    return !this.isEnable;
  }

  private get currentInputType(): InputType {
    return this.internalFilter.currentInputType ?? InputType.Text;
  }

  private set currentInputType(newInputType: InputType) {
    this.internalFilter.currentInputType = newInputType;
  }

  private get isShowTagListing(): boolean {
    switch (this.currentInputType) {
      case InputType.None:
        return true;
      default:
        return ListUtils.isNotEmpty(this.currentValues);
    }
  }

  private get dashboardTheme(): string {
    return _ThemeStore.dashboardTheme;
  }

  protected get isDarkTheme(): boolean {
    return _ThemeStore.isDarkTheme;
  }

  @Watch('dashboardTheme', { deep: true })
  onThemeChanged(currentTheme: string) {
    this.baseColor = new Color(ColorUtils.getColorFromCssVariable('var(--filter-color)'));
  }

  private get viewPanelStyle(): CSSStyleDeclaration {
    if (this.isShowDisable) {
      const baseColor = this.baseColor ? this.baseColor : new Color(ColorUtils.getColorFromCssVariable('var(--filter-color)'));
      const alpha = this.isEnable ? baseColor.alpha() : this.isDarkTheme ? 0.1 : 0.4;
      return {
        background: baseColor.alpha(alpha).toString()
      } as CSSStyleDeclaration;
    } else {
      return {} as any;
    }
  }

  private get currentOptionSelected() {
    return this.internalFilter.currentOptionSelected || FilterConstants.DEFAULT_SELECTED;
  }

  private set currentOptionSelected(newValue: StringConditionTypes | DateHistogramConditionTypes | NumberConditionTypes) {
    this.internalFilter.currentOptionSelected = newValue ?? StringConditionTypes.in;
  }

  protected get chipDataList(): ChipData[] {
    if (this.internalFilter.controlId) {
      return this.getChipDataListForControl();
    } else {
      return this.getNormalChipDataList();
    }
  }

  private getChipDataListForControl(): ChipData[] {
    switch (this.currentInputType) {
      case InputType.None:
        return [
          {
            title: this.currentOptionSelected,
            isShowRemove: true
          }
        ];
      case InputType.Date:
        return [
          {
            title: `${this.currentValues[0]}`,
            isShowRemove: true
          }
        ];
      case InputType.DateRange:
        return [
          {
            title: `${this.currentValues[0]} - ${this.currentValues[1]}`,
            isShowRemove: true
          }
        ];
      case InputType.Text:
        return [
          {
            title: this.currentValues[0],
            isShowRemove: true
          }
        ];

      case InputType.NumberRange:
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

  private getNormalChipDataList(): ChipData[] {
    switch (this.currentInputType) {
      case InputType.None:
        return [
          {
            title: this.currentOptionSelected,
            isShowRemove: true
          }
        ];
      case InputType.Date:
        return [
          {
            title: DateTimeUtils.formatDateDisplay(this.currentValues[0]),
            isShowRemove: true
          }
        ];
      case InputType.DateRange:
        return [
          {
            title: `${DateTimeUtils.formatDateDisplay(this.currentValues[0])} - ${DateTimeUtils.formatDateDisplay(this.currentValues[1])}`,
            isShowRemove: true
          }
        ];
      case InputType.Text:
        return [
          {
            title: this.currentValues[0],
            isShowRemove: true
          }
        ];

      case InputType.NumberRange:
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
    this.displayConditionType = this.getDisplayConditionType(this.currentOptionSelected, this.currentInputType);
  }

  @Emit('onRemove')
  private handleDeleteFilter() {
    // this.hidePopover();
  }

  protected handleApplyFilter(filterPopoverData: InternalFilterPopoverData): void {
    this.currentValues = filterPopoverData.currentValues;
    this.currentInputType = filterPopoverData.currentInputType;
    this.currentOptionSelected = filterPopoverData.currentOptionSelected;
    this.internalFilter.filterModeSelected = filterPopoverData.currentFilterMode;
    this.internalFilter.controlId = filterPopoverData.selectedControlId ?? null;
    this.displayConditionType = this.getDisplayConditionType(this.currentOptionSelected, this.currentInputType);
    this.$emit('onApplyFilter');
  }

  private getDisplayConditionType(selectedConditionType: StringConditionTypes | DateHistogramConditionTypes | NumberConditionTypes, inputType: InputType) {
    switch (inputType) {
      case InputType.None:
        return FilterConstants.DEFAULT_SELECTED;
      default:
        return selectedConditionType;
    }
  }

  showPopover(): void {
    this.isShowPopover = true;
  }

  @Emit('onValuesChanged')
  private handleRemoveChipAt(index: number): void {
    switch (this.currentInputType) {
      case InputType.None:
        this.currentValues = [];
        this.currentInputType = InputType.Text;
        this.currentOptionSelected = FilterConstants.DEFAULT_SELECTED;
        this.displayConditionType = FilterConstants.DEFAULT_SELECTED;
        break;
      case InputType.DateRange:
        this.currentValues = [];
        this.currentOptionSelected = FilterConstants.DEFAULT_DATE_SELECTED;
        this.displayConditionType = FilterConstants.DEFAULT_DATE_SELECTED;
        break;
      case InputType.Text:
        this.currentValues = [];
        this.currentOptionSelected = FilterConstants.DEFAULT_SELECTED;
        this.displayConditionType = FilterConstants.DEFAULT_SELECTED;
        break;
      case InputType.NumberRange:
        this.currentValues = [];
        this.currentOptionSelected = FilterConstants.DEFAULT_NUMBER_SELECTED;
        this.displayConditionType = FilterConstants.DEFAULT_NUMBER_SELECTED;
        break;
      default:
        if (this.currentValues.length === 1 && index === 0) {
          this.currentValues.splice(-1, 1);
          this.displayConditionType = FilterConstants.DEFAULT_SELECTED;
          this.currentOptionSelected = FilterConstants.DEFAULT_SELECTED;
        } else {
          this.currentValues.splice(index, 1);
        }
    }
  }

  private toggleEnableFilter() {
    this.internalFilter.isEnable = !this.isEnable;
    this.$emit('onFilterStatusChanged');
  }

  @Watch('filter.currentOptionSelected')
  private handleChangedCondition(newValue: StringConditionTypes | DateHistogramConditionTypes | NumberConditionTypes) {
    Log.debug('handleChangedCondition::', newValue);
    this.displayConditionType = newValue;
  }
}
