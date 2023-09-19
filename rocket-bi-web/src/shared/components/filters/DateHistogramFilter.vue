<template>
  <div class="date-histogram-filter-area">
    <SelectionInput
      :optionSelected.sync="optionSelected"
      :options="selectOptions"
      :values.sync="inputValues"
      :isManualInput.sync="isManualInput"
      :enableControlConfig="enableControlConfig && !hideControlConfig"
      :selected-control-id="selectedControlId"
      :chartControls="chartControls"
      @update:selectedControlId="id => $emit('update:selectedControlId', id)"
      @applyFilter="() => $emit('applyFilter')"
    />
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import SelectionInput from '@/shared/components/filters/selection-input/SelectionInput.vue';
import { DateHistogramConditionTypes, FilterConstants, FilterSelectOption, InputType } from '@/shared';
import { FilterProp } from '@/shared/components/filters/FilterProp';
import { ListUtils } from '@/utils';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { ChartControl, WidgetId } from '@core/common/domain';

@Component({
  components: { SelectionInput }
})
export default class DateHistogramFilter extends Vue implements FilterProp {
  private optionSelected = FilterConstants.DEFAULT_DATE_SELECTED;
  private isManualInput = false;
  protected inputValues: string[] = [];
  @Prop({ type: Array, default: () => [] })
  readonly defaultValues!: string[];
  @Prop({ type: String, default: '' })
  readonly defaultOptionSelected!: string;
  @Prop({ required: true })
  readonly profileField!: FieldDetailInfo;

  @Prop({ required: false, default: false })
  private readonly enableControlConfig!: boolean;

  @Prop({ required: false, type: Number })
  private readonly selectedControlId?: WidgetId;

  @Prop({ required: false, type: Array, default: () => [] })
  private readonly chartControls!: ChartControl[];

  protected get selectOptions(): FilterSelectOption[] {
    return [
      {
        displayName: DateHistogramConditionTypes.between,
        id: DateHistogramConditionTypes.between,
        inputType: InputType.DateRange
      },
      {
        displayName: DateHistogramConditionTypes.betweenAndIncluding,
        id: DateHistogramConditionTypes.betweenAndIncluding,
        inputType: InputType.DateRange
      },
      {
        displayName: DateHistogramConditionTypes.earlierThan,
        id: DateHistogramConditionTypes.earlierThan,
        inputType: InputType.Date
      },
      {
        displayName: DateHistogramConditionTypes.laterThan,
        id: DateHistogramConditionTypes.laterThan,
        inputType: InputType.Date
      },
      {
        displayName: DateHistogramConditionTypes.lastNMinutes,
        id: DateHistogramConditionTypes.lastNMinutes,
        inputType: InputType.Text
      },
      {
        displayName: DateHistogramConditionTypes.lastNHours,
        id: DateHistogramConditionTypes.lastNHours,
        inputType: InputType.Text
      },
      {
        displayName: DateHistogramConditionTypes.lastNDays,
        id: DateHistogramConditionTypes.lastNDays,
        inputType: InputType.Text
      },
      {
        displayName: DateHistogramConditionTypes.lastNWeeks,
        id: DateHistogramConditionTypes.lastNWeeks,
        inputType: InputType.Text
      },
      {
        displayName: DateHistogramConditionTypes.lastNMonths,
        id: DateHistogramConditionTypes.lastNMonths,
        inputType: InputType.Text
      },
      {
        displayName: DateHistogramConditionTypes.lastNYears,
        id: DateHistogramConditionTypes.lastNYears,
        inputType: InputType.Text
      },

      {
        displayName: DateHistogramConditionTypes.currentDay,
        id: DateHistogramConditionTypes.currentDay,
        inputType: InputType.None
      },
      {
        displayName: DateHistogramConditionTypes.currentWeek,
        id: DateHistogramConditionTypes.currentWeek,
        inputType: InputType.None
      },
      {
        displayName: DateHistogramConditionTypes.currentMonth,
        id: DateHistogramConditionTypes.currentMonth,
        inputType: InputType.None
      },
      {
        displayName: DateHistogramConditionTypes.currentQuarter,
        id: DateHistogramConditionTypes.currentQuarter,
        inputType: InputType.None
      },
      {
        displayName: DateHistogramConditionTypes.currentYear,
        id: DateHistogramConditionTypes.currentYear,
        inputType: InputType.None
      }
    ];
  }

  mounted() {
    if (this.defaultOptionSelected == FilterConstants.DEFAULT_SELECTED) {
      this.optionSelected = FilterConstants.DEFAULT_DATE_SELECTED;
    } else {
      this.optionSelected = (this.defaultOptionSelected as DateHistogramConditionTypes) || FilterConstants.DEFAULT_DATE_SELECTED;
    }
    this.isManualInput = !this.selectedControlId;
  }

  getSelectedCondition(): DateHistogramConditionTypes {
    return this.optionSelected;
  }

  getCurrentValues(): string[] {
    return this.inputValues;
  }

  getCurrentInputType(): InputType {
    const currentSelect = this.selectOptions.find(options => options.id == this.optionSelected) ?? this.selectOptions[0];
    return currentSelect.inputType;
  }

  @Watch('defaultValues', { immediate: true })
  private handleOnDefaultValues(newValues: string[]) {
    if (ListUtils.isNotEmpty(newValues)) {
      const [from, to, _] = newValues;
      this.inputValues = [from ?? '', to ?? ''];
    } else {
      this.inputValues = [];
    }
  }

  private get hideControlConfig(): boolean {
    switch (this.optionSelected) {
      case DateHistogramConditionTypes.currentDay:
      case DateHistogramConditionTypes.currentMonth:
      case DateHistogramConditionTypes.currentQuarter:
      case DateHistogramConditionTypes.currentYear:
      case DateHistogramConditionTypes.currentWeek:
        return true;
      default:
        return false;
    }
  }

  protected relocation(): void {
    this.$emit('relocation');
  }
}
</script>
