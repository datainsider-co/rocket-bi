<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataPointTab :setting="setting.options" @onChangeAndQuery="handleSettingChangeAndQuery" />
    <LegendTab :setting="setting.options.legend" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BellXAxisTab :query="query" :setting="setting.options.xAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BellYAxisTab :query="query" :setting="setting.options.yAxis" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BellCurveColorTab :setting="setting.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DataLabelTab :setting="setting.options.plotOptions" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ShapeTab :setting="setting.options.plotOptions" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TooltipTab :setting="setting.options.tooltip" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :setting="setting.options" :widget-type="currentWidget" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import LegendTab from '@/shared/settings/series-chart/LegendTab.vue';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import DataLabelTab from '@/shared/settings/series-chart/DataLabelTab.vue';
import ShapeTab from '@/shared/settings/series-chart/ShapeTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import XAxisTab from '@/shared/settings/common/tabs/XAxisTab.vue';
import YAxisTab from '@/shared/settings/common/tabs/YAxisTab.vue';
import { BellCurveChartOption2, BellCurve2QuerySetting, ChartInfo, SettingKey } from '@core/common/domain';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import { ChartType } from '@/shared';
import BellCurveColorTab from '@/shared/settings/bell-curve-setting/BellCuveColorTab.vue';
import DataPointTab from '@/shared/settings/common/tabs/DataPointTab.vue';
import BellXAxisTab from '@/shared/settings/bell-curve-setting/BellCurveXAxisTab.vue';
import BellYAxisTab from '@/shared/settings/bell-curve-setting/BellYAxisTab.vue';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';

@Component({
  components: {
    LegendTab,
    TitleTab,
    BackgroundTab,
    DataLabelTab,
    ShapeTab,
    BellCurveColorTab,
    VisualHeader,
    BellXAxisTab,
    TooltipTab,
    DataPointTab,
    BellYAxisTab
  }
})
export default class BellCurveSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): BellCurve2QuerySetting {
    return this.chartInfo.setting as BellCurve2QuerySetting;
  }

  private get setting(): BellCurveChartOption2 {
    return this.chartInfo.setting.getChartOption() as BellCurveChartOption2;
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
