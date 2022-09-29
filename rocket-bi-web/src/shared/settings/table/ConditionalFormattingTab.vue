<template>
  <PanelHeader header="Conditional Formatting" target-id="field-formatting-tab">
    <div class="field-formatting-tab">
      <DropdownSetting id="conditional-selection" :options="columnOptions" :value="selectedColumnId" size="full" @onSelected="handleSelectedItem" />
      <ToggleTextButtonSetting
        :value="applyBackgroundColor"
        buttonId="conditional-background-button"
        toggleId="conditional-background-toggle"
        toggleLabel="Background color"
        @onChanged="handleApplyBackgroundSetting"
        @onClickedButton="handleAdvanceBackgroundSetting"
      />
      <ToggleTextButtonSetting
        :value="applyColor"
        buttonId="conditional-color-button"
        toggleId="conditional-color-toggle"
        toggleLabel="Font color"
        @onChanged="handleApplyColorSetting"
        @onClickedButton="handleAdvanceColorSetting"
      />
      <ToggleTextButtonSetting
        v-if="isShowDataBar"
        :value="applyDataBar"
        buttonId="conditional-data-bar-button"
        toggleId="conditional-data-bar-toggle"
        toggleLabel="Data bars"
        @onChanged="handleApplyDataBarSetting"
        @onClickedButton="handleAdvanceDataBarSetting"
      />
      <ToggleTextButtonSetting
        :value="applyIcon"
        buttonId="conditional-icon-button"
        toggleId="conditional-icon-toggle"
        toggleLabel="Icons"
        @onChanged="handleApplyIconSetting"
        @onClickedButton="handleAdvanceIconSetting"
      />
    </div>
    <ConditionalFormattingModal id="formatting-modal" ref="modal" :size="modalSize" :title="titleFormattingModal">
      <template v-if="currentFormattingType === FormattingType.BackgroundColor">
        <ColorFormatSetting ref="backgroundSetting" :functionType="functionType" :value="backgroundColorFormatting" />
      </template>
      <template v-if="currentFormattingType === FormattingType.FontColor">
        <ColorFormatSetting ref="colorSetting" :functionType="functionType" :value="colorFormatting" />
      </template>
      <template v-if="currentFormattingType === FormattingType.DataBars">
        <DataBarSetting ref="dataBarSetting" :value="dataBarFormatting"></DataBarSetting>
      </template>
      <template v-if="currentFormattingType === FormattingType.Icon">
        <IconFormatSetting ref="iconSetting" :functionType="functionType" :value="iconFormatting"></IconFormatSetting>
      </template>
    </ConditionalFormattingModal>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { SelectOption } from '@/shared';
import { ChartUtils, ListUtils } from '@/utils';
import { get } from 'lodash';
import ConditionalFormattingModal, { ConditionalModalSize } from '@/shared/settings/common/ConditionalFormattingModal.vue';
import ColorFormatSetting from '@/shared/settings/common/conditional-formatting/ColorFormatSetting.vue';
import { ObjectUtils } from '@core/utils';
import { ModalCallback } from '@/screens/confirmation/view/ConfirmationModal.vue';
import { FormattingOptions, FunctionFormattingType } from '@/shared/settings/common/conditional-formatting/FormattingOptions';
import DataBarSetting from '@/shared/settings/common/conditional-formatting/DataBarSetting.vue';
import IconFormatSetting from '@/shared/settings/common/conditional-formatting/IconFormatSetting.vue';
import {
  SettingKey,
  DataBarFormatting,
  IconFormatting,
  ColorFormatting,
  TableColumn,
  ChartOptionData,
  TableOptionData,
  PivotTableOptionData
} from '@core/common/domain';

enum FormattingType {
  BackgroundColor = 'Background Color',
  FontColor = 'Font Color',
  Icon = 'Icon',
  DataBars = 'Data bars'
}

type SettingKeyType = 'backgroundColor' | 'color' | 'icon' | 'dataBar';

@Component({
  components: {
    IconFormatSetting,
    DataBarSetting,
    ColorFormatSetting,
    ConditionalFormattingModal,
    PanelHeader
  }
})
export default class ConditionalFormattingTab extends Vue {
  @Prop({ required: true })
  private readonly options!: PivotTableOptionData | TableOptionData;
  @Prop({ required: true, type: Array, default: [] })
  private readonly columns!: TableColumn[];

  @Prop({ required: true })
  private readonly functionType!: FunctionFormattingType;

  @Prop({ required: true })
  private readonly canShowDataBar!: (column: TableColumn) => boolean;

  private isShowDataBar = false;

  private selectedColumnId = '';
  private selectedColumn: TableColumn | null = null;
  private FormattingType = FormattingType;
  private currentFormattingType = FormattingType.BackgroundColor;
  @Ref()
  private readonly modal?: ConditionalFormattingModal;

  @Ref()
  private readonly backgroundSetting?: ColorFormatSetting;

  @Ref()
  private readonly colorSetting?: ColorFormatSetting;

  @Ref()
  private readonly iconSetting?: IconFormatSetting;

  @Ref()
  private readonly dataBarSetting?: DataBarSetting;

  private get columnOptions(): SelectOption[] {
    return this.columns.map(column => ({
      displayName: column.name,
      id: column.normalizeName,
      data: column
    }));
  }

  private get applyBackgroundColor(): boolean {
    return get(this.options, `conditionalFormatting.${this.selectedColumnId}.backgroundColor.enabled`, false);
  }

  private get applyColor(): boolean {
    return get(this.options, `conditionalFormatting.${this.selectedColumnId}.color.enabled`, false);
  }

  private get applyDataBar(): boolean {
    return get(this.options, `conditionalFormatting.${this.selectedColumnId}.dataBar.enabled`, false);
  }

  private get applyIcon(): boolean {
    return get(this.options, `conditionalFormatting.${this.selectedColumnId}.icon.enabled`, false);
  }

  private get backgroundColorFormatting(): ColorFormatting | null {
    return get(this.options, `conditionalFormatting.${this.selectedColumnId}.backgroundColor`) ?? null;
  }

  private get colorFormatting(): ColorFormatting | null {
    return get(this.options, `conditionalFormatting.${this.selectedColumnId}.color`) ?? null;
  }

  private get dataBarFormatting(): DataBarFormatting | null {
    return get(this.options, `conditionalFormatting.${this.selectedColumnId}.dataBar`) ?? null;
  }

  private get iconFormatting(): IconFormatting | null {
    return get(this.options, `conditionalFormatting.${this.selectedColumnId}.icon`) ?? null;
  }

  private get titleFormattingModal() {
    return this.currentFormattingType + ' - ' + this.selectedColumn?.name;
  }

  private get modalSize() {
    switch (this.currentFormattingType) {
      case FormattingType.DataBars:
        return ConditionalModalSize.Small;
      default:
        return ConditionalModalSize.Large;
    }
  }

  private static canUseDefaultSetting(column: TableColumn | null | undefined): boolean {
    if (column) {
      return ChartUtils.isAggregationFunction(column.function) || ChartUtils.isColumnNumber(column);
    } else {
      return false;
    }
  }

  private static createSettingAsMap(table: TableColumn, key: 'backgroundColor' | 'color' | 'icon' | 'dataBar', colorFormatting: any): Map<string, any> {
    const vizData: ChartOptionData = {
      conditionalFormatting: {
        [table.normalizeName]: {
          [key]: colorFormatting
        }
      }
    };

    return ObjectUtils.flatKey(vizData);
  }

  mounted() {
    this.selectDefaultOption();
  }

  private handleSelectedItem(option: SelectOption) {
    this.selectedColumnId = option.id.toString();
    this.selectedColumn = option?.data;
    this.isShowDataBar = this.canShowDataBar(this.selectedColumn!);
  }

  private handleApplyBackgroundSetting(enabled: boolean) {
    if (enabled) {
      if (ConditionalFormattingTab.canUseDefaultSetting(this.selectedColumn)) {
        this.applyDefaultBackgroundSetting();
      } else {
        this.controlEnableSetting('backgroundColor', true);
        this.showModal(FormattingType.BackgroundColor, {
          onCancel: () => this.controlEnableSetting('backgroundColor', false),
          onOk: this.handleSubmitBackgroundSetting
        });
      }
    } else {
      this.controlEnableSetting('backgroundColor', false, true);
    }
  }

  private applyDefaultBackgroundSetting() {
    const settingAsMap = ConditionalFormattingTab.createDefaultColorSetting('backgroundColor', this.selectedColumn!);
    this.emitMultipleChanged(settingAsMap, true);
  }

  private emitMultipleChanged(settingAsMap: Map<SettingKey, any>, canQuery?: boolean) {
    settingAsMap.set(`conditionalFormatting.${this.selectedColumnId}.label`, this.selectedColumn?.name);
    this.$emit('onMultipleChanged', settingAsMap, canQuery);
  }

  private clearConditionalFormattingKey(key: SettingKeyType) {
    this.$emit('onClearSetting', `conditionalFormatting.${this.selectedColumnId}.${key}`);
  }

  private handleAdvanceBackgroundSetting(): void {
    this.showModal(FormattingType.BackgroundColor, {
      onOk: this.handleSubmitBackgroundSetting
    });
  }

  private handleApplyColorSetting(enabled: boolean) {
    if (enabled) {
      if (ConditionalFormattingTab.canUseDefaultSetting(this.selectedColumn)) {
        this.applyDefaultColorSetting();
      } else {
        this.controlEnableSetting('color', true);
        this.showModal(FormattingType.FontColor, {
          onCancel: () => this.controlEnableSetting('color', false),
          onOk: this.handleSubmitColorSetting
        });
      }
    } else {
      this.controlEnableSetting('color', false, true);
    }
  }

  private handleAdvanceColorSetting(): void {
    this.showModal(FormattingType.FontColor, {
      onOk: this.handleSubmitColorSetting
    });
  }

  private handleApplyDataBarSetting(enabled: boolean) {
    if (enabled) {
      const defaultDataBar = DataBarSetting.getDefaultDataDar();
      const settingAsMap = ConditionalFormattingTab.createSettingAsMap(this.selectedColumn!, 'dataBar', defaultDataBar);
      this.emitMultipleChanged(settingAsMap);
    } else {
      this.controlEnableSetting('dataBar', false);
    }
    // fixme fill here!
  }

  private handleAdvanceDataBarSetting(): void {
    this.showModal(FormattingType.DataBars, {
      onOk: this.handleSubmitDataBar
    });
  }

  private handleApplyIconSetting(enabled: boolean) {
    if (enabled) {
      if (ConditionalFormattingTab.canUseDefaultSetting(this.selectedColumn!)) {
        this.applyDefaultIconSetting(this.selectedColumn!);
      } else {
        this.controlEnableSetting('icon', true);
        this.showModal(FormattingType.Icon, {
          onCancel: () => this.controlEnableSetting('icon', false),
          onOk: this.handleSubmitIconSetting
        });
      }
    } else {
      this.controlEnableSetting('icon', false, true);
    }
  }

  private controlEnableSetting(key: SettingKeyType, enabled: boolean, canQuery?: boolean) {
    const settingAsMap = new Map<SettingKey, any>();
    settingAsMap.set(`conditionalFormatting.${this.selectedColumnId}.${key}.enabled`, enabled);
    this.emitMultipleChanged(settingAsMap, canQuery);
  }

  private handleAdvanceIconSetting(): void {
    this.showModal(FormattingType.Icon, {
      onOk: this.handleSubmitIconSetting
    });
  }

  private selectDefaultOption() {
    const firstOption = ListUtils.getHead(this.columnOptions);
    if (firstOption) {
      this.selectedColumn = firstOption.data;
      this.selectedColumnId = firstOption.id.toString();
      this.isShowDataBar = this.canShowDataBar(firstOption.data);
    }
  }

  private showModal(type: FormattingType, callback?: ModalCallback) {
    this.currentFormattingType = type;
    this.modal?.show(callback);
  }

  private static createDefaultColorSetting(colorKey: SettingKeyType, selectedColumn: TableColumn): Map<string, any> {
    const defaultColorFormatting: ColorFormatting = FormattingOptions.getDefaultColorFormatting();
    defaultColorFormatting.baseOnField = selectedColumn.function.field;
    defaultColorFormatting.summarization = selectedColumn.function.className;
    return ConditionalFormattingTab.createSettingAsMap(selectedColumn, colorKey, defaultColorFormatting);
  }

  private handleSubmitBackgroundSetting(event: MouseEvent) {
    if (this.backgroundSetting && this.backgroundSetting.validate()) {
      const settingAsMap = ConditionalFormattingTab.createSettingAsMap(this.selectedColumn!, 'backgroundColor', this.backgroundSetting.getColorFormatting());
      this.clearConditionalFormattingKey('backgroundColor');
      this.emitMultipleChanged(settingAsMap, true);
    } else {
      // prevent hide modal
      event.preventDefault();
    }
  }

  private handleSubmitColorSetting(event: MouseEvent) {
    if (this.colorSetting && this.colorSetting.validate()) {
      const settingAsMap = ConditionalFormattingTab.createSettingAsMap(this.selectedColumn!, 'color', this.colorSetting.getColorFormatting());
      this.clearConditionalFormattingKey('color');
      this.emitMultipleChanged(settingAsMap, true);
    } else {
      // prevent hide modal when error
      event.preventDefault();
    }
  }

  private handleSubmitDataBar(event: MouseEvent) {
    if (this.dataBarSetting && this.dataBarSetting.validate()) {
      const value = this.dataBarSetting.getValue();
      const settingAsMap = ConditionalFormattingTab.createSettingAsMap(this.selectedColumn!, 'dataBar', value);
      this.emitMultipleChanged(settingAsMap, false);
    } else {
      // prevent hide modal when error
      event.preventDefault();
    }
  }

  private applyDefaultIconSetting(selectedColumn: TableColumn) {
    const defaultIconFormatting = FormattingOptions.getDefaultIconFormatting(true);
    defaultIconFormatting.baseOnField = selectedColumn.function.field;
    defaultIconFormatting.summarization = selectedColumn.function.className;
    const settingAsMap = ConditionalFormattingTab.createSettingAsMap(this.selectedColumn!, 'icon', defaultIconFormatting);
    this.emitMultipleChanged(settingAsMap, true);
  }

  private applyDefaultColorSetting() {
    const settingAsMap = ConditionalFormattingTab.createDefaultColorSetting('color', this.selectedColumn!);
    this.emitMultipleChanged(settingAsMap, true);
  }

  private handleSubmitIconSetting(event: MouseEvent) {
    if (this.iconSetting && this.iconSetting.validate()) {
      const settingAsMap = ConditionalFormattingTab.createSettingAsMap(this.selectedColumn!, 'icon', this.iconSetting.getIconFormatting());
      this.clearConditionalFormattingKey('icon');
      this.emitMultipleChanged(settingAsMap, true);
    } else {
      // prevent hide modal when error
      event.preventDefault();
    }
  }
}
</script>

<style lang="scss">
.field-formatting-tab {
  margin-bottom: 30px;

  > div + div {
    margin-top: 8px;
  }
}
</style>
