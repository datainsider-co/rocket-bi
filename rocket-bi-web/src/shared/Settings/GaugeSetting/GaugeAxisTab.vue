<template>
  <PanelHeader header="Gauge Axis" target-id="gauge-axis-tab">
    <div class="row-config-container align-items-end">
      <InputSetting
        id="min-value-input"
        ref="minInput"
        placeholder="Input Min Value"
        applyFormatNumber
        :value="minValue"
        class="mr-2"
        label="Min"
        size="half"
        type="number"
        @onChanged="handleMinSaved"
      />
      <InputSetting
        id="max-value-input"
        ref="maxInput"
        placeholder="Input Max Value"
        applyFormatNumber
        :value="maxValue"
        label="Max"
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
      label="Font family"
      size="full"
      @onChanged="handleAxisFontChanged"
    />
    <div class="row-config-container">
      <ColorSetting
        id="axis-text-color"
        label="Font color"
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
        label="Text size"
        size="small"
        @onChanged="handleAxisFontSizeChanged"
      />
    </div>
    <InputSetting
      id="target-value-input"
      placeholder="Input Target Value"
      applyFormatNumber
      :value="targetValue"
      class="mb-3"
      label="Target"
      size="full"
      type="number"
      @onChanged="handleTargetSaved"
    />
    <ColorSetting
      id="target-color"
      :value="targetColor"
      class="mb-3"
      label="Target line color"
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
        label="Prefix"
        placeholder="Input Prefix"
        size="half"
        :maxLength="defaultSetting.prefixMaxLength"
        @onChanged="handlePrefixSaved"
      />
      <InputSetting
        id="x-axis-postfix-input"
        :value="postfixText"
        label="Postfix"
        placeholder="Input Postfix"
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
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { NumberUtils } from '@core/utils';
import InputSetting from '@/shared/Settings/Common/InputSetting.vue';
import { ChartOption, GaugeChartOption, SettingKey } from '@core/domain';
import { SelectOption } from '@/shared';
import { FontFamilyOptions } from '@/shared/Settings/Common/Options/FontFamilyOptions';
import { FontSizeOptions } from '@/shared/Settings/Common/Options/FontSizeOptions';

@Component({ components: { PanelHeader } })
export default class GaugeAxisTab extends Vue {
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
