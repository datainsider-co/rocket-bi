<template>
  <PanelHeader ref="panel" header="Title & Subtitle" target-id="title-tab">
    <div id="title-tab" class="title-tab">
      <div id="title-setting" class="mb-3">
        <ToggleSetting
          v-if="enableTitleToggle"
          id="title-enable"
          :value="titleEnabled"
          class="mb-3 group-config"
          label="Title"
          @onChanged="handleTitleEnabled"
        />
        <InputSetting id="title-input" placeholder="Input Title" :value="title" class="mb-3" label="Title text" size="full" @onChanged="handleTitleSaved" />
        <DropdownSetting
          id="title-font-family"
          :enabledRevert="false"
          :options="fontOptions"
          :value="titleFont"
          class="mb-3"
          label="Font family"
          size="full"
          @onChanged="handleTitleFontChanged"
        />
        <div class="row-config-container">
          <ColorSetting
            id="title-font-color"
            :default-color="defaultStyle.title.color"
            :value="titleColor"
            label="Font color"
            size="small"
            style="margin-right: 12px"
            @onChanged="handleTitleColorChanged"
          />
          <DropdownSetting
            id="title-font-size"
            :options="fontSizeOptions"
            :value="titleFontSize"
            label="Text size"
            size="small"
            style="margin-right: 16px"
            @onChanged="handleTitleFontSizeChanged"
          />
          <AlignSetting id="title-align" :value="titleAlign" label="Alignment" @onChanged="handleTitleAlignChanged" />
        </div>
        <RevertButton style="text-align: right" @click="handleRevertTitle" />
      </div>

      <div id="subtitle-setting">
        <ToggleSetting
          v-if="enableTitleToggle"
          id="subtitle-enable"
          :value="subtitleEnabled"
          class="mb-3 group-config"
          label="Subtitle"
          @onChanged="handleSubtitleEnabled"
        />
        <InputSetting
          id="subtitle-input"
          placeholder="Input Subtitle"
          :value="subtitle"
          class="mb-3"
          label="Subtitle text"
          size="full"
          @onChanged="handleSubtitleSaved"
        />
        <DropdownSetting
          id="subtitle-font-family"
          :options="fontOptions"
          :value="subtitleFont"
          class="mb-3"
          label="Font family"
          size="full"
          @onChanged="handleSubtitleFontChanged"
        />
        <div class="row-config-container">
          <ColorSetting
            id="subtitle-font-color"
            :default-color="defaultStyle.subtitle.color"
            :value="subtitleColor"
            label="Font color"
            size="small"
            style="margin-right: 12px"
            @onChanged="handleSubtitleColorChanged"
          />
          <DropdownSetting
            id="subtitle-font-size"
            :options="fontSizeOptions"
            :value="subtitleFontSize"
            label="Text size"
            size="small"
            style="margin-right: 16px"
            @onChanged="handleSubtitleFontSizeChanged"
          />
          <AlignSetting id="subtitle-align" :value="subtitleAlign" label="Alignment" @onChanged="handleSubtitleAlignChanged" />
        </div>
        <RevertButton class="mb-3" style="text-align: right" @click="handleRevertSubtitle" />
      </div>
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { SelectOption, ChartType } from '@/shared';
import { ChartOption, ChartOptionData, SettingKey } from '@core/common/domain';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { FontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';

@Component({ components: { PanelHeader } })
export default class TitleTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly setting!: ChartOptionData;
  @Prop({ required: false })
  private widgetType?: ChartType;
  @Ref()
  private panel!: PanelHeader;
  private defaultStyle = {
    title: {
      text: 'Untitled chart',
      enabled: true,
      fontFamily: 'Roboto',
      color: ChartOption.getThemeTextColor(),
      fontSize: '20px',
      align: 'center'
    },
    subtitle: {
      text: '',
      enabled: true,
      fontFamily: 'Roboto',
      color: ChartOption.getThemeTextColor(),
      fontSize: '16px',
      align: 'center'
    }
  };

  private get titleEnabled(): boolean {
    return this.setting?.title?.enabled ?? this.defaultStyle.title.enabled;
  }

  private get title(): string {
    return this.setting?.title?.text ?? this.defaultStyle.title.text;
  }

  private get titleFont(): string {
    return this.setting?.title?.style?.fontFamily ?? this.defaultStyle.title.fontFamily;
  }

  private get fontOptions(): SelectOption[] {
    return FontFamilyOptions;
  }

  private get titleColor(): string {
    return this.setting?.title?.style?.color ?? this.defaultStyle.title.color;
  }

  private get titleFontSize(): string {
    return this.setting?.title?.style?.fontSize ?? this.defaultStyle.title.fontSize;
  }

  private get fontSizeOptions(): SelectOption[] {
    return FontSizeOptions;
  }

  private get titleAlign(): string {
    return this.setting?.title?.align ?? 'center';
  }

  /**
   * Subtitle
   */

  private get subtitleEnabled(): boolean {
    return this.setting?.subtitle?.enabled ?? this.defaultStyle.subtitle.enabled;
  }

  private get subtitle(): string {
    return this.setting?.subtitle?.text ?? this.defaultStyle.subtitle.text;
  }

  private get subtitleFont(): string {
    return this.setting?.subtitle?.style?.fontFamily ?? this.defaultStyle.subtitle.fontFamily;
  }

  private get subtitleColor(): string {
    return this.setting?.subtitle?.style?.color ?? this.defaultStyle.subtitle.color;
  }

  private get subtitleFontSize(): string {
    return this.setting?.subtitle?.style?.fontSize ?? this.defaultStyle.subtitle.fontSize;
  }

  private get subtitleAlign(): string {
    return this.setting?.subtitle?.align ?? 'center';
  }

  private get enableTitleToggle() {
    switch (this.widgetType) {
      case ChartType.Table:
      case ChartType.PivotTable:
        return true;
      default:
        return false;
    }
  }

  mounted() {
    this.panel.expand();
  }

  private handleTitleSaved(text: string) {
    return this.$emit('onChanged', 'title.text', text);
  }

  private handleTitleFontChanged(newValue: string) {
    return this.$emit('onChanged', 'title.style.fontFamily', newValue);
  }

  private handleTitleColorChanged(newColor: string) {
    return this.$emit('onChanged', 'title.style.color', newColor);
  }

  private handleTitleFontSizeChanged(newValue: string) {
    return this.$emit('onChanged', 'title.style.fontSize', newValue);
  }

  private handleTitleAlignChanged(newValue: string) {
    return this.$emit('onChanged', 'title.align', newValue);
  }

  private handleTitleEnabled(enable: boolean) {
    return this.$emit('onChanged', 'title.enabled', enable);
  }

  private handleSubtitleSaved(text: string) {
    return this.$emit('onChanged', 'subtitle.text', text);
  }

  private handleSubtitleFontChanged(newValue: string) {
    return this.$emit('onChanged', 'subtitle.style.fontFamily', newValue);
  }

  private handleSubtitleColorChanged(newColor: string) {
    return this.$emit('onChanged', 'subtitle.style.color', newColor);
  }

  private handleSubtitleFontSizeChanged(newValue: string) {
    return this.$emit('onChanged', 'subtitle.style.fontSize', newValue);
  }

  private handleSubtitleAlignChanged(newValue: string) {
    return this.$emit('onChanged', 'subtitle.align', newValue);
  }

  private handleSubtitleEnabled(enable: boolean) {
    return this.$emit('onChanged', 'subtitle.enabled', enable);
  }

  private handleRevertTitle() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('title.enabled', this.defaultStyle.title.enabled);
    // settingAsMap.set('title.text', this.defaultStyle.title.text);
    settingAsMap.set('title.style.fontFamily', this.defaultStyle.title.fontFamily);
    settingAsMap.set('title.style.color', this.defaultStyle.title.color);
    settingAsMap.set('title.style.fontSize', this.defaultStyle.title.fontSize);
    settingAsMap.set('title.align', this.defaultStyle.title.align);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleRevertSubtitle() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('subtitle.enabled', this.defaultStyle.subtitle.enabled);
    // settingAsMap.set('subtitle.text', this.defaultStyle.subtitle.text);
    settingAsMap.set('subtitle.style.fontFamily', this.defaultStyle.subtitle.fontFamily);
    settingAsMap.set('subtitle.style.color', this.defaultStyle.subtitle.color);
    settingAsMap.set('subtitle.style.fontSize', this.defaultStyle.subtitle.fontSize);
    settingAsMap.set('subtitle.align', this.defaultStyle.subtitle.align);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" src="../TabStyle.scss" />
