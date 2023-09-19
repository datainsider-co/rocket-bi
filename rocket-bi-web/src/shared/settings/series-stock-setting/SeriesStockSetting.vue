<template>
  <div class="flex-grow-1">
    <TitleTab :setting="seriesOption.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <StockTab :setting="seriesOption.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
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
    <ColorTab :setting="seriesOption.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab :setting="seriesOption.options.plotOptions" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab :setting="seriesOption.options.background" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
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
import StockTab from '@/shared/settings/series-stock-setting/StockTab.vue';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, SeriesOneResponse, SeriesQuerySetting, SeriesChartOption, ChartOption, SettingKey, LineStockChartOption } from '@core/common/domain';
import LegendTab from '@/shared/settings/series-chart/LegendTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import XAxisTab from '@/shared/settings/common/tabs/XAxisTab.vue';
import ColorTab from '@/shared/settings/common/tabs/ColorTab.vue';
import { SelectOption, ChartType } from '@/shared';
import DisplayTab from '@/shared/settings/series-chart/DisplayTab.vue';
import DataLabelTab from '@/shared/settings/series-chart/DataLabelTab.vue';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import SeriesGeneralTab from '@/shared/settings/series-chart/SeriesGeneralTab.vue';
import SeriesYAxisTab from '@/shared/settings/common/tabs/SeriesYAxisTab.vue';
import { StringUtils } from '@/utils/StringUtils';
import { ChartDataModule } from '@/screens/dashboard-detail/stores';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';

@Component({
  components: {
    StockTab,
    LegendTab,
    TitleTab,
    BackgroundTab,
    DataLabelTab,
    ColorTab,
    VisualHeader,
    XAxisTab,
    SeriesYAxisTab,
    TooltipTab,
    DisplayTab,
    SeriesGeneralTab
  }
})
export default class SeriesStockSetting extends Vue {
  @Prop()
  private readonly chartInfo!: ChartInfo;

  private get query(): SeriesQuerySetting {
    return this.chartInfo.setting as SeriesQuerySetting;
  }

  private get seriesOption(): LineStockChartOption {
    return this.chartInfo.setting.getChartOption() as LineStockChartOption;
  }

  private get response(): SeriesOneResponse | undefined {
    return ChartDataModule.chartDataResponses[this.chartInfo.id] as SeriesOneResponse;
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
        ?.map(legend => ({
          displayName: legend.name,
          id: StringUtils.toCamelCase(legend.name)
        }))
        ?.sort((item, nextItem) => StringUtils.compare(item.displayName, nextItem.displayName)) ?? []
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

  private get defaultBackgroundColor(): string {
    return ChartOption.getThemeBackgroundColor();
  }
}
</script>
