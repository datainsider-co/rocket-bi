import { Component, Ref, Vue } from 'vue-property-decorator';
import { CustomCell, HeaderData, Pagination, RowData } from '@/shared/models';
import { DateTimeCell } from '@/shared/components/common/di-table/custom-cell';
import { DefaultPaging, Routers, Status } from '@/shared';
import { Inject } from 'typescript-ioc';
import { DataCookService, EtlJobInfo, EtlJobStatus, GetListEtlRequest } from '@core/data-cook';
import { Log } from '@core/utils';
import { EtlJobHistory } from '@core/data-cook/domain/etl/EtlJobHistory';
import { StatusCell } from '@/shared/components/common/di-table/custom-cell/StatusCell';
import { SortDirection } from '@core/common/domain';
import { SortRequest } from '@core/data-ingestion';
import { StringUtils } from '@/utils/StringUtils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { DateTimeUtils } from '@/utils';
import { LayoutContent, LayoutHeader, LayoutNoData } from '@/shared/components/layout-wrapper';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { RouterUtils } from '@/utils/RouterUtils';

@Component({
  components: {
    LayoutContent,
    LayoutHeader,
    LayoutNoData,
    DiTable2
  }
})
export default class EtlHistory extends Vue {
  @Inject
  private dataCookService!: DataCookService;

  private loading = true;
  private errorMsg = '';
  private data = { total: 0, items: [] as EtlJobHistory[] };
  private searchValue = '';
  private sortName = 'id';
  private sortMode: SortDirection = SortDirection.Desc;
  private pagination: Pagination = new Pagination({ page: 1, rowsPerPage: DefaultPaging.DefaultPageSize });

  @Ref()
  private readonly tableContainer?: HTMLDivElement;

  @Ref()
  etlHistoryTable?: DiTable2;

  private get tableStatus() {
    return this.loading ? Status.Updating : Status.Loaded;
  }

  private get headers(): HeaderData[] {
    return [
      {
        key: 'id',
        label: 'History Id',
        width: 100,
        isGroupBy: true
        // customRenderBodyCell: new EtlJobNameCell()
      },
      {
        key: 'name',
        label: 'ETL Name',
        disableSort: true,
        customRenderBodyCell: new CustomCell(rowData => {
          const jobName = EtlJobHistory.fromObject((rowData as any) as EtlJobHistory).etlInfo?.displayName ?? '--';
          return HtmlElementRenderUtils.renderText(jobName && StringUtils.isNotEmpty(jobName) ? jobName : '--', 'div', 'text-truncate');
        }),
        isGroupBy: true
      },
      {
        key: 'updatedTime',
        label: 'Last Run',
        width: 170,
        customRenderBodyCell: new DateTimeCell()
      },
      {
        key: 'totalExecutionTime',
        label: 'Total Run Time',
        width: 130,
        customRenderBodyCell: new CustomCell(rowData => {
          const totalTime = rowData.totalExecutionTime;
          return DateTimeUtils.formatAsHms(totalTime ?? 0);
        })
        // customRenderBodyCell: new TimeCell()
      },
      {
        key: 'status',
        label: 'Status',
        width: 140,
        customRenderBodyCell: new StatusCell('status', status => EtlJobInfo.getIconFromStatus(status as EtlJobStatus))
      },
      {
        key: 'message',
        label: 'Message'
        // customRenderBodyCell: new TimeCell()
      }
    ];
  }

  private async mounted() {
    Log.info('this.dataCookService', this.dataCookService);
    await this.search(this.pagination);
    this.etlHistoryTable?.setSort('History Id', this.sortMode);
  }

  private createEtlJob() {
    const i = 1;
    return i;
  }

  private editEtlJob(item: RowData) {
    this.$router.push({
      name: Routers.UpdateEtl,
      params: {
        name: RouterUtils.buildParamPath(item.id, item.displayName)
      }
    });
    return item;
  }

  private shareEtlJob(item: RowData) {
    return item;
  }

  private getSearchRequest(page: Pagination) {
    // page.from, page.size
    // public keyword: string, public from: number, public size: number, public sorts: string[] = []
    return new GetListEtlRequest(this.searchValue, page.from, page.size, [new SortRequest(this.sortName, this.sortMode)]);
  }

  private retry() {
    this.pagination.page = 1;
    this.search(this.pagination);
  }

  private onPageChange(page: Pagination) {
    this.search(page);
  }

  private async search(page: Pagination) {
    this.loading = true;
    await this.dataCookService
      .getListEtlHistory(this.getSearchRequest(page))
      .then(resp => {
        this.data.items = resp.data;
        this.data.total = resp.total;
        Log.info(resp);
        Log.info(this.data);
        this.errorMsg = '';
        this.loading = false;
      })
      .catch(e => {
        this.data.items = [];
        this.data.total = 0;
        this.errorMsg = e.message;
        this.loading = false;
      });
  }

  private async handleKeywordChange(keyword: string) {
    this.searchValue = keyword;
    this.pagination.page = 1;
    await this.search(this.pagination);
  }

  private async handleSortChange(column: HeaderData) {
    try {
      Log.debug('handleSortChange::', this.sortName, this.sortMode);
      this.updateSortMode(column);
      this.updateSortColumn(column);
      await this.search(this.pagination);
    } catch (e) {
      Log.error('EtlHistory:: handleSortChange::', e);
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
