<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <LegendTab :setting="setting.options.legend" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ColorTab :setting="setting.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab
      :widget-type="widgetType"
      :setting="setting.options.plotOptions"
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
import { ChartInfo, PyramidChartOption, PyramidQuerySetting, SettingKey } from '@core/domain';

import LegendTab from '@/shared/Settings/SeriesChart/LegendTab.vue';
import VisualHeader from '@/shared/Settings/Common/Tabs/VisualHeader.vue';
import BackgroundTab from '@/shared/Settings/Common/Tabs/BackgroundTab.vue';
import TitleTab from '@/shared/Settings/Common/Tabs/TitleTab.vue';
import ColorTab from '@/shared/Settings/Common/Tabs/ColorTab.vue';
import DataLabelTab from '@/shared/Settings/SeriesChart/DataLabelTab.vue';
import { ChartType } from '@/shared';
import TooltipTab from '@/shared/Settings/Common/Tabs/TooltipTab.vue';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';
import { Log } from '@core/utils';

@Component({ components: { TooltipTab, DataLabelTab, LegendTab, TitleTab, BackgroundTab, ColorTab, VisualHeader } })
export default class PyramidSetting extends Vue {
  private readonly widgetType = ChartType.Pyramid;

  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): PyramidQuerySetting {
    return this.chartInfo.setting as PyramidQuerySetting;
  }

  private get setting(): PyramidChartOption {
    return this.chartInfo.setting.getChartOption() as PyramidChartOption;
  }

  private handleSettingChanged(key: string, value: boolean | string | number) {
    Log.debug('handleSettingChanged::', key, 'value::', value);
    this.setting.setOption(key, value);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo);
  }

  private handleMultipleSettingChanged(settings: Map<SettingKey, boolean | string | number>) {
    this.setting.setOptions(settings);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo);
  }
  private get currentWidget(): ChartType {
    return _ConfigBuilderStore.chartType;
  }
}
</script>

<style lang="scss" scoped></style>
