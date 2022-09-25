<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DynamicSettingTab
      v-if="isDynamicSetting"
      :setting="setting.options"
      :query="query"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <SlicerTabControl v-else :setting="setting.options" :query="query" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, GroupedTableQuerySetting, InputControlQuerySetting, SettingKey, SlicerFilterOption } from '@core/domain';
import { ChartType } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';
import { Log } from '@core/utils';
import BackgroundTab from '@/shared/Settings/Common/Tabs/BackgroundTab.vue';
import TitleTab from '@/shared/Settings/Common/Tabs/TitleTab.vue';
import SlicerTabControl from '@/shared/Settings/SlicerFilterSetting/SlicerTabControl.vue';
import DynamicSettingTab from '@/shared/Settings/SlicerFilterSetting/DynamicSettingTab.vue';
import { ListUtils } from '@/utils';

@Component({ components: { SlicerTabControl, BackgroundTab, TitleTab, DynamicSettingTab } })
export default class SlicerFilterSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): InputControlQuerySetting {
    return this.chartInfo.setting as InputControlQuerySetting;
  }

  private get setting(): SlicerFilterOption {
    return this.chartInfo.setting.getChartOption() as SlicerFilterOption;
  }

  private get isDynamicSetting(): boolean {
    return ListUtils.isEmpty(this.query.values);
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

<style lang="scss" scoped></style>
