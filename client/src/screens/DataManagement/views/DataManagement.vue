<template>
  <LayoutWrapper v-if="isNotDatabaseRoute" no-sidebar class="data-management-container">
    <LayoutContent>
      <LayoutHeader :title="dataManagementRoute.title" :icon="dataManagementRoute.icon"></LayoutHeader>
      <router-view></router-view>
    </LayoutContent>
  </LayoutWrapper>
  <router-view v-else></router-view>
</template>

<script lang="ts">
import { Component, Provide, ProvideReactive, Vue } from 'vue-property-decorator';
import HeaderBar from '@/shared/components/HeaderBar.vue';
import { DatabaseSchemaModule } from '@/store/modules/data_builder/DatabaseSchemaStore';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { DatabaseSchema } from '@core/domain/Model';
import DataComponents from '@/screens/DataManagement/components/data_component';
import { LoggedInScreen } from '@/shared/components/VueHook/LoggedInScreen';
import { Routers } from '@/shared';
import { Log } from '@core/utils';
import DiPage from '@/screens/LakeHouse/Components/QueryBuilder/DiPage.vue';
import { LayoutContent, LayoutWrapper, LayoutHeader } from '@/shared/components/LayoutWrapper';
import { ListUtils } from '@/utils';

Vue.use(DataComponents);

@Component({
  components: {
    HeaderBar,
    DiPage,
    LayoutWrapper,
    LayoutContent,
    LayoutHeader
  }
})
export default class DataManagement extends LoggedInScreen {
  private initedDatabaseSchemasCallbacks: Function[] = [];
  private initedDatabaseSchemas = false;

  private get isNotDatabaseRoute() {
    Log.debug('DataManagement::RouteName::', this.$route.name);
    return !(this.$route.name === Routers.AllDatabase || this.$route.name === Routers.TrashDatabase);
  }

  @ProvideReactive('loadingDatabaseSchemas') private loadingDatabaseSchemas = false;

  @Provide('onInitedDatabaseSchemas')
  private onInitedDatabaseSchemas(callback: Function) {
    if (!this.initedDatabaseSchemasCallbacks.includes(callback)) {
      this.initedDatabaseSchemasCallbacks.push(callback);
    }
    if (this.initedDatabaseSchemas) {
      callback();
    }
  }

  @Provide('offInitedDatabaseSchemas')
  private offInitedDatabaseSchemas(callback: Function) {
    const idx = this.initedDatabaseSchemasCallbacks.indexOf(callback);
    if (idx >= 0) {
      this.initedDatabaseSchemasCallbacks.splice(idx, 1);
    }
  }

  @ProvideReactive('formulaController')
  private formulaController: FormulaController | null = null;

  @ProvideReactive('databaseSchemas')
  private get databaseSchemas(): DatabaseSchema[] {
    return DatabaseSchemaModule.databaseSchemas;
  }

  @Provide('findSchema')
  private findData(dbName: string, tableName: string, columnName: string) {
    const database = this.databaseSchemas.find(db => db.name === dbName);
    let table = null;
    let column = null;
    if (database && tableName) {
      table = database.tables.find(t => t.name === tableName);
    }
    if (table && columnName) {
      column = table.columns.find(c => c.name === columnName);
    }
    return {
      database,
      table,
      column
    };
  }

  @Provide('isExistDatabase')
  private isExistDatabase(dbName: string) {
    const database = this.databaseSchemas.find(db => db.name === dbName);
    return database ? true : false;
  }

  private get databaseName(): string {
    return ((this.$route.query?.database as any) || '') as string;
  }

  async mounted() {
    try {
      if (ListUtils.isEmpty(DatabaseSchemaModule.databaseInfos)) {
        this.loadingDatabaseSchemas = true;
        await DatabaseSchemaModule.loadAllDatabaseInfos();
      }
      if (DatabaseSchemaModule.databaseSchemas.length < DatabaseSchemaModule.databaseInfos.length) {
        this.loadingDatabaseSchemas = true;
        await DatabaseSchemaModule.loadAllDatabaseSchemas();
      }
      if (this.databaseName && !this.isExistDatabase(this.databaseName)) {
        await DatabaseSchemaModule.handleGetDatabaseSchema(this.databaseName);
      }
    } catch (ex) {
      Log.error('DataManagement::mounted::error', ex.message, ex);
    }

    this.loadingDatabaseSchemas = false;
    this.initedDatabaseSchemas = true;
    this.initedDatabaseSchemasCallbacks.forEach(callback => callback());
  }

  @Provide('loadDatabases')
  private async loadData() {
    try {
      this.loadingDatabaseSchemas = true;
      await DatabaseSchemaModule.loadAllDatabaseInfos();
      this.loadingDatabaseSchemas = true;
      await DatabaseSchemaModule.loadAllDatabaseSchemas();
      this.loadingDatabaseSchemas = false;
      this.initedDatabaseSchemas = true;
      this.initedDatabaseSchemasCallbacks.forEach(callback => callback());
    } catch (e) {
      Log.error('DatabaseManagement:loadData::error::', e.message);
    }
  }

  @Provide('loadDatabaseSchema')
  private async loadDatabaseSchema(dbName: string): Promise<DatabaseSchema> {
    this.loadingDatabaseSchemas = true;
    const dbSchema: DatabaseSchema = await DatabaseSchemaModule.selectDatabase(dbName);
    this.loadingDatabaseSchemas = false;
    return dbSchema;
  }

  private get dataManagementRoute() {
    switch (this.$route.name) {
      case Routers.QueryEditor:
        return {
          icon: 'di-icon-query-editor',
          title: 'Query Analysis'
        };
      case Routers.DataRelationship:
        return {
          icon: 'di-icon-relationship',
          title: 'Relationship'
        };
      default:
        return {
          icon: 'di-icon-schema',
          title: 'Schema'
        };
    }
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
