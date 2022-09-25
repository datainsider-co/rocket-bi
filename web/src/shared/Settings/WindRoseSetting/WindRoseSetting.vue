<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <StackTab
      v-if="enableStackTab"
      :response="response"
      :setting="setting"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <LegendTab :setting="setting.options.legend" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <SpiderXAxisTab :query="query" :setting="setting.options.xAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <SpiderYAxisTab :query="query" :setting="setting.options.yAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ColorTab :setting="setting.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab :setting="setting.options.plotOptions" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TooltipTab :setting="setting.options.tooltip" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :setting="setting.options" :widget-type="currentWidget" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, SeriesChartOption, SeriesOneResponse, SeriesQuerySetting, SettingKey } from '@core/domain';
import LegendTab from '@/shared/Settings/SeriesChart/LegendTab.vue';
import VisualHeader from '@/shared/Settings/Common/Tabs/VisualHeader.vue';
import BackgroundTab from '@/shared/Settings/Common/Tabs/BackgroundTab.vue';
import TitleTab from '@/shared/Settings/Common/Tabs/TitleTab.vue';
import ColorTab from '@/shared/Settings/Common/Tabs/ColorTab.vue';
import ShapeTab from '@/shared/Settings/SeriesChart/ShapeTab.vue';
import DataLabelTab from '@/shared/Settings/SeriesChart/DataLabelTab.vue';
import { _ChartStore } from '@/screens/DashboardDetail/stores';
import StackTab from '@/shared/Settings/StackChart/StackTab.vue';
import TooltipTab from '@/shared/Settings/Common/Tabs/TooltipTab.vue';
import { ChartType } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';
import SpiderXAxisTab from '@/shared/Settings/SpiderSetting/SpiderXAxisTab.vue';
import SpiderYAxisTab from '@/shared/Settings/SpiderSetting/SpiderYAxisTab.vue';

@Component({
  components: {
    LegendTab,
    TitleTab,
    BackgroundTab,
    DataLabelTab,
    ShapeTab,
    ColorTab,
    VisualHeader,
    StackTab,
    TooltipTab,
    SpiderXAxisTab,
    SpiderYAxisTab
  }
})
export default class WindRoseSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): SeriesQuerySetting {
    return this.chartInfo.setting as SeriesQuerySetting;
  }

  private get setting(): SeriesChartOption {
    return this.chartInfo.setting.getChartOption() as SeriesChartOption;
  }

  private get currentWidget(): ChartType {
    return _ConfigBuilderStore.chartType;
  }

  private get response(): SeriesOneResponse | undefined {
    return _ChartStore.chartDataResponses[this.chartInfo.id] as SeriesOneResponse;
  }

  private get enableStackTab(): boolean {
    return (this.response?.series?.length ?? 0) > 1;
  }

  private handleSettingChanged(key: string, value: boolean | string | number, reRender?: boolean) {
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
