<template>
  <BModal
    id="location-normalize-modal"
    v-model="isShowModal"
    :cancel-disabled="false"
    :hide-footer="true"
    :hide-header="true"
    :no-close-on-backdrop="true"
    :no-close-on-esc="true"
    centered
    class="rounded"
    size="lg"
  >
    <div class="h-100 w-100 d-flex flex-column px-4 py-3">
      <div class="d-inline-flex w-100 justify-content-between mb-3">
        <DiTitle class="modal-title ">Matching</DiTitle>
        <img alt="" class="close-search-btn btn-ghost ic-32" src="@/assets/icon/ic_close.svg" @click="handleClose" />
      </div>
      <p style="color: var(--secondary-text-color)">Please choose your data that matches the data of DataInsider</p>
      <LocationNormalizeTable
        :current-chart-info="currentChartInfo"
        :normalized-location="normalizedLocation"
        :unknown-locations="unknownLocations"
        class="h-75"
      />
      <div class="d-flex flex-row justify-content-center w-100">
        <div
          :id="genBtnId('submit-matching-location')"
          class="w-25 btn-primary align-items-center unselectable mt-4 py-2"
          style="text-align: center"
          @click="handleApplyMatching"
        >
          Apply Matching
        </div>
      </div>
    </div>
  </BModal>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import DiButton from '@/shared/components/common/DiButton.vue';
import DiTitle from '@/shared/components/DiTitle.vue';
import LocationNormalizeTable from '@/screens/chart-builder/viz-panel/MatchingLocationTable.vue';
import { MapItem, MapResponse } from '@core/common/domain/response';
import { StringUtils } from '@/utils/StringUtils';
import { ChartInfo } from '@core/common/domain';
import { ChartDataModule } from '@/screens/dashboard-detail/stores';
import { Log } from '@core/utils';
import { cloneDeep } from 'lodash';

@Component({
  components: { DiTitle, DiButton, LocationNormalizeTable }
})
export default class MatchingLocationModal extends Vue {
  private isShowModal = false;

  @Prop({ required: false, type: Object })
  currentChartInfo?: ChartInfo;

  private get unknownLocations(): MapItem[] {
    if (this.currentChartInfo?.id && MapResponse.isMapResponse(ChartDataModule.chartDataResponses[this.currentChartInfo.id])) {
      const currentMapResponse: MapResponse = ChartDataModule.chartDataResponses[this.currentChartInfo.id] as MapResponse;
      const unknownLocations: MapItem[] = cloneDeep(currentMapResponse?.unknownData ?? []);
      return unknownLocations.sort((item, nextItem) => StringUtils.compare(item.name, nextItem.name));
    }
    return [];
  }

  private get normalizedLocation(): MapItem[] {
    if (this.currentChartInfo?.id && MapResponse.isMapResponse(ChartDataModule.chartDataResponses[this.currentChartInfo.id])) {
      const currentMapResponse: MapResponse = ChartDataModule.chartDataResponses[this.currentChartInfo.id] as MapResponse;
      return currentMapResponse?.data ?? [];
    }
    return [];
  }

  close() {
    this.isShowModal = false;
  }

  show() {
    Log.debug('im here:: ononono');
    this.isShowModal = true;
  }

  private handleClose() {
    this.close();
    this.$emit('onCancelMatching');
  }

  private handleApplyMatching() {
    this.close();
    this.$emit('onApplyMatching');
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .modal-dialog {
    border-radius: 4px;
    padding: 0;
    height: 80vh !important;
    width: 40% !important;
    max-width: unset !important;
  }

  .modal-body {
    width: 100%;
    height: 80vh !important;
    padding: 0;
  }

  .visualization {
    padding: 0;
  }
}
</style>
