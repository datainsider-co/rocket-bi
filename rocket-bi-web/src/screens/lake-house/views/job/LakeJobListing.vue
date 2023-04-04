<template>
  <LayoutContent>
    <LayoutHeader title="Jobs Management" icon="di-icon-job">
      <div class="action-bar d-flex ml-auto">
        <SearchInput class="search-input" hint-text="Search job" :timeBound="400" @onTextChanged="handleKeywordChange" />
        <DiIconTextButton id="refresh" title="Refresh" @click="handleRefresh">
          <i class="di-icon-reset" />
        </DiIconTextButton>
        <DiIconTextButton id="add-lake-job" title="Add Job" @click="redirectToJobBuilder" :event="trackEvents.LakeAddJob">
          <i class="di-icon-add" />
        </DiIconTextButton>
      </div>
    </LayoutHeader>
    <div class="layout-content-panel">
      <LayoutNoData v-if="isLoaded && isEmptyData" icon="di-icon-job">
        No data yet
      </LayoutNoData>
      <DiTable2
        v-else
        id="job-listing"
        ref="jobTable"
        :error-msg="tableErrorMessage"
        :headers="headers"
        :isShowPagination="true"
        :records="records"
        :status="listQueryInfoStatus"
        :total="total"
        padding-pagination="40"
        class="flex-shrink-1 flex-grow-1"
        @onClickRow="handleClickJob"
        @onPageChange="handlePageChange"
        @onRetry="handleGetJobs"
        @onSortChanged="handleSortChange"
      >
        <template #empty>
          <EmptyDirectory class="h-100"></EmptyDirectory>
        </template>
      </DiTable2>
    </div>
    <ContextMenu
      id="query-action-menu"
      ref="diContextMenu"
      :ignoreOutsideClass="listIgnoreClassForContextMenu"
      minWidth="168px"
      textColor="var(--text-color)"
    />
    <ForceRunSettingModal ref="forceRunSettingModal" @forceRun="handleForceRunByDate" />
  </LayoutContent>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { CustomCell, HeaderData, Pagination, RowData } from '@/shared/models';
import DataSourceSelectionModal from '@/screens/data-ingestion/components/DataSourceSelectionModal.vue';
import { ContextMenuItem, DefaultPaging, Routers, Status } from '@/shared';
import { Log } from '@core/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { Modals } from '@/utils/Modals';
import { PopupUtils } from '@/utils/PopupUtils';
import { DIException, SortDirection } from '@core/common/domain';
import { DateTimeFormatter, ListUtils } from '@/utils';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import DataIngestionTable from '@/screens/data-ingestion/components/DataIngestionTable.vue';
import { LakeJobModule } from '@/screens/lake-house/views/job/store/LakeJobStore';
import { UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';
import { RouterUtils } from '@/utils/RouterUtils';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { LakeJobActionCell } from '@/screens/lake-house/views/job/LakeJobActionCell';
import { LakeJobResponse } from '@core/lake-house/domain/lake-job/LakeJobResponse';
import { LakeJob } from '@core/lake-house/domain/lake-job/LakeJob';
import { LakeJobs } from '@core/lake-house/domain/lake-job/LakeJobs';
import { LakeStatusCell } from '@/shared/components/common/di-table/custom-cell/LakeStatusCell';
import { StringUtils } from '@/utils/StringUtils';
import { SortRequest } from '@core/data-ingestion';
import ForceRunSettingModal from '@/shared/components/ForceRunSettingModal.vue';
import { ForceMode } from '@core/lake-house/domain/lake-job/ForceMode';
import { LayoutContent, LayoutHeader, LayoutNoData } from '@/shared/components/layout-wrapper';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';

@Component({
  components: {
    ForceRunSettingModal,
    DataIngestionTable,
    DataSourceSelectionModal,
    ContextMenu,
    LayoutContent,
    LayoutHeader,
    LayoutNoData,
    DiTable2
  }
})
export default class LakeJobListing extends Vue {
  private readonly trackEvents = TrackEvents;
  private listIgnoreClassForContextMenu = ['action-more'];
  private readonly cellWidth = 150;

  @Ref()
  jobTable?: DiTable2;
  @Ref()
  private readonly diContextMenu?: ContextMenu;

  @Ref()
  private readonly forceRunSettingModal!: ForceRunSettingModal;

  private from = 0;
  private size = DefaultPaging.DefaultPageSize;
  private sortName = 'name';
  private defaultSortDisplayName = 'Name';
  private sortMode: SortDirection = SortDirection.Asc;
  private searchValue = '';
  private listQueryInfoStatus: Status = Status.Loading;
  private tableErrorMessage = '';

  private get headers(): HeaderData[] {
    return [
      {
        key: 'name',
        label: 'Name',
        customRenderBodyCell: new CustomCell(rowData => {
          const data = rowData?.job.name && StringUtils.isNotEmpty(rowData.job.name) ? rowData.job.name : '--';
          return HtmlElementRenderUtils.renderText(data, 'span', 'job-name text-truncate');
        })
      },
      {
        key: 'creatorId',
        label: 'Owner',
        customRenderBodyCell: new UserAvatarCell('creator.avatar', ['creator.fullName', 'creator.username'], false, true),
        width: this.cellWidth
      },
      {
        key: 'jobType',
        label: 'Type',
        customRenderBodyCell: new CustomCell(rowData => {
          return HtmlElementRenderUtils.renderText(rowData.job.jobType, 'div', '');
        }),
        width: 0.5 * this.cellWidth
      },
      {
        key: 'lastRunStatus',
        label: 'Last Run',
        customRenderBodyCell: new CustomCell(rowData => {
          const job = LakeJobResponse.fromObject(rowData).job;
          const time = job.lastRunTime;
          const imgSrc = job.lastRunStatusIcon;
          const elements = job.wasRun
            ? [HtmlElementRenderUtils.renderImg(imgSrc), HtmlElementRenderUtils.renderText(DateTimeFormatter.formatAsMMMDDYYYHHmmss(time), 'span')]
            : '--';
          const div = document.createElement('div');
          div.append(...elements);
          div.classList.add('custom-status-cell');
          return div;
        }),
        width: 1.2 * this.cellWidth
      },
      {
        key: 'nextRunTime',
        label: 'Next Run',
        customRenderBodyCell: new CustomCell(rowData => {
          const job = LakeJobResponse.fromObject(rowData).job;
          const data = job.hasNextRunTime ? DateTimeFormatter.formatAsMMMDDYYYHHmmss(rowData.job.nextRunTime) : '--';
          return HtmlElementRenderUtils.renderText(data, 'div', '');
        }),
        width: this.cellWidth
      },
      {
        key: 'currentJobStatus',
        label: 'Current Status',
        customRenderBodyCell: new LakeStatusCell('job.currentJobStatus'),
        width: 0.8 * this.cellWidth
      },
      {
        key: 'actions',
        label: 'Action',
        width: this.cellWidth,
        disableSort: true,
        customRenderBodyCell: new LakeJobActionCell({
          onEnable: this.handleClickForceRun,
          onDisable: this.handleCancel,
          onAction: this.showActionMenu
        })
      }
    ];
  }

  private showActionMenu(event: MouseEvent, job: LakeJobResponse, targetId: string) {
    try {
      event.stopPropagation();
      PopupUtils.hideAllPopup();
      const items = this.getActionMoreMenuItem(event, job);
      // todo: popup wrong position,, ping @Hao
      const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(event, targetId, 24, 8);
      this.diContextMenu?.show(buttonEvent, items);
    } catch (ex) {
      Log.error(ex);
    }
  }

  private get records(): RowData[] {
    return (LakeJobModule.jobs as any) as RowData[];
  }

  private get total(): number {
    return LakeJobModule.totalJobs;
  }

  private get isLoaded() {
    return this.listQueryInfoStatus === Status.Loaded;
  }

  private get isEmptyData(): boolean {
    return ListUtils.isEmpty(this.records);
    // return true;
  }

  @Track(TrackEvents.LakeJobManagementView)
  async created() {
    await this.handleGetJobs();
    this.jobTable?.setSort(this.defaultSortDisplayName, this.sortMode);
  }

  private showUpdating() {
    this.listQueryInfoStatus = Status.Updating;
  }

  private showLoaded() {
    this.listQueryInfoStatus = Status.Loaded;
  }

  private showLoading() {
    this.listQueryInfoStatus = Status.Loading;
  }

  private showError(message: string) {
    this.listQueryInfoStatus = Status.Error;
    this.tableErrorMessage = message;
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

  private loadJobs() {
    return LakeJobModule.loadJobs({
      from: this.from,
      size: this.size,
      sorts: [new SortRequest(this.sortName, this.sortMode)],
      keyword: this.searchValue
    });
  }

  private viewJobDetail(job: LakeJob): void {
    const { jobId } = job;
    switch (job.className) {
      case LakeJobs.Java:
        RouterUtils.to(Routers.LakeJar, { query: { schedulerId: jobId.toString() } });
        break;
      case LakeJobs.SQL: {
        RouterUtils.to(Routers.LakeSqlQueryEditor, { query: { schedulerId: jobId.toString() } });
        break;
      }
    }
  }

  private getActionMoreMenuItem(event: MouseEvent, jobInfo: LakeJobResponse): ContextMenuItem[] {
    return [
      {
        text: 'Edit',
        disabled: jobInfo.job.className === LakeJobs.Unsupported,
        click: () => {
          this.diContextMenu?.hide();
          event.stopPropagation();
          this.viewJobDetail(jobInfo.job);
        }
      },
      {
        text: 'Delete',
        click: () => {
          this.diContextMenu?.hide();
          event.stopPropagation();
          this.handleConfirmDeleteJob(jobInfo);
        }
      }
    ];
  }

  private async handleGetJobs() {
    try {
      this.showLoading();
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('QueryInfoScreen::loadQueryInfos::exception::', exception.message);
      throw new DIException(exception.message);
    }
  }

  @Track(TrackEvents.LakeJobManagementRefresh)
  private async handleRefresh() {
    try {
      this.showUpdating();
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('QueryInfoScreen::handleRefresh::exception::', exception.message);
    }
  }

  @Track(TrackEvents.LakeJobDelete, {
    job_name: (_: LakeJobListing, args: any) => (args[0] as LakeJobResponse).job.name,
    job_id: (_: LakeJobListing, args: any) => (args[0] as LakeJobResponse).job.jobId,
    job_type: (_: LakeJobListing, args: any) => (args[0] as LakeJobResponse).job.className
  })
  private handleConfirmDeleteJob(jobInfo: LakeJobResponse) {
    try {
      Modals.showConfirmationModal(`Are you sure to delete job '${jobInfo.job.name}'?`, { onOk: () => this.handleDeleteJob(jobInfo) });
    } catch (ex) {
      Log.error(ex);
    }
  }

  @Track(TrackEvents.LakeJobSubmitDelete, {
    job_name: (_: LakeJobListing, args: any) => (args[0] as LakeJobResponse).job.name,
    job_id: (_: LakeJobListing, args: any) => (args[0] as LakeJobResponse).job.jobId,
    job_type: (_: LakeJobListing, args: any) => (args[0] as LakeJobResponse).job.className
  })
  @AtomicAction()
  private async handleDeleteJob(jobInfo: LakeJobResponse) {
    try {
      this.showUpdating();
      await LakeJobModule.deleteJob(jobInfo.job);
      await this.loadJobs();
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
    } finally {
      this.showLoaded();
    }
  }

  @Track(TrackEvents.LakeJobForceRun, {
    job_name: (_: LakeJobListing, args: any) => (args[0] as LakeJob).name,
    job_id: (_: LakeJobListing, args: any) => (args[0] as LakeJob).jobId,
    job_type: (_: LakeJobListing, args: any) => (args[0] as LakeJob).className
  })
  private async handleClickForceRun(e: MouseEvent, jobInfo: LakeJobResponse) {
    e.stopPropagation();
    this.showForceRunSettingModal(jobInfo.job);
  }

  @Track(TrackEvents.LakeJobSubmitForceRun, {
    job_name: (_: LakeJobListing, args: any) => (args[0] as LakeJob).name,
    job_id: (_: LakeJobListing, args: any) => (args[0] as LakeJob).jobId,
    job_type: (_: LakeJobListing, args: any) => (args[0] as LakeJob).className,
    date: (_: LakeJobListing, args: any) => (args[1] as Date).getTime()
  })
  private async handleForceRunByDate(job: LakeJob, date: Date) {
    try {
      Log.debug('Lake Job Force run:: job', job, date.getTime());
      Log.debug('Lake Job Force run:: Force sync starting.....');
      this.showUpdating();
      this.forceRunSettingModal.showLoading();
      const isSuccess = await LakeJobModule.forceRun({ jobId: job.jobId, date: date.getTime(), mode: ForceMode.Continuous });
      if (isSuccess) {
        PopupUtils.showSuccess('Force sync successfully.');
        await this.loadJobs();
        Log.debug('Lake Job Force run:: Force sync successfully!', isSuccess);
      } else {
        PopupUtils.showError('Force sync failed.');
        Log.error('Lake Job Force run:: Force sync failed!', job, date);
      }
      this.forceRunSettingModal.hideLoading();
    } catch (e) {
      Log.error('Lake Job Force run::unknown:: Force sync failed!', job, date);
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
    } finally {
      this.forceRunSettingModal.hide();
      this.showLoaded();
    }
  }

  private showForceRunSettingModal(job: LakeJob) {
    this.forceRunSettingModal.show(job);
  }

  @Track(TrackEvents.LakeJobCancelForceRun, {
    job_name: (_: LakeJobListing, args: any) => (args[1] as LakeJobResponse).job.name,
    job_id: (_: LakeJobListing, args: any) => (args[1] as LakeJobResponse).job.jobId,
    job_type: (_: LakeJobListing, args: any) => (args[1] as LakeJobResponse).job.className
  })
  private async handleCancel(e: MouseEvent, jobInfo: LakeJobResponse) {
    try {
      Log.debug('Lake QueryInfo:: job', jobInfo);
      Log.debug('Lake QueryInfo:: Cancel starting.....');
      e.stopPropagation();
      this.showUpdating();
      //todo: call api cancel here
      const isSuccess = await LakeJobModule.cancelJob(jobInfo.job);
      if (isSuccess) {
        PopupUtils.showSuccess('Cancel successfully.');
        await this.loadJobs();
        Log.debug('Lake QueryInfo:: Cancel successfully!', isSuccess);
      } else {
        PopupUtils.showError('Cancel failed.');
        Log.error('Lake QueryInfo:: Cancel failed!', jobInfo);
      }
    } catch (e) {
      Log.error('Lake QueryInfo::unknown:: Cancel failed!', e, jobInfo);
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
    } finally {
      this.showLoaded();
    }
  }

  private async handlePageChange(pagination: Pagination) {
    try {
      this.showUpdating();
      this.from = (pagination.page - 1) * pagination.rowsPerPage;
      this.size = pagination.rowsPerPage;
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      Log.error(`UserProfile paging getting an error: ${e?.message}`);
      this.showError(e.message);
    }
  }

  private async handleSortChange(column: HeaderData) {
    try {
      this.updateSortMode(column);
      this.updateSortColumn(column);
      Log.debug('handleSortChange::', this.sortName, this.sortMode);
      this.showUpdating();
      await this.loadJobs();
      this.showLoaded();
    } catch (e) {
      Log.error('LakeQueryInfo:: handleSortChange::', e);
      this.showError(e.message);
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
      Log.error('LakeQueryInfo:: handleSortChange::', e);
      this.showError(e.message);
    }
  }

  @Track(TrackEvents.LakeJobEdit, {
    job_name: (_: LakeJobListing, args: any) => (args[0] as LakeJobResponse).job.name,
    job_id: (_: LakeJobListing, args: any) => (args[0] as LakeJobResponse).job.jobId,
    job_type: (_: LakeJobListing, args: any) => (args[0] as LakeJobResponse).job.className
  })
  private handleClickJob(lakeJobInfo: LakeJobResponse) {
    try {
      this.viewJobDetail(lakeJobInfo.job);
    } catch (ex) {
      Log.error('LakeJobScreen.vue', 'handleClickJob', ex);
      this.showError(ex.message);
    }
  }

  private redirectToJobBuilder() {
    RouterUtils.to(Routers.LakeQueryEditor);
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

      > .root-title {
        align-items: center;
        display: flex;

        > i {
          margin-right: 16px;
          color: var(--directory-header-icon-color);
        }
      }
    }

    .action-bar {
      @include regular-text-14();
      display: flex;
      align-items: center;

      > #refresh,
      #create {
        margin-bottom: 0;
        //margin-top: 3px;
        margin-right: 12px;

        @media screen and (max-width: 800px) {
          .title {
            display: none;
          }
        }
      }
    }

    > #add-new-job {
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
  }

  .job-name-container {
    display: flex;
    align-items: center;
  }

  .icon-action {
    font-size: 14px;
    padding: 6px;
  }

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

  .job-cell {
    &[disabled] {
      opacity: 0.6;
    }
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
