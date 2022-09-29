<template>
  <div v-if="enable" class="table-chart-pagination-content">
    <div v-if="isShowEntries" class="per-page-content">
      Showing
      <EditableSelect
        :backgroundColor="perPageBackgroundColor"
        :defaultValue="pagination.rowsPerPage"
        :items="perPageListItems"
        class="select-per-page-list"
        @selectedValue="perPageChanged"
      />
      entries
    </div>
    <b-pagination
      ref="refPagination"
      v-model="pagination.page"
      :limit="3"
      :per-page="pagination.rowsPerPage"
      :total-rows="totalRows"
      class="table-pagination"
      hide-ellipsis
      pills
      size="sm"
      @change="onPageChanged"
    >
      <template v-slot:first-text>
        <b-icon-chevron-double-left />
      </template>
      <template v-slot:prev-text>
        <b-icon-chevron-left />
      </template>
      <template v-slot:next-text>
        <b-icon-chevron-right />
      </template>
      <template v-slot:last-text>
        <b-icon-chevron-double-right />
      </template>
    </b-pagination>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator';
import { Pagination } from '@/shared/models';
import EditableSelect from '@/shared/components/EditableSelect.vue';
import { BPagination } from 'bootstrap-vue';

@Component({
  components: {
    EditableSelect
  }
})
export default class PaginationComponent extends Vue {
  static readonly PER_PAGE_LIST_ITEMS = [
    { display: '10', value: 10 },
    { display: '20', value: 20 },
    { display: '30', value: 30 },
    { display: '50', value: 50 },
    { display: '100', value: 100 }
  ];
  @Ref()
  refPagination!: BPagination;
  private perPageListItems = PaginationComponent.PER_PAGE_LIST_ITEMS;
  @Prop({ required: true, type: Boolean })
  private isShowEntries!: boolean;
  @Prop({ required: true })
  private pagination!: Pagination;
  @Prop({ required: true })
  private perPageBackgroundColor!: string;
  @Prop({ required: true })
  private totalRows!: number;
  @Prop({ required: false, type: Boolean, default: true })
  private readonly enable!: boolean;

  @Emit('pageChanged')
  private onPageChanged(page: number): number {
    return page;
  }

  @Emit('perPageChanged')
  private perPageChanged(page: number): number {
    return page;
  }
}
</script>

<style lang="scss" scoped>
@import '~@chart/custom-table/DefaultTableStyle';

::v-deep {
  .autocomplete input {
    margin: 0px 5px;
    width: 25px;
  }

  .select-container > .relative > span > button {
    max-height: 25px !important;
    min-height: 25px !important;
  }

  .select-container > .relative > span > button > div {
    max-height: 25px !important;
    min-height: 25px !important;
  }

  .page-link {
    background-color: var(--row-even-background-color, $default-row-even-background-color);
    color: var(--table-header-color, $default-text-color);
    border: none;
    border-radius: 7px;
  }

  .page-item.active .page-link {
    background-color: var(--header-background-color, $default-header-background-color);
    color: var(--table-page-active-color, $default-header-color);
  }

  .page-item.disabled .page-link {
    background-color: var(--row-even-background-color, $default-row-even-background-color);
    color: var(--table-header-color, $default-text-color);
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
