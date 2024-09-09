<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { LayoutNoData } from '@/shared/components/layout-wrapper';
import { Status } from '@/shared';
import { ActivityResourceType, ActivityService, UserActivity } from '@core/organization';
import EventBus from '@/screens/organization-settings/views/sso-config/helper/EventBus';
import { Di } from '@core/common/modules';
import { Log } from '@core/utils';
import { HeaderData, Pagination } from '@/shared/models';
import { UserUsageHeaderDataGenerator } from '@/screens/organization-settings/views/system-monitor/components/user-usage/UserUsageHeaderDataGenerator';
import { GetUserActivityRequestBuilder } from '@/screens/organization-settings/views/system-monitor/helper/GetUserActivityRequestBuilder';
import { MainDateMode } from '@core/common/domain';
import { compact, isArray, isString } from 'lodash';
import { ActivityActionPicker } from '@/screens/organization-settings/views/system-monitor/helper/ActivityActionPicker';
import { MainDateModePicker } from '@/screens/organization-settings/views/system-monitor/helper/MainDateModePicker';

import { ActivityActionType } from '@core/organization/domain/user-activity/ActivityActionType';
import { ActivityResourcePicker } from '@/screens/organization-settings/views/system-monitor/helper/ActivityResourcePicker';
import { DateRangeCalculator } from '@/screens/organization-settings/views/system-monitor/helper/DateRangeCalculator';

@Component({
  components: { LayoutNoData, DiTable2 }
})
export default class UserUsage extends Vue {
  status = Status.Loaded;
  errorMsg = '';
  total = 0;

  @Ref()
  private readonly table!: DiTable2;

  records: UserActivity[] = [];

  async mounted() {
    EventBus.$on('refresh', this.refresh);
    await this.refresh();
  }

  beforeDestroy() {
    EventBus.$off('refresh', this.refresh);
  }

  async search(isFirstLoad = false) {
    try {
      this.status = isFirstLoad ? Status.Loading : Status.Updating;
      this.errorMsg = '';
      const request = new GetUserActivityRequestBuilder()
        .withKeyword(this.users)
        .withFrom(this.from)
        .withSize(this.size)
        .withDateRange(this.dateRange)
        .withActivity(this.activity)
        .withResource(this.resource)
        .getResult();
      const { total, data } = await Di.get<ActivityService>(ActivityService).getUserActivities(request);
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
    return new UserUsageHeaderDataGenerator().generate();
  }

  onClickRow(rowData: any) {
    //
  }

  get activity(): ActivityActionType | null {
    return new ActivityActionPicker().pick(this.$route);
  }

  get resource(): ActivityResourceType | null {
    return new ActivityResourcePicker().pick(this.$route);
  }

  get users(): string[] {
    if (isArray(this.$route.query.search)) {
      return compact(this.$route.query.search);
    }

    if (isString(this.$route.query.search)) {
      return [this.$route.query.search];
    }
    return [];
  }

  get isEmptyData(): boolean {
    return this.status === Status.Loaded && this.total === 0;
  }

  get routerQuery() {
    return this.$route.query;
  }

  get from(): number {
    return isNaN(+this.$route.query.from) ? 0 : +this.$route.query.from;
  }

  get size(): number {
    return isNaN(+this.$route.query.size) ? 50 : +this.$route.query.size;
  }

  get dateRange(): { start: number; end: number } | null {
    return new DateRangeCalculator().withMode(this.mainDateFilterMode).calculate(this.$route);
  }

  get mainDateFilterMode(): MainDateMode | null {
    return new MainDateModePicker().pick(this.$route);
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

  get pageNumber(): number {
    return Math.floor(this.from / this.size) + 1;
  }

  onPageChanged(pagination: Pagination) {
    const { page, rowsPerPage } = pagination;
    const from = (page - 1) * rowsPerPage;
    EventBus.$emit('set-path-param', { from: `${from}`, size: `${rowsPerPage}` });
  }
}
</script>

<template>
  <div class="d-flex flex-grow-1 my-3">
    <LayoutNoData icon="di-icon-users" v-if="isEmptyData">
      You don't have any User Usage Log yet
    </LayoutNoData>
    <DiTable2
      v-else
      ref="table"
      is-show-pagination
      style="flex: auto"
      :error-msg="errorMsg"
      allow-show-empty
      :headers="headers"
      :status="status"
      :records="records"
      :total="total"
      :default-row-per-page="size"
      :default-page="pageNumber"
      @onRetry="refresh"
      @onClickRow="onClickRow"
      @onPageChange="onPageChanged"
    />
  </div>
</template>

<style scoped lang="scss"></style>
