import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { DataSourceInfo, Job, JobHistory, JobHistoryService, JobStatus, ListingJobHistoryRequest, ListingResponse, SortRequest } from '@core/data-ingestion';
import { Inject } from 'typescript-ioc';
import { CustomCell, HeaderData } from '@/shared/models';
import { Log } from '@core/utils';
import { DIException, ListingRequest, SortDirection } from '@core/common/domain';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { StatusCell } from '@/shared/components/common/di-table/custom-cell/StatusCell';

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.JobHistoryStore })
class JobHistoryStore extends VuexModule {
  jobHistoryList: JobHistory[] = [];
  totalRecord = 0;
  private readonly cellWidth = 170;

  @Inject
  private readonly jobHistoryService!: JobHistoryService;

  get jobHistoryHeaders(): HeaderData[] {
    return [
      {
        key: 'id',
        label: 'Sync Id',
        customRenderBodyCell: new CustomCell(rowData => {
          const data = JobHistory.fromObject(rowData).syncId.toString();
          return HtmlElementRenderUtils.renderText(data, 'span', 'sync-id');
        }),
        width: this.cellWidth / 2
      },
      {
        key: 'jobName',
        label: 'Job Name',
        isGroupBy: true
      },
      {
        key: 'lastSyncTime',
        label: 'Last Sync Time',
        width: this.cellWidth
      },
      {
        key: 'totalSyncTime',
        label: 'Total Synced Time',
        width: this.cellWidth
      },
      {
        key: 'syncStatus',
        label: 'Status',
        customRenderBodyCell: new StatusCell('syncStatus', status => StatusCell.jobStatusImg(status as JobStatus)),
        width: (this.cellWidth * 2) / 3
      },
      {
        key: 'message',
        label: 'Message',
        disableSort: true,
        width: (this.cellWidth * 3) / 2
      },
      {
        key: 'totalInsertedRows',
        label: 'Total Inserted Rows',
        width: this.cellWidth,
        disabledFormatBodyCell: true
      }
    ];
  }

  @Action
  loadJobHistoryList(payload: { from: number; size: number; keyword: string; sorts: SortRequest[] }) {
    const request = new ListingRequest(payload.keyword, payload.from, payload.size, payload.sorts);
    return this.jobHistoryService
      .list(request)
      .then(response => {
        this.setJobHistoryList(response);
      })
      .catch(e => {
        const exception = DIException.fromObject(e);
        Log.error('JobHistoryStore::loadJobHistoryList::exception::', exception.message);
        throw new DIException(exception.message);
      });
  }

  @Mutation
  setJobHistoryList(response: ListingResponse<JobHistory>) {
    this.jobHistoryList = response.data;
    this.totalRecord = response.total;
  }
}
export const JobHistoryModule: JobHistoryStore = getModule(JobHistoryStore);
