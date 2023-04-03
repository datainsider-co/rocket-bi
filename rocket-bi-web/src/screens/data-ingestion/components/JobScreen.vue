<template>
  <LayoutContent>
    <LayoutHeader title="Jobs" icon="di-icon-job">
      <div class="ml-auto d-flex align-items-center">
        <SearchInput class="search-input mr-2" hint-text="Search job" :timeBound="400" @onTextChanged="handleKeywordChange" />
        <SlideXLeftTransition :duration="animationDuration" :delay="delay">
          <div class="d-flex flex-row" v-if="enableMultiAction">
            <DiIconTextButton
              class="mr-2"
              title="Force Sync"
              @click="handleMultiForceSyncByDate(selectedIndexAsSet, new Date())"
              :event="trackEvents.JobIngestionRefresh"
            >
              <i class="di-icon-sync job-action-icon"></i>
            </DiIconTextButton>
            <DiIconTextButton title="Delete" class="mr-2" @click="handleConfirmDeleteMultiJob(selectedIndexAsSet)" :event="trackEvents.JobIngestionRefresh">
              <i class="di-icon-delete job-action-icon"></i>
            </DiIconTextButton>
          </div>
        </SlideXLeftTransition>
        <RefreshButton
          class="refresh-button"
          v-if="handler.isAutoRefresh"
          @refresh="handleRefresh"
          @changeOption="changeAutoRefreshOption"
          :selected-refresh-option="refreshOption"
          :process-parent-id="tableId"
        />
        <DiIconTextButton v-else class="ml-auto" title="Refresh" @click="handleRefresh" :event="trackEvents.JobIngestionRefresh">
          <i class="di-icon-reset job-action-icon"></i>
        </DiIconTextButton>
      </div>
    </LayoutHeader>
    <div class="job layout-content-panel">
      <LayoutNoData v-if="isLoaded && isEmptyData" icon="di-icon-job">
        <template v-if="isActiveSearch">
          No found jobs
        </template>
        <template v-else>
          <div class="font-weight-semi-bold">
            No data yet
          </div>
          <div class="text-muted">
            <a href="#" @click.stop="openNewJobConfigModal">Click here</a>
            to add Job
          </div>
        </template>
      </LayoutNoData>
      <DiTable2
        v-else
        :id="tableId"
        ref="jobTable"
        :error-msg="tableErrorMessage"
        :headers="jobHeaders"
        :records="jobRecords"
        :status="listJobStatus"
        class="job-table"
        :isShowPagination="true"
        :total="record"
        @onClickRow="handleClickRow"
        @onPageChange="handlePageChange"
        @onRetry="handleLoadJobs"
        @onSortChanged="handleSortChange"
        :padding-pagination="40"
      >
        <template #empty>
          <EmptyDirectory class="h-100"></EmptyDirectory>
        </template>
      </DiTable2>
      <JobConfigModal ref="jobConfigModal" :job-config-form-render="jobFormRenderer" @ok="handleSubmitJob"></JobConfigModal>
      <JobCreationModal ref="jobCreationModal" @submit="handleLoadJobs"></JobCreationModal>
      <MultiJobCreationModal ref="multiJobCreationModal"></MultiJobCreationModal>
      <S3PreviewTableModal ref="s3PreviewModal"></S3PreviewTableModal>
      <ContextMenu
        id="query-action-menu"
        ref="diContextMenu"
        :ignoreOutsideClass="listIgnoreClassForContextMenu"
        minWidth="168px"
        textColor="var(--text-color)"
      />
    </div>
  </LayoutContent>
</template>

<script lang="ts">
import MultiJobCreationModal from '@/screens/data-ingestion/components/MultiJobCreationModal.vue';
import S3PreviewTableModal from '@/screens/data-ingestion/components/S3PreviewTableModal.vue';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { CustomCell, HeaderData, Pagination, RowData } from '@/shared/models';
import { JobModule } from '@/screens/data-ingestion/store/JobStore';
import { ContextMenuItem, DefaultPaging, Status } from '@/shared';
import { Log } from '@core/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { Job, JobInfo } from '@core/data-ingestion/domain/job/Job';
import { Modals } from '@/utils/Modals';
import { PopupUtils } from '@/utils/PopupUtils';
import { JobFormRender } from '@/screens/data-ingestion/form-builder/JobFormRender';
import { JobFormFactory } from '@/screens/data-ingestion/form-builder/JobFormFactory';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import {
  DataSourceType,
  FormMode,
  GoogleAnalyticJob,
  JdbcJob,
  JobService,
  JobStatus,
  JobType,
  S3Job,
  S3SourceInfo,
  SortRequest,
  SyncMode,
  GA4Job,
  Ga4Dimension,
  GA4Metric
} from '@core/data-ingestion';
import { DIException, JobId, SortDirection } from '@core/common/domain';
import { DateTimeFormatter, GoogleUtils, ListUtils } from '@/utils';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import DataIngestionTable from '@/screens/data-ingestion/components/DataIngestionTable.vue';
import JobConfigModal from '@/screens/data-ingestion/components/JobConfigModal.vue';
import JobCreationModal from '@/screens/data-ingestion/components/JobCreationModal.vue';
import { StatusCell } from '@/shared/components/common/di-table/custom-cell/StatusCell';
import { JobActionCell } from '@/screens/data-ingestion/components/JobActionCell';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { ForceMode } from '@core/lake-house/domain/lake-job/ForceMode';
import { StringUtils } from '@/utils/StringUtils';
import { LayoutContent, LayoutHeader, LayoutNoData } from '@/shared/components/layout-wrapper';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { cloneDeep } from 'lodash';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import RefreshButton from '@/shared/components/common/RefreshButton.vue';
import { JobListingHandler } from '../interfaces/job-listing-handler/JobListingHandler';
import { RefreshOption } from '@/screens/data-ingestion/interfaces/RefreshOption';
import NProgress from 'nprogress';
import { CheckBoxHeaderController, CheckBoxHeaderData } from '@/shared/components/common/di-table/custom-cell/CheckBoxHeaderData';
import EmptyDirectory from '@/screens/dashboard-detail/components/EmptyDirectory.vue';
import { SlideXLeftTransition } from 'vue2-transitions';
import { Inject } from 'typescript-ioc';
import { GoogleAnalyticTables } from '@/screens/data-ingestion/components/google-analytics/GoogleAnalyticTables';
import { GoogleAnalytic4Tables } from '@/screens/data-ingestion/components/google-analytics-4/GoogleAnalytic4Tables';

@Component({
  components: {
    RefreshButton,
    JobCreationModal,
    JobConfigModal,
    DataIngestionTable,
    LayoutContent,
    LayoutHeader,
    LayoutNoData,
    DiTable2,
    MultiJobCreationModal,
    S3PreviewTableModal,
    EmptyDirectory,
    SlideXLeftTransition
  }
})
export default class JobScreen extends Vue {
  private readonly trackEvents = TrackEvents;
  private readonly listIgnoreClassForContextMenu = ['action-more'];
  private readonly tableId = 'job-listing';
  defaultDatasourceIcon = require('@/assets/icon/data_ingestion/datasource/ic_default.svg');

  //todo: add pagination for table
  private jobFormRenderer: JobFormRender = JobFormRender.default();
  private readonly animationDuration = 600;
  private readonly delay = 20;
  private from = 0;
  private size = DefaultPaging.DefaultPageSize;
  private sortName = 'last_modified';
  private sortMode: SortDirection = SortDirection.Desc;
  private searchValue = '';
  private listJobStatus: Status = Status.Loading;
  private tableErrorMessage = '';

  private readonly cellWidth = 180;

  private selectedIndexAsSet = new Set<JobId>();
  private enableMultiAction = false;
  private checkboxController = new CheckBoxHeaderController();

  @Inject
  private readonly jobService!: JobService;

  @Ref()
  private readonly jobCreationModal!: JobCreationModal;

  @Ref()
  private readonly jobConfigModal!: JobConfigModal;

  @Ref()
  private readonly diContextMenu!: ContextMenu;
  @Ref()
  private readonly multiJobCreationModal!: MultiJobCreationModal;

  @Ref()
  private jobTable?: DiTable2;

  @Ref()
  private readonly s3PreviewModal!: S3PreviewTableModal;

  @Prop({ required: true })
  private handler!: JobListingHandler;

  private get jobHeaders(): HeaderData[] {
    return [
      new CheckBoxHeaderData(
        this.selectedIndexAsSet,
        'jobId',
        this.checkboxController,
        this.jobRecords,
        {
          width: this.cellWidth / 3
        },
        this.onSelectedIndexChanged
      ),
      {
        key: 'name',
        label: 'Name',
        customRenderBodyCell: new CustomCell(rowData => {
          const data = rowData?.displayName ?? '--';
          // Log.debug('displayName Header::', rowData);
          // eslint-disable-next-line
          const datasourceImage = require(`@/assets/icon/data_ingestion/datasource/${Job.jobIcon(rowData)}`);
          const imgElement = HtmlElementRenderUtils.renderImg(datasourceImage, 'data-source-icon', this.defaultDatasourceIcon);
          const dataElement = HtmlElementRenderUtils.renderText(data, 'span', 'job-name text-truncate');
          return HtmlElementRenderUtils.renderAction([imgElement, dataElement], 8, 'job-name-container');
        })
      },
      {
        key: 'sourceName',
        disableSort: true,
        label: 'Source Name'
        // width: 168
      },
      {
        key: 'syncMode',
        label: 'Sync Mode',
        customRenderBodyCell: new CustomCell((rowData, rowIndex, header, columnIndex) => {
          const mode: SyncMode = rowData.syncMode ?? SyncMode.FullSync;
          let modeDisplayMode = '--';
          switch (mode) {
            case SyncMode.FullSync:
              modeDisplayMode = 'Full';
              break;
            case SyncMode.IncrementalSync:
              modeDisplayMode = 'Incremental';
              break;
          }
          return HtmlElementRenderUtils.renderText(modeDisplayMode, 'div', '');
        }),
        width: this.cellWidth / 1.5
      },
      {
        key: 'lastSyncStatus',
        label: 'Last Sync',
        customRenderBodyCell: new CustomCell(rowData => {
          const job = Job.fromObject(rowData);
          const time = job.lastSuccessfulSync;
          const imgSrc = StatusCell.jobStatusImg(job.lastSyncStatus);
          const elements = job.wasRun
            ? [HtmlElementRenderUtils.renderImg(imgSrc), HtmlElementRenderUtils.renderText(DateTimeFormatter.formatAsMMMDDYYYHHmmss(time), 'span')]
            : '--';
          const div = document.createElement('div');
          div.append(...elements);
          div.classList.add('custom-status-cell');
          return div;
        }),
        width: this.cellWidth
      },
      {
        key: 'nextRunTime',
        label: 'Next Sync',
        customRenderBodyCell: new CustomCell(rowData => {
          const job = Job.fromObject(rowData);
          const data = job.hasNextRunTime ? DateTimeFormatter.formatAsMMMDDYYYHHmmss(job.nextRunTime) : '--';
          return HtmlElementRenderUtils.renderText(data, 'div', '');
        }),
        width: this.cellWidth
      },
      {
        key: 'currentSyncStatus',
        label: 'Current Status',
        customRenderBodyCell: new StatusCell('currentSyncStatus', status => StatusCell.jobStatusImg(status as JobStatus)),
        width: (this.cellWidth * 2) / 3
      },
      {
        key: 'action',
        label: 'Action',
        disableSort: true,
        width: 155
      }
    ];
  }

  private get isActiveSearch() {
    return StringUtils.isNotEmpty(this.searchValue);
  }

  showUpdating() {
    this.listJobStatus = Status.Updating;
  }

  private get jobRecords(): RowData[] {
    // return [];
    return JobModule.jobList.map(jobInfo => {
      // Log.debug('DAtaSource::JobSource::', jobInfo.source);
      //todo: fix on tupe jdbc job else
      return {
        ...jobInfo.source,
        ...jobInfo.job,
        sourceType: jobInfo.source.sourceType,
        //@ts-ignore
        customSyncMode: jobInfo.job?.displaySyncMode ?? '--',
        sourceName: jobInfo.source.getDisplayName(),
        // customLastSyncStatus: new CustomCell(this.renderLastSyncStatus),
        // customCurrentSyncStatus: new CustomCell(this.renderCurrentSyncStatus),
        depth: 0,
        children: [],
        isExpanded: false,
        displayName: jobInfo.job.displayName,
        action: new JobActionCell({
          onEnable: this.handleClickForceSync,
          onDisable: this.handleCancel,
          onAction: this.showActionMenu
        })
      };
    });
  }

  private get record(): number {
    return JobModule.totalRecord;
  }

  private get refreshOption(): RefreshOption {
    return JobModule.refreshOption;
  }

  private get isLoaded() {
    return this.listJobStatus === Status.Loaded;
  }

  private get isEmptyData(): boolean {
    return ListUtils.isEmpty(this.jobRecords);
    // return true;
  }

  private get routerName() {
    return this.$route.name;
  }

  @Watch('routerName')
  async onChangeRouteName() {
    this.searchValue = '';
    this.checkboxController.reset();
    this.selectedIndexAsSet = new Set<JobId>();
    await this.handleLoadJobs();
  }

  @Track(TrackEvents.JobIngestionView)
  async mounted() {
    Log.debug('JobScreen::mounted');
    await this.handleLoadJobs();
  }

  private changeAutoRefreshOption(option: RefreshOption) {
    JobModule.setRefreshOption(option);
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

  //create job with multi creation modal
  private async createJob(job: Job, isSingleTable: boolean) {
    try {
      this.showUpdating();
      if (Job.isS3Job(job)) {
        this.openS3PreviewModal(job as S3Job);
      } else {
        const clonedJob = cloneDeep(job);
        clonedJob.scheduleTime = TimeScheduler.toSchedulerV2(job.scheduleTime!);

        //table event require custom metrics and dimensions
        if (Job.isGoogleAnalytic4Job(job) && (job as GA4Job).tableName === 'event') {
          const customMetricsAndDimension: { metrics: GA4Metric[]; dimensions: Ga4Dimension[] } = await this.getGA4CustomDimensionAndMetrics(
            (job as GA4Job).propertyId
          );
          (job as GA4Job).metrics = (job as GA4Job).metrics.concat(customMetricsAndDimension.metrics);
          (job as GA4Job).dimensions = (job as GA4Job).dimensions.concat(customMetricsAndDimension.dimensions);
        }
        if (Job.getJobFormConfigMode(job) === FormMode.Create) {
          if (isSingleTable) {
            await JobModule.create(job);
          } else {
            await this.createMultiJob(job);
          }
        } else {
          await JobModule.update(job);
        }
      }
      await this.handleLoadJobs();
    } catch (e) {
      Log.error('JobScreen::createJob::error::', e);
    } finally {
      this.showLoaded();
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
        const listGAJob = await this.getListGA4Job(job as GA4Job);
        await this.jobService.multiCreateV2(listGAJob);
        break;
      }
      default: {
        const tableNames = [...DataSourceModule.tableNames];
        await JobModule.createMulti({ job: job, tables: tableNames });
      }
    }
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

  private async getListGA4Job(job: GA4Job): Promise<GA4Job[]> {
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

  private customGA4Dimensions(dimensionMetadata: gapi.client.analyticsdata.DimensionMetadata[]) {
    return dimensionMetadata.map(dimension => new Ga4Dimension(dimension.apiName!)).filter(item => item.name.includes('customEvent:'));
  }

  private customGA4Metrics(metricMetadata: gapi.client.analyticsdata.MetricMetadata[]) {
    return metricMetadata.map(metric => new GA4Metric(metric.apiName!, this.getMetricType(metric.type!))).filter(item => item.name.includes('customEvent:'));
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

  private getMetricType(metricMetadataType: string): string {
    switch (metricMetadataType) {
      case 'TYPE_INTEGER':
        return 'int64';
      default:
        return 'float';
    }
  }

  private async editJob(job: Job) {
    await JobModule.update(job);
  }

  private openJobConfigModal(jobInfo: JobInfo) {
    Log.debug('handleClickRow::rowData::', jobInfo.job);
    switch (jobInfo.job.jobType) {
      case JobType.BigQuery:
      case JobType.Jdbc:
      case JobType.GenericJdbc:
      case JobType.Mongo:
      case JobType.Shopify:
      case JobType.S3:
      case JobType.GoogleAnalytics:
      case JobType.GA4:
        this.jobCreationModal.show(jobInfo.job);
        break;
      case JobType.Facebook:
      case JobType.GoogleAds: {
        this.multiJobCreationModal.show(
          jobInfo.job,
          (job, isSingleTable) => this.createJob(job, isSingleTable),
          (job, isSingleTable) => this.multiJobCreationModal.hide()
        );
        break;
      }
      default:
        Log.debug('openJobConfigModal::', jobInfo);
        this.jobFormRenderer = new JobFormFactory().createRender(jobInfo);
        this.jobConfigModal.show(async job => {
          await this.submitJob(job);
          await this.handleLoadJobs();
          this.jobConfigModal.closeModal();
        });
    }
  }

  private async handleLoadJobs() {
    try {
      this.showLoading();
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('JobScreen::loadJobs::exception::', exception.message);
      throw new DIException(exception.message);
    }
  }

  onSelectedIndexChanged() {
    this.enableMultiAction = this.selectedIndexAsSet.size > 0;
  }

  private showJobProcessLoading() {
    try {
      NProgress.configure({ parent: `#${this.tableId}` }).start();
    } catch (e) {
      Log.debug('JobScreen::showJobProcessLoading::error');
    }
  }

  private hideJobProcessLoading() {
    try {
      NProgress.configure({ parent: `#${this.tableId}` }).done();
    } catch (e) {
      Log.debug('JobScreen::showJobProcessLoading::error');
    }
  }

  private showRefreshLoading() {
    this.handler.isAutoRefresh ? this.showJobProcessLoading() : this.showUpdating();
  }

  private hideRefreshLoading() {
    if (this.handler.isAutoRefresh) {
      this.hideJobProcessLoading();
      this.showLoaded();
    } else {
      this.showLoaded();
    }
  }

  private async handleRefresh() {
    try {
      this.showRefreshLoading();
      this.onSelectedIndexChanged();
      await this.loadJobs();
      this.updateCheckbox();
      this.hideRefreshLoading();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('JobScreen::loadJobs::exception::', exception.message);
      throw new DIException(exception.message);
    } finally {
      this.hideJobProcessLoading();
    }
  }

  private updateCheckbox() {
    const idToRemove: JobId[] = ListUtils.diff<JobId>(
      Array.from(this.selectedIndexAsSet.values()),
      JobModule.jobList.map(jobInfo => jobInfo.job.jobId)
    );
    idToRemove.forEach(id => this.selectedIndexAsSet.delete(id));
  }

  private async loadJobs() {
    await this.handler.list(this.from, this.size, this.searchValue, [new SortRequest(this.sortName, this.sortMode)]);
  }

  @Track(TrackEvents.JobDelete, {
    job_id: (_: JobScreen, args: any) => args[0].jobId,
    job_name: (_: JobScreen, args: any) => args[0].displayName,
    job_type: (_: JobScreen, args: any) => args[0].className
  })
  private handleConfirmDeleteJob(job: Job) {
    Modals.showConfirmationModal(`Are you sure to delete job '${job.displayName}'?`, { onOk: () => this.handleDeleteJob(job) });
  }

  // @Track(TrackEvents.JobDelete, {
  //   job_id: (_: JobScreen, args: any) => args[0].jobId,
  //   job_name: (_: JobScreen, args: any) => args[0].displayName,
  //   job_type: (_: JobScreen, args: any) => args[0].className
  // })
  private handleConfirmDeleteMultiJob(jobIdAsSet: Set<JobId>) {
    const jobMessage = this.getJobMessage(jobIdAsSet.size);
    Modals.showConfirmationModal(`Are you sure to delete ${jobIdAsSet.size} ${jobMessage}?`, {
      onOk: () => {
        const jobIds: JobId[] = Array.from(jobIdAsSet);
        this.handleDeleteMultiJob(jobIds);
      }
    });
  }

  @Track(TrackEvents.JobSubmitDelete, {
    job_id: (_: JobScreen, args: any) => args[0].jobId,
    job_name: (_: JobScreen, args: any) => args[0].displayName,
    job_type: (_: JobScreen, args: any) => args[0].className
  })
  @AtomicAction()
  private async handleDeleteJob(job: Job) {
    try {
      this.showLoading();
      await JobModule.deleteJob(job.jobId);
      await this.loadJobs();
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
    } finally {
      this.showLoaded();
    }
  }

  @Track(TrackEvents.JobSubmitDelete, {
    job_id: (_: JobScreen, args: any) => args[0].jobId,
    job_name: (_: JobScreen, args: any) => args[0].displayName,
    job_type: (_: JobScreen, args: any) => args[0].className
  })
  @AtomicAction()
  private async handleDeleteMultiJob(jobIds: JobId[]) {
    try {
      this.showLoading();
      await JobModule.deleteJobs(jobIds);
      this.selectedIndexAsSet = new Set<JobId>();
      this.onSelectedIndexChanged();
      await this.loadJobs();
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
    } finally {
      this.showLoaded();
    }
  }

  @Track(TrackEvents.JobForceSync, {
    job_id: (_: JobScreen, args: any) => args[1].job.jobId,
    job_name: (_: JobScreen, args: any) => args[1].job.displayName,
    job_type: (_: JobScreen, args: any) => args[1].job.className
  })
  @AtomicAction()
  private async handleClickForceSync(e: MouseEvent, jobInfo: JobInfo) {
    e.stopPropagation();
    await this.handleForceSyncByDate(jobInfo.job, new Date());
  }

  @Track(TrackEvents.JobSubmitForceSync, {
    job_id: (_: JobScreen, args: any) => args[1].job.jobId,
    job_name: (_: JobScreen, args: any) => args[1].job.displayName,
    job_type: (_: JobScreen, args: any) => args[1].job.className
  })
  @AtomicAction()
  private async handleForceSyncByDate(job: Job, date: Date) {
    try {
      this.showLoading();
      const response = await JobModule.forceSync({
        jobId: job.jobId,
        date: date.getTime(),
        mode: ForceMode.Continuous
      });
      if (response) {
        PopupUtils.showSuccess('Force sync successfully.');
        await this.loadJobs();
      } else {
        PopupUtils.showError('Force sync failed.');
      }
      Log.debug('JobScreen::handleForceSync::job::', job, date);
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('JobScreen::handleForceSync::exception', exception.message);
    } finally {
      this.showLoaded();
    }
  }

  beforeDestroy() {
    this.checkboxController.reset();
    this.onSelectedIndexChanged();
  }

  @AtomicAction()
  private async handleMultiForceSyncByDate(jobIdAsSet: Set<JobId>, date: Date) {
    try {
      this.showLoading();
      const jobIds: JobId[] = Array.from(jobIdAsSet);
      const response: Record<JobId, boolean> = await JobModule.multiForceSync({
        jobIds: jobIds,
        date: date.getTime(),
        mode: ForceMode.Continuous
      });
      Log.debug('handleMultiForceSyncByDate::', typeof response);
      this.showMultiForceSyncMessage(response);
      this.selectedIndexAsSet = new Set<JobId>();
      this.onSelectedIndexChanged();
      await this.loadJobs();
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('JobScreen::handleForceSync::exception', exception.message);
    } finally {
      this.showLoaded();
    }
  }

  @Track(TrackEvents.JobCancel, {
    job_id: (_: JobScreen, args: any) => args[1].job.jobId,
    job_name: (_: JobScreen, args: any) => args[1].job.displayName,
    job_type: (_: JobScreen, args: any) => args[1].job.className
  })
  @AtomicAction()
  private async handleCancel(e: MouseEvent, jobInfo: JobInfo) {
    try {
      e.stopPropagation();
      this.showLoading();
      const response = await JobModule.cancel(jobInfo.job);
      if (response) {
        PopupUtils.showSuccess('Cancel job successfully.');
        await this.loadJobs();
      } else {
        PopupUtils.showError('Cancel job failed.');
      }
      Log.debug('JobScreen::handleCancel::job::', jobInfo, response);
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('JobScreen::handleCancel::exception', exception.message);
    } finally {
      this.showLoaded();
    }
  }

  private getActionMoreMenuItem(event: MouseEvent, jobInfo: JobInfo): ContextMenuItem[] {
    return [
      {
        text: 'Edit',
        disabled: jobInfo.job.className === JobName.UnsupportedJob,
        click: () => {
          this.diContextMenu?.hide();
          event.stopPropagation();
          this.openJobConfigModal(jobInfo);
          TrackingUtils.track(TrackEvents.JobEdit, {
            job_id: jobInfo.job.jobId,
            job_name: jobInfo.job.displayName,
            job_type: jobInfo.job.className
          });
        }
      },
      {
        text: 'Delete',
        click: () => {
          this.diContextMenu?.hide();
          event.stopPropagation();
          this.handleConfirmDeleteJob(jobInfo.job);
        }
      }
    ];
  }

  private showActionMenu(event: MouseEvent, jobInfo: JobInfo, targetId: string) {
    try {
      event.stopPropagation();
      PopupUtils.hideAllPopup();
      const items = this.getActionMoreMenuItem(event, jobInfo);
      // todo: popup wrong position,, ping @Hao
      const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(event, targetId, 24, 8);
      this.diContextMenu?.show(buttonEvent, items);
    } catch (ex) {
      Log.error(ex);
    }
  }

  @AtomicAction()
  private async handleSubmitJob() {
    try {
      this.showLoading();
      const job: Job = this.jobFormRenderer.createJob();
      Log.debug('Submit Job', job);
      await this.submitJob(job);
      await this.loadJobs();
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('JobScreen::handleSubmitJob::exception::', exception.message);
    } finally {
      this.showLoaded();
    }
  }

  private showLoaded() {
    this.listJobStatus = Status.Loaded;
  }

  private showLoading() {
    if (ListUtils.isEmpty(JobModule.jobList)) {
      this.listJobStatus = Status.Loading;
    } else {
      this.listJobStatus = Status.Updating;
    }
  }

  private showError(message: string) {
    this.listJobStatus = Status.Error;
    this.tableErrorMessage = message;
  }

  private async submitJob(job: Job) {
    const jobConfigFormMode: FormMode = Job.getJobFormConfigMode(job);
    const clonedJob = cloneDeep(job);
    // Log.debug('submitJob::', job.scheduleTime!);
    clonedJob.scheduleTime = TimeScheduler.toSchedulerV2(job.scheduleTime!);
    switch (jobConfigFormMode) {
      case FormMode.Create:
        await JobModule.create(clonedJob);
        TrackingUtils.track(TrackEvents.JobSubmitCreate, {
          job_id: job.jobId,
          job_name: job.displayName,
          job_type: job.className
        });
        break;
      case FormMode.Edit:
        await JobModule.update(clonedJob);
        TrackingUtils.track(TrackEvents.JobSubmitEdit, {
          job_id: job.jobId,
          job_name: job.displayName,
          job_type: job.className
        });
        break;
      default:
        throw new DIException(`Unsupported ${jobConfigFormMode} Job`);
    }
  }

  private async handlePageChange(pagination: Pagination) {
    try {
      this.showLoading();
      this.from = (pagination.page - 1) * pagination.rowsPerPage;
      this.size = pagination.rowsPerPage;
      this.checkboxController.reset();
      this.onSelectedIndexChanged();
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      Log.error(`UserProfile paging getting an error: ${e?.message}`);
      this.showError(e.message);
    }
  }

  @Track(TrackEvents.JobEdit, { job_id: (_: JobScreen, args: any) => args[0].jobId })
  private handleClickRow(rowData: RowData) {
    try {
      const job: Job = Job.fromObject(rowData);
      Log.debug('handleClickRow::rowData::', job);

      switch (job.jobType) {
        case JobType.Jdbc:
        case JobType.GenericJdbc:
        case JobType.BigQuery:
        case JobType.Mongo:
        case JobType.GoogleAnalytics:
        case JobType.S3:
        case JobType.Tiktok:
          this.jobCreationModal.show(job);
          break;
        case JobType.Unsupported:
          break;
        default: {
          const source: DataSourceInfo = DataSourceInfo.fromObject(rowData);
          const jobInfo: JobInfo = new JobInfo(job, source);
          this.openJobConfigModal(jobInfo);
        }
      }
    } catch (e) {
      Log.error('JobScreen::handleClickRow::error::', e.message);
    }
  }

  private async handleKeywordChange(newKeyword: string) {
    try {
      this.searchValue = newKeyword;
      this.from = 0;
      this.checkboxController.reset();
      this.onSelectedIndexChanged();
      this.showLoading();
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      Log.error('DataSourceScreen:: handleSortChange::', e);
      this.showError(e.message);
    }
  }

  private async handleSortChange(column: HeaderData) {
    try {
      Log.debug('handleSortChange::', this.sortName, this.sortMode);
      this.updateSortMode(column);
      this.updateSortColumn(column);
      this.checkboxController.reset();
      this.onSelectedIndexChanged();
      this.showUpdating();
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      Log.error('DatasourceScreen:: handleSortChange::', e);
      this.showError(e.message);
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

  ///Hàm chỉ excute hàm create job, không có edit ở đây
  ///Khi có edit thì sẽ gọi mở modal khác và k đi vào preview modal
  private openS3PreviewModal(job: S3Job) {
    const dataSourceRes = DataSourceModule.dataSources.find(res => res.dataSource.id === job.sourceId);
    if (dataSourceRes) {
      this.s3PreviewModal.show(dataSourceRes.dataSource as S3SourceInfo, job, {
        onCompleted: (source, job) => this.submitJob(job),
        onBack: () =>
          this.multiJobCreationModal.show(
            job,
            (job, isSingleTable) => this.createJob(job, isSingleTable),
            (job, isSingleTable) => this.multiJobCreationModal.hide()
          )
      });
    }
  }

  private getJobMessage(total: number): string {
    return total > 1 ? 'jobs' : 'job';
  }

  private showMultiForceSyncMessage(response: Record<JobId, boolean>) {
    const jobSyncSuccesses: boolean[] = Object.values(response);
    const totalJobSyncSuccess = jobSyncSuccesses.filter(success => success).length;
    const totalJobSyncFail = jobSyncSuccesses.filter(success => !success).length;
    const successMessage = totalJobSyncSuccess > 0 ? `${totalJobSyncSuccess} ${this.getJobMessage(totalJobSyncSuccess)} force sync successfully` : ``;
    const errorMessage = totalJobSyncFail > 0 ? `${totalJobSyncFail} ${this.getJobMessage(totalJobSyncFail)} force sync failed` : ``;
    if (totalJobSyncFail === 0) {
      PopupUtils.showSuccess(successMessage);
    } else {
      const andMessage = totalJobSyncSuccess > 0 && totalJobSyncFail > 0 ? `&` : ``;
      const message = `${totalJobSyncSuccess} ${andMessage} ${errorMessage}`;
      totalJobSyncSuccess === 0 ? PopupUtils.showError(message) : PopupUtils.showSuccess(message);
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.job {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px - 68px);

  > header {
    align-items: center;
    display: flex;
    height: 33px;
    justify-content: space-between;

    > .job-title {
      align-items: center;
      display: flex;
      flex: 1;
      font-size: 24px;
      font-stretch: normal;
      font-style: normal;
      font-weight: 500;
      letter-spacing: 0.2px;
      line-height: 1.4;
      overflow: hidden;
      margin-right: 0;

      > .root-title {
        align-items: center;
        display: flex;

        > i {
          margin-right: 16px;
          color: var(--directory-header-icon-color);
        }
      }

      .job-action-icon {
        font-size: 16px;
        color: var(--directory-header-icon-color);
      }
    }

    > #create-job {
      padding: 0;

      &.hide {
        display: none !important;
      }

      &:hover,
      &:active {
        background: unset !important;
      }
    }
  }

  > .job-divider {
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

  .job-name-container {
    display: flex;
    align-items: center;
  }

  //.icon-action {
  //  font-size: 14px;
  //  padding: 6px;
  //}

  .data-source-icon {
    width: 24px;
    height: 24px;
  }

  .job-name {
    color: var(--text-color) !important;
    @include semi-bold-14();
    letter-spacing: 0.23px;
    font-weight: 500 !important;
  }

  > .job-table {
    background-color: var(--directory-row-bg);
    flex: 1;
    z-index: 1;
  }

  .action-container {
    .btn-outline-secondary {
      @include regular-text-14();
      cursor: pointer;
      border-width: 1px !important;
      border-color: var(--scrollbar-background) !important;
    }
  }
}
</style>
