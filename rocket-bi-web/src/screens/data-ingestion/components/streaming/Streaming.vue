<template>
  <LayoutContent>
    <LayoutHeader title="Streaming Jobs" icon="di-icon-streaming">
      <div class="ml-auto d-flex align-items-center">
        <SearchInput class="search-input" hint-text="Search job" :timeBound="400" @onTextChanged="handleKeywordChange" />
        <DiIconTextButton class="ml-auto" title="Refresh" @click="handleRefresh" :event="trackEvents.JobIngestionRefresh">
          <i class="di-icon-reset job-action-icon"></i>
        </DiIconTextButton>
      </div>
    </LayoutHeader>
    <div class="streaming-job-layout layout-content-panel">
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
        id="job-listing"
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
      <ContextMenu
        id="query-action-menu"
        ref="diContextMenu"
        :ignoreOutsideClass="listIgnoreClassForContextMenu"
        minWidth="168px"
        textColor="var(--text-color)"
      />
      <StreamingJobConfigModal ref="streamingJobConfigModal" />
      <KafkaStreamingPreviewSchemaModal ref="kafkaStreamingPreviewSchemaModal" />
      <StreamingJobDetailsModal ref="streamingJobDetailsModal" />
    </div>
  </LayoutContent>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { CustomCell, HeaderData, IndexedHeaderData, Pagination, RowData } from '@/shared/models';
import { JobModule } from '@/screens/data-ingestion/store/JobStore';
import { ContextMenuItem, DefaultPaging, Status } from '@/shared';
import { Log } from '@core/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { Modals } from '@/utils/Modals';
import { PopupUtils } from '@/utils/PopupUtils';
import { CreateStreamingJobRequest, KafkaStreamingJob, ListingResponse, SortRequest, StreamingJobService } from '@core/data-ingestion';
import { DIException, ListingRequest, SortDirection } from '@core/common/domain';
import { ChartUtils, DateTimeFormatter, ListUtils } from '@/utils';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import DataIngestionTable from '@/screens/data-ingestion/components/DataIngestionTable.vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { ForceMode } from '@core/lake-house/domain/lake-job/ForceMode';
import { StringUtils } from '@/utils/StringUtils';
import { LayoutContent, LayoutHeader, LayoutNoData } from '@/shared/components/layout-wrapper';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Inject } from 'typescript-ioc';
import { StreamingJobResponse } from '@core/data-ingestion/domain/response/streaming-job/StreamingJobResponse';
import EmptyDirectory from '@/screens/dashboard-detail/components/EmptyDirectory.vue';
import StreamingJobConfigModal from '@/screens/data-ingestion/components/streaming-job/StreamingJobConfigModal.vue';
import KafkaStreamingPreviewSchemaModal from '@/screens/data-ingestion/components/streaming-job/KafkaStreamingPreviewSchemaModal.vue';
import { UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';
import StreamingJobDetailsModal from '@/screens/data-ingestion/components/streaming-job/StreamingJobDetailsModal.vue';

@Component({
  components: {
    StreamingJobDetailsModal,
    KafkaStreamingPreviewSchemaModal,
    StreamingJobConfigModal,
    DataIngestionTable,
    LayoutContent,
    LayoutHeader,
    LayoutNoData,
    DiTable2,
    EmptyDirectory
  }
})
export default class Streaming extends Vue {
  private readonly trackEvents = TrackEvents;
  private readonly listIgnoreClassForContextMenu = ['action-more'];
  defaultDatasourceIcon = require('@/assets/icon/data_ingestion/datasource/ic_default.svg');

  //todo: add pagination for table
  private streamingJobResponse: ListingResponse<StreamingJobResponse> = new ListingResponse<StreamingJobResponse>([], 0);
  private from = 0;
  private size = DefaultPaging.DefaultPageSize;
  private sortName = 'last_modified';
  private sortMode: SortDirection = SortDirection.Desc;
  private searchValue = '';
  private listJobStatus: Status = Status.Loading;
  private tableErrorMessage = '';

  private readonly cellWidth = 180;

  @Ref()
  private readonly diContextMenu!: ContextMenu;

  @Ref()
  private jobTable?: DiTable2;

  @Ref()
  private streamingJobConfigModal?: StreamingJobConfigModal;

  @Ref()
  private kafkaStreamingPreviewSchemaModal?: KafkaStreamingPreviewSchemaModal;

  @Ref()
  private streamingJobDetailsModal?: StreamingJobDetailsModal;

  @Inject
  private streamingJobService!: StreamingJobService;

  private get isMobile() {
    return ChartUtils.isMobile();
  }

  private get jobHeaders(): HeaderData[] {
    return [
      {
        key: 'name',
        label: 'Name',
        customRenderBodyCell: new CustomCell(rowData => {
          const response = StreamingJobResponse.fromObject((rowData as any) as StreamingJobResponse);
          // Log.debug('displayName Header::', rowData);
          // eslint-disable-next-line
          const datasourceImage = require(`@/assets/icon/data_ingestion/datasource/ic_kafka_small.png`);
          const imgElement = HtmlElementRenderUtils.renderImg(datasourceImage, 'data-source-icon', this.defaultDatasourceIcon);
          const dataElement = HtmlElementRenderUtils.renderText(response.job.name, 'span', 'job-name text-truncate');
          return HtmlElementRenderUtils.renderAction([imgElement, dataElement], 8, 'job-name-container');
        })
      },
      {
        key: 'creator',
        label: 'Creator',
        disableSort: true,
        customRenderBodyCell: new UserAvatarCell('creator.avatar', ['creator.fullName', 'creator.lastName', 'creator.email', 'creator.username']),
        width: this.cellWidth * 1.5
      },
      {
        key: 'job.updatedAt',
        label: 'Last Modified',
        disableSort: true,
        hiddenInMobile: true,
        customRenderBodyCell: new CustomCell(rowData => {
          const response = StreamingJobResponse.fromObject((rowData as any) as StreamingJobResponse);
          const data = DateTimeFormatter.formatAsMMMDDYYYHHmmss(response.job.updatedAt);
          return HtmlElementRenderUtils.renderText(data, 'div', '');
        }),
        width: this.cellWidth
      },
      {
        key: 'job.createdAt',
        label: 'Created Time',
        disableSort: true,
        hiddenInMobile: true,
        customRenderBodyCell: new CustomCell(rowData => {
          const response = StreamingJobResponse.fromObject((rowData as any) as StreamingJobResponse);
          const data = DateTimeFormatter.formatAsMMMDDYYYHHmmss(response.job.createdAt);
          return HtmlElementRenderUtils.renderText(data, 'div', '');
        }),
        width: this.cellWidth
      },
      {
        key: 'action',
        label: 'Action',
        disableSort: true,
        width: 90
      }
    ];
  }

  private get isActiveSearch() {
    return StringUtils.isNotEmpty(this.searchValue);
  }

  showUpdating() {
    this.listJobStatus = Status.Updating;
  }

  private get jobRecords() {
    return this.streamingJobResponse.data.map(jobResponse => {
      return {
        ...jobResponse,
        action: new CustomCell(this.renderActionMenu)
      };
    });
  }

  private get record(): number {
    return this.streamingJobResponse.total;
  }

  private get isLoaded() {
    return this.listJobStatus === Status.Loaded;
  }

  private get isEmptyData(): boolean {
    return ListUtils.isEmpty(this.jobRecords);
    // return true;
  }

  async created() {
    await this.handleLoadJobs();
  }

  private showKafkaStreamingPreviewModal(kafkaStreamingJob: KafkaStreamingJob) {
    this.kafkaStreamingPreviewSchemaModal?.show(kafkaStreamingJob, {
      onCompleted: this.handleSubmitJob,
      onBack: this.showStreamingJobConfigModal
    });
  }

  private showStreamingJobConfigModal(kafkaStreamingJob: KafkaStreamingJob) {
    this.streamingJobConfigModal?.show(kafkaStreamingJob, this.showKafkaStreamingPreviewModal);
  }

  private openNewJobConfigModal() {
    this.showStreamingJobConfigModal(KafkaStreamingJob.default());
  }

  private async createJob(job: KafkaStreamingJob) {
    try {
      this.showUpdating();
      await this.streamingJobService.create(new CreateStreamingJobRequest(job.name, job.config, job.destinationConfigs));
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      Log.error('Streaming::createJob::error::', e.message);
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
      Log.error('Streaming::loadJobs::exception::', exception.message);
      throw new DIException(exception.message);
    }
  }

  private async handleRefresh() {
    try {
      this.showUpdating();
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('Streaming::loadJobs::exception::', exception.message);
      throw new DIException(exception.message);
    }
  }

  private async loadJobs() {
    this.streamingJobResponse = await this.streamingJobService.list(
      new ListingRequest(this.searchValue, this.from, this.size, [new SortRequest(this.sortName, this.sortMode)])
    );
  }

  private handleConfirmDeleteJob(job: KafkaStreamingJob) {
    Modals.showConfirmationModal(`Are you sure to delete job '${job.name}'?`, { onOk: () => this.handleDeleteJob(job) });
  }

  @AtomicAction()
  private async handleDeleteJob(job: KafkaStreamingJob) {
    try {
      this.showUpdating();
      await this.streamingJobService.delete(job.id);
      await this.loadJobs();
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
    } finally {
      this.showLoaded();
    }
  }

  @AtomicAction()
  private async handleClickForceSync(e: MouseEvent, jobInfo: StreamingJobResponse) {
    e.stopPropagation();
    await this.handleForceSyncByDate(jobInfo.job, new Date());
  }

  @AtomicAction()
  private async handleForceSyncByDate(job: KafkaStreamingJob, date: Date) {
    try {
      this.showLoading();
      const response = await JobModule.forceSync({ jobId: job.id, date: date.getTime(), mode: ForceMode.Continuous });
      if (response) {
        PopupUtils.showSuccess('Force sync successfully.');
        await this.loadJobs();
      } else {
        PopupUtils.showError('Force sync failed.');
      }
      Log.debug('Streaming::handleForceSync::job::', job, date);
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('Streaming::handleForceSync::exception', exception.message);
    } finally {
      this.showLoaded();
    }
  }

  private getActionMoreMenuItem(event: MouseEvent, jobResponse: StreamingJobResponse): ContextMenuItem[] {
    return [
      {
        text: 'Details',
        click: () => {
          this.diContextMenu?.hide();
          event.stopPropagation();
          this.streamingJobDetailsModal?.show(jobResponse.job);
        }
      },
      {
        text: 'Delete',
        click: () => {
          this.diContextMenu?.hide();
          event.stopPropagation();
          this.handleConfirmDeleteJob(jobResponse.job);
        }
      }
    ];
  }

  private renderActionMenu(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number) {
    const jobResponse = StreamingJobResponse.fromObject((rowData as any) as StreamingJobResponse);
    const id = `action-menu-${jobResponse.job.id}`;
    const menu = HtmlElementRenderUtils.renderIcon('di-icon-three-dot-horizontal btn-icon-border action-more icon-action p-2', (e: MouseEvent) =>
      this.showActionMenu(e, jobResponse, id)
    );
    menu.id = id;
    menu.setAttribute('data-title', 'More');
    return menu;
  }

  private showActionMenu(event: MouseEvent, jobResponse: StreamingJobResponse, targetId: string) {
    try {
      event.stopPropagation();
      PopupUtils.hideAllPopup();
      const items = this.getActionMoreMenuItem(event, jobResponse);
      // todo: popup wrong position,, ping @Hao
      const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(event, targetId, 24, 8);
      this.diContextMenu?.show(buttonEvent, items);
    } catch (ex) {
      Log.error(ex);
    }
  }

  @AtomicAction()
  private async handleSubmitJob(job: KafkaStreamingJob) {
    try {
      this.showUpdating();
      // const job: Job = this.jobFormRenderer.createJob();
      Log.debug('Submit Job', job);
      await this.streamingJobService.create(new CreateStreamingJobRequest(job.name, job.config, job.destinationConfigs));
      this.resetPagination();
      await this.loadJobs();
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('Streaming::handleSubmitJob::exception::', exception.message);
    } finally {
      this.showLoaded();
    }
  }

  private resetPagination() {
    this.from = 0;
    this.size = DefaultPaging.DefaultPageSize;
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

  private async handlePageChange(pagination: Pagination) {
    try {
      this.showLoading();
      this.from = (pagination.page - 1) * pagination.rowsPerPage;
      this.size = pagination.rowsPerPage;
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      Log.error(`Streaming::handlePageChange::error::${e?.message}`);
      this.showError(e.message);
    }
  }

  private handleClickRow(rowData: RowData) {
    try {
      Log.debug('Streaming::handleClickRow::rowData::', rowData);
      const jobResponse: StreamingJobResponse = StreamingJobResponse.fromObject((rowData as any) as StreamingJobResponse);
      this.streamingJobDetailsModal?.show(jobResponse.job);
    } catch (e) {
      Log.error('Streaming::handleClickRow::error::', e);
    }
  }

  private async handleKeywordChange(newKeyword: string) {
    try {
      this.searchValue = newKeyword;
      this.from = 0;
      this.showLoading();
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      Log.error('Streaming::handleKeywordChange::error::', e);
      this.showError(e.message);
    }
  }

  private async handleSortChange(column: HeaderData) {
    try {
      Log.debug('handleSortChange::', this.sortName, this.sortMode);
      this.updateSortMode(column);
      this.updateSortColumn(column);
      this.showUpdating();
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      Log.error('Streaming::handleSortChange::error::', e);
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
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.streaming-job-layout {
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
