<template>
  <PanelHeader header="Tooltip" target-id="tooltip-tab">
    <div class="row-config-container">
      <ColorSetting
        id="tooltip-value-color"
        :default-color="defaultStyle.color"
        :value="valueColor"
        :label="`${configSetting['tooltip.valueColor'].label}`"
        :hint="`${configSetting['tooltip.valueColor'].hint}`"
        size="small"
        style="margin-right: 12px"
        @onChanged="handleValueColorChanged"
      />
      <ColorSetting
        id="tooltip-background-color"
        :default-color="defaultStyle.backgroundColor"
        :value="backgroundColor"
        :label="`${configSetting['tooltip.backgroundColor'].label}`"
        :hint="`${configSetting['tooltip.backgroundColor'].hint}`"
        size="small"
        @onChanged="handleBackgroundChanged"
      />
    </div>
    <DropdownSetting
      id="tooltip-font-family"
      :options="fontOptions"
      :value="fontFamily"
      class="mb-3"
      :label="`${configSetting['tooltip.fontFamily'].label}`"
      :hint="`${configSetting['tooltip.fontFamily'].hint}`"
      size="full"
      @onChanged="handleFontChanged"
    />
    <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { ChartTooltipSetting } from '@core/common/domain/model/chart-option/extra-setting/chart-style/ChartTooltipSetting';
import { Log } from '@core/utils';

import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { SettingKey } from '@core/common/domain';

@Component({ components: { PanelHeader } })
export default class TooltipTab extends Vue {
  private readonly configSetting = window.chartSetting['tooltip.tab'];

  private readonly fontOptions = FontFamilyOptions;
  private defaultStyle = {
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    backgroundColor: '#333645'
  };
  @Prop({ required: false })
  private readonly setting?: ChartTooltipSetting;

  private get valueColor(): string {
    return this.setting?.style?.color ?? this.defaultStyle.color;
  }
  private get fontFamily(): string {
    return this.setting?.style?.fontFamily ?? this.defaultStyle.fontFamily;
  }

  private get backgroundColor(): string {
    return this.setting?.backgroundColor ?? this.defaultStyle.backgroundColor;
  }

  private handleBackgroundChanged(newColor: string) {
    return this.$emit('onChanged', 'tooltip.backgroundColor', newColor);
  }

  private handleValueColorChanged(newColor: string) {
    return this.$emit('onChanged', 'tooltip.style.color', newColor);
  }

  private handleFontChanged(newFontFamily: string) {
    return this.$emit('onChanged', 'tooltip.fontFamily', newFontFamily);
  }

  private handleRevert() {
    Log.debug('handleRevert::tooltip');
    const settingAsMap: Map<SettingKey, any> = new Map();
    settingAsMap.set('tooltip.style.color', this.defaultStyle.color);
    settingAsMap.set('tooltip.backgroundColor', this.defaultStyle.backgroundColor);
    settingAsMap.set('tooltip.style.fontFamily', this.defaultStyle.fontFamily);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" scoped></style>
