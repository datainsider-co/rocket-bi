<template>
  <PanelHeader :header="tabTitle" target-id="dual-y-axis-tab">
    <div class="dual-y-axis-tab">
      <ToggleSetting id="dual-y-axis-enable" :value="enableDualAxis" class="mb-3 group-config" label="On" @onChanged="handleDualAxisChanged" />
      <div :style="axisSettingStyle">
        <!--      Prefix setting-->
        <!--      Postfix setting-->
        <div class="row-config-container">
          <InputSetting
            id="dual-y-axis-prefix-input"
            :value="prefixText"
            class="mr-2"
            label="Prefix"
            placeholder="Input Prefix"
            size="half"
            :maxLength="defaultSetting.prefixMaxLength"
            @onChanged="handlePrefixSaved"
          />
          <InputSetting
            id="dual-y-axis-postfix-input"
            :value="postfixText"
            label="Postfix"
            placeholder="Input Postfix"
            size="half"
            @onChanged="handlePostfixSaved"
            :maxLength="defaultSetting.suffixMaxLength"
          />
        </div>
        <DropdownSetting
          id="dual-y-axis-category-font-family"
          :options="fontOptions"
          :value="categoryFont"
          class="mb-2"
          label="Font family"
          size="full"
          @onChanged="handleCategoryFontChanged"
        />
        <div class="row-config-container">
          <ColorSetting
            id="dual-y-axis-category-font-color"
            :default-color="defaultSetting.categoryColor"
            :value="categoryColor"
            class="mr-2"
            size="small"
            @onChanged="handleCategoryColorChanged"
          />
          <DropdownSetting
            id="dual-y-axis-category-font-size"
            :options="fontSizeOptions"
            :value="categoryFontSize"
            size="small"
            @onChanged="handleCategoryFontSizeChanged"
          />
        </div>
        <!--      <InputSetting-->
        <!--        id="dual-y-axis-format-input"-->
        <!--        placeholder="Input format Title"-->
        <!--        :disable="!enabled"-->
        <!--        :value="format"-->
        <!--        class="mb-3"-->
        <!--        size="full"-->
        <!--        @onChanged="handleFormatSaved"-->
        <!--      />-->
        <ToggleSetting id="dual-y-axis-title-enable" :value="titleEnabled" class="mb-3 group-config" label="Axis title" @onChanged="handleTitleEnabled" />
        <InputSetting
          id="dual-y-axis-title-input"
          placeholder="Input Dual Y Axis Title"
          :disable="!enabled"
          :value="title"
          class="mb-3"
          size="full"
          @onChanged="handleTitleSaved"
        />
        <DropdownSetting
          id="dual-y-axis-title-font-family"
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
            id="dual-y-axis-title-font-color"
            :default-color="defaultSetting.titleColor"
            :value="titleColor"
            class="mr-2"
            size="small"
            @onChanged="handleTitleColorChanged"
          />
          <DropdownSetting
            id="dual-y-axis-title-font-size"
            :options="fontSizeOptions"
            :value="titleFontSize"
            size="small"
            @onChanged="handleTitleFontSizeChanged"
          />
        </div>
        <ToggleSetting id="dual-y-axis-grid-enable" :value="gridEnabled" class="mb-3 group-config" label="Gridlines" @onChanged="handleGridEnabled" />
        <div :style="gridLineChildrenSettingStyle" class="row-config-container">
          <ColorSetting
            id="dual-y-axis-grid-line-color"
            :default-color="defaultSetting.gridLineColor"
            :value="gridLineColor"
            class="mr-2"
            size="half"
            @onChanged="handleGridColorChanged"
          />
          <InputSetting id="dual-y-axis-grid-line-width" :value="gridLineWidth" size="small" type="number" @onChanged="handleGridLineWidthChanged" />
        </div>
        <DropdownSetting
          id="dual-y-axis-grid-line-dash-style"
          :options="dashOptions"
          :style="gridLineChildrenSettingStyle"
          :value="gridLineDashStyle"
          size="full"
          @onChanged="handleGridLineDashStyleChanged"
        />
        <div v-if="seriesOptions.length > 1" class="row-config-container align-items-end">
          <DropdownSetting
            id="dual-axis-legend"
            :disable="!enableDualAxis"
            :options="seriesOptions"
            :value="selectedLegend"
            class="mr-2"
            size="half"
            @onSelected="handleSelectedLegend"
          />
          <ToggleSetting id="use-dual-axis" :disable="!enableDualAxis" :value="useDualAxis" label="Second Axis" @onChanged="handleUseDualAxis" />
        </div>
        <!-- Config Min Max For Dual YAxis -->
        <ToggleSetting
          id="config-min-max-for-dual-y-axis"
          :value="enableMinMaxCondition"
          class="mb-2 group-config"
          label="Config Min Max For Dual Y-Axis"
          :disable="!enableDualAxis"
          @onChanged="handleConditionChanged"
        />
        <div :style="minMaxConditionStyle" class="row-config-container">
          <div>
            <ToggleSetting
              id="dual-y-axis-min-condition"
              :disable="!enableMinMaxCondition"
              :value="enableMinCondition"
              class="group-config mb-1"
              label="Min"
              @onChanged="handleMinConditionChanged"
            />
            <InputSetting
              applyFormatNumber
              :style="minConditionStyle"
              id="input-dual-y-axis-min-condition"
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
              id="dual-y-axis-max-condition"
              :disable="!enableMinMaxCondition"
              :value="enableMaxCondition"
              class="group-config mb-1"
              label="Max"
              @onChanged="handleMaxConditionChanged"
            />
            <InputSetting
              applyFormatNumber
              :style="maxConditionStyle"
              id="input-dual-y-axis-max-condition"
              type="number"
              label="Max Value"
              size="md"
              :value="maxYAxis"
              @onChanged="handleMaxValueChanged"
            ></InputSetting>
          </div>
        </div>
      </div>
      <RevertButton class="mb-3 pr-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import {
  AxisSetting,
  ChartOption,
  HeatMapQuerySetting,
  PlotOptions,
  QuerySetting,
  QuerySettingType,
  SeriesQuerySetting,
  SettingKey
} from '@core/common/domain';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { FontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';
import { DashOptions } from '@/shared/settings/common/options/DashOptions';
import { enableCss } from '@/shared/settings/common/install';
import { ChartType, SelectOption } from '@/shared';
import { get } from 'lodash';
import { Log } from '@core/utils';

@Component({ components: { PanelHeader } })
export default class SeriesDualYAxisTab extends Vue {
  @Prop({ required: false, type: Array })
  private readonly setting!: AxisSetting[];
  @Prop({ required: false, type: Object })
  private readonly plotOptions!: PlotOptions;
  @Prop({ required: false, type: Object })
  private readonly query!: QuerySetting;
  @Prop({ required: false, type: Array })
  private readonly seriesOptions?: SelectOption[];
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
    gridLineWidth: '0.5',
    dualTitle: 'Untitled',
    format: '{value}',
    min: '0',
    max: '10000',
    prefixText: '',
    postfixText: ''
  };
  private selectedLegend = '';

  @Watch('seriesOptions', { immediate: true })
  onResponseChanged() {
    this.selectedLegend = get(this.seriesOptions, '[1].id', '');
  }

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

  private get prefixText(): string {
    return this.setting[1]?.prefix?.text ?? this.defaultSetting.prefixText;
  }

  private get postfixText(): string {
    return this.setting[1]?.postfix?.text ?? this.defaultSetting.postfixText;
  }

  private get tabTitle(): string {
    return 'Dual Y Axis';
  }

  private get enabled(): boolean {
    return get(this.setting, '[1].visible', this.defaultSetting.visible);
  }

  private get categoryFont(): string {
    Log.debug('get::categoryFont', this.setting);
    return get(this.setting, '[1].labels.style.fontFamily', this.defaultSetting.categoryFont);
  }

  private get categoryColor(): string {
    return get(this.setting, '[1].labels.style.color', this.defaultSetting.categoryColor);
  }

  private get categoryFontSize(): string {
    return get(this.setting, '[1].labels.style.fontSize', this.defaultSetting.categoryFontSize);
  }

  private get titleEnabled(): boolean {
    return get(this.setting, '[1].title.enabled', this.defaultSetting.titleEnabled);
  }

  private get titleFont(): string {
    return get(this.setting, '[].title.style.fontFamily', this.defaultSetting.titleFont);
  }

  private get titleColor(): string {
    return get(this.setting, '[1].title.style.color', this.defaultSetting.titleColor);
  }

  private get titleFontSize(): string {
    return get(this.setting, '[1].title.style.fontSize', this.defaultSetting.titleFontSize);
  }

  private get fontOptions() {
    return FontFamilyOptions;
  }

  private get fontSizeOptions() {
    return FontSizeOptions;
  }

  private get title(): string {
    return get(this.setting, '[1].title.text', this.defaultSetting.title);
  }

  private get dualTitle(): string {
    return get(this.setting, '[1].title.text', this.defaultSetting.dualTitle);
  }

  private get gridLineColor(): string {
    return get(this.setting, '[1].gridLineColor', this.defaultSetting.gridLineColor);
  }

  private get gridLineWidth(): string {
    return get(this.setting, '[1].gridLineWidth', this.defaultSetting.gridLineWidth);
  }

  private get maxYAxis(): string {
    return get(this.setting, '[1].condition.max.value', this.defaultSetting.max);
  }

  private get minYAxis(): string {
    return get(this.setting, '[1].condition.min.value', this.defaultSetting.min);
  }

  private get gridLineDashStyle(): string {
    return get(this.setting, '[1].gridLineDashStyle', this.defaultSetting.gridLineDashStyle);
  }

  private get dashOptions() {
    return DashOptions;
  }

  private get gridEnabled(): boolean {
    return get(this.setting, '[1].gridLineWidth', 0) !== 0;
  }

  private get gridLineChildrenSettingStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.gridEnabled && this.enabled),
      marginBottom: '16px'
    } as CSSStyleDeclaration;
  }

  private get minMaxConditionStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enableMinMaxCondition)
    } as CSSStyleDeclaration;
  }

  private get minConditionStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enableMinCondition)
    } as CSSStyleDeclaration;
  }

  private get maxConditionStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enableMaxCondition)
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

  private get enableDualAxis(): boolean {
    return get(this.setting, '[1].visible', false);
  }

  private get enableMinMaxCondition(): boolean {
    return this.setting[1]?.condition?.enabled ?? false;
  }

  private get enableMaxCondition(): boolean {
    return get(this.setting, '[1].condition.max.enabled', false);
  }

  private get enableMinCondition(): boolean {
    return get(this.setting, '[1].condition.min.enabled', false);
  }

  private get useDualAxis(): boolean {
    const axis = get(this.plotOptions, `series.response.${this.selectedLegend}.yAxis`, 0);
    return axis != 0;
  }

  created() {
    if (!this.setting) {
      this.handleRevert();
    }
  }

  private handleGridEnabled(enabled: boolean) {
    if (enabled) {
      return this.$emit('onChanged', 'yAxis[1].gridLineWidth', '0.5');
    } else {
      return this.$emit('onChanged', 'yAxis[1].gridLineWidth', '0');
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
  private handleFormatSaved(newText: string) {
    return this.$emit('onChanged', 'yAxis[1].labels.format', newText);
  }

  private handleDualTitleSaved(newText: string) {
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
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map([...this.defaultDualAxisConfig]);
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

  private handleDualAxisChanged(enable: boolean) {
    this.$emit('onChanged', 'yAxis[1].visible', enable);
    if (enable) {
      this.handleUseDualAxis(true);
    } else {
      this.clearDualAxisInResponseSetting();
      this.handleConditionChanged(false);
    }
  }

  private handleConditionChanged(enable: boolean) {
    this.$emit('onChanged', 'yAxis[1].condition.enabled', enable);
  }

  private handleMinConditionChanged(enable: boolean) {
    this.$emit('onChanged', 'yAxis[1].condition.min.enabled', enable);
    if (enable) {
      this.handleMinValueChanged(this.minYAxis);
    }
  }

  private handleMaxConditionChanged(enable: boolean) {
    this.$emit('onChanged', 'yAxis[1].condition.max.enabled', enable);
    if (enable) {
      this.handleMaxValueChanged(this.maxYAxis);
    }
  }

  private handleMinValueChanged(value: string) {
    this.$emit('onChanged', 'yAxis[1].condition.min.value', +value);
  }

  private handleMaxValueChanged(value: string) {
    this.$emit('onChanged', 'yAxis[1].condition.max.value', +value);
  }

  private get defaultDualAxisConfig(): Map<SettingKey, boolean | string | number> {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('yAxis[1].visible', false);
    settingAsMap.set('yAxis[1].labels.style.fontFamily', this.defaultSetting.categoryFont);
    settingAsMap.set('yAxis[1].labels.style.fontSize', this.defaultSetting.categoryFontSize);
    settingAsMap.set('yAxis[1].labels.style.color', this.defaultSetting.categoryColor);
    settingAsMap.set('yAxis[1].title.enabled', this.defaultSetting.titleEnabled);
    settingAsMap.set('yAxis[1].title.text', this.defaultSetting.dualTitle);
    settingAsMap.set('yAxis[1].title.style.fontFamily', this.defaultSetting.titleFont);
    settingAsMap.set('yAxis[1].title.style.fontSize', this.defaultSetting.titleFontSize);
    settingAsMap.set('yAxis[1].title.style.color', this.defaultSetting.titleColor);
    settingAsMap.set('yAxis[1].gridLineWidth', this.defaultSetting.gridLineWidth);
    settingAsMap.set('yAxis[1].gridLineColor', this.defaultSetting.gridLineColor);
    settingAsMap.set('yAxis[1].gridLineDashStyle', this.defaultSetting.gridLineDashStyle);
    settingAsMap.set('yAxis[1].opposite', true);
    settingAsMap.set('yAxis[1].id', 'dual-axis');
    settingAsMap.set('yAxis[1].labels.format', this.defaultSetting.format);
    settingAsMap.set('yAxis[1].condition.enabled', false);
    settingAsMap.set('yAxis[1].condition.min.value', this.defaultSetting.min);
    settingAsMap.set('yAxis[1].condition.min.enabled', false);
    settingAsMap.set('yAxis[1].condition.max.value', this.defaultSetting.max);
    settingAsMap.set('yAxis[1].condition.max.enabled', false);
    settingAsMap.set('yAxis[1].postfix.text', this.defaultSetting.postfixText);
    settingAsMap.set('yAxis[1].prefix.text', this.defaultSetting.prefixText);
    return settingAsMap;
  }

  private handleSelectedLegend(newLegend: SelectOption) {
    this.selectedLegend = newLegend.id.toString();
  }

  private handleUseDualAxis(enable: boolean) {
    return this.$emit('onChanged', `plotOptions.series.response.${this.selectedLegend}.yAxis`, +enable);
  }
  private clearDualAxisInResponseSetting() {
    const legendSettingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    this.seriesOptions?.forEach(legend => {
      legendSettingAsMap.set(`plotOptions.series.response.${legend.id}.yAxis`, 0);
    });
    this.$emit('onMultipleChanged', legendSettingAsMap);
  }

  private get format(): string {
    return get(this.setting, '[1].labels.format', this.defaultSetting.format);
  }

  private handlePrefixSaved(newText: string) {
    return this.$emit('onChanged', 'yAxis[1].prefix.text', newText);
  }

  private handlePostfixSaved(newText: string) {
    return this.$emit('onChanged', 'yAxis[1].postfix.text', newText);
  }
}
</script>

<style lang="scss" scoped />
