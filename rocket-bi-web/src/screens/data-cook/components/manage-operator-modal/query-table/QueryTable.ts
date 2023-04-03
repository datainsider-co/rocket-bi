import { Component, Provide, Ref } from 'vue-property-decorator';
import { DatabaseSchema, DIException, TableSchema } from '@core/common/domain';
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

  private get etlDatabase(): DatabaseSchema {
    if (this.previousTableSchema) {
      return DatabaseSchema.etlDatabase(this.previousTableSchema.dbName, this.etlDbDisplayName, [this.previousTableSchema]);
    } else {
      return DatabaseSchema.etlDatabase(this.getEtlDbName(), this.etlDbDisplayName, []);
    }
  }

  protected resetModel(): void {
    this.model = null;
    this.previousTableSchema = null;
    this.callback = null;
    this.etlId = -1;
  }

  public add(etlId: number, operator: EtlOperator, tableSchema: TableSchema, callback: (newOperator: EtlOperator) => void) {
    this.previousTableSchema = tableSchema;
    this.etlId = etlId;
    this.startCreate();
    this.callback = callback;
    this.model = SQLQueryOperator.default(operator, this.makeDestTableConfig([operator]));
    this.show();
  }

  public edit(etlId: number, operator: QueryOperator, previousTableSchema: TableSchema | null, callback: (newOperator: QueryOperator) => void): void {
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

  private onSelectLanguage(language: EtlQueryLanguages) {
    switch (language) {
      case EtlQueryLanguages.ClickHouse: {
        const queryOperator = SQLQueryOperator.fromObject(this.model as any) as SQLQueryOperator;
        queryOperator.query = window.queryLanguages.clickHouse.default;
        this.model = queryOperator;
        Log.debug('onSelectLanguage', this.model);
        break;
      }
      case EtlQueryLanguages.Python: {
        const pythonOperator = PythonQueryOperator.fromObject(this.model as any) as PythonQueryOperator;
        pythonOperator.code = window.queryLanguages.python3.default;
        this.model = pythonOperator;
        break;
      }
    }
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
