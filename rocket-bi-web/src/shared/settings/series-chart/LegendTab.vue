<template>
  <PanelHeader header="Legend" target-id="legend-tab">
    <div class="legend-tab">
      <ToggleSetting id="legend-enable" :value="enabled" class="mb-3 group-config" label="On" @onChanged="handleLegendEnabled" />
      <DropdownSetting
        id="legend-position"
        :options="positionOptions"
        :style="legendSettingStyle"
        :value="position"
        class="mb-3"
        label="Position"
        size="full"
        @onChanged="handleChangePosition"
      />
      <InputSetting
        id="legend-title-input"
        :style="legendSettingStyle"
        :value="title"
        class="mb-3"
        label="Legend name"
        placeholder="Input Legend Title"
        size="full"
        @onChanged="handleTitleSaved"
      />
      <DropdownSetting
        id="legend-font-family"
        :enabledRevert="false"
        :options="fontOptions"
        :style="legendSettingStyle"
        :value="font"
        class="mb-2"
        label="Font family"
        size="full"
        @onChanged="handleFontChanged"
      />
      <div :style="legendSettingStyle" class="row-config-container">
        <ColorSetting id="legend-font-color" :default-color="defaultSetting.color" :value="color" class="mr-2" size="small" @onChanged="handleColorChanged" />
        <DropdownSetting id="legend-font-size" :options="fontSizeOptions" :value="fontSize" size="small" @onChanged="handleFontSizeChanged" />
      </div>
      <ToggleSetting
        id="manual-height-enable"
        class="mb-2"
        :style="legendSettingStyle"
        label="Manual Height"
        :value="enableCustomHeight"
        @onChanged="handleCustomHeightEnableChanged"
      />
      <InputSetting id="manual-height-input" class="mb-2" v-if="enableCustomHeight" :value="maxHeight" @onChanged="handleMaxHeightChange" applyFormatNumber />
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { LegendSetting } from '@core/common/domain/model/chart-option/extra-setting/chart-style/LegendSetting';
import { SelectOption } from '@/shared';
import { VerticalAlignOptions } from '@/shared/settings/common/options/VerticalAlignOptions';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';

import { FontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';
import { Log } from '@core/utils';
import { enableCss } from '@/shared/settings/common/install';
import { ChartOption, SettingKey } from '@core/common/domain';
import { toNumber } from 'lodash';

@Component({ components: { PanelHeader } })
export default class LegendTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly setting!: LegendSetting;

  private readonly defaultSetting = {
    enabled: true,
    verticalAlign: 'bottom',
    title: '',
    fontFamily: 'Roboto',
    color: ChartOption.getThemeTextColor(),
    fontSize: '12px',
    customHeight: false,
    maxHeight: 60,
    defaultHeight: undefined
  };

  private get enabled(): boolean {
    return this.setting?.enabled ?? this.defaultSetting.enabled;
  }

  private get position(): string {
    return this.setting?.verticalAlign ?? this.defaultSetting.verticalAlign;
  }

  private get positionOptions(): SelectOption[] {
    return VerticalAlignOptions;
  }

  private get title(): string {
    return this.setting?.title?.text ?? this.defaultSetting.title;
  }

  private get font(): string {
    return this.setting?.itemStyle?.fontFamily ?? this.defaultSetting.fontFamily;
  }

  private get fontOptions(): SelectOption[] {
    return FontFamilyOptions;
  }

  private get color() {
    return this?.setting?.itemStyle?.color ?? this.defaultSetting.color;
  }

  private get fontSize(): string {
    return this.setting?.itemStyle?.fontSize ?? this.defaultSetting.fontSize;
  }

  private get fontSizeOptions(): SelectOption[] {
    return FontSizeOptions;
  }

  private get legendSettingStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enabled)
    } as CSSStyleDeclaration;
  }

  private get maxHeight(): string {
    return `${this.setting.maxHeight}`;
  }

  private handleMaxHeightChange(newHeight: string) {
    return this.$emit('onChanged', 'legend.maxHeight', toNumber(newHeight));
  }

  private get enableCustomHeight(): boolean {
    return this.setting.maxHeight != undefined;
  }

  private handleCustomHeightEnableChanged(enable: boolean) {
    const maxHeight = enable ? this.defaultSetting.maxHeight : this.defaultSetting.defaultHeight;
    return this.$emit('onChanged', 'legend.maxHeight', maxHeight);
  }

  private handleLegendEnabled(enabled: boolean) {
    Log.debug('SeriesSetting::handleLegendEnabled', enabled);
    return this.$emit('onChanged', 'legend.enabled', enabled);
  }

  private handleChangePosition(newPosition: string) {
    this.$emit('onChanged', 'legend.verticalAlign', newPosition);
  }

  private handleTitleSaved(newText: string) {
    this.$emit('onChanged', 'legend.title.text', newText);
  }

  private handleFontChanged(newFont: string) {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('legend.title.style.fontFamily', newFont);
    settingAsMap.set('legend.itemStyle.fontFamily', newFont);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, any> = new Map();
    settingAsMap.set('legend.title.style.fontFamily', this.defaultSetting.fontFamily);
    settingAsMap.set('legend.itemStyle.fontFamily', this.defaultSetting.fontFamily);
    settingAsMap.set('legend.title.style.color', this.defaultSetting.color);
    settingAsMap.set('legend.itemStyle.color', this.defaultSetting.color);
    settingAsMap.set('legend.title.style.fontSize', this.defaultSetting.fontSize);
    settingAsMap.set('legend.itemStyle.fontSize', this.defaultSetting.fontSize);
    settingAsMap.set('legend.enabled', this.defaultSetting.enabled);
    settingAsMap.set('legend.verticalAlign', this.defaultSetting.verticalAlign);
    settingAsMap.set('legend.title.text', this.defaultSetting.title);
    settingAsMap.set('legend.maxHeight', this.defaultSetting.defaultHeight);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleColorChanged(newColor: string) {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('legend.title.style.color', newColor);
    settingAsMap.set('legend.itemStyle.color', newColor);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleFontSizeChanged(newFontSize: string) {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('legend.title.style.fontSize', newFontSize);
    settingAsMap.set('legend.itemStyle.fontSize', newFontSize);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" src="../common/TabStyle.scss" />
