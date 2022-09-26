<template>
  <PanelHeader header="Values" target-id="values-tab">
    <div class="values-tab">
      <div class="row-config-container">
        <ColorSetting
          id="value-font-color"
          :default-color="defaultStyle.color"
          :value="fontColor"
          label="Font color"
          style="width: 145px; margin-right: 12px"
          @onChanged="handleFontColorChanged"
        />
        <ColorSetting
          id="value-background-color"
          :default-color="defaultStyle.backgroundColor"
          :value="backgroundColor"
          label="Background color"
          style="width: 145px;"
          @onChanged="handleBackgroundColorChanged"
        />
      </div>
      <div class="row-config-container">
        <ColorSetting
          id="value-alternate-font-color"
          :default-color="defaultStyle.alternateColor"
          :value="alternateFontColor"
          label="Alternate font color"
          style="width: 145px; margin-right: 12px"
          @onChanged="handleAlternateFontColorChanged"
        />
        <ColorSetting
          id="value-alternate-background-color"
          :default-color="defaultStyle.alternateBackgroundColor"
          :value="alternateBackgroundColor"
          label="Background color"
          style="width: 145px;"
          @onChanged="handleAlternateBackgroundColorChanged"
        />
      </div>
      <div class="row-config-container">
        <!--        <ToggleSetting disable id="value-url-icon" :value="enableUrlIcon" label="URL icon" style="margin-right: 12px" @onChanged="handleURLIconChanged" />-->
        <ToggleSetting id="value-word-wrap" :value="isWordWrap" label="Word wrap" @onChanged="handleWordWrapChanged" />
      </div>
      <DropdownSetting
        id="value-font-family"
        :options="fontOptions"
        :value="font"
        class="mb-2"
        label="Font family"
        size="full"
        @onChanged="handleFontChanged"
      />
      <div class="row-config-container">
        <DropdownSetting
          id="value-font-family-size"
          class="mr-3"
          :options="fontSizeOptions"
          :value="fontSize"
          size="small"
          @onChanged="handleFontSizeChanged"
        />
        <AlignSetting id="value-align" :value="valuesAlign" @onChanged="handleAlignChanged" />
      </div>
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { ChartOption, PivotTableChartOption, SettingKey } from '@core/domain';
import { FontFamilyOptions } from '@/shared/Settings/Common/Options/FontFamilyOptions';
import { FontSizeOptions } from '@/shared/Settings/Common/Options/FontSizeOptions';

@Component({ components: { PanelHeader } })
export default class ValuesTab extends Vue {
  // TODO: change here
  private readonly defaultStyle = {
    color: ChartOption.getThemeTextColor(),
    backgroundColor: 'var(----row-even-background-color)',
    alternateColor: ChartOption.getThemeTextColor(),
    alternateBackgroundColor: '--row-odd-background-color',
    enableUrlIcon: false,
    isWordWrap: false,
    fontFamily: 'Roboto',
    fontSize: '12px',
    align: 'left'
  };

  @Prop({ required: false, type: Object })
  private readonly setting!: PivotTableChartOption;

  ///Font Color
  private fontOptions = FontFamilyOptions;
  private fontSizeOptions = FontSizeOptions;

  private get fontColor(): string {
    return this.setting?.options?.value?.color ?? this.defaultStyle.color;
  }

  private get backgroundColor(): string {
    return this.setting?.options?.value?.backgroundColor ?? this.defaultStyle.backgroundColor;
  }

  ///Alternate font color

  private get alternateFontColor(): string {
    return this.setting?.options?.value?.alternateColor ?? this.defaultStyle.alternateColor;
  }

  private get alternateBackgroundColor(): string {
    return this.setting?.options?.value?.alternateBackgroundColor ?? this.defaultStyle.backgroundColor;
  }

  private get enableUrlIcon(): boolean {
    return this.setting?.options?.value?.enableUrlIcon ?? this.defaultStyle.enableUrlIcon;
  }

  private get isWordWrap(): boolean {
    return this.setting?.options?.value?.style?.isWordWrap ?? this.defaultStyle.isWordWrap;
  }

  private get font(): string {
    return this.setting?.options?.value?.style?.fontFamily ?? this.defaultStyle.fontFamily;
  }

  private get fontFamilyColor(): string {
    return this.setting?.options?.value?.color ?? '#E6E6E6';
  }

  private get fontSize(): string {
    return this.setting?.options?.value?.style?.fontSize ?? this.defaultStyle.fontSize;
  }

  private get valuesAlign(): string {
    return this.setting?.options?.value?.align ?? this.defaultStyle.align;
  }

  //FontConfig

  private emit(key: string, value: any): void {
    this.$emit('onChanged', key, value);
  }

  private handleFontColorChanged(newColor: string) {
    this.emit('value.color', newColor);
  }

  private handleBackgroundColorChanged(newColor: string) {
    this.emit('value.backgroundColor', newColor);
  }

  private handleAlternateFontColorChanged(newColor: string) {
    this.emit('value.alternateColor', newColor);
  }

  private handleAlternateBackgroundColorChanged(newColor: string) {
    this.emit('value.alternateBackgroundColor', newColor);
  }

  private handleURLIconChanged(enable: boolean) {
    this.emit('value.enableUrlIcon', enable);
  }

  private handleWordWrapChanged(enable: boolean) {
    this.emit('value.style.isWordWrap', enable);
  }

  private handleFontChanged(newValue: string) {
    this.emit('value.style.fontFamily', newValue);
  }

  private handleFontFamilyColorChanged(newColor: string) {
    this.emit('value.color', newColor);
  }

  private handleFontSizeChanged(newValue: string) {
    this.emit('value.style.fontSize', newValue);
  }

  private handleAlignChanged(newValue: string) {
    this.emit('value.align', newValue);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('value.color', this.defaultStyle.color);
    settingAsMap.set('value.backgroundColor', this.defaultStyle.backgroundColor);
    settingAsMap.set('value.alternateColor', this.defaultStyle.alternateColor);
    settingAsMap.set('value.alternateBackgroundColor', this.defaultStyle.alternateBackgroundColor);
    settingAsMap.set('value.enableUrlIcon', this.defaultStyle.enableUrlIcon);
    settingAsMap.set('value.isWordWrap', this.defaultStyle.isWordWrap);
    settingAsMap.set('value.style.fontFamily', this.defaultStyle.fontFamily);
    settingAsMap.set('value.style.fontSize', this.defaultStyle.fontSize);
    settingAsMap.set('value.style.align', this.defaultStyle.align);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" src="../Common/tab.style.scss"></style>
