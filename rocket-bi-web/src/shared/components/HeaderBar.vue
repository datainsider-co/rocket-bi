<template>
  <div class="header-bar-container">
    <div class="container-fluid h-100 w-100">
      <div class="header-content" :class="{ open: showedMenu }">
        <CompanyLogoNameComponent class="cursor-pointer header-content--logo" @click.native="toMyData"></CompanyLogoNameComponent>
        <button v-if="isLogin" @click.prevent="toggleMenu" class="menu-responsive-action" type="button">
          <i v-if="!showedMenu" class="fa fa-bars"></i>
          <i v-else class="di-icon-close"></i>
        </button>
        <div v-if="isLogin" @click.prevent="toggleMenu(false)" class="menu-backdrop"></div>
        <div v-if="isLogin" class="menu">
          <CompanyLogoNameComponent class="menu-logo" @click.native="toMyData"></CompanyLogoNameComponent>
          <!--          <div class="search-input">-->
          <!--            <SearchInput :hintText="'Search dashboard and chart'" />-->
          <!--          </div>-->
          <router-link v-slot="{ href, navigate, isActive, isExactActive }" active-class="item-selected" class="header-bar-item" to="/mydata">
            <a
              :id="genBtnId('dashboards')"
              :class="{ active: isActive || isExactActive || isRouteMyData }"
              :href="href"
              title="Dashboards"
              class="navigator"
              @click="navigate"
            >
              <DashboardSettingIcon icon-size="16"></DashboardSettingIcon>
              <span>Dashboards</span>
            </a>
          </router-link>
          <div @click.prevent="toggleMenuItemSM" @mouseover="showMenuItem" @mouseleave="hideMenuItem" class="header-bar-item-group">
            <router-link v-slot="{ href, navigate, isActive, isExactActive }" title="Data Warehouse" class="header-bar-item" to="/data-warehouse">
              <a @click.prevent="showMenuItem" :id="genBtnId('data-management')" tabindex="-1" :class="{ active: isActive || isExactActive }" class="navigator">
                <DataWarehouseIcon icon-size="16"></DataWarehouseIcon>
                <span>Data Warehouse</span>
                <CaretDownIcon class="ml-1" />
              </a>
            </router-link>
            <div @click.prevent="hideMenuItem" class="custom-popover">
              <div class="popover-body">
                <router-link
                  v-for="data in dataWarehouseMenuOptions"
                  class="popover-item"
                  :key="data.label"
                  :to="data.to"
                  :style="{
                    display: data.hidden ? 'none' : ''
                  }"
                  @click.native.prevent="handleNavigateTo(data.to)"
                >
                  {{ data.label }}
                </router-link>
              </div>
            </div>
          </div>
          <div @click.prevent="toggleMenuItemSM" @mouseover="showMenuItem" @mouseleave="hideMenuItem" class="header-bar-item-group" v-if="isEnableLake">
            <router-link
              @click.prevent="showMenuItem"
              v-slot="{ href, navigate, isActive, isExactActive }"
              title="Lake House"
              class="header-bar-item"
              to="/lake-house"
            >
              <a tabindex="-1" :class="{ active: isActive || isExactActive }" class="navigator">
                <LakeHouseIcon />
                <span>Lake House</span>
                <CaretDownIcon class="ml-1" />
              </a>
            </router-link>
            <div @click.prevent="hideMenuItem" class="custom-popover">
              <div class="popover-body">
                <router-link
                  v-for="data in lakeHouseMenuOptions"
                  class="popover-item"
                  :key="data.label"
                  :to="data.to"
                  @click.native.prevent="handleNavigateTo(data.to)"
                >
                  {{ data.label }}
                </router-link>
              </div>
            </div>
          </div>
          <router-link
            v-slot="{ href, navigate, isActive, isExactActive }"
            title="Data Ingestion"
            class="header-bar-item"
            to="/data-ingestion"
            v-if="isEnableIngestion"
          >
            <a :id="genBtnId('data-ingestion')" :class="{ active: isActive || isExactActive }" :href="href" class="navigator" @click="navigate">
              <DatabaseIcon icon-size="16"></DatabaseIcon>
              <span>Data Ingestion</span>
            </a>
          </router-link>
          <router-link title="CDP" class="navigator header-bar-item" :to="cdpRoute" active-class="active" v-if="isEnableCDP">
            <i class="di-icon-profile"></i>
            <span>CDP</span>
          </router-link>
          <div @click.prevent="toggleMenuItemSM" @mouseover="showMenuItem" @mouseleave="hideMenuItem" class="header-bar-item-group">
            <a
              @click.prevent
              :id="genBtnId('settings')"
              :class="{ active: isSettingRoute }"
              class="navigator header-bar-item"
              title="Settings"
              tabindex="-1"
              href="#"
            >
              <SettingIcon icon-size="16"></SettingIcon>
              <span>Settings</span>
              <CaretDownIcon class="ml-1" />
            </a>
            <div @click.prevent="hideMenuItem" class="custom-popover custom-popover-right">
              <div class="popover-body">
                <router-link
                  v-if="userProfile || isLoadingUserProfile"
                  :to="currentUser"
                  class="popover-item user-item text-truncate"
                  @click.native.prevent="hideAllPopover"
                  :disabled="isLoadingUserProfile"
                >
                  <i v-if="isLoadingUserProfile" class="fa fa-spin fa-spinner text-muted mr-2"></i>
                  <img v-else :src="userAvatar" alt="" @error="$event.target.src = getDefaultAvt()" />
                  <div v-if="isLoadingUserProfile" class="user-item--name text-truncate">...Loading</div>
                  <div v-else class="user-item--name text-truncate">{{ fullName }}</div>
                </router-link>
                <router-link :to="organizationSettingsRoute" class="popover-item">
                  Organization Settings
                </router-link>
                <!--        <button v-if="isPermittedViewUser" :id="genBtnId('user-management')" class="popover-item user-management" @click="handleNavigateUserManagement">-->
                <!--          User Management-->
                <!--        </button>-->
                <button
                  v-if="isShowChangePasswordOption()"
                  :id="genBtnId('change-password')"
                  class="popover-item user-management"
                  @click="handleChangePassword"
                >
                  Change Password
                </button>
                <button v-if="showLogout" :id="genBtnId('log-out')" class="popover-item log-out" @click="handleSignOut">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ChangePasswordModal ref="changePasswordModal" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { OauthType, Routers } from '@/shared';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Log } from '@core/utils';
import ChangePasswordModal from '@/shared/components/ChangePasswordModal.vue';
import { Di } from '@core/common/modules';
import { DataManager, UserProfileService } from '@core/common/services';
import DataWarehouseIcon from '@/shared/components/Icon/DataWarehouseIcon.vue';
import DatabaseIcon from '@/shared/components/Icon/DatabaseIcon.vue';
import CustomerSettingIcon from '@/shared/components/Icon/CustomerSettingIcon.vue';
import DashboardSettingIcon from '@/shared/components/Icon/DashboardSettingIcon.vue';
import SettingIcon from '@/shared/components/Icon/SettingIcon.vue';
import { Inject } from 'typescript-ioc';
import { Location } from 'vue-router';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import LakeHouseIcon from '@/shared/components/Icon/LakeHouseIcon.vue';
import CaretDownIcon from '@/shared/components/Icon/CaretDownIcon.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { UserProfile } from '@core/common/domain';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import OrganizationPermissionModule from '@/store/modules/OrganizationPermissionStore';
import LogoComponent from '@/screens/organization-settings/components/organization-logo-modal/LogoComponent.vue';
import CompanyLogoNameComponent from '@/screens/organization-settings/components/organization-logo-modal/CompanyLogoNameComponent.vue';
import { RouterUtils } from '@/utils/RouterUtils';

interface RouterNode {
  label: string;
  to: Location;
  hidden?: boolean;
}

@Component({
  components: {
    CompanyLogoNameComponent,
    LogoComponent,
    CaretDownIcon,
    LakeHouseIcon,
    SettingIcon,
    DashboardSettingIcon,
    CustomerSettingIcon,
    DatabaseIcon,
    DataWarehouseIcon,
    ChangePasswordModal,
    DiButton
  }
})
export default class HeaderBar extends Vue {
  private organizationSettingsRoute = { name: Routers.OrganizationSettings };
  private cdpRoute = { name: Routers.CDP };
  private currentUser = { name: Routers.UserSettings };
  private showedMenu = false;
  static readonly MyDataRouters = new Set<string>([Routers.AllData, Routers.SharedWithMe, Routers.Dashboard, Routers.Trash, Routers.Starred, Routers.Recent]);

  private get userProfile(): UserProfile {
    return AuthenticationModule.userProfile;
  }

  private isLoadingUserProfile = false;

  @Ref()
  changePasswordModal?: ChangePasswordModal;

  @Prop({
    type: String,
    default: 'container-fluid'
  })
  container?: string;
  @Prop({ type: Boolean, default: true })
  showLogout!: boolean;

  private get dataWarehouseMenuOptions(): RouterNode[] {
    return [
      {
        label: 'Data Management',
        to: { name: Routers.AllDatabase }
      },
      {
        label: 'Schema',
        to: { name: Routers.DataSchema }
      },
      {
        label: 'Query Analysis',
        to: { name: Routers.QueryEditor }
      },
      {
        label: 'Relationship',
        to: { name: Routers.DataRelationship },
        hidden: !OrganizationPermissionModule.isEnableDataRelationship
      },
      {
        label: 'Data Cook',
        to: { name: Routers.DataCook },
        hidden: !OrganizationPermissionModule.isEnabledDataCook
      }
    ];
  }

  private get lakeHouseMenuOptions(): RouterNode[] {
    return [
      {
        label: 'Lake Explorer',
        to: { name: Routers.LakeExplorer, query: { path: '/' } }
      },
      {
        label: 'Schema Management',
        to: { name: Routers.LakeHouseSchema }
      },
      {
        label: 'Job Builder',
        to: { name: Routers.LakeQueryBuilder }
      },
      {
        label: 'Jobs Management',
        to: { name: Routers.LakeJob }
      }
    ];
  }

  private get isEnableLake(): boolean {
    return OrganizationPermissionModule.isEnabledLake;
  }

  private get isEnableIngestion(): boolean {
    return OrganizationPermissionModule.isEnabledIngestion;
  }

  private get isEnableCDP(): boolean {
    return OrganizationPermissionModule.isEnabledCDP;
  }

  @Inject
  private readonly userProfileService!: UserProfileService;

  get isSettingRoute() {
    return this.$route.path.startsWith('/settings/');
  }

  private get isLogin() {
    return AuthenticationModule.isLoggedIn;
  }

  private get fullName(): string {
    Log.debug('Fullname::header::', this.userProfile);
    return this.userProfile.getName;
  }

  private getDefaultAvt(): string {
    return HtmlElementRenderUtils.renderAvatarAsDataUrl(this.fullName) || '';
  }

  private get userAvatar(): string {
    return this.userProfile?.avatar || this.getDefaultAvt();
  }

  handleSignOut() {
    this.hideAllPopover();
    DatabaseSchemaModule.reset();
    _BuilderTableSchemaStore.reset();
    AuthenticationModule.logout();
  }

  private isShowChangePasswordOption(): boolean {
    const dataManager = Di.get(DataManager);
    return dataManager.getLoginType() === OauthType.DEFAULT;
  }

  private toMyData() {
    RouterUtils.to(Routers.AllData);
  }

  private handleChangePassword() {
    this.hideAllPopover();
    this.changePasswordModal?.show();
  }

  private handleNavigateTo(to: Location) {
    Log.debug('handleNavigateTo::', this.$router.currentRoute.name, 'ddd::', this.$route.name, 'to::', to);
    this.hideAllPopover();
    if (!this.$route.matched.some(route => route.name!.includes(to.name!))) {
      this.$router.push(to);
    }
  }

  private get isRouteMyData(): boolean {
    return HeaderBar.MyDataRouters.has(this.$route.name || '');
  }

  private hideAllPopover() {
    this.$root.$emit('bv::hide::popover');
  }

  private toggleMenu(showedMenu?: boolean) {
    if (typeof showedMenu === 'boolean') {
      this.showedMenu = showedMenu;
    } else {
      this.showedMenu = !this.showedMenu;
    }
  }

  private showMenuItem(e: MouseEvent) {
    $(e.target as HTMLElement)
      .closest('.header-bar-item-group')
      .find('.header-bar-item')
      .addClass('open');
  }

  private hideMenuItem(e: MouseEvent) {
    $(e.target as HTMLElement)
      .closest('.header-bar-item-group')
      .find('.header-bar-item')
      .removeClass('open');
  }

  private toggleMenuItemSM(e: MouseEvent) {
    const target = $(e.target as HTMLElement)
      .closest('.header-bar-item-group')
      .find('.header-bar-item');
    const isOpened = target.hasClass('open-sm');

    $(e.target as HTMLElement)
      .closest('.menu')
      .find('.header-bar-item.open-sm')
      .removeClass('open open-sm');

    if (!isOpened) {
      target.addClass('open open-sm');
    }
  }

  private beforeRouteEnter() {
    this.showedMenu = false;
  }

  mounted() {
    $('.header-bar-container').on('click', '.header-bar-item-group .popover-item', () => {
      $('.header-bar-container .menu .header-bar-item').removeClass('open');
      this.showedMenu = false;
    });
    $('.header-bar-container').on('click', '.header-bar-item:not(:has(+.custom-popover))', () => {
      this.showedMenu = false;
    });
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

button {
  background: none;
  border: none;
  border-radius: 4px;
  outline: none;
}

a:hover,
a:visited,
a:link,
a:active {
  text-decoration: none !important;
}

a:visited {
  outline: 0 !important;
}

.custom-popover {
  background: none;
  border: none;
  margin-top: 0 !important;
  max-width: unset;
  padding: 0 !important;

  ::v-deep {
    .arrow {
      display: none;
    }
  }

  .router-link-active {
    background: var(--active-color);
    @include semi-bold-14();
    font-weight: 500 !important;
    color: var(--text-color);
  }

  .popover-body {
    background: var(--menu-background-color);
    border: var(--menu-border);
    box-shadow: var(--menu-shadow);
    border-radius: 4px;
    height: auto;
    min-width: 200px;
    padding: 0 !important;
    width: fit-content;

    .user-item {
      max-height: 49px !important;

      img {
        width: 24px;
        height: 24px;
        margin-right: 8px;
        border-radius: 50%;
      }

      &--name {
        max-width: 200px;
      }
    }

    .popover-item {
      border-radius: 4px;
      cursor: pointer !important;
      display: flex;
      align-items: center;
      min-height: 49px;
      padding: 12px 16px;
      width: 100%;
      @include regular-text-14();
      color: var(--secondary-text-color);

      a {
        color: var(--text-secondary-color);
        font-weight: normal;
      }

      &:hover {
        background: var(--hover-color);
        color: var(--text-color);
      }

      &:active {
        background-color: var(--active-color);
      }
    }

    .dark-mode {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .custom-control-input:checked ~ .custom-control-label::after {
        content: '\e927';
        background-color: initial;
      }

      label {
        cursor: pointer;

        &:before {
          height: 20px;
          width: 40px;
          top: 0;
          border-radius: 10px;
        }

        &:after {
          left: -2.3rem;
          border-radius: unset;
          background: unset;
          content: '\e926';
          color: var(--accent);
        }
      }
    }

    .dark-mode.theme-disabled {
      opacity: 0.4;
      pointer-events: none;
      cursor: not-allowed !important;
    }
  }
}
</style>

<style lang="scss">
@import '~@/themes/scss/mixin';
@import '~@/themes/scss/di-variables';

$header-bar-height: 68px;

//popover data warehouse
.data-warehouse-menu {
  left: 4px !important;
}

.lake-house-menu {
  left: 19px !important;
}

.setting-menu {
  left: -16px !important;
}

.header-bar-container {
  background-color: var(--header-color);
  min-height: $header-bar-height;
  max-height: $header-bar-height;
  height: $header-bar-height;
  z-index: 999 !important;

  > div {
    padding-left: 32px !important;
    padding-right: 32px !important;

    @include media-breakpoint-down(sm) {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }

    > .header-content {
      align-items: center;
      display: flex;
      height: 100%;
      justify-content: space-between;

      .header-content--logo {
        overflow: hidden;
        flex-shrink: 1;
        flex-grow: 1;
        margin-right: 8px;
      }

      .menu-responsive-action {
        display: none;
        color: var(--header-icon-color);
        font-size: 20px;
        padding: 18px;
        margin-right: -16px;
        z-index: 1100;
      }

      .menu-backdrop {
        display: none;
      }

      .menu {
        align-items: center;
        display: flex;

        .menu-logo {
          display: none;
        }

        .search-input {
          display: none;
          min-width: 208px;
          padding-left: 0;

          @include media-breakpoint-only(xs) {
            max-width: 78px;
            min-width: 78px;
          }

          ::v-deep {
            .form-control {
              min-height: 40px;
            }
          }
        }

        .header-bar-item {
          align-items: center;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          padding: 8px 12px;

          @include media-breakpoint-only(xs) {
            padding: 4px 8px;
          }

          span {
            @include regular-text;
            color: inherit;
            cursor: pointer;
            font-size: 14px;
            letter-spacing: 0.2px;
            padding-left: 6px;
            text-align: center;
            user-select: none;
            white-space: nowrap;

            @include media-breakpoint-down(md) {
              display: none;
            }
          }
        }

        .header-bar-item + .header-bar-item,
        .header-bar-item + .header-bar-item-group,
        .header-bar-item-group + .header-bar-item,
        .header-bar-item-group + .header-bar-item-group {
          margin-left: 12px;
          @include media-breakpoint-down(sm) {
            margin-left: 6px;
          }
        }
      }

      .header-bar-item-group {
        position: relative;

        .header-bar-item span + svg {
          transition: linear transform 200ms;
        }
      }

      .header-bar-item-group .custom-popover {
        display: none;
        z-index: 1100;
      }

      .header-bar-item-group {
        .header-bar-item.open {
          & + .custom-popover {
            position: absolute;
            top: 30px;
            left: 0;
            display: block;
            padding: 10px 0 !important;

            &.custom-popover-right {
              left: auto;
              right: 0;
            }
          }

          span + svg {
            transform: rotate(180deg);
          }
        }
      }

      @include media-breakpoint-down(sm) {
        .menu-responsive-action {
          display: block;
        }

        .menu {
          overflow: auto;
          padding: 0 0 30px 0;

          display: flex;
          position: fixed;
          left: 0;
          top: 0;
          background: var(--header-color);
          height: 100%;
          max-height: 100vh;
          flex-direction: column;
          z-index: 1100;
          align-items: flex-start;
          min-width: 240px;
          transform: translateX(-100%);
          transition: linear transform 200ms;

          .header-bar-item {
            width: 100%;
            justify-content: flex-start;
            padding: 16px 20px;
            border-radius: 0;
            margin: 0 0 1px 0 !important;

            span {
              display: inline;
            }
          }

          .navigator.open,
          .navigator.active,
          .navigator:hover {
            background: none;
            color: #fff;
            --icon-color: #fff;
          }

          .header-bar-item-group {
            width: 100%;
            margin: 0 !important;

            .header-bar-item.open {
              span + svg {
                transform: none;
              }

              & + .custom-popover {
                display: none;
              }
            }

            .header-bar-item.open-sm {
              span + svg {
                transform: rotate(180deg);
              }

              & + .custom-popover {
                display: block;
                position: static;
                padding: 0 0 0 26px !important;
                background: hsl(0deg 0% 100% / 10%);

                .popover-body {
                  width: 100%;
                  border-radius: 0;
                  box-shadow: none;
                  background: none;

                  .popover-item,
                  .popover-item:hover {
                    color: #fff;
                    background: none;
                  }
                }
              }
            }
          }

          .menu-logo {
            display: flex;
            padding: 16px;
            width: 100%;
            height: $header-bar-height;
            justify-content: flex-start;
            align-items: center;
            position: sticky;
            top: 0;
            background: var(--header-color);
            z-index: 1;
          }
        }
        &.open .menu-backdrop {
          display: block;
          background: rgba(0, 0, 0, 0.4);
          position: fixed;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          max-height: 100vh;
          z-index: 1099;
        }
        &.open .menu {
          transform: translateX(0);
        }
      }
    }
  }
}

a.navigator {
  --icon-color: var(--header-icon-color);
  color: var(--header-text-color);

  &.active,
  &.open,
  &:hover {
    background: var(--header-active-background-color);
    --icon-color: var(--header-icon-active-color);
    color: var(--header-text-active-color);
  }
}

div.navigator {
  --icon-color: var(--header-icon-color);
  color: var(--header-text-color);
  cursor: pointer;
}

html.light .dark-mode label:before {
  background: #f2f2f7 !important;
}

html.dark .dark-mode label:before {
  background: white !important;
}

.dropdown-menu {
  //background-color: var(--primary);
  padding: 0;

  .dropdown-item {
    padding: 12px 16px;
    //background-color: var(--primary);
    //
    //&:hover {
    //  background: #fff;
    //}
  }
}

.btn-ghost.setting-active {
  &,
  &:hover {
    background-color: var(--accent);
  }

  //$marginY: 10px;
  //margin-top: -$marginY;
  //margin-bottom: -$marginY;
  //height: calc(100% + #{$marginY * 2});
}
</style>
