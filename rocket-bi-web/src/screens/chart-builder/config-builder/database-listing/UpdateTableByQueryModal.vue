<template>
  <BModal id="update-table-by-query" ref="modal" no-close-on-backdrop centered @hidden="resetModel" actionName="Update" size="max" hide-footer>
    <template #modal-header="{cancel}">
      <div class="custom-header d-flex w-100 align-items-center">
        <h4 v-if="tableSchema" class="mb-0">
          <!--          Schema Builder-->
          <div class="text-truncate">
            <div class="d-flex align-items-center">
              <i class="di-icon-database mr-2"></i>
              <b class="text-truncate" :title="tableSchema.dbName">{{ tableSchema.dbName }}</b>
              <div class="fa-rotate-180 d-flex align-items-center">
                <i class="text-14px mx-2 di-icon-arrow-left"></i>
              </div>
              <div class="text-truncate" :title="tableSchema.name">{{ tableSchema.name }}</div>
            </div>
          </div>
        </h4>

        <div class="header-actions d-flex align-items-center ml-auto">
          <DiButton border class="mr-3" @click.prevent="cancel()">
            Cancel
          </DiButton>
          <DiButton :disabled="isLoading" class="btn btn-sm btn-primary px-3" @click.prevent="handleUpdateTableSchema" title="Update">
            <i v-if="isLoading" class="fa fa-spin fa-spinner"></i>
          </DiButton>
        </div>
      </div>
    </template>
    <div class="update-table-by-query-container w-100 d-inline-block">
      <div class="data-builder">
        <div class="d-flex flex-row data-builder-body">
          <DatabaseTreeView
            ref="databaseTree"
            :isDisableCreateMode="true"
            :mode="databaseTreeViewMode.QueryMode"
            :loading="loadingDatabaseSchemas"
            :schemas="databaseSchemas"
            class="update-table-by-query-container-database-tree-view"
            show-columns
            @clickTable="handleClickTable"
            @clickField="handleClickField"
            @reload="reloadDatabaseSchemas"
          ></DatabaseTreeView>
          <div class="query-builder-body overflow-auto">
            <QueryComponent
              ref="queryComponent"
              v-if="tableSchema"
              :showAdHocAnalysis="false"
              :default-query="query"
              :formula-controller="formulaController"
              :editorController="editorController"
              :show-create-table-button="false"
              :is-query-on-first-time="true"
              :show-ad-hoc-analysis="false"
            />
          </div>
        </div>
      </div>
    </div>
  </BModal>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { DatabaseInfo, DIException, Field, TableSchema } from '@core/common/domain';
import DiButton from '@/shared/components/common/DiButton.vue';
import { DataManagementModule } from '@/screens/data-management/store/DataManagementStore';
import { Log } from '@core/utils';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { BModal } from 'bootstrap-vue';
import { FormulaSuggestionModule } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { QueryFormulaController } from '@/shared/fomula/QueryFormulaController';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { EditorController } from '@/shared/fomula/EditorController';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { DatabaseSchemaModule, SchemaReloadMode } from '@/store/modules/data-builder/DatabaseSchemaStore';
import DatabaseTreeView from '@/screens/data-management/components/database-tree-view/DatabaseTreeView.vue';
import { DatabaseTreeViewMode } from '@/screens/data-management/components/database-tree-view/DatabaseTreeView';
import { PopupUtils } from '@/utils/PopupUtils';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { ConnectionModule } from '@/screens/organization-settings/stores/ConnectionStore';
import { ConnectorType } from '@core/connector-config';
import { Di } from '@core/common/modules';
import { FormulaControllerResolver } from '@/shared/fomula/builder/FormulaControllerResolver';
// import QueryComponentCtrl from '@/screens/data-management/components/QueryComponent.ts';

const QueryComponent = () => import('@/screens/data-management/components/QueryComponent.vue');

@Component({
  components: {
    QueryComponent,
    DiButton,
    DatabaseTreeView
  }
})
export default class UpdateTableByQueryModal extends Vue {
  private readonly databaseTreeViewMode = DatabaseTreeViewMode;
  private tableSchema: TableSchema | null = null;
  private query = '';
  private formulaController: FormulaController | null = null;
  private editorController = new EditorController();
  private isLoading = false;
  private loadingDatabaseSchemas = false;

  @Ref()
  private readonly modal!: BModal;

  @Ref()
  private readonly queryComponent!: any;

  @Ref()
  private databaseTree!: DatabaseTreeView;

  protected resetModel(): void {
    this.tableSchema = null;
    this.query = '';
    this.isLoading = false;
  }

  private get databaseSchemas(): DatabaseInfo[] {
    return DatabaseSchemaModule.databaseInfos;
  }

  private initFormulaController() {
    const sourceType: ConnectorType = ConnectionModule.source?.className ?? ConnectorType.Clickhouse;
    const syntax = Di.get(FormulaControllerResolver).getSyntax(sourceType);
    FormulaSuggestionModule.initSuggestFunction({
      fileNames: [syntax]
    });
    this.formulaController = Di.get(FormulaControllerResolver).createController(
      sourceType,
      FormulaSuggestionModule.allFunctions,
      DatabaseSchemaModule.databaseInfos
    );
  }

  private async initDatabase() {
    try {
      this.loadingDatabaseSchemas = true;
      await DatabaseSchemaModule.loadShortDatabaseInfos(false);
    } catch (ex) {
      Log.error('UpdateTableByQueryModal:initDatabase::error::', ex.message);
    } finally {
      this.loadingDatabaseSchemas = false;
    }
  }

  private async reloadDatabaseSchemas() {
    try {
      this.loadingDatabaseSchemas = true;
      await DatabaseSchemaModule.reloadDatabaseInfos(SchemaReloadMode.OnlyDatabaseHasTable);
    } catch (e) {
      Log.error('DatabaseManagement:loadData::error::', e.message);
    } finally {
      this.loadingDatabaseSchemas = false;
    }
  }

  async initData() {
    await this.initDatabase();
    this.$nextTick(() => {
      if (_BuilderTableSchemaStore.databaseSchema) {
        this.databaseTree?.selectDatabase(_BuilderTableSchemaStore.databaseSchema);
      }
    });
    await this.initFormulaController();
  }

  show(tableSchema: TableSchema) {
    this.tableSchema = tableSchema;
    this.query = tableSchema.query ?? '';
    this.modal.show();
    this.initData();
  }

  private handleClickField(field: Field) {
    const query = FormulaUtils.toQuery(field.fieldName);
    this.editorController.appendText(query);
  }

  private handleClickTable(table: TableSchema) {
    const query = FormulaUtils.toQuery(table.dbName, table.name);
    this.editorController.appendText(query);
  }

  getQuery(): string {
    return this.queryComponent.currentQuery;
  }

  @Track(TrackEvents.TableSubmitUpdateSchemaByQuery, {
    database_name: (_: UpdateTableByQueryModal) => _.tableSchema!.dbName,
    table_name: (_: UpdateTableByQueryModal) => _.tableSchema?.name,
    query: (_: UpdateTableByQueryModal) => _.getQuery()
  })
  private async handleUpdateTableSchema() {
    try {
      this.isLoading = true;
      const tableSchema = await DataManagementModule.createTableFromQuery({
        dbName: this.tableSchema!.dbName,
        tblDisplayName: this.tableSchema!.name,
        tblName: this.tableSchema!.name,
        query: this.getQuery(),
        isOverride: true,
        tableType: this.tableSchema!.tableType
      });
      if (tableSchema) {
        await DatabaseSchemaModule.reload(tableSchema.dbName);
        await _BuilderTableSchemaStore.selectDatabase(tableSchema.dbName);
        _BuilderTableSchemaStore.expandTables([tableSchema.name]);
      }
      this.isLoading = false;
      this.modal.hide();
    } catch (e) {
      const ex = new DIException(e);
      Log.error('UpdateTableByQueryModal::handleUpdateTableSchema::error::', ex.getPrettyMessage);
      PopupUtils.showError('Can not update table with this query');
    } finally {
      this.isLoading = false;
    }
  }
}
</script>
<!--fixme:check css-->
<!--<style lang="scss" scoped src="@/screens/chart-builder/data-cook/QueryBuilder.scss"></style>-->
<style lang="scss">
#update-table-by-query {
  .data-builder-body .query-builder-body {
    background: var(--secondary);
    border-radius: 4px;
    flex: 1;
  }
  .update-table-by-query-container {
    height: calc(100%);

    &-database-tree-view {
      height: calc(100%);
      width: 250px !important;
      margin-right: 0 !important;
    }
  }

  .modal-body {
    overflow: hidden;
  }

  .modal-dialog {
    height: 88vh;
  }

  > .modal-max {
    height: 100vh;
    margin: auto;

    //max-width: calc(80vh / 0.5625);
    max-width: 100%;
    min-width: 900px;
    width: 85% !important;

    .modal-header {
      background: #f2f2f7;

      > .custom-header {
        .header-actions {
          .di-button {
            height: 25px;
          }
        }
      }
    }

    > .modal-content {
      height: 88vh;
      min-height: 640px;
      overflow: auto;

      > .modal-body {
        height: inherit;
        padding: 16px;
        background: #f2f2f7;
      }
    }
  }

  .data-builder {
    min-width: 0;
    padding: 0;

    & > .data-builder-body {
      width: 100%;
      height: calc(100%);
      $width: 223px;

      .database-panel {
        background-color: var(--secondary);
        flex: none;
        width: 223px;
      }

      .database-listing .schema-listing {
        margin-top: 10px;
      }

      .query-builder-body {
        width: calc(100% - #{$width});
      }
    }

    .btn-query {
      width: auto;
      height: auto;
      padding: 4px 14px;
    }

    .formula-completion-input {
      background-color: transparent;

      > .padding-top {
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
      }

      & + div:not(.formula-completion-input) {
        background-color: var(--editor-color);
        padding: 12px;
        margin-top: 0;
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
      }

      .monaco-editor {
        border-radius: 0;
      }
    }

    .query-result .table-container {
      box-shadow: none;
    }
  }
}
</style>
