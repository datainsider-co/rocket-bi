<template>
  <PanelHeader header="Stack" target-id="stack-tab">
    <div class="shape-tab">
      <DropdownSetting
        id="stack-value"
        label="Stack"
        :options="stackOptions"
        :value="stackValue"
        class="mb-2"
        size="full"
        @onSelected="handleSelectedStackValue"
      />
      <template v-if="response !== undefined">
        <InputSetting
          v-for="(series, index) in response.series"
          v-bind:key="index"
          :id="`stack-input-${index}`"
          placeholder="Input Stack Group"
          :value="stackOf(series)"
          class="mb-3"
          :label="series.name"
          size="full"
          @onChanged="handleStackSaved($event, series.name)"
        />
      </template>
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SeriesOneItem, SeriesOneResponse, StackedChartOption } from '@core/domain';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { StringUtils } from '@/utils/string.utils';
import { SelectOption } from '@/shared';

@Component({ components: { PanelHeader } })
export default class StackTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly response?: SeriesOneResponse;

  @Prop({ required: false, type: Object })
  private readonly setting?: StackedChartOption;

  private stackOf(seriesName: SeriesOneItem): string {
    const normalized = StringUtils.toCamelCase(seriesName.name);
    return this.setting?.stackingGroup.get(normalized) ?? seriesName.stack ?? 'unGroup';
  }
  private handleStackSaved(newStack: string, seriesName: string) {
    const normalized = StringUtils.toCamelCase(seriesName);
    if (this.setting?.stackingGroup.get(normalized) != newStack) return this.$emit('onChanged', `stackingGroup.${normalized}`, newStack);
  }

  private get stackValue(): string {
    return this.setting?.options.plotOptions?.series?.stacking ?? '';
  }

  private handleSelectedStackValue(value: SelectOption) {
    this.$emit('onChanged', 'plotOptions.series.stacking', value.id);
  }

  private get stackOptions(): SelectOption[] {
    return [
      {
        id: 'normal',
        displayName: 'Value'
      },
      {
        id: 'percent',
        displayName: 'Percentage'
      }
    ];
  }
}
</script>

<style lang="scss" scoped></style>
