import {
  EtlOperatorClassName,
  JoinConditionType,
  JoinType,
  type EtlOperator,
  type JoinCondition,
  type JoinOperator,
  type TableConfiguration
} from '@/core/data-cook/EtlOperator';
import { asString, type JsonObject } from '@/core/json/json';
import { tableField, type TableSchema } from '@/core/schema/SchemaService';
import { newOperatorBase } from './operators.utils';

/**
 * Join Table (v1 `JoinTable`): two tables of the ETL's preview database, joined on pairs of columns. v1 built `=`
 * conditions only; another kind read from the server keeps its sign.
 */

/** v1's order of the join types, and their names. */
export const JOIN_TYPE_OPTIONS: readonly { value: JoinType; label: string }[] = [
  { value: JoinType.Left, label: 'Left Join' },
  { value: JoinType.Inner, label: 'Inner Join' },
  { value: JoinType.Right, label: 'Right Join' },
  { value: JoinType.FullOuter, label: 'Full Outer Join' }
];

const CONDITION_SIGNS: Readonly<Record<JoinConditionType, string>> = {
  [JoinConditionType.Equal]: '=',
  [JoinConditionType.NotEqual]: '!=',
  [JoinConditionType.LessThan]: '<',
  [JoinConditionType.GreaterThan]: '>',
  [JoinConditionType.LessOrEqual]: '<=',
  [JoinConditionType.GreaterOrEqual]: '>='
};

export function conditionSign(type: JoinConditionType): string {
  return CONDITION_SIGNS[type];
}

/** A condition as the dialog edits it: the column on each side, by name. */
export interface ConditionForm {
  readonly type: JoinConditionType;
  readonly left: string | undefined;
  readonly right: string | undefined;
}

export interface JoinForm {
  readonly conditions: readonly ConditionForm[];
  readonly joinType: JoinType;
}

export const EMPTY_CONDITION: ConditionForm = { type: JoinConditionType.Equal, left: undefined, right: undefined };

function fieldName(field: JsonObject | undefined): string | undefined {
  const name = field ? asString(field['field_name']) : '';
  return name === '' ? undefined : name;
}

/** The dialog's values of a join (v1 edited its first join config only). */
export function joinFormOf(operator: JoinOperator): JoinForm {
  const join = operator.joins[0];
  return {
    conditions: (join?.conditions ?? []).map(condition => ({ type: condition.type, left: fieldName(condition.leftField), right: fieldName(condition.rightField) })),
    joinType: join?.joinType ?? JoinType.Left
  };
}

/** v1's checks on submit: at least one condition, each with both columns. */
export function joinFormError(form: JoinForm): string | undefined {
  if (form.conditions.length === 0) return 'Missing join clause';
  if (form.conditions.some(condition => !condition.left || !condition.right)) return 'Join clause is invalid';
  return undefined;
}

function conditionOf(form: ConditionForm, left: TableSchema, right: TableSchema): JoinCondition {
  const field = (table: TableSchema, name: string | undefined) => {
    const column = table.columns.find(item => item.name === name);
    return column ? tableField(table, column) : undefined;
  };
  return { type: form.type, leftField: field(left, form.left), rightField: field(right, form.right) };
}

/**
 * The conditions of `form` on the two tables, each field a `table_field` of the preview database (DC0). A column the
 * table no longer has keeps the field it had, so editing a join whose preview failed loses nothing.
 */
export function joinConditions(form: JoinForm, left: TableSchema, right: TableSchema, before: readonly JoinCondition[] = []): JoinCondition[] {
  const keep = (field: JsonObject | undefined, name: string | undefined) => (fieldName(field) === name ? field : undefined);
  return form.conditions.map((condition, index) => {
    const built = conditionOf(condition, left, right);
    const old = before[index];
    return {
      type: built.type,
      leftField: built.leftField ?? keep(old?.leftField, condition.left),
      rightField: built.rightField ?? keep(old?.rightField, condition.right)
    };
  });
}

export function newJoinOperator(left: EtlOperator, right: EtlOperator, destTable: TableConfiguration, joinType: JoinType, conditions: readonly JoinCondition[]): JoinOperator {
  return { ...newOperatorBase(EtlOperatorClassName.Join, destTable), kind: 'join', joins: [{ left, right, conditions, joinType }] };
}

/** The join with the dialog's conditions and type on its first join config. */
export function updatedJoin(operator: JoinOperator, joinType: JoinType, conditions: readonly JoinCondition[]): JoinOperator {
  const [first, ...rest] = operator.joins;
  if (!first) return operator;
  return { ...operator, joins: [{ ...first, joinType, conditions }, ...rest] };
}

/**
 * A warehouse table joined from the dialog, read as a table of the preview database: the source v2 adds for it gets
 * built there under `tblName` (v1 `startJoinOperatorFromTable`).
 */
export function sourceAsPreviewTable(source: TableSchema, previewDb: string, tblName: string, displayName: string): TableSchema {
  return { ...source, dbName: previewDb, name: tblName, displayName };
}
