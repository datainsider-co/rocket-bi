<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <LayoutTab :setting="setting.options.plotOptions" @onChanged="handleSettingChanged" />
    <ColorTab :setting="setting.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab
      :query="query"
      :setting="setting.options.plotOptions"
      widget-type="tree_map"
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
import TitleTab from '@/shared/Settings/Common/Tabs/TitleTab.vue';
import BackgroundTab from '@/shared/Settings/Common/Tabs/BackgroundTab.vue';
import ColorTab from '@/shared/Settings/Common/Tabs/ColorTab.vue';
import VisualHeader from '@/shared/Settings/Common/Tabs/VisualHeader.vue';
import { ChartInfo, TreeMapQuerySetting, TreeMapChartOption, SettingKey } from '@core/domain';
import DataLabelTab from '@/shared/Settings/SeriesChart/DataLabelTab.vue';
import { Log } from '@core/utils';
import TooltipTab from '@/shared/Settings/Common/Tabs/TooltipTab.vue';
import LayoutTab from '@/shared/Settings/TreeMapSetting/LayoutTab.vue';
import { ChartType } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';

@Component({
  components: {
    TitleTab,
    BackgroundTab,
    LayoutTab,
    ColorTab,
    VisualHeader,
    DataLabelTab,
    TooltipTab
  }
})
export default class TreeMapSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): TreeMapQuerySetting {
    return this.chartInfo.setting as TreeMapQuerySetting;
  }

  private get setting(): TreeMapChartOption {
    return this.chartInfo.setting.getChartOption() as TreeMapChartOption;
  }

  private get currentWidget(): ChartType {
    return _ConfigBuilderStore.chartType;
  }

  private handleSettingChanged(key: string, value: boolean | string | number, reRender?: boolean) {
    Log.debug('handleSettingChanged::', key, 'value::', value);
    switch (key) {
      case 'plotOptions.treemap.dataLabels.enabled':
        this.setting.setOption('plotOptions.treemap.levels[0].dataLabels.enabled', value);
        break;
      case 'plotOptions.treemap.dataLabels.style.color':
        this.setting.setOption('plotOptions.treemap.levels[0].dataLabels.style.color', value);
        break;
    }
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
