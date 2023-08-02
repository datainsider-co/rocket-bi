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
import { ChartInfo, SeriesChartOption, SeriesOneResponse, SeriesQuerySetting, SettingKey } from '@core/common/domain';
import LegendTab from '@/shared/settings/series-chart/LegendTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import ColorTab from '@/shared/settings/common/tabs/ColorTab.vue';
import ShapeTab from '@/shared/settings/series-chart/ShapeTab.vue';
import DataLabelTab from '@/shared/settings/series-chart/DataLabelTab.vue';
import { ChartDataModule } from '@/screens/dashboard-detail/stores';
import StackTab from '@/shared/settings/stack-chart/StackTab.vue';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import { ChartType } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import SpiderXAxisTab from '@/shared/settings/spider-setting/SpiderXAxisTab.vue';
import SpiderYAxisTab from '@/shared/settings/spider-setting/SpiderYAxisTab.vue';

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
    return ChartDataModule.chartDataResponses[this.chartInfo.id] as SeriesOneResponse;
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
