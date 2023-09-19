<template>
  <PanelHeader ref="panel" header="Title & Subtitle" target-id="title-tab">
    <div id="title-tab" class="title-tab">
      <ToggleSetting id="title-enable" :value="titleEnabled" class="mb-3 group-config" label="Title" @onChanged="handleTitleEnabled" />
      <InputSetting id="title-input" :value="title" class="mb-3" label="Title text" size="full" @onChanged="handleTitleSaved" />
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
      </div>
      <!--      <InputSetting id="subtitle-input" :value="subtitle" class="mb-3" label="Subtitle text" size="full" @onChanged="handleSubtitleSaved" />-->
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { SelectOption } from '@/shared';
import { ChartOption, ChartOptionData, SettingKey } from '@core/common/domain';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { SecondaryFontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';

@Component({ components: { PanelHeader } })
export default class FilterTitleTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly setting!: ChartOptionData;

  @Ref()
  private panel!: PanelHeader;
  private defaultStyle = {
    title: {
      text: 'Untitled chart',
      enabled: true,
      fontFamily: ChartOption.getSecondaryFontFamily(),
      color: ChartOption.getPrimaryTextColor(),
      fontSize: '20px'
    },
    subtitle: {
      text: ''
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
    return SecondaryFontSizeOptions;
  }

  private get subtitle(): string {
    return this.setting.subtitle?.text ?? this.defaultStyle.subtitle.text;
  }

  /**
   * Subtitle
   */
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

  private handleTitleEnabled(enable: boolean) {
    return this.$emit('onChanged', 'title.enabled', enable);
  }

  private handleSubtitleSaved(text: string) {
    return this.$emit('onChanged', 'subtitle.text', text);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('title.enabled', this.defaultStyle.title.enabled);
    // settingAsMap.set('title.text', this.defaultStyle.title.text);
    // settingAsMap.set('subtitle.text', this.defaultStyle.subtitle.text);
    settingAsMap.set('title.style.fontFamily', this.defaultStyle.title.fontFamily);
    settingAsMap.set('title.style.color', this.defaultStyle.title.color);
    settingAsMap.set('title.style.fontSize', this.defaultStyle.title.fontSize);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" src="../common/TabStyle.scss" />
