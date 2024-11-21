<template>
  <LayoutContent>
    <LayoutHeader title="User Managements" icon="di-icon-users" :route="userManagementRoute">
      <BreadcrumbComponent :breadcrumbs="breadcrumbs"></BreadcrumbComponent>
    </LayoutHeader>
    <div class="layout-content-panel user-detail-content">
      <status-widget class="user-detail-status-widget" :error="errorMessage" :status="userContactStatus" @retry="initUserProfileDetail">
        <vuescroll>
          <div class="user-management-detail-panel">
            <div class="user-contact">
              <Contact :status="userContactStatus" :errorMessage="errorMessage" :user-full-detail-info="userFullDetailInfo" />
            </div>
            <div class="user-privilege">
              <UserPrivilege
                v-if="isUserPrivilegeOpened"
                :errorMessage="privilegeErrorMessage"
                :permissionGroups="permissionGroups"
                :selectedPermissions="selectedPermissions"
                :fullName="fullName"
                :status="userPrivilegeStatus"
              />
              <UserDeletion v-else-if="isUserDeletionOpened" :fullName="fullName"></UserDeletion>
            </div>
          </div>
        </vuescroll>
      </status-widget>
    </div>
  </LayoutContent>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { NavigationGuardNext, Route } from 'vue-router';
import { FadeTransition } from 'vue2-transitions';

import Contact from '@/screens/user-management/components/user-detail/Contact.vue';
import { Routers, Status } from '@/shared';
import UserPrivilege from '@/screens/user-management/components/user-detail/UserPrivilege.vue';
import UserDeletion from '@/screens/user-management/components/user-detail/UserDeletion.vue';
import { PermissionGroup } from '@core/admin/domain/permissions/PermissionGroup';
import { UserFullDetailInfo } from '@core/common/domain/model';
import { UserDetailModule } from '@/screens/user-management/store/UserDetailStore';
import MessageContainer from '@/shared/components/MessageContainer.vue';
import { DIException } from '@core/common/domain/exception';
import { Log } from '@core/utils';
import BreadcrumbComponent from '@/screens/directory/components/BreadcrumbComponent.vue';
import { Breadcrumbs } from '@/shared/models';
import { UserDetailPanelType } from '@/screens/user-management/store/Enum';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';

@Component({
  components: {
    StatusWidget,
    MessageContainer,
    UserPrivilege,
    FadeTransition,
    Contact,
    UserDeletion,
    BreadcrumbComponent,
    LayoutContent,
    LayoutHeader
  }
})
export default class UserManagementDetails extends Vue {
  errorMessage = '';
  privilegeErrorMessage = '';
  userPrivilegeStatus = Status.Loading;
  userContactStatus = Status.Loading;

  get isError() {
    if (this.errorMessage === '') {
      return false;
    }
    return true;
  }

  private get userManagementRoute() {
    return { name: Routers.UserManagement };
  }

  private get isUserPrivilegeOpened() {
    return UserDetailModule.currentDetailPanelType == UserDetailPanelType.UserPrivilege;
  }

  private get isUserDeletionOpened() {
    return UserDetailModule.currentDetailPanelType == UserDetailPanelType.UserDeletion;
  }

  get fullName() {
    return this.userFullDetailInfo?.profile?.fullName ?? '';
  }

  private get breadcrumbs(): Breadcrumbs[] {
    if (this.userFullDetailInfo) {
      return [
        new Breadcrumbs({
          text: this.userFullDetailInfo.profile?.getName ?? 'Unknown',
          to: {}
        })
      ];
    } else {
      return [];
    }
  }

  private get permissionGroups(): PermissionGroup[] {
    return UserDetailModule.permissionGroups;
  }

  private get userFullDetailInfo(): UserFullDetailInfo | null {
    return UserDetailModule.userFullDetailInfo;
  }

  private get selectedPermissions(): string[] {
    return UserDetailModule.selectedPermissions;
  }

  async beforeRouteEnter(to: Route, from: Route, next: NavigationGuardNext<any>) {
    //todo handle check permissions here
    try {
      if (to.params.username) {
        UserDetailModule.setSelectedUsername({ username: to.params.username });
      }
      next();
    } catch (e) {
      Log.error(`BeforeRouteEnter getting an error: ${e?.message}`);
    }
  }

  created() {
    this.initUserProfileDetail();
  }

  destroyed() {
    UserDetailModule.reset();
  }

  showLoading() {
    this.userContactStatus = Status.Loading;
    this.userPrivilegeStatus = Status.Loading;
  }

  showLoaded() {
    this.userContactStatus = Status.Loaded;
  }

  showError(ex: DIException) {
    this.handleErrorLoadUserFullDetailInfo(ex);
    this.userPrivilegeStatus = Status.Error;
    this.userContactStatus = Status.Error;
    this.errorMessage = ex.message;
  }

  private async initUserProfileDetail() {
    this.showLoading();
    await this.handleLoadUserFullDetailInfo(), await UserDetailModule.loadSupportPermissionGroups(), await this.handleLoadSelectedPermissions();
  }

  private async handleLoadUserFullDetailInfo(): Promise<void> {
    try {
      await UserDetailModule.loadUserFullDetailInfo();
      this.showLoaded();
    } catch (ex) {
      this.showError(ex);
      return Promise.reject();
    }
  }

  private async handleLoadSelectedPermissions() {
    try {
      await UserDetailModule.loadSelectedPermissions();
      this.userPrivilegeStatus = Status.Loaded;
    } catch (ex) {
      this.handleErrorLoadPermissions(ex);
      this.userPrivilegeStatus = Status.Error;
      return Promise.reject();
    }
  }

  private handleErrorLoadUserFullDetailInfo(ex: DIException) {
    this.errorMessage = ex as any;
  }

  private handleErrorLoadPermissions(ex: DIException) {
    this.privilegeErrorMessage = ex.message;
    Log.debug('error::', this.privilegeErrorMessage);
  }

  private navigateToUserManagement() {
    this.$router.push({
      name: Routers.UserManagement
    });
  }
}
</script>

<style lang="scss" src="./UserDetail.scss"></style>
