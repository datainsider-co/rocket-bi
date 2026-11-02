import { asArray, asBoolean, asRecord, asString, isRecord, withoutUndefined, type JsonObject } from '@/core/json/json';
import { tableSchemaFromJson, type TableSchema } from '@/core/schema/SchemaService';

/**
 * One step of an ETL (v1 `EtlOperator`), discriminated by `class_name`. Every operator nests the operators it reads
 * from, so an ETL's `operators` (its leaves) are trees, and an operator two steps read from shows up in both. Its
 * destination table name (`destTable.tblName`) identifies it. Plain values with the JSON they were read from in
 * `json`: writing merges the edits onto it, and a `class_name` v2 doesn't know is `UnsupportedOperator`, written back
 * as it came.
 */

export const EtlOperatorClassName = {
  GetData: 'get_data_operator',
  Join: 'join_operator',
  Transform: 'transform_operator',
  ManageFields: 'manage_field_operator',
  Pivot: 'pivot_table_operator',
  SqlQuery: 'sql_query_operator',
  Python: 'python_operator',
  SendEmail: 'send_to_group_email_operator'
} as const;

/** The table an operator writes in the ETL's database (`preview_etl_<id>` while previewing). */
export interface TableConfiguration {
  readonly tblName: string;
  readonly dbDisplayName: string;
  readonly tblDisplayName: string;
}

/** `db_display_name` of the tables operators write; v1's `etlDbDisplayName`. */
export const ETL_DB_DISPLAY_NAME = 'ETL Database';

export const PersistType = {
  /** Overwrites the table's data and schema. */
  Update: 'Update',
  Append: 'Append'
} as const;

export type PersistType = (typeof PersistType)[keyof typeof PersistType];

/** Save To Data Warehouse. */
export interface PersistConfiguration {
  readonly dbName: string;
  readonly tblName: string;
  readonly type: PersistType;
}

export const JoinType = {
  Left: 'left',
  Right: 'right',
  Inner: 'inner',
  FullOuter: 'full_outer'
} as const;

export type JoinType = (typeof JoinType)[keyof typeof JoinType];

/** v1 `EQUAL_FIELD_TYPE` without `and` / `or`, which v1 never built. */
export const JoinConditionType = {
  Equal: 'equal_field',
  NotEqual: 'not_equal_field',
  LessThan: 'less_than_field',
  GreaterThan: 'greater_than_field',
  LessOrEqual: 'less_or_equal_field',
  GreaterOrEqual: 'greater_or_equal_field'
} as const;

export type JoinConditionType = (typeof JoinConditionType)[keyof typeof JoinConditionType];

const JOIN_TYPES: readonly string[] = Object.values(JoinType);
const JOIN_CONDITION_TYPES: readonly string[] = Object.values(JoinConditionType);

/** Fields are the server's `table_field` JSON, on the parents' tables in the ETL's database. */
export interface JoinCondition {
  readonly type: JoinConditionType;
  readonly leftField: JsonObject | undefined;
  readonly rightField: JsonObject | undefined;
}

export interface JoinConfig {
  readonly left: EtlOperator;
  readonly right: EtlOperator;
  readonly conditions: readonly JoinCondition[];
  readonly joinType: JoinType;
}

/** A column kept by Manage Fields: renamed (`displayName`), hidden or cast (`asType`, a column `class_name`). */
export interface FieldConfiguration {
  readonly displayName: string;
  /** The server's `table_field` JSON. */
  readonly field: JsonObject;
  readonly isHidden: boolean;
  readonly asType: string | undefined;
  /** A scalar function JSON, which v1 could store but never offered. */
  readonly scalarFunction: JsonObject | undefined;
}

/** A column Manage Fields adds from an SQL expression. */
export interface ExpressionFieldConfiguration {
  readonly fieldName: string;
  readonly displayName: string;
  readonly expression: string;
  readonly asType: string | undefined;
  readonly isHidden: boolean;
}

export type EmailFileType = 'Csv' | 'Excel';

interface OperatorBase {
  readonly className: string;
  readonly destTable: TableConfiguration;
  /** Save To Data Warehouse; `undefined` when the table is not saved. */
  readonly persist: PersistConfiguration | undefined;
  /** Save To Database, kept as the server sent them: v2 doesn't edit them yet. */
  readonly thirdPartyPersists: readonly JsonObject[];
  readonly json: JsonObject;
}

/** A source table. Its own JSON keeps the table's dest config under `dest_table_config`, not `..._configuration`. */
export interface GetDataOperator extends OperatorBase {
  readonly kind: 'getData';
  /** The source table, read from `table_schema`; the JSON itself stays in `json`. */
  readonly tableSchema: TableSchema;
}

export interface JoinOperator extends OperatorBase {
  readonly kind: 'join';
  readonly joins: readonly JoinConfig[];
}

/** Table (`transform_operator`) and Flatten Pivot (`pivot_table_operator`): a query setting built with ChartBuilder. */
export interface QuerySettingOperator extends OperatorBase {
  readonly kind: 'transform' | 'pivot';
  readonly parent: EtlOperator;
  /** The query setting JSON, kept as the server sent it (`options` is always empty). */
  readonly query: JsonObject;
}

export interface ManageFieldsOperator extends OperatorBase {
  readonly kind: 'manageFields';
  readonly parent: EtlOperator;
  readonly fields: readonly FieldConfiguration[];
  readonly extraFields: readonly ExpressionFieldConfiguration[];
}

export interface SqlQueryOperator extends OperatorBase {
  readonly kind: 'sql';
  readonly parent: EtlOperator;
  readonly query: string;
}

export interface PythonOperator extends OperatorBase {
  readonly kind: 'python';
  readonly parent: EtlOperator;
  readonly code: string;
}

/** Send To Email: mails the tables of `parents` as attachments. Never saved to a table. */
export interface SendEmailOperator extends OperatorBase {
  readonly kind: 'sendEmail';
  readonly parents: readonly EtlOperator[];
  readonly receivers: readonly string[];
  readonly cc: readonly string[];
  readonly bcc: readonly string[];
  readonly subject: string;
  readonly content: string | undefined;
  readonly displayName: string | undefined;
  readonly fileNames: readonly string[];
  readonly isZip: boolean;
  readonly fileType: EmailFileType;
}

/** A `class_name` v2 doesn't know. Its parents are unknown too, so it is a node on its own. */
export interface UnsupportedOperator extends OperatorBase {
  readonly kind: 'unsupported';
}

export type EtlOperator =
  | GetDataOperator
  | JoinOperator
  | QuerySettingOperator
  | ManageFieldsOperator
  | SqlQueryOperator
  | PythonOperator
  | SendEmailOperator
  | UnsupportedOperator;

/** v1 `ETL_OPERATOR_TYPE_NAME`, the operator's name on the canvas and in its dialog. */
export const OPERATOR_TITLES: Readonly<Record<EtlOperator['kind'], string>> = {
  getData: 'Load Dataset',
  join: 'Join Table',
  transform: 'Transform Table',
  pivot: 'Pivot Table',
  manageFields: 'Manage Fields',
  sql: 'SQL Query',
  python: 'Python Query',
  sendEmail: 'Send Email',
  unsupported: 'Unsupported'
};

const GET_DATA_DEST_KEY = 'dest_table_config';
const DEST_KEY = 'dest_table_configuration';

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function optionalRecord(value: unknown): JsonObject | undefined {
  return isRecord(value) ? value : undefined;
}

function strings(value: unknown): string[] {
  return asArray(value).filter((item): item is string => typeof item === 'string');
}

export function tableConfigurationFromJson(value: unknown): TableConfiguration {
  const json = asRecord(value);
  const tblName = asString(json['tbl_name']);
  return {
    tblName,
    dbDisplayName: asString(json['db_display_name']),
    tblDisplayName: asString(json['tbl_display_name']) || tblName
  };
}

export function tableConfigurationToJson(table: TableConfiguration): JsonObject {
  return { tbl_name: table.tblName, db_display_name: table.dbDisplayName, tbl_display_name: table.tblDisplayName };
}

function persistFromJson(value: unknown): PersistConfiguration | undefined {
  if (!isRecord(value)) return undefined;
  return {
    dbName: asString(value['db_name']),
    tblName: asString(value['tbl_name']),
    type: value['type'] === PersistType.Append ? PersistType.Append : PersistType.Update
  };
}

function persistToJson(persist: PersistConfiguration): JsonObject {
  return { db_name: persist.dbName, tbl_name: persist.tblName, type: persist.type };
}

function joinConditionFromJson(value: unknown): JoinCondition {
  const json = asRecord(value);
  const type = asString(json['class_name']);
  return {
    type: JOIN_CONDITION_TYPES.includes(type) ? (type as JoinConditionType) : JoinConditionType.Equal,
    leftField: optionalRecord(json['left_field']),
    rightField: optionalRecord(json['right_field'])
  };
}

/** `left_field_name` / `right_field_name` are what v1 sent next to the fields; the server doesn't store them. */
function joinConditionToJson(condition: JoinCondition): JsonObject {
  return withoutUndefined({
    class_name: condition.type,
    left_field: condition.leftField,
    right_field: condition.rightField
  });
}

function joinConfigFromJson(value: unknown): JoinConfig {
  const json = asRecord(value);
  const joinType = asString(json['join_type']);
  return {
    left: etlOperatorFromJson(json['left_operator']),
    right: etlOperatorFromJson(json['right_operator']),
    conditions: asArray(json['conditions']).map(joinConditionFromJson),
    joinType: JOIN_TYPES.includes(joinType) ? (joinType as JoinType) : JoinType.Left
  };
}

function fieldFromJson(value: unknown): FieldConfiguration {
  const json = asRecord(value);
  return {
    displayName: asString(json['display_name']),
    field: asRecord(json['field']),
    isHidden: asBoolean(json['is_hidden']),
    asType: optionalString(json['as_type']),
    scalarFunction: optionalRecord(json['scalar_function'])
  };
}

export function fieldToJson(field: FieldConfiguration): JsonObject {
  return withoutUndefined({
    display_name: field.displayName,
    field: field.field,
    is_hidden: field.isHidden,
    as_type: field.asType,
    scalar_function: field.scalarFunction
  });
}

function expressionFieldFromJson(value: unknown): ExpressionFieldConfiguration {
  const json = asRecord(value);
  return {
    fieldName: asString(json['field_name']),
    displayName: asString(json['display_name']),
    expression: asString(json['expression']),
    asType: optionalString(json['as_type']),
    isHidden: asBoolean(json['is_hidden'])
  };
}

export function expressionFieldToJson(field: ExpressionFieldConfiguration): JsonObject {
  return withoutUndefined({
    field_name: field.fieldName,
    display_name: field.displayName,
    expression: field.expression,
    as_type: field.asType,
    is_hidden: field.isHidden
  });
}

export function etlOperatorFromJson(value: unknown): EtlOperator {
  const json = asRecord(value);
  const className = asString(json['class_name']);
  const isGetData = className === EtlOperatorClassName.GetData;
  const base = {
    className,
    destTable: tableConfigurationFromJson(json[isGetData ? GET_DATA_DEST_KEY : DEST_KEY]),
    persist: persistFromJson(json['persist_configuration']),
    thirdPartyPersists: asArray(json['third_party_persist_configurations']).filter(isRecord),
    json
  };
  const parent = () => etlOperatorFromJson(json['operator']);
  switch (className) {
    case EtlOperatorClassName.GetData:
      return { ...base, kind: 'getData', tableSchema: tableSchemaFromJson(json['table_schema']) };
    case EtlOperatorClassName.Join:
      return { ...base, kind: 'join', joins: asArray(json['join_configs']).map(joinConfigFromJson) };
    case EtlOperatorClassName.Transform:
      return { ...base, kind: 'transform', parent: parent(), query: asRecord(json['query']) };
    case EtlOperatorClassName.Pivot:
      return { ...base, kind: 'pivot', parent: parent(), query: asRecord(json['query']) };
    case EtlOperatorClassName.ManageFields:
      return {
        ...base,
        kind: 'manageFields',
        parent: parent(),
        fields: asArray(json['fields']).map(fieldFromJson),
        extraFields: asArray(json['extra_fields']).map(expressionFieldFromJson)
      };
    case EtlOperatorClassName.SqlQuery:
      return { ...base, kind: 'sql', parent: parent(), query: asString(json['query']) };
    case EtlOperatorClassName.Python:
      return { ...base, kind: 'python', parent: parent(), code: asString(json['code']) };
    case EtlOperatorClassName.SendEmail:
      return {
        ...base,
        kind: 'sendEmail',
        parents: asArray(json['operators']).map(etlOperatorFromJson),
        receivers: strings(json['receivers']),
        cc: strings(json['cc']),
        bcc: strings(json['bcc']),
        subject: asString(json['subject']),
        content: optionalString(json['content']),
        displayName: optionalString(json['display_name']),
        fileNames: strings(json['file_names']),
        isZip: asBoolean(json['is_zip']),
        fileType: json['file_type'] === 'Excel' ? 'Excel' : 'Csv'
      };
    default:
      return { ...base, kind: 'unsupported' };
  }
}

/** The operators `operator` reads from, in order (a join's are left, right, left, right, ...). */
export function operatorParents(operator: EtlOperator): readonly EtlOperator[] {
  switch (operator.kind) {
    case 'getData':
    case 'unsupported':
      return [];
    case 'join':
      return operator.joins.flatMap(join => [join.left, join.right]);
    case 'sendEmail':
      return operator.parents;
    default:
      return [operator.parent];
  }
}

/** `operator` reading from `parents` instead, given in the order `operatorParents` returns them. */
export function withParents(operator: EtlOperator, parents: readonly EtlOperator[]): EtlOperator {
  switch (operator.kind) {
    case 'getData':
    case 'unsupported':
      return operator;
    case 'join':
      return {
        ...operator,
        joins: operator.joins.map((join, index) => ({
          ...join,
          left: parents[index * 2] ?? join.left,
          right: parents[index * 2 + 1] ?? join.right
        }))
      };
    case 'sendEmail':
      return { ...operator, parents };
    default:
      return { ...operator, parent: parents[0] ?? operator.parent };
  }
}

function baseToJson(operator: EtlOperator): JsonObject {
  const destKey = operator.kind === 'getData' ? GET_DATA_DEST_KEY : DEST_KEY;
  return withoutUndefined({
    ...operator.json,
    class_name: operator.className,
    [destKey]: tableConfigurationToJson(operator.destTable),
    is_persistent: operator.persist !== undefined,
    persist_configuration: operator.persist ? persistToJson(operator.persist) : undefined,
    third_party_persist_configurations: [...operator.thirdPartyPersists]
  });
}

/**
 * The operator as the server stores it, parents included. Keys v1 never sent are left out: `active_field_configs`,
 * which the server adds to Manage Fields, and an empty `persist_configuration`.
 */
export function etlOperatorToJson(operator: EtlOperator): JsonObject {
  if (operator.kind === 'unsupported') return operator.json;
  const base = baseToJson(operator);
  switch (operator.kind) {
    case 'getData':
      return base;
    case 'join':
      return {
        ...base,
        join_configs: operator.joins.map(join => ({
          left_operator: etlOperatorToJson(join.left),
          right_operator: etlOperatorToJson(join.right),
          conditions: join.conditions.map(joinConditionToJson),
          join_type: join.joinType
        }))
      };
    case 'transform':
    case 'pivot':
      return { ...base, operator: etlOperatorToJson(operator.parent), query: operator.query };
    case 'manageFields': {
      const { active_field_configs: _derived, ...json } = base;
      return {
        ...json,
        operator: etlOperatorToJson(operator.parent),
        fields: operator.fields.map(fieldToJson),
        extra_fields: operator.extraFields.map(expressionFieldToJson)
      };
    }
    case 'sql':
      return { ...base, operator: etlOperatorToJson(operator.parent), query: operator.query };
    case 'python':
      return { ...base, operator: etlOperatorToJson(operator.parent), code: operator.code };
    case 'sendEmail': {
      // Never saved to a table: the server keeps no persist fields for it.
      const { is_persistent: _persistent, third_party_persist_configurations: _thirdParty, ...json } = base;
      return withoutUndefined({
        ...json,
        operators: operator.parents.map(etlOperatorToJson),
        receivers: [...operator.receivers],
        cc: [...operator.cc],
        bcc: [...operator.bcc],
        subject: operator.subject,
        content: operator.content,
        display_name: operator.displayName,
        file_names: [...operator.fileNames],
        is_zip: operator.isZip,
        file_type: operator.fileType
      });
    }
  }
}
