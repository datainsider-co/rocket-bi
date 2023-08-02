<template>
  <PanelHeader header="Data Label" target-id="data-label-tab">
    <div class="data-label-tab">
      <DropdownSetting
        id="data-label-font-family"
        :options="fontOptions"
        :value="font"
        class="mb-2"
        :label="`${configSetting['style.fontFamily'].label}`"
        :hint="`${configSetting['style.fontFamily'].hint}`"
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
          :label="`${configSetting['style.color'].label}`"
          :hint="`${configSetting['style.color'].hint}`"
          @onChanged="handleColorChanged"
        />
        <DropdownSetting
          id="data-label-font-size"
          :options="fontSizeOptions"
          :label="`${configSetting['style.fontSize'].label}`"
          :hint="`${configSetting['style.fontSize'].hint}`"
          :value="fontSize"
          size="small"
          @onChanged="handleFontSizeChanged"
        />
      </div>

      <InputSetting
        id="prefix-input"
        :value="prefixText"
        class="mb-3"
        :label="`${configSetting['prefix.text'].label}`"
        :hint="`${configSetting['prefix.text'].hint}`"
        :placeholder="`${configSetting['prefix.text'].placeHolder}`"
        size="full"
        :maxLength="defaultSetting.maxLength"
        @onChanged="handlePrefixSaved"
      />
      <DropdownSetting
        id="prefix-font-family"
        :options="fontOptions"
        :value="prefixFont"
        class="mb-3"
        :label="`${configSetting['prefix.style.fontFamily'].label}`"
        :hint="`${configSetting['prefix.style.fontFamily'].hint}`"
        size="full"
        @onChanged="handlePrefixFontChanged"
      />
      <div class="row-config-container">
        <ColorSetting
          id="prefix-font-color"
          :default-color="defaultSetting.prefixColor"
          :value="prefixColor"
          :label="`${configSetting['prefix.style.color'].label}`"
          :hint="`${configSetting['prefix.style.color'].hint}`"
          style="width: 104px; margin-right: 12px"
          @onChanged="handlePrefixColorChanged"
        />
        <DropdownSetting
          id="prefix-font-size"
          :options="fontSizeOptions"
          :label="`${configSetting['prefix.style.fontSize'].label}`"
          :hint="`${configSetting['prefix.style.fontSize'].hint}`"
          :value="prefixFontSize"
          size="small"
          @onChanged="handlePrefixFontSizeChanged"
        />
      </div>
      <InputSetting
        id="postfix-input"
        :value="postfixText"
        class="mb-3"
        :label="`${configSetting['postfix.text'].label}`"
        :hint="`${configSetting['postfix.text'].hint}`"
        :placeholder="`${configSetting['postfix.text'].placeHolder}`"
        size="full"
        @onChanged="handlePostfixSaved"
        :maxLength="defaultSetting.maxLength"
      />
      <DropdownSetting
        id="postfix-font-family"
        :options="fontOptions"
        :value="postfixFont"
        class="mb-3"
        :label="`${configSetting['postfix.style.fontFamily'].label}`"
        :hint="`${configSetting['postfix.style.fontFamily'].hint}`"
        size="full"
        @onChanged="handlePostfixFontChanged"
      />
      <div class="row-config-container">
        <ColorSetting
          id="postfix-font-color"
          :default-color="defaultSetting.postfixColor"
          :value="postfixColor"
          :label="`${configSetting['postfix.style.color'].label}`"
          :hint="`${configSetting['postfix.style.color'].hint}`"
          style="width: 104px; margin-right: 12px"
          @onChanged="handlePostfixColorChanged"
        />
        <DropdownSetting
          id="postfix-font-size"
          :options="fontSizeOptions"
          :label="`${configSetting['postfix.style.fontSize'].label}`"
          :hint="`${configSetting['postfix.style.fontSize'].hint}`"
          :value="postfixFontSize"
          size="small"
          @onChanged="handlePostfixFontSizeChanged"
        />
      </div>
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
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
  private readonly configSetting = window.chartSetting['numberDataLabel.tab'];
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

  private get fontOptions(): SelectOption[] {
    return FontFamilyOptions;
  }

  private get fontSizeOptions(): SelectOption[] {
    return LargeFontSizeOptions;
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
