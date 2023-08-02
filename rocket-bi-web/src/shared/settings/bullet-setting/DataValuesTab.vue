<template>
  <PanelHeader header="Bullet" target-id="bullet-tab">
    <InputSetting
      id="min-value-input"
      ref="minInput"
      :value="min"
      applyFormatNumber
      class="mb-2"
      :label="`${configSetting['min'].label}`"
      :hint="`${configSetting['min'].hint}`"
      :placeholder="`${configSetting['min'].hint}`"
      type="number"
      @onChanged="handleMinSaved"
    />
    <InputSetting
      id="milestone-1-value-input"
      ref="mileStone1Input"
      :value="mileStone1"
      applyFormatNumber
      :label="`${configSetting['milestone1'].label}`"
      :hint="`${configSetting['milestone1'].hint}`"
      :placeholder="`${configSetting['milestone1'].hint}`"
      type="number"
      class="mb-2"
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
    <InputSetting
      id="miles-stone-2-value-input"
      ref="milesStone2Input"
      :value="milesStone2"
      applyFormatNumber
      class="mb-2"
      :label="`${configSetting['milestone2'].label}`"
      :hint="`${configSetting['milestone2'].hint}`"
      :placeholder="`${configSetting['milestone2'].hint}`"
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
    <InputSetting
      id="max-value-input"
      ref="maxInput"
      :value="max"
      class="mb-2"
      applyFormatNumber
      :label="`${configSetting['max'].label}`"
      :hint="`${configSetting['max'].hint}`"
      :placeholder="`${configSetting['max'].hint}`"
      type="number"
      @onChanged="handleMaxSaved"
    />
    <revert-button @click="handleRevert" />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SeriesOptionData, SettingKey } from '@core/common/domain';
import { get, toNumber } from 'lodash';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';

@Component({ components: { PanelHeader } })
export default class DataValuesTab extends Vue {
  private readonly configSetting = window.chartSetting['bulletColor.milestone'];

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

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    //Min
    settingAsMap.set('yAxis[0].plotBands[0].from', this.defaultSetting.min);
    //Milestone 1
    settingAsMap.set('yAxis[0].plotBands[0].to', this.defaultSetting.mileStone1);
    settingAsMap.set('yAxis[0].plotBands[1].from', this.defaultSetting.mileStone1);
    //Milestone 2
    settingAsMap.set('yAxis[0].plotBands[1].to', this.defaultSetting.mileStone2);
    settingAsMap.set('yAxis[0].plotBands[2].from', this.defaultSetting.mileStone2);
    //Max
    settingAsMap.set('yAxis[0].plotBands[2].to', this.defaultSetting.max);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>
