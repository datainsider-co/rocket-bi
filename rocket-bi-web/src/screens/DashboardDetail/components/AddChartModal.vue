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
      <div @click.stop class="input-group mb-2">
        <input v-model.trim="keyword" type="text" placeholder="Search..." class="form-control" autofocus />
      </div>
      <template v-if="charts.length > 0">
        <vuescroll :ops="scrollOption" style="position:unset">
          <div class="chart-item" v-for="chart in charts" :key="`chart-${chart.id}`" @click="toggleChart(chart.id)">
            <div class="chart-info">
              <img :src="require(`@/assets/icon/charts/${getSrc(chart)}`)" class="unselectable text-center chart-icon" alt="chart" />
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
import EtlModalCtrl from '@/screens/DataCook/components/EtlModal/EtlModal.ctrl';
import EtlModal from '@/screens/DataCook/components/EtlModal/EtlModal.vue';
import { DataBuilderConstantsV35, VerticalScrollConfigs } from '@/shared';
import MultiChoiceItem from '@/shared/components/filters/MultiChoiceItem.vue';
import { ListUtils } from '@/utils';
import { StringUtils } from '@/utils/string.utils';
import { ChartInfo, Widget, WidgetId, Widgets } from '@core/domain';
import { DashboardService } from '@core/services';
import { Inject } from 'typescript-ioc';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { Config } from 'vuescroll';

@Component({ components: { MultiChoiceItem, EtlModal } })
export default class AddChartModal extends Vue {
  private readonly choiceOption = {
    id: 'select',
    displayName: ''
  };
  scrollOption: Config = VerticalScrollConfigs;
  @Ref()
  private modal!: EtlModalCtrl;

  @Inject
  private dashboardService!: DashboardService;

  private widgets: Widget[] = [];

  private callback: ((charts: WidgetId[]) => void) | null = null;

  private selectedCharts: WidgetId[] = [];

  private keyword = '';

  private loading = false;

  private error = '';

  private action: 'add' | 'remove' = 'add';

  private get emptyText(): string {
    return this.action === 'add' ? 'No charts have been added to this tab' : 'No charts have been removed from this tab';
  }

  private get actionName(): string {
    return this.action === 'add' ? 'Add' : 'Remove';
  }

  private get title(): string {
    return this.action === 'add' ? 'Add Chart' : 'Remove Chart';
  }

  private get subTitle(): string {
    return this.action === 'add' ? 'Select chart to add to this tab' : 'Remove chart from this tab';
  }

  private get charts(): ChartInfo[] {
    return (this.widgets?.filter(widget => widget.className === Widgets.Chart && StringUtils.isIncludes(this.keyword, widget.name)) as ChartInfo[]) ?? [];
  }

  show(widgets: Widget[], options?: { onCompleted?: (charts: WidgetId[]) => void; action?: 'add' | 'remove' }) {
    this.widgets = widgets;
    this.callback = options?.onCompleted || null;
    this.action = options?.action || 'add';
    this.modal.show();
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
    return DataBuilderConstantsV35.ALL_ITEMS_AS_MAP.get(chartType!)?.src ?? '';
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

    .input-group {
      background-color: var(--dashboard-input-background-color);
      input {
        padding: 0 12px;
        background: unset;
      }
    }

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
