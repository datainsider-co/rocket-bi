<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <LegendTab :setting="setting.options.legend" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <XAxisTab :query="query" :setting="setting.options.xAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <YAxisTab :query="query" :setting="setting.options.yAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ColorTab :setting="setting.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab :setting="setting.options.plotOptions" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ShapeTab :setting="setting.options.plotOptions" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TooltipTab :setting="setting.options.tooltip" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :widget-type="currentWidget" :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import LegendTab from '@/shared/Settings/SeriesChart/LegendTab.vue';
import TitleTab from '@/shared/Settings/Common/Tabs/TitleTab.vue';
import BackgroundTab from '@/shared/Settings/Common/Tabs/BackgroundTab.vue';
import DataLabelTab from '@/shared/Settings/SeriesChart/DataLabelTab.vue';
import ShapeTab from '@/shared/Settings/SeriesChart/ShapeTab.vue';
import ColorTab from '@/shared/Settings/Common/Tabs/ColorTab.vue';
import VisualHeader from '@/shared/Settings/Common/Tabs/VisualHeader.vue';
import XAxisTab from '@/shared/Settings/Common/Tabs/XAxisTab.vue';
import YAxisTab from '@/shared/Settings/Common/Tabs/YAxisTab.vue';
import { ChartInfo, ParetoQuerySetting, ParetoChartOption, SettingKey } from '@core/domain';
import TooltipTab from '@/shared/Settings/Common/Tabs/TooltipTab.vue';
import { ChartType } from '@/shared';
import { Log } from '@core/utils';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';

@Component({
  components: {
    LegendTab,
    TitleTab,
    BackgroundTab,
    DataLabelTab,
    ShapeTab,
    ColorTab,
    VisualHeader,
    XAxisTab,
    YAxisTab,
    TooltipTab
  }
})
export default class ParetoSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): ParetoQuerySetting {
    return this.chartInfo.setting as ParetoQuerySetting;
  }

  private get setting(): ParetoChartOption {
    return this.chartInfo.setting.getChartOption() as ParetoChartOption;
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
