<template>
  <div class="visualize-preview-area position-relative">
    <div class="w-100 h-100">
      <template v-if="hasError">
        <ErrorWidget :error="errorMessage" @onRetry="handleRerender"></ErrorWidget>
      </template>
      <template v-else-if="isShowHint">
        <HintPanel :itemSelected="itemSelected"></HintPanel>
      </template>
      <template v-else>
        <div class="h-100 w-100 position-relative dashboard-background-color" widget-preview-area>
          <ChartHolder ref="chartHolder" :isEnableFullSize="false" :isPreview="true" :metaData="currentChartInfo" class="preview-chart-container"></ChartHolder>
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
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';

import { Status, VisualizationItemData } from '@/shared';
import { ChartInfo } from '@core/domain/Model';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import HintPanel from '@/screens/ChartBuilder/VizPanel/HintPanel.vue';
import EmptyWidget from '@/screens/DashboardDetail/components/WidgetContainer/charts/ErrorDisplay/EmptyWidget.vue';
import ChartHolder from '@/screens/DashboardDetail/components/WidgetContainer/charts/ChartHolder.vue';
import ChartHolderController from '@/screens/DashboardDetail/components/WidgetContainer/charts/ChartHolderController';
import { MapResponse } from '@core/domain/Response';
import { ListUtils } from '@/utils';
import MatchingLocationButton from '@/screens/ChartBuilder/VizPanel/MatchingLocationButton.vue';
import ErrorWidget from '@/shared/components/ErrorWidget.vue';
import { _ChartStore } from '@/screens/DashboardDetail/stores';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';

@Component({
  components: { ErrorWidget, ChartHolder, EmptyWidget, HintPanel, StatusWidget, MatchingLocationButton }
})
export default class PreviewPanel extends Vue {
  @Prop({ type: Boolean, default: false })
  private readonly isEditMode!: boolean;

  private currentChartInfo: ChartInfo | null = null;
  @Ref()
  private readonly chartHolder!: ChartHolderController;

  private get itemSelected(): VisualizationItemData {
    return _ConfigBuilderStore.itemSelected;
  }

  private get isShowHint(): boolean {
    return !this.currentChartInfo;
  }

  private get errorMessage(): string {
    return _ChartStore.mapErrorMessage[this.currentChartInfo?.id!] || '';
  }

  private get hasError(): boolean {
    return _ChartStore.statuses[this.currentChartInfo?.id!] === Status.Error;
  }

  private get enableMatchingButton(): boolean {
    if (this.currentChartInfo?.id && MapResponse.isMapResponse(_ChartStore.chartDataResponses[this.currentChartInfo.id])) {
      const currentMapResponse: MapResponse = _ChartStore.chartDataResponses[this.currentChartInfo.id] as MapResponse;
      return !this.isEditMode && ListUtils.isNotEmpty(currentMapResponse?.unknownData);
    }
    return false;
  }

  renderChart(chartInfo: ChartInfo | null) {
    this.prepareChart(chartInfo);
    if (chartInfo) {
      this.$nextTick(() => this.chartHolder?.renderChart(chartInfo));
    }
  }

  updateChart(chartInfo: ChartInfo | null) {
    this.currentChartInfo = chartInfo;
    if (chartInfo) {
      this.$nextTick(() => this.chartHolder?.updateChart(chartInfo));
    }
  }

  private handleRerender(): void {
    this.renderChart(this.currentChartInfo!);
  }

  private prepareChart(chartInfo: ChartInfo | null) {
    this.currentChartInfo = chartInfo;
    // fix: bug chart can't reload
    if (chartInfo) {
      _ChartStore.setStatusLoading(chartInfo.id);
    }
  }
  private onMatchingButtonClicked() {
    this.$emit('clickMatchingButton');
  }
}
</script>
<style lang="scss" scoped>
.visualize-preview-area {
  border-radius: 4px;

  .dashboard-background-color {
    background: var(--dashboard-gradient-background-color, #fff);
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
