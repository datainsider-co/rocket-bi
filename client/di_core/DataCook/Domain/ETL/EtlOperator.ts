/* eslint-disable @typescript-eslint/no-use-before-define */
import { Field, FlattenPivotTableQuerySetting, ScalarFunction, TableQueryChartSetting, TableSchema } from '@core/domain';
import { EQUAL_FIELD_TYPE, ETL_OPERATOR_TYPE, JOIN_TYPE, PERSISTENT_TYPE } from './EtlEnum';
import cloneDeep from 'lodash/cloneDeep';
import { ThirdPartyPersistConfiguration } from '@core/DataCook/Domain/ETL/ThirdPartyPersistConfiguration/ThirdPartyPersistConfiguration';
import { EmailConfiguration } from '@core/DataCook';

export abstract class EtlOperator {
  readonly isJoin: boolean = false;
  readonly isGetData: boolean = false;
  readonly isManageFields: boolean = false;
  readonly isPivot: boolean = false;
  readonly isTransform: boolean = false;
  readonly isSendToGroupEmail: boolean = false;

  protected constructor(
    public className: ETL_OPERATOR_TYPE,
    public destTableConfiguration: TableConfiguration,
    public isPersistent: boolean,
    public persistConfiguration: PersistConfiguration | null,
    public emailConfiguration: EmailConfiguration | null,
    public thirdPartyPersistConfigurations: ThirdPartyPersistConfiguration[] | []
  ) {}

  get destTableName() {
    return this.destTableConfiguration.tblName;
  }

  get destTableDisplayName() {
    return this.destTableConfiguration.tblDisplayName;
  }

  get destDatabaseDisplayName() {
    return this.destTableConfiguration.dbDisplayName;
  }

  getAllGetDataOperators(): GetDataOperator[] {
    return [];
  }

  getAllNotGetDataOperators(): EtlOperator[] {
    return [this];
  }

  getAllOperators(): EtlOperator[] {
    return (this.getAllGetDataOperators() as EtlOperator[]).concat(this.getAllNotGetDataOperators());
  }

  getLeftTables(): TableSchema[] {
    return [];
  }

  getLeftOperators(): EtlOperator[] {
    return [];
  }

  getDestTables(): TableConfiguration[] {
    if (this.destTableConfiguration) {
      return [this.destTableConfiguration];
    }
    return [];
  }

  static fromObject(obj: EtlOperator): EtlOperator {
    switch (obj.className) {
      case ETL_OPERATOR_TYPE.JoinOperator:
        return JoinOperator.fromObject(obj);
      case ETL_OPERATOR_TYPE.TransformOperator:
        return TransformOperator.fromObject(obj);
      case ETL_OPERATOR_TYPE.ManageFieldOperator:
        return ManageFieldOperator.fromObject(obj);
      case ETL_OPERATOR_TYPE.PivotTableOperator:
        return PivotTableOperator.fromObject(obj);
      case ETL_OPERATOR_TYPE.SQLQueryOperator:
        return SQLQueryOperator.fromObject(obj);
      case ETL_OPERATOR_TYPE.GetDataOperator:
        return GetDataOperator.fromObject(obj);
      case ETL_OPERATOR_TYPE.SendToGroupEmailOperator:
        return SendToGroupEmailOperator.fromObject(obj);
      default:
        return GetDataOperator.fromObject(obj);
    }
  }

  static unique(operators: EtlOperator[]): EtlOperator[] {
    const operatorAsMap: Map<string, EtlOperator> = new Map(operators.map(operator => [operator.destTableName, operator]));
    return Array.from(operatorAsMap.values());
  }
}

export class TableConfiguration {
  constructor(public tblName: string, public dbDisplayName: string, public tblDisplayName: string) {}

  static fromObject(obj: TableConfiguration): TableConfiguration {
    return new TableConfiguration(obj.tblName, obj.dbDisplayName, obj.tblDisplayName);
  }
}

export class PersistConfiguration {
  constructor(public dbName: string, public tblName: string, public type: PERSISTENT_TYPE) {}
}

export class GetDataOperator extends EtlOperator {
  readonly isGetData: boolean = true;

  constructor(
    public tableSchema: TableSchema,
    public destTableConfig: TableConfiguration,
    isPersistent = false,
    persistConfiguration: PersistConfiguration | null = null,
    emailConfiguration: EmailConfiguration | null = null,
    thirdPartyPersistConfigurations: ThirdPartyPersistConfiguration[] = []
  ) {
    super(ETL_OPERATOR_TYPE.GetDataOperator, destTableConfig, isPersistent, persistConfiguration, emailConfiguration, thirdPartyPersistConfigurations);
  }

  get destTableConfiguration(): TableConfiguration {
    return this.destTableConfig;
  }

  set destTableConfiguration(value: TableConfiguration) {
    this.destTableConfig = value;
  }

  getAllGetDataOperators(): GetDataOperator[] {
    return [this];
  }

  getLeftTables(): TableSchema[] {
    return [this.tableSchema];
  }

  getDestTables(): TableConfiguration[] {
    return [];
  }

  getAllNotGetDataOperators(): EtlOperator[] {
    return [];
  }

  static fromObject(obj: EtlOperator): EtlOperator {
    const temp = obj as GetDataOperator;
    return new GetDataOperator(
      TableSchema.fromObject(temp.tableSchema),
      TableConfiguration.fromObject(temp.destTableConfig),
      temp.isPersistent,
      temp.persistConfiguration,
      temp.emailConfiguration,
      (temp.thirdPartyPersistConfigurations as []).map(item => ThirdPartyPersistConfiguration.fromObject(item))
    );
  }
}

export class JoinOperator extends EtlOperator {
  readonly isJoin = true;

  constructor(
    public joinConfigs: JoinConfig[],
    public destTableConfiguration: TableConfiguration,
    public isPersistent: boolean,
    public persistConfiguration: PersistConfiguration | null,
    public emailConfiguration: EmailConfiguration | null,
    public thirdPartyPersistConfigurations: ThirdPartyPersistConfiguration[] = []
  ) {
    super(ETL_OPERATOR_TYPE.JoinOperator, destTableConfiguration, isPersistent, persistConfiguration, emailConfiguration, thirdPartyPersistConfigurations);
  }

  getAllGetDataOperators(): GetDataOperator[] {
    let result: GetDataOperator[] = [];

    this.joinConfigs.forEach(joinConfig => {
      result = result.concat(joinConfig.leftOperator.getAllGetDataOperators(), joinConfig.rightOperator.getAllGetDataOperators());
    });

    return result;
  }

  getLeftTables(): TableSchema[] {
    let result: TableSchema[] = [];

    this.joinConfigs.forEach(joinConfig => {
      result = result.concat(joinConfig.leftOperator.getLeftTables(), joinConfig.rightOperator.getLeftTables());
    });

    return result;
  }

  getLeftOperators(): EtlOperator[] {
    let result: EtlOperator[] = [];

    this.joinConfigs.forEach(joinConfig => {
      result = result.concat(joinConfig.leftOperator, joinConfig.rightOperator);
    });

    return result;
  }

  getDestTables(): TableConfiguration[] {
    let result: TableConfiguration[] = [];

    this.joinConfigs.forEach(joinConfig => {
      if (joinConfig.leftOperator.destTableConfiguration) {
        result = result.concat(joinConfig.leftOperator.getDestTables());
      }
      if (joinConfig.rightOperator.destTableConfiguration) {
        result = result.concat(joinConfig.rightOperator.getDestTables());
      }
    });

    if (this.destTableConfiguration) {
      result.push(this.destTableConfiguration);
    }

    return result;
  }

  getAllNotGetDataOperators(): EtlOperator[] {
    let result: EtlOperator[] = [];
    this.joinConfigs.forEach(joinConfig => {
      if (joinConfig.leftOperator.destTableConfiguration) {
        result = result.concat(joinConfig.leftOperator.getAllNotGetDataOperators());
      }
      if (joinConfig.rightOperator.destTableConfiguration) {
        result = result.concat(joinConfig.rightOperator.getAllNotGetDataOperators());
      }
    });

    result.push(this);

    return result;
  }

  static fromObject(obj: EtlOperator): EtlOperator {
    const temp = obj as JoinOperator;
    return new JoinOperator(
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      temp.joinConfigs.map(JoinConfig.fromObject),
      TableConfiguration.fromObject(temp.destTableConfiguration),
      temp.isPersistent,
      temp.persistConfiguration,
      temp.emailConfiguration,
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      temp.thirdPartyPersistConfigurations.map(item => ThirdPartyPersistConfiguration.fromObject(item))
    );
  }
}

export class TransformOperator extends EtlOperator {
  readonly isTransform: boolean = true;
  private _query!: TableQueryChartSetting;

  constructor(
    public operator: EtlOperator,
    query: TableQueryChartSetting,
    public destTableConfiguration: TableConfiguration,
    public isPersistent = false,
    public persistConfiguration: PersistConfiguration | null,
    public emailConfiguration: EmailConfiguration | null,
    public thirdPartyPersistConfigurations: ThirdPartyPersistConfiguration[] = []
  ) {
    super(ETL_OPERATOR_TYPE.TransformOperator, destTableConfiguration, isPersistent, persistConfiguration, emailConfiguration, thirdPartyPersistConfigurations);
    this.query = query;
  }

  get query(): TableQueryChartSetting {
    return this._query;
  }

  set query(value: TableQueryChartSetting) {
    this._query = cloneDeep(value);
    this._query.options = {};
  }

  getLeftOperators(): EtlOperator[] {
    return [this.operator];
  }

  getLeftTables(): TableSchema[] {
    return this.operator.getLeftTables();
  }

  getAllGetDataOperators(): GetDataOperator[] {
    return this.operator.getAllGetDataOperators();
  }

  getAllNotGetDataOperators(): EtlOperator[] {
    const result: EtlOperator[] = this.operator.getAllNotGetDataOperators();
    result.push(this);
    return result;
  }

  static fromObject(obj: EtlOperator): EtlOperator {
    const temp = obj as TransformOperator;
    return new TransformOperator(
      EtlOperator.fromObject(temp.operator),
      TableQueryChartSetting.fromObject(temp.query),
      TableConfiguration.fromObject(temp.destTableConfiguration),
      temp.isPersistent,
      temp.persistConfiguration,
      temp.emailConfiguration,
      temp.thirdPartyPersistConfigurations.map(item => ThirdPartyPersistConfiguration.fromObject(item))
    );
  }
}

export class ManageFieldOperator extends EtlOperator {
  readonly isManageFields: boolean = true;

  constructor(
    public operator: EtlOperator,
    public fields: NormalFieldConfiguration[],
    public extraFields: ExpressionFieldConfiguration[],
    public destTableConfiguration: TableConfiguration,
    public isPersistent = false,
    public persistConfiguration: PersistConfiguration | null,
    public emailConfiguration: EmailConfiguration | null,
    public thirdPartyPersistConfigurations: ThirdPartyPersistConfiguration[] = []
  ) {
    super(
      ETL_OPERATOR_TYPE.ManageFieldOperator,
      destTableConfiguration,
      isPersistent,
      persistConfiguration,
      emailConfiguration,
      thirdPartyPersistConfigurations
    );
  }

  get totalFields() {
    return this.fields.length + this.extraFields.length;
  }

  getLeftOperators(): EtlOperator[] {
    return [this.operator];
  }

  getLeftTables(): TableSchema[] {
    return this.operator.getLeftTables();
  }

  getAllGetDataOperators(): GetDataOperator[] {
    return this.operator.getAllGetDataOperators();
  }

  getAllNotGetDataOperators(): EtlOperator[] {
    const result: EtlOperator[] = this.operator.getAllNotGetDataOperators();
    result.push(this);
    return result;
  }

  static fromObject(obj: EtlOperator): EtlOperator {
    const temp = obj as ManageFieldOperator;
    return new ManageFieldOperator(
      EtlOperator.fromObject(temp.operator),
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      temp.fields.map(NormalFieldConfiguration.fromObject),
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      temp.extraFields.map(ExpressionFieldConfiguration.fromObject),
      TableConfiguration.fromObject(temp.destTableConfiguration),
      temp.isPersistent,
      temp.persistConfiguration,
      temp.emailConfiguration,
      temp.thirdPartyPersistConfigurations.map(item => ThirdPartyPersistConfiguration.fromObject(item))
    );
  }
}

export class SendToGroupEmailOperator extends EtlOperator {
  readonly isSendToGroupEmail: boolean = true;
  displayName: string | null;
  receivers: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  content: string | null;
  fileNames: string[];
  isZip: boolean;

  constructor(
    public operators: EtlOperator[],
    destTableConfiguration: TableConfiguration,
    receivers: string[],
    cc: string[] = [],
    bcc: string[] = [],
    subject: string,
    fileNames: string[] = [],
    content?: string | null,
    displayName?: string | null,
    isZip = false
  ) {
    super(ETL_OPERATOR_TYPE.SendToGroupEmailOperator, destTableConfiguration, false, null, null, []);
    this.receivers = receivers;
    this.cc = cc;
    this.bcc = bcc;
    this.subject = subject;
    this.fileNames = fileNames;
    this.content = content || null;
    this.displayName = displayName || null;
    this.isZip = isZip;
  }

  getLeftOperators(): EtlOperator[] {
    return this.operators ?? [];
  }

  getLeftTables(): TableSchema[] {
    return this.operators.flatMap(operator => operator.getLeftTables());
  }

  getAllGetDataOperators(): GetDataOperator[] {
    return this.operators.flatMap(operator => operator.getAllGetDataOperators());
  }

  getAllNotGetDataOperators(): EtlOperator[] {
    const operators: EtlOperator[] = this.operators.flatMap(operator => operator.getAllNotGetDataOperators());
    operators.push(this);
    return operators;
  }

  static fromObject(obj: EtlOperator): SendToGroupEmailOperator {
    const operator: SendToGroupEmailOperator = obj as SendToGroupEmailOperator;
    const operators: EtlOperator[] = operator.operators.map(operator => EtlOperator.fromObject(operator));
    const tableConfiguration: TableConfiguration = TableConfiguration.fromObject(operator.destTableConfiguration);
    return new SendToGroupEmailOperator(
      operators,
      tableConfiguration,
      operator.receivers,
      operator.cc,
      operator.bcc,
      operator.subject,
      operator.fileNames,
      operator.content,
      operator.displayName,
      operator.isZip
    );
  }
}

export class PivotTableOperator extends EtlOperator {
  readonly isPivot: boolean = true;
  private _query!: FlattenPivotTableQuerySetting;

  constructor(
    public operator: EtlOperator,
    query: FlattenPivotTableQuerySetting,
    public destTableConfiguration: TableConfiguration,
    public isPersistent = false,
    public persistConfiguration: PersistConfiguration | null,
    public emailConfiguration: EmailConfiguration | null,
    public thirdPartyPersistConfigurations: ThirdPartyPersistConfiguration[] = []
  ) {
    super(
      ETL_OPERATOR_TYPE.PivotTableOperator,
      destTableConfiguration,
      isPersistent,
      persistConfiguration,
      emailConfiguration,
      thirdPartyPersistConfigurations
    );
    this.query = query;
  }

  get query(): FlattenPivotTableQuerySetting {
    return this._query;
  }

  set query(value: FlattenPivotTableQuerySetting) {
    this._query = cloneDeep(value);
    this._query.options = {};
  }

  getLeftOperators(): EtlOperator[] {
    return [this.operator];
  }

  getLeftTables(): TableSchema[] {
    return this.operator.getLeftTables();
  }

  getAllGetDataOperators(): GetDataOperator[] {
    return this.operator.getAllGetDataOperators();
  }

  getAllNotGetDataOperators(): EtlOperator[] {
    const result: EtlOperator[] = this.operator.getAllNotGetDataOperators();
    result.push(this);
    return result;
  }

  static fromObject(obj: EtlOperator): EtlOperator {
    const temp = obj as PivotTableOperator;
    return new PivotTableOperator(
      EtlOperator.fromObject(temp.operator),
      FlattenPivotTableQuerySetting.fromObject(temp.query),
      TableConfiguration.fromObject(temp.destTableConfiguration),
      temp.isPersistent,
      temp.persistConfiguration,
      temp.emailConfiguration,
      temp.thirdPartyPersistConfigurations.map(item => ThirdPartyPersistConfiguration.fromObject(item))
    );
  }
}

export class SQLQueryOperator extends EtlOperator {
  constructor(
    public operator: EtlOperator,
    public query: string,
    public destTableConfiguration: TableConfiguration,
    public isPersistent = false,
    public persistConfiguration: PersistConfiguration | null,
    public emailConfiguration: EmailConfiguration | null,
    public thirdPartyPersistConfigurations: ThirdPartyPersistConfiguration[] = []
  ) {
    super(ETL_OPERATOR_TYPE.SQLQueryOperator, destTableConfiguration, isPersistent, persistConfiguration, emailConfiguration, thirdPartyPersistConfigurations);
  }

  getLeftOperators(): EtlOperator[] {
    return [this.operator];
  }

  getLeftTables(): TableSchema[] {
    return this.operator.getLeftTables();
  }

  getAllGetDataOperators(): GetDataOperator[] {
    return this.operator.getAllGetDataOperators();
  }

  getAllNotGetDataOperators(): EtlOperator[] {
    const result: EtlOperator[] = this.operator.getAllNotGetDataOperators();
    result.push(this);
    return result;
  }

  static fromObject(obj: EtlOperator): EtlOperator {
    const temp = obj as SQLQueryOperator;
    return new SQLQueryOperator(
      EtlOperator.fromObject(temp.operator),
      temp.query,
      TableConfiguration.fromObject(temp.destTableConfiguration),
      temp.isPersistent,
      temp.persistConfiguration,
      temp.emailConfiguration,
      temp.thirdPartyPersistConfigurations.map(item => ThirdPartyPersistConfiguration.fromObject(item))
    );
  }
}

export class JoinCondition {
  leftFieldName: string;
  rightFieldName: string;

  constructor(public className: EQUAL_FIELD_TYPE = EQUAL_FIELD_TYPE.EqualField, public leftField: Field | null, public rightField: Field | null) {
    this.leftFieldName = leftField?.fieldName ?? '';
    this.rightFieldName = rightField?.fieldName ?? '';
  }

  get isInvalid() {
    return !this.leftField || !this.rightField;
  }

  static fromObject(obj: JoinCondition): JoinCondition {
    return new JoinCondition(obj.className, obj.leftField ? Field.fromObject(obj.leftField) : null, obj.rightField ? Field.fromObject(obj.rightField) : null);
  }
}

export class JoinConfig {
  constructor(public leftOperator: EtlOperator, public rightOperator: EtlOperator, public conditions: JoinCondition[], public joinType: JOIN_TYPE) {}

  get operators() {
    return [this.leftOperator, this.rightOperator];
  }

  get isInvalid() {
    if (!this.conditions.length) return true;
    let isInvalid = false;
    for (let i = 0; i < this.conditions.length; i++) {
      if (this.conditions[i].isInvalid) {
        isInvalid = true;
        break;
      }
    }
    return isInvalid;
  }

  static fromObject(obj: JoinConfig): JoinConfig {
    return new JoinConfig(
      EtlOperator.fromObject(obj.leftOperator),
      EtlOperator.fromObject(obj.rightOperator),
      obj.conditions.map(JoinCondition.fromObject),
      obj.joinType
    );
  }
}

export abstract class FieldConfiguration {
  abstract displayName: string;
  abstract isHidden: boolean;
  abstract asType: string | null;
  abstract fieldName: string;
}

export class NormalFieldConfiguration extends FieldConfiguration {
  constructor(
    public displayName: string,
    public field: Field,
    public isHidden: boolean = false,
    public asType: string | null = null,
    public scalarFunction: ScalarFunction | null = null
  ) {
    super();
  }

  get fieldName() {
    return this.field.fieldName;
  }

  static fromObject(obj: NormalFieldConfiguration): NormalFieldConfiguration {
    return new NormalFieldConfiguration(obj.displayName, Field.fromObject(obj.field), obj.isHidden, obj.asType, obj.scalarFunction);
  }
}

export class ExpressionFieldConfiguration extends FieldConfiguration {
  constructor(
    public fieldName: string,
    public displayName: string,
    public expression: string,
    public asType: string | null = null,
    public isHidden: boolean = false
  ) {
    super();
  }

  static fromObject(obj: ExpressionFieldConfiguration): ExpressionFieldConfiguration {
    return new ExpressionFieldConfiguration(obj.fieldName, obj.displayName, obj.expression, obj.asType, obj.isHidden);
  }
}
