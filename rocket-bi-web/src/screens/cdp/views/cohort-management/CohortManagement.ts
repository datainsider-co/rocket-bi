import { Component, Ref, Vue } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { DefaultPaging, Status } from '@/shared';
import { CustomCell, CustomHeader, HeaderData, Pagination, RowData } from '@/shared/models';
import { DateCell, IconActionCell, UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';
import CDPMixin from '@/screens/cdp/views/CDPMixin';
import ManageCohort from '@/screens/cdp/components/manage-cohort/ManageCohort.vue';
import { CohortInfo, CohortService } from '@core/cdp';
import { Inject } from 'typescript-ioc';
import Swal from 'sweetalert2';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import cloneDeep from 'lodash/cloneDeep';
import DiTable from '@/shared/components/common/di-table/DiTable.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { CohortActionName } from '@/screens/cdp/components/cohort-filter/CohortFilter';
import LoadingComponent from '@/shared/components/LoadingComponent.vue';
import { ListUtils } from '@/utils';
import { PageResult } from '@core/common/domain';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({
  mixins: [CDPMixin],
  components: {
    ManageCohort,
    LoadingComponent,
    DiTable2
  }
})
export default class CohortManagement extends Vue {
  private readonly trackEvents = TrackEvents;
  private readonly Status = Status;
  private listIgnoreClassForContextMenu = ['di-icon-setting', 'create-directory'];
  private tableStatus = Status.Loaded;
  private errorMsg = '';
  private from = 0;
  private result: PageResult<CohortInfo> = {
    data: [],
    total: 0
  };
  selectedItems: CohortInfo[] = [];
  private pagination: Pagination = new Pagination({ page: 1, rowsPerPage: DefaultPaging.DefaultPageSize });

  @Inject
  private cdpService!: CohortService;

  @Ref()
  private manageCohort!: ManageCohort;

  @Ref()
  private table!: DiTable;

  @Ref()
  private diContextMenu!: ContextMenu;

  private get headers(): HeaderData[] {
    return [
      {
        key: 'radio',
        label: '',
        width: 40,
        disableSort: true,
        customRenderHeader: new CustomHeader(header => {
          return HtmlElementRenderUtils.renderCheckBox(this.isCheckedAll(), e => {
            this.handleCheckAll(e);
          });
        }),
        customRenderBodyCell: new CustomCell((rowData: RowData) => {
          const cohort = (rowData as unknown) as CohortInfo;
          return HtmlElementRenderUtils.renderCheckBox(this.isCheckedItem(cohort), e => {
            e.stopPropagation();
            // PopupUtils.hideAllPopup();
            // Log.debug('Radio::RowData::', rowData);
            this.toggleItem(e, cohort);
          });
        })
        // customRenderBodyCell: new RadioCell(this.handleClickCheckbox, this.handleCheckedCheckbox)
      },
      {
        key: 'name',
        label: 'Cohort Name',
        disableSort: true
      },
      // {
      //   key: 'count',
      //   label: 'Count',
      //   width: 70,
      //   disableSort: true
      // },
      {
        key: 'creator',
        label: 'Created By',
        disableSort: true,
        width: 120,
        customRenderBodyCell: new UserAvatarCell('creator.avatar', ['creator.fullName', 'creator.lastName', 'creator.email', 'creator.username'])
      },
      {
        key: 'updatedTime',
        label: 'Last Modified',
        width: 120,
        disableSort: true,
        customRenderBodyCell: new DateCell()
      },
      {
        key: 'description',
        label: 'Description',
        disableSort: true
      },
      // {
      //   key: 'yourAccess',
      //   label: 'Your Access',
      //   width: 100,
      //   disableSort: true
      // },
      {
        key: '',
        label: '',
        width: 50,
        disableSort: true,
        customRenderBodyCell: new IconActionCell([
          {
            icon: 'di-icon-three-dot',
            click: (row: RowData) => {
              this.showContextMenu((row as unknown) as CohortInfo);
            }
          }
        ])
      }
    ];
  }

  private get isShowEmptyWidget(): boolean {
    return this.tableStatus == Status.Loaded && ListUtils.isEmpty(this.result.data);
  }

  private mounted() {
    this.loadCohorts(this.pagination.from, this.pagination.size, Status.Loading);
  }

  private getContextMenuItems(item: CohortInfo) {
    return [
      {
        text: CohortActionName.ViewCustomers,
        disabled: true,
        click: () => this.showNotSupportAlert(CohortActionName.ViewCustomers)
      },
      {
        text: CohortActionName.Duplicate,
        click: () => this.duplicateCohort(item)
      },
      {
        text: CohortActionName.Share,
        disabled: true,
        click: () => this.showNotSupportAlert(CohortActionName.Share)
      },
      {
        text: CohortActionName.Delete,
        click: () => this.deleteCohortFilter(item)
      }
    ];
  }

  private exportAsCSV() {
    this.showNotSupportAlert('Export as CSV');
  }

  private showNotSupportAlert(actionName: string) {
    this.hideContextMenu();
    Swal.fire({
      icon: 'info',
      title: actionName,
      html: 'This feature is not support yet!'
    });
  }

  private showContextMenu(item: CohortInfo) {
    const items = this.getContextMenuItems(item);
    this.diContextMenu.show(event, items);
  }

  private hideContextMenu() {
    this.diContextMenu.hide();
  }

  private onPageChange(page: Pagination) {
    this.pagination.page = page.page;
    this.pagination.rowsPerPage = page.rowsPerPage;
    this.loadCohorts(this.pagination.from, this.pagination.size, Status.Updating);
  }

  private reset() {
    this.pagination.page = 1;
    this.pagination.rowsPerPage = DefaultPaging.DefaultPageSize;
    this.loadCohorts(this.pagination.from, this.pagination.size, Status.Loading);
  }

  private retry() {
    this.loadCohorts(this.pagination.from, this.pagination.size, Status.Updating);
  }

  private async loadCohorts(from: number, size: number, initStatus: Status) {
    try {
      this.tableStatus = initStatus;
      this.result = await this.cdpService.getListCohortFilter(from, size);
      this.errorMsg = '';
      this.tableStatus = Status.Loaded;
    } catch (ex) {
      this.tableStatus = Status.Error;
      this.errorMsg = ex.message ?? 'list cohort error,';
      Log.error('search error', ex);
    }
  }

  private createCohort() {
    this.manageCohort?.show(undefined);
  }

  @Track(TrackEvents.DuplicateCohort, {
    cohort_id: (_: CohortManagement, args: any) => (args[0] as CohortInfo).id,
    cohort_name: (_: CohortManagement, args: any) => (args[0] as CohortInfo).name
  })
  private duplicateCohort(item: CohortInfo) {
    this.hideContextMenu();
    const temp = cloneDeep(item);
    temp.id = undefined;
    temp.name = `Copy of ${temp.name}`;
    this.manageCohort?.show(temp);
  }

  @Track(TrackEvents.EditCohort, {
    cohort_id: (_: CohortManagement, args: any) => (args[0] as CohortInfo).id,
    cohort_name: (_: CohortManagement, args: any) => (args[0] as CohortInfo).name
  })
  private onClickRow(row: RowData) {
    this.editCohortFilter((row as unknown) as CohortInfo);
  }

  private editCohortFilter(cohortFilter: CohortInfo) {
    this.manageCohort?.show(cohortFilter);
  }

  private deleteSelected() {
    const numberSelected = this.selectedItems.length;
    if (!numberSelected) return;
    else if (numberSelected === 1) {
      this.deleteCohortFilter(this.selectedItems[0]);
      return;
    }
    Swal.fire({
      icon: 'warning',
      title: 'Delete Cohort',
      html: `Are you sure you want to delete <strong>${numberSelected} cohorts</strong>?`,
      confirmButtonText: 'Yes',
      showCancelButton: true,
      cancelButtonText: 'No',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        // this.data.items = this.data.items.filter(item => !this.selectedItems.includes(item));
        // this.data.total = this.data.items.length;
        // this.selectedItems = [];
        // this.table.reRender();
        TrackingUtils.track(TrackEvents.SubmitDeleteCohorts, {
          cohort_name: this.selectedItems.map(item => item.name).join(',')
        });
        const itemIds = this.selectedItems.filter(item => item.id !== undefined).map(item => item.id!);
        return this.cdpService
          .multiDeleteCohort(itemIds)
          .then(success => {
            if (success) {
              this.reset();
            }
          })
          .catch(e => {
            Swal.fire({
              icon: 'error',
              title: 'Delete Cohort Fail',
              html: e.message
            });
          });
      }
    });
  }

  @Track(TrackEvents.DeleteCohorts, {
    cohort_name: (_: CohortManagement, args: any) => (args[0] as CohortInfo).name
  })
  private async deleteCohortFilter(cohortFilter: CohortInfo) {
    this.hideContextMenu();
    await Swal.fire({
      icon: 'warning',
      title: 'Delete Cohort',
      html: `Are you sure you want to delete Cohort <strong>${cohortFilter.name || `ID=${cohortFilter.id}`}</strong>?`,
      confirmButtonText: 'Yes',
      showCancelButton: true,
      cancelButtonText: 'No',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        // this.data.items = this.data.items.filter(item => item !== cohortFilter);
        // this.data.total = this.data.items.length;
        // this.selectedItems = this.selectedItems.filter(item => item !== cohortFilter);
        // this.table.reRender();
        TrackingUtils.track(TrackEvents.SubmitDeleteCohorts, {
          cohort_name: this.selectedItems.map(item => item.name).join(',')
        });
        return this.cdpService
          .deleteCohortFilter(cohortFilter.id ?? 0)
          .then(success => {
            if (success) {
              this.reset();
            }
          })
          .catch(e => {
            Swal.fire({
              icon: 'error',
              title: 'Delete Cohort Fail',
              html: e.message
            });
          });
      }
    });
  }

  // isCheckedAll
  // handleCheckAll

  handleCheckAll(e: MouseEvent) {
    const isCheckedAll = this.isCheckedAll();
    if (this.isCheckedAll()) {
      // this.clearFileSelected();
      this.selectedItems = [];
    } else {
      this.selectedItems = ([] as CohortInfo[]).concat(this.result.data);
      // this.pickAllFile();
    }
    this.table.reRender();
    // if ((e.target as any).firstChild) {
    //   (e.target as any).firstChild.checked = !isCheckedAll;
    // }
    // this.selectedItems = ([] as CohortInfo[]).concat(this.data.items);
  }

  isCheckedAll() {
    return this.result.data.length === this.selectedItems.length;
  }

  isCheckedItem(cohort: CohortInfo): boolean {
    return this.selectedItems.includes(cohort);
  }

  toggleItem(e: MouseEvent, cohort: CohortInfo) {
    Log.info('toggleItem', cohort);
    const checked = this.selectedItems.includes(cohort);
    if (checked) {
      this.selectedItems = this.selectedItems.filter(i => i !== cohort);
    } else {
      this.selectedItems.push(cohort);
    }
    if ((e.target as any).firstChild) {
      (e.target as any).firstChild.checked = !checked;
    }
  }

  // handleClickCheckbox(event: MouseEvent, rowData: RowData, checked: boolean) {
  //   event.stopPropagation();
  //   event.preventDefault();
  //   Log.info({
  //     event,
  //     rowData,
  //     checked
  //   });
  //   if (!checked) {
  //     this.selectedItems = this.selectedItems.filter(i => i !== rowData);
  //   } else if (!this.selectedItems.includes(rowData)) {
  //     this.selectedItems = this.selectedItems.concat(rowData);
  //   }
  //   this.table.reRender();
  //   Log.info(this.selectedItems);
  // }
  //
  // handleCheckedCheckbox(rowData: RowData): boolean {
  //   Log.info('handleCheckedCheckbox', this.selectedItems.includes(rowData));
  //   return this.selectedItems.includes(rowData);
  // }
}
