<template>
  <div class="number-filter-area">
    <SelectionInput
      :optionSelected.sync="optionSelected"
      :options="numberOptions"
      :values.sync="inputValues"
      :isManualInput.sync="isManualInput"
      :enableControlConfig="enableControlConfig"
      :selected-control-id="selectedControlId"
      :chartControls="chartControls"
      @update:selectedControlId="id => $emit('update:selectedControlId', id)"
      @applyFilter="() => $emit('applyFilter')"
    >
      <template #footer="{isManualInput}">
        <div class="aggregation-area" v-if="isManualInput">
          <StatusWidget :status="currentStatus" error="Load min, avg, max data error" @retry="handleLoadMinMaxAvg">
            <div class="d-flex flex-row align-items-center aggregation-listing-area text-nowrap overflow-auto">
              <div v-b-tooltip.d800.viewport="`Min: ${min}`">
                Min: <span>{{ min }}</span>
              </div>
              <div v-b-tooltip.d800.viewport="`Avg: ${avg}`">
                Avg: <span>{{ avg }}</span>
              </div>
              <div v-b-tooltip.d800.viewport="`Max: ${max}`">
                Max: <span>{{ max }}</span>
              </div>
            </div>
          </StatusWidget>
        </div>
      </template>
    </SelectionInput>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import SelectionInput from '@/shared/components/filters/selection-input/SelectionInput.vue';
import { FilterConstants, FilterSelectOption, InputType, NumberConditionTypes, Status } from '@/shared';
import { FilterProp } from '@/shared/components/filters/FilterProp';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { QueryProfileBuilder, QueryService } from '@core/common/services';
import { Di } from '@core/common/modules';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { QueryRequest } from '@core/common/domain/request';
import { AbstractTableResponse } from '@core/common/domain/response/query/AbstractTableResponse';
import { Log } from '@core/utils';
import { DashboardModule } from '@/screens/dashboard-detail/stores';
import { ChartControl, WidgetId } from '@core/common/domain';

@Component({
  components: { StatusWidget, SelectionInput }
})
export default class NumberFilter extends Vue implements FilterProp {
  @Prop({ type: Array, default: () => [] })
  defaultValues!: string[];
  @Prop({ type: String, default: '' })
  defaultOptionSelected!: string;
  @Prop({ required: true })
  profileField!: FieldDetailInfo;

  @Prop({ required: false, default: false })
  private readonly enableControlConfig!: boolean;

  @Prop({ required: false, type: Number })
  private readonly selectedControlId?: WidgetId;

  @Prop({ required: false, type: Array, default: () => [] })
  private readonly chartControls!: ChartControl[];

  private records: any[] = FilterConstants.DEFAULT_RECORD_VALUE;
  private optionSelected = FilterConstants.DEFAULT_NUMBER_SELECTED;
  private currentStatus = Status.Loading;
  protected inputValues: string[] = [];
  private isManualInput = false;

  private get previewMinMaxAvgRequest(): QueryRequest {
    const queryProfileBuilder: QueryProfileBuilder = Di.get(QueryProfileBuilder);
    return queryProfileBuilder.buildQueryMinMaxAvgRequest(this.profileField, DashboardModule.id);
  }

  private get min(): string {
    return this.records[0];
  }

  private get max(): string {
    return this.records[1];
  }

  private get avg(): string {
    return this.records[2];
  }

  private get numberOptions(): FilterSelectOption[] {
    return [
      {
        displayName: NumberConditionTypes.equal,
        id: NumberConditionTypes.equal,
        inputType: InputType.Text
      },
      {
        displayName: NumberConditionTypes.notEqual,
        id: NumberConditionTypes.notEqual,
        inputType: InputType.Text
      },
      {
        displayName: NumberConditionTypes.greaterThan,
        id: NumberConditionTypes.greaterThan,
        inputType: InputType.Text
      },
      {
        displayName: NumberConditionTypes.between,
        id: NumberConditionTypes.between,
        inputType: InputType.NumberRange
      },
      {
        displayName: NumberConditionTypes.betweenAndIncluding,
        id: NumberConditionTypes.betweenAndIncluding,
        inputType: InputType.NumberRange
      },
      {
        displayName: NumberConditionTypes.greaterThanOrEqual,
        id: NumberConditionTypes.greaterThanOrEqual,
        inputType: InputType.Text
      },
      {
        displayName: NumberConditionTypes.lessThan,
        id: NumberConditionTypes.lessThan,
        inputType: InputType.Text
      },
      {
        displayName: NumberConditionTypes.lessThanOrEqual,
        id: NumberConditionTypes.lessThanOrEqual,
        inputType: InputType.Text
      }
    ];
  }

  created() {
    this.handleLoadMinMaxAvg();
  }

  mounted() {
    this.optionSelected = (this.defaultOptionSelected as NumberConditionTypes) || FilterConstants.DEFAULT_NUMBER_SELECTED;
    this.inputValues = [...this.defaultValues];
    this.isManualInput = !this.selectedControlId;
  }

  @Watch('defaultValues')
  onChangeDefaultValue(newValues: string[]) {
    this.inputValues = [...newValues];
  }

  getSelectedCondition(): NumberConditionTypes {
    return this.optionSelected;
  }

  getCurrentValues(): string[] {
    return this.inputValues;
  }

  getCurrentInputType(): InputType {
    const currentSelect = this.numberOptions.find(options => options.id == this.optionSelected) ?? this.numberOptions[0];
    return currentSelect.inputType;
  }

  private async handleLoadMinMaxAvg() {
    const dashboardService: QueryService = Di.get(QueryService);
    try {
      const previewChartQuery: AbstractTableResponse = await dashboardService.query(this.previewMinMaxAvgRequest).then(r => r as AbstractTableResponse);
      this.records = previewChartQuery?.records[0] ?? FilterConstants.DEFAULT_RECORD_VALUE;
      this.currentStatus = Status.Loaded;
    } catch (ex) {
      Log.error('handleLoadMinMaxAvg::error', ex);
      this.records = FilterConstants.DEFAULT_RECORD_VALUE;
      this.currentStatus = Status.Error;
    }
  }

  protected relocation(): void {
    this.$emit('relocation');
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.number-filter-area {
  .aggregation-area {
    margin-top: 24px;
  }

  .aggregation-listing-area {
    > div {
      @include semi-bold-text();
      color: var(--text-color);
      font-size: 14px;
      letter-spacing: 0.6px;

      > span {
        @include regular-text();
        font-size: 14px;
        letter-spacing: 0.6px;
      }
    }

    > div + div {
      margin-left: 16px;
    }
  }
}
</style>
