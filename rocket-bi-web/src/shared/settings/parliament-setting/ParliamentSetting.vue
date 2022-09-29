<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ParliamentLayoutTab :setting="setting.options" @onChanged="handleSettingChanged" />
    <DataPointTab :setting="setting.options" @onChangeAndQuery="handleSettingChangeAndQuery" />
    <LegendTab :setting="setting.options.legend" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ColorTab :setting="setting.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab
      :setting="setting.options.plotOptions"
      widget-type="parliament"
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
import LegendTab from '@/shared/settings/series-chart/LegendTab.vue';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import DataLabelTab from '@/shared/settings/series-chart/DataLabelTab.vue';
import ColorTab from '@/shared/settings/common/tabs/ColorTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import { ChartInfo, ParliamentQuerySetting, ParliamentChartOption, SettingKey } from '@core/common/domain';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import { ChartType } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';
import ParliamentLayoutTab from '@/shared/settings/parliament-setting/PaliarmentLayoutTab.vue';
import DataPointTab from '@/shared/settings/common/tabs/DataPointTab.vue';

@Component({
  components: {
    LegendTab,
    TitleTab,
    BackgroundTab,
    DataLabelTab,
    ColorTab,
    VisualHeader,
    TooltipTab,
    ParliamentLayoutTab,
    DataPointTab
  }
})
export default class ParliamentSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): ParliamentQuerySetting {
    return this.chartInfo.setting as ParliamentQuerySetting;
  }

  private get setting(): ParliamentChartOption {
    return this.chartInfo.setting.getChartOption() as ParliamentChartOption;
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
  private handleSettingChangeAndQuery(key: string, value: boolean | string | number) {
    this.handleSettingChanged(key, value, true);
  }
}
</script>
