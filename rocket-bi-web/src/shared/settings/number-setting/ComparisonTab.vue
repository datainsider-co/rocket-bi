<template>
  <PanelHeader header="Date Range" target-id="map-control-tab">
    <div id="comparison-control" class="comparison-tab">
      <ToggleSetting
        id="data-range-enabled"
        :value="dataRangeEnabled"
        class="group-config"
        :label="`${configSetting['dataRange.enabled'].label}`"
        :hint="`${configSetting['dataRange.enabled'].hint}`"
        @onChanged="onDataRangeEnableChanged"
      />
      <DropdownSetting
        id="date-field"
        :class="{ 'field-error': isFieldError }"
        :disable="!dataRangeEnabled"
        :options="dateOptions"
        :value="selectedDateFieldId"
        boundary="viewport"
        :label="`${configSetting['field.select'].label}`"
        :hint="`${configSetting['field.select'].hint}`"
        @onSelected="onDateFieldChanged"
      />
      <InputDateSetting
        id="date-input"
        :dateMode="dataDateMode"
        :dateRange="dataDateRange"
        :disable="!dataRangeEnabled"
        class="mb-3"
        :label="`${configSetting['dataRange.range'].label}`"
        :hint="`${configSetting['dataRange.range'].hint}`"
        @onDateChanged="onDataDateRangeChanged"
      />
      <!--      Comparison-->
      <template>
        <ToggleSetting
          id="comparison-enabled"
          :disable="!dataRangeEnabled"
          :value="comparisonEnabled"
          class="group-config"
          :label="`${configSetting['comparison.enabled'].label}`"
          :hint="`${configSetting['comparison.enabled'].hint}`"
          @onChanged="onComparisonEnabledChanged"
        />
        <InputDateSetting
          ref="compareDateRange"
          id="compare-range"
          :dateMode="comparisonMode"
          :dateRange="comparisonRange"
          :defaultDataRange="dataRange"
          :disable="!dataRangeEnabled || !comparisonEnabled"
          class="mb-3"
          inputDateType="date_compare"
          :label="`${configSetting['comparison.range'].label}`"
          :hint="`${configSetting['comparison.range'].hint}`"
          @onDateChanged="onComparisonDateRangeChanged"
        />
        <!--        <DropdownSetting-->
        <!--          id="display-type"-->
        <!--          :disable="!dataRangeEnabled || !comparisonEnabled"-->
        <!--          :options="displayStyleOptions"-->
        <!--          :value="selectedComparisonStyle"-->
        <!--          boundary="viewport"-->
        <!--          :label="`${configSetting['comparison.compareStyle'].label}`"-->
        <!--          :hint="`${configSetting['comparison.compareStyle'].hint}`"-->
        <!--          @onSelected="onComparisonStyleChanged"-->
        <!--        />-->
        <!--        <div class="row-config-container">-->
        <!--          <ColorSetting-->
        <!--            id="up-trend-color"-->
        <!--            :disable="!dataRangeEnabled || !comparisonEnabled"-->
        <!--            default-color="#4dcf36"-->
        <!--            :value="upTrendIconColor"-->
        <!--            :label="`${configSetting['comparison.uptrendIconColor'].label}`"-->
        <!--            :hint="`${configSetting['comparison.uptrendIconColor'].hint}`"-->
        <!--            size="small"-->
        <!--            style="margin-right: 12px"-->
        <!--            @onChanged="handleUpIconColorChanged"-->
        <!--          />-->
        <!--          <DropdownSetting-->
        <!--            id="up-trend-icon"-->
        <!--            :disable="!dataRangeEnabled || !comparisonEnabled"-->
        <!--            :options="compareTrendIconOptions"-->
        <!--            :value="upTrendIcon"-->
        <!--            :label="`${configSetting['comparison.upTrendIcon'].label}`"-->
        <!--            :hint="`${configSetting['comparison.upTrendIcon'].hint}`"-->
        <!--            boundary="viewport"-->
        <!--            size="small"-->
        <!--            @onChanged="handleUptrendIconChanged"-->
        <!--          >-->
        <!--            <template #selected-icon="{label}">-->
        <!--              <i :class="label"></i>-->
        <!--            </template>-->
        <!--            <template #option-item="{item}">-->
        <!--              <i :class="item.id"></i>-->
        <!--            </template>-->
        <!--          </DropdownSetting>-->
        <!--        </div>-->
        <!--        <div class="row-config-container">-->
        <!--          <ColorSetting-->
        <!--            id="down-trend-color"-->
        <!--            :disable="!dataRangeEnabled || !comparisonEnabled"-->
        <!--            default-color="#ea6b6b"-->
        <!--            :value="downTrendIconColor"-->
        <!--            :label="`${configSetting['comparison.downtrendIconColor'].label}`"-->
        <!--            :hint="`${configSetting['comparison.downtrendIconColor'].hint}`"-->
        <!--            size="small"-->
        <!--            style="margin-right: 12px"-->
        <!--            @onChanged="handleDowntrendIconColorChanged"-->
        <!--          />-->
        <!--          <DropdownSetting-->
        <!--            id="down-trend-icon"-->
        <!--            :disable="!dataRangeEnabled || !comparisonEnabled"-->
        <!--            :options="compareTrendIconOptions"-->
        <!--            :value="downTrendIcon"-->
        <!--            :label="`${configSetting['comparison.downTrendIcon'].label}`"-->
        <!--            :hint="`${configSetting['comparison.downTrendIcon'].hint}`"-->
        <!--            size="small"-->
        <!--            boundary="viewport"-->
        <!--            @onChanged="handleDowntrendIconChanged"-->
        <!--          >-->
        <!--            <template #selected-icon="{label}">-->
        <!--              <i :class="label"></i>-->
        <!--            </template>-->
        <!--            <template #option-item="{item}">-->
        <!--              <i :class="item.id"></i>-->
        <!--            </template>-->
        <!--          </DropdownSetting>-->
        <!--        </div>-->
        <!--      </template>-->
        <!--      &lt;!&ndash;      Trendline&ndash;&gt;-->
        <!--      <template>-->
        <ToggleSetting
          id="trend-line-enabled"
          :disable="!dataRangeEnabled"
          :value="trendLineEnabled"
          class="group-config"
          :label="`${configSetting['trendLine.enabled'].label}`"
          :hint="`${configSetting['trendLine.enabled'].hint}`"
          @onChanged="onTrendLineEnabledChanged"
        />
        <div class="row-config-container">
          <DropdownSetting
            id="line-type"
            :disable="!dataRangeEnabled || !trendLineEnabled"
            :options="trendLineTypeOptions"
            :value="selectedTrendLineType"
            boundary="viewport"
            :label="`${configSetting['trendLine.displayAs'].label}`"
            :hint="`${configSetting['trendLine.displayAs'].hint}`"
            @onSelected="onTrendLineTypeChanged"
            size="half"
            style="margin-right: 8px"
          />
          <ColorSetting
            :disable="!dataRangeEnabled || !trendLineEnabled"
            id="trend-line-color"
            size="half"
            :value="trendLineColor"
            :default-color="defaultTrendLineColor"
            :label="`${configSetting['trendLine.color'].label}`"
            :hint="`${configSetting['trendLine.color'].hint}`"
            @onChanged="onTrendLineColorChanged"
          />
        </div>
        <DropdownSetting
          id="trend-by"
          :disable="!dataRangeEnabled || !trendLineEnabled"
          :options="trendLineByOptions"
          :value="selectedTrendLineBy"
          boundary="viewport"
          :label="`${configSetting['trendLine.trendBy'].label}`"
          :hint="`${configSetting['trendLine.trendBy'].hint}`"
          @onSelected="onTrendLineByChanged"
        />
      </template>
      <div>
        <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
      </div>
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { ComparisonOptionData, Dashboard, DataRange, Field, KPITheme, MainDateMode, NumberChartOption, SettingKey, TrendIcon } from '@core/common/domain';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { FormattingOptions } from '@/shared/settings/common/conditional-formatting/FormattingOptions';
import { SlTreeNodeModel } from '@/shared/components/builder/treemenu/SlVueTree';
import { ChartUtils, DateUtils } from '@/utils';
import { cloneDeep, get } from 'lodash';
import { JsonUtils, Log } from '@core/utils';
import { ChartType, DateFunctionTypes, DateRange } from '@/shared';
import { CalendarData } from '@/shared/models';
import { DataManager } from '@core/common/services';
import { MainDateData } from '@/screens/dashboard-detail/stores';
import InputDateSetting from '@/shared/settings/common/InputDateSetting.vue';
import { ComparisonUtils } from '@core/utils/ComparisonUtils';

@Component({
  components: { PanelHeader }
})
export default class ComparisonTab extends Vue {
  private readonly configSetting = window.chartSetting['comparison.tab'];
  private readonly themeSettings = require('./themeSettings.json');

  @Prop({ required: false, type: Object })
  private readonly chartOption!: ComparisonOptionData;

  @Prop({ required: false, type: String })
  private readonly theme?: string;

  @Prop({ type: Array, default: [] })
  private dateOptions!: DropdownData[];

  @Ref()
  private readonly compareDateRange!: InputDateSetting;

  private get displayStyleOptions(): DropdownData[] {
    return [
      {
        id: 'default',
        displayName: '🔻 8% (120k)'
      },
      {
        id: 'percentage',
        displayName: '🔻 8%'
      },
      {
        id: 'number',
        displayName: '🔻 (120k)'
      },
      {
        id: 'text',
        displayName: 'Compare period: 120k'
      }
    ];
  }

  private get trendLineTypeOptions(): DropdownData[] {
    return [
      {
        id: ChartType.Line,
        displayName: 'Line'
      },
      // {
      //   id: ChartType.Column,
      //   displayName: 'Column'
      // },
      // {
      //   id: ChartType.Bar,
      //   displayName: 'Bar'
      // },
      {
        id: ChartType.Area,
        displayName: 'Area'
      }
    ];
  }

  private get trendLineByOptions(): DropdownData[] {
    return [
      {
        id: DateFunctionTypes.secondOf,
        displayName: 'Second'
      },
      {
        id: DateFunctionTypes.minuteOf,
        displayName: 'Minute'
      },
      {
        id: DateFunctionTypes.hourOf,
        displayName: 'Hour'
      },
      {
        id: DateFunctionTypes.dayOf,
        displayName: 'Day'
      },
      {
        id: DateFunctionTypes.weekOf,
        displayName: 'Week'
      },
      {
        id: DateFunctionTypes.monthOf,
        displayName: 'Month'
      },
      {
        id: DateFunctionTypes.quarterOf,
        displayName: 'Quarter'
      },
      {
        id: DateFunctionTypes.yearlyOf,
        displayName: 'Year'
      }
    ];
  }

  private get compareTrendIconOptions(): DropdownData[] {
    return [
      {
        id: TrendIcon.Up
      },
      {
        id: TrendIcon.Down
      }
    ];
  }

  private get dataRangeEnabled(): boolean {
    return this.chartOption.dataRange?.enabled ?? false;
  }

  private get dateField(): Field | null {
    return this.chartOption.dataRange?.dateField || null;
  }

  private get dataDateRange(): DateRange | null {
    return this.chartOption.dataRange?.dateRange || null;
  }

  private get dataDateMode(): MainDateMode {
    return this.chartOption.dataRange?.mode || MainDateMode.custom;
  }

  private get dataRange(): DataRange | null {
    return this.chartOption.dataRange || null;
  }

  private get comparisonEnabled(): boolean {
    return this.chartOption.comparison?.enabled ?? false;
  }

  private get comparisonRange(): DateRange | null {
    return this.chartOption.comparison?.dateRange || null;
  }

  private get comparisonMode(): MainDateMode {
    return this.chartOption.comparison?.mode || MainDateMode.custom;
  }

  private get selectedComparisonStyle() {
    return this.chartOption.comparison?.compareStyle;
  }

  private get trendLineEnabled() {
    return this.chartOption.trendLine?.enabled ?? false;
  }

  private get selectedTrendLineType(): ChartType.Line | ChartType.Area | ChartType.Bar | ChartType.Column {
    return this.chartOption.trendLine?.displayAs || ChartType.Line;
  }

  private get trendLineColor(): string {
    return this.chartOption.trendLine?.color ?? '';
  }

  private get defaultTrendLineColor(): string {
    return this.getThemeSetting(this.theme).trendLine.color;
  }

  private get selectedTrendLineBy(): string {
    return this.chartOption.trendLine?.trendBy || DateFunctionTypes.monthOf;
  }

  private get upTrendIcon(): string {
    return this.chartOption.comparison?.uptrendIcon || TrendIcon.Up;
  }

  private get upTrendIconColor(): string {
    return this.chartOption.comparison?.uptrendIconColor || '';
  }

  private get downTrendIcon(): string {
    return this.chartOption.comparison?.downtrendIcon || TrendIcon.Down;
  }

  private get downTrendIconColor(): string {
    return this.chartOption.comparison?.downtrendIconColor || '';
  }

  private get isFieldError(): boolean {
    return !this.selectedDateFieldId;
  }

  private get selectedDateFieldId(): string {
    Log.debug('date field');
    const field = this.dateField ?? this.getFirstDateField();
    if (field) {
      return FormattingOptions.buildId(field);
    } else {
      return '';
    }
  }

  created() {
    this.initDateRange();
  }

  private initDateRange() {
    const clonedChartOption: ComparisonOptionData = JsonUtils.mergeDeep(this.getDefaultCompareOption(), this.chartOption);
    Object.assign(this.chartOption, clonedChartOption);
  }

  private getDefaultCompareOption(): ComparisonOptionData {
    const mainDateFilterField = this.getMainDateFilterField();
    const firstDateField = this.getFirstDateField();
    const sameDatabase = mainDateFilterField?.dbName === firstDateField?.dbName;
    const dateData: MainDateData | undefined = this.getDateData();
    return {
      comparison: {
        enabled: false,
        dateRange: DateUtils.getPeriodDateRange(MainDateMode.samePeriodLastMonth, DateUtils.getLast30Days()),
        compareStyle: 'default',
        mode: MainDateMode.samePeriodLastMonth
      },
      trendLine: {
        enabled: false,
        trendBy: DateFunctionTypes.monthOf,
        displayAs: ChartType.Line
      },
      dataRange: {
        enabled: false,
        dateRange: dateData?.chosenDateRange || DateUtils.getLast30Days(),
        dateField: sameDatabase ? mainDateFilterField : firstDateField,
        mode: dateData?.mode || MainDateMode.last30Days
      }
    } as any;
  }

  private getMainDateFilterField(): Field | undefined {
    const dashboard: Dashboard | undefined = DataManager.getCurrentDashboard();
    return dashboard?.mainDateFilter?.affectedField;
  }

  private getDateData(): MainDateData | undefined {
    const dashboardId = DataManager.getCurrentDashboardId();
    if (dashboardId) {
      return DataManager.getMainDateData(+dashboardId);
    }
  }

  private filterOnlyDate(column: SlTreeNodeModel<any>): boolean {
    const field: Field = column.tag as Field;
    return ChartUtils.isDateType(field.fieldType);
  }

  private handleRevert() {
    const settingAsMap = new Map<SettingKey, any>();
    settingAsMap.set('dataRange.enabled', false);
    settingAsMap.set('comparison.enabled', false);
    settingAsMap.set('trendLine.enabled', false);
    this.emitMultiSettingChanged(settingAsMap, true);
  }

  private onDataRangeEnableChanged(enabled: boolean) {
    const settingAsMap = new Map<SettingKey, any>();
    settingAsMap.set('dataRange.enabled', enabled);
    settingAsMap.set('dataRange.dateField', this.dateField);
    settingAsMap.set('dataRange.dateRange', this.dataDateRange);
    settingAsMap.set('dataRange.mode', this.dataDateMode);
    Log.debug('onDataRangeEnableChanged::', settingAsMap);
    this.emitMultiSettingChanged(settingAsMap, true);
  }

  private onComparisonEnabledChanged(enabled: boolean) {
    const settingAsMap = new Map<SettingKey, any>();
    settingAsMap.set('comparison.enabled', enabled);
    settingAsMap.set('comparison.dateRange', this.comparisonRange);
    settingAsMap.set('comparison.mode', this.comparisonMode);
    settingAsMap.set('comparison.compareStyle', this.selectedComparisonStyle);
    // Log.debug('onComparisonEnabledChanged::', this.comparisonMode);
    this.emitMultiSettingChanged(settingAsMap, true);
  }

  private onTrendLineEnabledChanged(enabled: boolean) {
    const settingAsMap = new Map<SettingKey, any>();
    settingAsMap.set('trendLine.enabled', enabled);
    settingAsMap.set('trendLine.displayAs', this.selectedTrendLineType);
    settingAsMap.set('comparison.trendBy', this.selectedTrendLineBy);
    settingAsMap.set('trendLine.color', this.getThemeSetting(this.theme).trendLine.color);
    settingAsMap.set('trendLine.colorByPercentage', this.getThemeSetting(this.theme).trendLine.colorByPercentage);
    Log.debug('onTrendLineEnabledChanged::', settingAsMap);
    this.emitMultiSettingChanged(settingAsMap, true);
  }

  private getThemeSetting(theme?: string): any {
    return this.themeSettings[theme ?? KPITheme.Style1];
  }

  private emitSettingKeyChanged(key: string, value: any, reRender?: boolean) {
    this.$emit('onChanged', key, value, reRender);
  }

  private emitMultiSettingChanged(settingAsKey: Map<SettingKey, any>, reRender?: boolean) {
    this.$emit('onMultipleChanged', settingAsKey, reRender);
  }

  private onDateFieldChanged(item: DropdownData): void {
    const field: Field = item.field;
    this.emitSettingKeyChanged('dataRange.dateField', field, true);
  }

  private getFirstDateField(): Field | null {
    Log.debug('ComparisonTab', this.dateOptions);
    return get(this, 'dateOptions[0].options[0].field', null);
  }

  private onDataDateRangeChanged(calendarData: CalendarData) {
    const settingAsMap = new Map<SettingKey, any>();
    settingAsMap.set('dataRange.dateRange', cloneDeep(calendarData.chosenDateRange));
    settingAsMap.set('dataRange.mode', calendarData.filterMode);
    const dateRange = ComparisonUtils.getDateRange(calendarData.filterMode) ?? calendarData.chosenDateRange ?? DateUtils.getAllTime();
    if (this.comparisonMode != MainDateMode.custom) {
      const compareRange = DateUtils.getCompareDateRange(this.comparisonMode as any, dateRange);
      this.compareDateRange.setDateRange(compareRange);
    }

    this.emitMultiSettingChanged(settingAsMap, true);
  }

  private onComparisonDateRangeChanged(calendarData: CalendarData) {
    const settingAsMap = new Map<SettingKey, any>();
    settingAsMap.set('comparison.dateRange', calendarData.chosenDateRange);
    settingAsMap.set('comparison.mode', calendarData.filterMode);
    this.emitMultiSettingChanged(settingAsMap, true);
  }

  private onComparisonStyleChanged(item: DropdownData): void {
    this.emitSettingKeyChanged('comparison.compareStyle', item.id);
  }

  private handleUpIconColorChanged(color: string): void {
    this.emitSettingKeyChanged('comparison.uptrendIconColor', color);
  }

  private handleUptrendIconChanged(color: string): void {
    this.emitSettingKeyChanged('comparison.uptrendIcon', color);
  }

  private handleDowntrendIconColorChanged(color: string): void {
    this.emitSettingKeyChanged('comparison.downtrendIconColor', color);
  }

  private handleDowntrendIconChanged(color: string): void {
    this.emitSettingKeyChanged('comparison.downtrendIcon', color);
  }

  private onTrendLineTypeChanged(item: DropdownData): void {
    this.emitSettingKeyChanged('trendLine.displayAs', item.id);
  }

  private onTrendLineByChanged(item: DropdownData): void {
    this.emitSettingKeyChanged('trendLine.trendBy', item.id, true);
  }

  private onTrendLineColorChanged(color: string) {
    this.emitSettingKeyChanged('trendLine.color', color, false);
  }
}
</script>

<style lang="scss">
.comparison-tab {
  div.field-error .select-container {
    border: 1px solid var(--danger);
  }

  > div + div {
    margin-top: 16px;
  }
}
</style>
