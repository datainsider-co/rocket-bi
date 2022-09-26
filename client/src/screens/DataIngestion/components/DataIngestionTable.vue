<template>
  <div class="table-container position-relative d-flex flex-column justify-content-between">
    <StatusWidget class="table-status-widget" ref="customTable" :error="errorMessage" :status="status" @retry="emitRetry">
      <div class="empty-data" v-if="isEmptyRecord">
        <slot>
          <EmptyWidget />
        </slot>
      </div>
      <CustomTable
        v-else
        id="table"
        class="table-right-border table"
        :headers="headers"
        :rows="records"
        :is-show-footer="false"
        :cell-width="cellWidth"
        :row-height="rowHeight"
        :max-height="maxHeight"
      ></CustomTable>
    </StatusWidget>
    <ListingFooter v-if="enablePagination" class="footer-table" :total-rows="total" total-row-title="row" @onPageChange="emitPageChange"></ListingFooter>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator';
import { HeaderData, Pagination, RowData } from '@/shared/models';
import CustomTable from '@chart/CustomTable/CustomTable.vue';
import { Status } from '@/shared';
import ListingFooter from '@/shared/components/user-listing/ListingFooter.vue';
import { Log } from '@core/utils';
import { ListUtils } from '@/utils';
import EmptyWidget from '@/screens/DashboardDetail/components/WidgetContainer/charts/ErrorDisplay/EmptyWidget.vue';
import StatusWidget from '@/shared/components/StatusWidget.vue';

@Component({
  components: { EmptyWidget, ListingFooter, CustomTable }
})
export default class DataIngestionTable extends Vue {
  @Prop({ required: true })
  status!: Status;

  @Prop({ required: true })
  errorMessage!: string;

  @Prop({ required: true })
  headers!: HeaderData[];

  @Prop({ required: true })
  records!: RowData[];

  @Prop({ required: true })
  total!: number;

  @Prop({ required: false, type: Number })
  private readonly cellWidth?: number;

  @Prop({ type: Number, default: 67 })
  private readonly rowHeight?: number;

  @Ref()
  customTable?: StatusWidget;

  private maxHeight = this.customTable?.$el.clientHeight ?? 300;

  private get enablePagination() {
    Log.debug('total::', this.total, this.records.length);
    if (this.total > 20) {
      return true;
    } else {
      return false;
    }
  }

  created() {
    this.$nextTick(() => {
      this.onResize();
    });
  }

  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
    });
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
  }

  onResize() {
    Log.debug('resize Custom Table height:', this.customTable);
    this.maxHeight = this.customTable?.$el.clientHeight ?? 300;
  }

  private get isEmptyRecord() {
    return ListUtils.isEmpty(this.records);
  }

  @Emit('onRetry')
  private emitRetry(event: Event): Event {
    return event;
  }

  @Emit('onPageChange')
  private emitPageChange(pagination: Pagination): Pagination {
    return pagination;
  }

  @Emit('onPerPageChange')
  private emitDisplayNumRowChange(rowPerPage: number): number {
    return rowPerPage;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin';
@import '~@/themes/scss/di-variables';

.table-container {
  .table-status-widget {
    height: calc(100% - 35px) !important;
    .empty-data {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .table {
      height: 100%;

      .infinite-table {
        height: 100% !important;

        tr {
          td,
          th {
            font-size: 16px;
          }
          td {
            opacity: 0.8 !important;
          }
        }
      }
    }
  }
  .footer-table {
    font-size: 16px !important;

    .user-profile-footer-total {
      @include media-breakpoint-down(sm) {
        display: none;
      }
    }

    .per-page-content {
      font-size: 14px !important;
    }

    input {
      border: none;
      background: var(--panel-background-color);
      text-decoration: underline;
    }
  }
}
</style>
