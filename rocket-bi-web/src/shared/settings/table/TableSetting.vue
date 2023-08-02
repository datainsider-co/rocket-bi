<template>
  <div>
    <TitleTab :setting="setting.options" widget-type="table" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <StyleTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <GridTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <HeaderTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ValuesTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <CollapseTab v-if="enableCollapseTab" :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <FieldFormattingTab
      v-if="columns.length > 0"
      :columns="columns"
      :setting="setting"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <ConditionalFormattingTab
      :canShowDataBar="canShowDataBar"
      :columns="columns"
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
import HeaderTab from '@/shared/settings/pivot-table/HeaderTab.vue';
import ValuesTab from '@/shared/settings/pivot-table/ValuesTab.vue';
import StyleTab from '@/shared/settings/pivot-table/StyleTab.vue';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import { AbstractTableQuerySetting, ChartInfo, FunctionType, TableColumn, TableChartOption, SettingKey } from '@core/common/domain';
import TooltipTab from '@/shared/settings/pivot-table/TooltipTab.vue';
import GridTab from '@/shared/settings/pivot-table/GridTab.vue';
import ConditionalFormattingTab from '@/shared/settings/table/ConditionalFormattingTab.vue';
import { ChartUtils } from '@/utils';
import FieldFormattingTab from '@/shared/settings/pivot-table/FieldFormattingTab.vue';
import CollapseTab from '@/shared/settings/pivot-table/CollapseTab.vue';
import { FunctionFormattingType } from '@/shared/settings/common/conditional-formatting/FormattingOptions';
import { ChartType } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';

@Component({
  components: {
    GridTab,
    HeaderTab,
    ValuesTab,
    StyleTab,
    TitleTab,
    BackgroundTab,
    VisualHeader,
    TooltipTab,
    ConditionalFormattingTab,
    FieldFormattingTab,
    CollapseTab
  }
})
export default class TableSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get functionType(): FunctionFormattingType {
    return (this.query.columns ?? []).some(col => ChartUtils.isGroupByFunction(col.function)) ? FunctionFormattingType.GroupBy : FunctionFormattingType.None;
  }

  private get setting(): TableChartOption {
    return this.chartInfo.setting.getChartOption() as TableChartOption;
  }

  private get query(): AbstractTableQuerySetting {
    return this.chartInfo.setting as AbstractTableQuerySetting;
  }

  private get columns(): TableColumn[] {
    switch (this.functionType) {
      case FunctionFormattingType.GroupBy:
        return [...this.pickFirstGroupBy(this.query.columns ?? []), ...this.pickAggregationFunctions(this.query.columns ?? [])];
      default:
        return this.query.columns ?? [];
    }
  }

  private get enableCollapseTab(): boolean {
    const groupBys = (this.query.columns ?? []).filter(column => ChartUtils.isGroupByFunction(column.function));
    return groupBys.length > 1;
  }

  private get currentWidget(): ChartType {
    return _ConfigBuilderStore.chartType;
  }

  private canShowDataBar(selectedColumn: TableColumn): boolean {
    if (selectedColumn) {
      if (ChartUtils.hasOnlyNoneFunction(this.query.columns ?? [])) {
        return ChartUtils.isColumnNumber(selectedColumn);
      } else {
        return ChartUtils.isAggregationFunction(selectedColumn.function);
      }
    } else {
      return false;
    }
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

  private pickFirstGroupBy(tableColumns: TableColumn[]): TableColumn[] {
    const tableColumn = tableColumns.find(column => column.function.className === FunctionType.Group);
    if (tableColumn) {
      return [tableColumn];
    } else {
      return [];
    }
  }

  private pickAggregationFunctions(tableColumns: TableColumn[]) {
    return tableColumns.filter(column => ChartUtils.isAggregationFunction(column.function));
  }

  private handleClearSetting(key: string): void {
    this.handleSettingChanged(key, undefined);
  }
}
</script>
