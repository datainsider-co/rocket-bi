<template>
  <PanelHeader header="Other" target-id="visual-header-tab">
    <!--    <div class="row-config-container">-->
    <!--      <ColorSetting-->
    <!--        disable-->
    <!--        id="visual-header-background-color"-->
    <!--        :default-color="defaultSetting.background"-->
    <!--        :value="background"-->
    <!--        label="Background color"-->
    <!--        size="small"-->
    <!--        style="margin-right: 12px"-->
    <!--        @onChanged="handleBackgroundChanged"-->
    <!--      />-->
    <!--      <ColorSetting-->
    <!--        disable-->
    <!--        id="visual-header-icon-color"-->
    <!--        :default-color="defaultSetting.iconColor"-->
    <!--        :value="iconColor"-->
    <!--        label="Icon color"-->
    <!--        size="small"-->
    <!--        @onChanged="handleIconColorChanged"-->
    <!--      />-->
    <!--    </div>-->
    <div class="row-config-container">
      <DropdownSetting
        v-if="enableDisplayUnit"
        id="data-label-display-unit"
        :options="displayUnitOptions"
        :value="displayUnit"
        class="mr-2"
        :label="`${configSetting['dataLabels.displayUnit'].label}`"
        :hint="`${configSetting['dataLabels.displayUnit'].hint}`"
        size="half"
        @onChanged="handleDisplayUnitChanged"
      />
      <DropdownSetting
        v-if="enablePrecision"
        id="precision-setting"
        :options="precisionOptions"
        :value="precision"
        :label="`${configSetting['precision'].label}`"
        :hint="`${configSetting['precision'].hint}`"
        size="small"
        @onChanged="handlePrecisionChanged"
      />
    </div>
    <div class="row-config-container">
      <DropdownSetting
        id="decimal-point-setting"
        style="margin-right: 12px;"
        :options="decimalPointOptions"
        :value="decimalPoint"
        :label="`${configSetting['decimalPoint'].label}`"
        :hint="`${configSetting['decimalPoint'].hint}`"
        size="half"
        @onChanged="handleDecimalPointChanged"
      />
      <DropdownSetting
        v-if="enableThousandSepSetting"
        id="thousand-sep-setting"
        :options="thousandSeparatorOptions"
        :value="thousandSep"
        :hint="`${configSetting['thousandSep'].hint}`"
        :label="`${configSetting['thousandSep'].label}`"
        size="half"
        @onChanged="handleThousandSepChanged"
      />
    </div>
    <ToggleSetting
      id="header-filter-enable"
      :value="enableFilter"
      class="mb-3"
      :label="`${configSetting['affectedByFilter'].label}`"
      :hint="`${configSetting['affectedByFilter'].hint}`"
      @onChanged="handleEnableFilterChanged"
    />
    <ToggleSetting
      v-if="showEnableCrossFilter"
      id="cross-filter-enable"
      :value="enableCrossFilter"
      class="mb-3"
      :label="`${configSetting['isCrossFilter'].label}`"
      :hint="`${configSetting['isCrossFilter'].hint}`"
      @onChanged="handleEnableCrossFilterChanged"
    />
    <ToggleSetting
      v-if="enableSettingDrilldown"
      id="header-drilldown-enable"
      :value="enableDrilldown"
      class="mb-2"
      :label="`${configSetting['isEnableDrilldown'].label}`"
      :hint="`${configSetting['isEnableDrilldown'].hint}`"
      @onChanged="handleEnableDrilldownChanged"
    />
    <ToggleSetting
      v-if="enableSettingZoom"
      id="header-zoom-enable"
      :value="enableZoom"
      class="mb-2"
      :label="`${configSetting['isEnableZoom'].label}`"
      :hint="`${configSetting['isEnableZoom'].hint}`"
      @onChanged="handleEnableZoomChanged"
    />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartOptionData } from '@core/common/domain';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { VisualHeaderConfigs } from '@/shared/settings/common/config';
import { ChartType, SelectOption } from '@/shared';
import { DisplayUnitOptions } from '@/shared/settings/common/options/DisplayUnitOptions';
import { get } from 'lodash';
import { MetricNumberMode } from '@/utils';
import { PrecisionOptions } from '@/shared/settings/common/options/PrecisionOptions';
import { ThousandSeparator, ThousandSeparatorOptions } from '@/shared/settings/common/options/ThousandSeparatorOptions';
import { NumberFormatType } from '@core/common/services';
import { DecimalPointOptions } from '@/shared/settings/common/options/DecimalPointOptions';
import { Log } from '@core/utils';

@Component({ components: { PanelHeader } })
export default class VisualHeader extends Vue {
  private readonly configSetting = window.chartSetting['other.tab'];
  private readonly defaultSetting = {
    iconColor: '#ffffff',
    background: '#333645',
    enableFilter: true,
    isCrossFilter: false,
    enableDrilldown: false,
    enableMore: false,
    precision: 2,
    thousandSep: ',',
    decimalPoint: '.',
    numberFormatType: NumberFormatType.US
  };

  @Prop({ required: false, type: Object })
  private readonly setting!: ChartOptionData;

  @Prop({ required: false, type: String })
  private readonly widgetType?: ChartType;

  private get background() {
    return this.setting?.visualHeader?.background ?? this.defaultSetting.background;
  }

  private get precision() {
    return this.setting?.precision ?? this.defaultSetting.precision;
  }

  private get decimalPoint() {
    return this.setting?.decimalPoint ?? this.defaultSetting.decimalPoint;
  }

  private get thousandSep() {
    const thousandSep: string = this.setting?.thousandSep ?? this.defaultSetting.thousandSep;
    switch (thousandSep) {
      case ',':
        return ThousandSeparator.Comma;
      case '.':
        return ThousandSeparator.Dot;
      case ' ':
        return ThousandSeparator.Space;
      default:
        return ThousandSeparator.None;
    }
  }

  private get precisionOptions() {
    return PrecisionOptions;
  }

  private get thousandSeparatorOptions() {
    return ThousandSeparatorOptions;
  }

  private get decimalPointOptions() {
    return DecimalPointOptions;
  }

  private get showEnableCrossFilter(): boolean {
    return this.widgetType === ChartType.Pie || this.widgetType === ChartType.Map;
  }

  private get iconColor() {
    return this.setting?.visualHeader?.iconColor ?? this.defaultSetting.iconColor;
  }

  private get enableFilter() {
    return this.setting?.affectedByFilter ?? this.defaultSetting.enableFilter;
  }

  private get enableDrilldown() {
    return this.setting?.isEnableDrilldown ?? this.defaultSetting.enableDrilldown;
  }

  private get enableCrossFilter() {
    return this.setting?.isCrossFilter ?? this.defaultSetting.isCrossFilter;
  }

  private get enableZoom() {
    return this.setting?.isEnableZoom ?? this.defaultSetting.enableMore;
  }

  private get enableSettingDrilldown() {
    if (this.widgetType) {
      return VisualHeaderConfigs.drilldownWidgets.has(this.widgetType);
    } else {
      return false;
    }
  }

  private get enableSettingZoom() {
    if (this.widgetType) {
      return VisualHeaderConfigs.zoomWidgets.has(this.widgetType);
    } else {
      return false;
    }
  }

  private get displayUnitOptions(): SelectOption[] {
    return DisplayUnitOptions;
  }

  private get defaultDisplayUnit() {
    switch (this.widgetType) {
      case ChartType.Table:
      case ChartType.FlattenTable:
      case ChartType.PivotTable:
      case ChartType.FlattenPivotTable:
        return MetricNumberMode.None;
      default:
        return MetricNumberMode.Default;
    }
  }

  private get displayUnit(): string {
    return get(this.setting, `plotOptions.${this.seriesKey}.dataLabels.displayUnit`, this.defaultDisplayUnit);
  }

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
      case ChartType.Table:
      case ChartType.FlattenTable:
      case ChartType.PivotTable:
      case ChartType.FlattenPivotTable:
        return 'table';
      case ChartType.Kpi:
        return 'kpi';
      default:
        return 'series';
    }
  }

  private get enableDisplayUnit() {
    if (this.widgetType) {
      switch (this.widgetType) {
        // case ChartType.Table:
        // case ChartType.FlattenTable:
        // case ChartType.PivotTable:
        // case ChartType.FlattenPivotTable:
        // case ChartType.Kpi:
        case ChartType.Parliament:
        case ChartType.InputControl:
        case ChartType.InputFilter:
        case ChartType.SingleChoiceMeasurement:
        case ChartType.SingleChoice:
        case ChartType.SingleChoiceFilter:
        case ChartType.MultiChoice:
        case ChartType.MultiChoiceMeasurement:
        case ChartType.MultiChoiceFilter:
        case ChartType.DropDownMeasurement:
        case ChartType.DropDown:
        case ChartType.DropDownFilter:
        case ChartType.TabMeasurement:
        case ChartType.TabFilter:
        case ChartType.TabInnerFilter:
        case ChartType.DateSelectFilter:
        case ChartType.SlicerFilter:
          return false;
        default:
          return true;
      }
    }
    return false;
  }

  private get enablePrecision() {
    if (this.widgetType) {
      switch (this.widgetType) {
        // case ChartType.Table:
        // case ChartType.FlattenTable:
        // case ChartType.PivotTable:
        // case ChartType.FlattenPivotTable:
        case ChartType.Parliament:
        case ChartType.InputControl:
        case ChartType.InputFilter:
        case ChartType.SingleChoiceMeasurement:
        case ChartType.SingleChoice:
        case ChartType.SingleChoiceFilter:
        case ChartType.MultiChoice:
        case ChartType.MultiChoiceMeasurement:
        case ChartType.MultiChoiceFilter:
        case ChartType.DropDownMeasurement:
        case ChartType.DropDown:
        case ChartType.DropDownFilter:
        case ChartType.TabMeasurement:
        case ChartType.TabFilter:
        case ChartType.TabInnerFilter:
        case ChartType.DateSelectFilter:
        case ChartType.SlicerFilter:
          return false;
        default:
          return true;
      }
    }
    return false;
  }

  private get enableThousandSepSetting() {
    switch (this.widgetType) {
      case ChartType.Parliament:
        return false;
      default:
        return true;
    }
  }

  private handleEnableFilterChanged(enable: string) {
    this.$emit('onChanged', 'affectedByFilter', enable);
  }

  private handleEnableCrossFilterChanged(enable: string) {
    this.$emit('onChanged', 'isCrossFilter', enable);
  }

  private handleEnableDrilldownChanged(enable: string) {
    this.$emit('onChanged', 'isEnableDrilldown', enable);
  }

  private handleEnableZoomChanged(enable: string) {
    this.$emit('onChanged', 'isEnableZoom', enable);
  }

  private handleDisplayUnitChanged(newDisplayUnit: string) {
    return this.$emit('onChanged', `plotOptions.${this.seriesKey}.dataLabels.displayUnit`, newDisplayUnit);
  }

  private handlePrecisionChanged(newPrecision: number) {
    return this.$emit('onChanged', 'precision', newPrecision);
  }

  private handleDecimalPointChanged(decimalPoint: number) {
    return this.$emit('onChanged', 'decimalPoint', decimalPoint);
  }

  private handleThousandSepChanged(thousandSep: ThousandSeparator) {
    let sep = '';
    switch (thousandSep) {
      case ThousandSeparator.Comma:
        sep = ',';
        break;
      case ThousandSeparator.Dot:
        sep = '.';
        break;
      case ThousandSeparator.None:
        sep = '';
        break;
      case ThousandSeparator.Space:
        sep = ' ';
        break;
    }
    return this.$emit('onChanged', 'thousandSep', sep);
  }
}
</script>

<style lang="scss" src="../TabStyle.scss"></style>
