<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <LegendTab :setting="setting.options.legend" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <SpiderXAxisTab :query="query" :setting="setting.options.xAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <SpiderYAxisTab :query="query" :setting="setting.options.yAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ColorTab :setting="setting.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab :setting="setting.options.plotOptions" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TooltipTab :setting="setting.options.tooltip" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :widget-type="currentWidget" :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, SpiderWebQuerySetting, SpiderWebChartOption, SettingKey } from '@core/common/domain';
import LegendTab from '@/shared/settings/series-chart/LegendTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import ColorTab from '@/shared/settings/common/tabs/ColorTab.vue';
import ShapeTab from '@/shared/settings/series-chart/DisplayTab.vue';
import DataLabelTab from '@/shared/settings/series-chart/DataLabelTab.vue';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import { ChartType } from '@/shared';
import SpiderXAxisTab from '@/shared/settings/spider-setting/SpiderXAxisTab.vue';
import SpiderYAxisTab from '@/shared/settings/spider-setting/SpiderYAxisTab.vue';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';

@Component({
  components: {
    SpiderYAxisTab,
    SpiderXAxisTab,
    TooltipTab,
    LegendTab,
    TitleTab,
    BackgroundTab,
    DataLabelTab,
    ShapeTab,
    ColorTab,
    VisualHeader
  }
})
export default class SpiderSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): SpiderWebQuerySetting {
    return this.chartInfo.setting as SpiderWebQuerySetting;
  }

  private get setting(): SpiderWebChartOption {
    return this.chartInfo.setting.getChartOption() as SpiderWebChartOption;
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
