<template>
  <PanelHeader header="Target & Value" target-id="target-tab">
    <InputSetting
      id="target-value-input"
      ref="targetInput"
      :value="target"
      applyFormatNumber
      class="mb-2"
      :label="`${configSetting['target.value'].label}`"
      :hint="`${configSetting['target.value'].hint}`"
      :placeholder="`${configSetting['target.value'].hint}`"
      size="full"
      type="number"
      @onChanged="handleTargetSaved"
    />
    <div class="row-config-container">
      <InputSetting
        id="target-width-input"
        :value="targetHeight"
        :label="`${configSetting['target.width'].label}`"
        :hint="`${configSetting['target.width'].hint}`"
        :placeholder="`${configSetting['target.width'].hint}`"
        size="small"
        style="margin-right: 8px"
        type="number"
        @onChanged="handleTargetHeightSaved"
      />
      <ColorSetting
        id="target-color"
        :defaultColor="defaultSetting.targetColor"
        :value="targetColor"
        :label="`${configSetting['target.color'].label}`"
        :hint="`${configSetting['target.color'].hint}`"
        :placeholder="`${configSetting['target.color'].hint}`"
        size="small"
        @onChanged="handleTargetColorChanged"
      />
    </div>
    <ColorSetting
      id="series-color"
      :defaultColor="defaultSetting.seriesColor"
      :value="seriesColor"
      :label="`${configSetting['bullet.color'].label}`"
      :hint="`${configSetting['bullet.color'].hint}`"
      :placeholder="`${configSetting['bullet.color'].hint}`"
      size="small"
      class="mb-2"
      @onChanged="handleSeriesColorChanged"
    />
    <div class="row-config-container">
      <InputSetting
        id="series-width-input"
        :value="seriesBorderWidth"
        applyFormatNumber
        :label="`${configSetting['bullet.borderWidth'].label}`"
        :hint="`${configSetting['bullet.borderWidth'].hint}`"
        :placeholder="`${configSetting['bullet.borderWidth'].hint}`"
        size="small"
        style="margin-right: 8px"
        type="number"
        @onChanged="handleSeriesBorderWidthChanged"
      />
      <ColorSetting
        id="border-color"
        :defaultColor="defaultSetting.borderColor"
        :value="borderColor"
        :label="`${configSetting['border.color'].label}`"
        :hint="`${configSetting['border.color'].hint}`"
        size="small"
        @onChanged="handleBorderColorChanged"
      />
    </div>
    <revert-button @click="handleRevert" />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { toNumber } from 'lodash';
import { SeriesOptionData, SettingKey } from '@core/common/domain';
import RevertButton from '@/shared/settings/common/RevertButton.vue';

@Component({ components: { PanelHeader, RevertButton } })
export default class TargetAndValueTab extends Vue {
  private readonly configSetting = window.chartSetting['bulletColor.tab'];

  private readonly defaultSetting = {
    target: 7500,
    height: 3,
    targetColor: '#0267DE',
    borderWidth: 0,
    seriesColor: '#0267DE',
    borderColor: '#fff'
  };
  @Prop({ required: false, type: Object })
  private readonly setting!: SeriesOptionData;

  private get target(): string {
    return `${this.setting.plotOptions?.series?.targetOptions?.value ?? this.defaultSetting.target}`;
  }

  private get targetHeight(): string {
    return `${this.setting.plotOptions?.series?.targetOptions?.height ?? this.defaultSetting.height}`;
  }

  private get targetColor(): string {
    return this.setting.plotOptions?.series?.targetOptions?.color ?? this.defaultSetting.targetColor;
  }

  private get seriesColor(): string {
    return this.setting.plotOptions?.series?.color ?? this.defaultSetting.seriesColor;
  }

  private get borderColor(): string {
    return this.setting.plotOptions?.series?.borderColor ?? this.defaultSetting.borderColor;
  }

  private get seriesBorderWidth(): string {
    return `${this.setting.plotOptions?.series?.borderWidth ?? this.defaultSetting.borderWidth}`;
  }

  private handleTargetSaved(newValue: string) {
    const valueAsNumber = toNumber(newValue);
    this.$emit('onChanged', 'plotOptions.series.targetOptions.value', valueAsNumber);
  }

  private handleTargetHeightSaved(newValue: string) {
    const value = toNumber(newValue);
    this.$emit('onChanged', 'plotOptions.series.targetOptions.height', value);
  }

  private handleTargetColorChanged(newColor: string) {
    this.$emit('onChanged', 'plotOptions.series.targetOptions.color', newColor);
  }

  private handleSeriesColorChanged(newColor: string) {
    this.$emit('onChanged', 'plotOptions.series.color', newColor);
  }

  private handleSeriesBorderWidthChanged(newValue: string) {
    const valueAsNumber = toNumber(newValue);
    this.$emit('onChanged', 'plotOptions.series.borderWidth', valueAsNumber);
  }
  private handleBorderColorChanged(newColor: string) {
    this.$emit('onChanged', 'plotOptions.series.borderColor', newColor);
  }
  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('plotOptions.series.targetOptions.value', this.defaultSetting.target);
    settingAsMap.set('plotOptions.series.targetOptions.height', this.defaultSetting.height);
    settingAsMap.set('plotOptions.series.targetOptions.color', this.defaultSetting.targetColor);
    settingAsMap.set('plotOptions.series.color', this.defaultSetting.seriesColor);
    settingAsMap.set('plotOptions.series.borderWidth', this.defaultSetting.borderWidth);
    settingAsMap.set('plotOptions.series.borderColor', this.defaultSetting.borderColor);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.label {
  @include regular-text-14();
  color: var(--secondary-text-color);
}
</style>
