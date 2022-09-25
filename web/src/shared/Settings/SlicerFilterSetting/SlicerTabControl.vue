<template>
  <PanelHeader ref="panel" header="Tab controls" target-id="data-point-tab">
    <InputSetting
      id="step-setting"
      :applyFormatNumber="true"
      placeholder="Input Step"
      :value="step"
      class="mb-2"
      label="Step"
      size="small"
      type="number"
      @onChanged="handleStepChanged"
      v-if="isNumberSlicer"
    />
    <DefaultValueSetting
      :setting="setting.default"
      class="mb-3"
      title="Default Comparison"
      @onReset="handleResetDefaultValue"
      @onSaved="handleSetDefaultValue"
    />
    <div class="row-config-container comparison-setting">
      <DropdownSetting
        id="from-comparison-setting"
        :options="fromOptions"
        :value="isEqualFromComparison"
        label="Comparison options"
        size="half"
        @onChanged="handleFromComparisonChanged"
      />
      <DropdownSetting
        id="to-comparison-setting"
        :options="toOptions"
        :value="isEqualToComparison"
        class="to-comparison-setting"
        label=""
        size="half"
        @onChanged="handleToComparisonChanged"
      />
    </div>
    <SlicerPreview :setting="setting" style="margin-bottom: 35px" />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { GroupedTableQuerySetting, SlicerOptionData, InputControlQuerySetting } from '@core/domain';
import DefaultValueSetting from '@/shared/Settings/TabFilterSetting/DefaultValueSetting.vue';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { get, toNumber } from 'lodash';
import { HeadComparisonOptions, TailComparisonOptions } from '@/shared/Settings/Common/Options/ComparisonOptions';
import { SelectOption } from '@/shared';
import SlicerPreview from '@/shared/Settings/SlicerFilterSetting/SlicerPreview.vue';
import { SlicerDisplay } from '@chart/SlicerFilter/NumberSlicer.vue';
import { ChartUtils } from '@/utils';

@Component({ components: { DefaultValueSetting, PanelHeader, SlicerPreview } })
export default class SlicerTabControl extends Vue {
  @Prop({ required: false, type: Object })
  setting?: SlicerOptionData;

  @Prop({ required: true })
  query!: InputControlQuerySetting;
  private readonly fromOptions = HeadComparisonOptions;
  private readonly toOptions = TailComparisonOptions;

  private get step(): string {
    return `${this.setting?.step ?? 1}`;
  }

  private get isEqualFromComparison(): boolean {
    return this.setting?.from?.equal ?? false;
  }

  private get isEqualToComparison(): boolean {
    return this.setting?.to?.equal ?? false;
  }

  private handleFromComparisonChanged(option: SelectOption) {
    this.$emit('onChanged', 'from.equal', option);
  }

  private handleToComparisonChanged(option: SelectOption) {
    this.$emit('onChanged', 'to.equal', option);
  }

  private handleSetDefaultValue(value: any) {
    this.$emit('onChanged', 'default.setting', value);
  }

  private handleStepChanged(newStep: string) {
    const step = toNumber(newStep) > 0 ? toNumber(newStep) : 1;
    this.$emit('onChanged', 'step', step);
  }

  private handleResetDefaultValue() {
    return this.$emit('onChanged', 'default.setting', null);
  }

  private get isNumberSlicer(): boolean {
    switch (this.slicerDisplay) {
      case SlicerDisplay.number:
      case SlicerDisplay.dateAsNumber:
        return true;
      case SlicerDisplay.date:
        return false;
      default:
        return false;
    }
  }

  private get slicerDisplay(): SlicerDisplay {
    const fieldType: string = get(this.query, 'columns[0].function.field.fieldType', '');
    //column là cột date thì check xem phải predior k
    if (ChartUtils.isDateType(fieldType)) {
      const dateFunctionType = this.query.values[0]!.function?.scalarFunction?.className ?? '';
      return ChartUtils.isDateHistogramPeriodic(dateFunctionType) ? SlicerDisplay.dateAsNumber : SlicerDisplay.date;
    }
    return SlicerDisplay.number;
  }
}
</script>

<style lang="scss" scoped>
.comparison-setting {
  font-size: 12px;

  .to-comparison-setting {
    margin: 13px 0 0 8px;
  }
}
</style>
