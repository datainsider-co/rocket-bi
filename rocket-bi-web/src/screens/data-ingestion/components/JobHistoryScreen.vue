<template>
  <LayoutContent>
    <LayoutHeader title="Jobs History" icon="di-icon-job-history">
      <div class="ml-auto d-flex align-items-center">
        <SearchInput class="search-input" hint-text="Search job history" :timeBound="400" @onTextChanged="handleKeywordChange" />
        <DiIconTextButton class="" title="Refresh" @click="handleRefresh">
          <i class="di-icon-reset job-history-action-icon"></i>
        </DiIconTextButton>
      </div>
    </LayoutHeader>
    <div class="job-history layout-content-panel">
      <LayoutNoData v-if="isLoaded && isEmptyData" icon="di-icon-job-history">
        <template v-if="isActiveSearch">
          <div class="text-muted">
            No found job histories
          </div>
        </template>
        <template v-else>
          <div class="font-weight-semi-bold">
            No data yet
          </div>
          <div class="text-muted">
            <a href="#" @click.stop="openNewJobConfigModal">Click here</a>
            to add Job History
          </div>
        </template>
      </LayoutNoData>
      <DiTable2
        v-else
        id="job-history-listing"
        ref="jobHistoryTable"
        :error-msg="tableErrorMessage"
        :headers="jobHistoryHeaders"
        :records="jobHistoryRecords"
        :status="listJobHistoryStatus"
        class="job-history-table"
        :total="record"
        :isShowPagination="true"
        padding-pagination="40"
        @onPageChange="handlePageChange"
        @onRetry="loadJobHistories"
        @onSortChanged="handleSortChange"
      >
        <template #empty>
          <EmptyDirectory class="h-100"></EmptyDirectory>
        </template>
      </DiTable2>
      <JobCreationModal ref="jobCreationModal" @submit="redirectToJobScreen"></JobCreationModal>
      <MultiJobCreationModal ref="multiJobCreationModal" @submit="redirectToJobScreen" @submitS3Job="openS3PreviewModal"></MultiJobCreationModal>
      <S3PreviewTableModal ref="s3PreviewModal"></S3PreviewTableModal>
    </div>
  </LayoutContent>
</template>

<script lang="ts">
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import MultiJobCreationModal from '@/screens/data-ingestion/components/MultiJobCreationModal.vue';
import S3PreviewTableModal from '@/screens/data-ingestion/components/S3PreviewTableModal.vue';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { JobModule } from '@/screens/data-ingestion/store/JobStore';
import { PopupUtils } from '@/utils/PopupUtils';
import { cloneDeep } from 'lodash';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { HeaderData, Pagination, RowData } from '@/shared/models';
import { DefaultPaging, Routers, Status } from '@/shared';
import { Log } from '@core/utils';
import {
  DataSourceInfo,
  DataSourceType,
  JdbcJob,
  SortRequest,
  S3Job,
  S3SourceInfo,
  Job,
  JobType,
  GoogleAnalyticJob,
  JobService,
  GA4Job,
  GA4Metric,
  Ga4Dimension
} from '@core/data-ingestion';
import { JobHistoryModule } from '@/screens/data-ingestion/store/JobHistoryStore';
import { DIException, SortDirection } from '@core/common/domain';
import { DateTimeFormatter, GoogleUtils, ListUtils } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';
import { JobFormRender } from '@/screens/data-ingestion/form-builder/JobFormRender';
import JobCreationModal from '@/screens/data-ingestion/components/JobCreationModal.vue';
import { LayoutContent, LayoutHeader, LayoutNoData } from '@/shared/components/layout-wrapper';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { GoogleAnalyticTables } from '@/screens/data-ingestion/components/google-analytics/GoogleAnalyticTables';
import { Inject } from 'typescript-ioc';
import { GoogleAnalytic4Tables } from '@/screens/data-ingestion/components/google-analytics-4/GoogleAnalytic4Tables';

@Component({
  components: {
    JobCreationModal,
    LayoutContent,
    LayoutHeader,
    LayoutNoData,
    DiTable2,
    MultiJobCreationModal,
    S3PreviewTableModal
  }
})
export default class JobHistoryScreen extends Vue {
  private from = 0;
  private size = DefaultPaging.DefaultPageSize;
  private keyword = '';
  private isShowJobConfigModal = false;
  private jobFormRenderer: JobFormRender = JobFormRender.default();
  private sortMode: SortDirection = SortDirection.Desc;
  private sortName = 'id';

  private listJobHistoryStatus: Status = Status.Loading;
  private tableErrorMessage = '';

  @Ref()
  private readonly jobCreationModal!: JobCreationModal;
  @Ref()
  private readonly multiJobCreationModal!: MultiJobCreationModal;

  @Ref()
  private readonly jobHistoryTable!: DiTable2;

  @Ref()
  private readonly s3PreviewModal!: S3PreviewTableModal;

  @Inject
  private readonly jobService!: JobService;

  private get jobHistoryHeaders(): HeaderData[] {
    return JobHistoryModule.jobHistoryHeaders;
  }

  private get jobHistoryRecords(): RowData[] {
    return JobHistoryModule.jobHistoryList.map(jobHistory => {
      return {
        ...jobHistory,
        totalSyncTime: DateTimeFormatter.formatAsHms(jobHistory.totalSyncedTime),
        lastSyncTime: DateTimeFormatter.formatAsMMMDDYYYHHmmss(jobHistory.lastSyncTime),
        totalInsertedRows: jobHistory.totalRowsInserted,
        message: StringUtils.isEmpty(jobHistory.message) ? '--' : jobHistory.message,
        depth: 0,
        children: [],
        isExpanded: false
        // customStatus: new CustomCell(this.renderStatus)
      };
    });
  }

  private get record(): number {
    return JobHistoryModule.totalRecord;
  }

  private get isLoaded() {
    return this.listJobHistoryStatus === Status.Loaded;
  }

  private showLoading() {
    if (ListUtils.isEmpty(JobHistoryModule.jobHistoryList)) {
      this.listJobHistoryStatus = Status.Loading;
    } else {
      this.listJobHistoryStatus = Status.Updating;
    }
  }

  private showUpdating() {
    this.listJobHistoryStatus = Status.Updating;
  }

  private showLoaded() {
    this.listJobHistoryStatus = Status.Loaded;
  }

  private showError(error: string) {
    this.tableErrorMessage = error;
    this.listJobHistoryStatus = Status.Error;
  }

  private get isEmptyData(): boolean {
    return ListUtils.isEmpty(this.jobHistoryRecords);
    // return true;
  }

  private get isActiveSearch() {
    return StringUtils.isNotEmpty(this.keyword);
  }

  @Track(TrackEvents.JobHistoryIngestionView)
  async created() {
    await this.loadJobHistories();
    this.jobHistoryTable?.setSort('Sync Id', this.sortMode);
  }

  @Track(TrackEvents.JobCreate)
  private openNewJobConfigModal() {
    // this.isShowDataSourceSelectionModal = true;
    const job = JdbcJob.default(DataSourceInfo.default(DataSourceType.MySql));
    // this.jobCreationModal.show(job);
    this.multiJobCreationModal.show(
      job,
      (job, isSingleTable) => this.createJob(job, isSingleTable),
      (job, isSingleTable) => this.multiJobCreationModal.hide()
    );
  }

  private async createJob(job: Job, isSingleTable: boolean) {
    if (Job.isS3Job(job)) {
      this.openS3PreviewModal(job as S3Job);
    } else {
      if (Job.isGoogleAnalytic4Job(job) && (job as GA4Job).tableName === 'event') {
        const customMetricsAndDimension: { metrics: GA4Metric[]; dimensions: Ga4Dimension[] } = await this.getGA4CustomDimensionAndMetrics(
          (job as GA4Job).propertyId
        );
        (job as GA4Job).metrics = (job as GA4Job).metrics.concat(customMetricsAndDimension.metrics);
        (job as GA4Job).dimensions = (job as GA4Job).dimensions.concat(customMetricsAndDimension.dimensions);
      }
      if (isSingleTable) {
        await JobModule.create(job);
      } else {
        await this.createMultiJob(job);
      }
    }
  }

  private async createMultiJob(job: Job) {
    switch (job.jobType) {
      case JobType.GoogleAnalytics: {
        const listGAJob = this.getListGAJob(job as GoogleAnalyticJob);
        await this.jobService.multiCreateV2(listGAJob);
        break;
      }
      case JobType.GA4: {
        const listGAJob = this.getListGA4Job(job as GA4Job);
        await this.jobService.multiCreateV2(listGAJob);
        break;
      }
      default: {
        const tableNames = [...DataSourceModule.tableNames];
        await JobModule.createMulti({ job: job, tables: tableNames });
      }
    }
  }

  private async getGA4CustomDimensionAndMetrics(propertyId: string): Promise<{ metrics: GA4Metric[]; dimensions: Ga4Dimension[] }> {
    Log.debug('JobScreen::getGA4CustomDimensionAndMetrics::propertyId::', propertyId);
    const dimensionsAndMetrics: gapi.client.Response<gapi.client.analyticsdata.Metadata> = await GoogleUtils.getDimensionsAndMetrics(
      `properties/${propertyId}`
    );
    const customDimensions: Ga4Dimension[] = this.customGA4Dimensions(dimensionsAndMetrics?.result?.dimensions ?? []);
    const customMetrics: GA4Metric[] = this.customGA4Metrics(dimensionsAndMetrics?.result?.metrics ?? []);
    return { metrics: customMetrics, dimensions: customDimensions };
  }

  private customGA4Dimensions(dimensionMetadata: gapi.client.analyticsdata.DimensionMetadata[]) {
    return dimensionMetadata.map(dimension => new Ga4Dimension(dimension.apiName!)).filter(item => item.name.includes('customEvent:'));
  }

  private customGA4Metrics(metricMetadata: gapi.client.analyticsdata.MetricMetadata[]) {
    return metricMetadata.map(metric => new GA4Metric(metric.apiName!, this.getMetricType(metric.type!))).filter(item => item.name.includes('customEvent:'));
  }

  private getMetricType(metricMetadataType: string): string {
    switch (metricMetadataType) {
      case 'TYPE_INTEGER':
        return 'int64';
      default:
        return 'float';
    }
  }

  private getListGA4Job(job: GA4Job) {
    const gaTables = GoogleAnalytic4Tables;
    return gaTables.map(tbl => {
      const gaJob = cloneDeep(job);
      gaJob.metrics = tbl.metrics.concat(job.metrics);
      gaJob.dimensions = tbl.dimensions.concat(job.dimensions);
      gaJob.tableName = tbl.id;
      gaJob.destTableName = tbl.id;
      gaJob.displayName = gaJob.displayName + ` (table: ${gaJob.destTableName})`;
      return gaJob;
    });
  }

  private getListGAJob(job: GoogleAnalyticJob) {
    const gaTables = GoogleAnalyticTables;
    return gaTables.map(tbl => {
      const gaJob = cloneDeep(job);
      gaJob.metrics = tbl.metrics;
      gaJob.dimensions = tbl.dimensions;
      gaJob.tableName = tbl.id;
      gaJob.destTableName = tbl.id;
      gaJob.displayName = gaJob.displayName + ` (table: ${gaJob.destTableName})`;
      return gaJob;
    });
  }

  private async loadJobHistories() {
    try {
      this.showLoading();
      await JobHistoryModule.loadJobHistoryList({
        from: this.from,
        size: this.size,
        keyword: this.keyword,
        sorts: [new SortRequest(this.sortName, this.sortMode)]
      });
      this.listJobHistoryStatus = Status.Loaded;
    } catch (e) {
      this.listJobHistoryStatus = Status.Error;
      const exception = DIException.fromObject(e);
      this.tableErrorMessage = exception.message;
      throw new DIException(exception.message);
    }
  }

  @Track(TrackEvents.JobHistoryIngestionRefresh)
  private async handleRefresh() {
    try {
      this.showUpdating();
      await JobHistoryModule.loadJobHistoryList({
        from: this.from,
        size: this.size,
        keyword: this.keyword,
        sorts: [new SortRequest(this.sortName, this.sortMode)]
      });
      this.listJobHistoryStatus = Status.Loaded;
    } catch (e) {
      this.listJobHistoryStatus = Status.Error;
      const exception = DIException.fromObject(e);
      this.tableErrorMessage = exception.message;
      throw new DIException(exception.message);
    }
  }

  private async handlePageChange(pagination: Pagination) {
    try {
      this.listJobHistoryStatus = Status.Updating;
      this.from = (pagination.page - 1) * pagination.rowsPerPage;
      this.size = pagination.rowsPerPage;
      await JobHistoryModule.loadJobHistoryList({
        from: this.from,
        size: this.size,
        keyword: this.keyword,
        sorts: [new SortRequest(this.sortName, this.sortMode)]
      });
      this.listJobHistoryStatus = Status.Loaded;
    } catch (e) {
      this.tableErrorMessage = e.message;
      this.listJobHistoryStatus = Status.Error;
      Log.error(`UserProfile paging getting an error: ${e?.message}`);
    }
  }

  private async redirectToJobScreen() {
    await this.$router.push({ name: Routers.Job });
  }

  private async handleKeywordChange(keyword: string) {
    try {
      this.showUpdating();
      this.from = 0;
      this.keyword = keyword;
      await JobHistoryModule.loadJobHistoryList({
        from: this.from,
        size: this.size,
        sorts: [new SortRequest(this.sortName, this.sortMode)],
        keyword: this.keyword
      });
      this.showLoaded();
    } catch (e) {
      this.showError(e.message);
      Log.error('JobHistory::handleKeywordChange::error::', e.message);
    }
  }

  private async handleSortChange(column: HeaderData) {
    try {
      this.updateSortMode(column);
      this.updateSortColumn(column);
      Log.debug('handleSortChange::', this.sortName, this.sortMode);
      this.showUpdating();
      await JobHistoryModule.loadJobHistoryList({
        from: this.from,
        size: this.size,
        sorts: [new SortRequest(this.sortName, this.sortMode)],
        keyword: this.keyword
      });
      this.showLoaded();
    } catch (e) {
      Log.error('LakeQueryInfo:: handleSortChange::', e);
      this.tableErrorMessage = e.message;
    }
  }

  private updateSortColumn(column: HeaderData) {
    const { key } = column;
    const field = StringUtils.toSnakeCase(key);
    this.sortName = field;
  }

  private updateSortMode(column: HeaderData) {
    const { key } = column;
    const field = StringUtils.toSnakeCase(key);
    if (this.sortName === field) {
      Log.debug('case equal:', this.sortName, field);
      this.sortMode = this.sortMode === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc;
    } else {
      this.sortMode = SortDirection.Asc;
    }
  }

  private openS3PreviewModal(job: S3Job) {
    const dataSourceRes = DataSourceModule.dataSources.find(res => res.dataSource.id === job.sourceId);
    if (dataSourceRes) {
      this.s3PreviewModal.show(dataSourceRes.dataSource as S3SourceInfo, job, {
        onCompleted: (source, job) => {
          try {
            this.submitJob(job);
            this.redirectToJobScreen();
          } catch (e) {
            const exception = DIException.fromObject(e);
            PopupUtils.showError(exception.message);
            Log.error('DataSourceConfigModal::handleClickOk::exception::', exception.message);
          }
        },
        onBack: () => this.jobCreationModal.show(job)
      });
    }
  }

  private async submitJob(job: Job) {
    const clonedJob = cloneDeep(job);
    clonedJob.scheduleTime = TimeScheduler.toSchedulerV2(job.scheduleTime!);
    await JobModule.create(clonedJob);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.job-history {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px - 68px);

  > header {
    align-items: center;
    display: flex;
    height: 33px;
    justify-content: space-between;

    > .job-history-title {
      font-size: 24px;
      font-stretch: normal;
      font-style: normal;
      font-weight: 500;
      letter-spacing: 0.2px;
      line-height: 1.4;
      display: flex;
      align-items: center;
      overflow: hidden;
      flex: 1;

      > .root-title {
        display: flex;
        align-items: center;

        > i {
          margin-right: 16px;
        }
      }

      .job-history-action-icon {
        font-size: 16px;
        color: var(--directory-header-icon-color);
      }
    }
  }

  > .job-history-divider {
    background-color: var(--text-color);
    height: 0.5px;
    margin-bottom: 16px;
    margin-top: 8px;
    opacity: 0.2;
  }

  .no-data {
    height: calc(100% - 71px);
    background: var(--secondary-2);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 16px;

    .title {
      margin-top: 16px;
      margin-bottom: 8px;
      font-weight: 500;
    }

    a {
      text-decoration: underline;
    }

    .action {
      color: var(--secondary-text-color);
    }
  }

  .sync-id {
    color: var(--text-color) !important;
    @include semi-bold-14();
    font-weight: 500 !important;
  }

  > .job-history-table {
    background-color: var(--directory-row-bg);
    flex: 1;
  }
}
</style>
