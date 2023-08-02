<template>
  <div>
    <FilterTitleTab v-if="enableTitleSetting" :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <DynamicFunctionControlTab
      :setting="setting.options"
      :widgetType="currentWidget"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
      @onDefaultChanged="handleDefaultValueChanged"
    />
    <BackgroundTab v-if="enableTitleSetting" :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, GroupMeasurementQuerySetting, SettingKey, TabFilterOption } from '@core/common/domain';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import FilterTitleTab from '@/shared/settings/tab-filter-setting/FilterTitleTab.vue';
import { ChartType, DefaultFilterValue } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';
import DynamicFunctionControlTab from '@/shared/settings/tab-filter-setting/DynamicFunctionControlTab.vue';

@Component({
  components: {
    FilterTitleTab,
    BackgroundTab,
    DynamicFunctionControlTab
  }
})
export default class DynamicFunctionSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): GroupMeasurementQuerySetting {
    return this.chartInfo.setting as GroupMeasurementQuerySetting;
  }

  private get setting(): TabFilterOption {
    return this.chartInfo.setting.getChartOption() as TabFilterOption;
  }

  private get currentWidget(): ChartType {
    return _ConfigBuilderStore.chartType;
  }

  private get enableTitleSetting(): boolean {
    switch (this.currentWidget) {
      case ChartType.DropDownFilter:
      case ChartType.TabInnerFilter:
        return false;
      default:
        return true;
    }
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

  private handleDefaultValueChanged(filterValue: DefaultFilterValue) {
    // Log.debug('handleDefaultValueChanged::', filterValue);
    // if (!filterValue || !filterValue.value) {
    //   this.query.setDefaultValue([]);
    // } else if (isArray(filterValue.value)) {
    //   this.query.setDefaultValue(filterValue.value);
    // } else {
    //   //Nothing to do
    // }
  }
}
</script>
