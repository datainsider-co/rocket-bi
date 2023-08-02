import { Component, Provide, Ref } from 'vue-property-decorator';
import { DatabaseInfo, DIException, TableSchema } from '@core/common/domain';
import {
  DataCookService,
  ETLOperatorType,
  EtlOperator,
  EtlQueryLanguages,
  PreviewEtlResponse,
  PythonQueryOperator,
  QueryOperator,
  SQLQueryOperator
} from '@core/data-cook';
import cloneDeep from 'lodash/cloneDeep';
import QueryBuilder from '@/screens/chart-builder/data-cook/QueryBuilder.vue';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import ManageOperatorModal from '@/screens/data-cook/components/manage-operator-modal/ManageOperatorModal';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import { Inject as InjectService } from 'typescript-ioc';
import { Log } from '@core/utils';
import { ListUtils, PopupUtils } from '@/utils';

@Component({
  components: {
    EtlModal,
    QueryBuilder
  }
})
export default class QueryTable extends ManageOperatorModal {
  protected operatorType = ETLOperatorType.SQLQueryOperator;
  private model: QueryOperator | null = null;
  private previousTableSchema: TableSchema | null = null;
  private callback: ((newOperator: QueryOperator) => void) | null = null;
  private etlId = -1;

  @Ref()
  private queryBuilder!: QueryBuilder;

  @InjectService
  private readonly dataCookService!: DataCookService;

  private get etlDatabase(): DatabaseInfo {
    if (this.previousTableSchema) {
      return DatabaseInfo.etlDatabase(this.previousTableSchema.dbName, this.etlDbDisplayName, [this.previousTableSchema]);
    } else {
      return DatabaseInfo.etlDatabase(this.getEtlDbName(), this.etlDbDisplayName, []);
    }
  }

  protected resetModel(): void {
    this.model = null;
    this.previousTableSchema = null;
    this.callback = null;
    this.etlId = -1;
  }

  public addSQLQuery(etlId: number, operator: EtlOperator, tableSchema: TableSchema, callback: (newOperator: EtlOperator) => void) {
    this.operatorType = ETLOperatorType.SQLQueryOperator;
    this.previousTableSchema = tableSchema;
    this.etlId = etlId;
    this.startCreate();
    this.callback = callback;
    this.model = SQLQueryOperator.default(operator, this.makeDestTableConfig([operator]));
    this.show();
  }

  public addPythonQuery(etlId: number, operator: EtlOperator, tableSchema: TableSchema, callback: (newOperator: EtlOperator) => void) {
    this.operatorType = ETLOperatorType.PythonOperator;
    this.previousTableSchema = tableSchema;
    this.etlId = etlId;
    this.startCreate();
    this.callback = callback;
    this.model = PythonQueryOperator.default(operator, this.makeDestTableConfig([operator]));
    this.show();
  }

  public edit(etlId: number, operator: QueryOperator, previousTableSchema: TableSchema | null, callback: (newOperator: QueryOperator) => void): void {
    this.operatorType = operator.className;
    this.startEdit();
    this.previousTableSchema = previousTableSchema;
    this.etlId = etlId;
    this.callback = callback;
    this.model = cloneDeep(operator);
    this.show();
  }

  @Track(TrackEvents.ETLSubmitSQLQuery)
  private submit() {
    if (this.model && this.queryBuilder) {
      // @ts-ignore
      this.model.query = this.queryBuilder.getQuery();
    }
    if (this.callback && this.model) {
      this.callback(this.model);
    }
    this.hide();
  }

  @Provide('preProcessQuery')
  async preProcessQuery(query: string): Promise<string> {
    if (QueryOperator.isQueryOperator(this.model) && this.model.requireProcessQuery()) {
      return this.processPython(query, this.model);
    } else {
      return query;
    }
  }

  private async processPython(code: string, operator: QueryOperator): Promise<string> {
    const previewOperator = cloneDeep(operator);
    previewOperator.query = code;
    const previewResponse: PreviewEtlResponse = await this.dataCookService.multiPreview(this.etlId, [previewOperator], true);
    this.ensurePreviewResponse(previewResponse);
    const tableSchemas: TableSchema[] = previewResponse.data?.allTableSchemas ?? [];
    const foundTableSchema = tableSchemas.find(table => operator.destTableName === table.name);
    this.ensureSchema(foundTableSchema);
    return `select * from \`${foundTableSchema!.dbName}\`.\`${foundTableSchema!.name}\``;
  }

  private ensureSchema(foundTableSchema: TableSchema | undefined) {
    if (!foundTableSchema) {
      throw new DIException('Table not found!');
    }
  }

  private ensurePreviewResponse(response: PreviewEtlResponse) {
    if (response.isError) {
      Log.error('ensurePreviewResponse::error');
      throw new DIException(ListUtils.getHead(response.errors)?.message ?? 'Unknown error!');
    }
  }
}
