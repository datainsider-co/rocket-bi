<template>
  <LayoutContent>
    <LayoutHeader title="User Managements" icon="di-icon-users">
      <UserManagementHeader @reload="loadUserProfiles" class="ml-auto"></UserManagementHeader>
    </LayoutHeader>
    <div class="layout-content-panel user-management-content">
      <DiTable2
        id="user-management-table"
        class="flex-grow-1 flex-shrink-1"
        :error-msg="errorMsg"
        :headers="headers"
        :records="userProfileTableRows"
        :status="status"
        :total="totalProfile"
        padding-pagination="40"
        is-show-pagination
        @onClickRow="handleClickRow"
        @onPageChange="handleOnPageChange"
        @onRetry="loadUserProfiles"
      >
        <template #empty>
          <EmptyDirectory class="h-100 d-flex align-items-center" title="Users not found"></EmptyDirectory>
        </template>
      </DiTable2>
    </div>
  </LayoutContent>
  <!--  <div class="right-panel">-->
  <!--    <template>-->
  <!--      <header>-->
  <!--        <div class="right-panel-title">-->
  <!--          <div class="root-title">-->
  <!--            <i class="di-icon-users"></i>-->
  <!--            <span>User Managements</span>-->
  <!--          </div>-->
  <!--        </div>-->
  <!--        <UserManagementHeader @clickRefresh="loadUserProfiles"></UserManagementHeader>-->
  <!--      </header>-->
  <!--      <div class="right-panel-divider"></div>-->
  <!--    </template>-->
  <!--    <div class="user-management-content">-->
  <!--      <DiTable-->
  <!--        id="user-management-table"-->
  <!--        :error-msg="errorMsg"-->
  <!--        :headers="headers"-->
  <!--        :records="userProfileTableRows"-->
  <!--        :status="status"-->
  <!--        :total="totalProfile"-->
  <!--        is-show-pagination-->
  <!--        @onClickRow="handleClickRow"-->
  <!--        @onPageChange="handleOnPageChange"-->
  <!--        @onRetry="loadUserProfiles"-->
  <!--      ></DiTable>-->
  <!--    </div>-->
  <!--  </div>-->
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { mapState } from 'vuex';
import NProgress from 'nprogress';
import { FadeTransition } from 'vue2-transitions';
import UserManagementHeader from '@/screens/user-management/components/user-management/UserManagementHeader.vue';
import { DefaultPaging, Routers, Status, Stores } from '@/shared';
import { HeaderData, Pagination } from '@/shared/models';
import { UserManagementModule } from '@/screens/user-management/store/UserManagementStore';
import { UserProfileTableRow } from '@/shared/interfaces/UserProfileTableRow';
import { Log } from '@core/utils';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';
import DiTable2 from '@/shared/components/common/di-table/DiTable2.vue';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import { UserProfile } from '@core/common/domain';
import EmptyDirectory from '@/screens/dashboard-detail/components/EmptyDirectory.vue';

NProgress.configure({ easing: 'ease', speed: 500, showSpinner: false });

@Component({
  components: {
    EmptyDirectory,
    DiTable2,
    StatusWidget,
    FadeTransition,
    UserManagementHeader,
    LayoutContent,
    LayoutHeader
  },
  computed: {
    ...mapState(Stores.userProfileListingStore, ['userProfileTableRows', 'totalProfile'])
  }
})
export default class UserManagement extends Vue {
  private userProfileTableRows!: UserProfileTableRow[];
  private totalProfile!: number;
  private headers!: HeaderData[];
  private errorMsg = '';
  private status = Status.Loading;

  constructor() {
    super();
    this.headers = UserManagementModule.profileHeaders;
  }

  created() {
    this.loadUserProfiles();
  }

  beforeDestroy() {
    TableTooltipUtils.hideTooltip();
  }

  private showLoading(isForceReload: boolean) {
    if (isForceReload) {
      this.status = Status.Loading;
    } else {
      this.status = Status.Updating;
    }
  }

  private get isLoading() {
    return this.status === Status.Loading || this.status === Status.Updating;
  }

  destroyed() {
    UserManagementModule.reset();
  }

  private async loadUserProfiles(isForceReload = true) {
    try {
      this.showLoading(isForceReload);
      // await UserManagementModule.listProperties();
      UserManagementModule.setFromAndSize({ from: 0, size: DefaultPaging.DefaultPageSize });
      await UserManagementModule.loadUserProfileListing();
      this.status = Status.Loaded;
    } catch (ex) {
      Log.error('loadUserProfiles', ex?.message);
      this.status = Status.Error;
      this.errorMsg = ex?.message || 'Unknown error';
    }
  }

  @Track(TrackEvents.UserManagementSelectUser, {
    user_id: (_: UserManagement, args: any) => (args[0] as UserProfile).username,
    user_email: (_: UserManagement, args: any) => (args[0] as UserProfile).email,
    user_full_name: (_: UserManagement, args: any) => (args[0] as UserProfile).fullName
  })
  private handleClickRow(record: any) {
    TableTooltipUtils.hideTooltip();
    this.$router
      .push({
        name: Routers.UserDetail,
        params: {
          username: record.username
        }
      })
      .catch(err => {
        if (err.name !== 'NavigationDuplicated' && !err.message.includes('Avoided redundant navigation to current location')) {
          throw err;
        }
      });
  }

  private async handleOnPageChange(paging: Pagination) {
    try {
      this.status = Status.Updating;
      UserManagementModule.setFromAndSize({ from: paging.from, size: paging.size });
      await UserManagementModule.loadUserProfileListing();
      this.status = Status.Loaded;
    } catch (ex) {
      Log.error('loadUserProfiles', ex?.message);
      this.status = Status.Error;
      this.errorMsg = ex?.message || 'Unknown error';
    }
  }
}
</script>

<style lang="scss" src="./UserManagement.scss"></style>
