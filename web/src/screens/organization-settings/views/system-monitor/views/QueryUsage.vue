<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { LayoutNoData } from '@/shared/components/layout-wrapper';
import { Status } from '@/shared';
import { HeaderData } from '@/shared/models';
import { QueryUsageHeaderDataGenerator } from '@/screens/organization-settings/views/system-monitor/components/query-usage/QueryUsageHeaderDataGenerator';
import { QueryExecutionLog, QueryUsageService } from '@core/organization';
import { Di } from '@core/common/modules';
import { SortDirection } from '@core/common/domain';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils';
import { ListingRequestBuilder } from '@/screens/organization-settings/views/system-monitor/helper/ListingRequestBuilder';
import EventBus from '@/screens/organization-settings/views/sso-config/helper/EventBus';

@Component({
  components: { LayoutNoData, DiTable2 }
})
export default class QueryUsage extends Vue {
  status = Status.Loaded;
  errorMsg = '';
  total = 0;

  @Ref()
  private readonly table!: DiTable2;

  records: QueryExecutionLog[] = [];

  async mounted() {
    EventBus.$on('refresh', this.refresh);
    await this.refresh();
    this.initSortUI();
  }

  private initSortUI() {
    const holdLabelColumn = this.headers.find(header => header.key === this.sortName)?.label ?? '';
    if (!this.sortMode) {
      return;
    }

    if (holdLabelColumn.length === 0) {
      return;
    }

    this.table.setSort(holdLabelColumn, this.sortMode);
  }

  beforeDestroy() {
    EventBus.$off('refresh', this.refresh);
  }

  async search(isFirstLoad = false) {
    try {
      this.status = isFirstLoad ? Status.Loading : Status.Updating;
      this.errorMsg = '';
      const request = new ListingRequestBuilder()
        .withKeyword(this.searchText)
        .withFrom(this.from)
        .withSize(this.size)
        .withSort(this.sortName, this.sortMode)
        .getResult();
      const { total, data } = await Di.get<QueryUsageService>(QueryUsageService).search(request);
      this.total = total;
      this.records = data;
      this.status = Status.Loaded;
    } catch (ex) {
      Log.error(ex);
      this.status = Status.Error;
      this.errorMsg = ex.getPrettyMessage();
    }
  }

  get headers(): HeaderData[] {
    return new QueryUsageHeaderDataGenerator().generate();
  }

  onClickRow(rowData: any) {
    //
  }

  onSortChanged(column: HeaderData) {
    const sortName = this.getSortName(column);
    const sort = this.getSortMode(column);
    Log.debug('onSortChanged::', sortName, sort);
    try {
      this.$router.replace({ query: { ...this.routerQuery, sortBy: sortName, sort: sort } });
    } catch (ex) {
      //
    }
  }

  private getSortName(column: HeaderData) {
    const { key } = column;
    return StringUtils.toSnakeCase(key);
  }

  private getSortMode(column: HeaderData) {
    const { key } = column;
    const field = StringUtils.toSnakeCase(key);
    if (this.sortName === field) {
      Log.debug('case equal:', this.sortName, field);
      return this.sortMode === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc;
    } else {
      return SortDirection.Asc;
    }
  }

  get searchText(): string {
    return this.$route.query.search?.toString() ?? '';
  }

  get sortMode(): SortDirection | null {
    const value: string = this.$route.query.sort?.toString()?.toUpperCase() ?? '';
    if (value === SortDirection.Desc || value === SortDirection.Asc) {
      return value as SortDirection;
    }

    return null;
  }

  get sortName(): string {
    return this.$route.query.sortBy?.toString() ?? '';
  }

  get isEmptyData(): boolean {
    return this.status === Status.Loaded && this.total === 0 && this.searchText === '';
  }

  get routerQuery() {
    return this.$route.query;
  }

  get from(): number {
    return isNaN(+this.$route.query.from) ? 0 : +this.$route.query.from;
  }

  get size(): number {
    return isNaN(+this.$route.query.size) ? 10 : +this.$route.query.size;
  }

  async refresh() {
    const isFirstLoad = true;
    await this.search(isFirstLoad);
  }

  @Watch('routerQuery', { deep: true })
  onRouterQueryChanged() {
    Log.debug('onRouterQueryChanged::', this.routerQuery);
    this.search();
  }
}
</script>

<template>
  <div class="d-flex flex-grow-1 my-3">
    <LayoutNoData icon="di-icon-users" v-if="isEmptyData">
      You don't have any Query Log yet
    </LayoutNoData>
    <DiTable2
      v-else
      ref="table"
      style="flex: auto"
      :error-msg="errorMsg"
      :headers="headers"
      :status="status"
      :records="records"
      @onRetry="refresh"
      @onClickRow="onClickRow"
      @onSortChanged="onSortChanged"
    />
  </div>
</template>

<style scoped lang="scss"></style>
