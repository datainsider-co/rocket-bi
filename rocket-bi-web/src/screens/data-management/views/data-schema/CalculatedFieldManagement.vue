<template>
  <StatusWidget class="position-relative" :status="status" :error="errorMessage">
    <vuescroll class="table-container">
      <table class="table table-sm">
        <thead>
          <tr class="text-nowrap">
            <th class="cell-20">
              <div v-if="calculatedFields.length > 0">Column ({{ calculatedFields.length }})</div>
              <div v-else>Column</div>
            </th>
            <th class="cell-20">Display Name</th>
            <th class="text-center cell-5">Nullable</th>
            <th class="cell-15">Type</th>
            <th class="cell-20">Description</th>
            <th class="cell-20">Default Value</th>
            <th class="text-center cell-5">Encryption</th>
            <th class="text-center cell-5">Action</th>
          </tr>
        </thead>
        <tbody>
          <!-- View -->
          <template>
            <tr
              v-for="column in calculatedFields"
              :key="column.name"
              @click="editCalculatedField(...arguments, syncedModel.table, column)"
              class="measure-field-item"
            >
              <td>
                {{ column.name }}
              </td>
              <td>
                {{ column.displayName }}
              </td>
              <td class="text-center">
                <img v-if="column.isNullable" alt="nullable" src="@/assets/icon/ic-16-check.svg" />
              </td>
              <td class="text-capitalize">
                {{ column.className }}
              </td>
              <td>
                <div v-if="column.description">{{ column.description }}</div>
                <div v-else>--</div>
              </td>
              <td>{{ getDefaultValue(column) }}</td>
              <td class="text-center">
                <div v-if="column.isEncrypted">On</div>
                <div v-else>Off</div>
              </td>
              <td class="text-center">
                <div class="h-100 d-flex align-items-center">
                  <i class="di-icon-edit btn-icon btn-icon-border p-0 mr-1" @click="editCalculatedField(...arguments, syncedModel.table, column)"></i>
                  <i class="di-icon-delete btn-icon btn-icon-border p-0" @click="showDeleteConfirmationModal(...arguments, syncedModel.table, column)"></i>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </vuescroll>
    <CalculatedFieldModal
      ref="calculatedFieldModal"
      @created="loadTableSchema(syncedModel.database.name, syncedModel.table.name, false)"
      @updated="loadTableSchema(syncedModel.database.name, syncedModel.table.name, false)"
    />
  </StatusWidget>
</template>

<script lang="ts">
import { DataSchemaModel, ViewMode } from '@/screens/data-management/views/data-schema/model';
import DiMultiChoice from '@/shared/components/common/DiMultiChoice.vue';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import InputSetting from '@/shared/settings/common/InputSetting.vue';
import { DateTimeFormatter } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';
import { BoolColumn, ColumnType, DatabaseInfo, DIException, TableSchema } from '@core/common/domain';
import { Column } from '@core/common/domain/model/column/Column.ts';
import { Component, Prop, Ref, Vue, PropSync, InjectReactive } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { Status } from '@/shared';
import CalculatedFieldModal from '@/screens/chart-builder/config-builder/database-listing/CalculatedFieldModal.vue';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { DeleteFieldData } from '@/screens/chart-builder/config-builder/database-listing/CalculatedFieldData';
import { PopupUtils } from '@/utils/PopupUtils';
import { Modals } from '@/utils/Modals';

@Component({
  components: {
    InputSetting,
    DiDatePicker,
    DiMultiChoice,
    CalculatedFieldModal
  }
})
export default class CalculatedFieldManagement extends Vue {
  private status: Status = Status.Loaded;
  private errorMessage = '';

  @Ref()
  private readonly calculatedFieldModal?: CalculatedFieldModal;

  @PropSync('model')
  private syncedModel?: DataSchemaModel;

  @Prop({ type: String, required: false, default: '' })
  private keyword!: string;

  private get calculatedFields(): Column[] {
    return (
      this.syncedModel?.table?.calculatedColumns?.filter(column => {
        if (this.keyword) {
          return column.isMaterialized() && (StringUtils.isIncludes(this.keyword, column.displayName) || StringUtils.isIncludes(this.keyword, column.name));
        } else {
          return column.isMaterialized();
        }
      }) ?? []
    );
  }

  private getDefaultValue(column: Column): string {
    switch (column.className) {
      case ColumnType.bool:
        return (column as BoolColumn).defaultValue !== undefined ? `${(column as BoolColumn).defaultValue}` : '--';
      case ColumnType.int8:
      case ColumnType.int16:
      case ColumnType.int32:
      case ColumnType.int64:
      case ColumnType.uint8:
      case ColumnType.uint16:
      case ColumnType.uint32:
      case ColumnType.uint64:
      case ColumnType.float:
      case ColumnType.float64:
      case ColumnType.double:
      case ColumnType.string:
        // @ts-ignore
        return column.defaultValue ? `${column.defaultValue}` : '--';
      case ColumnType.date:
      case ColumnType.datetime:
      case ColumnType.datetime64:
        // @ts-ignore
        return column.defaultValue ? DateTimeFormatter.formatAsDDMMYYYY(column.defaultValue) : '--';
      case ColumnType.array:
      case ColumnType.nested:
        // @ts-ignore
        return column.defaultValues ? `${column.defaultValues}` : `--`;
    }
  }

  mounted() {
    // if (this.model?.database && this.model?.table) {
    //   this.loadTableSchema(this.model.table);
    // }
  }

  showUpdating() {
    this.status = Status.Updating;
  }

  showLoading() {
    this.status = Status.Loading;
  }

  showLoaded() {
    this.status = Status.Loaded;
  }

  showError(ex: DIException) {
    this.status = Status.Error;
    this.errorMessage = ex.getPrettyMessage();
  }

  private async loadTableSchema(dbName: string, tblName: string, force = true) {
    try {
      force ? this.showLoading() : this.showUpdating();
      await DatabaseSchemaModule.reload(dbName);
      await this.updateRenderData(dbName, tblName);
      this.showLoaded();
    } catch (e) {
      const ex = DIException.fromObject(e);
      Log.error('MeasureFieldManagement::loadTableSchema::error::', ex.message);
      this.showError(ex);
    }
  }

  private async updateRenderData(dbName: string, tblName: string): Promise<void> {
    const databaseInfo: DatabaseInfo = await DatabaseSchemaModule.loadDatabaseInfo({ dbName: dbName });
    const tableSchema: TableSchema | undefined = await DatabaseSchemaModule.loadTableSchema({ dbName: dbName, tableName: tblName });
    this.syncedModel = {
      database: databaseInfo,
      table: tableSchema
    };
  }

  private editCalculatedField(mouseEvent: MouseEvent, tableSchema: TableSchema, column: Column) {
    mouseEvent.stopPropagation();
    this.calculatedFieldModal?.showEditModal(tableSchema, column, true);
  }

  public addCalculatedField() {
    this.calculatedFieldModal?.showCreateModal(this.syncedModel!.table!, true);
  }

  private showDeleteConfirmationModal(event: MouseEvent, tableSchema: TableSchema, column: Column) {
    event.stopPropagation();
    Modals.showConfirmationModal(`Are you sure you want to delete measure field "${column.name}"?`, {
      onOk: () => this.deleteCalculatedField(tableSchema, column)
    });
  }

  private async deleteCalculatedField(tableSchema: TableSchema, column: Column): Promise<void> {
    try {
      this.showUpdating();
      const deletingFieldData: DeleteFieldData = {
        dbName: tableSchema.dbName,
        tblName: tableSchema.name,
        fieldName: column.name
      };
      await DatabaseSchemaModule.deleteCalculatedField(deletingFieldData);
      await DatabaseSchemaModule.reload(tableSchema.dbName);
      await this.updateRenderData(tableSchema.dbName, tableSchema.name);
    } catch (ex) {
      PopupUtils.showError(`Can not delete column ${column.displayName}`);
      const exception = DIException.fromObject(ex);
      Log.error('CalculatedFieldManagement::deleteCalculatedField::exception', exception);
    } finally {
      this.showLoaded();
    }
  }
}
</script>

<style lang="scss">
.measure-field-item {
  cursor: pointer;

  &:hover {
    background-color: var(--hover-color);
  }
}
</style>
