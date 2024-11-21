<template>
  <div class="visualize-preview-area position-relative">
    <div class="w-100 h-100">
      <template v-if="hasError">
        <ErrorWidget :error="errorMessage" @onRetry="handleRerender"></ErrorWidget>
      </template>

      <template v-else-if="status === Statuses.Loading">
        <DiLoading />
      </template>
      <template v-else-if="isShowHint">
        <HintPanel :itemSelected="itemSelected"></HintPanel>
      </template>
      <template v-else>
        <div class="h-100 w-100 position-relative dashboard-background-color" widget-preview-area>
          <ChartHolder
            :style="chartHolderStyle"
            ref="chartHolder"
            :isPreview="true"
            :metaData="currentChartInfo"
            :widget-setting="widgetSetting"
            class="preview-chart-container"
          ></ChartHolder>
          <MatchingLocationButton
            v-if="enableMatchingButton"
            class="location-panel"
            :current-chart-info="currentChartInfo"
            @clickMatchingButton="onMatchingButtonClicked"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Inject, Prop, Ref, Vue } from 'vue-property-decorator';

import { Status, VisualizationItemData } from '@/shared';
import { ChartInfo, QuerySettingClassName, WidgetSetting } from '@core/common/domain/model';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import HintPanel from '@/screens/chart-builder/viz-panel/HintPanel.vue';
import EmptyWidget from '@/screens/dashboard-detail/components/widget-container/charts/error-display/EmptyWidget.vue';
import ChartHolder from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder.vue';
import { MapResponse } from '@core/common/domain/response';
import { ListUtils } from '@/utils';
import MatchingLocationButton from '@/screens/chart-builder/viz-panel/MatchingLocationButton.vue';
import ErrorWidget from '@/shared/components/ErrorWidget.vue';
import { ChartDataModule, DashboardModule } from '@/screens/dashboard-detail/stores';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import Dashboard from '@/screens/dashboard-detail/components/dashboard/Dashboard';
import DiLoading from '@/shared/components/DiLoading.vue';
import EventBus from '@/shared/components/chat/helpers/EventBus';
import { ChartBuilderEvent } from '@/shared/components/chat/controller/functions/ChartGenerator';

@Component({
  components: { DiLoading, ErrorWidget, ChartHolder, EmptyWidget, HintPanel, StatusWidget, MatchingLocationButton }
})
export default class PreviewPanel extends Vue {
  private readonly CELL_WIDTH = 27.5;
  private readonly Statuses = Status;
  protected status = Status.Loaded;

  @Prop({ type: Boolean, default: false })
  protected readonly isEditMode!: boolean;

  protected currentChartInfo: ChartInfo | null = null;
  @Ref()
  readonly chartHolder!: ChartHolder;

  @Inject('getCellWidth')
  protected readonly getCellWidth!: () => number | undefined;

  protected get itemSelected(): VisualizationItemData {
    return _ConfigBuilderStore.itemSelected;
  }

  protected get isShowHint(): boolean {
    return !this.currentChartInfo;
  }

  protected get errorMessage(): string {
    return ChartDataModule.mapErrorMessage[this.currentChartInfo?.id!] || '';
  }

  protected get hasError(): boolean {
    return ChartDataModule.statuses[this.currentChartInfo?.id!] === Status.Error;
  }

  protected get widgetSetting(): WidgetSetting {
    return DashboardModule.setting.widgetSetting;
  }

  get chartHolderStyle() {
    return {
      height: `${(this.currentChartInfo?.getDefaultPosition().height ?? 1) * Dashboard.getCellHeight() - 16}px !important`,
      width: `${this.CELL_WIDTH * this.defaultChartWidth - 16}px !important`
    };
  }

  protected get defaultChartWidth() {
    return this.currentChartInfo?.getDefaultPosition().width ?? 1;
  }

  protected get enableMatchingButton(): boolean {
    if (this.currentChartInfo?.id && MapResponse.isMapResponse(ChartDataModule.chartDataResponses[this.currentChartInfo.id])) {
      const currentMapResponse: MapResponse = ChartDataModule.chartDataResponses[this.currentChartInfo.id] as MapResponse;
      return !this.isEditMode && ListUtils.isNotEmpty(currentMapResponse?.unknownData);
    }
    return false;
  }

  public renderChart(chartInfo: ChartInfo | null): void {
    this.prepareChart(chartInfo);
    if (chartInfo) {
      this.$nextTick(() => this.chartHolder?.renderChart(chartInfo));
    }
  }

  public updateChart(chartInfo: ChartInfo | null): void {
    this.currentChartInfo = chartInfo;
    if (chartInfo) {
      this.$nextTick(() => this.chartHolder?.updateChart(chartInfo));
    }
  }

  public resizeChart(): void {
    this.$nextTick(() => this.chartHolder?.resizeChart());
  }

  protected handleRerender(): void {
    this.renderChart(this.currentChartInfo!);
  }

  protected prepareChart(chartInfo: ChartInfo | null) {
    this.currentChartInfo = chartInfo;
    // fix: bug chart can't reload
    if (chartInfo) {
      ChartDataModule.setStatusLoading(chartInfo.id);
    }
  }
  protected onMatchingButtonClicked() {
    this.$emit('clickMatchingButton');
  }

  mounted() {
    EventBus.$on(ChartBuilderEvent.analyzingPrompt, this.showLoading);
    EventBus.$on(ChartBuilderEvent.analyzePromptCompleted, this.showLoaded);
  }

  beforeDestroy() {
    EventBus.$off(ChartBuilderEvent.analyzingPrompt, this.showLoading);
    EventBus.$off(ChartBuilderEvent.analyzePromptCompleted, this.showLoaded);
  }

  showLoading() {
    this.status = Status.Loading;
  }

  showLoaded() {
    this.status = Status.Loaded;
  }
}
</script>
<style lang="scss" scoped>
.visualize-preview-area {
  border-radius: 4px;

  .dashboard-background-color {
    //background: var(--dashboard-gradient-background-color, #fff);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.error-area {
  .hint-panel {
    height: 100%;
  }
}

.location-panel {
  bottom: 24px;
  position: absolute;
  width: 100%;
}
</style>
