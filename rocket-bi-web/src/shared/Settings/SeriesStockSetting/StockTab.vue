<template>
  <PanelHeader header="Stock" target-id="stock-tab">
    <div id="stock-tab">
      <ToggleSetting id="zoom-enable" :value="zoomEnabled" class="mb-2" label="Zoom" @onChanged="handleZoomEnabled" />
      <ToggleSetting id="compare-enable" :value="enableCompare" label="Compare" @onChanged="handleCompareEnabled" />
      <DropdownSetting
        v-if="enableCompare"
        id="compare-type"
        :options="compareOptions"
        :value="compare"
        disabled
        label=""
        size="full"
        class="mb-3"
        @onChanged="handleCompareChanged"
      />
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { SelectOption } from '@/shared';
import { StringUtils } from '@/utils/string.utils';
import { SeriesOptionData, SettingKey } from '@core/domain';
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component({ components: { PanelHeader } })
export default class StockTab extends Vue {
  private readonly defaultSetting = {
    zoomEnabled: true,
    compare: ''
  };
  @Prop({ required: false, type: Object })
  private readonly setting?: SeriesOptionData;

  private get zoomEnabled(): boolean {
    return this.setting?.rangeSelector?.enabled ?? this.defaultSetting.zoomEnabled;
  }

  private get enableCompare(): boolean {
    return StringUtils.isNotEmpty(this.setting?.plotOptions?.series?.compare);
  }

  private get compare(): string {
    return this.setting?.plotOptions?.series?.compare ?? this.defaultSetting.compare;
  }

  private handleZoomEnabled(enable: boolean) {
    this.$emit('onChanged', 'rangeSelector.enabled', enable);
  }
  private handleCompareChanged(compare: string) {
    this.$emit('onChanged', 'plotOptions.series.compare', compare);
  }

  private handleCompareEnabled(enable: boolean) {
    const compareValue = enable ? 'percent' : '';
    this.$emit('onChanged', 'plotOptions.series.compare', compareValue);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set(`rangeSelector.enabled`, this.defaultSetting.zoomEnabled);
    settingAsMap.set('plotOptions.series.compare', this.defaultSetting.compare);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private get compareOptions(): SelectOption[] {
    return [
      {
        id: 'value',
        displayName: 'Value'
      },
      {
        id: 'percent',
        displayName: 'Percentage'
      }
    ];
  }
}
</script>

<style lang="scss" scoped></style>
