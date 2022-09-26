<template>
  <LayoutWrapper>
    <LayoutSidebar :items="navItems">
      <template v-slot:top>
        <DiShadowButton
          v-if="isDataSourceRoute"
          id="create-data-source"
          class="shadow-button create-data-source"
          title="Add Data Source"
          @click="openDatabaseSelection"
        >
          <i class="regular-icon-16 di-icon-add"></i>
        </DiShadowButton>
        <DiShadowButton v-else id="create-job" class="shadow-button create-data-source" title="Add Job" @click="openDataSourceSelectionModal">
          <i class="regular-icon-16 di-icon-add"></i>
        </DiShadowButton>
        <!--          <DiButton v-else id="create-job" class="shadow-button create-data-source" title="Add Job" @click="openDataSourceSelectionModal">-->
        <!--            <i class="regular-icon-16 di-icon-add"></i>-->
        <!--          </DiButton>-->
      </template>
    </LayoutSidebar>
    <router-view class="my-data-listing" ref="dataIngestionChild"></router-view>
  </LayoutWrapper>
</template>

<script lang="ts">
import { Component, Ref } from 'vue-property-decorator';
import HeaderBar from '@/shared/components/HeaderBar.vue';
import DataIngestionHeader from '@/screens/DataIngestion/components/DataIngestionHeader.vue';
import { LoggedInScreen } from '@/shared/components/VueHook/LoggedInScreen';
import { NavigationItem } from '@/shared/components/Common/NavigationPanel.vue';
import { Routers } from '@/shared';
import { Log } from '@core/utils';
import DiShadowButton from '@/shared/components/Common/DiShadowButton.vue';
import { LayoutSidebar, LayoutWrapper } from '@/shared/components/LayoutWrapper';
import OrganizationPermissionModule from '@/store/modules/organization_permission.store';

@Component({
  components: {
    DiShadowButton,
    DataIngestionHeader,
    HeaderBar,
    LayoutWrapper,
    LayoutSidebar
  }
})
export default class DataIngestion extends LoggedInScreen {
  @Ref()
  dataIngestionChild?: any;

  private get navItems(): NavigationItem[] {
    const items = [
      {
        id: 'dataSources',
        displayName: 'Data Sources',
        icon: 'di-icon-datasource',
        to: { name: Routers.DataSource }
      },
      {
        id: 'jobs',
        displayName: 'Jobs',
        icon: 'di-icon-job',
        to: { name: Routers.Job }
      },
      {
        id: 'streaming',
        displayName: 'Streaming',
        icon: 'di-icon-streaming',
        to: { name: Routers.Streaming },
        disabled: !OrganizationPermissionModule.isEnabledStreaming
      },
      {
        id: 'jobsHistory',
        displayName: 'Jobs History',
        icon: 'di-icon-job-history',
        to: { name: Routers.JobHistory }
      }
    ];
    return items.filter(item => !item.disabled);
  }

  private get isDataSourceRoute(): boolean {
    return this.$route.name === Routers.DataSource;
  }

  private openDatabaseSelection() {
    Log.debug('open database selection from data ingestion');
    this.dataIngestionChild?.openDatabaseSelection();
  }

  private openDataSourceSelectionModal() {
    this.dataIngestionChild?.openNewJobConfigModal();
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.data-ingestion {
  display: flex;
  flex-direction: column;
  height: 100vh;

  &--body {
    display: flex;
    flex: 1;
    padding: 24px 32px 24px 16px;

    > * {
      overflow: hidden;
    }

    > .my-data-listing {
      flex: 1;
    }
  }

  #create-data-source,
  #create-job {
    width: fit-content;
    margin-bottom: 16px;
    ::v-deep {
      @media screen and (max-width: 800px) {
        .title {
          display: none;
        }
        i {
          margin: 0;
        }
      }
    }
  }
}
</style>
