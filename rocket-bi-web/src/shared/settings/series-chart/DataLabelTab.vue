<template>
  <PanelHeader header="Data Label" target-id="data-label-tab">
    <div class="data-label-tab">
      <ToggleSetting
        id="data-label-enable"
        :value="enabled"
        class="mb-3 group-config"
        :label="`${configSetting['dataLabel.enable'].label}`"
        :hint="`${configSetting['dataLabel.enable'].hint}`"
        @onChanged="handleDataLabelEnabled"
      />
      <DropdownSetting
        v-if="haveLabelFormatSetting"
        id="data-label-format"
        :options="labelFormatOptions"
        :value="labelFormat"
        class="mb-2"
        :label="`${configSetting['dataLabel.style'].label}`"
        :hint="`${configSetting['dataLabel.style'].hint}`"
        size="full"
        :style="labelSettingStyle"
        @onChanged="handleLabelFormatChanged"
      />
      <DropdownSetting
        id="data-label-font-family"
        :options="fontOptions"
        :value="font"
        class="mb-2"
        :label="`${configSetting['dataLabel.fontFamily'].label}`"
        :hint="`${configSetting['dataLabel.fontFamily'].hint}`"
        size="full"
        :style="labelSettingStyle"
        @onChanged="handleFontChanged"
      />
      <div class="row-config-container" :style="labelSettingStyle">
        <ColorSetting
          id="data-label-font-color"
          :default-color="defaultSetting.color"
          :value="color"
          class="mr-2"
          size="small"
          :label="`${configSetting['dataLabel.color'].label}`"
          :hint="`${configSetting['dataLabel.color'].hint}`"
          @onChanged="handleColorChanged"
        />
        <DropdownSetting
          id="data-label-font-size"
          :options="fontSizeOptions"
          :value="fontSize"
          :label="`${configSetting['dataLabel.fontSize'].label}`"
          :hint="`${configSetting['dataLabel.fontSize'].hint}`"
          size="small"
          @onChanged="handleFontSizeChanged"
        />
      </div>
      <!--      <DropdownSetting-->
      <!--        id="data-label-display-unit"-->
      <!--        :options="displayUnitOptions"-->
      <!--        :value="displayUnit"-->
      <!--        class="mb-2"-->
      <!--        label="Display unit"-->
      <!--        size="full"-->
      <!--        :style="labelSettingStyle"-->
      <!--        @onChanged="handleDisplayUnitChanged"-->
      <!--      />-->
      <SliderSetting
        v-if="haveDistanceSetting"
        ref="distanceSetting"
        id="data-label-distance"
        class="mb-2 group-config"
        :min="-100"
        :max="60"
        :value="distance"
        :label="`${configSetting['dataLabel.distance'].label}`"
        :hint="`${configSetting['dataLabel.distance'].hint}`"
        :style="labelSettingStyle"
        @onChanged="handleDistanceChanged"
      />
      <DropdownSetting
        v-if="havePositionSetting"
        id="data-label-position"
        :value="position"
        :options="positionOptions"
        class="mb-3"
        size="full"
        :label="`${configSetting['dataLabel.position'].label}`"
        :hint="`${configSetting['dataLabel.position'].hint}`"
        :style="labelSettingStyle"
        @onChanged="handlePositionChanged"
      />
      <div v-if="enableConditionSetting" :style="labelSettingStyle">
        <ToggleSetting
          id="condition-enable"
          :value="conditionEnabled"
          class="mb-2 group-config"
          :label="`${configSetting['dataLabel.condition.enabled'].label}`"
          :hint="`${configSetting['dataLabel.condition.enabled'].hint}`"
          @onChanged="handleConditionEnabled"
        />
        <div class="row-config-container">
          <div>
            <ToggleSetting
              id="min-enable"
              :value="enableMinCondition"
              :disable="!conditionEnabled"
              class="mb-1"
              :label="`${configSetting['dataLabel.condition.min.enabled'].label}`"
              :hint="`${configSetting['dataLabel.condition.min.enabled'].hint}`"
              @onChanged="handleEnabledMin"
            />
            <DropdownSetting
              id="min-equal-setting"
              class="mr-2 mb-1"
              :disable="!enableMinCondition || !conditionEnabled"
              :options="minOptions"
              :value="isEqualMin"
              :label="`${configSetting['dataLabel.condition.min.equal'].label}`"
              :hint="`${configSetting['dataLabel.condition.min.equal'].hint}`"
              size="half"
              @onChanged="handleMinEqualChanged"
            />
            <InputSetting
              id="min-condition-input"
              :value="minCondition"
              applyFormatNumber
              class="mr-2"
              :disable="!enableMinCondition || !conditionEnabled"
              :label="`${configSetting['dataLabel.condition.min.value'].label}`"
              :hint="`${configSetting['dataLabel.condition.min.value'].hint}`"
              :placeholder="`${configSetting['dataLabel.condition.min.value'].hint}`"
              size="half"
              type="number"
              @onChanged="handleMinConditionChanged"
            />
          </div>
          <div>
            <ToggleSetting
              id="max-enable"
              :value="enableMaxCondition"
              :disable="!conditionEnabled"
              class="mb-1"
              :label="`${configSetting['dataLabel.condition.max.enabled'].label}`"
              :hint="`${configSetting['dataLabel.condition.max.enabled'].hint}`"
              @onChanged="handleEnableMax"
            />
            <DropdownSetting
              id="max-equal-setting"
              class="mb-1"
              :disable="!enableMaxCondition || !conditionEnabled"
              :options="maxOptions"
              :value="isEqualMax"
              :label="`${configSetting['dataLabel.condition.max.equal'].label}`"
              :hint="`${configSetting['dataLabel.condition.max.equal'].hint}`"
              size="half"
              @onChanged="handleMaxEqualChanged"
            />
            <InputSetting
              id="max-condition-input"
              :value="maxCondition"
              :disable="!enableMaxCondition || !conditionEnabled"
              applyFormatNumber
              :label="`${configSetting['dataLabel.condition.max.value'].label}`"
              :hint="`${configSetting['dataLabel.condition.max.value'].hint}`"
              :placeholder="`${configSetting['dataLabel.condition.max.value'].hint}`"
              size="half"
              type="number"
              @onChanged="handleMaxConditionChanged"
            />
          </div>
        </div>
      </div>
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { HeadComparisonOptions, TailComparisonOptions } from '@/shared/settings/common/options/ComparisonOptions';
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { PlotOptions } from '@core/common/domain/model/chart-option/extra-setting/chart-style/PlotOptions';
import { ChartType, SelectOption } from '@/shared';
import { DisplayUnitOptions } from '@/shared/settings/common/options/DisplayUnitOptions';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { FontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';
import { LabelFormatOptions } from '@/shared/settings/common/options/LabelFormatOptions';
import { DataLabelFormatterMode } from '@chart/PieChart';
import { get, isNumber, toNumber } from 'lodash';
import { MetricNumberMode } from '@/utils';
import SliderSetting from '@/shared/settings/common/SliderSetting.vue';
import { LabelPositionOptions } from '@/shared/settings/common/options/LabelPositionOptions';
import { enableCss } from '@/shared/settings/common/install';
import { ChartOption, SettingKey } from '@core/common/domain';

@Component({ components: { SliderSetting, PanelHeader } })
export default class DataLabelTab extends Vue {
  private readonly configSetting = window.chartSetting['dataLabel.tab'];

  private readonly minOptions = HeadComparisonOptions;
  private readonly maxOptions = TailComparisonOptions;

  @Ref()
  private readonly distanceSetting?: SliderSetting;

  @Prop({ required: false, type: Object })
  private readonly setting!: PlotOptions;
  @Prop({ required: false, type: String })
  private readonly widgetType!: ChartType;
  private readonly defaultSetting = {
    enabled: false,
    labelFormat: DataLabelFormatterMode.NameAndValue,
    fontFamily: 'Roboto',
    color: ChartOption.getThemeTextColor(),
    fontSize: '12px',
    displayUnit: MetricNumberMode.Default,
    distance: 30,
    position: false,
    condition: {
      enabled: false,
      min: 0,
      max: 100
    }
  };

  private get seriesKey(): string {
    switch (this.widgetType) {
      case ChartType.Pie:
        return 'pie';
      case ChartType.Gauges:
        return 'solidgauge';
      case ChartType.TreeMap:
        return 'treemap';
      case ChartType.Pyramid:
        return 'pyramid';
      case ChartType.Funnel:
        return 'funnel';
      case ChartType.HeatMap:
        return 'heatmap';
      case ChartType.Parliament:
        return 'item';
      case ChartType.Sankey:
        return 'sankey';
      default:
        return 'series';
    }
  }

  private get haveLabelFormatSetting() {
    switch (this.widgetType) {
      case ChartType.Funnel:
      case ChartType.Pyramid:
      case ChartType.Pie:
        return true;
      default:
        return false;
    }
  }

  private get haveDistanceSetting() {
    return this.widgetType === ChartType.Pie;
  }

  private get havePositionSetting() {
    switch (this.widgetType) {
      case ChartType.Funnel:
      case ChartType.Pyramid:
        return true;
      default:
        return false;
    }
  }

  private get enabled(): boolean {
    return get(this.setting, `${this.seriesKey}.dataLabels.enabled`, this.defaultSetting.enabled);
  }

  private get labelFormat(): DataLabelFormatterMode {
    return get(this.setting, `${this.seriesKey}.dataLabels.labelFormat`, this.defaultSetting.labelFormat);
  }

  private get labelFormatOptions(): SelectOption[] {
    return LabelFormatOptions;
  }

  private get font(): string {
    return get(this.setting, `${this.seriesKey}.dataLabels.style.fontFamily`, this.defaultSetting.fontFamily);
  }

  private get color(): string {
    return get(this.setting, `${this.seriesKey}.dataLabels.style.color`, this.defaultSetting.color);
  }

  private get fontSize(): string {
    return get(this.setting, `${this.seriesKey}.dataLabels.style.fontSize`, this.defaultSetting.fontSize);
  }

  private get displayUnit(): string {
    return get(this.setting, `${this.seriesKey}.dataLabels.displayUnit`, this.defaultSetting.displayUnit);
  }

  private get distance(): string {
    return get(this.setting, `${this.seriesKey}.dataLabels.distance`, this.defaultSetting.distance);
  }

  private get position(): string {
    return get(this.setting, `${this.seriesKey}.dataLabels.inside`, this.defaultSetting.position);
  }

  private get displayUnitOptions(): SelectOption[] {
    return DisplayUnitOptions;
  }

  private get fontOptions(): SelectOption[] {
    return FontFamilyOptions;
  }

  private get fontSizeOptions(): SelectOption[] {
    return FontSizeOptions;
  }

  private get positionOptions(): SelectOption[] {
    return LabelPositionOptions;
  }

  private handleDataLabelEnabled(enabled: boolean) {
    return this.$emit('onChanged', `plotOptions.${this.seriesKey}.dataLabels.enabled`, enabled);
  }

  private handleLabelFormatChanged(newLabelFormat: DataLabelFormatterMode) {
    return this.$emit('onChanged', `plotOptions.${this.seriesKey}.dataLabels.labelFormat`, newLabelFormat);
  }

  private handleFontChanged(newFont: string) {
    return this.$emit('onChanged', `plotOptions.${this.seriesKey}.dataLabels.style.fontFamily`, newFont);
  }

  private handleColorChanged(newColor: string) {
    return this.$emit('onChanged', `plotOptions.${this.seriesKey}.dataLabels.style.color`, newColor);
  }

  private handleFontSizeChanged(newFontSize: string) {
    this.$emit('onChanged', `plotOptions.${this.seriesKey}.dataLabels.style.fontSize`, newFontSize);
  }

  private handleDisplayUnitChanged(newDisplayUnit: string) {
    return this.$emit('onChanged', `plotOptions.${this.seriesKey}.dataLabels.displayUnit`, newDisplayUnit);
  }

  private handleDistanceChanged(newDistance: number) {
    return this.$emit('onChanged', `plotOptions.${this.seriesKey}.dataLabels.distance`, newDistance);
  }

  private handlePositionChanged(newPosition: string) {
    return this.$emit('onChanged', `plotOptions.${this.seriesKey}.dataLabels.inside`, newPosition);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set(`plotOptions.${this.seriesKey}.dataLabels.enabled`, this.defaultSetting.enabled);
    settingAsMap.set(`plotOptions.${this.seriesKey}.dataLabels.style.fontSize`, this.defaultSetting.fontSize);
    settingAsMap.set(`plotOptions.${this.seriesKey}.dataLabels.style.color`, this.defaultSetting.color);
    settingAsMap.set(`plotOptions.${this.seriesKey}.dataLabels.style.fontFamily`, this.defaultSetting.fontFamily);
    settingAsMap.set(`plotOptions.${this.seriesKey}.dataLabels.displayUnit`, this.defaultSetting.displayUnit);
    if (this.haveLabelFormatSetting) {
      settingAsMap.set(`plotOptions.${this.seriesKey}.dataLabels.labelFormat`, this.defaultSetting.labelFormat);
    }
    if (this.havePositionSetting) {
      settingAsMap.set(`plotOptions.${this.seriesKey}.dataLabels.position`, this.defaultSetting.position);
    }
    if (this.haveDistanceSetting) {
      settingAsMap.set(`plotOptions.${this.seriesKey}.dataLabels.distance`, this.defaultSetting.distance);
      this.distanceSetting?.setDisplayInputValue(`${this.defaultSetting.distance}`);
    }
    if (this.enableConditionSetting) {
      settingAsMap.set('plotOptions.series.dataLabels.condition.enabled', this.defaultSetting.condition.enabled);
      settingAsMap.set('plotOptions.series.dataLabels.condition.min', this.defaultSetting.condition.min);
      settingAsMap.set('plotOptions.series.dataLabels.condition.max', this.defaultSetting.condition.max);
    }
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private get labelSettingStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enabled)
    } as CSSStyleDeclaration;
  }

  private get enableConditionSetting(): boolean {
    switch (this.widgetType) {
      case ChartType.Area:
      case ChartType.AreaSpline:
      case ChartType.Bar:
      case ChartType.Column:
      case ChartType.Line:
      case ChartType.StackedBar:
      case ChartType.StackedColumn:
        return true;
      default:
        return false;
    }
  }

  private get conditionEnabled(): boolean {
    return this.setting.series?.dataLabels?.condition?.enabled ?? this.defaultSetting.condition.enabled;
  }

  private handleConditionEnabled(enabled: boolean) {
    this.$emit('onChanged', 'plotOptions.series.dataLabels.condition.enabled', enabled);
    const hasMin = this.setting.series?.dataLabels?.condition?.min !== undefined;
    if (!hasMin) {
      this.$emit('onChanged', 'plotOptions.series.dataLabels.condition.min', this.defaultSetting.condition.min);
    }
    const hasMax = this.setting.series?.dataLabels?.condition?.max !== undefined;
    if (!hasMax) {
      this.$emit('onChanged', 'plotOptions.series.dataLabels.condition.max', this.defaultSetting.condition.max);
    }
  }

  private get minCondition(): string {
    return `${this.setting.series?.dataLabels?.condition?.min?.value ?? this.defaultSetting.condition.min}`;
  }

  private handleMinConditionChanged(min: string) {
    if (isNumber(min)) {
      this.$emit('onChanged', 'plotOptions.series.dataLabels.condition.min.value', toNumber(min));
    }
  }

  private get maxCondition(): string {
    return `${this.setting.series?.dataLabels?.condition?.max?.value ?? this.defaultSetting.condition.max}`;
  }

  private handleMaxConditionChanged(max: string) {
    if (isNumber(max)) {
      this.$emit('onChanged', 'plotOptions.series.dataLabels.condition.max.value', toNumber(max));
    }
  }

  private get enableMinCondition(): boolean {
    return this.setting.series?.dataLabels?.condition?.min?.enabled ?? false;
  }

  private get enableMaxCondition(): boolean {
    return this.setting.series?.dataLabels?.condition?.max?.enabled ?? false;
  }

  private handleEnabledMin(enabled: boolean) {
    this.$emit('onChanged', 'plotOptions.series.dataLabels.condition.min.enabled', enabled);
    if (enabled && !this.setting.series?.dataLabels?.condition?.min?.value) {
      this.handleMinConditionChanged('0');
    }
  }

  private handleEnableMax(enabled: boolean) {
    this.$emit('onChanged', 'plotOptions.series.dataLabels.condition.max.enabled', enabled);
    if (enabled && !this.setting.series?.dataLabels?.condition?.max?.value) {
      this.handleMinConditionChanged('10000');
    }
  }

  private get isEqualMin(): boolean {
    return this.setting.series?.dataLabels?.condition?.min?.equal ?? false;
  }

  private get isEqualMax(): boolean {
    return this.setting.series?.dataLabels?.condition?.max?.equal ?? false;
  }

  private handleMaxEqualChanged(item: SelectOption) {
    this.$emit('onChanged', 'plotOptions.series.dataLabels.condition.max.equal', item.id);
  }

  private handleMinEqualChanged(item: SelectOption) {
    this.$emit('onChanged', 'plotOptions.series.dataLabels.condition.min.equal', item.id);
  }
}
</script>

<style lang="scss" scoped></style>
