<template>
  <div>
    <TitleTab :setting="setting.options" widget-type="pivot_table" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <StyleTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <GridTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <HeaderTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ValuesTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <CollapseTab v-if="enableCollapseTab" :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TotalTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <FieldFormattingTab :columns="formattingColumns" :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ConditionalFormattingTab
      v-if="hasFormattingTab"
      :canShowDataBar="canShowDataBar"
      :columns="conditionalFormattingColumns"
      :functionType="functionType"
      :options="setting.options"
      @onChanged="handleSettingChanged"
      @onClearSetting="handleClearSetting"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <TooltipTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :setting="setting.options" :widget-type="currentWidget" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import GridTab from './GridTab.vue';
import HeaderTab from '@/shared/Settings/PivotTable/HeaderTab.vue';
import ValuesTab from '@/shared/Settings/PivotTable/ValuesTab.vue';
import StyleTab from '@/shared/Settings/PivotTable/StyleTab.vue';
import TotalTab from '@/shared/Settings/PivotTable/TotalTab.vue';
import TitleTab from '@/shared/Settings/Common/Tabs/TitleTab.vue';
import BackgroundTab from '@/shared/Settings/Common/Tabs/BackgroundTab.vue';
import VisualHeader from '@/shared/Settings/Common/Tabs/VisualHeader.vue';
import FieldFormattingTab from '@/shared/Settings/PivotTable/FieldFormattingTab.vue';
import { ChartInfo, PivotTableChartOption, PivotTableQuerySetting, SettingKey, TableColumn } from '@core/domain';
import TooltipTab from '@/shared/Settings/PivotTable/TooltipTab.vue';
import CollapseTab from '@/shared/Settings/PivotTable/CollapseTab.vue';
import ConditionalFormattingTab from '@/shared/Settings/Table/ConditionalFormattingTab.vue';
import { ChartType } from '@/shared';
import { PivotFieldFormatterUtils } from '@chart/Table/PivotTable/Style/PivotFieldFormatterUtils';
import { PivotFormatAs } from '@chart/Table/PivotTable/Style/PivotFormatAs';
import { ChartUtils, ListUtils } from '@/utils';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';
import { Log } from '@core/utils';
import { FunctionFormattingType } from '@/shared/Settings/Common/ConditionalFormatting/FormattingOptions';

@Component({
  components: {
    GridTab,
    HeaderTab,
    ValuesTab,
    StyleTab,
    TotalTab,
    TitleTab,
    BackgroundTab,
    VisualHeader,
    FieldFormattingTab,
    TooltipTab,
    CollapseTab,
    ConditionalFormattingTab
  }
})
export default class PivotSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private readonly functionType = FunctionFormattingType.GroupBy;

  private get query(): PivotTableQuerySetting {
    return this.chartInfo.setting as PivotTableQuerySetting;
  }

  private get setting(): PivotTableChartOption {
    return this.chartInfo.setting.getChartOption() as PivotTableChartOption;
  }

  private get enableCollapseTab(): boolean {
    return this.query.rows.length > 1;
  }

  private get formattingColumns(): TableColumn[] {
    return [this.query.rows[0], ...this.query.values].filter(column => !!column);
  }

  private get conditionalFormattingColumns(): TableColumn[] {
    const pivotDisplayAs = PivotFieldFormatterUtils.getFormatType(this.query);
    switch (pivotDisplayAs) {
      case PivotFormatAs.Table:
        return this.formattingColumns;
      default:
        return this.query.values.filter(column => !!column);
    }
  }

  private get currentWidget(): ChartType {
    return _ConfigBuilderStore.chartType as ChartType;
  }

  private handleSettingChanged(key: string, value: any) {
    Log.debug('handleSettingChanged::', key, 'value::', value);
    this.setting.setOption(key, value);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo);
  }

  private handleMultipleSettingChanged(settingAsMap: Map<SettingKey, boolean | string | number>, reRender?: boolean) {
    this.setting.setOptions(settingAsMap);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo, reRender === true);
  }

  private handleClearSetting(key: string): void {
    this.handleSettingChanged(key, void 0);
  }

  private canShowDataBar(selectedColumn: TableColumn): boolean {
    if (selectedColumn) {
      return ChartUtils.isAggregationFunction(selectedColumn.function);
    } else {
      return false;
    }
  }

  private get hasFormattingTab(): boolean {
    return ListUtils.isNotEmpty(this.query.values);
  }
}
</script>
