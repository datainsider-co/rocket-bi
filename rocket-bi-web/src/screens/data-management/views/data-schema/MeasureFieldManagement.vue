<template>
  <StatusWidget class="position-relative" :status="status" :error="errorMessage">
    <vuescroll class="table-container">
      <table class="table table-sm">
        <thead>
          <tr class="text-nowrap">
            <th class="cell-20">
              <div v-if="syncedModel.table.expressionColumns.length > 0">Column ({{ syncedModel.table.expressionColumns.length }})</div>
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
        <tbody v-if="syncedModel && syncedModel.table">
          <!-- View -->
          <template>
            <tr
              v-for="column in searchColumns"
              :key="column.name"
              @click="editMeasureField(...arguments, syncedModel.table, column)"
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
                  <i class="di-icon-edit btn-icon btn-icon-border p-0 mr-1" @click="editMeasureField(...arguments, syncedModel.table, column)"></i>
                  <i class="di-icon-delete btn-icon btn-icon-border p-0" @click="showDeleteConfirmationModal(...arguments, syncedModel.table, column)"></i>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </vuescroll>
    <CalculatedFieldModal ref="calculatedFieldModal" @created="loadSchema(syncedModel.table, false)" @updated="loadSchema(syncedModel.table, false)" />
  </StatusWidget>
</template>

<script lang="ts">
import { DataSchemaModel } from '@/screens/data-management/views/data-schema/model';
import DiMultiChoice from '@/shared/components/common/DiMultiChoice.vue';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import InputSetting from '@/shared/settings/common/InputSetting.vue';
import { DateTimeFormatter } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';
import { BoolColumn, ColumnType, DatabaseSchema, DIException, TableSchema } from '@core/common/domain';
import { Column } from '@core/common/domain/model/column/Column.ts';
import { Component, InjectReactive, Mixins, Prop, PropSync, Ref, Vue } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { DeleteFieldData } from '@/screens/chart-builder/config-builder/database-listing/CalculatedFieldData';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { PopupUtils } from '@/utils/PopupUtils';
import CalculatedFieldModal from '@/screens/chart-builder/config-builder/database-listing/CalculatedFieldModal.vue';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Status } from '@/shared';
import { Modals } from '@/utils/Modals';
import DataManagementChild from '@/screens/data-management/views/DataManagementChild';

@Component({
  components: {
    StatusWidget,
    InputSetting,
    DiDatePicker,
    DiMultiChoice,
    CalculatedFieldModal
  }
})
export default class MeasureFieldManagement extends Vue {
  private status: Status = Status.Loaded;
  private errorMessage = '';
  // private tableSchema: TableSchema = TableSchema.empty();

  @PropSync('model')
  private syncedModel?: DataSchemaModel;

  @Prop({ type: String, required: false, default: '' })
  private keyword!: string;

  @Ref()
  private readonly calculatedFieldModal?: CalculatedFieldModal;

  @InjectReactive('loadDatabaseSchema')
  loadDatabaseSchema?: (dbName: string) => Promise<DatabaseSchema>;

  mounted() {
    // if (this.syncedModel?.database && this.syncedModel?.table) {
    //   this.loadSchema(this.syncedModel.table);
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

  private async loadSchema(tableSchema: TableSchema, force = true) {
    try {
      force ? this.showLoading() : this.showUpdating();
      if (this.loadDatabaseSchema) {
        const dbSchema = await this.loadDatabaseSchema(tableSchema.dbName);
        this.updateRenderData(dbSchema, tableSchema.name);
      }
      this.showLoaded();
    } catch (e) {
      const ex = DIException.fromObject(e);
      Log.error('MeasureFieldManagement::loadSchema::error::', ex.message);
      this.showError(ex);
    }
  }

  private updateRenderData(dbSchema: DatabaseSchema, tblName: string) {
    const tableSchema: TableSchema | undefined = dbSchema.tables.find(tbl => tbl.name === tblName && tbl.dbName === dbSchema.name);
    if (tableSchema) {
      Log.debug('updateRenderData::', tableSchema);
      this.syncedModel = { database: dbSchema, table: tableSchema };
    }
  }

  private get searchColumns(): Column[] {
    return (
      this.syncedModel?.table?.expressionColumns.filter(column => {
        if (this.keyword) {
          return StringUtils.isIncludes(this.keyword, column.displayName) || StringUtils.isIncludes(this.keyword, column.name);
        } else {
          return true;
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

  private editMeasureField(event: MouseEvent, tableSchema: TableSchema, column: Column) {
    event.stopPropagation();
    this.calculatedFieldModal?.showEditModal(tableSchema, column, false);
  }

  public addMeasureField() {
    this.calculatedFieldModal?.showCreateModal(this.syncedModel!.table!, false);
  }

  private showDeleteConfirmationModal(event: MouseEvent, tableSchema: TableSchema, column: Column) {
    event.stopPropagation();
    Modals.showConfirmationModal(`Are you sure you want to delete measure field "${column.name}"?`, {
      onOk: () => this.deleteMeasureField(tableSchema, column)
    });
  }

  private async deleteMeasureField(tableSchema: TableSchema, column: Column) {
    try {
      Log.debug(tableSchema);
      this.showUpdating();
      const deletingFieldData: DeleteFieldData = {
        dbName: tableSchema.dbName,
        tblName: tableSchema.name,
        fieldName: column.name
      };
      await DatabaseSchemaModule.deleteMeasurementField(deletingFieldData);
      if (this.loadDatabaseSchema) {
        const dbSchema = await this.loadDatabaseSchema(tableSchema.dbName);
        this.updateRenderData(dbSchema, tableSchema.name);
      }
    } catch (ex) {
      PopupUtils.showError(`Can not delete column ${column.displayName}`);
      const exception = DIException.fromObject(ex);
      Log.error('deleteMeasureField::exception', exception);
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
