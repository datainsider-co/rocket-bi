<template>
  <router-view v-if="isDataManagement"></router-view>
  <LayoutWrapper v-else no-sidebar class="data-management-container">
    <LayoutContent>
      <LayoutHeader :title="dataManagementRoute.displayName" :icon="dataManagementRoute.icon" :route="dataManagementRoute.to">
        <template v-if="breadcrumbs.length > 0">
          <BreadcrumbComponent :breadcrumbs="breadcrumbs" />
        </template>
      </LayoutHeader>
      <router-view></router-view>
    </LayoutContent>
  </LayoutWrapper>
</template>

<script lang="ts">
import { Component, Provide, ProvideReactive, Vue, Watch } from 'vue-property-decorator';
import HeaderBar from '@/shared/components/HeaderBar.vue';
import { DatabaseSchemaModule, SchemaReloadMode } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { DatabaseInfo, TableSchema } from '@core/common/domain/model';
import DataComponents from '@/screens/data-management/components/DataComponents';
import { Routers } from '@/shared';
import { Log } from '@core/utils';
import { LayoutContent, LayoutHeader, LayoutWrapper } from '@/shared/components/layout-wrapper';
import { AccessibleScreen } from '@/shared/components/vue-hook/AccessibleScreen';
import BreadcrumbComponent from '@/screens/directory/components/BreadcrumbComponent.vue';
import { Breadcrumbs } from '@/shared/models';
import { NavigationItem } from '@/shared/components/common/NavigationPanel.vue';
import { FindSchemaResponse } from '@/screens/data-management/views/AbstractSchemaComponent';

Vue.use(DataComponents);

@Component({
  components: {
    BreadcrumbComponent,
    HeaderBar,
    LayoutWrapper,
    LayoutContent,
    LayoutHeader
  }
})
export default class DataManagement extends AccessibleScreen {
  private breadcrumbs: Breadcrumbs[] = [];

  private get isDataManagement(): boolean {
    const currentRouteName = this.$route.name as Routers;
    return [Routers.AllDatabase, Routers.TrashDatabase].includes(currentRouteName);
  }

  @ProvideReactive('isDatabaseLoading')
  private isDatabaseLoading = false;

  @ProvideReactive('databaseSchemas')
  private get databaseSchemas(): DatabaseInfo[] {
    return DatabaseSchemaModule.databaseInfos;
  }

  @Provide('findSchema')
  private async findData(dbName?: string, tableName?: string, columnName?: string): Promise<FindSchemaResponse> {
    try {
      const schemaResponse: FindSchemaResponse = {};
      if (dbName) {
        schemaResponse.database = await DatabaseSchemaModule.loadDatabaseInfo({ dbName });
      }
      if (dbName && tableName) {
        const table: TableSchema | undefined = await DatabaseSchemaModule.loadTableSchema({ dbName: dbName, tableName: tableName });
        schemaResponse.table = table;

        if (table && columnName) {
          schemaResponse.column = table.findColumn(columnName);
        }
      }
      return schemaResponse;
    } catch (ex) {
      Log.error('DataManagement:findSchema::error::', ex);
      return {};
    }
  }

  @Provide('isExistDatabase')
  private isExistDatabase(dbName: string) {
    const database = this.databaseSchemas.find(db => db.name === dbName);
    return database ? true : false;
  }

  @Provide('loadShortDatabaseInfos')
  private async loadShortDatabaseInfos(): Promise<void> {
    try {
      if (this.isDatabaseLoading) {
        return;
      }
      this.isDatabaseLoading = true;
      await DatabaseSchemaModule.loadShortDatabaseInfos(false);
    } catch (ex) {
      Log.error('DatabaseManagement:loadData::error::', ex);
    } finally {
      this.isDatabaseLoading = false;
    }
  }

  @Provide('reloadShortDatabaseInfos')
  private async reloadShortDatabaseInfos(reloadMode: SchemaReloadMode): Promise<void> {
    try {
      if (this.isDatabaseLoading) {
        return;
      }
      this.isDatabaseLoading = true;
      await DatabaseSchemaModule.reloadDatabaseInfos(reloadMode);
    } catch (ex) {
      Log.error('DatabaseManagement:loadData::error::', ex);
    } finally {
      this.isDatabaseLoading = false;
    }
  }

  private get dataManagementRoute(): NavigationItem {
    switch (this.$route.name) {
      case Routers.QueryEditor:
        return {
          icon: 'di-icon-query-editor',
          displayName: 'Query Analysis',
          to: { name: Routers.QueryEditor }
        };
      case Routers.DataRelationship:
        return {
          icon: 'di-icon-relationship',
          displayName: 'Relationship',
          to: { name: Routers.DataRelationship }
        };
      default:
        return {
          icon: 'di-icon-schema',
          displayName: 'Schema',
          to: { name: Routers.DataSchema }
        };
    }
  }

  @Provide('setBreadcrumbs')
  setBreadcrumbs(breadcrumbs: Breadcrumbs[]) {
    this.breadcrumbs = breadcrumbs;
  }

  @Watch('dataManagementRoute')
  onRouterChanged() {
    this.breadcrumbs = [];
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.data-management-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;

  ::v-deep {
    @import '~@/themes/scss/di-variables.scss';
    @import '~bootstrap/scss/variables';
    @import '~@/themes/scss/data-builder/custom/_modal.scss';
    //@import '~@/themes/scss/data-builder/custom/_navbar.scss';
    //@import '~@/themes/scss/data-builder/custom/_dark-dashboard.scss';
    //@import '~@/themes/scss/data-builder/custom/dark-sidebar.scss';
    @import '~@/themes/scss/data-builder/custom/_misc.scss';

    .modal-body {
      > div {
        margin: 0;

        > div {
          margin: 0;
        }
      }
    }

    #chart-builder-modal {
      .config-panel {
        text-align: center !important;
      }
    }

    .data-management-body {
      flex: 1;
      margin: 24px 32px 24px 16px;
      overflow: hidden;

      @media (max-width: 767.98px) {
        margin: 24px 16px 24px 16px;
      }

      .data-management-body-content {
        margin-top: 16px;
        height: calc(100vh - 162px);
        display: flex;
      }

      .left-panel {
        background-color: var(--panel-background-color) !important;
        border-radius: 4px;
        margin-right: 16px;
        width: 20%;
        min-width: 260px;
        max-width: 320px;
      }

      .right-panel {
        overflow: hidden;
        background-color: var(--panel-background-color);
        width: 80%;
        height: 100%;
        padding: 16px;
        flex: 1;
        font-size: 16px;

        .data-management-tips {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          color: var(--text-color);
          font-size: 20px;

          .data-management-tips--icon {
            font-size: 40px;
            margin-bottom: 16px;
            line-height: 1;
            opacity: 0.5;
          }

          .data-management-tips--title {
            font-size: 14px;
            opacity: 0.5;
          }

          .data-management-tips--title.text-danger {
            opacity: 1;
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
body,
html,
#app {
  height: 100% !important;
}
</style>
