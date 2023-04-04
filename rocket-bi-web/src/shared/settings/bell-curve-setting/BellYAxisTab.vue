<template>
  <PanelHeader header="Y Axis" target-id="y-axis-tab">
    <div class="y-axis-tab">
      <ToggleSetting id="y-axis-enable" :value="enabled" class="mb-3 group-config" label="On" @onChanged="handleAxisEnabled" />
      <div :style="axisSettingStyle">
        <!--      Prefix setting-->
        <!--      Postfix setting-->
        <div class="row-config-container">
          <InputSetting
            id="y-axis-prefix-input"
            :value="prefixText"
            class="mr-2"
            label="Prefix"
            placeholder="Input Prefix"
            size="half"
            :maxLength="defaultSetting.prefixMaxLength"
            @onChanged="handlePrefixSaved"
          />
          <InputSetting
            id="y-axis-postfix-input"
            :value="postfixText"
            label="Postfix"
            placeholder="Input Postfix"
            size="half"
            @onChanged="handlePostfixSaved"
            :maxLength="defaultSetting.suffixMaxLength"
          />
        </div>
        <DropdownSetting
          id="y-axis-category-font-family"
          :options="fontOptions"
          :value="categoryFont"
          class="mb-2"
          label="Font family"
          size="full"
          @onChanged="handleCategoryFontChanged"
        />
        <div class="row-config-container">
          <ColorSetting
            id="y-axis-category-font-color"
            :default-color="defaultSetting.categoryColor"
            :value="categoryColor"
            class="mr-2"
            size="small"
            @onChanged="handleCategoryColorChanged"
          />
          <DropdownSetting
            id="y-axis-category-font-size"
            :options="fontSizeOptions"
            :value="categoryFontSize"
            size="small"
            @onChanged="handleCategoryFontSizeChanged"
          />
        </div>
        <ToggleSetting id="y-axis-title-enable" :value="titleEnabled" class="mb-3 group-config" label="Axis title" @onChanged="handleTitleEnabled" />
        <InputSetting id="y-axis-title-input" :style="titleSettingStyle" :value="title" class="mb-3" size="full" @onChanged="handleTitleSaved" />
        <DropdownSetting
          id="y-axis-title-font-family"
          :options="fontOptions"
          :style="titleSettingStyle"
          :value="titleFont"
          class="mb-2"
          label="Font family"
          size="full"
          @onChanged="handleTitleFontChanged"
        />
        <div :style="titleSettingStyle" class="row-config-container">
          <ColorSetting
            id="y-axis-title-font-color"
            :default-color="defaultSetting.titleColor"
            :value="titleColor"
            class="mr-2"
            size="small"
            @onChanged="handleTitleColorChanged"
          />
          <DropdownSetting id="y-axis-title-font-size" :options="fontSizeOptions" :value="titleFontSize" size="small" @onChanged="handleTitleFontSizeChanged" />
        </div>
        <ToggleSetting id="y-axis-grid-enable" :value="gridEnabled" class="mb-3 group-config" label="Gridlines" @onChanged="handleGridEnabled" />
        <div :style="gridLineChildrenSettingStyle" class="row-config-container">
          <ColorSetting
            id="y-axis-grid-line-color"
            :default-color="defaultSetting.gridLineColor"
            :value="gridLineColor"
            class="mr-2"
            size="half"
            @onChanged="handleGridColorChanged"
          />
          <InputSetting id="y-axis-grid-line-width" :value="gridLineWidth" type="number" size="small" @onChanged="handleGridLineWidthChanged" />
        </div>
        <DropdownSetting
          id="y-axis-grid-line-dash-style"
          :options="dashOptions"
          :style="gridLineChildrenSettingStyle"
          :value="gridLineDashStyle"
          size="full"
          @onChanged="handleGridLineDashStyleChanged"
        />
      </div>
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { AxisSetting, ChartOption, HeatMapQuerySetting, QuerySetting, QuerySettingType, SeriesQuerySetting, SettingKey } from '@core/common/domain';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { FontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';
import { DashOptions } from '@/shared/settings/common/options/DashOptions';
import { ListUtils } from '@/utils';
import { enableCss } from '@/shared/settings/common/install';
import { Log } from '@core/utils';

@Component({ components: { PanelHeader } })
export default class BellYAxisTab extends Vue {
  @Prop({ required: false, type: Array })
  private readonly setting!: AxisSetting[];
  @Prop({ required: false, type: Object })
  private readonly query!: QuerySetting;

  private readonly defaultSetting = {
    visible: true,
    categoryFont: 'Roboto',
    categoryColor: ChartOption.getThemeTextColor(),
    categoryFontSize: '11px',
    titleEnabled: true,
    titleFont: 'Roboto',
    titleColor: ChartOption.getThemeTextColor(),
    titleFontSize: '11px',
    title: this.defaultText,
    gridLineColor: ChartOption.getGridLineColor(),
    gridLineDashStyle: 'Solid',
    gridLineWidth: '0.5',
    prefixMaxLength: 10,
    suffixMaxLength: 10,
    prefixText: '',
    postfixText: ''
  };

  private get defaultText() {
    switch (this.query.className) {
      case QuerySettingType.Series:
        return (this.query as SeriesQuerySetting).yAxis[1].name;
      case QuerySettingType.HeatMap:
        return (this.query as HeatMapQuerySetting).yAxis.name;
      default:
        return '';
    }
  }

  private get enabled(): boolean {
    if (this.setting && this.setting[1]) {
      return this.setting[1]?.visible ?? this.defaultSetting.visible;
    }
    return this.defaultSetting.visible;
  }

  private get categoryFont(): string {
    if (this.setting && this.setting[1]) {
      return this.setting[1]?.labels?.style?.fontFamily ?? this.defaultSetting.categoryFont;
    }
    return this.defaultSetting.categoryFont;
  }

  private get categoryColor(): string {
    if (this.setting && this.setting[1]) {
      return this.setting[1]?.labels?.style?.color ?? this.defaultSetting.categoryColor;
    }
    return this.defaultSetting.categoryColor;
  }

  private get categoryFontSize(): string {
    if (this.setting && this.setting[1]) {
      return this.setting[1]?.labels?.style?.fontSize ?? this.defaultSetting.categoryFontSize;
    }
    return this.defaultSetting.categoryFontSize;
  }

  private get titleEnabled(): boolean {
    if (this.setting && this.setting[1]) {
      return this.setting[1]?.title?.enabled ?? this.defaultSetting.titleEnabled;
    }
    return this.defaultSetting.titleEnabled;
  }

  private get titleFont(): string {
    if (this.setting && this.setting[1]) {
      return this.setting[1]?.title?.style?.fontFamily ?? this.defaultSetting.titleFont;
    }
    return this.defaultSetting.titleFont;
  }

  private get titleColor(): string {
    if (this.setting && this.setting[1]) {
      return this.setting[1]?.title?.style?.color ?? this.defaultSetting.titleColor;
    }
    return this.defaultSetting.titleColor;
  }

  private get titleFontSize(): string {
    if (this.setting && this.setting[1]) {
      return this.setting[1]?.title?.style?.fontSize ?? this.defaultSetting.titleFontSize;
    }
    return this.defaultSetting.titleFontSize;
  }

  private get fontOptions() {
    return FontFamilyOptions;
  }

  private get fontSizeOptions() {
    return FontSizeOptions;
  }

  private get title(): string {
    if (this.setting && this.setting[1]) {
      return this.setting[1].title?.text ?? this.defaultSetting.title;
    }
    return this.defaultSetting.title;
  }

  private get gridLineColor(): string {
    if (this.setting && this.setting[1]) {
      return this.setting[1].gridLineColor ?? this.defaultSetting.gridLineColor;
    }
    return this.defaultSetting.gridLineColor;
  }

  private get gridLineWidth(): string {
    if (this.setting && this.setting[1]) {
      return `${this.setting[1].gridLineWidth}` ?? this.defaultSetting.gridLineWidth;
    }
    return this.defaultSetting.gridLineWidth;
  }

  private get gridLineDashStyle(): string {
    if (this.setting && this.setting[1]) {
      return this.setting[1].gridLineDashStyle ?? this.defaultSetting.gridLineDashStyle;
    }
    return this.defaultSetting.gridLineDashStyle;
  }

  private get dashOptions() {
    return DashOptions;
  }

  private get widthOptions() {
    return ListUtils.generate(10, index => {
      const key = index + 1;
      return {
        displayName: key.toString(),
        id: key
      };
    });
  }

  private get gridEnabled(): boolean {
    if (this.setting && this.setting[1]) {
      return this.setting[1].gridLineWidth != 0;
    }
    return false;
  }

  private get prefixText(): string {
    return this.setting[1]?.prefix?.text ?? this.defaultSetting.prefixText;
  }

  private get postfixText(): string {
    return this.setting[1]?.postfix?.text ?? this.defaultSetting.postfixText;
  }

  private get gridLineChildrenSettingStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.gridEnabled && this.enabled),
      marginBottom: '16px'
    } as CSSStyleDeclaration;
  }

  private get axisSettingStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enabled)
    } as CSSStyleDeclaration;
  }

  private get titleSettingStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enabled && this.titleEnabled)
    } as CSSStyleDeclaration;
  }

  created() {
    Log.debug('created::', this.setting);
    if (!this.setting) {
      this.handleRevert();
    }
  }

  private handleGridEnabled(enabled: boolean) {
    if (enabled) {
      return this.$emit('onChanged', 'yAxis[1].gridLineWidth', 1);
    } else {
      return this.$emit('onChanged', 'yAxis[1].gridLineWidth', 0);
    }
  }

  private handleAxisEnabled(enabled: boolean) {
    return this.$emit('onChanged', 'yAxis[1].visible', enabled);
  }

  private handleCategoryFontChanged(newFont: string) {
    return this.$emit('onChanged', 'yAxis[1].labels.style.fontFamily', newFont);
  }

  private handleCategoryFontSizeChanged(newFontSize: string) {
    return this.$emit('onChanged', 'yAxis[1].labels.style.fontSize', newFontSize);
  }

  private handleCategoryColorChanged(newColor: string) {
    return this.$emit('onChanged', 'yAxis[1].labels.style.color', newColor);
  }

  private handleTitleEnabled(enabled: boolean) {
    return this.$emit('onChanged', 'yAxis[1].title.enabled', enabled);
  }

  private handleTitleSaved(newText: string) {
    return this.$emit('onChanged', 'yAxis[1].title.text', newText);
  }

  private handleTitleFontChanged(newFont: string) {
    return this.$emit('onChanged', 'yAxis[1].title.style.fontFamily', newFont);
  }

  private handleTitleColorChanged(newColor: string) {
    return this.$emit('onChanged', 'yAxis[1].title.style.color', newColor);
  }

  private handleTitleFontSizeChanged(newFontSize: string) {
    return this.$emit('onChanged', 'yAxis[1].title.style.fontSize', newFontSize);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('yAxis[1].visible', this.defaultSetting.visible);
    settingAsMap.set('yAxis[1].labels.style.fontFamily', this.defaultSetting.categoryFont);
    settingAsMap.set('yAxis[1].labels.style.fontSize', this.defaultSetting.categoryFontSize);
    settingAsMap.set('yAxis[1].labels.style.color', this.defaultSetting.categoryColor);
    settingAsMap.set('yAxis[1].title.enabled', this.defaultSetting.titleEnabled);
    settingAsMap.set('yAxis[1].title.text', this.defaultSetting.title);
    settingAsMap.set('yAxis[1].title.style.fontFamily', this.defaultSetting.titleFont);
    settingAsMap.set('yAxis[1].title.style.fontSize', this.defaultSetting.titleFontSize);
    settingAsMap.set('yAxis[1].title.style.color', this.defaultSetting.titleColor);
    settingAsMap.set('yAxis[1].gridLineWidth', this.defaultSetting.gridLineWidth);
    settingAsMap.set('yAxis[1].gridLineColor', this.defaultSetting.gridLineColor);
    settingAsMap.set('yAxis[1].gridLineDashStyle', this.defaultSetting.gridLineDashStyle);
    settingAsMap.set('yAxis[1].prefix.text', this.defaultSetting.prefixText);
    settingAsMap.set('yAxis[1].postfix.text', this.defaultSetting.postfixText);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleGridLineWidthChanged(newWidth: number) {
    if (this.gridEnabled) {
      return this.$emit('onChanged', 'yAxis[1].gridLineWidth', newWidth);
    }
  }

  private handleGridColorChanged(newColor: string) {
    return this.$emit('onChanged', 'yAxis[1].gridLineColor', newColor);
  }

  private handleGridLineDashStyleChanged(newDashStyle: string) {
    return this.$emit('onChanged', 'yAxis[1].gridLineDashStyle', newDashStyle);
  }

  private handlePrefixSaved(newText: string) {
    return this.$emit('onChanged', 'yAxis[1].prefix.text', newText);
  }

  private handlePostfixSaved(newText: string) {
    return this.$emit('onChanged', 'yAxis[1].postfix.text', newText);
  }
}
</script>

<style lang="scss" scoped></style>
