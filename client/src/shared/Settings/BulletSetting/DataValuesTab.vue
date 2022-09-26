<template>
  <PanelHeader header="Bullet" target-id="bullet-tab">
    <div class="row-config-container">
      <InputSetting
        id="min-value-input"
        ref="minInput"
        :value="min"
        applyFormatNumber
        label="Min"
        placeholder="Input Min Value"
        size="half"
        type="number"
        @onChanged="handleMinSaved"
      />
    </div>
    <div class="row-config-container">
      <InputSetting
        id="milestone-1-value-input"
        ref="mileStone1Input"
        :value="mileStone1"
        applyFormatNumber
        label="Milestone 1"
        placeholder="Input Milestone 1 Value"
        size="half"
        type="number"
        @onChanged="handleMileStone1Saved"
      />
      <!--      <ColorSetting-->
      <!--        id="range-2-color"-->
      <!--        :defaultColor="defaultSetting.range2Color"-->
      <!--        :value="range2Color"-->
      <!--        label="Range 2 Color"-->
      <!--        size="half"-->
      <!--        @onChanged="handleRangeColor2Changed"-->
      <!--      />-->
    </div>
    <div class="row-config-container">
      <InputSetting
        id="miles-stone-2-value-input"
        ref="milesStone2Input"
        :value="milesStone2"
        applyFormatNumber
        label="Mile Stone 2"
        placeholder="Input Mile Stone 2 Value"
        size="half"
        type="number"
        @onChanged="handleMileStone2Saved"
      />
      <!--      <ColorSetting-->
      <!--        id="range-3-color"-->
      <!--        :defaultColor="defaultSetting.range3Color"-->
      <!--        :value="range3Color"-->
      <!--        label="Range 3 Color"-->
      <!--        size="half"-->
      <!--        @onChanged="handleRangeColor3Changed"-->
      <!--      />-->
    </div>
    <div class="row-config-container">
      <InputSetting
        id="max-value-input"
        ref="maxInput"
        :value="max"
        applyFormatNumber
        label="Max"
        placeholder="Input Max Value"
        size="half"
        type="number"
        @onChanged="handleMaxSaved"
      />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SeriesOptionData } from '@core/domain';
import { get, toNumber } from 'lodash';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';

@Component({ components: { PanelHeader } })
export default class DataValuesTab extends Vue {
  private readonly defaultSetting = {
    min: 0,
    mileStone1: 5000,
    mileStone2: 7500,
    max: 10000
  };
  @Prop({ required: false, type: Object })
  private readonly setting!: SeriesOptionData;

  private get min(): string {
    return `${get(this.setting, 'yAxis[0].plotBands[0].from', this.defaultSetting.min)}`;
  }

  private get mileStone1(): string {
    return `${get(this.setting, 'yAxis[0].plotBands[1].from', this.defaultSetting.mileStone1)}`;
  }

  private get milesStone2(): string {
    return `${get(this.setting, 'yAxis[0].plotBands[2].from', this.defaultSetting.mileStone2)}`;
  }

  private get max(): string {
    return `${get(this.setting, 'yAxis[0].plotBands[2].to', this.defaultSetting.max)}`;
  }

  private handleMinSaved(newValue: string) {
    const valueAsNumber = toNumber(newValue);
    this.$emit('onChanged', 'yAxis[0].plotBands[0].from', valueAsNumber);
  }

  private handleMaxSaved(newValue: string) {
    const valueAsNumber = toNumber(newValue);
    this.$emit('onChanged', 'yAxis[0].plotBands[2].to', valueAsNumber);
  }

  private handleMileStone1Saved(newValue: string) {
    const valueAsNumber = toNumber(newValue);
    this.$emit('onChanged', 'yAxis[0].plotBands[0].to', valueAsNumber);
    this.$emit('onChanged', 'yAxis[0].plotBands[1].from', valueAsNumber);
  }

  private handleMileStone2Saved(newValue: string) {
    const valueAsNumber = toNumber(newValue);
    this.$emit('onChanged', 'yAxis[0].plotBands[1].to', valueAsNumber);
    this.$emit('onChanged', 'yAxis[0].plotBands[2].from', valueAsNumber);
  }

  private handleTargetSaved(newValue: string) {
    const valueAsNumber = toNumber(newValue);
    this.$emit('onChanged', 'plotOptions.series.targetOptions.value', valueAsNumber);
  }
}
</script>
