<template>
  <BModal
    id="chart-builder-modal"
    ignore-enforce-focus-selector=".internal-filter-popover"
    v-model="isShowChartBuilder"
    :cancel-disabled="false"
    :hide-footer="true"
    :hide-header="true"
    :no-close-on-backdrop="true"
    :no-close-on-esc="true"
    centered
    class="rounded"
    size="max"
    static
    @hidden="onModalHidden"
    @shown="onModalShown"
  >
    <LoadingComponent :isLoading="isLoading">
      <ChartBuilder
        v-if="isShowChartBuilder"
        ref="chartBuilder"
        :builderMode="builderMode"
        :visualizationItems="visualizationItems"
        @onAddChart="handleAddChart"
        @onCancel="onCancel"
        @onUpdateChart="handleUpdateChart"
      >
      </ChartBuilder>
    </LoadingComponent>
  </BModal>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import ChartBuilder from '@/screens/chart-builder/chart-builder2/ChartBuilderController.vue';
import ChartBuilderController from '@/screens/chart-builder/chart-builder2/ChartBuilderController';
import { ChartInfo, DatabaseInfo, DIException, ChartControl } from '@core/common/domain';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { BuilderMode, VisualizationItemData } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { ChartBuilderConfig, DefaultChartBuilderConfig } from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderConfig';

export interface TChartBuilderOptions {
  database?: DatabaseInfo | null;
  selectedTables?: string[] | null;
  config?: ChartBuilderConfig;
  chartControls?: ChartControl[];
}

@Component({
  components: { ChartBuilder }
})
export default class ChartBuilderModal extends Vue {
  private isShowChartBuilder = false;
  private isLoading = false;
  private builderMode = BuilderMode.Create;
  @Prop({ type: Array, required: true })
  private visualizationItems!: VisualizationItemData[];
  private config: ChartBuilderConfig = DefaultChartBuilderConfig;
  private onAddChart!: (chartInfo: ChartInfo) => Promise<void>;
  private onUpdateChart!: (chartInfo: ChartInfo) => Promise<void>;

  @Ref()
  private readonly chartBuilder?: ChartBuilderController;

  showAddChartModal(onAddChart: (chartInfo: ChartInfo) => Promise<void>, options?: TChartBuilderOptions | null) {
    this.onAddChart = onAddChart;
    this.isShowChartBuilder = true;
    this.builderMode = BuilderMode.Create;
    this.$nextTick(() => {
      if (this.chartBuilder) {
        this.chartBuilder.initDefault(null, options);
      }
    });
  }

  showAddChartFilterModal(parentChart: ChartInfo, onAddChart: (chartInfo: ChartInfo) => Promise<void>) {
    this.onAddChart = onAddChart;
    this.isShowChartBuilder = true;
    this.builderMode = BuilderMode.Create;

    this.$nextTick(() => {
      if (this.chartBuilder) {
        this.chartBuilder.initDefault(parentChart);
      }
    });
  }

  showUpdateChartModal(chartInfo: ChartInfo, onUpdateChart: (chartInfo: ChartInfo) => Promise<void>, options?: TChartBuilderOptions) {
    this.isShowChartBuilder = true;
    this.onUpdateChart = onUpdateChart;
    this.builderMode = BuilderMode.Update;

    this.$nextTick(() => {
      if (this.chartBuilder) {
        this.chartBuilder.init(chartInfo, options);
      }
    });
  }

  hideModal() {
    this.isShowChartBuilder = false;
  }

  private onCancel() {
    this.hideModal();
  }

  private showLoading() {
    this.isLoading = true;
  }

  @Track(TrackEvents.SubmitAddChart, {
    chart_title: (_: ChartBuilderModal, args: any) => args[0].name ?? 'Untitled chart',
    chart_type: (_: ChartBuilderModal, args: any) => args[0].extraData?.currentChartType
  })
  private async handleAddChart(chartInfo: ChartInfo) {
    try {
      this.showLoading();
      await this.onAddChart(chartInfo);
      this.hideLoading();
      this.hideModal();
    } catch (ex) {
      this.handleError(ex);
    }
  }

  @Track(TrackEvents.SubmitConfigChart, {
    chart_title: (_: ChartBuilderModal, args: any) => args[0].name ?? 'Untitled chart',
    chart_type: (_: ChartBuilderModal, args: any) => args[0].extraData?.currentChartType,
    chart_id: (_: ChartBuilderModal, args: any) => args[0].id
  })
  private async handleUpdateChart(chartInfo: ChartInfo) {
    try {
      this.showLoading();
      await this.onUpdateChart(chartInfo);
      this.hideLoading();
      this.hideModal();
    } catch (ex) {
      this.handleError(ex);
    }
  }

  private handleError(ex: any) {
    this.hideLoading();
    Log.error('ChartBuilderModal::handleError', ex);
    const exception = DIException.fromObject(ex);
    PopupUtils.showError(exception.message ?? 'Unknown error');
  }

  private hideLoading() {
    this.isLoading = false;
  }

  private onModalHidden() {
    _ConfigBuilderStore.setAllowBack(true);
    this.$emit('onHidden');
  }

  private onModalShown() {
    _ConfigBuilderStore.setAllowBack(false);
  }
}
</script>

<style lang="scss">
#chart-builder-modal {
  .modal-dialog {
    //max-height: 735px;
    //min-height: 640px;

    max-width: 1400px !important;
  }

  > .modal-max {
    max-height: 100%;

    > .modal-content {
      max-height: 735px;
      min-height: 640px;
      display: flex;
      border-radius: 20px !important;

      > .modal-body {
        max-height: 735px;
        height: calc(100vh - 100px);
        min-height: 640px;
        padding: 0 !important;
        overflow: hidden;
        border-radius: 20px !important;

        .loading-area {
          display: flex;
          flex: 1;
          #builder-controller {
            display: flex;
            flex: 1;
            z-index: 0;
          }
        }
      }
    }
  }
}
</style>
