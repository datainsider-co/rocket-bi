import { Component, Ref } from 'vue-property-decorator';
import { TableSchema } from '@core/common/domain';
import { EtlOperator, SQLQueryOperator, TableConfiguration, ETL_OPERATOR_TYPE } from '@core/data-cook';
import cloneDeep from 'lodash/cloneDeep';
import QueryBuilder from '@/screens/chart-builder/data-cook/QueryBuilder.vue';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import ManageOperatorModal from '@/screens/data-cook/components/manage-operator-modal/ManageOperatorModal';
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
