<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <!--    <MapControlTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />-->
    <MapStyleTab
      :setting="setting.options"
      @onChangeAndQuery="handleSettingChangeAndQuery"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <HeatMapColorTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TooltipTab :setting="setting.options.tooltip" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :setting="setting.options" :widget-type="currentWidget" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, MapChartChartOption, MapQuerySetting, SettingKey } from '@core/domain';

import TitleTab from '@/shared/Settings/Common/Tabs/TitleTab.vue';
import BackgroundTab from '@/shared/Settings/Common/Tabs/BackgroundTab.vue';
import VisualHeader from '@/shared/Settings/Common/Tabs/VisualHeader.vue';
import MapControlTab from '@/shared/Settings/MapSetting/MapControlTab.vue';
import MapStyleTab from '@/shared/Settings/MapSetting/MapStyleTab.vue';
import HeatMapColorTab from '@/shared/Settings/HeatMapSetting/HeatMapColorTab.vue';
import TooltipTab from '@/shared/Settings/Common/Tabs/TooltipTab.vue';
import { ChartType } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';
import { Log } from '@core/utils';

@Component({
  components: {
    TitleTab,
    BackgroundTab,
    VisualHeader,
    MapControlTab,
    MapStyleTab,
    HeatMapColorTab,
    TooltipTab
  }
})
export default class MapSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): MapQuerySetting {
    return this.chartInfo.setting as MapQuerySetting;
  }

  private get setting(): MapChartChartOption {
    return this.chartInfo.setting.getChartOption() as MapChartChartOption;
  }

  private get currentWidget(): ChartType {
    return _ConfigBuilderStore.chartType;
  }

  private handleSettingChangeAndQuery(key: string, value: boolean | string | number) {
    this.handleSettingChanged(key, value, true);
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
