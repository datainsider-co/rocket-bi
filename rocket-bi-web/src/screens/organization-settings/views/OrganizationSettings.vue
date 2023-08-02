<template>
  <LayoutWrapper>
    <LayoutSidebar :items="navItems"></LayoutSidebar>
    <router-view></router-view>
  </LayoutWrapper>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import { LoggedInScreen } from '@/shared/components/vue-hook/LoggedInScreen';
import { Routers } from '@/shared';
import { NavigationItem } from '@/shared/components/common/NavigationPanel.vue';
import { LayoutSidebar, LayoutWrapper } from '@/shared/components/layout-wrapper';
import EnvUtils from '@/utils/EnvUtils';
import { ConnectionModule } from '@/screens/organization-settings/stores/ConnectionStore';

@Component({
  components: {
    LayoutWrapper,
    LayoutSidebar
  }
})
export default class OrganizationSettings extends LoggedInScreen {
  private get navItems(): NavigationItem[] {
    return [
      {
        id: 'overview',
        displayName: 'Overview',
        icon: 'di-icon-org-overview',
        to: { name: Routers.OrganizationOverview }
      },
      {
        id: 'user_managements',
        displayName: 'User Managements',
        icon: 'di-icon-users',
        to: { name: Routers.UserManagement }
      },
      {
        id: 'user_activity',
        displayName: 'User Activity',
        icon: 'di-icon-log',
        to: { name: Routers.UserActivity },
        disabled: EnvUtils.isDisableUserActivities()
      },
      {
        id: 'clickhouse_config',
        displayName: 'DataSource Config',
        icon: 'di-icon-my-data',
        to: { name: Routers.ClickhouseConfig },
        disabled: !ConnectionModule.isPermitted
      },
      {
        id: 'plan_detail_and_billing',
        displayName: 'Plan Detail & Billing',
        icon: 'di-icon-dollar',
        to: { name: Routers.PlanAndBilling }
      },
      {
        id: 'token_management',
        displayName: 'API Key Management',
        icon: 'di-icon-user-access',
        to: { name: Routers.APIKeyManagement }
      }
    ].filter(item => !item.disabled);
  }
}
</script>

<style lang="scss">
.header-bar-container {
  position: sticky;
  top: 0;
  left: 0;
}
.org-settings {
  display: flex;
  flex-direction: column;
  height: 100vh;

  &--body {
    display: flex;
    flex: 1;
    padding: 24px 32px 32px 16px;
    overflow: hidden;

    > * {
      overflow: hidden;
    }

    &-panel {
      flex: 1;
      display: flex;
      flex-direction: column;

      > header {
        align-items: center;
        display: flex;
        height: 33px;

        > .right-panel-title {
          align-items: center;
          display: flex;
          flex: 1;
          font-size: 24px;
          font-stretch: normal;
          font-style: normal;
          font-weight: 500;
          letter-spacing: 0.2px;
          line-height: 1.4;
          margin-right: 8px;
          overflow: hidden;
          justify-content: space-between;

          > .root-title {
            align-items: center;
            display: flex;
            white-space: nowrap;

            > i {
              color: var(--directory-header-icon-color);
              margin-right: 16px;
            }
          }
        }
      }

      > .right-panel-divider {
        background-color: var(--text-color);
        height: 0.5px;
        margin-bottom: 16px;
        margin-top: 8px;
        opacity: 0.2;
      }
    }
  }
}
</style>
