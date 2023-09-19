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
    <BackgroundTab
      :color="setting.options.background"
      :default-color="defaultBackgroundColor"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <TooltipTab :setting="setting.options.tooltip" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :widget-type="currentWidget" :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, ChartOption, PyramidChartOption, PyramidQuerySetting, SettingKey } from '@core/common/domain';

import LegendTab from '@/shared/settings/series-chart/LegendTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import ColorTab from '@/shared/settings/common/tabs/ColorTab.vue';
import DataLabelTab from '@/shared/settings/series-chart/DataLabelTab.vue';
import { ChartType } from '@/shared';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
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

  private get defaultBackgroundColor(): string {
    return ChartOption.getThemeBackgroundColor();
  }
}
</script>

<style lang="scss" scoped></style>
