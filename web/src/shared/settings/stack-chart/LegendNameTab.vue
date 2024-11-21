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
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { PlotOptions } from '@core/common/domain/model/chart-option/extra-setting/chart-style/PlotOptions';
import { SelectOption } from '@/shared';
import { get } from 'lodash';
import { SettingKey } from '@core/common/domain';

@Component({ components: { PanelHeader } })
export default class LegendNameTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly setting!: PlotOptions;

  @Prop({ required: false, type: Array, default: () => [] })
  private readonly seriesOptions!: SelectOption[];

  private selectedLegend = '';
  @Watch('seriesOptions', { immediate: true })
  onResponseChanged(seriesOptions: SelectOption[]) {
    if (!this.selectedLegend || !this.existsOptions(seriesOptions, this.selectedLegend)) {
      this.selectedLegend = get(this.seriesOptions, '[0].id', '');
    }
  }

  protected existsOptions(seriesOptions: SelectOption[], selectedLegend: string): boolean {
    return seriesOptions?.some(series => series.id === selectedLegend) ?? false;
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
