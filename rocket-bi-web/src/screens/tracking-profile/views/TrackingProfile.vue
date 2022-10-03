<template>
  <div class="d-flex flex-column h-100 w-100">
    <template>
      <transition mode="out-in" name="header-fade">
        <HeaderBar :showLogout="true" />
      </transition>
    </template>
    <div ref="mainPanel" class="user-profile-container">
      <UserProfileHeader
        ref="headerPanel"
        :isHaveFilter="isHaveFilter"
        class="user-profile-header"
        @configColumnsChanged="configColumnsChanged"
        @resetFilter="handleResetFilter"
      />
      <FilterBar
        ref="filterBar"
        :filters="filters"
        class="user-profile-filter"
        @onApplyFilter="handleApplyFilter"
        @onRemoveAt="handleRemoveFilterAt"
        @onStatusChange="handleFilterStatusChange"
        @onValuesChange="handleValuesFilterChange"
      />
      <fade-transition>
        <StatusWidget class="user-profile-body position-relative" :error="errorMsg" :status="status" @retry="loadTrackingProfile">
          <UserListingBody
            :columns="headers"
            :from="from"
            :isHaveResponse="!!userProfileData"
            :maxTableHeight="maxTableHeight"
            :records="records"
            @onClickRow="handleClickRow"
          />
        </StatusWidget>
      </fade-transition>
      <UserListingFooter ref="userListingFooter" :totalRows="totalRows" class="user-profile-footer" @onPageChange="handleLoadPage" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Provide, Ref, Vue } from 'vue-property-decorator';
import { NavigationGuardNext, Route } from 'vue-router';
import { mapState } from 'vuex';
import NProgress from 'nprogress';
import { FadeTransition } from 'vue2-transitions';
import UserProfileHeader from '@/shared/components/user-listing/UserProfileHeader.vue';
import ListingFooter from '@/shared/components/user-listing/ListingFooter.vue';
import { ProfileModule } from '@/screens/tracking-profile/store/ProfileStore';
import { DataManager } from '@core/common/services';
import { Routers, Status, Stores } from '@/shared';
import { Di } from '@core/common/modules';
import FilterBar from '@/shared/components/FilterBar.vue';
import { DynamicFilter, FilterWidget, TableSchema } from '@core/common/domain/model';
import { SchemaUtils } from '@/utils/SchemaUtils';
import { CustomCell, HeaderData, IndexedHeaderData, Pagination, RowData } from '@/shared/models';
import { ListUtils } from '@/utils';
import { AbstractTableResponse } from '@core/common/domain/response/query/AbstractTableResponse';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { Log } from '@core/utils';
import UserListingBody from '@/screens/tracking-profile/components/tracking-profile/UserListingBody.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { DIException } from '@core/common/domain';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import { RouterEnteringHook } from '@/shared/components/vue-hook/RouterEnteringHook';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { RouterLeavingHook } from '@/shared/components/vue-hook/RouterLeavingHook';

NProgress.configure({ easing: 'ease', speed: 500, showSpinner: false });

@Component({
  components: {
    StatusWidget,
    FadeTransition,
    UserProfileHeader,
    FilterBar,
    UserListingBody,
    UserListingFooter: ListingFooter
  },
  computed: {
    ...mapState(Stores.profileStore, ['profileSettingInfo', 'userProfileData'])
  }
})
export default class TrackingProfile extends Vue implements RouterEnteringHook, RouterLeavingHook {
  static readonly FILTER_KEY = 'profile';
  profileSettingInfo!: TableSchema;
  userProfileData!: AbstractTableResponse;

  filters: DynamicFilter[] = [];
  private defaultImg = require('@/assets/icon/default-avatar.svg');
  private errorMsg = '';
  private status = Status.Loading;

  @Ref()
  private readonly filterBar!: FilterBar;
  @Ref()
  private readonly userListingFooter!: ListingFooter;
  @Ref()
  private readonly mainPanel!: HTMLDialogElement;
  @Ref()
  private readonly headerPanel!: UserProfileHeader;

  private maxTableHeight = 700;

  get headers(): HeaderData[] {
    if (this.userProfileData) {
      const headers: HeaderData[] = this.removeHiddenHeaders(this.allHeaders());
      return headers.map(header => {
        return {
          ...header,
          customRenderBodyCell: this.getCustomRenderBody(header)
        };
      });
    } else {
      return [];
    }
  }

  get records() {
    if (this.userProfileData) {
      return this.userProfileData.records;
    }
    return [];
  }

  get totalRows() {
    if (this.userProfileData) {
      return this.userProfileData.total;
    }
    return 0;
  }

  get isHaveFilter(): boolean {
    return ListUtils.isNotEmpty(this.filters);
  }

  private get dataManager(): DataManager {
    return Di.get(DataManager);
  }

  private get from(): number {
    return ProfileModule.currentFrom;
  }

  async beforeRouteEnter(to: Route, from: Route, next: NavigationGuardNext<any>) {
    try {
      _ThemeStore.setTheme('dark');
      _ThemeStore.setAllowApplyMainTheme(false);
      NProgress.start();
      await ProfileModule.listProperties();
      next();
    } catch (e) {
      Log.error(`BeforeRouteEnter getting an error: ${e?.message}`);
      next({ name: Routers.NotFound });
    } finally {
      NProgress.done();
    }
  }

  beforeRouteLeave(to: Route, from: Route, next: NavigationGuardNext<any>) {
    _ThemeStore.revertToMainTheme();
    next();
  }

  created() {
    this.loadTrackingProfile();
  }

  private loadTrackingProfile() {
    const profileFields = this.getProfileFields();
    this.filters = this.getFilters();
    this.getUserProfileData(profileFields, this.filters);
  }

  mounted() {
    this.maxTableHeight = this.calculatedMaxTableHeight();
    window.addEventListener('resize', this.handleResizeScreen);
  }

  beforeDestroy() {
    TableTooltipUtils.hideTooltip();
    window.addEventListener('resize', this.handleResizeScreen);
  }

  configColumnsChanged(value: FieldDetailInfo[]) {
    this.dataManager.saveUserProfileConfigColumns(value);
    this.getUserProfileData(value);
  }

  configFilterChanged(filters: DynamicFilter[]): Promise<void> {
    return this.handleFiltersChanged(filters);
  }

  clearFilters(value: DynamicFilter[]): Promise<void> {
    this.filters = value;
    return this.handleFiltersChanged(value);
  }

  @Provide()
  async handleResetFilter() {
    try {
      await this.clearFilters([]);
    } catch (ex) {
      Log.error('handleResetFilter', ex);
    } finally {
      this.$nextTick(() => {
        this.maxTableHeight = this.calculatedMaxTableHeight();
      });
    }
  }

  private handleResizeScreen() {
    this.$nextTick(() => {
      this.maxTableHeight = this.calculatedMaxTableHeight();
    });
  }

  private calculatedMaxTableHeight(): number {
    const panelHeight = this.mainPanel.offsetHeight;
    const filterHeight = (this.filterBar.$el as any).offsetHeight;
    const headerPanelHeight = (this.headerPanel.$el as any).offsetHeight;
    const footerHeight = (this.userListingFooter.$el as any).offsetHeight;
    const paddingTopBottom = 64;
    Log.debug('calculatedMaxTableHeight::', panelHeight, filterHeight, headerPanelHeight, footerHeight);
    Log.debug('calculatedMaxTableHeight::', panelHeight - filterHeight - headerPanelHeight - footerHeight - paddingTopBottom);
    return panelHeight - filterHeight - headerPanelHeight - footerHeight - paddingTopBottom;
  }

  private allHeaders(): HeaderData[] {
    return this.userProfileData.headers ?? [];
  }

  private async getUserProfileData(fields?: FieldDetailInfo[], filters?: FilterWidget[]) {
    try {
      this.status = Status.Loading;
      if (fields) {
        await ProfileModule.editConfigColumns({ fields: fields });
      }
      if (filters) {
        ProfileModule.configFilterRequests(filters);
      }
      await ProfileModule.queryUserProfileData();
      this.status = Status.Loaded;
    } catch (e) {
      Log.error(`Created UserProfile getting an error: ${e?.message}`);
      const exception = DIException.fromObject(e);
      this.status = Status.Error;
      this.errorMsg = exception.message;
    } finally {
      NProgress.done();
    }
  }

  private async handleFiltersChanged(filters: DynamicFilter[]) {
    this.dataManager.saveMainFilters(TrackingProfile.FILTER_KEY, filters);
    await this.getUserProfileData(void 0, filters);
  }

  private async handleRemoveFilterAt(index: number) {
    try {
      this.filters = ListUtils.removeAt(this.filters, index);
      await this.configFilterChanged(this.filters);
    } catch (ex) {
      Log.debug('error::handleRemoveFilterAt', ex);
    } finally {
      this.$nextTick(() => {
        this.maxTableHeight = this.calculatedMaxTableHeight();
      });
    }
  }

  private handleApplyFilter(filterApplied: DynamicFilter) {
    Log.debug('handleApplyFilter::');
    this.configFilterChanged(this.filters);
  }

  private handleFilterStatusChange(filterStatusChange: DynamicFilter) {
    Log.debug('handleFilterStatusChange::');
    this.configFilterChanged(this.filters);
  }

  private handleValuesFilterChange(filter: DynamicFilter) {
    Log.debug('handleValuesFilterChange::', filter);
    this.configFilterChanged(this.filters);
  }

  @Provide()
  private handleAddNewFilter(profileField: FieldDetailInfo) {
    const filter: DynamicFilter = DynamicFilter.from(profileField.field, profileField.displayName, profileField.isNested);
    this.filters.push(filter);
    this.dataManager.saveMainFilters(TrackingProfile.FILTER_KEY, this.filters);
    // showFilter
    const filterIndex: number = this.filters.indexOf(filter);
    this.filterBar.showFilter(filterIndex);

    this.$nextTick(() => {
      this.maxTableHeight = this.calculatedMaxTableHeight();
    });
  }

  private getProfileFields(): FieldDetailInfo[] {
    const fields = this.dataManager.getUserProfileConfigColumns();
    if (fields && fields.length === 0) {
      return SchemaUtils.buildFieldsFromTableSchema(this.profileSettingInfo);
    } else {
      return fields;
    }
  }

  private getFilters(): DynamicFilter[] {
    return this.dataManager.getMainFilters(TrackingProfile.FILTER_KEY);
  }

  private removeHiddenHeaders(columns: HeaderData[]) {
    const configColumns = this.dataManager.getUserProfileConfigColumns();
    const hiddenColumns = configColumns.filter(column => column.isHidden).map(column => column.displayName);

    return columns.filter(column => !hiddenColumns.includes(column.label));
  }

  private handleClickRow(record: any) {
    const indexOfUserId = this.allHeaders().find(this.isUserIdHeader)?.key;
    let userId = '';
    if (indexOfUserId) {
      userId = record[+indexOfUserId];
    }
    this.$router
      .push({
        name: Routers.TrackingProfileDetail,
        params: {
          username: userId
        }
      })
      .catch(err => {
        if (err.name !== 'NavigationDuplicated' && !err.message.includes('Avoided redundant navigation to current location')) {
          throw err;
        }
      });
  }

  private async handleLoadPage(pagination: Pagination) {
    try {
      this.status = Status.Updating;
      const currentFrom = (pagination.page - 1) * pagination.rowsPerPage;
      const currentSize = pagination.rowsPerPage;
      await ProfileModule.setCurrentFrom({ currentFrom: currentFrom });
      await ProfileModule.setCurrentSize({ currentSize: currentSize });
      await ProfileModule.queryUserProfileData();
      this.status = Status.Loaded;
    } catch (e) {
      this.status = Status.Error;
      this.errorMsg = e?.message ?? 'Unknown error';
      Log.error(`UserProfile paging getting an error: ${e?.message}`);
    } finally {
      NProgress.done();
    }
  }

  private getCustomRenderBody(header: HeaderData): CustomCell | undefined {
    if (this.isUserIdHeader(header)) {
      return new CustomCell(this.customRenderUserIdBodyCell);
    }
    return undefined;
  }

  private isUserIdHeader(header: HeaderData) {
    return header.label === 'User Id';
  }

  private customRenderUserIdBodyCell(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement[] {
    const defaultImg = this.defaultImg;
    const imgSrc = this.getImgSrc(rowData) || defaultImg;
    const data = rowData[header.key] ?? '--';
    return [HtmlElementRenderUtils.renderImg(imgSrc, 'user-avt', defaultImg), HtmlElementRenderUtils.renderText(data, 'span')];
  }

  private getImgSrc(rowData: RowData): string {
    const key = this.allHeaders().find(header => header.label === 'Avatar Url')?.key ?? '';
    return rowData[key];
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.user-profile-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 76px) !important;
  padding: 32px;
}

.user-profile-header {
  max-height: 40px;
  min-height: 40px;
  order: 0;
}

.user-profile-filter {
  order: 1;
}

.user-profile-body {
  //--header-color: white;
  border-radius: 4px;
  flex-grow: 2;
  margin-bottom: 16px;
  margin-top: 8px;

  order: 2;
}

.user-profile-footer {
  max-height: 40px;
  min-height: 40px;
  order: 3;
}
</style>

<style lang="scss">
body {
  height: 100vh;
}

.user-profile-container {
  table tbody tr {
    cursor: pointer;

    &:hover {
      background-color: rgba(#fff, 0.1);
    }

    td img.user-avt {
      border-radius: 24px;
      height: 24px;
      margin-right: 8px;
      width: 24px;
    }
  }
}
</style>
