<template>
  <PanelHeader :header="tabTitle" target-id="y-axis-tab">
    <div class="y-axis-tab">
      <ToggleSetting id="y-axis-enable" :value="enabled" class="mb-3 group-config" label="On" @onChanged="handleAxisEnabled" />
      <div :style="axisSettingStyle">
        <!--      Prefix setting-->
        <!--      Postfix setting-->
        <div class="row-config-container">
          <InputSetting
            id="-axis-prefix-input"
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
        <!--      <InputSetting-->
        <!--        id="y-axis-format-input"-->
        <!--        placeholder="Input format Title"-->
        <!--        :disable="!enabled"-->
        <!--        :value="format"-->
        <!--        class="mb-3"-->
        <!--        size="full"-->
        <!--        @onChanged="handleFormatSaved"-->
        <!--      />-->
        <ToggleSetting id="y-axis-title-enable" :value="titleEnabled" class="mb-3 group-config" label="Axis title" @onChanged="handleTitleEnabled" />
        <InputSetting
          id="y-axis-title-input"
          placeholder="Input Y Axis Title"
          :disable="!enabled"
          :value="title"
          class="mb-3"
          size="full"
          @onChanged="handleTitleSaved"
        />
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
          <InputSetting id="y-axis-grid-line-width" :value="gridLineWidth" size="small" type="number" @onChanged="handleGridLineWidthChanged" />
        </div>
        <DropdownSetting
          id="y-axis-grid-line-dash-style"
          :options="dashOptions"
          :style="gridLineChildrenSettingStyle"
          :value="gridLineDashStyle"
          size="full"
          @onChanged="handleGridLineDashStyleChanged"
        />
        <!--    Config Min Max For YAxis-->
        <ToggleSetting
          id="config-min-max-for-y-axis"
          :value="enableMinMaxCondition"
          class="mb-2 group-config"
          :disable="!enabled"
          label="Config Min Max For Y-Axis"
          @onChanged="handleConditionChanged"
        />
        <div :style="minMaxConditionStyle" class="row-config-container">
          <div>
            <ToggleSetting
              id="min-condition"
              :disable="!enableMinMaxCondition || !enabled"
              :value="enableMinCondition"
              class="group-config mb-1"
              label="Min"
              @onChanged="handleMinConditionChanged"
            />
            <InputSetting
              applyFormatNumber
              :style="minConditionStyle"
              id="y-axis-min-condition"
              type="number"
              class="mr-2"
              label="Min Value"
              size="md"
              :value="minYAxis"
              @onChanged="handleMinValueChanged"
            ></InputSetting>
          </div>
          <div>
            <ToggleSetting
              id="max-condition"
              :disable="!enableMinMaxCondition || !enabled"
              :value="enableMaxCondition"
              class="group-config mb-1"
              label="Max"
              @onChanged="handleMaxConditionChanged"
            />
            <InputSetting
              applyFormatNumber
              :style="maxConditionStyle"
              id="y-axis-max-condition"
              type="number"
              label="Max Value"
              size="md"
              :value="maxYAxis"
              @onChanged="handleMaxValueChanged"
            ></InputSetting>
          </div>
        </div>
      </div>
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { AxisSetting, ChartOption, PlotOptions, QuerySetting, QuerySettingClassName, SettingKey } from '@core/common/domain';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { SecondaryFontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';
import { DashOptions } from '@/shared/settings/common/options/DashOptions';
import { enableCss } from '@/shared/settings/common/install';
import { ChartType, SelectOption } from '@/shared';
import { get } from 'lodash';
import { Log } from '@core/utils';

@Component({ components: { PanelHeader } })
export default class SeriesYAxisTab extends Vue {
  @Prop({ required: false, type: Array })
  protected readonly setting!: AxisSetting[];
  @Prop({ required: false, type: Object })
  protected readonly plotOptions!: PlotOptions;
  @Prop({ required: false, type: Object })
  protected readonly query!: QuerySetting;
  @Prop({ required: false, type: Array })
  protected readonly seriesOptions?: SelectOption[];
  @Prop({ required: false, type: String })
  protected readonly chartType?: ChartType;

  protected readonly defaultSetting = {
    visible: true,
    categoryFont: ChartOption.getSecondaryFontFamily(),
    categoryColor: ChartOption.getPrimaryTextColor(),
    categoryFontSize: '11px',
    titleEnabled: true,
    titleFont: ChartOption.getSecondaryFontFamily(),
    titleColor: ChartOption.getPrimaryTextColor(),
    titleFontSize: '11px',
    gridLineColor: ChartOption.getGridLineColor(),
    gridLineDashStyle: 'Solid',
    gridLineWidth: '0.5',
    dualTitle: 'Untitled',
    format: '{value}',
    min: '0',
    max: '10000',
    prefixMaxLength: 10,
    suffixMaxLength: 10,
    prefixText: '',
    postfixText: ''
  };

  getDefaultText(): string {
    switch (this.query.className) {
      case QuerySettingClassName.Series:
        return get(this.query, 'yAxis[0].name', 'Untitled');
      case QuerySettingClassName.HeatMap:
        return get(this.query, 'yAxis.name', 'Untitled');
      default:
        return '';
    }
  }

  protected get tabTitle(): string {
    if (this.chartType == ChartType.Bar) {
      return 'X Axis';
    }
    return 'Y Axis';
  }

  protected get enabled(): boolean {
    return get(this.setting, '[0].visible', this.defaultSetting.visible);
  }

  protected get categoryFont(): string {
    Log.debug('get::categoryFont', this.setting);
    return get(this.setting, '[0].labels.style.fontFamily', this.defaultSetting.categoryFont);
  }

  protected get categoryColor(): string {
    return get(this.setting, '[0].labels.style.color', this.defaultSetting.categoryColor);
  }

  protected get categoryFontSize(): string {
    return get(this.setting, '[0].labels.style.fontSize', this.defaultSetting.categoryFontSize);
  }

  protected get titleEnabled(): boolean {
    return get(this.setting, '[0].title.enabled', this.defaultSetting.titleEnabled);
  }

  protected get titleFont(): string {
    return get(this.setting, '[0].title.style.fontFamily', this.defaultSetting.titleFont);
  }

  protected get titleColor(): string {
    return get(this.setting, '[0].title.style.color', this.defaultSetting.titleColor);
  }

  protected get titleFontSize(): string {
    return get(this.setting, '[0].title.style.fontSize', this.defaultSetting.titleFontSize);
  }

  protected get fontOptions() {
    return FontFamilyOptions;
  }

  protected get fontSizeOptions() {
    return SecondaryFontSizeOptions;
  }

  protected get title(): string {
    return get(this.setting, '[0].title.text', this.getDefaultText());
  }

  protected get dualTitle(): string {
    return get(this.setting, '[1].title.text', this.defaultSetting.dualTitle);
  }

  protected get gridLineColor(): string {
    return get(this.setting, '[0].gridLineColor', this.defaultSetting.gridLineColor);
  }

  protected get gridLineWidth(): string {
    return get(this.setting, '[0].gridLineWidth', this.defaultSetting.gridLineWidth);
  }

  protected get maxYAxis(): string {
    // Log.debug("maxYaxis::", this.setting[0]?.condition.max.value)
    return get(this.setting, '[0].condition.max.value', this.defaultSetting.max);
  }

  protected get minYAxis(): string {
    return get(this.setting, '[0].condition.min.value', this.defaultSetting.min);
  }

  protected get gridLineDashStyle(): string {
    return get(this.setting, '[0].gridLineDashStyle', this.defaultSetting.gridLineDashStyle);
  }

  protected get dashOptions() {
    return DashOptions;
  }

  protected get gridEnabled(): boolean {
    return get(this.setting, '[0].gridLineWidth', 0) !== 0;
  }

  protected get prefixText(): string {
    return this.setting[0]?.prefix?.text ?? this.defaultSetting.prefixText;
  }

  protected get postfixText(): string {
    return this.setting[0]?.postfix?.text ?? this.defaultSetting.postfixText;
  }

  protected get gridLineChildrenSettingStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.gridEnabled && this.enabled),
      marginBottom: '16px'
    } as CSSStyleDeclaration;
  }

  protected get minMaxConditionStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enableMinMaxCondition)
    } as CSSStyleDeclaration;
  }

  protected get minConditionStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enableMinCondition)
    } as CSSStyleDeclaration;
  }

  protected get maxConditionStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enableMaxCondition)
    } as CSSStyleDeclaration;
  }

  protected get axisSettingStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enabled)
    } as CSSStyleDeclaration;
  }

  protected get titleSettingStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enabled && this.titleEnabled)
    } as CSSStyleDeclaration;
  }

  protected get enableMinMaxCondition(): boolean {
    return this.setting[0]?.condition?.enabled ?? false;
  }

  protected get enableMaxCondition(): boolean {
    return get(this.setting, '[0].condition.max.enabled', false);
  }

  protected get enableMinCondition(): boolean {
    return get(this.setting, '[0].condition.min.enabled', false);
  }

  created() {
    if (!this.setting) {
      this.handleRevert();
    }
  }

  protected handleGridEnabled(enabled: boolean) {
    if (enabled) {
      return this.$emit('onChanged', 'yAxis[0].gridLineWidth', '0.5');
    } else {
      return this.$emit('onChanged', 'yAxis[0].gridLineWidth', '0');
    }
  }

  protected handleAxisEnabled(enabled: boolean) {
    this.$emit('onChanged', 'yAxis[0].visible', enabled);
    if (!enabled) {
      this.handleConditionChanged(false);
    }
  }

  protected handleCategoryFontChanged(newFont: string) {
    return this.$emit('onChanged', 'yAxis[0].labels.style.fontFamily', newFont);
  }

  protected handleCategoryFontSizeChanged(newFontSize: string) {
    return this.$emit('onChanged', 'yAxis[0].labels.style.fontSize', newFontSize);
  }

  protected handleCategoryColorChanged(newColor: string) {
    return this.$emit('onChanged', 'yAxis[0].labels.style.color', newColor);
  }

  protected handleTitleEnabled(enabled: boolean) {
    return this.$emit('onChanged', 'yAxis[0].title.enabled', enabled);
  }

  protected handleTitleSaved(newText: string) {
    return this.$emit('onChanged', 'yAxis[0].title.text', newText);
  }

  protected handleTitleFontChanged(newFont: string) {
    return this.$emit('onChanged', 'yAxis[0].title.style.fontFamily', newFont);
  }

  protected handleTitleColorChanged(newColor: string) {
    return this.$emit('onChanged', 'yAxis[0].title.style.color', newColor);
  }

  protected handleTitleFontSizeChanged(newFontSize: string) {
    return this.$emit('onChanged', 'yAxis[0].title.style.fontSize', newFontSize);
  }

  protected handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map([...this.defaultMainAxisConfig]);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  protected handleGridLineWidthChanged(newWidth: number) {
    if (this.gridEnabled) {
      return this.$emit('onChanged', 'yAxis[0].gridLineWidth', newWidth);
    }
  }

  protected handleGridColorChanged(newColor: string) {
    return this.$emit('onChanged', 'yAxis[0].gridLineColor', newColor);
  }

  protected handleGridLineDashStyleChanged(newDashStyle: string) {
    return this.$emit('onChanged', 'yAxis[0].gridLineDashStyle', newDashStyle);
  }

  protected handleConditionChanged(enable: boolean) {
    this.$emit('onChanged', 'yAxis[0].condition.enabled', enable);
  }

  protected handleMinConditionChanged(enable: boolean) {
    this.$emit('onChanged', 'yAxis[0].condition.min.enabled', enable);
    if (enable) {
      this.handleMinValueChanged(this.minYAxis);
    }
  }

  protected handleMaxConditionChanged(enable: boolean) {
    this.$emit('onChanged', 'yAxis[0].condition.max.enabled', enable);
    if (enable) {
      this.handleMaxValueChanged(this.maxYAxis);
    }
  }

  protected handleMinValueChanged(value: string) {
    this.$emit('onChanged', 'yAxis[0].condition.min.value', +value);
  }

  protected handleMaxValueChanged(value: string) {
    this.$emit('onChanged', 'yAxis[0].condition.max.value', +value);
  }

  protected handlePrefixSaved(newText: string) {
    return this.$emit('onChanged', 'yAxis[0].prefix.text', newText);
  }

  protected handlePostfixSaved(newText: string) {
    return this.$emit('onChanged', 'yAxis[0].postfix.text', newText);
  }

  protected get defaultMainAxisConfig(): Map<SettingKey, boolean | string | number> {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('yAxis[0].visible', this.defaultSetting.visible);
    settingAsMap.set('yAxis[0].labels.style.fontFamily', this.defaultSetting.categoryFont);
    settingAsMap.set('yAxis[0].labels.style.fontSize', this.defaultSetting.categoryFontSize);
    settingAsMap.set('yAxis[0].labels.style.color', this.defaultSetting.categoryColor);
    settingAsMap.set('yAxis[0].title.enabled', this.defaultSetting.titleEnabled);
    settingAsMap.set('yAxis[0].title.text', this.getDefaultText());
    settingAsMap.set('yAxis[0].title.style.fontFamily', this.defaultSetting.titleFont);
    settingAsMap.set('yAxis[0].title.style.fontSize', this.defaultSetting.titleFontSize);
    settingAsMap.set('yAxis[0].title.style.color', this.defaultSetting.titleColor);
    settingAsMap.set('yAxis[0].gridLineWidth', this.defaultSetting.gridLineWidth);
    settingAsMap.set('yAxis[0].gridLineColor', this.defaultSetting.gridLineColor);
    settingAsMap.set('yAxis[0].gridLineDashStyle', this.defaultSetting.gridLineDashStyle);
    settingAsMap.set('yAxis[0].labels.format', this.defaultSetting.format);
    settingAsMap.set('yAxis[0].condition.enabled', false);
    settingAsMap.set('yAxis[0].condition.min.enabled', false);
    settingAsMap.set('yAxis[0].condition.max.enabled', false);
    settingAsMap.set('yAxis[0].condition.min.value', this.defaultSetting.min);
    settingAsMap.set('yAxis[0].condition.max.value', this.defaultSetting.max);
    settingAsMap.set('yAxis[0].prefix.text', this.defaultSetting.prefixText);
    settingAsMap.set('yAxis[0].postfix.text', this.defaultSetting.postfixText);
    return settingAsMap;
  }

  protected get format(): string {
    return get(this.setting, '[0].labels.format', this.defaultSetting.format);
  }
}
</script>
