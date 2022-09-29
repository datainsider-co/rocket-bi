<template>
  <PanelHeader header="Data Label" target-id="data-label-tab">
    <div class="data-label-tab">
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
          :value="textColor"
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

      <InputSetting
        id="prefix-input"
        :value="prefixText"
        class="mb-3"
        label="Prefix"
        placeholder="Input Prefix"
        size="full"
        :maxLength="defaultSetting.maxLength"
        @onChanged="handlePrefixSaved"
      />
      <DropdownSetting
        id="prefix-font-family"
        :options="fontOptions"
        :value="prefixFont"
        class="mb-3"
        label="Font family"
        size="full"
        @onChanged="handlePrefixFontChanged"
      />
      <div class="row-config-container">
        <ColorSetting
          id="prefix-font-color"
          :default-color="defaultSetting.prefixColor"
          :value="prefixColor"
          style="width: 104px; margin-right: 12px"
          @onChanged="handlePrefixColorChanged"
        />
        <DropdownSetting id="prefix-font-size" :options="fontSizeOptions" :value="prefixFontSize" size="small" @onChanged="handlePrefixFontSizeChanged" />
      </div>
      <InputSetting
        id="postfix-input"
        :value="postfixText"
        class="mb-3"
        label="Postfix"
        placeholder="Input Postfix"
        size="full"
        @onChanged="handlePostfixSaved"
        :maxLength="defaultSetting.maxLength"
      />
      <DropdownSetting
        id="postfix-font-family"
        :options="fontOptions"
        :value="postfixFont"
        class="mb-3"
        label="Font family"
        size="full"
        @onChanged="handlePostfixFontChanged"
      />
      <div class="row-config-container">
        <ColorSetting
          id="postfix-font-color"
          :default-color="defaultSetting.postfixColor"
          :value="postfixColor"
          style="width: 104px; margin-right: 12px"
          @onChanged="handlePostfixColorChanged"
        />
        <DropdownSetting id="postfix-font-size" :options="fontSizeOptions" :value="postfixFontSize" size="small" @onChanged="handlePostfixFontSizeChanged" />
      </div>
      <RevertButton class="mb-3 pr-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartOption, NumberOptionData, SettingKey } from '@core/common/domain';
import { MetricNumberMode } from '@/utils';
import { SelectOption } from '@/shared';
import { DisplayUnitOptions } from '@/shared/settings/common/options/DisplayUnitOptions';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { LargeFontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';

@Component({ components: { PanelHeader } })
export default class NumberDataLabelTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly setting!: NumberOptionData;

  private readonly defaultSetting = {
    fontFamily: 'Roboto',
    color: ChartOption.getThemeTextColor(),
    fontSize: '48px',
    displayUnit: MetricNumberMode.Default,
    prefixFontFamily: 'Roboto',
    prefixColor: ChartOption.getThemeTextColor(),
    prefixFontSize: '48px',
    prefixText: '',
    postfixFontFamily: 'Roboto',
    postfixColor: ChartOption.getThemeTextColor(),
    postfixFontSize: '48px',
    postfixText: '',
    maxLength: 24
  };

  private get font(): string {
    return this.setting?.style?.fontFamily ?? this.defaultSetting.fontFamily;
  }

  private get textColor(): string {
    return this.setting?.style?.color ?? this.defaultSetting.color;
  }

  private get fontSize(): string {
    return this.setting?.style?.fontSize ?? this.defaultSetting.fontSize;
  }

  private get displayUnitOptions(): SelectOption[] {
    return DisplayUnitOptions;
  }

  private get fontOptions(): SelectOption[] {
    return FontFamilyOptions;
  }

  private get fontSizeOptions(): SelectOption[] {
    return LargeFontSizeOptions;
  }

  private get displayUnit(): string {
    return this.setting?.displayUnit ?? this.defaultSetting.displayUnit;
  }

  private get prefixFont(): string {
    return this.setting?.prefix?.style?.fontFamily ?? this.defaultSetting.prefixFontFamily;
  }

  private get prefixFontSize(): string {
    return this.setting?.prefix?.style?.fontSize ?? this.defaultSetting.prefixFontSize;
  }

  private get prefixColor(): string {
    return this.setting?.prefix?.style?.color ?? this.defaultSetting.prefixColor;
  }

  private get prefixText(): string {
    return this.setting?.prefix?.text ?? this.defaultSetting.prefixText;
  }

  private get postfixFont(): string {
    return this.setting?.postfix?.style?.fontFamily ?? this.defaultSetting.postfixFontFamily;
  }

  private get postfixFontSize(): string {
    return this.setting?.postfix?.style?.fontSize ?? this.defaultSetting.postfixFontSize;
  }

  private get postfixColor(): string {
    return this.setting?.postfix?.style?.color ?? this.defaultSetting.postfixColor;
  }

  private get postfixText(): string {
    return this.setting?.postfix?.text ?? this.defaultSetting.postfixText;
  }

  private handleFontChanged(newFont: string) {
    return this.$emit('onChanged', `style.fontFamily`, newFont);
  }

  private handleColorChanged(newColor: string) {
    return this.$emit('onChanged', `style.color`, newColor);
  }

  private handleFontSizeChanged(newFontSize: string) {
    this.$emit('onChanged', `style.fontSize`, newFontSize);
  }

  private handleDisplayUnitChanged(newDisplayUnit: string) {
    return this.$emit('onChanged', `displayUnit`, newDisplayUnit);
  }

  private handlePrefixSaved(newText: string) {
    return this.$emit('onChanged', 'prefix.text', newText);
  }

  private handlePrefixFontChanged(newFont: string) {
    return this.$emit('onChanged', 'prefix.style.fontFamily', newFont);
  }

  private handlePrefixFontSizeChanged(newFontSize: string) {
    return this.$emit('onChanged', 'prefix.style.fontSize', newFontSize);
  }

  private handlePrefixColorChanged(newColor: string) {
    return this.$emit('onChanged', 'prefix.style.color', newColor);
  }

  private handlePostfixSaved(newText: string) {
    return this.$emit('onChanged', 'postfix.text', newText);
  }

  private handlePostfixFontChanged(newFont: string) {
    return this.$emit('onChanged', 'postfix.style.fontFamily', newFont);
  }

  private handlePostfixFontSizeChanged(newFontSize: string) {
    return this.$emit('onChanged', 'postfix.style.fontSize', newFontSize);
  }

  private handlePostfixColorChanged(newColor: string) {
    return this.$emit('onChanged', 'postfix.style.color', newColor);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set(`style.fontFamily`, this.defaultSetting.fontFamily);
    settingAsMap.set(`style.color`, this.defaultSetting.color);
    settingAsMap.set(`style.fontSize`, this.defaultSetting.fontSize);
    settingAsMap.set(`displayUnit`, this.defaultSetting.displayUnit);
    settingAsMap.set('prefix.style.fontFamily', this.defaultSetting.prefixFontFamily);
    settingAsMap.set('prefix.style.color', this.defaultSetting.prefixColor);
    settingAsMap.set('prefix.style.fontSize', this.defaultSetting.prefixFontSize);
    settingAsMap.set('prefix.text', this.defaultSetting.prefixText);
    settingAsMap.set('postfix.style.fontFamily', this.defaultSetting.postfixFontFamily);
    settingAsMap.set('postfix.style.color', this.defaultSetting.postfixColor);
    settingAsMap.set('postfix.style.fontSize', this.defaultSetting.postfixFontSize);
    settingAsMap.set('postfix.text', this.defaultSetting.postfixText);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" scoped></style>
