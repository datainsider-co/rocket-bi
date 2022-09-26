import { Component, Ref } from 'vue-property-decorator';
import { TableSchema } from '@core/domain';
import { EtlOperator, SQLQueryOperator, TableConfiguration, ETL_OPERATOR_TYPE } from '@core/DataCook';
import cloneDeep from 'lodash/cloneDeep';
import QueryBuilder from '@/screens/ChartBuilder/DataCook/QueryBuilder.vue';
import EtlModal from '@/screens/DataCook/components/EtlModal/EtlModal.vue';
import ManageOperatorModal from '@/screens/DataCook/components/ManageOperatorModal/ManageOperatorModal';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';

type TSQLQueryCallback = (newOperator: SQLQueryOperator) => void;

@Component({
  components: {
    EtlModal,
    QueryBuilder
  }
})
export default class QueryTable extends ManageOperatorModal {
  protected operatorType = ETL_OPERATOR_TYPE.SQLQueryOperator;
  private model: SQLQueryOperator | null = null;
  private tableSchema: TableSchema | null = null;
  private callback: TSQLQueryCallback | null = null;

  @Ref()
  private queryBuilder!: QueryBuilder;

  protected resetModel(): void {
    this.model = null;
    this.tableSchema = null;
    this.callback = null;
  }

  private add(operator: EtlOperator, tableSchema: TableSchema, callback: TSQLQueryCallback) {
    this.tableSchema = tableSchema;
    this.startCreate();
    this.callback = callback;
    this.model = new SQLQueryOperator(operator, '', this.makeDestTableConfig([operator]), false, null, null, []);
    this.show();
  }

  private edit(operator: SQLQueryOperator, tableSchema: TableSchema, callback: TSQLQueryCallback) {
    this.startEdit();
    this.tableSchema = tableSchema;
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
}
