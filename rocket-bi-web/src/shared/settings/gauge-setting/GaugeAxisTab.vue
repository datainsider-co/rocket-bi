<template>
  <PanelHeader header="Gauge Axis" target-id="gauge-axis-tab">
    <div class="row-config-container align-items-end">
      <InputSetting
        id="min-value-input"
        ref="minInput"
        applyFormatNumber
        :value="minValue"
        class="mr-2"
        :label="`${configSetting['min'].label}`"
        :hint="`${configSetting['min'].hint}`"
        :placeholder="`${configSetting['min'].placeholder}`"
        size="half"
        type="number"
        @onChanged="handleMinSaved"
      />
      <InputSetting
        id="max-value-input"
        ref="maxInput"
        :label="`${configSetting['max'].label}`"
        :hint="`${configSetting['max'].hint}`"
        :placeholder="`${configSetting['max'].placeholder}`"
        applyFormatNumber
        :value="maxValue"
        size="half"
        type="number"
        @onChanged="handleMaxSaved"
      />
    </div>
    <DropdownSetting
      id="axis-font-family"
      :enabledRevert="false"
      :options="fontOptions"
      :value="axisFont"
      class="mb-3"
      :label="`${configSetting['axis.fontFamily'].label}`"
      :hint="`${configSetting['axis.fontFamily'].hint}`"
      size="full"
      @onChanged="handleAxisFontChanged"
    />
    <div class="row-config-container">
      <ColorSetting
        id="axis-text-color"
        :label="`${configSetting['axis.color'].label}`"
        :hint="`${configSetting['axis.color'].hint}`"
        :value="axisColor"
        size="small"
        class="mr-2"
        @onChanged="handleAxisTextColorChanged"
        :defaultColor="defaultSetting.axisColor"
      />
      <DropdownSetting
        id="axis-font-size"
        :options="fontSizeOptions"
        :value="axisFontSize"
        :label="`${configSetting['axis.fontSize'].label}`"
        :hint="`${configSetting['axis.fontSize'].hint}`"
        size="small"
        @onChanged="handleAxisFontSizeChanged"
      />
    </div>
    <InputSetting
      id="target-value-input"
      applyFormatNumber
      :value="targetValue"
      class="mb-3"
      :label="`${configSetting['axis.target.value'].label}`"
      :hint="`${configSetting['axis.target.value'].hint}`"
      :placeholder="`${configSetting['axis.target.value'].placeholder}`"
      size="full"
      type="number"
      @onChanged="handleTargetSaved"
    />
    <ColorSetting
      id="target-color"
      :value="targetColor"
      class="mb-3"
      :label="`${configSetting['axis.target.color'].label}`"
      :hint="`${configSetting['axis.target.color'].hint}`"
      size="full"
      @onChanged="handleTargetLineColorChanged"
      :defaultColor="defaultSetting.targetColor"
    />
    <!--      Prefix setting-->
    <!--      Postfix setting-->
    <div class="row-config-container">
      <InputSetting
        id="x-axis-prefix-input"
        :value="prefixText"
        class="mr-2"
        :label="`${configSetting['axis.prefix'].label}`"
        :hint="`${configSetting['axis.prefix'].hint}`"
        :placeholder="`${configSetting['axis.prefix'].hint}`"
        size="half"
        :maxLength="defaultSetting.prefixMaxLength"
        @onChanged="handlePrefixSaved"
      />
      <InputSetting
        id="x-axis-postfix-input"
        :value="postfixText"
        :label="`${configSetting['axis.postfix'].label}`"
        :hint="`${configSetting['axis.postfix'].hint}`"
        :placeholder="`${configSetting['axis.postfix'].hint}`"
        size="half"
        @onChanged="handlePostfixSaved"
        :maxLength="defaultSetting.suffixMaxLength"
      />
    </div>
    <RevertButton class="mb-3 pr-3" style="text-align: right" @click="handleRevert" />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { NumberUtils } from '@core/utils';
import InputSetting from '@/shared/settings/common/InputSetting.vue';
import { ChartOption, GaugeChartOption, SettingKey } from '@core/common/domain';
import { SelectOption } from '@/shared';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { FontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';

@Component({ components: { PanelHeader } })
export default class GaugeAxisTab extends Vue {
  private readonly configSetting = window.chartSetting['gaugeAxis.tab'];

  @Ref()
  minInput?: InputSetting;
  @Ref()
  maxInput?: InputSetting;
  @Prop({ required: false, type: Object })
  private readonly setting!: GaugeChartOption;
  private readonly defaultSetting = {
    min: '0',
    max: '10000',
    target: '0',
    targetColor: '#2187FF',
    axisColor: 'var(--text-color)',
    axisFont: 'Roboto',
    axisFontSize: '10px',
    prefixMaxLength: 10,
    suffixMaxLength: 10,
    prefixText: '',
    postfixText: ''
  };

  private get minValue(): string {
    return `${this.setting?.options?.yAxis?.min}` ?? this.defaultSetting.min;
  }

  private get maxValue(): string {
    return `${this.setting?.options?.yAxis?.max}` ?? this.defaultSetting.max;
  }

  private get targetValue(): string {
    return `${this.setting?.options?.target}` ?? this.defaultSetting.target;
  }

  private get targetColor(): string {
    return this.setting.options.plotOptions?.gauge?.dial?.backgroundColor ?? '';
  }
  private get axisColor(): string {
    return this.setting?.options?.yAxis?.labels?.style?.color ?? this.defaultSetting.axisColor;
  }
  private get axisFont(): string {
    return this.setting?.options?.yAxis?.labels?.style?.fontFamily ?? this.defaultSetting.axisFont;
  }
  private get axisFontSize(): string {
    return this.setting?.options?.yAxis?.labels?.style?.fontSize ?? this.defaultSetting.axisFontSize;
  }

  private get prefixText(): string {
    return this.setting?.options?.yAxis?.prefix?.text ?? this.defaultSetting.prefixText;
  }

  private get postfixText(): string {
    return this.setting?.options?.yAxis?.postfix?.text ?? this.defaultSetting.postfixText;
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('target', this.defaultSetting.target);
    settingAsMap.set('yAxis.max', this.defaultSetting.max);
    settingAsMap.set('yAxis.min', this.defaultSetting.min);
    settingAsMap.set('yAxis.labels.style.color', this.defaultSetting.axisColor);
    settingAsMap.set('yAxis.labels.style.fontFamily', this.defaultSetting.axisFont);
    settingAsMap.set('yAxis.labels.style.fontSize', this.defaultSetting.axisFontSize);
    settingAsMap.set('yAxis.prefix.text', this.defaultSetting.prefixText);
    settingAsMap.set('yAxis.postfix.text', this.defaultSetting.postfixText);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleMinSaved(newValue: string) {
    const minValue = NumberUtils.toNumber(newValue);
    const maxValue = NumberUtils.toNumber(this.maxValue);
    if (minValue < maxValue) {
      this.$emit('onChanged', 'yAxis.min', minValue);
    } else {
      this.minInput?.setTextInput((maxValue - 1).toString());
    }
  }

  private handleMaxSaved(newValue: string) {
    const maxValue = NumberUtils.toNumber(newValue);
    const minValue = NumberUtils.toNumber(this.minValue);
    if (maxValue > minValue) {
      this.$emit('onChanged', 'yAxis.max', maxValue);
    } else {
      this.maxInput?.setTextInput((minValue + 1).toString());
    }
  }

  private handleTargetSaved(newValue: string) {
    this.$emit('onChanged', 'target', +newValue);
  }

  private handleTargetLineColorChanged(newColor: string) {
    this.$emit('onChanged', 'plotOptions.gauge.dial.backgroundColor', newColor);
  }

  private handleAxisTextColorChanged(newColor: string) {
    this.$emit('onChanged', 'yAxis.labels.style.color', newColor);
  }
  private handleAxisFontChanged(newFont: string) {
    this.$emit('onChanged', 'yAxis.labels.style.fontFamily', newFont);
  }

  private handleAxisFontSizeChanged(newFontSize: string) {
    this.$emit('onChanged', 'yAxis.labels.style.fontSize', newFontSize);
  }

  private get fontOptions(): SelectOption[] {
    return FontFamilyOptions;
  }

  private get fontSizeOptions(): SelectOption[] {
    return FontSizeOptions;
  }

  private handlePrefixSaved(newText: string) {
    return this.$emit('onChanged', 'yAxis.prefix.text', newText);
  }

  private handlePostfixSaved(newText: string) {
    return this.$emit('onChanged', 'yAxis.postfix.text', newText);
  }
}
</script>

<style lang="scss" scoped></style>
