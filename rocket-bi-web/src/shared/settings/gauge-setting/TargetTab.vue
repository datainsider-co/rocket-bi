<template>
  <PanelHeader header="Target" target-id="target-tab">
    <div class="target-tab">
      <ToggleSetting id="target-enable" :value="enabled" class="mb-3 group-config" label="On" @onChanged="handleTargetEnabled" />
      <DropdownSetting
        id="data-label-font-family"
        :options="fontOptions"
        :value="font"
        class="mb-2"
        label="Font family"
        size="full"
        @onChanged="handleFontChanged"
      />
      <div class="row-config-container">
        <ColorSetting
          id="data-label-font-color"
          :default-color="defaultSetting.color"
          :value="color"
          class="mr-2"
          size="small"
          @onChanged="handleColorChanged"
        />
        <DropdownSetting id="data-label-font-size" :options="fontSizeOptions" :value="fontSize" size="small" @onChanged="handleFontSizeChanged" />
      </div>
      <DropdownSetting
        id="data-label-display-unit"
        :options="displayUnitOptions"
        :value="displayUnit"
        class="mb-2"
        label="Display unit"
        size="full"
        @onChanged="handleDisplayUnitChanged"
      />
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { SelectOption } from '@/shared';
import { DisplayUnitOptions } from '@/shared/settings/common/options/DisplayUnitOptions';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { SecondaryFontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';
import { ChartOption, GaugeChartOption, SettingKey } from '@core/common/domain';

@Component({ components: { PanelHeader } })
export default class TargetTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly setting!: GaugeChartOption;
  private readonly defaultSetting = {
    enabled: false,
    fontFamily: ChartOption.getSecondaryFontFamily(),
    color: ChartOption.getPrimaryTextColor(),
    fontSize: '12px',
    displayUnit: 'default'
  };

  private get enabled(): boolean {
    return this.setting?.options?.plotOptions?.series?.dataLabels?.enabled ?? this.defaultSetting.enabled;
  }

  private get font(): string {
    return this.setting?.options?.plotOptions?.series?.dataLabels?.style?.fontFamily ?? this.defaultSetting.fontFamily;
  }

  private get color(): string {
    return this.setting?.options?.plotOptions?.series?.dataLabels?.style?.color ?? this.defaultSetting.color;
  }

  private get fontSize(): string {
    return this.setting?.options?.plotOptions?.series?.dataLabels?.style?.fontSize ?? this.defaultSetting.fontSize;
  }

  private get displayUnit(): string {
    return this.setting?.options?.plotOptions?.series?.dataLabels?.displayUnit ?? this.defaultSetting.displayUnit;
  }

  private get displayUnitOptions(): SelectOption[] {
    return DisplayUnitOptions;
  }

  private get fontOptions(): SelectOption[] {
    return FontFamilyOptions;
  }

  private get fontSizeOptions(): SelectOption[] {
    return SecondaryFontSizeOptions;
  }

  private handleTargetEnabled(enabled: boolean) {
    return this.$emit('onChanged', 'plotOptions.series.dataLabels.enabled', enabled);
  }

  private handleFontChanged(newFont: string) {
    return this.$emit('onChanged', 'plotOptions.series.dataLabels.style.fontFamily', newFont);
  }

  private handleColorChanged(newColor: string) {
    return this.$emit('onChanged', 'plotOptions.series.dataLabels.style.color', newColor);
  }

  private handleFontSizeChanged(newFontSize: string) {
    this.$emit('onChanged', 'plotOptions.series.dataLabels.style.fontSize', newFontSize);
  }

  private handleDisplayUnitChanged(newDisplayUnit: string) {
    return this.$emit('onChanged', 'plotOptions.series.dataLabels.displayUnit', newDisplayUnit);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('plotOptions.series.dataLabels.enabled', this.defaultSetting.enabled);
    settingAsMap.set('plotOptions.series.dataLabels.style.fontSize', this.defaultSetting.fontSize);
    settingAsMap.set('plotOptions.series.dataLabels.style.color', this.defaultSetting.color);
    settingAsMap.set('plotOptions.series.dataLabels.style.fontFamily', this.defaultSetting.fontFamily);
    settingAsMap.set('plotOptions.series.dataLabels.displayUnit', this.defaultSetting.displayUnit);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" scoped></style>
