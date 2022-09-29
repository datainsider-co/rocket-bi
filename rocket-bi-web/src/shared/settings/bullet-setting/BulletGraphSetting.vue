<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataValuesTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BulletColorTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TargetAndValueTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TooltipTab :setting="setting.options.tooltip" @onChhanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :setting="setting.options" :widget-type="currentWidget" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import { BulletChartOption, ChartInfo, GaugeQuerySetting, SettingKey } from '@core/common/domain';
import { ChartType } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';
import GaugeColorTab from '@/shared/settings/gauge-setting/GaugeColorTab.vue';
import DataLabelTab from '@/shared/settings/series-chart/DataLabelTab.vue';
import GaugeAxisTab from '@/shared/settings/gauge-setting/GaugeAxisTab.vue';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import DataValuesTab from '@/shared/settings/bullet-setting/DataValuesTab.vue';
import BulletColorTab from '@/shared/settings/bullet-setting/BulletColorTab.vue';
import TargetAndValueTab from '@/shared/settings/bullet-setting/TargetAndValueTab.vue';

@Component({
  components: {
    TitleTab,
    BackgroundTab,
    VisualHeader,
    TooltipTab,
    DataValuesTab,
    BulletColorTab,
    TargetAndValueTab
  }
})
export default class BulletGraphSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): GaugeQuerySetting {
    return this.chartInfo.setting as GaugeQuerySetting;
  }

  private get setting(): BulletChartOption {
    return this.chartInfo.setting.getChartOption() as BulletChartOption;
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
