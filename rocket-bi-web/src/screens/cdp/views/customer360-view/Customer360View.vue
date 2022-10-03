<template>
  <div class="d-flex w-100 h-100">
    <LayoutSidebar :items="navItems">
      <template v-slot:top>
        <DiShadowButton id="create-cohort" title="Create Cohort" disabled>
          <i class="di-icon-add"></i>
        </DiShadowButton>
      </template>
    </LayoutSidebar>
    <LayoutContent>
      <LayoutHeader title="Customers" icon="di-icon-cohort">
        <div class="ml-auto d-flex">
          <DiButton @click.prevent="toggleFilterGroups" id="customer-toggle-filters" :title="showFilterGroups ? 'Hide Filters' : 'Show Filters'">
            <i class="di-icon-add-filter"></i>
          </DiButton>
          <DiButton id="customer-edit-column" title="Edit Column" @click="handleEditColumn">
            <i class="di-icon-table-edit"></i>
          </DiButton>
          <DiButton id="customer-export" title="Export as CSV">
            <i class="di-icon-export"></i>
          </DiButton>
        </div>
      </LayoutHeader>
      <div class="customer-360-body">
        <div v-if="showFilterGroups" class="cdp-body-content-block customer-filter-panel">
          <div class="cdp-body-content-block-title">
            <span class="mr-auto">ALL CUSTOMERS</span>
          </div>
          <vuescroll :ops="ScrollOptions" ref="scroller">
            <div class="cdp-body-content-block-body">
              <CohortFilterComponent v-model="filterGroups" @addGroup="onAddGroup"></CohortFilterComponent>
            </div>
          </vuescroll>
        </div>
        <div class="cdp-body-content-block customer-results">
          <DiTable2
            ref="table"
            id="customer-listing-table"
            class="customer-results-table"
            totalRowTitle="customer"
            :is-show-pagination="true"
            :allowShowEmpty="false"
            :error-msg="errorMsg"
            :headers="headers"
            :records="customers"
            :total="total"
            :status="tableStatus"
            @onPageChange="onPageChanged"
            @onClickRow="onClickRow"
            @onRetry="loadData(0, 20, cohortFilter, STATUS.Loading)"
            @onSortChanged="handleSortChanged"
          >
          </DiTable2>
        </div>
      </div>
      <EditColumnModal ref="editColumnModal" @apply="handleColumnChanged"></EditColumnModal>
    </LayoutContent>
  </div>
</template>
<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import CDPMixin from '@/screens/cdp/views/CDPMixin';
import CohortFilterComponent from '@/screens/cdp/components/cohort-filter/CohortFilterComponent.vue';
import { Routers, Status, VerticalScrollConfigs } from '@/shared';
import { UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';
import { CustomerInfo, CustomerService, ListCustomerRequest } from '@core/cdp';
import { CustomCell, HeaderData, Pagination, RowData } from '@/shared/models';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { RouterUtils } from '@/utils/RouterUtils';
import { Inject } from 'typescript-ioc';
import { PageResult, UserGenders, UserProfile } from '@core/common/domain';
import { Log } from '@core/utils';
import { CohortFilter } from '@core/cdp/domain/cohort/CohortFilter';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { DateTimeFormatter, TimeoutUtils } from '@/utils';
import { FilterGroup } from '@/screens/cdp/components/cohort-filter/FilterGroup';
import { UICohortFilterUtils } from '@/screens/cdp/components/cohort-filter/Cohort2CohortFilter';
import EditColumnModal from '@/screens/cdp/components/edit-column-modal/EditColumnModal.vue';
import { EditColumnInfo } from '@/screens/cdp/components/edit-column-modal/EditColumnInfo';
import { cloneDeep, isNumber } from 'lodash';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({
  mixins: [CDPMixin],
  components: {
    StatusWidget,
    CohortFilterComponent,
    DiTable2,
    EditColumnModal
  }
})
export default class Customer360View extends Vue {
  private readonly ScrollOptions = VerticalScrollConfigs;
  private readonly DEFAULT_SELECTED_COLUMN_NAMES: string[] = ['fullName', 'gender', 'phoneNumber', 'dob', 'email'];
  private readonly DEFAULT_COLUMNS_AS_MAP: Map<string, EditColumnInfo> = new Map<string, EditColumnInfo>([
    ['id', new EditColumnInfo('id', 'ID')],
    ['fullName', new EditColumnInfo('fullName', 'Full Name')],
    ['firstName', new EditColumnInfo('firstName', 'First Name')],
    ['lastName', new EditColumnInfo('lastName', 'Last Name')],
    ['dob', new EditColumnInfo('dob', 'Birthday')],
    ['email', new EditColumnInfo('email', 'Email')],
    ['phoneNumber', new EditColumnInfo('phoneNumber', 'Phone Number')],
    ['gender', new EditColumnInfo('gender', 'Gender')]
  ]);
  private readonly DEFAULT_CUSTOM_HEADERS = new Map<string, CustomCell>([
    ['fullName', new UserAvatarCell('avatar', ['fullName'])],
    [
      'gender',
      new CustomCell(row => {
        const text: string = isNumber(row.gender) ? UserGenders.toDisplayName(row.gender) : '--';
        return HtmlElementRenderUtils.renderHtmlAsElement(text);
      })
    ],
    [
      'dob',
      new CustomCell(row => {
        const text: string = isNumber(row.dob) ? DateTimeFormatter.formatASMMMDDYYYY(row.gender) : '--';
        return HtmlElementRenderUtils.renderHtmlAsElement(text);
      })
    ]
  ]);

  // Function render properties as text
  // support one layer example object.[properties].[age]
  private PROPERTIES_HEADER = new CustomCell((row, rowIndex, header) => {
    // remove key 'properties.' in key 'properties.current.index'
    const key: string = header.key.replace(`properties.`, '');
    const properties: any = row.properties ?? {};
    const value = properties[key] ?? '--';
    return HtmlElementRenderUtils.renderHtmlAsElement(value);
  });

  private readonly STATUS = Status;

  private errorMsg = '';
  private customers: CustomerInfo[] = [];
  private tableStatus = Status.Loaded;
  private showFilterGroups = true;
  private total = 0;
  private processId: number | null = null;

  private columnsAsMap: Map<string, EditColumnInfo> = new Map<string, EditColumnInfo>();
  private selectedColumns: EditColumnInfo[] = [];

  // cohort filter luon bat dau tu 1 event
  private cohortFilter: CohortFilter | null = null;

  private readonly filterGroups: FilterGroup[] = [];

  private headers: HeaderData[] = [];

  @Inject
  private readonly customerService!: CustomerService;

  @Ref()
  private readonly table!: DiTable2;

  @Ref()
  private readonly scroller!: any;

  @Ref()
  private readonly editColumnModal!: EditColumnModal;

  mounted() {
    this.loadSelectedColumns();
    this.cohortFilter = UICohortFilterUtils.toCohortFilter(this.filterGroups);
    this.loadData(0, 20, this.cohortFilter, Status.Loading);
  }

  @Watch('filterGroups', { deep: true })
  onFilterGroupsChanged(filterGroups: FilterGroup[]) {
    TimeoutUtils.waitAndExec(
      null,
      () => {
        this.table.updateMaxHeight();
      },
      50
    );

    this.processId = TimeoutUtils.waitAndExec(
      this.processId,
      () => {
        this.cohortFilter = UICohortFilterUtils.toCohortFilter(filterGroups);
        this.loadData(0, 20, this.cohortFilter, Status.Updating);
        TrackingUtils.track(TrackEvents.Customer360FilterChange, {
          filters: JSON.stringify(this.cohortFilter)
        });
      },
      350
    );
  }

  @Watch('customers')
  private onCustomersChanged(customers: CustomerInfo[]) {
    const fieldNames: string[] = Array.from(new Set(customers.flatMap(customer => Object.keys(customer.properties))));
    const extraColumnNames: string[] = fieldNames.map(name => `properties.${name}`);
    this.columnsAsMap = this.toColumnsAsMap(extraColumnNames);
  }

  private loadSelectedColumns() {
    const selectedColumnNames = Di.get(DataManager).getSelectedColumnNames() ?? this.DEFAULT_SELECTED_COLUMN_NAMES;
    this.columnsAsMap = this.toColumnsAsMap(selectedColumnNames);
    this.selectedColumns = selectedColumnNames.map(name => this.columnsAsMap.get(name)!);
    this.headers = this.toHeaders(this.selectedColumns);
  }

  /**
   * Create map columns by column name, if column names contains default columns, method will ignore it & return default columns name
   */
  private toColumnsAsMap(columnNames: string[]): Map<string, EditColumnInfo> {
    const columnsAsMap = cloneDeep(this.DEFAULT_COLUMNS_AS_MAP);
    columnNames.forEach(columnName => {
      if (!columnsAsMap.has(columnName)) {
        columnsAsMap.set(columnName, EditColumnInfo.fromProperties(columnName));
      }
    });
    return columnsAsMap;
  }

  private async loadData(from: number, size: number, cohortFilter: CohortFilter | null, initStatus: Status) {
    try {
      this.tableStatus = initStatus;
      const request = new ListCustomerRequest(from, size, this.cohortFilter);
      const result: PageResult<CustomerInfo> = await this.customerService.list(request);
      this.customers = result.data;
      this.total = result.total;
      this.tableStatus = Status.Loaded;
    } catch (ex) {
      Log.error('initData::', ex);
      this.errorMsg = ex.message;
      this.tableStatus = Status.Error;
    }
  }

  private handleSortChanged() {
    //
  }

  private onPageChanged(page: Pagination) {
    this.loadData(page.from, page.size, this.cohortFilter, Status.Updating);
  }

  @Track(TrackEvents.SelectCustomer, {
    email: (_: Customer360View, args: any) => (args[0] as CustomerInfo).email,
    name: (_: Customer360View, args: any) => (args[0] as CustomerInfo).fullName,
    id: (_: Customer360View, args: any) => (args[0] as CustomerInfo).id
  })
  private onClickRow(item: RowData) {
    RouterUtils.to(Routers.Customer360Detail, {
      params: {
        id: item.id
      }
    });
  }

  private toggleFilterGroups() {
    this.showFilterGroups = !this.showFilterGroups;
    this.$nextTick(() => {
      this.table.updateMaxHeight();
      // this.table.reRender();
    });
  }

  private handleEditColumn() {
    this.editColumnModal.show(this.columnsAsMap, this.selectedColumns);
  }

  private async handleColumnChanged(columns: EditColumnInfo[]) {
    this.selectedColumns = columns;
    this.headers = this.toHeaders(columns);
    Di.get(DataManager).saveSelectedColumnNames(columns.map(column => column.name));
    this.$nextTick(() => {
      this.table.reRender(true);
    });
  }

  private toHeaders(selectedColumns: EditColumnInfo[]): HeaderData[] {
    return selectedColumns.map(column => {
      if (column.isPropertiesColumn) {
        return {
          key: column.name,
          label: column.prettyName,
          customRenderBodyCell: this.PROPERTIES_HEADER,
          disableSort: true
        };
      } else {
        return {
          key: column.name,
          label: column.prettyName,
          customRenderBodyCell: this.DEFAULT_CUSTOM_HEADERS.get(column.name),
          disableSort: true
        };
      }
    });
  }

  private onAddGroup() {
    this.$nextTick(() => {
      const filterGroup = this.filterGroups ?? [];
      this.scroller?.scrollIntoView(`#filter-group-${filterGroup.length - 1}`, 500);
    });
  }
}
</script>

<style lang="scss">
.customer-filter-panel {
  max-height: 50%;
  overflow: hidden;
}

.customer-360-body {
  display: flex;
  flex-direction: column;
  flex: 1;

  > .customer-results {
    display: flex;
    flex: 1;
    overflow: hidden;

    > .customer-results-table {
      flex: 1;
      width: 100%;
    }
  }
}
</style>
