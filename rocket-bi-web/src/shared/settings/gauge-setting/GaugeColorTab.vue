<template>
  <PanelHeader header="Color" target-id="gauge-color-tab">
    <ColorSetting
      id="min-color"
      :value="minColor"
      :defaultColor="defaultSetting.min"
      class="mb-3"
      :label="`${configSetting['min'].label}`"
      :hint="`${configSetting['min'].hint}`"
      size="full"
      @onChanged="handleMinColorChanged"
    />
    <ColorSetting
      id="average-color"
      :value="averageColor"
      :defaultColor="defaultSetting.average"
      class="mb-3"
      :label="`${configSetting['average'].label}`"
      :hint="`${configSetting['average'].hint}`"
      size="full"
      @onChanged="handleAverageColorChanged"
    />
    <ColorSetting
      id="max-color"
      :value="maxColor"
      :defaultColor="defaultSetting.max"
      class="mb-3"
      :label="`${configSetting['max'].label}`"
      :hint="`${configSetting['max'].hint}`"
      size="full"
      @onChanged="handleMaxColorChanged"
    />
    <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { GaugeChartOption, SettingKey } from '@core/common/domain';
import { get } from 'lodash';

@Component({ components: { PanelHeader } })
export default class GaugeColorTab extends Vue {
  private readonly configSetting = window.chartSetting['gaugeColor.tab'];
  private readonly defaultSetting = {
    min: '#34DA0B',
    average: '#FFAC05',
    max: '#FF5151'
  };
  @Prop({ required: false, type: Object })
  private readonly setting!: GaugeChartOption;

  constructor() {
    super();
    if (!this.setting?.options?.yAxis?.stops) {
      this.handleRevert();
    }
  }

  private get minColor(): string {
    return get(this.setting, 'options.yAxis.stops[0][1]', this.defaultSetting.min);
  }

  private get averageColor(): string {
    return get(this.setting, 'options.yAxis.stops[1][1]', this.defaultSetting.average);
  }

  private get maxColor(): string {
    return get(this.setting, 'options.yAxis.stops[2][1]', this.defaultSetting.max);
  }

  private handleMinColorChanged(newColor: string) {
    this.$emit('onChanged', 'yAxis.stops[0][1]', newColor);
  }

  private handleAverageColorChanged(newColor: string) {
    this.$emit('onChanged', 'yAxis.stops[1][1]', newColor);
  }

  private handleMaxColorChanged(newColor: string) {
    this.$emit('onChanged', 'yAxis.stops[2][1]', newColor);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('yAxis.stops[0][1]', this.defaultSetting.min);
    settingAsMap.set('yAxis.stops[1][1]', this.defaultSetting.average);
    settingAsMap.set('yAxis.stops[2][1]', this.defaultSetting.max);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" scoped></style>
