<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ColorTab :setting="setting.options.themeColor" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <SankeyDataLabelTab
      :setting="setting.options"
      :widget-type="widgetType"
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
import { Component, Vue, Prop } from 'vue-property-decorator';
import { ChartInfo, SettingKey, SankeyChartOption, SankeyQuerySetting, ChartOption } from '@core/common/domain';
import { ChartType } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import ColorTab from '@/shared/settings/common/tabs/ColorTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import TooltipTab from '@/shared/settings/common/tabs/TooltipTab.vue';
import SankeyDataLabelTab from '@/shared/settings/sankey-setting/SankeyDataLabelTab.vue';

@Component({
  components: {
    TitleTab,
    BackgroundTab,
    ColorTab,
    VisualHeader,
    TooltipTab,
    SankeyDataLabelTab
  }
})
export default class SankeySetting extends Vue {
  private readonly widgetType = ChartType.Sankey;
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): SankeyQuerySetting {
    return this.chartInfo.setting as SankeyQuerySetting;
  }

  private get setting(): SankeyChartOption {
    return this.chartInfo.setting.getChartOption() as SankeyChartOption;
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

<style lang="scss" scoped></style>
