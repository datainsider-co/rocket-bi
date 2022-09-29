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
import { ChartInfo } from '@core/common/domain/model';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import HintPanel from '@/screens/chart-builder/viz-panel/HintPanel.vue';
import EmptyWidget from '@/screens/dashboard-detail/components/widget-container/charts/error-display/EmptyWidget.vue';
import ChartHolder from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder.vue';
import { MapResponse } from '@core/common/domain/response';
import { ListUtils } from '@/utils';
import MatchingLocationButton from '@/screens/chart-builder/viz-panel/MatchingLocationButton.vue';
import ErrorWidget from '@/shared/components/ErrorWidget.vue';
import { _ChartStore } from '@/screens/dashboard-detail/stores';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';

@Component({
  components: { ErrorWidget, ChartHolder, EmptyWidget, HintPanel, StatusWidget, MatchingLocationButton }
})
export default class PreviewPanel extends Vue {
  @Prop({ type: Boolean, default: false })
  private readonly isEditMode!: boolean;

  private currentChartInfo: ChartInfo | null = null;
  @Ref()
  private readonly chartHolder!: ChartHolder;

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
