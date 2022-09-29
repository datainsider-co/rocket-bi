<template>
  <PanelHeader header="Column headers" target-id="column-headers-tab">
    <div class="column-header">
      <DropdownSetting
        id="header-font-family"
        :options="fontOptions"
        :value="font"
        class="mb-2"
        label="Font family"
        size="full"
        @onChanged="handleFontChanged"
      />
      <div class="row-config-container">
        <ColorSetting
          id="header-font-family-color"
          :default-color="defaultStyle.fontFamily"
          :value="fontFamilyColor"
          style="width: 145px; margin-right: 8px"
          @onChanged="handleFontFamilyColorChanged"
        />
        <DropdownSetting
          id="header-font-family-size"
          :options="fontSizeOptions"
          :value="fontSize"
          class="mr-2"
          size="small"
          @onChanged="handleFontSizeChanged"
        />
        <AlignSetting id="header-align" :value="columnAlign" @onChanged="handleAlignChanged" />
      </div>
      <ColorSetting
        id="header-background-color"
        :default-color="defaultStyle.backgroundColor"
        :value="backgroundColor"
        label="Background color"
        style="width: 145px; margin-bottom: 12px"
        @onChanged="handleBackgroundColorChanged"
      />
      <div class="row-config-container">
        <!--        <ToggleSetting-->
        <!--          id="header-auto-width"-->
        <!--          :value="widthAuto"-->
        <!--          disable-->
        <!--          label="Auto-size column width"-->
        <!--          style="margin-right: 12px"-->
        <!--          @onChanged="handleAutoWidthChanged"-->
        <!--        />-->
        <ToggleSetting id="header-word-wrap" :value="isWordWrap" label="Word wrap" @onChanged="handleWordWrapChanged" />
      </div>
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import ToggleSetting from '@/shared/settings/common/ToggleSetting.vue';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { ChartOption, PivotTableChartOption, SettingKey } from '@core/common/domain';
import DropdownSetting from '@/shared/settings/common/DropdownSetting.vue';
import ColorSetting from '@/shared/settings/common/ColorSetting.vue';
import AlignSetting from '@/shared/settings/common/AlignSetting.vue';
import { FontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';

@Component({ components: { ToggleSetting, DropdownSetting, ColorSetting, PanelHeader, AlignSetting } })
export default class HeaderTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly setting!: PivotTableChartOption;
  private readonly fontSizeOptions = FontSizeOptions;
  private fontOptions = FontFamilyOptions;
  private readonly defaultStyle = {
    color: ChartOption.getThemeTextColor(),
    backgroundColor: ChartOption.getTableHeaderBackgroundColor(),
    outline: 'bottom',
    widthAuto: false,
    isWordWrap: false,
    fontFamily: 'Roboto',
    fontSize: '12px',
    align: 'left'
  };

  private get backgroundColor(): string {
    return this.setting?.options?.header?.backgroundColor ?? this.defaultStyle.backgroundColor;
  }

  private get widthAuto(): boolean {
    return this.setting?.options?.header?.isAutoWidthSize ?? this.defaultStyle.widthAuto;
  }

  private get isWordWrap(): boolean {
    return this.setting?.options?.header?.isWordWrap ?? this.defaultStyle.isWordWrap;
  }

  private get font(): string {
    return this.setting?.options?.header?.style?.fontFamily ?? this.defaultStyle.fontFamily;
  }

  private get fontFamilyColor(): string {
    return this.setting?.options?.header?.style?.color ?? this.defaultStyle.color;
  }

  private get fontSize(): string {
    return this.setting?.options?.header?.style?.fontSize ?? this.defaultStyle.fontSize;
  }

  ///Font Setting

  ///Font

  private get columnAlign(): string {
    return this.setting?.options?.header?.align ?? this.defaultStyle.align;
  }

  private handleBackgroundColorChanged(newColor: string) {
    return this.$emit('onChanged', 'header.backgroundColor', newColor);
  }

  //FontConfig

  private handleAutoWidthChanged(auto: boolean) {
    return this.$emit('onChanged', 'header.isAutoWidthSize', auto);
  }

  private handleWordWrapChanged(enable: boolean) {
    return this.$emit('onChanged', 'header.isWordWrap', enable);
  }

  private handleFontChanged(newValue: string) {
    return this.$emit('onChanged', 'header.style.fontFamily', newValue);
  }

  private handleFontFamilyColorChanged(newColor: string) {
    return this.$emit('onChanged', 'header.style.color', newColor);
  }

  private handleFontSizeChanged(newValue: string) {
    return this.$emit('onChanged', 'header.style.fontSize', newValue);
  }

  private handleAlignChanged(newValue: string) {
    return this.$emit('onChanged', 'header.align', newValue);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('header.style.fontFamily', this.defaultStyle.fontFamily);
    settingAsMap.set('header.style.color', this.defaultStyle.color);
    settingAsMap.set('header.style.fontSize', this.defaultStyle.fontSize);
    settingAsMap.set('header.align', this.defaultStyle.align);
    settingAsMap.set('header.backgroundColor', this.defaultStyle.backgroundColor);
    settingAsMap.set('header.isWordWrap', this.defaultStyle.isWordWrap);
    // Todo: <<Auto width>> is disable
    // settingAsMap.set('header.isAutoWidthSize', this.defaultStyle.widthAuto);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" src="../common/TabStyle.scss" />
