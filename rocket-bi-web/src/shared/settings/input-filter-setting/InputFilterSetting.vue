<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />

    <InputFilterControlTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, GroupedTableQuerySetting, InputFilterOption, SettingKey } from '@core/common/domain';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import { ChartType } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import InputFilterControlTab from '@/shared/settings/input-filter-setting/InputFilterControlTab.vue';

@Component({
  components: {
    TitleTab,
    BackgroundTab,
    InputFilterControlTab
  }
})
export default class InputFilterSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): GroupedTableQuerySetting {
    return this.chartInfo.setting as GroupedTableQuerySetting;
  }

  private get setting(): InputFilterOption {
    return this.chartInfo.setting.getChartOption() as InputFilterOption;
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
