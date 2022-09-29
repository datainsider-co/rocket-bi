import { Component, Watch } from 'vue-property-decorator';
import EtlModal from '../../etl-modal/EtlModal.vue';
import { Column, Field, TableSchema } from '@core/common/domain';
import {
  EQUAL_FIELD_TYPE,
  EQUAL_FIELD_TYPE_NAME,
  ETL_OPERATOR_TYPE,
  EtlOperator,
  GetDataOperator,
  JOIN_TYPE,
  JOIN_TYPE_NAME,
  JoinCondition,
  JoinConfig,
  JoinOperator,
  TableConfiguration
} from '@core/data-cook';
import { IconUtils } from '@/utils';
import cloneDeep from 'lodash/cloneDeep';
import ManageOperatorModal from '@/screens/data-cook/components/manage-operator-modal/ManageOperatorModal';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import SelectSource from '@/screens/data-cook/components/select-source/SelectSource.vue';

type TJoinTableCallback = (newOperator: JoinOperator) => void;

@Component({
  components: {
    EtlModal
  }
})
export default class JoinTable extends ManageOperatorModal {
  protected readonly operatorType = ETL_OPERATOR_TYPE.JoinOperator;
  private model: JoinOperator | null = null;
  private leftTableSchema: TableSchema | null = null;
  private rightTableSchema: TableSchema | null = null;
  private callback: TJoinTableCallback | null = null;
  private errorMsg = '';

  private get joinTypes() {
    return [JOIN_TYPE.Left, JOIN_TYPE.Inner, JOIN_TYPE.Right, JOIN_TYPE.FullOuter];
  }

  private getJoinTypeName(joinType: JOIN_TYPE) {
    return JOIN_TYPE_NAME[joinType];
  }

  private get leftColumns(): Column[] {
    if (this.leftTableSchema) {
      return this.leftTableSchema.columns;
    }
    return [];
  }

  private get rightColumns(): Column[] {
    if (this.rightTableSchema) {
      return this.rightTableSchema.columns;
    }
    return [];
  }

  private get joinConfig() {
    if (this.model?.joinConfigs[0]) {
      return this.model?.joinConfigs[0];
    }
    return null;
  }

  protected resetModel() {
    this.model = null;
    this.leftTableSchema = null;
    this.rightTableSchema = null;
    this.callback = null;
    this.errorMsg = '';
  }

  private getColumnIcon(column: Column) {
    return IconUtils.getIconComponent(column);
  }

  @Track(TrackEvents.JoinTableShowCreateModal)
  private add(
    leftOperator: EtlOperator,
    rightOperator: EtlOperator,
    leftTableSchema: TableSchema,
    rightTableSchema: TableSchema,
    callback: TJoinTableCallback
  ) {
    this.startCreate();
    this.callback = callback;
    this.leftTableSchema = leftTableSchema;
    this.rightTableSchema = rightTableSchema;
    this.model = new JoinOperator(
      [new JoinConfig(leftOperator, rightOperator, [], JOIN_TYPE.Left)],
      this.makeDestTableConfig([leftOperator, rightOperator]),
      false,
      null,
      null,
      []
    );
    this.show();
  }

  @Track(TrackEvents.JoinTableShowEditModal)
  private edit(operator: JoinOperator, leftTableSchema: TableSchema, rightTableSchema: TableSchema, callback: TJoinTableCallback) {
    this.startEdit();
    this.callback = callback;
    this.leftTableSchema = leftTableSchema;
    this.rightTableSchema = rightTableSchema;
    this.model = cloneDeep(operator);
    this.show();
  }

  @Track(TrackEvents.JoinTableSubmit, {
    from_database_name: (_: JoinTable) => _.leftTableSchema?.dbName,
    from_table_name: (_: JoinTable) => _.leftTableSchema?.name,
    to_database_name: (_: JoinTable) => _.rightTableSchema?.dbName,
    to_table_name: (_: JoinTable) => _.rightTableSchema?.name,
    join_type: (_: JoinTable) => _.joinConfig?.joinType,
    from_columns: (_: JoinTable) => _.joinConfig?.conditions.map(condition => condition.leftField?.fieldName).join(','),
    to_columns: (_: JoinTable) => _.joinConfig?.conditions.map(condition => condition.rightField?.fieldName).join(',')
  })
  private submit() {
    this.errorMsg = '';
    if (!this.joinConfig?.conditions.length) {
      this.errorMsg = 'Missing join clause';
      return;
    } else if (this.joinConfig?.isInvalid) {
      this.errorMsg = 'Join clause is invalid';
      return;
    }
    this.$emit('submit', this.model);
    if (this.callback && this.model) {
      this.callback(this.model);
    }
    this.hide();
  }

  @Track(TrackEvents.JoinTableAddJoinClause)
  private addCondition() {
    if (this.model?.joinConfigs[0]) {
      this.model?.joinConfigs[0].conditions.push(new JoinCondition(EQUAL_FIELD_TYPE.EqualField, null, null));
    }
  }

  @Track(TrackEvents.JoinTableRemoveJoinClause, {
    left_column_name: (_: JoinTable, args: any) => args[0].leftFieldName,
    right_column_name: (_: JoinTable, args: any) => args[0].rightFieldName
  })
  private removeCondition(condition: JoinCondition) {
    if (this.model?.joinConfigs[0]) {
      this.model.joinConfigs[0].conditions = this.model?.joinConfigs[0].conditions.filter(cond => cond !== condition);
    }
  }

  @Track(TrackEvents.JoinTableSelectLeftJoinClause, {
    left_column_name: (_: JoinTable, args: any) => args[0].leftFieldName,
    right_column_name: (_: JoinTable, args: any) => args[0].rightFieldName
  })
  private onSelectLeftColumn(condition: JoinCondition, column: Column) {
    if (this.leftTableSchema) {
      condition.leftField = Field.new(this.leftTableSchema.dbName, this.leftTableSchema.name, column.name, column.className.toString());
    }
  }

  @Track(TrackEvents.JoinTableSelectRightJoinClause, {
    left_column_name: (_: JoinTable, args: any) => args[0].leftFieldName,
    right_column_name: (_: JoinTable, args: any) => args[0].rightFieldName
  })
  private onSelectRightColumn(condition: JoinCondition, column: Column) {
    if (this.rightTableSchema) {
      condition.rightField = Field.new(this.rightTableSchema.dbName, this.rightTableSchema.name, column.name, column.className.toString());
    }
  }

  @Watch('joinConfig', { deep: true })
  private handleJoinConfigChange() {
    this.errorMsg = '';
  }
}
