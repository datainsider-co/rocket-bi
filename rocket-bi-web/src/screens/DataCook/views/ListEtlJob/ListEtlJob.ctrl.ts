import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { LIST_ETL_JOB_TYPE } from './ListEtlTypes';
import { CustomCell, HeaderData, Pagination, RowData } from '@/shared/models';
import { DateTimeCell, IconActionCell, UserAvatarCell } from '@/shared/components/Common/DiTable/CustomCell';
import { ContextMenuItem, DefaultPaging, Routers, Status } from '@/shared';
import { Inject } from 'typescript-ioc';
import { DataCookService, EtlJobInfo, GetListEtlRequest } from '@core/DataCook';
import { Log } from '@core/utils';
import { EtlJobNameCell } from '@/shared/components/Common/DiTable/CustomCell/EtlJobNameCell';
import Swal from 'sweetalert2';
import { DataCookEvent } from '@/screens/DataCook/views/DataCook.vue';
import throttle from 'lodash/throttle';
import NProgress from 'nprogress';
import { StringUtils } from '@/utils/string.utils';
import { DIException, Sort, SortDirection } from '@core/domain';
import { ETLJobActionCell } from '@/screens/DataCook/views/ListEtlJob/ETLJobActionCell';
import { PopupUtils } from '@/utils/popup.utils';
import { ForceMode } from '@core/LakeHouse/Domain/LakeJob/ForceMode';
import ForceRunSettingModal from '@/shared/components/ForceRunSettingModal.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { DateTimeFormatter } from '@/utils';
import { LayoutContent, LayoutHeader, LayoutNoData } from '@/shared/components/LayoutWrapper';
import DiTable2 from '@/shared/components/Common/DiTable/DiTable2.vue';
import { RouterUtils } from '@/utils/RouterUtils';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

const TABLE_ROW_HEIGHT = 48;
const TABLE_ROW_OFFSET = 10;
const FIRST_TIME_SIZE = 100;
NProgress.configure({ easing: 'ease', speed: 500, showSpinner: false, parent: '#list-etl-body-container' });

@Component({
  components: {
    ForceRunSettingModal,
    LayoutContent,
    LayoutHeader,
    LayoutNoData,
    DiTable2
  }
})
export default class ListEtlJob extends Vue {
  private readonly trackEvents = TrackEvents;
  private listIgnoreClassForContextMenu = ['action-more'];

  @Prop({ type: String, default: LIST_ETL_JOB_TYPE.MyEtl })
  private type!: LIST_ETL_JOB_TYPE;

  @Inject
  private dataCookService!: DataCookService;

  @Ref()
  private readonly tableContainer?: HTMLDivElement;

  @Ref()
  private readonly bodyContainer?: HTMLDivElement;

  @Ref()
  private readonly forceRunSettingModal!: ForceRunSettingModal;

  @Ref()
  private readonly diContextMenu!: ContextMenu;

  private loading = false;
  private keyword = '';
  private errorMsg = '';
  private data = { total: 0, items: [] as EtlJobInfo[] };
  private pagination: Pagination = new Pagination({ page: 1, rowsPerPage: DefaultPaging.DefaultPageSize });
  private createEtlJobRoute = { name: Routers.CreateEtl };
  private sortBy = '';
  private sortDirection = SortDirection.Desc;

  private get isMyEtlView() {
    return this.type === LIST_ETL_JOB_TYPE.MyEtl;
  }

  private get tableStatus() {
    if (this.pagination.page === 1) {
      return this.loading ? Status.Updating : Status.Loaded;
    }
    return Status.Loaded;
  }

  private get title() {
    switch (this.type) {
      case LIST_ETL_JOB_TYPE.SharedEtl:
        return 'Share With Me';
      case LIST_ETL_JOB_TYPE.ArchivedEtl:
        return 'Trash';
      case LIST_ETL_JOB_TYPE.MyEtl:
      default:
        return 'My ETL';
    }
  }

  private get iconClass() {
    switch (this.type) {
      case LIST_ETL_JOB_TYPE.SharedEtl:
        return 'di-icon-share-with-me';
      case LIST_ETL_JOB_TYPE.ArchivedEtl:
        return 'di-icon-delete';
      case LIST_ETL_JOB_TYPE.MyEtl:
      default:
        return 'di-icon-etl-home';
    }
  }

  private get searchFunc() {
    switch (this.type) {
      case LIST_ETL_JOB_TYPE.SharedEtl:
        return this.dataCookService?.getListSharedEtl.bind(this.dataCookService);
      case LIST_ETL_JOB_TYPE.ArchivedEtl:
        return this.dataCookService?.getListArchivedEtl.bind(this.dataCookService);
      case LIST_ETL_JOB_TYPE.MyEtl:
      default:
        return this.dataCookService?.getListMyEtl.bind(this.dataCookService);
    }
  }

  private get deleteFunc() {
    switch (this.type) {
      case LIST_ETL_JOB_TYPE.ArchivedEtl:
        return this.dataCookService?.hardDeleteEtl.bind(this.dataCookService);
      case LIST_ETL_JOB_TYPE.SharedEtl:
      case LIST_ETL_JOB_TYPE.MyEtl:
      default:
        return this.dataCookService?.archiveEtl.bind(this.dataCookService);
    }
  }

  private get headers(): HeaderData[] {
    return [
      {
        key: 'displayName',
        label: 'Name',
        customRenderBodyCell: new EtlJobNameCell()
      },
      {
        key: 'owner',
        label: 'Owner',
        // width: 180,
        disableSort: true,
        customRenderBodyCell: new UserAvatarCell('owner.avatar', ['owner.fullName', 'owner.lastName', 'owner.email', 'owner.username'])
      },
      {
        key: 'createdTime',
        label: 'Created Time',
        // width: 140,
        customRenderBodyCell: new DateTimeCell()
      },
      {
        key: 'status',
        label: 'Last Run',
        disableSort: true,
        customRenderBodyCell: new CustomCell(rowData => {
          const job = EtlJobInfo.fromObject(rowData);
          const time = job.lastExecuteTime;
          const imgSrc = job.lastRunStatusIcon;
          const elements = job.wasRun
            ? [HtmlElementRenderUtils.renderImg(imgSrc), HtmlElementRenderUtils.renderText(DateTimeFormatter.formatAsMMMDDYYYHHmmss(time), 'span')]
            : '--';
          const div = document.createElement('div');
          div.append(...elements);
          div.classList.add('custom-status-cell');
          return div;
        })
      },
      {
        key: 'scheduleTime',
        label: 'Next Run',
        disableSort: true,
        customRenderBodyCell: new CustomCell(rowData => {
          const job = EtlJobInfo.fromObject(rowData);
          const data = this.type !== LIST_ETL_JOB_TYPE.ArchivedEtl && job.hasNextRunTime ? DateTimeFormatter.formatAsMMMDDYYYHHmmss(job.nextExecuteTime) : '--';
          return HtmlElementRenderUtils.renderText(data, 'div', '');
        })
      },
      {
        key: 'action',
        label: 'Action',
        width: 150,
        disableSort: true,
        customRenderBodyCell:
          this.type === LIST_ETL_JOB_TYPE.ArchivedEtl
            ? this.getTrashActions()
            : new ETLJobActionCell({
                onEnable: this.handleClickForceRun,
                onDisable: this.handleCancel,
                onAction: this.showActionMenu
              })
      }
    ];
  }

  @Track(TrackEvents.ETLForceRun, {
    etl_id: (_: ListEtlJob, args: any) => args[1].id,
    etl_name: (_: ListEtlJob, args: any) => args[1]?.displayName
  })
  handleClickForceRun(event: Event, etlJobInfo: EtlJobInfo) {
    event.stopPropagation();
    this.forceRunSettingModal.show(etlJobInfo);
  }

  @Track(TrackEvents.ETLSubmitForceRun, {
    etl_id: (_: ListEtlJob, args: any) => args[0].id,
    etl_name: (_: ListEtlJob, args: any) => args[0]?.displayName,
    date: (_: ListEtlJob, args: any) => args[1]?.getTime()
  })
  private async handleForceRunByDate(job: EtlJobInfo, date: Date) {
    try {
      Log.debug('ETL Force run:: job', job, date.getTime());
      Log.debug('ETL Force run:: Force run starting.....');
      this.forceRunSettingModal.showLoading();
      const isSuccess = await this.dataCookService.forceRun(job.id, date.getTime(), ForceMode.Continuous);
      if (isSuccess) {
        PopupUtils.showSuccess('Force run successfully.');
        await this.search(this.pagination);
        Log.debug('ETL Force run:: Force run successfully!', isSuccess);
      } else {
        PopupUtils.showError('Force run failed.');
        Log.error('ETL Force run:: Force run failed!', job, date);
      }
      this.forceRunSettingModal.hideLoading();
    } catch (e) {
      Log.error('ETL Force run::unknown:: Force run failed!', job, date);
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
    } finally {
      this.forceRunSettingModal.hide();
      this.loading = false;
    }
  }

  @Track(TrackEvents.ETLCancel, {
    etl_id: (_: ListEtlJob, args: any) => args[1].id,
    etl_name: (_: ListEtlJob, args: any) => args[1]?.displayName
  })
  private async handleCancel(event: Event, etlJobInfo: EtlJobInfo) {
    try {
      Log.debug('ETL Job::', etlJobInfo);
      Log.debug('ETL Job:: Cancel starting.....');
      event.stopPropagation();
      const isSuccess = await this.dataCookService.cancel(etlJobInfo.id);
      if (isSuccess) {
        PopupUtils.showSuccess('Cancel successfully.');
        await this.search(this.pagination);
        Log.debug('ETL Job:: Cancel successfully!', isSuccess);
      } else {
        PopupUtils.showError('Cancel failed.');
        Log.error('ETL Job:: Cancel failed!', etlJobInfo);
      }
    } catch (e) {
      Log.error('ETL Job::unknown:: Cancel failed!', e, etlJobInfo);
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
    } finally {
      this.loading = false;
    }
  }

  showActionMenu(event: Event, etlJobInfo: EtlJobInfo, targetId: string) {
    try {
      event.stopPropagation();
      PopupUtils.hideAllPopup();
      const items: ContextMenuItem[] = this.getActionMoreMenuItem(event, etlJobInfo);
      // todo: popup wrong position,, ping @Hao
      const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(event, targetId, 24, 8);
      this.diContextMenu?.show(buttonEvent, items);
    } catch (ex) {
      Log.error(ex);
    }
  }

  private getActionMoreMenuItem(event: Event, etlJobInfo: EtlJobInfo): ContextMenuItem[] {
    return [
      {
        text: 'Edit',
        click: () => {
          this.diContextMenu?.hide();
          event.stopPropagation();
          this.editEtlJob((etlJobInfo as any) as RowData);
        }
      },
      {
        text: 'Share',
        click: () => {
          this.diContextMenu?.hide();
          event.stopPropagation();
          this.shareEtlJob((etlJobInfo as any) as RowData);
        }
      },
      {
        text: 'Delete',
        click: () => {
          this.diContextMenu?.hide();
          event.stopPropagation();
          this.archiveEtlJob((etlJobInfo as any) as RowData);
        }
      }
    ];
  }

  private getTrashActions() {
    return new IconActionCell([
      {
        icon: 'di-icon-restore',
        click: (row: RowData) => {
          this.restoreEtlJob(row);
        }
      },
      {
        icon: 'di-icon-delete',
        click: (row: RowData) => {
          this.archiveEtlJob(row);
        }
      }
    ]);
  }

  private trackETLView(routeName: Routers) {
    switch (routeName) {
      case Routers.SharedEtl:
        TrackingUtils.track(TrackEvents.SharedETLView, {});
        break;
      case Routers.ArchivedEtl:
        TrackingUtils.track(TrackEvents.TrashETLView, {});
        break;
      default:
        TrackingUtils.track(TrackEvents.MyETLView, {});
    }
  }

  created() {
    this.initData();
    this.trackETLView(this.$route.name as Routers);
  }

  private async initData() {
    this.$nextTick(async () => {
      this.pagination.page = 1;
      const initSize = Math.ceil(window.$(this.bodyContainer).height() / TABLE_ROW_HEIGHT + TABLE_ROW_OFFSET);
      Log.info('initSize', initSize);
      this.pagination.rowsPerPage = Math.max(FIRST_TIME_SIZE, initSize);
      await this.search(this.pagination);
      this.pagination.rowsPerPage = DefaultPaging.DefaultPageSize;
    });
  }

  private onClickRow(item: RowData) {
    if (this.type !== LIST_ETL_JOB_TYPE.ArchivedEtl) {
      this.editEtlJob(item);
    }
  }

  @Track(TrackEvents.ETLViewDetail, {
    etl_id: (_: ListEtlJob, args: any) => args[0].id,
    etl_name: (_: ListEtlJob, args: any) => args[0]?.displayName
  })
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
    const etl: EtlJobInfo = (item as any) as EtlJobInfo;
    this.$root.$emit(DataCookEvent.ShowShareModal, etl);
  }

  private archiveEtlJob(item: RowData) {
    const temp = (item as unknown) as EtlJobInfo;
    Swal.fire({
      icon: 'question',
      title: 'Delete ETL',
      html: `Are you sure to delete <strong>${temp.displayName}</strong>?`,
      showLoaderOnConfirm: true,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      preConfirm: isConfirm => {
        if (isConfirm) {
          TrackingUtils.track(TrackEvents.ETLDelete, { etl_id: item.id, etl_name: item?.displayName });
          return this.deleteFunc(temp.id)
            .then(resp => {
              this.retry();
            })
            .catch(e => {
              Swal.fire({
                icon: 'error',
                title: 'Delete ETL Fail',
                html: e.message
              });
            });
        }
      }
    });
    return item;
  }

  private restoreEtlJob(item: RowData) {
    const temp = (item as unknown) as EtlJobInfo;
    Swal.fire({
      icon: 'question',
      title: 'Restore ETL',
      html: `Are you sure to restore <strong>${temp.displayName}</strong>?`,
      showLoaderOnConfirm: true,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      preConfirm: isConfirm => {
        if (isConfirm) {
          TrackingUtils.track(TrackEvents.ETLRestore, { etl_id: temp.id, etl_name: temp.displayName });
          return this.dataCookService
            .restoreEtl(temp.id)
            .then(resp => {
              this.retry();
            })
            .catch(e => {
              Swal.fire({
                icon: 'error',
                title: 'Restore ETL Fail',
                html: e.message
              });
            });
        }
      }
    });
    return item;
  }

  private getSearchRequest(page: Pagination) {
    const sorts = [];
    if (this.sortBy) {
      sorts.push(new Sort({ field: this.sortBy, order: this.sortDirection }));
    }
    return new GetListEtlRequest(this.keyword, page.from, page.size, sorts);
  }

  private async retry() {
    this.pagination.page = 1;
    this.pagination.rowsPerPage = Math.max(this.data.items.length, DefaultPaging.DefaultPageSize);
    await this.search(this.pagination);
    this.pagination.rowsPerPage = DefaultPaging.DefaultPageSize;
  }

  private onPageChange(page: Pagination) {
    this.search(page);
  }

  private async search(page: Pagination) {
    if (this.loading) return;
    this.loading = true;
    const isFirstLoad = page.page === 1;
    if (!isFirstLoad) {
      NProgress.start();
    }
    await this.searchFunc(this.getSearchRequest(page))
      .then(resp => {
        if (isFirstLoad) {
          this.data.items = resp.data;
        } else {
          this.data.items = this.data.items.concat(resp.data);
        }
        this.data.total = resp.total;
        Log.info(resp);
        Log.info(this.data);
        this.errorMsg = '';
        // this.loading = false;
        this.loading = false;
        // if (isFirstLoad) {
        // } else {
        //   setTimeout(() => {
        //     this.loading = false;
        //   }, 1000);
        // }
      })
      .catch(e => {
        this.data.items = [];
        this.data.total = 0;
        this.errorMsg = e.message;
        this.loading = false;
      })
      .then(() => {
        if (!isFirstLoad) {
          NProgress.done();
        }
      });
  }

  // private getMaxHeight() {
  //   return this.tableContainer?.clientHeight ?? 700;
  // }

  private handleTableScrollEnd = throttle(() => {
    if (this.data.items.length < this.data.total) {
      this.pagination.page += 1;
      this.search(this.pagination);
    }
  }, 1000).bind(this);

  private handleKeywordChange(newKeyword: string) {
    this.keyword = newKeyword;
    this.initData();
  }

  private handleSortChanged(header: HeaderData) {
    const field = StringUtils.toSnakeCase(header.key);
    Log.info('handleSortChanged', header);
    this.sortDirection = this.getCurrentSortDirection(field);
    this.sortBy = field;
    Log.info('handleSortChanged', this.sortBy, this.sortDirection);
    this.initData();
  }

  private getCurrentSortDirection(field: string) {
    const currentSortDirection = this.sortBy === field ? this.sortDirection : SortDirection.Desc;
    switch (currentSortDirection) {
      case SortDirection.Desc:
        return SortDirection.Asc;
      case SortDirection.Asc:
        return SortDirection.Desc;
    }
  }

  @Watch('type')
  private onChangeType() {
    this.keyword = '';
    this.loading = false;
    this.data.total = 0;
    this.data.items = [];
    this.initData();
  }
}
