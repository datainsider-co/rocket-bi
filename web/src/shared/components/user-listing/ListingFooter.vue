<template>
  <div class="user-profile-footer-container">
    <div class="user-profile-footer-total">
      <span v-if="isShowTotal">Total {{ totalRowTitle }}(s): {{ totalRows }}</span>
    </div>
    <div class="user-profile-footer-pagination">
      <div class="per-page-content">
        Showing
        <EditableSelect
          class="select-per-page-list"
          :defaultValue="pagination.rowsPerPage"
          :items="perPageListItems"
          @selectedValue="perPageChanged"
          backgroundColor="var(--panel-background-color)"
        />
        entries
      </div>
      <b-pagination
        v-model="pagination.page"
        :total-rows="totalRows"
        :per-page="pagination.rowsPerPage"
        pills
        hide-ellipsis
        :limit="3"
        size="sm"
        class="table-pagination"
        @change="onPageChanged"
        ref="refPagination"
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
  </div>
</template>
<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { DefaultPaging } from '@/shared';
import { Pagination } from '@/shared/models';
import { Log } from '@core/utils';

@Component
export default class ListingFooter extends Vue {
  @Prop({ type: Number, required: true })
  private readonly totalRows!: number;

  @Prop({ default: 'profile', type: String })
  private readonly totalRowTitle!: string;

  @Prop({ required: false, type: [Number, String], default: DefaultPaging.DefaultPageSize })
  private readonly defaultRowPerPage!: number;

  @Prop({ required: false, type: [Number, String], default: 1 })
  private readonly defaultPage!: number;

  @Prop({ required: false })
  private readonly hideTotal!: boolean;

  private isShowTotal = true;

  protected pagination: Pagination;

  private perPageListItems = [
    { display: '20', value: 20 },
    { display: '30', value: 30 },
    { display: '50', value: 50 },
    { display: '100', value: 100 },
    { display: '200', value: 200 }
  ];

  constructor() {
    super();
    this.pagination = new Pagination({ page: this.defaultPage, rowsPerPage: this.defaultRowPerPage });
    this.isShowTotal = !this.hideTotal;
  }

  onPageChanged(page: number) {
    this.pagination.page = page;
    this.handleLoadPage(this.pagination);
  }

  perPageChanged(value: number) {
    this.pagination.rowsPerPage = value;
    this.pagination.page = 1;
    this.handleLoadPage(this.pagination);
  }

  @Emit('onPageChange')
  private handleLoadPage(pagination: Pagination) {
    return pagination;
  }

  mounted() {
    window.addEventListener('resize', this.handleSizeChanged);
    this.handleSizeChanged();
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.handleSizeChanged);
  }

  handleSizeChanged() {
    if (this.hideTotal) {
      return; // ignore case
    }
    const width = this.$el.clientWidth;
    if (width < 500) {
      this.isShowTotal = false;
    } else {
      this.isShowTotal = true;
    }
    Log.debug('handleSizeChanged::', width);
  }
}
</script>
<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.user-profile-footer-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.user-profile-footer-total {
  order: 0;
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-items: center;
  @media (max-width: 700px) {
    display: none;
  }
}

.user-profile-footer-pagination {
  order: 1;
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: end;
  @media screen and (max-width: 700px) {
    flex: 1;
    justify-content: space-between;
  }

  @media (max-width: 390px) {
    flex: 1;
    justify-content: flex-end;

    .per-page-content {
      display: none;
    }
  }
}

.table-pagination {
  align-items: center;
}

ul {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.per-page-content {
  display: flex;
  flex-direction: row;
  @include regular-text;
  font-size: 14px;
  letter-spacing: 0.2px;
  align-items: center;
  text-align: center;
  margin-right: 15px;
}

::v-deep {
  .autocomplete input {
    margin: 0 5px;
    width: 30px;
  }

  .page-link {
    color: var(--text-color) !important;
    background-color: rgba(#d8d8d8, 0.1) !important;
    border: none !important;
    border-radius: 7px;
  }

  .page-item.active .page-link {
    background-color: var(--accent) !important;
    color: var(--table-page-active-color) !important;
  }

  .page-item.disabled .page-link {
    color: var(--neutral) !important;
    pointer-events: none !important;
    cursor: not-allowed !important;
  }
}
</style>
