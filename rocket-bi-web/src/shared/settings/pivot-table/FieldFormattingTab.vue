<template>
  <PanelHeader header="Field Formatting" target-id="field-formatting-tab">
    <div class="field-formatting-tab">
      <DropdownSetting id="column-formatting" :options="columnOptions" :value="selectedColumn" class="mb-2" size="full" @onChanged="handleColumnSelect" />
      <div class="row-config-container">
        <ColorSetting
          id="field-font-color"
          :default-color="defaultSetting.style.color"
          :value="fontColor"
          label="Font color"
          size="small"
          style="margin-right: 8px"
          @onChanged="handleFontColorChanged"
        />
        <ColorSetting
          id="field-background"
          :default-color="defaultSetting.background"
          :value="background"
          class="mr-2"
          label="Background color"
          size="small"
          @onChanged="handleBackgroundChanged"
        />
        <DropdownSetting
          id="field-align"
          :options="alignOptions"
          :value="fieldAlign"
          class="mr-2"
          label="Alignment"
          size="small"
          @onChanged="handleAlignChanged"
        />
      </div>
      <ToggleSetting id="apply-format-header" :value="applyHeader" class="mb-2" label="Apply to header" @onChanged="handleApplyHeader" />
      <ToggleSetting id="apply-format-values" :value="applyValues" class="mb-2" label="Apply to values" @onChanged="handleApplyValues" />
      <ToggleSetting id="apply-format-total" :value="applyTotals" class="mb-2" label="Apply to total" @onChanged="handleApplyTotals" />
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

@Component({ components: { PanelHeader } })
export default class FieldFormattingTab extends Vue {
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
    applyValues: false
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
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" src="../common/TabStyle.scss"></style>
