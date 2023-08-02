<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BinNumberTab :setting="setting.options" @onChangeAndQuery="handleSettingChangeAndQuery" />
    <LegendTab :setting="setting.options.legend" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <XAxisTab :query="query" :setting="setting.options.xAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <YAxisTab :query="query" :setting="setting.options.yAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ColorTab :setting="setting.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab :setting="setting.options.plotOptions" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TooltipTab :setting="setting.options.tooltip" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :widget-type="currentWidget" :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, HistogramQuerySetting, HistogramChartOption, SettingKey } from '@core/common/domain';

import LegendTab from '@/shared/settings/series-chart/LegendTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import XAxisTab from '@/shared/settings/common/tabs/XAxisTab.vue';
import YAxisTab from '@/shared/settings/common/tabs/YAxisTab.vue';
import ColorTab from '@/shared/settings/common/tabs/ColorTab.vue';
import { ChartType } from '@/shared';
import ShapeTab from '@/shared/settings/series-chart/ShapeTab.vue';
import DataLabelTab from '@/shared/settings/series-chart/DataLabelTab.vue';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import BinNumberTab from '@/shared/settings/histogram-setting/BinNumberTab.vue';
import { Log } from '@core/utils';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';

@Component({
  components: {
    TooltipTab,
    LegendTab,
    TitleTab,
    BackgroundTab,
    DataLabelTab,
    ShapeTab,
    ColorTab,
    VisualHeader,
    XAxisTab,
    YAxisTab,
    BinNumberTab
  }
})
export default class HistogramSetting extends Vue {
  @Prop()
  private readonly chartInfo!: ChartInfo;

  private get query(): HistogramQuerySetting {
    return this.chartInfo.setting as HistogramQuerySetting;
  }

  private get setting(): HistogramChartOption {
    return this.chartInfo.setting.getChartOption() as HistogramChartOption;
  }

  private get chartType(): ChartType {
    return _ConfigBuilderStore.chartType as ChartType;
  }

  private handleSettingChanged(key: string, value: boolean | string | number) {
    Log.debug('handleSettingChanged::', key, 'value::', value);
    this.setting.setOption(key, value);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo);
  }

  private handleMultipleSettingChanged(settingAsMap: Map<SettingKey, boolean | string | number>) {
    this.setting.setOptions(settingAsMap);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo);
  }

  private handleSettingChangeAndQuery(key: string, value: boolean | string | number) {
    Log.debug('handleSettingChanged::', key, 'value::', value);
    this.setting.setOption(key, value);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo, true);
  }

  private get currentWidget(): ChartType {
    return _ConfigBuilderStore.chartType;
  }
}
</script>
