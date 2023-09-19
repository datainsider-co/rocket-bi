<template>
  <div class="string-filter-area">
    <SelectionInput
      :optionSelected.sync="optionSelected"
      :options="selectOptions"
      :values.sync="inputValues"
      :isManualInput="isManualInput"
      :enableControlConfig="enableControlConfig && !hideControlConfig"
      :selected-control-id="selectedControlId"
      :chartControls="chartControls"
      @update:selectedControlId="id => $emit('update:selectedControlId', id)"
      @applyFilter="() => $emit('applyFilter')"
      @update:isManualInput="handleChangeIsManualInput"
    >
      <template #footer="{isManualInput}">
        <div class="string-listing-container" v-show="isSelectionMode && isManualInput">
          <DILoadMore
            ref="loadMore"
            :canLoadMore="canLoadMore"
            :initStatus="initStatus"
            :error-msg="errorMsg"
            :isLoadMore.sync="isLoadMore"
            :isVirtualScroll="true"
            :scrollClass="'multi-selection-area'"
            @retry="handleLoadChartData"
            @onLoadMore="handleLoadMoreChartResponse"
          >
            <MultiSelection
              class="string-filter-area-multi-selection"
              :id="genMultiSelectionId('selection-filter')"
              :model="valuesSelected"
              :options="groupOptions"
              @onScroll="handleScroll"
              @selectedColumnsChanged="handleSelectedColumnsChanged"
            />
          </DILoadMore>
        </div>
      </template>
    </SelectionInput>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { CheckboxGroupOption, FilterConstants, FilterSelectOption, InputType, Status, StringConditionTypes } from '@/shared';
import MultiSelection from '@/shared/components/MultiSelection.vue';
import { FilterProp } from '@/shared/components/filters/FilterProp';
import { ListUtils } from '@/utils';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import SelectionInput from '@/shared/components/filters/selection-input/SelectionInput.vue';
import { CollapseTransition } from 'vue2-transitions';
import { QueryProfileBuilder, QueryService } from '@core/common/services';
import { Di } from '@core/common/modules';
import { QueryRequest } from '@core/common/domain/request';
import DILoadMore from '@/shared/components/DILoadMore.vue';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { AbstractTableResponse } from '@core/common/domain/response/query/AbstractTableResponse';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { StringUtils } from '@/utils/StringUtils';
import { isString, isNumber } from 'lodash';
import { ChartControl, DIException, WidgetId } from '@core/common/domain';
import { Log } from '@core/utils';
import { DashboardModule } from '@/screens/dashboard-detail/stores';

@Component({
  components: { SelectionInput, StatusWidget, MultiSelection, CollapseTransition, DILoadMore }
})
export default class SelectionFilter extends Vue implements FilterProp {
  private isManualInput = false;
  private initStatus = Status.Loading;
  private valuesSelected: string[] = [];
  private optionSelected: StringConditionTypes = FilterConstants.DEFAULT_STRING_SELECTED;
  private canLoadMore = true;
  private isLoadMore = false;
  private records: any[][] = [];
  private inputValues: string[] = [];
  private errorMsg = '';

  @Prop({ type: Array, default: () => [] })
  readonly defaultValues!: string[];

  @Prop({ type: String, default: '' })
  readonly defaultOptionSelected!: string;

  @Prop({ required: true })
  readonly profileField!: FieldDetailInfo;

  @Prop({ required: true, type: Array })
  readonly selectOptions!: FilterSelectOption[];

  @Prop({ required: false, default: false })
  readonly enableControlConfig!: boolean;

  @Prop({ required: false, type: Number })
  private readonly selectedControlId?: WidgetId;

  @Prop({ required: false, type: Array, default: () => [] })
  private readonly chartControls!: ChartControl[];

  @Ref()
  private readonly loadMore!: DILoadMore;

  private get from(): number {
    return this.records.length;
  }

  private get groupOptions(): CheckboxGroupOption[] {
    return this.records.map((record, index) => {
      const value = isString(record[0]) && StringUtils.isEmpty(record[0]) ? '--' : record[0];
      return {
        text: value,
        value: value,
        key: index
      };
    });
  }

  protected get isSelectionMode() {
    return this.currentSelectOption.inputType == InputType.MultiSelect;
  }

  private get hideControlConfig(): boolean {
    switch (this.optionSelected) {
      case StringConditionTypes.notNull:
      case StringConditionTypes.isnull:
      case StringConditionTypes.notEmpty:
      case StringConditionTypes.isEmpty:
        return true;
      default:
        return false;
    }
  }

  private get currentSelectOption(): FilterSelectOption {
    return this.selectOptions.find(options => options.id == this.optionSelected) ?? this.selectOptions[0];
  }

  @Watch('optionSelected')
  handleOnOptionSelected() {
    this.relocation();
  }

  created() {
    this.optionSelected = (this.defaultOptionSelected as any) ?? FilterConstants.DEFAULT_STRING_SELECTED;
    this.isManualInput = !isNumber(this.selectedControlId);
    if (this.isSelectionMode && this.isManualInput) {
      this.handleLoadChartData();
    }
  }

  getSelectedCondition(): StringConditionTypes {
    return this.optionSelected;
  }

  getCurrentValues(): string[] {
    if (this.isManualInput) {
      return this.isSelectionMode ? this.valuesSelected : this.inputValues;
    } else {
      return this.inputValues;
    }
  }

  getCurrentInputType(): InputType {
    return this.currentSelectOption.inputType;
  }

  private getQuerySetting(): QuerySetting {
    const queryProfileBuilder: QueryProfileBuilder = Di.get(QueryProfileBuilder);
    return queryProfileBuilder.buildQueryForStringData([this.profileField]);
  }

  @Watch('defaultValues', { immediate: true })
  private handleOnChangedDefaultValues(newValues: string[]) {
    if (ListUtils.isNotEmpty(newValues)) {
      if (this.isManualInput && this.isSelectionMode) {
        this.valuesSelected = [...newValues];
        this.inputValues = [];
      } else {
        this.inputValues = [...newValues];
        this.valuesSelected = [];
      }
    } else {
      this.valuesSelected = [];
    }
  }

  private handleSelectedColumnsChanged(newValues: string[]) {
    this.valuesSelected = newValues;
  }

  private async handleLoadChartData() {
    try {
      this.errorMsg = '';
      this.initStatus = Status.Loading;
      this.records = [];
      const chartQueryResponse: AbstractTableResponse = await this.loadChartQueryResponse(this.from, FilterConstants.DEFAULT_LOAD_ITEM_SIZE);
      this.records = chartQueryResponse.records ?? [];
      this.relocation();
      this.initStatus = Status.Loaded;
    } catch (ex) {
      Log.error('handleLoadChartData::error cause', ex);
      this.records = [];
      this.relocation();
      this.initStatus = Status.Error;
      this.errorMsg = DIException.fromObject(ex).getPrettyMessage();
    }
  }

  private loadChartQueryResponse(from: number, size: number): Promise<AbstractTableResponse> {
    const dashboardService: QueryService = Di.get(QueryService);
    const request = QueryRequest.fromQuery(this.getQuerySetting(), from, size, DashboardModule.id);
    return dashboardService.query(request).then(r => r as AbstractTableResponse);
  }

  private async handleLoadMoreChartResponse() {
    try {
      const newQueryResponse: AbstractTableResponse = await this.loadChartQueryResponse(this.from, FilterConstants.DEFAULT_LOAD_ITEM_SIZE);
      if (ListUtils.isEmpty(newQueryResponse.records)) {
        this.handleStopLoadMore();
      } else {
        this.handleLoadMoreCompleted(newQueryResponse.records ?? []);
      }
    } catch (ex) {
      this.handleStopLoadMore();
      Log.error('handleLoadMoreChartResponse:: error cause', ex);
    }
  }

  private handleStopLoadMore() {
    this.canLoadMore = false;
    this.isLoadMore = false;
  }

  private handleLoadMoreCompleted(records: any[][]) {
    this.records = this.records.concat(records);
    this.canLoadMore = true;
    this.isLoadMore = false;
  }

  private handleScroll(process: number) {
    this.loadMore.handleScroll({ process: process });
  }

  protected relocation(): void {
    this.$emit('relocation');
  }

  private handleChangeIsManualInput(isManualInput: boolean) {
    this.isManualInput = isManualInput;
    if (this.isManualInput && this.initStatus !== Status.Loaded) {
      this.handleLoadChartData();
    } else {
      this.relocation();
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~bootstrap/scss/bootstrap-grid';

.string-filter-area {
  display: flex;
  flex-direction: column;

  .string-listing-container {
    flex: 1;
    height: 100%;
    display: flex;

    > .multi-selection-area {
      flex: 1;
      max-height: 360px;
      width: 100%;

      @include media-breakpoint-down(xs) {
        margin: 2px 0;
        max-height: 280px;
      }

      @include media-breakpoint-down(sm) {
        margin: 4px 0;
        max-height: 280px;
      }

      .string-filter-area-multi-selection {
        ::v-deep {
          .custom-control-label {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
