<template>
  <EtlModal
    secondary-background-color
    ref="modal"
    class="add-chart-modal"
    @submit="submit"
    @hidden="resetModel"
    :disabled="selectedCharts.length === 0"
    :loading="loading"
    :actionName="actionName"
    borderCancel
    :width="444"
    builder-default-style
  >
    <template #header>
      <div class="mr-auto">
        <h4 class="title">{{ title }}</h4>
        <h6 class="sub-title">{{ subTitle }}</h6>
      </div>
    </template>
    <div class="add-chart-modal-container">
      <DiSearchInput ref="inputSearch" class="mb-2" border placeholder="Search..." :value="keyword" @change="value => (keyword = value)" />
      <template v-if="containChart">
        <vuescroll :ops="scrollOption" style="position:unset">
          <div class="chart-item" v-for="chart in charts" :key="`chart-${chart.id}`" @click="toggleChart(chart.id)">
            <div class="chart-info">
              <template>
                <img
                  v-if="getSrc(chart).length > 0"
                  :src="require(`@/assets/icon/charts/${getSrc(chart)}`)"
                  class="unselectable text-center chart-icon"
                  alt="chart"
                />
                <div v-else class="chart-icon"></div>
              </template>
              <div class="chart-title">{{ chart.setting.getChartOption().getTitle() }}</div>
            </div>
            <MultiChoiceItem :is-selected="isChartSelected(chart.id)" :item="choiceOption" />
          </div>
        </vuescroll>
      </template>
      <template v-else>
        <div class="h-75 w-100 d-flex align-items-center justify-content-center">
          <div>{{ emptyText }}</div>
        </div>
      </template>
    </div>
  </EtlModal>
</template>

<script lang="ts">
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import { DataBuilderConstantsV35, VerticalScrollConfigs } from '@/shared';
import MultiChoiceItem from '@/shared/components/filters/MultiChoiceItem.vue';
import { ListUtils, TimeoutUtils } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';
import { ChartInfo, Widget, WidgetId, Widgets } from '@core/common/domain';
import { DashboardService } from '@core/common/services';
import { Inject } from 'typescript-ioc';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { Config } from 'vuescroll';
import DiSearchInput from '@/shared/components/DiSearchInput.vue';
import { Log } from '@core/utils';

@Component({ components: { DiSearchInput, MultiChoiceItem, EtlModal } })
export default class AddChartModal extends Vue {
  private readonly choiceOption = {
    id: 'select',
    displayName: ''
  };
  scrollOption: Config = VerticalScrollConfigs;
  @Ref()
  private modal!: EtlModal;

  @Inject
  private dashboardService!: DashboardService;

  private widgets: Widget[] = [];

  private callback: ((charts: WidgetId[]) => void) | null = null;

  private selectedCharts: WidgetId[] = [];

  private keyword = '';

  private loading = false;

  private error = '';

  private emptyText = '';
  private actionName = '';
  private title = '';
  private subTitle = '';

  @Ref()
  private readonly inputSearch!: DiSearchInput;

  private get containChart(): boolean {
    return this.charts.length > 0;
  }

  private get charts(): ChartInfo[] {
    return (this.widgets?.filter(widget => widget.className === Widgets.Chart && StringUtils.isIncludes(this.keyword, widget.name)) as ChartInfo[]) ?? [];
  }

  show(
    widgets: Widget[],
    options?: {
      onCompleted?: (charts: WidgetId[]) => void;
      actionName: string;
      title: string;
      subTitle: string;
      emptyText: string;
    }
  ) {
    this.widgets = widgets;
    this.callback = options?.onCompleted || null;
    this.actionName = options?.actionName ?? '';
    this.title = options?.title ?? '';
    this.subTitle = options?.subTitle ?? '';
    this.emptyText = options?.emptyText ?? '';
    this.modal.show();
    TimeoutUtils.waitAndExec(
      null,
      () => {
        this.inputSearch.focus();
      },
      150
    );
  }

  private resetModel() {
    this.widgets = [];
    this.callback = null;
    this.selectedCharts = [];
    this.keyword = '';
  }

  private async submit() {
    this.modal.hide();
    if (this.callback) {
      return this.callback(this.selectedCharts);
    }
  }

  private getSrc(chart: ChartInfo): string {
    const chartType = chart.extraData?.currentChartType;
    Log.debug('getSrc', DataBuilderConstantsV35.ALL_ITEMS_AS_MAP.get(chartType!)?.src);
    if (chartType) {
      return DataBuilderConstantsV35.ALL_ITEMS_AS_MAP.get(chartType!)?.src ?? '';
    } else {
      return '';
    }
  }

  private toggleChart(id: WidgetId) {
    if (this.isChartSelected(id)) {
      this.selectedCharts = ListUtils.remove(this.selectedCharts, chartId => chartId === id);
    } else {
      this.selectedCharts.push(id);
    }
  }

  private isChartSelected(id: WidgetId): boolean {
    return this.selectedCharts.includes(id);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.add-chart-modal {
  .title {
    @include regular-text();
    font-size: 24px;
    margin-bottom: 4px;
  }

  .sub-title {
    margin-bottom: 12px;
  }

  .add-chart-modal-container {
    height: 400px;
    display: flex;
    flex-direction: column;

    .chart-item {
      height: 46px;
      padding: 16px -11px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;

      &:hover {
        background-color: var(--hover-color);
      }

      .chart-info {
        display: flex;
        width: 92%;
        align-items: center;

        .chart-icon {
          height: 24px;
          width: 24px;
        }

        .chart-title {
          @include bold-text-14();
          margin-left: 16px;
          font-weight: 500;
          clear: both;
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .choice-item {
        margin-right: -8px;
      }
    }
  }
}
</style>
