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
import { ChartInfo, HistogramQuerySetting, HistogramChartOption, SettingKey } from '@core/domain';

import LegendTab from '@/shared/Settings/SeriesChart/LegendTab.vue';
import VisualHeader from '@/shared/Settings/Common/Tabs/VisualHeader.vue';
import BackgroundTab from '@/shared/Settings/Common/Tabs/BackgroundTab.vue';
import TitleTab from '@/shared/Settings/Common/Tabs/TitleTab.vue';
import XAxisTab from '@/shared/Settings/Common/Tabs/XAxisTab.vue';
import YAxisTab from '@/shared/Settings/Common/Tabs/YAxisTab.vue';
import ColorTab from '@/shared/Settings/Common/Tabs/ColorTab.vue';
import { ChartType } from '@/shared';
import ShapeTab from '@/shared/Settings/SeriesChart/ShapeTab.vue';
import DataLabelTab from '@/shared/Settings/SeriesChart/DataLabelTab.vue';
import TooltipTab from '@/shared/Settings/Common/Tabs/TooltipTab.vue';
import BinNumberTab from '@/shared/Settings/HistogramSetting/BinNumberTab.vue';
import { Log } from '@core/utils';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';

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
}
</script>
