<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <GaugeAxisTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <GaugeColorTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab
      :setting="setting.options.plotOptions"
      widget-type="gauge"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <BackgroundTab
      :color="setting.options.background"
      :default-color="defaultBackgroundColor"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <TooltipTab :setting="setting.options.tooltip" @onChhanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :widget-type="currentWidget" :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import DataLabelTab from '@/shared/settings/series-chart/DataLabelTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import { ChartInfo, GaugeQuerySetting, GaugeChartOption, SettingKey, ChartOption } from '@core/common/domain';
import GaugeAxisTab from '@/shared/settings/gauge-setting/GaugeAxisTab.vue';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import { ChartType } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';
import GaugeColorTab from '@/shared/settings/gauge-setting/GaugeColorTab.vue';

@Component({
  components: {
    TitleTab,
    GaugeColorTab,
    BackgroundTab,
    DataLabelTab,
    VisualHeader,
    GaugeAxisTab,
    TooltipTab
  }
})
export default class GaugeSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): GaugeQuerySetting {
    return this.chartInfo.setting as GaugeQuerySetting;
  }

  private get setting(): GaugeChartOption {
    return this.chartInfo.setting.getChartOption() as GaugeChartOption;
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

  private get defaultBackgroundColor(): string {
    return ChartOption.getThemeBackgroundColor();
  }
}
</script>
