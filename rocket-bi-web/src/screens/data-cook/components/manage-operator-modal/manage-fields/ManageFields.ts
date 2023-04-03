import { Component, Ref } from 'vue-property-decorator';
import { ColumnType, Field, QueryRequest, RawQuerySetting, TableResponse, TableSchema } from '@core/common/domain';
import {
  DataCookService,
  ETLOperatorType,
  EtlOperator,
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

@Component({
  components: {
    EtlModal,
    QueryBuilder,
    ChartBuilder,
    PreviewTableData,
    ManageNormalField,
    ManageExpressionField
  }
})
export default class ManageFields extends ManageOperatorModal {
  protected operatorType = ETLOperatorType.ManageFieldOperator;
  private etlJobId: number | null = null;
  private model: ManageFieldOperator | null = null;
  private tableSchema: TableSchema | null = null;
  private callback: ((newOperator: ManageFieldOperator) => void) | null = null;
  private errorMsg = '';
  private queryData: TableResponse | null = null;
  private queryLoading = false;

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

  private getAsType(columnType: ColumnType | null) {
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
    this.queryData = null;
    this.queryLoading = false;
  }

  @Track(TrackEvents.ManageFieldShowCreateModal, {
    table_name: (_: ManageFields, args: any) => args[2].name,
    database_name: (_: ManageFields, args: any) => args[2].dbName
  })
  public add(etlJobId: number, operator: EtlOperator, tableSchema: TableSchema, callback: (newOperator: ManageFieldOperator) => void) {
    this.startCreate();
    this.etlJobId = etlJobId;
    this.tableSchema = tableSchema;
    this.callback = callback;
    // let databaseName: string | null = null;
    // let tableName: string | null = null;
    // if (operator.isGetData) {
    //   const getDataOperator = operator as GetDataOperator;
    //   databaseName = getDataOperator.tableSchema.dbName;
    //   tableName = getDataOperator.tableSchema.name;
    // }
    // const destTblName = [operator.destTableConfiguration.tblName, 'manage_fields'].join('_');
    // const destTblDisplayName = [operator.destTableConfiguration.tblDisplayName, 'Manage Fields'].join(' ');
    const normalFields: NormalFieldConfiguration[] = tableSchema.columns.map(column => {
      return new NormalFieldConfiguration(
        column.displayName || column.name,
        Field.new(tableSchema.dbName, tableSchema.name, column.name, column.className),
        false,
        this.getAsType(column.className),
        null
      );
    });
    const extraFields: ExpressionFieldConfiguration[] = [];
    this.model = new ManageFieldOperator(operator, normalFields, extraFields, this.makeDestTableConfig([operator]), false, null, null, []);
    this.show();
    this.getData();
  }

  @Track(TrackEvents.ManageFieldShowEditModal, {
    table_name: (_: ManageFields, args: any) => args[2].name,
    database_name: (_: ManageFields, args: any) => args[2].dbName
  })
  public edit(etlJobId: number, operator: ManageFieldOperator, tableSchema: TableSchema | null, callback: (updatedOperator: ManageFieldOperator) => void) {
    this.startEdit();
    this.etlJobId = etlJobId;
    this.tableSchema = tableSchema || this.makeTableSchema(operator);
    this.callback = callback;
    this.model = this.getSerializeModel(operator, true, false);
    this.show();
    this.getData();
  }

  private makeTableSchema(operator: ManageFieldOperator): TableSchema {
    const tableSchema = TableSchema.empty();
    tableSchema.dbName = this.getEtlDbName();
    tableSchema.name = operator.destTableName;
    return tableSchema;
  }

  private async getData() {
    if (this.etlJobId && this.model) {
      this.queryLoading = true;
      const temp = this.getSerializeModel(this.model, false, true);
      const queryResp = await this.dataCookService.parseQuery(this.etlJobId, temp.fields, temp.extraFields).catch(e => {
        this.errorMsg = e.message;
        this.queryLoading = false;
        this.queryData = null;
        return null;
      });
      if (!queryResp) return;

      const req = new QueryRequest(new RawQuerySetting(queryResp.query), [], undefined, 0, 6);
      const resp = await this.queryService.query(req).catch(e => {
        this.errorMsg = e.message;
        this.queryLoading = false;
        this.queryData = null;
        return null;
      });
      if (!resp) return;
      this.errorMsg = '';
      this.queryData = resp as TableResponse;
      this.queryLoading = false;
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
      this.callback(this.getSerializeModel(this.model));
    }
    this.hide();
  }

  private getSerializeModel(operator: ManageFieldOperator, initAsType = false, resetIsHidden = false) {
    const model = cloneDeep(operator);
    model.fields.forEach(field => {
      if (initAsType) {
        field.asType = field.asType || this.getAsType(field.field.fieldType as ColumnType);
      }
      if (resetIsHidden) {
        field.isHidden = false;
      }
      return field;
    });
    model.extraFields.forEach(field => {
      if (resetIsHidden) {
        field.isHidden = false;
      }
      return field;
    });
    return model;
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
      this.getData();
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

  private handleManageExpressionField(field: ExpressionFieldConfiguration) {
    // @ts-ignore
    if (this.model && !this.model?.extraFields.includes(field)) {
      this.model.extraFields.push(field);
    }
    this.getData();
  }
}
