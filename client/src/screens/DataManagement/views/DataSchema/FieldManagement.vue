<template>
  <StatusWidget :status="status">
    <vuescroll class="table-container">
      <table class="table table-sm">
        <thead>
          <tr class="text-nowrap">
            <th class="cell-20">
              <div v-if="model.table.columns.length > 0">Column ({{ model.table.columns.length }})</div>
              <div v-else>Column</div>
            </th>
            <th class="cell-20">Display Name</th>
            <th class="text-center cell-5">Nullable</th>
            <th class="cell-15">Type</th>
            <th class="cell-20">Description</th>
            <th class="cell-20">Default Value</th>
            <th class="text-center cell-5">Encryption</th>
            <!--          <th v-if="!isSchemaMode" class="text-center cell-5">Action</th>-->
          </tr>
        </thead>
        <tbody>
          <!-- View -->
          <template v-if="isSchemaMode">
            <tr v-for="column in searchColumns" :key="column.name">
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
            </tr>
          </template>
          <!-- Action -->
          <template v-else>
            <!-- Update -->
            <tr v-for="column in cloneTable.columns" :key="column.name">
              <td :class="{ disabled: isDeleteColumn(column) }" class="cell-20">
                {{ column.name }}
              </td>
              <td :class="{ disabled: isDeleteColumn(column) }">
                <DiInput
                  :disabled="true"
                  :id="genInputId('column-display-name')"
                  :maxLength="255"
                  :value.sync="column.displayName"
                  placeholder="Input column display name"
                />
              </td>
              <td :class="{ disabled: isDeleteColumn(column) }" class="text-center">
                <DiMultiChoice :value.sync="column.isNullable" />
              </td>
              <td :class="{ disabled: isDeleteColumn(column) }" class="text-capitalize dropdown-cell">
                <DiDropdown
                  :appendAtRoot="true"
                  :data="typeOptions"
                  :value="column.className"
                  boundary="window"
                  labelProps="displayName"
                  valueProps="id"
                  @selected="changeType(column, arguments[0], true)"
                />
              </td>
              <td :class="{ disabled: isDeleteColumn(column) }">
                <DiInput :id="genInputId('column-description')" :maxLength="255" :value.sync="column.description" placeholder="Input description" />
              </td>
              <td :class="{ disabled: isDeleteColumn(column) }" class="default-value-cell dropdown-cell">
                <DiDropdown
                  v-if="isBoolColumn(column.className)"
                  v-model="column.defaultValue"
                  :appendAtRoot="true"
                  :data="boolOptions"
                  boundary="window"
                  @selected="changeBoolDefaultValue(column, ...arguments)"
                  labelProps="displayName"
                  valueProps="id"
                />
                <DiInput
                  v-else-if="isTextColumn(column.className)"
                  :id="genInputId('column-default-value')"
                  :maxLength="255"
                  :value.sync="column.defaultValue"
                  placeholder="Input default value"
                />
                <DiDatePicker
                  v-else-if="isDateColumn(column.className)"
                  :date="getDate(column.defaultValue)"
                  :isShowIconDate="false"
                  failureText="--"
                  formatter="DD/MM/YYYY"
                  placeholder="Input default value"
                  @change="changeDate(column, arguments[0], true)"
                />
                <div v-else>{{ column.defaultValues }}</div>
              </td>
              <td :class="{ disabled: !isStringColumn(column.className) }" class="text-center">
                <DiToggle v-if="isStringColumn(column.className)" :value.sync="column.isEncrypted" @onSelected="handleToggleEncrypt(column, ...arguments)" />
                <DiToggle v-else :disable="true" :value.sync="column.isEncrypted" v-b-tooltip="`Feature only support with string column`" />
              </td>

              <!--            <td class="text-center">-->
              <!--              <i class="di-icon-delete btn-icon btn-icon-border" @click="deleteColumn(index, false)"></i>-->
              <!--            </td>-->
            </tr>
            <!-- Create -->
            <tr v-for="(column, index) in tempColumns" :key="index">
              <td class="cell-20">
                <DiInput :id="genInputId('column-name')" :maxLength="255" :value.sync="column.name" placeholder="Input name" />
              </td>
              <td>
                <DiInput :id="genInputId('column-display-name')" :maxLength="255" :value.sync="column.displayName" placeholder="Input column display name" />
              </td>
              <td class="text-center">
                <DiMultiChoice :value.sync="column.isNullable" />
              </td>
              <td class="text-capitalize dropdown-cell">
                <DiDropdown
                  :appendAtRoot="true"
                  :data="typeOptions"
                  :value="column.className"
                  boundary="window"
                  labelProps="displayName"
                  valueProps="id"
                  @selected="changeType(column, arguments[0], false)"
                />
              </td>
              <td>
                <DiInput :id="genInputId('column-description')" :maxLength="255" :value.sync="column.description" placeholder="Input description" />
              </td>
              <td class="default-value-cell dropdown-cell">
                <DiDropdown
                  v-if="isBoolColumn(column.className)"
                  v-model="column.defaultValue"
                  :appendAtRoot="true"
                  :data="boolOptions"
                  boundary="window"
                  @selected="changeBoolDefaultValue(column, ...arguments)"
                  labelProps="displayName"
                  valueProps="id"
                />
                <DiInput
                  v-else-if="isTextColumn(column.className)"
                  :id="genInputId('column-default-value')"
                  :maxLength="255"
                  :value.sync="column.defaultValue"
                  placeholder="Input default value"
                />
                <DiDatePicker
                  v-else-if="isDateColumn(column.className)"
                  :date="getDate(column.defaultValue)"
                  :isShowIconDate="false"
                  failureText="--"
                  formatter="DD/MM/YYYY"
                  placeholder="Input default value"
                  @change="changeDate(column, arguments[0], false)"
                />
                <div v-else>{{ column.defaultValues }}</div>
              </td>
              <td :class="{ disabled: !isStringColumn(column.className) }" class="text-center">
                <DiToggle v-if="isStringColumn(column.className)" :value.sync="column.isEncrypted" @onSelected="handleToggleEncrypt(column, ...arguments)" />
                <DiToggle v-else :disable="true" :value.sync="column.isEncrypted" v-b-tooltip="`Feature only support with string column`" />
              </td>
              <!--            <td class="text-center">-->
              <!--              <i class="di-icon-delete btn-icon btn-icon-border" @click="deleteColumn(index, true)"></i>-->
              <!--            </td>-->
            </tr>
          </template>
        </tbody>
      </table>
    </vuescroll>
  </StatusWidget>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { DataSchemaModel, ViewMode } from '@/screens/DataManagement/views/DataSchema/model';
import { BoolColumn, ColumnType, DIException, StringColumn, TableSchema } from '@core/domain';
import { cloneDeep, get, isEqual } from 'lodash';
import { BoolOptions, ColumnTypeOptions } from '@/screens/DataManagement/views/DataSchema/DataSchema.options';
import { ChartUtils, DateTimeFormatter, ListUtils } from '@/utils';
import { SelectOption, Status } from '@/shared';
import moment from 'moment';
import InputSetting from '@/shared/Settings/Common/InputSetting.vue';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import { Column } from '@core/domain/Model/Column/Column.ts';
import { StringUtils } from '@/utils/string.utils';
import { Log } from '@core/utils';
import DiMultiChoice from '@/shared/components/Common/DiMultiChoice.vue';
import { Track } from '@/shared/anotation/TrackingAnotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import StatusWidget from '@/shared/components/StatusWidget.vue';

@Component({
  components: {
    InputSetting,
    DiDatePicker,
    DiMultiChoice,
    StatusWidget
  }
})
export default class FieldManagement extends Vue {
  @Prop({ type: Object, required: false })
  private model?: DataSchemaModel;
  @Prop({ type: Number, required: false, default: ViewMode.ViewSchema })
  private viewMode!: ViewMode;
  @Prop({ type: String, required: false, default: '' })
  private keyword!: string;

  @Prop({ required: true })
  private status!: Status;

  private readonly boolOptions = BoolOptions;

  private readonly typeOptions = ColumnTypeOptions;

  private cloneTable: TableSchema | null = null;

  private tempColumns: Column[] = [];

  private deleteColumns: Set<string> = new Set<string>();

  private get searchColumns(): Column[] {
    return (
      this.model?.table?.columns?.filter(column => {
        if (this.keyword) {
          return !column.isMaterialized() && (StringUtils.isIncludes(this.keyword, column.displayName) || StringUtils.isIncludes(this.keyword, column.name));
        } else {
          return !column.isMaterialized();
        }
      }) ?? []
    );
  }

  private get isSchemaMode() {
    return this.viewMode === ViewMode.ViewSchema;
  }

  mounted() {
    this.createCloneTable(this.model?.table);
  }

  isEditing() {
    return this.cloneTable && this.model?.table && (!isEqual(this.cloneTable, this.model.table) || ListUtils.isNotEmpty(this.tempColumns));
  }

  addColumn() {
    const newColumn = StringColumn.empty();
    this.tempColumns.push(newColumn);
  }

  async getEditedTable(): Promise<TableSchema | undefined> {
    const columnsToCreate = this.tempColumns.filter(column => StringUtils.isNotEmpty(column.name));
    const tableToUpdate = cloneDeep(this.cloneTable)
      ?.removeColumns(this.deleteColumns)
      ?.addColumns(columnsToCreate);
    this.ensureTable(this.model?.table, tableToUpdate);
    const isConfirm = await this.confirmEditTable(this.model!.table!, tableToUpdate!);
    if (isConfirm) {
      this.replaceDisplayNameEmpty(columnsToCreate);
      this.tempColumns = [];
      return tableToUpdate!;
    } else {
      return Promise.resolve(void 0);
    }
  }

  @Watch('model', { deep: true })
  private onModelChanged() {
    Log.debug('FieldManagement::onModelChanged::', this.model);
    switch (this.viewMode) {
      case ViewMode.EditSchema:
      case ViewMode.CreateTable:
        this.createCloneTable(this.model?.table);
        break;
      case ViewMode.ViewData:
      case ViewMode.ViewSchema:
      case ViewMode.ViewDatabase:
        this.resetTableSchema();
        break;
    }
  }

  @Watch('viewMode')
  private onViewModeChanged() {
    Log.debug('FieldManagement::onViewModeChanged::', this.viewMode);
    switch (this.viewMode) {
      case ViewMode.ViewSchema:
      case ViewMode.ViewData:
      case ViewMode.ViewDatabase:
        this.resetTableSchema();
        break;
      case ViewMode.EditSchema:
      case ViewMode.CreateTable:
        this.createCloneTable(this.model?.table);
        break;
    }
  }

  private createCloneTable(table?: TableSchema) {
    if (table) {
      this.cloneTable = cloneDeep(table);
      this.tempColumns = [];
      if (ListUtils.isEmpty(this.cloneTable.columns)) {
        this.addColumn();
      }
    }
  }

  private resetTableSchema() {
    this.cloneTable = null;
    this.tempColumns = [];
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

  private checkNullable(column: Column, isNullable: boolean, isUpdate: boolean) {
    if (isUpdate && this.cloneTable) {
      const index = this.cloneTable.columns.findIndex(columnToFind => columnToFind.name === column.name);
      const existColumn = index !== -1;
      if (existColumn) {
        this.cloneTable.columns[index].isNullable = isNullable;
      }
    }
    //Create
    else if (!isUpdate) {
      const index = this.tempColumns.findIndex(columnToFind => columnToFind.name === column.name);
      const existColumn = index !== -1;
      if (existColumn) {
        this.tempColumns[index].isNullable = isNullable;
      }
    } else {
      Log.debug('check null::not found column');
    }
  }

  private isTextColumn(className: ColumnType) {
    return ChartUtils.isTextType(className) || ChartUtils.isNumberType(className);
  }

  private isBoolColumn(className: ColumnType) {
    return className === ColumnType.bool;
  }

  private isDateColumn(className: ColumnType) {
    return ChartUtils.isDateType(className);
  }

  @Track(TrackEvents.ColumnChangeType, {
    column_name: (_: FieldManagement, args: any) => args[0].name,
    column_old_type: (_: FieldManagement, args: any) => args[0].className,
    column_new_type: (_: FieldManagement, args: any) => args[1].id
  })
  private changeType(column: Column, option: SelectOption, isUpdate: boolean) {
    const { id } = option;
    if (isUpdate && this.cloneTable) {
      const index = this.cloneTable?.columns.findIndex(columnToFind => columnToFind.name === column.name);
      const existColumn = index !== -1;
      if (existColumn) {
        column.className = id as ColumnType;
        // @ts-ignore
        // this.cloneTable?.columns[index] = Column.fromObject(column)!;
        this.$set(this.cloneTable.columns, index, Column.fromObject(column)!);
      }
    }
    ///Create
    else if (!isUpdate) {
      const index = this.tempColumns.findIndex(columnToFind => columnToFind.name === column.name);
      const existColumn = index !== -1;
      if (existColumn) {
        column.className = id as ColumnType;
        // @ts-ignore
        // this.cloneTable?.columns[index] = Column.fromObject(column)!;
        this.$set(this.tempColumns, index, Column.fromObject(column)!);
      }
    } else {
      Log.debug('change type::not found column');
    }
  }

  private changeBoolDefaultValue(column: Column, option: SelectOption) {
    TrackingUtils.track(TrackEvents.ColumnChangeDefaultValue, {
      column_name: column.name,
      column_type: column.className,
      column_new_default_value: option.id,
      column_old_default_value: !option.id
    });
  }

  private getDate(date: number | undefined): Date | undefined {
    return date ? new Date(date) : void 0;
  }

  @Track(TrackEvents.ColumnChangeDefaultValue, {
    column_name: (_: FieldManagement, args: any) => args[0].name,
    column_type: (_: FieldManagement, args: any) => args[0].className,
    column_old_default_value: (_: FieldManagement, args: any) => args[0].defaultValue,
    column_new_default_value: (_: FieldManagement, args: any) => args[1].getTime()
  })
  private changeDate(column: Column, date: Date, isUpdate: boolean) {
    if (isUpdate && this.cloneTable) {
      const index = this.cloneTable?.columns.findIndex(columnToFind => columnToFind.name === column.name);
      const existColumn = index !== -1;
      if (existColumn) {
        (this.cloneTable?.columns[index] as any).defaultValue = moment(date).valueOf();
        (this.cloneTable?.columns[index] as any).inputAsTimestamp = true;
      }
    }
    //Create
    else if (!isUpdate) {
      const index = this.tempColumns.findIndex(columnToFind => columnToFind.name === column.name);
      const existColumn = index !== -1;
      if (existColumn) {
        (this.tempColumns[index] as any).defaultValue = moment(date).valueOf();
        (this.tempColumns[index] as any).inputAsTimestamp = true;
      }
    }
  }

  private replaceDisplayNameEmpty(columns: Column[]) {
    columns.filter(column => StringUtils.isEmpty(column.displayName)).forEach(column => (column.displayName = column.name));
  }

  private ensureTable(oldTable: TableSchema | undefined | null, tableToUpdate: TableSchema | undefined | null): void {
    if (!tableToUpdate || !oldTable) {
      throw new DIException(`Table not found!`);
    }
    if (!tableToUpdate.dbName) {
      throw new DIException(`Database not found!`);
    }
    if (ListUtils.isEmpty(tableToUpdate.columns)) {
      throw new DIException(`Column is not empty`);
    }
  }

  private async confirmEditTable(oldTable: TableSchema, newTable: TableSchema): Promise<boolean> {
    ///Check warning
    let modalMessage = '';
    let isEncryptChanged = false;
    let isTypeChanged = false;
    const nameAndEncryptAsMap: Map<string, boolean> = new Map(oldTable?.columns.map(column => [column.name, column.isEncrypted]));
    const nameAndTypeAsMap: Map<string, ColumnType> = new Map(oldTable?.columns.map(column => [column.name, column.className]));
    for (let i = 0; i < newTable.columns.length; i++) {
      ///Check encrypt changed
      const columnName = newTable.columns[i].name;
      const newEncrypt = newTable.columns[i].isEncrypted;
      const oldEncrypt = nameAndEncryptAsMap.get(columnName);
      if (!isEncryptChanged && oldEncrypt !== newEncrypt) {
        isEncryptChanged = true;
      }
      ///Check type changed
      const newType = newTable.columns[i].className;
      const oldType = nameAndTypeAsMap.get(columnName);
      if (!isTypeChanged && oldType !== newType) {
        isTypeChanged = true;
      }
      ///Break if type change and encrypt changed
      if (isTypeChanged && isEncryptChanged) {
        break;
      }
    }
    ///Show ensure Encrypt modal
    if (isEncryptChanged) {
      modalMessage = 'Update encrypt columns may take a long time. You can not act on this table until the processing is completed.';
    }
    ///Show ensure change type modal
    if (isTypeChanged) {
      if (StringUtils.isNotEmpty(modalMessage)) {
        modalMessage += '</br>';
      }
      modalMessage += 'Your data could be loss if you change column data type. Are you sure you want to save table?';
    }
    if (isEncryptChanged || isTypeChanged) {
      const { isConfirmed } = await this.showEnsureModal('Warning', modalMessage);
      return isConfirmed;
    }
    return Promise.resolve(true);
  }

  private async showEnsureModal(title: string, html: string, confirmButtonText?: string, cancelButtonText?: string) {
    //@ts-ignore
    return this.$alert.fire({
      icon: 'warning',
      title: title,
      html: html,
      confirmButtonText: confirmButtonText ?? 'Yes',
      showCancelButton: true,
      cancelButtonText: cancelButtonText ?? 'No'
    });
  }

  private deleteColumn(index: number, isCreateColumn: boolean) {
    if (isCreateColumn) {
      this.tempColumns = ListUtils.removeAt(this.tempColumns, index);
    } else {
      const columnName = get(this.cloneTable, `columns[${index}].name`, '');
      if (columnName) {
        this.deleteColumns.add(columnName);
        this.$forceUpdate();
      }
    }
  }

  private isDeleteColumn(column: Column) {
    return this.deleteColumns.has(column.name);
  }
  private isStringColumn(columnType: ColumnType) {
    return ChartUtils.isTextType(columnType);
  }

  private handleToggleEncrypt(column: Column, enable: boolean) {
    if (enable) {
      TrackingUtils.track(TrackEvents.ColumnEnableEncryption, { column_name: column.name, column_type: column.className });
    } else {
      TrackingUtils.track(TrackEvents.ColumnDisableEncryption, { column_name: column.name, column_type: column.className });
    }
  }
}
</script>

<style lang="scss" scoped></style>
