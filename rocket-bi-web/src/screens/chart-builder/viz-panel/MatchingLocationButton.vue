<template>
  <div class="location-panel-container">
    <p class="mb-0 pt-1 mr-2">{{ countUnknownLocation }} unknown locations found</p>
    <DiButton :id="genBtnId('matching-location')" title="Matching" primary @click="handleMatching"></DiButton>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import DiButton from '@/shared/components/common/DiButton.vue';
import { MapResponse } from '@core/common/domain/response';
import { _ChartStore } from '@/screens/dashboard-detail/stores';
import { ChartInfo } from '@core/common/domain';
import MatchingLocationModal from '@/screens/chart-builder/viz-panel/MatchingLocationModal.vue';

@Component({
  components: { DiButton, MatchingLocationModal }
})
export default class MatchingLocationButton extends Vue {
  @Prop({ required: false, type: Object })
  currentChartInfo?: ChartInfo;

  private get countUnknownLocation(): number {
    if (this.currentChartInfo?.id && MapResponse.isMapResponse(_ChartStore.chartDataResponses[this.currentChartInfo.id])) {
      const currentMapResponse: MapResponse = _ChartStore.chartDataResponses[this.currentChartInfo.id] as MapResponse;
      return currentMapResponse?.unknownData.length ?? 0;
    }
    return 0;
  }

  private handleMatching() {
    this.openMatchingModal();
  }

  private openMatchingModal() {
    this.$emit('clickMatchingButton');
  }
}
</script>

<style lang="scss" scoped>
.location-panel-container {
  height: 30px;
  display: flex;
  flex-direction: row;
  justify-content: center;
}
</style>
