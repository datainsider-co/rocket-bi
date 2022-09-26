<template>
  <DiCustomModal ref="createModal" class="di-modal" ok-title="Create" size="md" :title="title" :isLoading="isLoading" @onClickOk="handleCreateTable">
    <div class="create-table-modal-container">
      <div class="d-flex flex-wrap align-items-center">
        <div class="title">To Database:</div>
        <div class="fill-content">
          <DiDropdown
            :id="genDropdownId('to-databases')"
            v-model="selectedDatabase"
            :data="databaseInfos"
            class="database-select"
            :disabled="isUpdateMode"
            labelProps="displayName"
            placeholder="Select database"
            valueProps="name"
          ></DiDropdown>
          <span v-if="$v.selectedDatabase.$error">
            <div v-if="!$v.selectedDatabase.required" class="error-message">Field database name is required.</div>
          </span>
        </div>
      </div>
      <div class="d-flex align-items-center">
        <div class="title">Table Name:</div>
        <div class="fill-content">
          <b-input
            :id="genInputId('table-name')"
            v-model="tableDisplayName"
            :class="{ disabled: isUpdateMode }"
            :disabled="isUpdateMode"
            placeholder="table name"
            type="text"
            @keydown.enter.prevent="handleCreateTable"
          />
          <div v-if="$v.tableDisplayName.$error">
            <div v-if="!$v.tableDisplayName.required" class="error-message">Field table name is required.</div>
          </div>
        </div>
      </div>
      <div class="d-flex flex-wrap align-items-center">
        <div class="title">Table Type:</div>
        <div class="fill-content">
          <DiButtonGroup :buttons="buttonInfos" class="di-btn-group" />
        </div>
        <div v-if="$v.tableType.$error">
          <div v-if="!$v.tableType.required" class="error-message">Table Type is required.</div>
        </div>
      </div>
    </div>
    <template v-slot:modal-footer="{ cancel, ok }">
      <div class="d-flex w-100 m-0 p-1">
        <DiButton border class="flex-fill h-42px mr-2" variant="secondary" @click="cancel()" title="Cancel"></DiButton>
        <DiButton primary :disabled="isLoading" class="flex-fill h-42px submit-button" @click="ok()">
          <div class="d-flex flex-shrink-1 align-items-center">
            <i v-if="isLoading" class="fa fa-spin fa-spinner"></i>
            <div>
              {{ actionName }}
            </div>
          </div>
        </DiButton>
      </div>
    </template>
  </DiCustomModal>
</template>

<script lang="ts">
import { DataManagementModule } from '@/screens/DataManagement/store/data_management.store';
import { Track } from '@/shared/anotation';
import DiButtonGroup, { ButtonInfo } from '@/shared/components/Common/DiButtonGroup.vue';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import MessageContainer from '@/shared/components/MessageContainer.vue';
import { Routers } from '@/shared/enums/Routers';
import { DatabaseSchemaModule } from '@/store/modules/data_builder/DatabaseSchemaStore';
import { PopupUtils } from '@/utils/popup.utils';
import { RouterUtils } from '@/utils/RouterUtils';
import { StringUtils } from '@/utils/string.utils';
import { DIException } from '@core/domain/Exception';
import { DatabaseInfo, TableSchema, TableType } from '@core/domain/Model';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { required } from 'vuelidate/lib/validators';

@Component({
  components: { MessageContainer, DiCustomModal, DiButtonGroup },
  validations: {
    tableDisplayName: { required },
    selectedDatabase: { required },
    tableType: { required }
  }
})
export default class TableCreationFromQueryModal extends Vue {
  private readonly trackEvents = TrackEvents;

  @Prop({ required: true })
  query!: string;
  isUpdateMode = false;
  private tableDisplayName = '';
  private tableName = '';
  private selectedDatabase = this.defaultSelectedDatabase;
  private isLoading = false;
  private tableType: TableType = TableType.View;
  @Ref()
  private createModal?: DiCustomModal;

  get databaseInfos(): DatabaseInfo[] {
    return DatabaseSchemaModule.databaseInfos || [];
  }

  private get defaultSelectedDatabase(): string {
    return DatabaseSchemaModule.dbNameSelected ?? '';
  }

  private get actionName() {
    return this.isUpdateMode ? 'Update' : 'Create';
  }

  private get title() {
    return this.isUpdateMode ? 'Update Table From Query' : 'Create Table From Query';
  }

  show() {
    this.isUpdateMode = false;
    this.createModal?.show();
    this.reset();
  }

  showUpdateSchemaModal(databaseName: string, tableDisplayName: string, tableName: string, tableType: TableType) {
    this.isUpdateMode = true;
    this.tableDisplayName = tableDisplayName;
    this.tableName = tableName;
    this.selectedDatabase = databaseName;
    this.tableType = tableType;
    this.createModal?.show();
  }

  hide() {
    this.createModal?.hide();
    this.reset();
  }

  private handleCreateTable(e: MouseEvent) {
    e.preventDefault();
    if (this.validateTableData()) {
      this.isLoading = true;
      this.isUpdateMode ? this.updateTable() : this.createTable();
    }
  }

  @Track(TrackEvents.TableViewSubmitCreate, {
    database_name: (_: TableCreationFromQueryModal) => _.selectedDatabase,
    table_name: (_: TableCreationFromQueryModal) => StringUtils.toSnakeCase(_.tableDisplayName),
    query: (_: TableCreationFromQueryModal) => _.query
  })
  private async createTable() {
    try {
      const tableSchema = await DataManagementModule.createTableFromQuery({
        dbName: this.selectedDatabase,
        tblDisplayName: this.tableDisplayName,
        tblName: StringUtils.toSnakeCase(this.tableDisplayName),
        query: this.query,
        isOverride: false,
        tableType: this.tableType
      });
      await this.handleCreateTableSuccess(tableSchema);
    } catch (ex) {
      this.handleCreateTableError(ex);
    } finally {
      this.isLoading = false;
    }
  }

  private updateTable() {
    DataManagementModule.createTableFromQuery({
      dbName: this.selectedDatabase,
      tblDisplayName: this.tableDisplayName,
      tblName: this.tableName,
      query: this.query,
      isOverride: true,
      tableType: this.tableType
    })
      .then(tableSchema => this.handleUpdateTableSuccess(tableSchema))
      .catch(this.handleCreateTableError)
      .finally(() => {
        this.isLoading = false;
      });
  }

  validateTableData() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  reset() {
    this.tableDisplayName = '';
    this.selectedDatabase = '';
    this.tableName = '';
    this.tableType = TableType.View;
    this.$v.$reset();
  }

  private handleCreateTableError(ex: any) {
    const exception = DIException.fromObject(ex);
    PopupUtils.showError(exception.message);
  }

  private async handleCreateTableSuccess(tableSchema: TableSchema) {
    await DatabaseSchemaModule.reload(tableSchema.dbName);
    this.hide();
    await RouterUtils.to(Routers.DataSchema, {
      query: {
        database: tableSchema.dbName,
        table: tableSchema.name
      }
    });
  }

  private async handleUpdateTableSuccess(tableSchema: TableSchema) {
    await DatabaseSchemaModule.reload(tableSchema.dbName);
    this.hide();
    await RouterUtils.to(Routers.DataSchema, {
      query: {
        database: tableSchema.dbName,
        table: tableSchema.name
      }
    });
  }

  @Watch('selectedDatabase')
  onSelectedDatabase(databaseName: string) {
    TrackingUtils.track(TrackEvents.SelectDatabase, { database_name: databaseName });
  }

  private get buttonInfos(): ButtonInfo[] {
    return [
      {
        displayName: 'View',
        isActive: this.tableType === TableType.View,
        onClick: () => this.setTableType(TableType.View)
      },
      {
        displayName: 'Materialized',
        isActive: this.tableType === TableType.Materialized,
        onClick: () => this.setTableType(TableType.Materialized)
      }
    ];
  }

  private setTableType(type: TableType) {
    if (this.tableType !== type) {
      this.tableType = type;
    }
  }
}
</script>

<style lang="scss" scoped>
.fill-content {
  width: calc(100% - 100px);
}

.title {
  width: 100px;
}

.create-table-modal-container {
  > div {
    margin-bottom: 16px;

    &:nth-last-child(1) {
      margin-bottom: 0;
    }
  }

  input {
    height: 34px;
    padding: 10px;
  }

  input.disabled {
    background: var(--input-background-color);
  }
}

.database-select {
  ::v-deep {
    align-items: center;

    button {
      height: 34px;

      > div {
        height: 34px !important;
      }
    }
  }
}

.submit-button {
  max-width: 230px;

  > div {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;

    i {
      margin-right: 8px;
    }
  }

  ::v-deep {
    display: flex;
    align-items: center;
    justify-content: center;

    .title {
      display: none;
    }
  }
}

.error-message {
  color: var(--danger);
}

.di-modal {
}
</style>
