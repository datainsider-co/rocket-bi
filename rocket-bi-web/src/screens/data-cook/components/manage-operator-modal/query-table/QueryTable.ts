import { Component, Provide, Ref } from 'vue-property-decorator';
import { DIException, TableSchema } from '@core/common/domain';
import {
  DataCookService,
  ETL_OPERATOR_TYPE,
  EtlOperator,
  EtlQueryLanguages,
  MultiPreviewEtlOperatorResponse,
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
import { PopupUtils } from '@/utils';

type TSQLQueryCallback = (newOperator: EtlOperator) => void;

@Component({
  components: {
    EtlModal,
    QueryBuilder
  }
})
export default class QueryTable extends ManageOperatorModal {
  protected operatorType = ETL_OPERATOR_TYPE.SQLQueryOperator;
  private model: QueryOperator | null = null;
  private tableSchema: TableSchema | null = null;
  private callback: TSQLQueryCallback | null = null;
  private etlId = -1;

  @Ref()
  private queryBuilder!: QueryBuilder;

  @InjectService
  private readonly dataCookService!: DataCookService;

  protected resetModel(): void {
    this.model = null;
    this.tableSchema = null;
    this.callback = null;
    this.etlId = -1;
  }

  private add(etlId: number, operator: EtlOperator, tableSchema: TableSchema, callback: TSQLQueryCallback) {
    this.tableSchema = tableSchema;
    this.etlId = etlId;
    this.startCreate();
    this.callback = callback;
    this.model = SQLQueryOperator.default(operator, this.makeDestTableConfig([operator]));
    this.show();
  }

  private edit(etlId: number, operator: QueryOperator, tableSchema: TableSchema, callback: TSQLQueryCallback) {
    this.startEdit();
    this.tableSchema = tableSchema;
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
    const previewResponse: MultiPreviewEtlOperatorResponse = await this.dataCookService.multiPreview(this.etlId, [previewOperator], true);
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

  private ensurePreviewResponse(response: MultiPreviewEtlOperatorResponse) {
    if (response.isError) {
      Log.error(response);
      throw new DIException(response.error!.message);
    }
  }
}
