<template>
  <PanelHeader :header="tabTitle" target-id="x-axis-tab">
    <div class="x-axis-tab">
      <ToggleSetting id="x-axis-enable" :value="enabled" class="mb-3 group-config" label="On" @onChanged="handleAxisEnabled" />
      <div :style="axisSettingStyle">
        <!--      Prefix setting-->
        <!--      Postfix setting-->
        <div class="row-config-container">
          <InputSetting
            id="x-axis-prefix-input"
            :value="prefixText"
            class="mr-2"
            label="Prefix"
            placeholder="Input Prefix"
            size="half"
            :maxLength="defaultSetting.prefixMaxLength"
            @onChanged="handlePrefixSaved"
          />
          <InputSetting
            id="x-axis-postfix-input"
            :value="postfixText"
            label="Postfix"
            placeholder="Input Postfix"
            size="half"
            @onChanged="handlePostfixSaved"
            :maxLength="defaultSetting.suffixMaxLength"
          />
        </div>
        <DropdownSetting
          id="x-axis-category-font-family"
          :options="fontOptions"
          :value="categoryFont"
          class="mb-2"
          label="Font family"
          size="full"
          @onChanged="handleCategoryFontChanged"
        />
        <div class="row-config-container">
          <ColorSetting
            id="x-axis-category-font-color"
            :default-color="defaultSetting.categoryColor"
            :value="categoryColor"
            class="mr-2"
            size="small"
            @onChanged="handleCategoryColorChanged"
          />
          <DropdownSetting
            id="x-axis-category-font-size"
            :options="fontSizeOptions"
            :value="categoryFontSize"
            size="small"
            @onChanged="handleCategoryFontSizeChanged"
          />
        </div>
        <ToggleSetting id="x-axis-title-enable" :value="titleEnabled" class="mb-3 group-config" label="Axis title" @onChanged="handleTitleEnabled" />
        <InputSetting
          id="x-axis-title-input"
          placeholder="Input Axis Title"
          :style="titleSettingStyle"
          :value="title"
          class="mb-3"
          size="full"
          @onChanged="handleTitleSaved"
        />
        <DropdownSetting
          id="x-axis-title-font-family"
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
            id="x-axis-title-font-color"
            :default-color="defaultSetting.color"
            :value="titleColor"
            class="mr-2"
            size="small"
            @onChanged="handleTitleColorChanged"
          />
          <DropdownSetting id="x-axis-title-font-size" :options="fontSizeOptions" :value="titleFontSize" size="small" @onChanged="handleTitleFontSizeChanged" />
        </div>
        <div v-if="enableSettingGridLine" class="mb-3">
          <ToggleSetting id="x-axis-grid-enable" :value="gridEnabled" class="mb-3 group-config" label="Gridlines" @onChanged="handleGridEnabled" />
          <div :style="gridLineChildrenSettingStyle" class="row-config-container">
            <ColorSetting
              id="x-axis-grid-line-color"
              :default-color="defaultSetting.gridLineColor"
              :value="gridLineColor"
              class="mr-2"
              size="half"
              @onChanged="handleGridColorChanged"
            />
            <InputSetting id="x-axis-grid-line-width" :value="gridLineWidth" size="small" type="number" @onChanged="handleGridLineWidthChanged" />
          </div>
          <DropdownSetting
            id="x-axis-grid-line-dash-style"
            :options="dashOptions"
            :style="gridLineChildrenSettingStyle"
            :value="gridLineDashStyle"
            size="full"
            @onChanged="handleGridLineDashStyleChanged"
          />
        </div>
      </div>
      <RevertButton class="mb-3 pr-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { AxisSetting, ChartOption, HeatMapQuerySetting, QuerySettingType, ScatterQuerySetting, SeriesQuerySetting, SettingKey } from '@core/domain';
import { QuerySetting } from '@core/domain/Model/Query/QuerySetting.ts';
import { FontFamilyOptions } from '@/shared/Settings/Common/Options/FontFamilyOptions';
import { FontSizeOptions } from '@/shared/Settings/Common/Options/FontSizeOptions';
import { DashOptions } from '@/shared/Settings/Common/Options/DashOptions';
import { enableCss } from '@/shared/Settings/Common/install';
import { ChartType } from '@/shared';

@Component({ components: { PanelHeader } })
export default class XAxisTab extends Vue {
  @Prop({ required: false, type: Array })
  private readonly setting!: AxisSetting[];
  @Prop({ required: false, type: Object })
  private readonly query!: QuerySetting;
  @Prop({ required: false, type: String })
  private readonly chartType?: ChartType;

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
    gridLineWidth: '0',
    prefixMaxLength: 10,
    suffixMaxLength: 10,
    prefixText: '',
    postfixText: ''
  };

  private get prefixText(): string {
    return this.setting[0]?.prefix?.text ?? this.defaultSetting.prefixText;
  }

  private get postfixText(): string {
    return this.setting[0]?.postfix?.text ?? this.defaultSetting.postfixText;
  }

  private get tabTitle(): string {
    if (this.chartType == ChartType.Bar || this.chartType == ChartType.StackedBar) {
      return 'Y Axis';
    }
    return 'X Axis';
  }

  private get defaultText() {
    switch (this.query.className) {
      case QuerySettingType.Series:
        return (this.query as SeriesQuerySetting).xAxis.name;
      case QuerySettingType.Scatter:
        return (this.query as ScatterQuerySetting).xAxis.name;
      case QuerySettingType.HeatMap:
        return (this.query as HeatMapQuerySetting).xAxis.name;
      default:
        return '';
    }
  }

  private get enabled(): boolean {
    if (this.setting && this.setting[0]) {
      return this.setting[0].visible ?? this.defaultSetting.visible;
    }
    return this.defaultSetting.visible;
  }

  private get categoryFont(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].labels?.style?.fontFamily ?? this.defaultSetting.categoryFont;
    }
    return this.defaultSetting.categoryFont;
  }

  private get categoryColor(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].labels?.style?.color ?? this.defaultSetting.categoryColor;
    }
    return this.defaultSetting.categoryColor;
  }

  private get categoryFontSize(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].labels?.style?.fontSize ?? this.defaultSetting.categoryFontSize;
    }
    return this.defaultSetting.categoryFontSize;
  }

  private get titleEnabled(): boolean {
    if (this.setting && this.setting[0]) {
      return this.setting[0].title?.enabled ?? this.defaultSetting.titleEnabled;
    }
    return this.defaultSetting.titleEnabled;
  }

  private get titleFont(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].title?.style?.fontFamily ?? this.defaultSetting.titleFont;
    }
    return this.defaultSetting.titleFont;
  }

  private get titleColor(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].title?.style?.color ?? this.defaultSetting.titleColor;
    }
    return this.defaultSetting.titleColor;
  }

  private get titleFontSize(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].title?.style?.fontSize ?? this.defaultSetting.titleFontSize;
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
    if (this.setting && this.setting[0]) {
      return this.setting[0].title?.text ?? this.defaultSetting.title;
    }
    return this.defaultSetting.title;
  }

  private get gridLineColor(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].gridLineColor ?? this.defaultSetting.gridLineColor;
    }
    return this.defaultSetting.gridLineColor;
  }

  private get gridLineWidth(): string {
    if (this.setting && this.setting[0]) {
      return `${this.setting[0].gridLineWidth}` ?? this.defaultSetting.gridLineWidth;
    }
    return this.defaultSetting.gridLineWidth;
  }

  private get gridLineDashStyle(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].gridLineDashStyle ?? this.defaultSetting.gridLineDashStyle;
    }
    return this.defaultSetting.gridLineDashStyle;
  }

  private get dashOptions() {
    return DashOptions;
  }

  private get gridEnabled(): boolean {
    if (this.setting && this.setting[0]) {
      return this.setting[0].gridLineWidth != 0;
    }
    return false;
  }

  private get enableSettingGridLine(): boolean {
    const isScatter: boolean = this.query.className == QuerySettingType.Scatter;
    const isBubble: boolean = this.query.className == QuerySettingType.Bubble;
    return isScatter || isBubble;
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
    if (!this.setting) {
      this.handleRevert();
    }
  }

  private handleAxisEnabled(enabled: boolean) {
    return this.$emit('onChanged', 'xAxis[0].visible', enabled);
  }

  private handleCategoryFontChanged(newFont: string) {
    return this.$emit('onChanged', 'xAxis[0].labels.style.fontFamily', newFont);
  }

  private handleCategoryFontSizeChanged(newFontSize: string) {
    return this.$emit('onChanged', 'xAxis[0].labels.style.fontSize', newFontSize);
  }

  private handleCategoryColorChanged(newColor: string) {
    return this.$emit('onChanged', 'xAxis[0].labels.style.color', newColor);
  }

  private handleTitleEnabled(enabled: boolean) {
    return this.$emit('onChanged', 'xAxis[0].title.enabled', enabled);
  }

  private handleTitleSaved(newText: string) {
    return this.$emit('onChanged', 'xAxis[0].title.text', newText);
  }

  private handleTitleFontChanged(newFont: string) {
    return this.$emit('onChanged', 'xAxis[0].title.style.fontFamily', newFont);
  }

  private handleTitleColorChanged(newColor: string) {
    return this.$emit('onChanged', 'xAxis[0].title.style.color', newColor);
  }

  private handleTitleFontSizeChanged(newFontSize: string) {
    return this.$emit('onChanged', 'xAxis[0].title.style.fontSize', newFontSize);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, any> = new Map();
    settingAsMap.set('xAxis[0].visible', this.defaultSetting.visible);
    settingAsMap.set('xAxis[0].labels.style.fontFamily', this.defaultSetting.categoryFont);
    settingAsMap.set('xAxis[0].labels.style.fontSize', this.defaultSetting.categoryFontSize);
    settingAsMap.set('xAxis[0].labels.style.color', this.defaultSetting.categoryColor);
    settingAsMap.set('xAxis[0].title.enabled', this.defaultSetting.titleEnabled);
    settingAsMap.set('xAxis[0].title.text', this.defaultSetting.title);
    settingAsMap.set('xAxis[0].title.style.fontFamily', this.defaultSetting.titleFont);
    settingAsMap.set('xAxis[0].title.style.fontSize', this.defaultSetting.titleFontSize);
    settingAsMap.set('xAxis[0].title.style.color', this.defaultSetting.titleColor);
    settingAsMap.set('xAxis[0].gridLineWidth', this.defaultSetting.gridLineWidth);
    settingAsMap.set('xAxis[0].gridLineColor', this.defaultSetting.gridLineColor);
    settingAsMap.set('xAxis[0].gridLineDashStyle', this.defaultSetting.gridLineDashStyle);
    settingAsMap.set('xAxis[0].gridLineDashStyle', this.defaultSetting.gridLineDashStyle);
    settingAsMap.set('xAxis[0].prefix.text', this.defaultSetting.prefixText);
    settingAsMap.set('xAxis[0].postfix.text', this.defaultSetting.postfixText);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleGridEnabled(enabled: boolean) {
    if (enabled) {
      return this.$emit('onChanged', 'xAxis[0].gridLineWidth', '0.5');
    } else {
      return this.$emit('onChanged', 'xAxis[0].gridLineWidth', '0');
    }
  }

  private handleGridLineWidthChanged(newWidth: number) {
    if (this.gridEnabled) {
      return this.$emit('onChanged', 'xAxis[0].gridLineWidth', newWidth);
    }
  }

  private handleGridColorChanged(newColor: string) {
    return this.$emit('onChanged', 'xAxis[0].gridLineColor', newColor);
  }

  private handleGridLineDashStyleChanged(newDashStyle: string) {
    return this.$emit('onChanged', 'xAxis[0].gridLineDashStyle', newDashStyle);
  }

  private handlePrefixSaved(newText: string) {
    return this.$emit('onChanged', 'xAxis[0].prefix.text', newText);
  }

  private handlePostfixSaved(newText: string) {
    return this.$emit('onChanged', 'xAxis[0].postfix.text', newText);
  }
}
</script>

<style lang="scss" scoped></style>
