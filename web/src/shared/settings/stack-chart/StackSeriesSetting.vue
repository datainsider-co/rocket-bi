<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <LegendNameTab
      :series-options="responseAsSelectOption"
      :setting="setting.options.plotOptions"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <StackTab
      v-if="enableStackTab"
      :response="response"
      :setting="setting"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <LegendTab :setting="setting.options.legend" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <XAxisTab
      :query="query"
      :setting="setting.options.xAxis"
      :chart-type="currentWidget"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <YAxisTab
      :query="query"
      :setting="setting.options.yAxis"
      :chart-type="currentWidget"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <ColorTab :setting="setting.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab :setting="setting.options.plotOptions" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab
      :color="setting.options.background"
      :default-color="defaultBackgroundColor"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <TooltipTab :setting="setting.options.tooltip" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :setting="setting.options" :widget-type="currentWidget" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, SeriesOneResponse, SeriesChartOption, SeriesQuerySetting, SettingKey, ChartOption } from '@core/common/domain';
import LegendTab from '@/shared/settings/series-chart/LegendTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import XAxisTab from '@/shared/settings/common/tabs/XAxisTab.vue';
import YAxisTab from '@/shared/settings/common/tabs/YAxisTab.vue';
import ColorTab from '@/shared/settings/common/tabs/ColorTab.vue';
import ShapeTab from '@/shared/settings/series-chart/ShapeTab.vue';
import DataLabelTab from '@/shared/settings/series-chart/DataLabelTab.vue';
import { ChartDataModule } from '@/screens/dashboard-detail/stores';
import StackTab from '@/shared/settings/stack-chart/StackTab.vue';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import { ChartType, SelectOption } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { StringUtils } from '@/utils/StringUtils';
import DisplayTab from '@/shared/settings/series-chart/DisplayTab.vue';
import LegendNameTab from '@/shared/settings/stack-chart/LegendNameTab.vue';

@Component({
  components: {
    LegendTab,
    TitleTab,
    BackgroundTab,
    DataLabelTab,
    ShapeTab,
    ColorTab,
    VisualHeader,
    XAxisTab,
    YAxisTab,
    StackTab,
    TooltipTab,
    LegendNameTab
  }
})
export default class StackSeriesSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): SeriesQuerySetting {
    return this.chartInfo.setting as SeriesQuerySetting;
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

  private get setting(): SeriesChartOption {
    return this.chartInfo.setting.getChartOption() as SeriesChartOption;
  }

  private get currentWidget(): ChartType {
    return _ConfigBuilderStore.chartType;
  }

  private get response(): SeriesOneResponse | undefined {
    return ChartDataModule.chartDataResponses[this.chartInfo.id] as SeriesOneResponse;
  }

  private get enableStackTab(): boolean {
    return (this.response?.series?.length ?? 0) > 1;
  }

  private handleSettingChanged(key: string, value: boolean | string | number, reRender?: boolean) {
    this.setting.setOption(key, value);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo, reRender === true);
  }

  private handleMultipleSettingChanged(settings: Map<SettingKey, boolean | string | number>) {
    this.setting.setOptions(settings);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo);
  }

  private get chartType(): ChartType {
    return _ConfigBuilderStore.chartType as ChartType;
  }

  private get defaultBackgroundColor(): string {
    return ChartOption.getThemeBackgroundColor();
  }
}
</script>
