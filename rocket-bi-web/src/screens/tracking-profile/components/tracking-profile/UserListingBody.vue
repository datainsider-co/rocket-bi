<template>
  <div class="user-listing-body">
    <CustomTable
      v-if="isHaveResponse"
      id="user-listing-body"
      ref="table"
      :custom-cell-call-back="customCellCallBack"
      :headers="headers"
      :is-show-footer="false"
      :max-height="maxTableHeight"
      :rows="rows"
      class="table-right-border"
    >
    </CustomTable>
  </div>
</template>
<script lang="ts">
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { CustomCell, HeaderData, RowData } from '@/shared/models';
import CustomTable from '@chart/custom-table/CustomTable.vue';
import { ListUtils } from '@/utils';
import { CustomBodyCellData, CustomCellCallBack } from '@chart/custom-table/TableData';

@Component({
  components: { CustomTable }
})
export default class UserListingBody extends Vue {
  static readonly INDEX_COLUMN_ID = 'stt';
  static readonly INDEX_COLUMN_WIDTH = 43;
  static readonly INDEX_COLUMN_TITLE = '';

  @Prop({ required: true, type: Array })
  private readonly records!: any[];

  @Prop({ required: true, type: Array })
  private readonly columns!: HeaderData[];

  @Prop({ required: true, type: Number })
  private readonly maxTableHeight!: number;

  @Prop({ required: true, type: Boolean })
  private readonly isHaveResponse!: boolean;

  @Prop({ required: true, type: Number })
  private readonly from!: number;

  @Prop({ required: false, type: Boolean, default: true })
  private readonly hasIndexColumn!: boolean;

  @Ref()
  private readonly table?: CustomTable;

  private get headers() {
    const headers: any[] = [];

    if (this.hasIndexColumn) {
      const indexHeader = this.createIndexHeader();
      headers.push(indexHeader);
    }
    return headers.concat(this.columns);
  }

  private get rows(): any[] {
    if (ListUtils.isNotEmpty(this.columns)) {
      return this.records;
    } else {
      return [];
    }
  }

  private get customCellCallBack(): CustomCellCallBack {
    return {
      onClickRow: this.handleClickRow
    };
  }

  @Watch('maxTableHeight')
  onMaxTableHeightChanged() {
    if (this.table) {
      this.table.reRender();
    }
  }

  private createIndexHeader(): HeaderData {
    return {
      key: UserListingBody.INDEX_COLUMN_ID,
      isTextLeft: true,
      width: UserListingBody.INDEX_COLUMN_WIDTH,
      label: UserListingBody.INDEX_COLUMN_TITLE,
      isGroupBy: false,
      children: [],
      disableSort: true,
      customRenderBodyCell: new CustomCell((rowData: RowData, rowIndex) => {
        const currentIndex = `${this.from + rowIndex + 1}`;
        return document.createTextNode(currentIndex) as any;
      })
    };
  }

  @Emit('onClickRow')
  private handleClickRow(cell: CustomBodyCellData) {
    return cell.rowData;
  }
}
</script>

<style lang="scss">
.user-listing-body {
  --header-font-size: 12px;
  --row-font-size: 12px;
}
</style>
