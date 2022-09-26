<template>
  <BModal
    id="widget-full-size"
    ref="modal"
    body-class="full-screen-modal"
    centered
    hide-footer
    hide-header
    modal-class="custom-modal"
    size="xl"
    static
    style="z-index: 10001"
  >
    <ChartHolder v-if="chartInfo" :isFullSizeMode="true" :metaData="chartInfo" :showEditComponent="false" class="box-ratio"> </ChartHolder>
  </BModal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { ChartInfo } from '@core/domain/Model';
import { BModal } from 'bootstrap-vue';
import ChartHolder from '@/screens/DashboardDetail/components/WidgetContainer/charts/ChartHolder.vue';

@Component({
  components: { ChartHolder }
})
export default class WidgetFullSizeModal extends Vue {
  @Ref()
  private modal!: BModal;

  private chartInfo: ChartInfo | null = null;

  show(chartInfo: ChartInfo) {
    this.chartInfo = chartInfo;
    this.modal.show();
  }

  hide() {
    this.modal.hide();
  }
}
</script>

<style lang="scss" scoped>
@import '~bootstrap/scss/bootstrap-grid';

::v-deep {
  .custom-modal {
    width: 100%;

    .modal-dialog {
      max-width: 90%;

      @include media-breakpoint-down(xs) {
        max-width: unset;
      }

      .full-screen-modal {
        box-sizing: border-box;

        height: 1000px;

        padding: 0;

        @media (min-width: 1888px) {
          height: 900px;
        }

        @media (max-width: 1600px) {
          height: 800px;
        }

        @include media-breakpoint-down(xl) {
          height: 705px;
        }

        @include media-breakpoint-down(lg) {
          height: 600px;
        }

        @include media-breakpoint-down(md) {
          height: 500px;
        }

        @include media-breakpoint-down(sm) {
          height: 400px;
        }

        @include media-breakpoint-down(xs) {
          height: 300px;
        }
      }
    }
  }
}
</style>
