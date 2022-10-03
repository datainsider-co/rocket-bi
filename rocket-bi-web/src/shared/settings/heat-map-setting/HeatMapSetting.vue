<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <XAxisTab :query="query" :setting="setting.options.xAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <YAxisTab :query="query" :setting="setting.options.yAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <HeatMapColorTab :setting="setting.options" widget-type="heatmap" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab
      :setting="setting.options.plotOptions"
      :widget-type="widgetType"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TooltipTab :setting="setting.options.tooltip" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :widget-type="currentWidget" :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, HeatMapQuerySetting, HeatMapChartOption, SettingKey } from '@core/common/domain';

import LegendTab from '@/shared/settings/series-chart/LegendTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import XAxisTab from '@/shared/settings/common/tabs/XAxisTab.vue';
import YAxisTab from '@/shared/settings/common/tabs/YAxisTab.vue';
import ColorTab from '@/shared/settings/common/tabs/ColorTab.vue';
import ShapeTab from '@/shared/settings/series-chart/ShapeTab.vue';
import DataLabelTab from '@/shared/settings/series-chart/DataLabelTab.vue';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import { ChartType } from '@/shared';
import HeatMapColorTab from '@/shared/settings/heat-map-setting/HeatMapColorTab.vue';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';

@Component({
  components: {
    HeatMapColorTab,
    TooltipTab,
    LegendTab,
    TitleTab,
    BackgroundTab,
    DataLabelTab,
    ShapeTab,
    ColorTab,
    VisualHeader,
    XAxisTab,
    YAxisTab
  }
})
export default class HeatMapSetting extends Vue {
  private readonly widgetType = ChartType.HeatMap;
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): HeatMapQuerySetting {
    return this.chartInfo.setting as HeatMapQuerySetting;
  }

  private get setting(): HeatMapChartOption {
    return this.chartInfo.setting.getChartOption() as HeatMapChartOption;
  }

  private get currentWidget(): ChartType {
    return _ConfigBuilderStore.chartType;
  }

  private handleSettingChanged(key: string, value: boolean | string | number, reRender?: boolean) {
    Log.debug('handleSettingChanged::', key, 'value::', value);
    this.setting.setOption(key, value);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo, reRender === true);
  }

  private handleMultipleSettingChanged(settings: Map<SettingKey, boolean | string | number>) {
    this.setting.setOptions(settings);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo);
  }
}
</script>
