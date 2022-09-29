<template>
  <BModal
    id="chart-builder-modal"
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
import { ChartInfo, DatabaseSchema, DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { BuilderMode, VisualizationItemData } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { ChartBuilderConfig, DefaultChartBuilderConfig } from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderConfig';

export interface TChartBuilderOptions {
  database?: DatabaseSchema | null;
  selectedTables?: string[] | null;
  config?: ChartBuilderConfig;
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
  > .modal-max {
    height: 100vh;
    margin: auto;

    //max-width: calc(80vh / 0.5625);
    max-width: 100%;
    min-width: 900px;
    width: 85% !important;

    > .modal-content {
      height: 88vh;
      min-height: 640px;
      overflow: auto;

      > .modal-body {
        height: inherit;
        padding: 0;
      }
    }

    //
    //@media (min-width: 1200px) and (max-width: 1400px) {
    //  max-width: 1150px;
    //  > .modal-content {
    //    height: 650px;
    //  }
    //}
    //@media (min-width: 1400px) and (max-width: 1800px) {
    //  max-width: 1290px;
    //  > .modal-content {
    //    height: 735px;
    //  }
    //}
    //@media (min-width: 1800px) {
    //  max-width: calc(77vh / 0.5652);
    //  > .modal-content {
    //    height: 77vh;
    //    min-height: 735px;
    //  }
    //}
  }
}
</style>
