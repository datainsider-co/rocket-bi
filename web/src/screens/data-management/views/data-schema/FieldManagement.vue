<template>
  <StatusWidget :status="status">
    <vuescroll class="table-container">
      <table class="table table-sm">
        <thead>
          <tr class="text-nowrap">
            <th class="cell-20">
              <div v-if="columnSize > 0">Column ({{ columnSize }})</div>
              <div v-else>Column</div>
            </th>
            <th class="cell-20">Display Name</th>
            <th class="text-center cell-5">Nullable</th>
            <th class="cell-15">Type</th>
            <th class="cell-20">Description</th>
            <th class="cell-20">Default Value</th>
            <!--            <th class="text-center cell-5">Encryption</th>-->
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
              <!--              <td class="text-center">-->
              <!--                <div v-if="column.isEncrypted">On</div>-->
              <!--                <div v-else>Off</div>-->
              <!--              </td>-->
            </tr>
          </template>
          <!-- Action -->
          <template v-else-if="cloneTable">
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
              <td :class="{ disabled: isDeleteColumn(column) }" class="d-flex flex-row align-items-center" style="gap: 8px; height: 48px !important;">
                <DiInput
                  :id="genInputId('column-description')"
                  class="flex-auto"
                  :maxLength="255"
                  :value.sync="column.description"
                  placeholder="Input description"
                />
                <template>
                  <DiLoading v-if="loadingAsMap.has(column.name)" mode="small" />
                  <div v-else class="cursor-pointer open-ai-icon" @click="handleGenerateDescription(column, true)">
                    <ChatGPTIcon color="var(--text-color)" :size="24" />
                  </div>
                </template>
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
                  placeholder="Input default value"
                  @change="changeDate(column, arguments[0], true)"
                />
                <div v-else>{{ column.defaultValues }}</div>
              </td>
              <!--              <td :class="{ disabled: !isStringColumn(column.className) }" class="text-center">-->
              <!--                <DiToggle v-if="isStringColumn(column.className)" :value.sync="column.isEncrypted" @onSelected="handleToggleEncrypt(column, ...arguments)" />-->
              <!--                <DiToggle v-else :disable="true" :value.sync="column.isEncrypted" v-b-tooltip="`Feature only support with string column`" />-->
              <!--              </td>-->

              <!--            <td class="text-center">-->
              <!--              <i class="di-icon-delete btn-icon btn-icon-border" @click="deleteColumn(index, false)"></i>-->
              <!--            </td>-->
            </tr>
            <!-- Create -->
            <tr v-for="(column, index) in tempColumns" :key="index">
              <td class="cell-20">
                <DiInput :id="genInputId('column-name')" ref="inputNames" :maxLength="255" :value.sync="column.name" placeholder="Input name" />
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
                <template>
                  <DiLoading v-if="loadingAsMap.has(column.name)" mode="small" />
                  <div v-else class="cursor-pointer open-ai-icon" @click="handleGenerateDescription(column, false)">
                    <ChatGPTIcon color="var(--text-color)" :size="24" />
                  </div>
                </template>
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
              <!--              <td :class="{ disabled: !isStringColumn(column.className) }" class="text-center">-->
              <!--                <DiToggle v-if="isStringColumn(column.className)" :value.sync="column.isEncrypted" @onSelected="handleToggleEncrypt(column, ...arguments)" />-->
              <!--                <DiToggle v-else :disable="true" :value.sync="column.isEncrypted" v-b-tooltip="`Feature only support with string column`" />-->
              <!--              </td>-->
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
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { DataSchemaModel, ViewMode } from '@/screens/data-management/views/data-schema/model';
import { BoolColumn, ColumnType, DIException, StringColumn, TableSchema } from '@core/common/domain';
import { cloneDeep, get, isEqual } from 'lodash';
import { BoolOptions, ColumnTypeOptions } from '@/screens/data-management/views/data-schema/DataSchema.options';
import { ChartUtils, DateTimeUtils, ListUtils, PopupUtils, TimeoutUtils } from '@/utils';
import { SelectOption, Status } from '@/shared';
import moment from 'moment';
import InputSetting from '@/shared/settings/common/InputSetting.vue';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import { Column } from '@core/common/domain/model/column/Column.ts';
import { StringUtils } from '@/utils/StringUtils';
import { Log } from '@core/utils';
import DiMultiChoice from '@/shared/components/common/DiMultiChoice.vue';
import { Track } from '@/shared/anotation/TrackingAnotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import DiInput from '@/shared/components/common/DiInput.vue';
import ChatGPTIcon from '@/shared/ChatGPTIcon.vue';
import DiLoading from '@/shared/components/DiLoading.vue';
import { Di } from '@core/common/modules';
import { ColumnDescriptionFunction } from '@/shared/components/chat/controller/functions/ColumnDescriptionFunction';
import { ChatbotController } from '@/shared/components/chat/controller/ChatbotController';
import { TableSchemaPicker } from '@/shared/components/chat/controller/functions/TableSchemaPicker';

@Component({
  components: {
    DiLoading,
    ChatGPTIcon,
    InputSetting,
    DiDatePicker,
    DiMultiChoice,
    StatusWidget
  }
})
export default class FieldManagement extends Vue {
  @Prop({ type: Object, required: false, default: () => null })
  protected readonly model!: DataSchemaModel | null;

  @Prop({ type: Number, required: false, default: ViewMode.ViewSchema })
  protected readonly viewMode!: ViewMode;

  @Prop({ type: String, required: false, default: '' })
  protected readonly keyword!: string;

  @Prop({ required: true })
  protected readonly status!: Status;

  @Ref()
  protected readonly inputNames?: DiInput[];

  protected readonly boolOptions = BoolOptions;

  protected readonly typeOptions = ColumnTypeOptions;

  protected cloneTable: TableSchema = TableSchema.empty();

  protected tempColumns: Column[] = [];

  protected deleteColumns: Set<string> = new Set<string>();

  protected loadingAsMap: Map<string, boolean> = new Map();

  protected get searchColumns(): Column[] {
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

  protected get columnSize(): number {
    return this.model?.table?.columns?.length ?? 0;
  }

  protected get isSchemaMode() {
    return this.viewMode === ViewMode.ViewSchema;
  }

  mounted() {
    this.createCloneTable(this.model?.table);
  }

  isEditing() {
    return this.cloneTable && this.model?.table && (!isEqual(this.cloneTable, this.model.table) || ListUtils.isNotEmpty(this.tempColumns));
  }

  async addColumn(): Promise<void> {
    const newColumn = StringColumn.empty();
    this.tempColumns.push(newColumn);
    await TimeoutUtils.sleep(180);
    const input: DiInput | undefined = ListUtils.getLast(this.inputNames ?? []);
    input?.focus();
  }

  async getEditedTable(): Promise<TableSchema | undefined> {
    const newColumns: Column[] = this.tempColumns.filter(column => StringUtils.isNotEmpty(column.name));
    const newTable: TableSchema = cloneDeep(this.cloneTable) ?? cloneDeep(this.model?.table) ?? TableSchema.empty();
    newTable.removeColumns(this.deleteColumns);
    newTable.addColumns(newColumns);
    this.ensureTable(this.model?.table, newTable);
    const isConfirm = await this.confirmEdit(this.model!.table!, newTable!);
    if (isConfirm) {
      this.replaceDisplayNameEmpty(newColumns);
      this.tempColumns = [];
      return newTable!;
    } else {
      return Promise.resolve(void 0);
    }
  }

  @Watch('model', { deep: true })
  protected onModelChanged() {
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
  protected onViewModeChanged() {
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

  protected createCloneTable(table?: TableSchema): void {
    if (table) {
      this.cloneTable = cloneDeep(table);
      this.tempColumns = [];
      if (ListUtils.isEmpty(this.cloneTable.columns)) {
        this.addColumn();
      }
    }
  }

  protected resetTableSchema() {
    this.cloneTable = TableSchema.empty();
    this.tempColumns = [];
  }

  protected getDefaultValue(column: Column): string {
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
        return column.defaultValue ? DateTimeUtils.formatAsDDMMYYYY(column.defaultValue) : '--';
      case ColumnType.array:
      case ColumnType.nested:
        // @ts-ignore
        return column.defaultValues ? `${column.defaultValues}` : `--`;
    }
  }

  protected isTextColumn(className: ColumnType) {
    return ChartUtils.isTextType(className) || ChartUtils.isNumberType(className);
  }

  protected isBoolColumn(className: ColumnType) {
    return className === ColumnType.bool;
  }

  protected isDateColumn(className: ColumnType) {
    return ChartUtils.isDateType(className);
  }

  @Track(TrackEvents.ColumnChangeType, {
    column_name: (_: FieldManagement, args: any) => args[0].name,
    column_old_type: (_: FieldManagement, args: any) => args[0].className,
    column_new_type: (_: FieldManagement, args: any) => args[1].id
  })
  protected changeType(column: Column, option: SelectOption, isUpdate: boolean) {
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

  protected changeBoolDefaultValue(column: Column, option: SelectOption) {
    TrackingUtils.track(TrackEvents.ColumnChangeDefaultValue, {
      column_name: column.name,
      column_type: column.className,
      column_new_default_value: option.id,
      column_old_default_value: !option.id
    });
  }

  protected getDate(date: number | undefined): Date | undefined {
    return date ? moment(date).toDate() : void 0;
  }

  @Track(TrackEvents.ColumnChangeDefaultValue, {
    column_name: (_: FieldManagement, args: any) => args[0].name,
    column_type: (_: FieldManagement, args: any) => args[0].className,
    column_old_default_value: (_: FieldManagement, args: any) => args[0].defaultValue,
    column_new_default_value: (_: FieldManagement, args: any) => args[1].getTime()
  })
  protected changeDate(column: Column, date: Date, isUpdate: boolean) {
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

  protected replaceDisplayNameEmpty(columns: Column[]): void {
    columns.filter(column => StringUtils.isEmpty(column.displayName)).forEach(column => (column.displayName = column.name));
  }

  protected ensureTable(oldTable?: TableSchema | null, tableToUpdate?: TableSchema | null): void {
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

  protected async confirmEdit(oldTable: TableSchema, newTable: TableSchema): Promise<boolean> {
    ///Check warning
    let confirmMsg = '';
    let isChangedEncrypt = false;
    let isChangedType = false;
    const nameAndEncryptMap: Map<string, boolean> = new Map(oldTable?.columns.map(column => [column.name, column.isEncrypted]));
    const nameAndTypeMap: Map<string, ColumnType> = new Map(oldTable?.columns.map(column => [column.name, column.className]));
    for (const column of newTable.columns) {
      ///Check encrypt changed
      const columnName: string = column.name;
      const isEncrypt: boolean = column.isEncrypted ?? false;
      const isOldEncrypt: boolean = nameAndEncryptMap.get(columnName) ?? false;
      if (!isChangedEncrypt && isOldEncrypt !== isEncrypt) {
        isChangedEncrypt = true;
      }
      ///Check type changed
      const newType: ColumnType = column.className;
      // if column name is not exist in old table, it is new column
      const oldType: ColumnType = nameAndTypeMap.get(columnName) ?? column.className;
      if (!isChangedType && oldType !== newType) {
        isChangedType = true;
      }
      ///Break if type change and encrypt changed
      if (isChangedType && isChangedEncrypt) {
        break;
      }
    }

    ///Show ensure Encrypt modal
    if (isChangedEncrypt) {
      confirmMsg = 'Update encrypt columns may take a long time. You can not act on this table until the processing is completed.';
    }
    ///Show ensure change type modal
    if (isChangedType) {
      if (StringUtils.isNotEmpty(confirmMsg)) {
        confirmMsg += '</br>';
      }
      confirmMsg += 'Your data could be loss if you change column data type. Are you sure you want to save table?';
    }
    if (isChangedEncrypt || isChangedType) {
      const { isConfirmed } = await this.showEnsureModal('Warning', confirmMsg);
      return isConfirmed;
    }
    return Promise.resolve(true);
  }

  protected async showEnsureModal(title: string, html: string, confirmButtonText?: string, cancelButtonText?: string) {
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

  protected deleteColumn(index: number, isCreateColumn: boolean) {
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

  protected isDeleteColumn(column: Column) {
    return this.deleteColumns.has(column.name);
  }

  protected isStringColumn(columnType: ColumnType) {
    return ChartUtils.isTextType(columnType);
  }

  protected handleToggleEncrypt(column: Column, enable: boolean) {
    if (enable) {
      TrackingUtils.track(TrackEvents.ColumnEnableEncryption, {
        column_name: column.name,
        column_type: column.className
      });
    } else {
      TrackingUtils.track(TrackEvents.ColumnDisableEncryption, {
        column_name: column.name,
        column_type: column.className
      });
    }
  }

  async handleGenerateDescription(column: Column, isUpdate: boolean) {
    Log.debug('handleGenerateDescription::', column, isUpdate);

    if (!this.model) {
      return;
    }

    if (!this.cloneTable) {
      return;
    }

    if (ListUtils.isEmpty(this.cloneTable.columns)) {
      return;
    }
    try {
      this.showLoading(column);
      const newDescription = await new ColumnDescriptionFunction(Di.get(ChatbotController)).execute(
        TableSchemaPicker.normalizeDatabase(this.model.database),
        this.cloneTable.name,
        column.name
      );
      this.setDescription(column, newDescription, isUpdate);
    } catch (ex) {
      Log.error(ex);
      PopupUtils.showError(DIException.fromObject(ex).getPrettyMessage());
    } finally {
      this.hideLoading(column);
    }
  }

  private setDescription(column: Column, description: string, isUpdate: boolean) {
    if (isUpdate) {
      this.setDescriptionExistedColumn(column, description);
      return;
    } else {
      this.setDescriptionNewColumn(column, description);
    }
  }

  private setDescriptionExistedColumn(columnToUpdate: Column, description: string) {
    const index = this.cloneTable.columns.findIndex(column => columnToUpdate.name === column.name);
    if (index < 0) {
      throw new DIException(`Column ${columnToUpdate.name} not found!`);
    }

    this.cloneTable.columns[index].description = description;
  }

  private setDescriptionNewColumn(columnToUpdate: Column, description: string) {
    const index = this.tempColumns.findIndex(column => columnToUpdate.name === column.name);
    if (index < 0) {
      throw new DIException(`Column ${columnToUpdate.name} not found!`);
    }

    this.tempColumns[index].description = description;
  }

  ///Enhance with what column UI is loading
  private showLoading(column: Column) {
    this.loadingAsMap.set(column.name, true);
    this.loadingAsMap = new Map(this.loadingAsMap); ///Update UI
  }

  private hideLoading(column: Column) {
    this.loadingAsMap.delete(column.name);
    this.loadingAsMap = new Map(this.loadingAsMap); ///Update UI
  }
}
</script>
