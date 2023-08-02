import { Component, Ref } from 'vue-property-decorator';
import { Column, ColumnType, Field, GroupTableResponse, QueryRequest, RawQuerySetting, TableSchema } from '@core/common/domain';
import {
  DataCookService,
  EtlOperator,
  ETLOperatorType,
  ExpressionFieldConfiguration,
  FieldConfiguration,
  ManageFieldOperator,
  NormalFieldConfiguration
} from '@core/data-cook';
import cloneDeep from 'lodash/cloneDeep';
import QueryBuilder from '@/screens/chart-builder/data-cook/QueryBuilder.vue';
import ChartBuilder from '@/screens/chart-builder/data-cook/ChartBuilder.vue';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import { Inject as InjectService } from 'typescript-ioc/dist/decorators';
import { QueryService } from '@core/common/services';
import PreviewTableData from '@/screens/data-management/components/preview-table-data/PreviewTableData.vue';
import ManageNormalField from '@/screens/data-cook/components/manage-operator-modal/manage-fields/manage-normal-field/ManageNormalField.vue';
import ManageExpressionField from '@/screens/data-cook/components/manage-operator-modal/manage-fields/manage-expression-field/ManageExpressionField.vue';
import { Log } from '@core/utils';
import ManageOperatorModal from '@/screens/data-cook/components/manage-operator-modal/ManageOperatorModal';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { SelectOption } from '@/shared';
import DiSearchInput from '@/shared/components/DiSearchInput.vue';
import { StringUtils, TimeoutUtils } from '@/utils';
import EmptyWidget from '@/screens/dashboard-detail/components/widget-container/charts/error-display/EmptyWidget.vue';
import Swal from 'sweetalert2';

@Component({
  components: {
    EtlModal,
    QueryBuilder,
    ChartBuilder,
    PreviewTableData,
    ManageNormalField,
    ManageExpressionField,
    DiSearchInput,
    EmptyWidget
  }
})
export default class ManageFields extends ManageOperatorModal {
  private $alert!: typeof Swal;

  protected operatorType = ETLOperatorType.ManageFieldOperator;
  private etlJobId: number | null = null;
  private model: ManageFieldOperator | null = null;
  private tableSchema: TableSchema | null = null;
  private callback: ((newOperator: ManageFieldOperator) => void) | null = null;
  private errorMsg = '';
  private queryData: GroupTableResponse = GroupTableResponse.empty();
  private isLoadingData = false;

  private keyword = '';

  @InjectService
  private readonly dataCookService!: DataCookService;

  @InjectService
  private readonly queryService!: QueryService;

  @Ref()
  private chartBuilder!: ChartBuilder;

  @Ref()
  private manageNormalField!: ManageNormalField;

  @Ref()
  private manageExpressionField!: ManageExpressionField;

  @Ref()
  private td!: HTMLTableCellElement[];

  @Ref()
  private diSearchInput!: DiSearchInput;

  private updated() {
    if (this.td && this.td.length > 0) {
      this.td.forEach(td => {
        TableTooltipUtils.configTooltip(td);
      });
    }
  }

  private destroy() {
    TableTooltipUtils.hideTooltip();
  }

  private getHeaderKeyByExpressionField(field: ExpressionFieldConfiguration): string | undefined {
    return this.queryData?.headers.find(header => header.label === field.displayName)?.key;
  }

  private getHeaderKeyByNormalField(field: NormalFieldConfiguration): string | undefined {
    return this.queryData?.headers.find(header => header.label === field.fieldName)?.key;
  }

  private get filteredFields(): NormalFieldConfiguration[] {
    if (this.model) {
      return this.model.fields.filter(
        field => StringUtils.isIncludes(this.keyword, field.fieldName) || StringUtils.isIncludes(this.keyword, field.displayName)
      );
    } else {
      return [];
    }
  }

  private get filteredExtraFields(): ExpressionFieldConfiguration[] {
    if (this.model) {
      return this.model.extraFields.filter(
        field => StringUtils.isIncludes(this.keyword, field.fieldName) || StringUtils.isIncludes(this.keyword, field.displayName)
      );
    } else {
      return [];
    }
  }

  // private get isEmptyData() {
  //   return ListUtils.isEmpty(this.filteredFields) && ListUtils.isEmpty(this.filteredExtraFields);
  // }

  private get emptyMessage() {
    if (StringUtils.isEmpty(this.keyword)) {
      return 'Your data empty';
    } else {
      return 'No fields found';
    }
  }

  private get columnTypes() {
    return [
      // { id: ColumnType.bool, name: 'Boolean' },
      { id: ColumnType.date, name: 'Date' },
      { id: ColumnType.datetime, name: 'Datetime' },
      { id: ColumnType.datetime64, name: 'Datetime64' },
      { id: ColumnType.double, name: 'Double' },
      { id: ColumnType.float, name: 'Float' },
      { id: ColumnType.int8, name: 'Int8' },
      { id: ColumnType.int16, name: 'Int16' },
      { id: ColumnType.int32, name: 'Int32' },
      { id: ColumnType.int64, name: 'Int64' },
      { id: ColumnType.uint8, name: 'UInt8' },
      { id: ColumnType.uint16, name: 'UInt16' },
      { id: ColumnType.uint32, name: 'UInt32' },
      { id: ColumnType.uint64, name: 'UInt64' },
      { id: ColumnType.string, name: 'String' }
    ];
  }

  private get extraColumnTypes() {
    return [
      { id: null, name: 'Auto' },
      // { id: ColumnType.bool, name: 'Boolean' },
      { id: ColumnType.date, name: 'Date' },
      { id: ColumnType.datetime, name: 'Datetime' },
      { id: ColumnType.datetime64, name: 'Datetime64' },
      { id: ColumnType.double, name: 'Double' },
      { id: ColumnType.float, name: 'Float' },
      { id: ColumnType.int8, name: 'Int8' },
      { id: ColumnType.int16, name: 'Int16' },
      { id: ColumnType.int32, name: 'Int32' },
      { id: ColumnType.int64, name: 'Int64' },
      { id: ColumnType.uint8, name: 'UInt8' },
      { id: ColumnType.uint16, name: 'UInt16' },
      { id: ColumnType.uint32, name: 'UInt32' },
      { id: ColumnType.uint64, name: 'UInt64' },
      { id: ColumnType.string, name: 'String' }
    ];
  }

  private convertToAsType(columnType: ColumnType | null): ColumnType | null {
    switch (columnType) {
      case ColumnType.bool:
      case ColumnType.int8:
        return ColumnType.int8;
      case ColumnType.int16:
        return ColumnType.int16;
      case ColumnType.int32:
        return ColumnType.int32;
      case ColumnType.int64:
        return ColumnType.int64;
      case ColumnType.uint8:
        return ColumnType.uint8;
      case ColumnType.uint16:
        return ColumnType.uint16;
      case ColumnType.uint32:
        return ColumnType.uint32;
      case ColumnType.uint64:
        return ColumnType.uint64;
      case ColumnType.float:
        return ColumnType.float;
      case ColumnType.float64:
      case ColumnType.double:
        return ColumnType.double;
      case ColumnType.date:
        return ColumnType.date;
      case ColumnType.datetime:
      case ColumnType.datetime64:
        return ColumnType.datetime;
      case ColumnType.array:
      case ColumnType.nested:
      case ColumnType.string:
        return ColumnType.string;
      default:
        return null;
    }
  }

  protected resetModel() {
    this.etlJobId = null;
    this.model = null;
    this.tableSchema = null;
    this.callback = null;
    this.errorMsg = '';
    this.queryData = GroupTableResponse.empty();
    this.isLoadingData = false;
    this.keyword = '';
  }

  public add(etlJobId: number, operator: EtlOperator, tableSchema: TableSchema, callback: (newOperator: ManageFieldOperator) => void) {
    this.startCreate();
    this.etlJobId = etlJobId;
    this.tableSchema = tableSchema;
    this.callback = callback;
    const normalFields: NormalFieldConfiguration[] = this.makeNormalFields(tableSchema);
    const extraFields: ExpressionFieldConfiguration[] = [];
    this.model = new ManageFieldOperator(operator, normalFields, extraFields, this.makeDestTableConfig([operator]), false, null, null, []);
    this.show();
    this.loadData();
    this.focusSearchInput();
  }

  private makeNormalFields(tableSchema: TableSchema): NormalFieldConfiguration[] {
    return tableSchema.columns.map(column => {
      return new NormalFieldConfiguration(
        column.displayName || column.name,
        Field.new(tableSchema.dbName, tableSchema.name, column.name, column.className),
        false,
        this.convertToAsType(column.className),
        null
      );
    });
  }

  public edit(etlJobId: number, operator: ManageFieldOperator, tableSchema: TableSchema | null, callback: (updatedOperator: ManageFieldOperator) => void) {
    this.startEdit();
    this.etlJobId = etlJobId;
    this.tableSchema = tableSchema || this.makeTableSchema(operator);
    this.callback = callback;
    this.model = this.makeOperator(operator, true, false);
    const sourceFields: NormalFieldConfiguration[] = this.makeNormalFields(this.tableSchema);
    const newFields: NormalFieldConfiguration[] = this.mergeFields(sourceFields, this.model.fields);
    this.$set(this.model, 'fields', newFields);
    this.show();
    this.loadData();
    this.focusSearchInput();
  }

  private focusSearchInput() {
    TimeoutUtils.waitAndExec(
      null,
      () => {
        this.diSearchInput.focus();
      },
      150
    );
  }

  /**
   * Merge field with logic:
   * 1. If field is in source list & dest list, use field in dest list
   * 2. If field is in source list & not in dest list => use field in source list
   * 3. If field is not in source list & in dest list => remove field in dest list
   * @param sourceList
   * @param destList
   * @private
   */
  private mergeFields(sourceList: NormalFieldConfiguration[], destList: NormalFieldConfiguration[]): NormalFieldConfiguration[] {
    const sourceMap = new Map<string, NormalFieldConfiguration>(sourceList.map(source => [source.fieldName, source]));
    destList.forEach(destField => {
      if (sourceMap.has(destField.fieldName)) {
        sourceMap.set(destField.fieldName, destField);
      }
    });
    return cloneDeep(Array.from(sourceMap.values()));
  }

  private makeTableSchema(operator: ManageFieldOperator): TableSchema {
    const tableSchema = TableSchema.empty();
    tableSchema.dbName = this.getEtlDbName();
    tableSchema.name = operator.destTableName;
    tableSchema.columns = operator.fields
      .map(fieldConfig => this.createColumn(fieldConfig.fieldName, fieldConfig.fieldType))
      .filter(column => !!column) as Column[];
    return tableSchema;
  }

  private createColumn(name: string, className: ColumnType): Column | undefined {
    return Column.fromObject({
      className: className,
      name: name,
      displayName: name,
      isNullable: true,
      isEncrypted: false,
      isPrivate: false
    } as Column);
  }

  private async loadData() {
    if (this.etlJobId && this.model) {
      this.isLoadingData = true;
      this.errorMsg = '';
      const temp = this.makeOperator(this.model, false, true);
      const queryResp = await this.dataCookService.parseQuery(this.etlJobId, temp.fields, temp.extraFields).catch(e => {
        this.errorMsg = e.message;
        this.isLoadingData = false;
        this.queryData = GroupTableResponse.empty();
        return null;
      });
      if (!queryResp) return;

      const req = new QueryRequest(new RawQuerySetting(queryResp.query), [], undefined, 0, 6);
      const resp = await this.queryService.query(req).catch(e => {
        this.errorMsg = e.message;
        this.isLoadingData = false;
        this.queryData = GroupTableResponse.empty();
        return null;
      });
      if (!resp) return;
      this.errorMsg = '';
      this.queryData = resp as GroupTableResponse;
      this.isLoadingData = false;
      Log.info(this.queryData);
    }
  }

  private handleFieldTypeChange(field: NormalFieldConfiguration, option: SelectOption) {
    TrackingUtils.track(TrackEvents.ColumnChangeType, {
      column_name: field.field.fieldName,
      column_new_type: option.id,
      column_old_type: field.field.className
    });
  }

  @Track(TrackEvents.ManageFieldSubmit)
  private submit() {
    if (this.callback && this.model) {
      const newOperator = this.makeOperator(this.model, false, false);
      Log.debug('submit::operator', cloneDeep(newOperator.fields));

      this.callback(newOperator);
    }
    this.hide();
  }

  private makeOperator(operator: ManageFieldOperator, resetAsType = false, resetIsHidden = false): ManageFieldOperator {
    const newOperator: ManageFieldOperator = cloneDeep(operator);
    newOperator.fields.forEach(field => {
      if (resetAsType) {
        field.asType = field.asType || this.convertToAsType(field.field.fieldType as ColumnType);
      }
      if (resetIsHidden) {
        field.isHidden = false;
      }
      return field;
    });
    newOperator.extraFields.forEach(field => {
      if (resetIsHidden) {
        field.isHidden = false;
      }
      return field;
    });
    return newOperator;
  }

  private toggleField(field: FieldConfiguration) {
    this.trackToggleField(field);
    field.isHidden = !field.isHidden;
  }

  private trackToggleField(field: FieldConfiguration) {
    if (field.isHidden) {
      TrackingUtils.track(TrackEvents.ColumnRestore, {
        column_name: field.fieldName,
        table_name: this.tableSchema?.name,
        database_name: this.tableSchema?.dbName
      });
    } else {
      TrackingUtils.track(TrackEvents.ColumnDelete, {
        column_name: field.fieldName,
        table_name: this.tableSchema?.name,
        database_name: this.tableSchema?.dbName
      });
    }
  }

  private removeExtraField(field: ExpressionFieldConfiguration) {
    if (this.model) {
      this.model.extraFields = this.model.extraFields.filter(f => f !== field);
      this.loadData();
    }
  }

  @Track(TrackEvents.ColumnEdit, {
    column_name: (_: ManageFields, args: any) => args[0].field.fieldName,
    table_name: (_: ManageFields, args: any) => _.tableSchema?.name,
    database_name: (_: ManageFields, args: any) => _.tableSchema?.dbName
  })
  private editNormalField(field: NormalFieldConfiguration) {
    // @ts-ignore
    this.manageNormalField.edit(field);
  }

  @Track(TrackEvents.ManageFieldAddColumn, {
    table_name: (_: ManageFields, args: any) => _.tableSchema?.name,
    database_name: (_: ManageFields, args: any) => _.tableSchema?.dbName
  })
  private addExpressionField() {
    // @ts-ignore
    this.manageExpressionField.add(this.tableSchema);
  }

  private editExpressionField(field: NormalFieldConfiguration) {
    // @ts-ignore
    this.manageExpressionField.edit(field, this.tableSchema);
  }

  private async handleManageExpressionField(field: ExpressionFieldConfiguration) {
    // @ts-ignore
    if (this.model && !this.model?.extraFields.includes(field)) {
      this.model.extraFields.push(field);
    }
    await this.loadData();
  }

  private async deleteExpressionField(deletedField: ExpressionFieldConfiguration) {
    const { isConfirmed } = await this.$alert.fire({
      icon: 'warning',
      title: 'Delete Field',
      html: `Are you sure that you want to remove the field <b>${deletedField.displayName}</b>?`,
      confirmButtonText: 'Yes',
      showCancelButton: true,
      cancelButtonText: 'No'
    });
    if (this.model && isConfirmed) {
      this.model.extraFields = this.model.extraFields.filter(field => field.displayName !== deletedField.displayName);
      await this.loadData();
    }
  }
}
