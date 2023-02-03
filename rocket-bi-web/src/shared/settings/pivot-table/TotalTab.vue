<template>
  <PanelHeader header="Total" target-id="total-tab">
    <div class="total-tab">
      <ToggleSetting
        id="total-enable"
        :value="totalEnabled"
        class="mb-3 group-config"
        :label="`${configSetting['total.enabled'].label}`"
        :hint="`${configSetting['total.enabled'].hint}`"
        @onChanged="handleTotalEnabled"
      />
      <InputSetting
        id="total-label"
        :value="label"
        class="mb-3"
        :label="`${configSetting['total.label.text'].label}`"
        :hint="`${configSetting['total.label.text'].hint}`"
        size="full"
        @onChanged="handleTotalLabelChanged"
      />
      <DropdownSetting
        id="total-font-family"
        :options="fontOptions"
        :value="font"
        class="mb-2"
        :label="`${configSetting['total.label.style.fontFamily'].label}`"
        :hint="`${configSetting['total.label.style.fontFamily'].hint}`"
        size="full"
        @onChanged="handleFontChanged"
      />
      <div class="row-config-container">
        <ColorSetting
          id="total-font-family-color"
          :default-color="defaultStyle.fontFamily"
          :value="fontFamilyColor"
          style="margin-right: 8px"
          size="small"
          :label="`${configSetting['total.label.style.color'].label}`"
          :hint="`${configSetting['total.label.style.color'].hint}`"
          @onChanged="handleFontFamilyColorChanged"
        />
        <DropdownSetting
          id="total-font-family-size"
          :options="fontSizeOptions"
          :value="fontSize"
          class="mr-3"
          size="small"
          :label="`${configSetting['total.label.style.fontSize'].label}`"
          :hint="`${configSetting['total.label.style.fontSize'].hint}`"
          @onChanged="handleFontSizeChanged"
        />
        <AlignSetting
          id="total-align"
          :value="labelAlign"
          :label="`${configSetting['total.label.align'].label}`"
          :hint="`${configSetting['total.label.align'].hint}`"
          @onChanged="handleAlignChanged"
        />
      </div>
      <ColorSetting
        id="total-background-color"
        :default-color="defaultStyle.backgroundColor"
        :value="backgroundColor"
        class="mb-3"
        enabledRevert="true"
        :label="`${configSetting['total.backgroundColor'].label}`"
        :hint="`${configSetting['total.backgroundColor'].hint}`"
        size="half"
        @onChanged="handleBackgroundColorChanged"
        @onRevert="handleRevert"
      />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartOption, PivotTableChartOption, SettingKey } from '@core/common/domain';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { FontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';

@Component({ components: { PanelHeader } })
export default class TotalTab extends Vue {
  private readonly configSetting = window.chartSetting['value.tab'];

  @Prop({ required: false, type: Object })
  private readonly setting!: PivotTableChartOption;
  private fontOptions = FontFamilyOptions;
  private readonly fontSizeOptions = FontSizeOptions;
  private readonly defaultStyle = {
    enabled: true,
    color: ChartOption.getThemeTextColor(),
    backgroundColor: ChartOption.getTableTotalColor(),
    label: 'Total',
    fontFamily: 'Roboto',
    fontSize: '12px',
    align: 'left'
  };

  private get label(): string {
    return this.setting?.options.total?.label?.text ?? this.defaultStyle.label;
  }

  private get totalEnabled(): boolean {
    return this.setting?.options?.total?.enabled ?? this.defaultStyle.enabled;
  }

  private get fontColor(): string {
    return this.setting?.options?.total?.label?.style?.color ?? this.defaultStyle.color;
  }

  private get backgroundColor(): string {
    return this.setting?.options?.total?.backgroundColor ?? this.defaultStyle.backgroundColor;
  }

  private get font(): string {
    return this.setting?.options?.total?.label?.style?.fontFamily ?? this.defaultStyle.fontFamily;
  }

  private get fontFamilyColor(): string {
    return this.setting?.options?.total?.label?.style?.color ?? this.defaultStyle.color;
  }

  private get fontSize(): string {
    return this.setting?.options?.total?.label?.style?.fontSize ?? this.defaultStyle.fontSize;
  }

  private get labelAlign(): string {
    return this.setting?.options?.total?.label?.align ?? this.defaultStyle.align;
  }

  private emit(key: string, value: any): void {
    this.$emit('onChanged', key, value);
  }

  private handleTotalEnabled(newValue: boolean) {
    this.emit('total.enabled', newValue);
  }

  private handleTotalLabelChanged(label: string) {
    this.emit('total.label.text', label);
  }

  private handleFontColorChanged(newColor: string) {
    this.emit('total.label.style.color', newColor);
  }

  private handleBackgroundColorChanged(newColor: string) {
    this.emit('total.backgroundColor', newColor);
  }

  private handleFontChanged(newValue: string) {
    return this.$emit('onChanged', 'total.label.style.fontFamily', newValue);
  }

  private handleFontFamilyColorChanged(newColor: string) {
    return this.$emit('onChanged', 'total.label.style.color', newColor);
  }

  private handleFontSizeChanged(newValue: string) {
    return this.$emit('onChanged', 'total.label.style.fontSize', newValue);
  }

  private handleAlignChanged(newValue: string) {
    return this.$emit('onChanged', 'total.label.align', newValue);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    // settingAsMap.set('total.label.text', this.defaultStyle.label);
    settingAsMap.set('total.label.style.color', this.defaultStyle.color);
    settingAsMap.set('total.enabled', this.defaultStyle.enabled);
    settingAsMap.set('total.label.style.fontFamily', this.defaultStyle.fontFamily);
    settingAsMap.set('total.label.style.fontSize', this.defaultStyle.fontSize);
    settingAsMap.set('total.label.align', this.defaultStyle.align);
    settingAsMap.set('total.backgroundColor', this.defaultStyle.backgroundColor);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" src="../common/TabStyle.scss"></style>
