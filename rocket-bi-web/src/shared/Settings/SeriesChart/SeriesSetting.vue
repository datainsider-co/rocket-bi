<template>
  <div class="flex-grow-1">
    <TitleTab :setting="seriesOption.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <SeriesGeneralTab
      v-if="enableGeneralTab"
      :setting="seriesOption.options"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <DisplayTab
      :series-options="responseAsSelectOption"
      :setting="seriesOption.options.plotOptions"
      :axis-setting="seriesOption.options.yAxis"
      :widget-type="chartType"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <LegendTab :setting="seriesOption.options.legend" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <XAxisTab
      :query="query"
      :setting="seriesOption.options.xAxis"
      :chartType="chartType"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <SeriesYAxisTab
      :plotOptions="seriesOption.options.plotOptions"
      :query="query"
      :series-options="responseAsSelectOption"
      :setting="seriesOption.options.yAxis"
      :chartType="chartType"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <SeriesDualYAxisTab
      :plotOptions="seriesOption.options.plotOptions"
      :query="query"
      :series-options="responseAsSelectOption"
      :setting="seriesOption.options.yAxis"
      :chartType="chartType"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <ColorTab :setting="seriesOption.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab
      :setting="seriesOption.options.plotOptions"
      :widgetType="chartType"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <BackgroundTab :setting="seriesOption.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TooltipTab :setting="seriesOption.options.tooltip" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader
      :widget-type="chartType"
      :setting="seriesOption.options"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, SeriesOneResponse, SeriesQuerySetting, SeriesChartOption, ChartOption, SettingKey } from '@core/domain';
import LegendTab from '@/shared/Settings/SeriesChart/LegendTab.vue';
import VisualHeader from '@/shared/Settings/Common/Tabs/VisualHeader.vue';
import BackgroundTab from '@/shared/Settings/Common/Tabs/BackgroundTab.vue';
import TitleTab from '@/shared/Settings/Common/Tabs/TitleTab.vue';
import XAxisTab from '@/shared/Settings/Common/Tabs/XAxisTab.vue';
import ColorTab from '@/shared/Settings/Common/Tabs/ColorTab.vue';
import { SelectOption, ChartType } from '@/shared';
import DisplayTab from '@/shared/Settings/SeriesChart/DisplayTab.vue';
import DataLabelTab from '@/shared/Settings/SeriesChart/DataLabelTab.vue';
import TooltipTab from '@/shared/Settings/Common/Tabs/TooltipTab.vue';
import SeriesGeneralTab from '@/shared/Settings/SeriesChart/SeriesGeneralTab.vue';
import SeriesYAxisTab from '@/shared/Settings/Common/Tabs/SeriesYAxisTab.vue';
import { StringUtils } from '@/utils/string.utils';
import { _ChartStore } from '@/screens/DashboardDetail/stores';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';
import { Log } from '@core/utils';
import SeriesDualYAxisTab from '@/shared/Settings/Common/Tabs/SeriesDualYAxisTab.vue';

@Component({
  components: {
    LegendTab,
    TitleTab,
    BackgroundTab,
    DataLabelTab,
    ColorTab,
    VisualHeader,
    XAxisTab,
    SeriesYAxisTab,
    SeriesDualYAxisTab,
    TooltipTab,
    DisplayTab,
    SeriesGeneralTab
  }
})
export default class SeriesSetting extends Vue {
  @Prop()
  private readonly chartInfo!: ChartInfo;

  private get query(): SeriesQuerySetting {
    return this.chartInfo.setting as SeriesQuerySetting;
  }

  private get seriesOption(): SeriesChartOption {
    return this.chartInfo.setting.getChartOption() as SeriesChartOption;
  }

  private get response(): SeriesOneResponse | undefined {
    return _ChartStore.chartDataResponses[this.chartInfo.id] as SeriesOneResponse;
  }

  private get chartType(): ChartType {
    return _ConfigBuilderStore.chartType as ChartType;
  }

  private get enableGeneralTab() {
    return this.chartType == ChartType.Area;
  }

  private get responseAsSelectOption(): SelectOption[] {
    return (
      this.response?.series
        ?.sort((item, nextItem) => StringUtils.compare(item.name, nextItem.name))
        ?.map(legend => ({
          displayName: legend.name,
          id: StringUtils.toCamelCase(legend.name)
        })) ?? []
    );
  }

  private handleSettingChanged(key: string, value: any) {
    Log.debug('handleSettingChanged::', key, 'value::', value);
    this.seriesOption.setOption(key, value);
    Log.debug('handleSettingChanged::this.seriesOption', this.seriesOption);
    this.query.setChartOption(this.seriesOption);
    this.$emit('onChartInfoChanged', this.chartInfo);
  }

  private handleMultipleSettingChanged(settingAsMap: Map<SettingKey, boolean | string | number>) {
    this.seriesOption.setOptions(settingAsMap);
    this.query.setChartOption(this.seriesOption);
    this.$emit('onChartInfoChanged', this.chartInfo);
  }
}
</script>
