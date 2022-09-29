<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataPointTab :setting="setting.options" @onChangeAndQuery="handleSettingChangeAndQuery" />
    <LegendTab :setting="setting.options.legend" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <XAxisTab :query="query" :setting="setting.options.xAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <YAxisTab :query="query" :setting="setting.options.yAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ColorTab :setting="setting.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TooltipTab :setting="setting.options.tooltip" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :widget-type="currentWidget" :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, ScatterChartOption, ScatterQuerySetting, SettingKey } from '@core/common/domain';
import LegendTab from '@/shared/settings/series-chart/LegendTab.vue';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import ColorTab from '@/shared/settings/common/tabs/ColorTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import XAxisTab from '@/shared/settings/common/tabs/XAxisTab.vue';
import YAxisTab from '@/shared/settings/common/tabs/YAxisTab.vue';
import DataPointTab from '@/shared/settings/common/tabs/DataPointTab.vue';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import { ChartType } from '@/shared';
import { Log } from '@core/utils';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';

@Component({
  components: {
    LegendTab,
    TitleTab,
    BackgroundTab,
    ColorTab,
    VisualHeader,
    XAxisTab,
    YAxisTab,
    DataPointTab,
    TooltipTab
  }
})
export default class ScatterSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): ScatterQuerySetting {
    return this.chartInfo.setting as ScatterQuerySetting;
  }

  private get setting(): ScatterChartOption {
    return this.chartInfo.setting.getChartOption() as ScatterChartOption;
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

  private handleSettingChangeAndQuery(key: string, value: boolean | string | number) {
    this.handleSettingChanged(key, value, true);
  }

  private get currentWidget(): ChartType {
    return _ConfigBuilderStore.chartType;
  }
}
</script>

<style lang="scss" scoped></style>
