<template>
  <PanelHeader header="Data Color" target-id="color-tab">
    <div class="color-tab">
      <div class="column-config-container">
        <InputSetting id="width-between-value" :value="gap" class="mb-2" label="Width between values" size="full" @onChanged="handleGapChanged" />
        <div class="row-config-container">
          <ColorSetting
            id="min-color"
            :default-color="defaultValues.minColor"
            :value="minColor"
            class="mb-2"
            label="Color of Min values"
            size="half"
            style="margin-right: 12px"
            @onChanged="handleMinColorChanged"
          />
          <ColorSetting
            id="max-color"
            :default-color="defaultValues.maxColor"
            :value="maxColor"
            class="mb-2"
            label="Color of Max values"
            size="half"
            @onChanged="handleMaxColorChanged"
          />
        </div>
        <ColorSetting
          id="none-color"
          :default-color="defaultValues.noneColor"
          :value="noneColor"
          class="mb-3"
          label="Color of None values"
          size="half"
          style="margin-right: 12px"
          enabledRevert="true"
          @onChanged="handleNoneColorChanged"
          @onRevert="handleRevert"
        />
      </div>
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { SeriesOptionData, SettingKey } from '@core/common/domain';
import { ChartType } from '@/shared';
import { get } from 'lodash';

@Component({ components: { PanelHeader } })
export default class HeatMapColorTab extends Vue {
  @Prop({ type: Object, required: false })
  private setting?: SeriesOptionData;
  @Prop({ required: false, type: String })
  private readonly widgetType?: ChartType;
  private readonly defaultValues = {
    gap: '0.5',
    minColor: '#F2E8D6',
    maxColor: '#FFAC05',
    noneColor: '#F2E8D6'
  };

  private get seriesKey(): string {
    switch (this.widgetType) {
      case ChartType.HeatMap:
        return 'heatmap';
      case ChartType.Map:
        return 'map';
      default:
        return 'series';
    }
  }

  private get gap(): string {
    return get(this.setting, `plotOptions.${this.seriesKey}.borderWidth`, this.defaultValues.gap);
  }

  private get minColor(): string {
    return this.setting?.colorAxis?.minColor ?? this.defaultValues.minColor;
  }

  private get maxColor(): string {
    return this.setting?.colorAxis?.maxColor ?? this.defaultValues.maxColor;
  }

  private get noneColor(): string {
    return this.setting?.colorAxis?.noneColor ?? this.defaultValues.noneColor;
  }

  created() {
    if (!this.setting) {
      this.handleRevert();
    }
  }

  private handleGapChanged(newGap: string) {
    return this.$emit('onChanged', `plotOptions.${this.seriesKey}.borderWidth`, newGap);
  }

  private handleMinColorChanged(newColor: string) {
    return this.$emit('onChanged', `colorAxis.minColor`, newColor);
  }

  private handleMaxColorChanged(newColor: string) {
    return this.$emit('onChanged', `colorAxis.maxColor`, newColor);
  }

  private handleNoneColorChanged(newColor: string) {
    return this.$emit('onChanged', `colorAxis.noneColor`, newColor);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set(`plotOptions.${this.seriesKey}.borderWidth`, this.defaultValues.gap);
    settingAsMap.set('colorAxis.maxColor', this.defaultValues.maxColor);
    settingAsMap.set('colorAxis.minColor', this.defaultValues.minColor);
    settingAsMap.set('colorAxis.noneColor', this.defaultValues.noneColor);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" scoped></style>
