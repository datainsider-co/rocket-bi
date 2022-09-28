<template>
  <PanelHeader header="Tooltip" target-id="tooltip-tab">
    <div class="row-config-container">
      <ColorSetting
        id="tooltip-value-color"
        :default-color="defaultStyle.valueColor"
        :value="valueColor"
        label="Color"
        size="small"
        style="margin-right: 12px"
        @onChanged="handleValueColorChanged"
      />
      <ColorSetting
        id="tooltip-background-color"
        :default-color="defaultStyle.backgroundColor"
        :value="backgroundColor"
        label="Background color"
        size="small"
        @onChanged="handleBackgroundChanged"
      />
    </div>
    <DropdownSetting
      id="tooltip-font-family"
      :options="fontOptions"
      :value="tooltipFont"
      class="mb-3"
      label="Font family"
      size="full"
      @onChanged="handleFontChanged"
    />
    <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { ChartOption, PivotTableChartOption, SettingKey } from '@core/domain';

import { FontFamilyOptions } from '@/shared/Settings/Common/Options/FontFamilyOptions';
import { Log } from '@core/utils';

@Component({ components: { PanelHeader } })
export default class TooltipTab extends Vue {
  private readonly fontOptions = FontFamilyOptions;

  @Prop({ required: false })
  private readonly setting!: PivotTableChartOption;

  private defaultStyle = {
    valueColor: ChartOption.getThemeTextColor(),
    labelColor: ChartOption.getThemeTextColor(),
    fontFamily: 'Roboto',
    backgroundColor: 'var(--tooltip-background-color)'
  };

  private get labelColor() {
    return this.setting?.options?.tooltip?.labelColor ?? this.defaultStyle.labelColor;
  }

  private get valueColor() {
    return this.setting?.options?.tooltip?.valueColor ?? this.defaultStyle.valueColor;
  }

  private get backgroundColor() {
    return this.setting?.options?.tooltip?.backgroundColor ?? this.defaultStyle.backgroundColor;
  }

  private get tooltipFont() {
    return this.setting?.options?.tooltip?.fontFamily ?? this.defaultStyle.fontFamily;
  }

  private handleLabelColorChanged(newColor: string) {
    return this.$emit('onChanged', 'tooltip.labelColor', newColor);
  }

  private handleBackgroundChanged(newColor: string) {
    return this.$emit('onChanged', 'tooltip.backgroundColor', newColor);
  }

  private handleValueColorChanged(newColor: string) {
    return this.$emit('onChanged', 'tooltip.valueColor', newColor);
  }

  private handleFontChanged(newFontFamily: string) {
    return this.$emit('onChanged', 'tooltip.fontFamily', newFontFamily);
  }

  private handleRevert() {
    Log.debug('handleRevert::tooltip');
    const settingAsMap: Map<SettingKey, any> = new Map();
    settingAsMap.set('tooltip.labelColor', this.defaultStyle.labelColor);
    settingAsMap.set('tooltip.backgroundColor', this.defaultStyle.backgroundColor);
    settingAsMap.set('tooltip.valueColor', this.defaultStyle.valueColor);
    settingAsMap.set('tooltip.fontFamily', this.defaultStyle.fontFamily);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" src="../Common/tab.style.scss"></style>
