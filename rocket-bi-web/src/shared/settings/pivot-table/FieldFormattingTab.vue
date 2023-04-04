<template>
  <PanelHeader header="Field Formatting" target-id="field-formatting-tab">
    <div class="field-formatting-tab">
      <DropdownSetting
        id="column-formatting"
        :options="columnOptions"
        :label="`${configSetting['column.select'].label}`"
        :hint="`${configSetting['column.select'].hint}`"
        :value="selectedColumn"
        class="mb-2"
        size="full"
        @onChanged="handleColumnSelect"
      />
      <div class="row-config-container">
        <ColorSetting
          id="field-font-color"
          :default-color="defaultSetting.style.color"
          :value="fontColor"
          :label="`${configSetting['fieldFormatting.style.color'].label}`"
          :hint="`${configSetting['fieldFormatting.style.color'].hint}`"
          size="small"
          style="margin-right: 8px"
          @onChanged="handleFontColorChanged"
        />
        <ColorSetting
          id="field-background"
          :default-color="defaultSetting.background"
          :value="background"
          class="mr-2"
          :label="`${configSetting['fieldFormatting.backgroundColor'].label}`"
          :hint="`${configSetting['fieldFormatting.backgroundColor'].hint}`"
          size="small"
          @onChanged="handleBackgroundChanged"
        />
        <DropdownSetting
          id="field-align"
          :options="alignOptions"
          :value="fieldAlign"
          class="mr-2"
          :label="`${configSetting['fieldFormatting.align'].label}`"
          :hint="`${configSetting['fieldFormatting.align'].hint}`"
          size="small"
          @onChanged="handleAlignChanged"
        />
      </div>
      <ToggleSetting
        id="apply-format-header"
        :value="applyHeader"
        class="mb-2"
        :label="`${configSetting['fieldFormatting.applyHeader'].label}`"
        :hint="`${configSetting['fieldFormatting.applyHeader'].hint}`"
        @onChanged="handleApplyHeader"
      />
      <ToggleSetting
        id="apply-format-values"
        :value="applyValues"
        class="mb-2"
        :label="`${configSetting['fieldFormatting.applyValues'].label}`"
        :hint="`${configSetting['fieldFormatting.applyValues'].hint}`"
        @onChanged="handleApplyValues"
      />
      <ToggleSetting
        id="apply-format-total"
        :value="applyTotals"
        class="mb-2"
        :label="`${configSetting['fieldFormatting.applyTotals'].label}`"
        :hint="`${configSetting['fieldFormatting.applyTotals'].hint}`"
        @onChanged="handleApplyTotals"
      />
      <div class="row-config-container">
        <DropdownSetting
          id="column-display-unit"
          :options="displayUnitOptions"
          :value="displayUnit"
          class="mr-2"
          :label="`${configSetting['fieldFormatting.displayUnit'].label}`"
          :hint="`${configSetting['fieldFormatting.displayUnit'].hint}`"
          size="half"
          @onChanged="handleDisplayUnitChanged"
        />
        <DropdownSetting
          id="column-precision-setting"
          :options="precisionOptions"
          :value="precision"
          :label="`${configSetting['fieldFormatting.precision'].label}`"
          :hint="`${configSetting['fieldFormatting.precision'].hint}`"
          size="small"
          @onChanged="handlePrecisionChanged"
        />
      </div>
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevertDefault" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { PivotTableChartOption, TableColumn, SettingKey, ChartOption } from '@core/common/domain';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { SelectOption } from '@/shared';
import { get } from 'lodash';
import { AlignOptions } from '@/shared/settings/common/options/AlignOptions';
import { DisplayUnitOptions, PrecisionOptions } from '@/shared/settings/common/options';
import { MetricNumberMode } from '@/utils';

@Component({ components: { PanelHeader } })
export default class FieldFormattingTab extends Vue {
  private readonly configSetting = window.chartSetting['fieldFormatting.tab'];

  @Prop({ required: false, type: Object })
  private readonly setting!: PivotTableChartOption;

  @Prop({ required: true, type: Array })
  private readonly columns!: TableColumn[];

  private selectedColumn: string = this.columnOptions[0].id.toString();

  private readonly alignOptions = AlignOptions;
  private defaultSetting = {
    background: '#2f3240',
    align: 'left',
    style: {
      color: ChartOption.getThemeTextColor()
    },
    applyHeader: false,
    applyTotals: false,
    applyValues: false,
    displayUnit: MetricNumberMode.None,
    precision: 2
  };

  private get columnOptions(): SelectOption[] {
    return this.columns.map(column => ({
      displayName: column.name,
      id: column.normalizeName
    }));
  }

  private get applyHeader(): boolean {
    return get(this.setting, `options.fieldFormatting.${this.selectedColumn}.applyHeader`, this.defaultSetting?.applyHeader ?? true);
  }

  private get applyValues(): boolean {
    return get(this.setting, `options.fieldFormatting.${this.selectedColumn}.applyValues`, this.defaultSetting?.applyValues ?? true);
  }

  private get applyTotals(): any {
    return get(this.setting, `options.fieldFormatting.${this.selectedColumn}.applyTotals`, this.defaultSetting?.applyTotals ?? true);
  }

  private get fontColor(): string {
    return get(this.setting, `options.fieldFormatting.${this.selectedColumn}.style.color`, this.defaultSetting.style.color);
  }

  private get background(): string {
    return get(this.setting, `options.fieldFormatting.${this.selectedColumn}.backgroundColor`, this.defaultSetting.background);
  }

  private get fieldAlign() {
    return get(this.setting, `options.fieldFormatting.${this.selectedColumn}.align`, this.defaultSetting.align);
  }

  private get displayUnitOptions(): SelectOption[] {
    return DisplayUnitOptions;
  }

  private get displayUnit(): string {
    const generalDisplayUnit = get(this.setting, `options.plotOptions.table.dataLabels.displayUnit`);
    const fieldDisplayUnit = get(this.setting, `options.fieldFormatting.${this.selectedColumn}.displayUnit`);
    return fieldDisplayUnit ?? generalDisplayUnit ?? MetricNumberMode.None;
  }

  private get precision() {
    return get(this.setting, `options.fieldFormatting.${this.selectedColumn}.precision`, this.defaultSetting.precision);
  }

  private get precisionOptions() {
    return PrecisionOptions;
  }

  private handleColumnSelect(id: string) {
    this.selectedColumn = id;
    this.$forceUpdate();
  }

  private handleApplyHeader(enabled: boolean) {
    const settingAsMap = new Map<SettingKey, any>();
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.applyHeader`, enabled);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.backgroundColor`, this.background);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.style.color`, this.fontColor);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.align`, this.fieldAlign);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleApplyTotals(enabled: boolean) {
    const settingAsMap = new Map<SettingKey, any>();
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.applyTotals`, enabled);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.backgroundColor`, this.background);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.style.color`, this.fontColor);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.align`, this.fieldAlign);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleApplyValues(enabled: boolean) {
    const settingAsMap = new Map<SettingKey, any>();
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.applyValues`, enabled);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.backgroundColor`, this.background);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.style.color`, this.fontColor);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.align`, this.fieldAlign);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleFontColorChanged(newColor: string) {
    return this.$emit('onChanged', `fieldFormatting.${this.selectedColumn}.style.color`, newColor);
  }

  private handleBackgroundChanged(newColor: string) {
    return this.$emit('onChanged', `fieldFormatting.${this.selectedColumn}.backgroundColor`, newColor);
  }

  private handleAlignChanged(newAlign: string) {
    return this.$emit('onChanged', `fieldFormatting.${this.selectedColumn}.align`, newAlign);
  }

  private handleRevertDefault(): void {
    const settingAsMap = new Map<SettingKey, any>();
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.applyHeader`, this.defaultSetting.applyHeader);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.applyTotals`, this.defaultSetting.applyTotals);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.applyValues`, this.defaultSetting.applyValues);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.backgroundColor`, this.defaultSetting.background);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.style.color`, this.defaultSetting.style.color);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.align`, this.defaultSetting.align);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.displayUnit`, this.defaultSetting.displayUnit);
    settingAsMap.set(`fieldFormatting.${this.selectedColumn}.precision`, this.defaultSetting.precision);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleDisplayUnitChanged(newDisplayUnit: string) {
    return this.$emit('onChanged', `fieldFormatting.${this.selectedColumn}.displayUnit`, newDisplayUnit);
  }

  private handlePrecisionChanged(newPrecision: number) {
    return this.$emit('onChanged', `fieldFormatting.${this.selectedColumn}.precision`, newPrecision);
  }
}
</script>

<style lang="scss" src="../common/TabStyle.scss"></style>
