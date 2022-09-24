<template>
  <PanelHeader header="Display" target-id="display-tab">
    <div class="display-tab">
      <DropdownSetting id="display-selection" :options="seriesOptions" :value="selectedLegend" class="mb-3" size="full" @onSelected="handleSelectedLegend" />
      <InputSetting id="display-name-setting" :value="displayName" class="mb-3" label="Display Name" @onChanged="handleDisplayNameChanged" />
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { PlotOptions } from '@core/domain/Model/ChartOption/ExtraSetting/ChartStyle/PlotOptions';
import { DashOptions } from '@/shared/Settings/Common/Options/DashOptions';
import { ListUtils } from '@/utils';
import { ChartType, SelectOption } from '@/shared';
import { get } from 'lodash';
import { SettingKey } from '@core/domain';

@Component({ components: { PanelHeader } })
export default class LegendNameTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly setting!: PlotOptions;
  @Prop({ required: false, type: Array })
  private readonly seriesOptions?: SelectOption[];

  private selectedLegend = '';
  @Watch('seriesOptions', { immediate: true })
  onResponseChanged() {
    this.selectedLegend = get(this.seriesOptions, '[0].id', '');
  }

  private get selectedOption(): SelectOption | undefined {
    return this.seriesOptions?.find(series => series.id === this.selectedLegend);
  }

  private get displayName(): string {
    return get(this.setting, `series.response.${this.selectedLegend}.name`, this.selectedOption?.displayName);
  }

  private handleDisplayNameChanged(name: string) {
    return this.$emit('onChanged', `plotOptions.series.response.${this.selectedLegend}.name`, name);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set(`plotOptions.series.response.${this.selectedLegend}.name`, this.selectedOption?.displayName ?? '');
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleSelectedLegend(newLegend: SelectOption) {
    this.selectedLegend = newLegend.id.toString();
  }
}
</script>

<style lang="scss" scoped></style>
