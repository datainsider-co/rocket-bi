<template>
  <LayoutWrapper>
    <LayoutSidebar :items="navItems">
      <template v-slot:top>
        <DiShadowButton id="create-etl" title="New ETL" @click="handleCreateEtlJob">
          <i class="di-icon-add"></i>
        </DiShadowButton>
      </template>
    </LayoutSidebar>
    <router-view></router-view>
    <DiShareModal ref="shareModal" />
  </LayoutWrapper>
</template>
<script lang="ts">
import { LoggedInScreen } from '@/shared/components/vue-hook/LoggedInScreen';
import { Component, Ref } from 'vue-property-decorator';
import { EtlJobInfo } from '@core/data-cook';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import DiShareModal, { ResourceData } from '@/shared/components/common/di-share-modal/DiShareModal.vue';
import { ResourceType } from '@/utils/PermissionUtils';
import { DataCookShareHandler } from '@/shared/components/common/di-share-modal/share-handler/DataCookShareHandler';
import { Routers } from '@/shared';
import { NavigationItem } from '@/shared/components/common/NavigationPanel.vue';
import { RouterUtils } from '@/utils/RouterUtils';
import { LayoutSidebar, LayoutWrapper } from '@/shared/components/layout-wrapper';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

export enum DataCookEvent {
  ShowShareModal = 'show_share_modal'
}

@Component({
  components: {
    DiShareModal,
    LayoutWrapper,
    LayoutSidebar
  }
})
export default class DataCook extends LoggedInScreen {
  private createEtlJobRoute = { name: Routers.CreateEtl };

  @Ref()
  private readonly shareModal!: DiShareModal;

  private get navItems(): NavigationItem[] {
    return [
      {
        id: Routers.MyEtl,
        displayName: 'My ETL',
        icon: 'di-icon-etl-home',
        to: { name: Routers.MyEtl }
      },
      {
        id: Routers.SharedEtl,
        displayName: 'Share With Me',
        icon: 'di-icon-share-with-me',
        to: { name: Routers.SharedEtl }
      },
      {
        id: Routers.EtlHistory,
        displayName: 'ETL History',
        icon: 'di-icon-restore',
        to: { name: Routers.EtlHistory }
      },
      {
        id: Routers.ArchivedEtl,
        displayName: 'Trash',
        icon: 'di-icon-delete',
        to: { name: Routers.ArchivedEtl }
      }
    ];
  }

  mounted() {
    this.$root.$on(DataCookEvent.ShowShareModal, this.showShareEtl);
  }

  beforeDestroy() {
    this.$root.$off(DataCookEvent.ShowShareModal, this.showShareEtl);
  }

  @Track(TrackEvents.ETLShare, { etl_id: (_: DataCook, args: any) => args[0]?.id, etl_name: (_: DataCook, args: any) => args[0]?.displayName })
  showShareEtl(etl: EtlJobInfo) {
    const organizationId = Di.get(DataManager).getUserInfo()?.organization.organizationId!;

    const resourceData: ResourceData = {
      resourceId: etl.id.toString(),
      resourceType: ResourceType.etl,
      organizationId: organizationId
    };
    this.shareModal.showShareModal(resourceData, new DataCookShareHandler(), false, null, false, null);
  }

  @Track(TrackEvents.ETLCreate, { etl_name: (_: DataCook) => _.createEtlJobRoute?.name })
  private handleCreateEtlJob() {
    RouterUtils.to(this.createEtlJobRoute.name);
  }
}
</script>
<style lang="scss" scoped>
.nodata-block {
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;

  min-height: 400px;

  &-icon {
    font-size: 40px;
    margin-bottom: 16px;
    //color: var(--charcoal);
  }

  &-msg {
    font-size: 16px;
  }
}
.cdp {
  display: flex;
  flex-direction: column;
  height: 100vh;
  $sidebar-width: 210px;
  $sidebar-margin-right: 16px;

  .text-no-underline {
    text-decoration: none;
  }

  &-body {
    display: flex;
    flex: 1;
    height: calc(100vh - 70px);
    overflow: hidden;
    padding: 24px 32px 24px 16px;

    > * {
      overflow: hidden;
    }

    ::v-deep .form-control {
      //height: auto;
      min-height: 40px;
      //padding: 0.375rem 16px;
    }

    ::v-deep td > .icon-action-cell > i + i {
      margin-left: 12px;
    }

    ::v-deep .input-group .input-group-prepend + .form-control {
      padding-left: 0;
    }

    ::v-deep .btn-di {
      height: 42px;
      min-width: 170px;
    }

    ::v-deep .navigation-panel {
      width: $sidebar-width;
      display: flex;

      .di-btn-shadow {
        margin-bottom: 16px;
        margin-right: auto;

        [class^='di-icon-'] + .title {
          margin-left: 10px;
        }
      }

      .navigation-panel--nav {
        width: 100%;
        position: sticky;
        top: 20px;
        z-index: 1;
      }
    }

    ::v-deep .cdp-body-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      text-align: left;
      width: calc(100% - #{$sidebar-width + $sidebar-margin-right});

      &-header {
        display: flex;
        justify-content: space-between;
        padding-bottom: 24px;
        position: relative;

        &-icon {
          margin-right: 16px;
        }

        &-title {
          color: var(--text-color);
          font-size: 24px;
          font-weight: 500;

          a {
            color: var(--text-color);
            font-size: 24px;
            font-weight: 500;
            text-decoration: none;
          }
        }

        &::after {
          background-color: var(--text-color);
          bottom: 16px;
          content: '';
          display: flex;
          height: 1px;
          left: 0;
          opacity: 0.2;
          position: absolute;
          //margin-bottom: 16px;
          //margin-top: 8px;
          width: 100%;
          z-index: 1;
        }

        &-actions {
          display: flex;
        }
      }

      &-body {
        display: flex;
        flex: 1;
        flex-direction: column;
        max-height: calc(100vh - 180px);
        overflow: hidden;
      }

      &-block {
        background-color: var(--panel-background-color);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        //overflow: hidden;
        margin-bottom: 16px;
        padding: 16px;

        &-title {
          display: flex;
          font-size: 14px;
          font-weight: bold;
          line-height: 1;
          margin-bottom: 8px;

          .di-button {
            background-color: #fafafb;
            height: 34px;
            padding: 0 12px;

            ::v-deep .title {
              font-weight: normal !important;
              padding: 0;
            }

            ::v-deep [class^='di-icon-'] + .title {
              font-weight: normal !important;
              margin-left: 8px;
              padding: 0;
            }
          }

          .btn-group {
            .di-button + .di-button {
              border-bottom-left-radius: 0;
              border-left: 1px solid var(--directory-grid-line-color);
              border-top-left-radius: 0;
            }
          }
        }

        &-body {
          display: flex;
          flex: 1;
          flex-direction: column;
        }

        &-nodata {
          align-items: center;
          display: flex;
          flex: 1;
          flex-direction: column;
          justify-content: center;

          min-height: 400px;

          &-icon {
            font-size: 40px;
            margin-bottom: 16px;
            //color: var(--charcoal);
          }

          &-msg {
            font-size: 16px;
          }
        }
      }
    }
  }
}
</style>
