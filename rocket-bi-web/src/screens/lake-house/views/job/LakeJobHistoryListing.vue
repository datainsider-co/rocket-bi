<template>
  <LayoutContent>
    <LayoutHeader title="Jobs History" icon="di-icon-job-history">
      <div class="action-bar d-flex ml-auto">
        <SearchInput class="search-input" :timeBound="400" hint-text="Search history" @onTextChanged="handleKeywordChange" />
        <di-button id="refresh" class="ml-1" title="Refresh" @click="handleRefresh">
          <i class="di-icon-reset" />
        </di-button>
      </div>
    </LayoutHeader>
    <div class="layout-content-panel">
      <div class="job-divider"></div>
      <LayoutNoData v-if="isLoaded && isEmptyData" icon="di-icon-job-history">
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
        :status="listJobStatus"
        :total="totalQuery"
        padding-pagination="40"
        class="flex-grow-1 flex-shrink-1"
        @onClickRow="handleClickJobHistory"
        @onPageChange="handlePageChange"
        @onRetry="loadJobs"
        @onSortChanged="handleSortChange"
      >
        <template #empty>
          <EmptyDirectory class="h-100" />
        </template>
      </DiTable2>
    </div>
  </LayoutContent>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { CustomCell, HeaderData, Pagination, RowData } from '@/shared/models';
import DataSourceSelectionModal from '@/screens/data-ingestion/components/DataSourceSelectionModal.vue';
import { DefaultPaging, Routers, Status } from '@/shared';
import { Log } from '@core/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { DIException, SortDirection } from '@core/common/domain';
import { DateTimeFormatter, ListUtils } from '@/utils';
import DataIngestionTable from '@/screens/data-ingestion/components/DataIngestionTable.vue';
import JobConfigModal from '@/screens/data-ingestion/components/JobConfigModal.vue';
import { LakeJobModule } from '@/screens/lake-house/views/job/store/LakeJobStore';
import JobHistoryIcon from '@/shared/components/Icon/JobHistoryIcon.vue';
import { RouterUtils } from '@/utils/RouterUtils';
import { LakeStatusCell } from '@/shared/components/common/di-table/custom-cell/LakeStatusCell';
import { LakeJobHistory } from '@core/lake-house/domain/lake-job/LakeJobHistory';
import { StringUtils } from '@/utils/StringUtils';
import { SortRequest } from '@core/data-ingestion';
import * as $ from 'jquery';
import { LayoutContent, LayoutHeader, LayoutNoData } from '@/shared/components/layout-wrapper';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: { JobHistoryIcon, JobConfigModal, DataIngestionTable, DataSourceSelectionModal, LayoutContent, LayoutHeader, LayoutNoData, DiTable2 }
})
export default class LakeJobHistoryListing extends Vue {
  @Ref()
  private jobTable?: DiTable2;

  private from = 0;
  private size = DefaultPaging.DefaultPageSize;
  private sortName = 'id';
  private defaultSortDisplayName = 'Job Id';
  private sortMode: SortDirection = SortDirection.Desc;
  private listJobStatus: Status = Status.Loading;
  private tableErrorMessage = '';
  private searchValue = '';

  private get headers(): HeaderData[] {
    return [
      {
        key: 'id',
        label: 'Job Id',
        customRenderBodyCell: new CustomCell(rowData => {
          const jobHistory = LakeJobHistory.fromObject(rowData);
          const data = jobHistory.runId.toString();
          return HtmlElementRenderUtils.renderText(data, 'span', 'job-name text-truncate');
        }),
        // disableSort: true,
        width: 100
      },
      {
        key: 'jobName',
        label: 'Job Name',
        customRenderBodyCell: new CustomCell(rowData => {
          const jobHistory = LakeJobHistory.fromObject(rowData);
          const data = jobHistory.jobName;
          return HtmlElementRenderUtils.renderText(data, 'span', 'job-name text-truncate');
        })
      },

      // {
      //   key: 'jobId',
      //   label: 'Job Id',
      //   customRenderBodyCell: new CustomCell(rowData => {
      //     const jobHistory = LakeJobHistory.fromObject(rowData);
      //     const data = jobHistory.jobId.toString();
      //     return HtmlElementRenderUtils.renderText(data, 'span', 'job-name text-truncate');
      //   }),
      //   disableSort: true
      // },
      {
        key: 'updatedTime',
        label: 'Last Modified',
        customRenderBodyCell: new CustomCell(rowData => {
          const jobHistory = LakeJobHistory.fromObject(rowData);
          const updatedTime = jobHistory.updatedTime;
          const data = DateTimeFormatter.formatAsMMMDDYYYHHmmss(updatedTime);
          return HtmlElementRenderUtils.renderText(data);
        }),
        width: 200
      },
      {
        key: 'totalRunTime',
        label: 'Total Run Time',
        customRenderBodyCell: new CustomCell(rowData => {
          const jobHistory = LakeJobHistory.fromObject(rowData);
          const data = DateTimeFormatter.formatAsHms(jobHistory.totalRuntime);
          return HtmlElementRenderUtils.renderText(data);
        }),
        disableSort: true,
        width: 140
      },
      {
        key: 'jobStatus',
        label: 'Status',
        customRenderBodyCell: new LakeStatusCell('jobStatus'),
        width: 140
      },
      {
        key: 'details',
        label: 'Details',
        disableSort: true,
        customRenderBodyCell: new CustomCell(rowData => {
          const { runId, jobId, logPath, message } = rowData;
          const displayMessage = rowData.message && StringUtils.isNotEmpty(rowData.message) ? message : '--';
          const collapseId = `collapse-${runId}`;
          const detailContainerId = `details-${runId}`;
          const pathId = `path-${runId}`;
          const historyId = `history-${runId}`;

          const path = logPath
            ? `
          <div class="d-flex flex-row">
                    <div class="job-name mr-1">Log Path: </div>
                    <p style="width: 100%;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;">
                      <a id="${pathId}" href="#" >${logPath}</a>
                    </p>
                  </div>
          `
            : ``;
          const ele = `
            <div class="py-2 align-items-center history-details-container" id="${detailContainerId}">
               <p class="mb-0 title unselectable">
                 History Details
                </p>
                <div class="collapse mt-2" id="${collapseId}">
                  <div class="d-flex flex-row">
                    <div class="job-name mr-1">Job ID:</div>
                    <p style="width: 100%;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;">
                      <a id="${historyId}" href="#">${jobId}</a>
                    </p>
                  </div>
                  ${path}
                  <div class="text-truncate" style="white-space: normal"><span class="job-name">Message:</span> ${displayMessage}</div>
                </div>
            </div>
          `;
          const element = HtmlElementRenderUtils.renderHtmlAsElement(ele);
          HtmlElementRenderUtils.addClickEvent(element, `#${detailContainerId}`, event => {
            event.stopPropagation();
            //@ts-ignored
            $(`#${collapseId}`).collapse('toggle');
          });

          HtmlElementRenderUtils.addClickEvent(element, `#${pathId}`, () => this.viewFile(logPath));
          HtmlElementRenderUtils.addClickEvent(element, `#${historyId}`, () => this.viewJobDetail(runId));
          return element;
        })
      }
    ];
  }

  private get records(): RowData[] {
    return (LakeJobModule.jobHistories as any) as RowData[];
  }

  private get totalQuery(): number {
    return LakeJobModule.totalHistories;
  }

  private get isLoaded() {
    return this.listJobStatus === Status.Loaded;
  }

  private showLoading() {
    this.listJobStatus = Status.Loading;
  }

  private get isEmptyData(): boolean {
    return ListUtils.isEmpty(this.records);
    // return true;
  }

  @Track(TrackEvents.LakeJobHistoryView)
  async created() {
    await this.loadJobs();
    this.jobTable?.setSort(this.defaultSortDisplayName, this.sortMode);
  }

  private async loadJobs() {
    try {
      this.showLoading();
      await this.reloadJobs();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('JobScreen::loadJobs::exception::', exception.message);
      throw new DIException(exception.message);
    }
  }

  @Track(TrackEvents.LakeJobHistoryRefresh)
  private async handleRefresh() {
    try {
      this.showUpdating();
      await this.reloadJobs();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('JobScreen::handleRefresh::exception::', exception.message);
    }
  }

  private async reloadJobs() {
    await LakeJobModule.loadHistories({
      from: this.from,
      size: this.size,
      sorts: [new SortRequest(this.sortName, this.sortMode)],
      keyword: this.searchValue
    });
  }

  private showUpdating() {
    this.listJobStatus = Status.Updating;
  }

  private showLoaded() {
    this.listJobStatus = Status.Loaded;
  }

  private showError(message: string) {
    this.listJobStatus = Status.Error;
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
      this.sortMode = this.sortMode === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc;
    } else {
      this.sortMode = SortDirection.Asc;
    }
  }

  private async handlePageChange(pagination: Pagination) {
    try {
      this.showUpdating();
      this.from = (pagination.page - 1) * pagination.rowsPerPage;
      this.size = pagination.rowsPerPage;
      await this.reloadJobs();
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
      await this.reloadJobs();
      this.showLoaded();
    } catch (e) {
      Log.error('LakeJob:: handleSortChange::', e);
      this.showError(e.message);
    }
  }

  private async handleKeywordChange(newKeyword: string) {
    try {
      this.searchValue = newKeyword;
      this.from = 0;
      this.showLoading();
      await this.reloadJobs();
      this.showLoaded();
    } catch (e) {
      Log.error('LakeQueryInfo:: handleSortChange::', e);
      this.showError(e.message);
    }
  }

  private handleClickJobHistory(history: LakeJobHistory) {
    try {
      if (history.logPath) {
        this.viewFile(history.logPath);
      }
    } catch (ex) {
      Log.error('LakeJobHistory', 'handleClickJobHistory', ex);
      this.showError(ex.message);
    }
  }

  @Track(TrackEvents.LakeJobHistoryViewLogPath, { path: (_: LakeJobHistoryListing, args: any) => args[0] })
  private viewFile(path: string): void {
    const absolutePath = RouterUtils.getAbsolutePath(path);
    RouterUtils.to(Routers.LakeExplorer, { query: { path: absolutePath } });
  }

  private viewJobDetail(id: string): void {
    // const absolutePath = RouterUtils.getAbsolutePath(id);
    // RouterUtils.to(Routers.LakeQueryBuilder, { query: { id: absolutePath } });
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
      > #refresh {
        //padding: 0;
        margin-bottom: 0;
        margin-top: 3px;
        //i {
        //  margin-bottom: 3px !important;
        //}

        &.hide {
          display: none !important;
        }

        //&:hover,
        //&:active {
        //  background: unset !important;
        //}
        @media screen and (max-width: 800px) {
          .title {
            display: none;
          }
        }
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

  > .job-table {
    background-color: var(--directory-row-bg);
    flex: 1;
  }

  .history-details-container {
    .title {
      color: var(--accent);

      &:hover,
      &:active {
        cursor: pointer;
        opacity: 0.8;
      }
    }
  }
}
</style>
