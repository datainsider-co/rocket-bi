<template>
  <div class="di-table-2">
    <div class="di-table-2-rule" ref="tableRule"></div>
    <div class="di-table-2-container">
      <StatusWidget :error="errorMsg" :status="status" loading-class="di-table-2-container-loading" @retry="emitRetry">
        <template #default>
          <template v-if="isEmpty">
            <slot name="empty"></slot>
          </template>
          <template v-else>
            <CustomTable
              :id="id"
              ref="customTable"
              :custom-cell-call-back="customCellCallBack"
              :disable-sort="disableSort"
              :headers="headers"
              :is-show-footer="false"
              :maxHeight="maxHeight"
              :rows="records"
              class="table-grid"
              enableScrollBar
              @beforeScrollEnd="handleBeforeScrollEnd"
              @scrollEnd="handleScrollEnd"
              @sortChanged="emitOnSortChanged"
            />
          </template>
        </template>
      </StatusWidget>
      <ListingFooter
        v-if="enablePagination"
        ref="footer"
        :total-rows="total"
        class="di-table-2-footer"
        :total-row-title="totalRowTitle"
        :default-row-per-page="defaultRowPerPage"
        @onPageChange="emitPageChange"
      ></ListingFooter>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { HeaderData, Pagination, RowData } from '@/shared/models';
import CustomTable from '@chart/custom-table/CustomTable.vue';
import { DefaultPaging, Status } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { ListUtils, TimeoutUtils } from '@/utils';
import { CustomCellCallBack } from '@chart/custom-table/TableData';
import ListingFooter from '@/shared/components/user-listing/ListingFooter.vue';
import { Log } from '@core/utils';
import { isFunction } from 'lodash';
import { SortDirection } from '@core/common/domain';

@Component({
  components: { CustomTable, StatusWidget, ListingFooter }
})
export default class DiTable2 extends Vue {
  private maxHeight = 0;

  @Ref()
  private readonly customTable?: CustomTable;

  @Ref()
  private readonly footer?: ListingFooter;

  @Prop({ required: false, type: String, default: 'directory-table' })
  private readonly id!: string;

  @Prop({ required: true })
  private readonly status!: Status;

  @Prop({ required: true })
  private readonly errorMsg!: string;

  @Prop({ required: true, type: Array })
  private readonly records!: RowData[];

  @Prop({ required: true, type: Array })
  private readonly headers!: HeaderData[];

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isShowPagination!: boolean;

  @Prop({ required: false, type: Number, default: 0 })
  private readonly total!: number;

  @Prop({ required: false, type: Function })
  private readonly getMaxHeight?: (isShowPagination: boolean) => number;

  @Prop({ required: false, type: Boolean })
  private readonly disableSort!: boolean;

  @Prop({ required: false, type: Boolean, default: true })
  private readonly allowShowEmpty!: boolean;

  @Prop({ required: false, type: String, default: 'row' })
  private readonly totalRowTitle!: string;

  @Prop({ required: false, type: [Number, String], default: DefaultPaging.DefaultPageSize })
  private readonly defaultRowPerPage!: number;

  @Prop({ required: false, type: [Number, String], default: 30 })
  private readonly paddingPagination!: number;
  @Prop({ required: false, type: [Number, String], default: 0 })
  private readonly paddingNoPagination!: number;

  @Ref()
  private readonly tableRule!: HTMLDivElement;

  private get enablePagination() {
    return this.isShowPagination && this.total > 20 && this.status !== Status.Loading && this.status !== Status.Error;
  }

  private get isEmpty(): boolean {
    return this.allowShowEmpty && ListUtils.isEmpty(this.records);
  }

  private get customCellCallBack(): CustomCellCallBack {
    return {
      onClickRow: cell => this.$emit('onClickRow', cell.rowData),
      onContextMenu: mouseData => this.$emit('onRightClickRow', mouseData)
    };
  }

  mounted() {
    window.addEventListener('resize', this.handleResizeScreen);
    // dispatch auto resize table
    this.handleResizeScreen();
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResizeScreen);
  }

  clearSort() {
    this.customTable?.clearSort();
  }

  setSort(key: string, direction: SortDirection) {
    this.customTable?.setSort(key, direction);
  }

  /**
   * Render lai table, nếu force = true, table sẽ init lại từ đầu
   */
  reRender(force?: boolean) {
    this.customTable?.reRender(force);
  }

  updateMaxHeight() {
    if (isFunction(this.getMaxHeight)) {
      this.maxHeight = this.getMaxHeight(this.enablePagination);
    } else {
      this.maxHeight = this.defaultGetMaxHeight(this.enablePagination);
    }
  }

  @Emit('onPageChange')
  private emitPageChange(pagination: Pagination): Pagination {
    return pagination;
  }

  @Emit('onSortChanged')
  private emitOnSortChanged(header: HeaderData) {
    return header;
  }

  @Watch('enablePagination')
  private handleResizeScreen() {
    this.$nextTick(() => {
      TimeoutUtils.waitAndExec(
        null,
        () => {
          this.updateMaxHeight();
          Log.debug('handleResizeScreen::', this.maxHeight);
          // this.reRender();
        },
        10
      );
    });
  }

  private defaultGetMaxHeight(enablePagination: boolean) {
    Log.debug('defaultGetMaxHeight::', this.tableRule.clientHeight);
    if (enablePagination) {
      return this.tableRule.clientHeight - this.paddingPagination;
    } else {
      return this.tableRule.clientHeight - this.paddingNoPagination;
    }
  }

  @Emit('onRetry')
  private emitRetry(event: Event): Event {
    return event;
  }

  private handleBeforeScrollEnd() {
    this.$emit('beforeScrollEnd');
  }

  private handleScrollEnd() {
    this.$emit('scrollEnd');
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/table-cell-utils.scss';

.di-table-2 {
  display: flex;
  flex-direction: column;
  //justify-items: center;
  //align-items: stretch;
  position: relative;

  .di-table-2-rule {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .di-table-2-container {
    display: flex;
    position: absolute;
    flex-direction: column;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    .di-table-2-container-loading {
      flex: 1;
      position: relative;

      --header-background-color: var(--directory-header-bg);
      --row-even-background-color: var(--directory-row-bg);
      --row-odd-background-color: var(--directory-row-bg);
      --grid-body-horizontal-style: solid 1px var(--directory-grid-line-color);

      table tbody tr {
        cursor: pointer;

        &:hover td {
          background-color: var(--directory-hover-color);
        }
      }
    }

    .di-table-2-footer {
      margin: 11px;
      font-size: 16px !important;

      input {
        border: none;
        background: var(--panel-background-color);
        text-decoration: underline;
      }
    }
  }
}
</style>
