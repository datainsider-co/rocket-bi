<template>
  <PanelHeader header="Sankey" target-id="data-label-tab">
    <div class="data-label-tab">
      <DropdownSetting
        id="sankey-display"
        :options="displayOptions"
        :value="display"
        class="mb-2"
        :label="`${configSetting['sankey.layout'].label}`"
        :hint="`${configSetting['sankey.layout'].hint}`"
        @onChanged="handleDisplayChanged"
      />
      <ToggleSetting
        id="data-label-enable"
        :value="enabled"
        class="mb-3 group-config"
        :label="`${configSetting['label.enabled'].label}`"
        :hint="`${configSetting['label.enabled'].hint}`"
        @onChanged="handleDataLabelEnabled"
      />
      <DropdownSetting
        id="data-label-font-family"
        :options="fontOptions"
        :style="labelSettingStyle"
        :value="font"
        class="mb-2"
        :label="`${configSetting['label.fontFamily'].label}`"
        :hint="`${configSetting['label.fontFamily'].hint}`"
        size="full"
        @onChanged="handleFontChanged"
      />
      <div :style="labelSettingStyle" class="row-config-container">
        <ColorSetting
          id="data-label-font-color"
          :default-color="defaultSetting.color"
          :value="color"
          :label="`${configSetting['label.color'].label}`"
          :hint="`${configSetting['label.color'].hint}`"
          class="mr-2"
          size="small"
          @onChanged="handleColorChanged"
        />
        <DropdownSetting
          id="data-label-font-size"
          :options="fontSizeOptions"
          :label="`${configSetting['label.fontSize'].label}`"
          :hint="`${configSetting['label.fontSize'].hint}`"
          :value="fontSize"
          size="small"
          @onChanged="handleFontSizeChanged"
        />
      </div>
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { ChartType, SelectOption } from '@/shared';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { SecondaryFontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';
import { LabelFormatOptions } from '@/shared/settings/common/options/LabelFormatOptions';
import { DataLabelFormatterMode } from '@chart/PieChart';
import { get } from 'lodash';
import { MetricNumberMode } from '@/utils';
import SliderSetting from '@/shared/settings/common/SliderSetting.vue';
import { enableCss } from '@/shared/settings/common/install';
import { ChartOption, SeriesOptionData, SettingKey } from '@core/common/domain';

@Component({ components: { SliderSetting, PanelHeader } })
export default class SankeyDataLabelTab extends Vue {
  private readonly configSetting = window.chartSetting['sankey.tab'];

  @Prop({ required: false, type: Object })
  private readonly setting!: SeriesOptionData;
  @Prop({ required: false, type: String })
  private readonly widgetType!: ChartType;
  private readonly defaultSetting = {
    enabled: false,
    labelFormat: DataLabelFormatterMode.NameAndValue,
    fontFamily: ChartOption.getSecondaryFontFamily(),
    color: ChartOption.getPrimaryTextColor(),
    fontSize: '12px',
    displayUnit: MetricNumberMode.Default,
    distance: 30,
    position: false,
    display: 'sankey'
  };

  private readonly displayOptions: SelectOption[] = [
    {
      id: 'sankey',
      displayName: 'Normal'
    },
    {
      id: 'dependencywheel',
      displayName: 'Wheel'
    }
  ];

  private get enabled(): boolean {
    return get(this.setting, `plotOptions.series.dataLabels[0].enabled`, this.defaultSetting.enabled);
  }

  private get labelFormat(): DataLabelFormatterMode {
    return get(this.setting, `plotOptions.series.dataLabels[0].labelFormat`, this.defaultSetting.labelFormat);
  }

  private get labelFormatOptions(): SelectOption[] {
    return LabelFormatOptions;
  }

  private get font(): string {
    return get(this.setting, `plotOptions.series.dataLabels[0].style.fontFamily`, this.defaultSetting.fontFamily);
  }

  private get color(): string {
    return get(this.setting, `plotOptions.series.dataLabels[0].style.color`, this.defaultSetting.color);
  }

  private get fontSize(): string {
    return get(this.setting, `plotOptions.series.dataLabels[0].style.fontSize`, this.defaultSetting.fontSize);
  }

  private get fontOptions(): SelectOption[] {
    return FontFamilyOptions;
  }

  private get fontSizeOptions(): SelectOption[] {
    return SecondaryFontSizeOptions;
  }

  private get labelSettingStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enabled)
    } as CSSStyleDeclaration;
  }

  private get display(): string {
    return get(this.setting, 'chart.type', this.defaultSetting.display);
  }

  private handleDataLabelEnabled(enabled: boolean) {
    return this.$emit('onChanged', `plotOptions.series.dataLabels[0].enabled`, enabled);
  }

  private handleFontChanged(newFont: string) {
    return this.$emit('onChanged', `plotOptions.series.dataLabels[0].style.fontFamily`, newFont);
  }

  private handleDisplayChanged(newDisplay: string) {
    return this.$emit('onChanged', `chart.type`, newDisplay);
  }

  private handleColorChanged(newColor: string) {
    return this.$emit('onChanged', `plotOptions.series.dataLabels[0].style.color`, newColor);
  }

  private handleFontSizeChanged(newFontSize: string) {
    this.$emit('onChanged', `plotOptions.series.dataLabels[0].style.fontSize`, newFontSize);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set(`plotOptions.series.dataLabels[0].enabled`, this.defaultSetting.enabled);
    settingAsMap.set(`plotOptions.series.dataLabels[0].style.fontSize`, this.defaultSetting.fontSize);
    settingAsMap.set(`plotOptions.series.dataLabels[0].style.color`, this.defaultSetting.color);
    settingAsMap.set(`plotOptions.series.dataLabels[0].style.fontFamily`, this.defaultSetting.fontFamily);
    settingAsMap.set(`chart.type`, this.defaultSetting.display);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" scoped></style>
