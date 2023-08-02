<template>
  <div class="date-histogram-filter-area">
    <SelectionInput
      :optionSelected.sync="optionSelected"
      :options="selectOptions"
      :values.sync="values"
      :controlOptions="controlOptions"
      :control.sync="syncControl"
      :enableControlConfig="enableControlConfig && !hideControlConfig"
    />
  </div>
</template>
<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator';
import SelectionInput from '@/shared/components/filters/selection-input/SelectionInput.vue';
import { DateHistogramConditionTypes, FilterConstants, FilterSelectOption, InputType, StringConditionTypes } from '@/shared';
import { FilterProp } from '@/shared/components/filters/FilterProp';
import { ListUtils } from '@/utils';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { TabControlData } from '@core/common/domain';
import { ValueType } from '@/shared/components/filters/selection-input/ValueType';

@Component({
  components: { SelectionInput }
})
export default class DateHistogramFilter extends Vue implements FilterProp {
  @Prop({ type: Array, default: () => [] })
  defaultValues!: string[];
  @Prop({ type: String, default: '' })
  defaultOptionSelected!: string;
  @Prop({ required: true })
  profileField!: FieldDetailInfo;
  private optionSelected = FilterConstants.DEFAULT_DATE_SELECTED;
  private values: string[] = [];

  @Prop({ required: false, default: false })
  private readonly enableControlConfig!: boolean;

  @Prop({ type: Array, default: () => [] })
  controlOptions!: TabControlData[];

  @PropSync('control')
  syncControl?: TabControlData;
  private get selectOptions(): FilterSelectOption[] {
    return FilterConstants.DATE_RANGE_OPTIONS;
  }

  mounted() {
    if (this.defaultOptionSelected == FilterConstants.DEFAULT_SELECTED) {
      this.optionSelected = FilterConstants.DEFAULT_DATE_SELECTED;
    } else {
      this.optionSelected = (this.defaultOptionSelected as DateHistogramConditionTypes) || FilterConstants.DEFAULT_DATE_SELECTED;
    }
  }

  getCurrentOptionSelected(): string {
    return this.optionSelected;
  }

  getCurrentValues(): string[] {
    return this.values;
  }

  getCurrentInputType(): InputType {
    const currentSelect = this.selectOptions.find(options => options.id == this.optionSelected) ?? this.selectOptions[0];
    return currentSelect.inputType;
  }

  @Watch('defaultValues', { immediate: true })
  private handleOnDefaultValues() {
    if (ListUtils.isNotEmpty(this.defaultValues)) {
      this.values = [this.defaultValues[0] ?? '', this.defaultValues[1] ?? ''];
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
}
</script>
