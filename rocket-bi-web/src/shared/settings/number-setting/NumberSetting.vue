<template>
  <div>
    <TitleTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <NumberDataLabelTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <ComparisonTab
      v-if="dateOptions.length > 0"
      :dateOptions="dateOptions"
      :chartOption="setting.options"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
    />
    <TooltipTab :setting="setting" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <BackgroundTab :setting="setting.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <VisualHeader :setting="setting.options" :widget-type="currentWidget" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import { ChartInfo, Field, NumberChartOption, NumberQuerySetting, SettingKey } from '@core/common/domain';
import TooltipTab from '@/shared/settings/pivot-table/TooltipTab.vue';
import NumberDataLabelTab from '@/shared/settings/number-setting/NumberDataLabelTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import { ChartType } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';
import ComparisonTab from '@/shared/settings/number-setting/ComparisonTab.vue';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { FormattingOptions } from '@/shared/settings/common/conditional-formatting/FormattingOptions';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { SlTreeNodeModel } from '@/shared/components/builder/treemenu/SlVueTree';
import { ChartUtils } from '@/utils';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';

@Component({ components: { ComparisonTab, TitleTab, TooltipTab, NumberDataLabelTab, BackgroundTab, VisualHeader } })
export default class NumberSetting extends Vue {
  @Prop({ required: true })
  private readonly chartInfo!: ChartInfo;

  private get query(): NumberQuerySetting {
    return this.chartInfo.setting as NumberQuerySetting;
  }

  private get setting(): NumberChartOption {
    return this.chartInfo.setting.getChartOption() as NumberChartOption;
  }

  private get currentWidget(): ChartType {
    return _ConfigBuilderStore.chartType;
  }

  private get dateOptions(): DropdownData[] {
    return FormattingOptions.buildTableOptions(_BuilderTableSchemaStore.tableSchemas, this.filterOnlyDate);
  }

  private handleSettingChanged(key: string, value: boolean | string | number, reRender?: boolean) {
    Log.debug('handleSettingChanged::', key, 'value::', value);
    this.setting.setOption(key, value);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo, reRender === true);
  }

  private handleMultipleSettingChanged(settings: Map<SettingKey, boolean | string | number>, reRender?: boolean) {
    this.setting.setOptions(settings);
    this.query.setChartOption(this.setting);
    this.$emit('onChartInfoChanged', this.chartInfo, reRender === true);
  }

  private filterOnlyDate(column: SlTreeNodeModel<any>): boolean {
    const field: Field = column.tag as Field;
    return ChartUtils.isDateType(field.fieldType);
  }
}
</script>
