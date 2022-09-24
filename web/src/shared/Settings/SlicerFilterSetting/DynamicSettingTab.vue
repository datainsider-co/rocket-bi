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
    <ToggleSetting id="date-enable" :value="!isNumberSlicer" class="mb-2" label="Use with date" @onChanged="handleDateEnabled" />
    <div class="row-config-container" v-if="isNumberSlicer">
      <InputSetting
        id="min-setting"
        :applyFormatNumber="true"
        placeholder="Input Min Value"
        :value="min"
        class="mr-2"
        label="Min"
        size="half"
        type="number"
        @onChanged="handleMinChanged"
      />
      <InputSetting
        id="max-setting"
        :applyFormatNumber="true"
        placeholder="Input Max Value"
        :value="max"
        label="Min"
        size="half"
        type="number"
        @onChanged="handleMaxChanged"
      />
    </div>
    <div class="row-config-container" v-else>
      <DiDatePicker :date.sync="minAsDate" :isShowIconDate="false" class="calender-picker w-50 mr-2" placement="bottom"></DiDatePicker>
      <DiDatePicker :date.sync="maxAsDate" :isShowIconDate="false" class="calender-picker w-50" placement="bottom"></DiDatePicker>
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { InputControlQuerySetting, SlicerOptionData } from '@core/domain';
import DefaultValueSetting from '@/shared/Settings/TabFilterSetting/DefaultValueSetting.vue';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { toNumber } from 'lodash';
import { HeadComparisonOptions, TailComparisonOptions } from '@/shared/Settings/Common/Options/ComparisonOptions';
import { SelectOption } from '@/shared';
import SlicerPreview from '@/shared/Settings/SlicerFilterSetting/SlicerPreview.vue';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';

@Component({ components: { DefaultValueSetting, PanelHeader, SlicerPreview, DiDatePicker } })
export default class DynamicSettingTab extends Vue {
  @Prop({ required: false, type: Object })
  setting?: SlicerOptionData;

  @Prop({ required: true })
  query!: InputControlQuerySetting;
  private readonly fromOptions = HeadComparisonOptions;
  private readonly toOptions = TailComparisonOptions;

  private get step(): string {
    return `${this.setting?.step ?? 1}`;
  }

  private get min(): string {
    return `${this.setting?.from?.value ?? 0}`;
  }

  private get max(): string {
    return `${this.setting?.to?.value ?? 1000000}`;
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

  private handleMinChanged(value: string) {
    const valueAsNumber = toNumber(value);
    this.$emit('onChanged', 'from.value', valueAsNumber);
    if (valueAsNumber > toNumber(this.max)) {
      this.$emit('onChanged', 'to.value', valueAsNumber);
    }
  }

  private handleMaxChanged(value: string) {
    const valueAsNumber = toNumber(value);
    this.$emit('onChanged', 'to.value', valueAsNumber);
    if (valueAsNumber < toNumber(this.min)) {
      this.$emit('onChanged', 'from.value', valueAsNumber);
    }
  }

  private handleResetDefaultValue() {
    return this.$emit('onChanged', 'default.setting', null);
  }

  private get isNumberSlicer(): boolean {
    return this.setting?.dynamicSettings?.isNumber ?? false;
  }

  private handleDateEnabled(enabled: boolean) {
    this.$emit('onChanged', 'dynamicSettings.isNumber', !enabled);
    if (enabled) {
      const fromValueAsTs = new Date(new Date().getFullYear(), 0, 1).valueOf();
      const toValueAsTs = new Date().valueOf();
      this.$emit('onChanged', 'from.value', fromValueAsTs);
      this.$emit('onChanged', 'to.value', toValueAsTs);
    } else {
      this.$emit('onChanged', 'from.value', 0);
      this.$emit('onChanged', 'to.value', 1000000);
    }
  }

  private get minAsDate(): Date {
    return this.setting?.from?.value ? new Date(this.setting?.from?.value) : new Date(new Date().getFullYear(), 0, 1);
  }

  private set minAsDate(newDate: Date) {
    const dateAsTs = newDate.valueOf();
    this.$emit('onChanged', 'from.value', dateAsTs.valueOf());
    if (dateAsTs > toNumber(this.max)) {
      this.$emit('onChanged', 'to.value', dateAsTs);
    }
  }

  private get maxAsDate() {
    return this.setting?.to?.value ? new Date(this.setting?.to?.value) : new Date();
  }

  private set maxAsDate(newDate: Date) {
    const dateAsTs = newDate.valueOf();
    this.$emit('onChanged', 'to.value', dateAsTs.valueOf());
    if (dateAsTs < toNumber(this.min)) {
      this.$emit('onChanged', 'from.value', dateAsTs);
    }
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
