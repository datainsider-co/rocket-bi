import { asArray, asNumber, asRecord, asString, isRecord, type JsonObject } from '@/core/json/json';

/**
 * Row level security of a table (backend `RlsPolicy`, `policies/*`): which rows the users a policy targets may see.
 * A policy targets users by username, by a property of their profile, or both. Plain values that keep the JSON they
 * were read from, like `DataSource`.
 *
 * The server doesn't store a policy's name (v1 sent one); a policy that targets nobody applies to no one. Applying
 * policies fails on MySQL (`DATA_WAREHOUSE.md`, DW0).
 */

/** Backend `AttributeBasedOperator`. Equal / NotEqual take one value, Contain / NotContain several, the null checks none. */
export const UserAttributeOperator = {
  Equal: 'Equal',
  NotEqual: 'NotEqual',
  Contain: 'Contain',
  NotContain: 'NotContain',
  IsNull: 'IsNull',
  IsNotNull: 'IsNotNull'
} as const;

export type UserAttributeOperator = (typeof UserAttributeOperator)[keyof typeof UserAttributeOperator];

const OPERATORS: readonly string[] = Object.values(UserAttributeOperator);

/** A key of the user's profile `properties` and how its value must compare. */
export interface UserAttribute {
  readonly key: string;
  readonly values: readonly string[];
  readonly operator: UserAttributeOperator;
}

/** `policy_id` of a policy not saved yet; the server gives it an id. */
export const NEW_POLICY_ID = -1;

export interface RlsPolicy {
  readonly policyId: number;
  readonly userIds: readonly string[];
  readonly userAttribute: UserAttribute | undefined;
  /** Backend `Condition`s, as the ChartBuilder's filter editor writes them. */
  readonly conditions: readonly JsonObject[];
  readonly json: JsonObject;
}

/** v1's "View All" and "View Nothing" filters. */
export const ALWAYS_TRUE: JsonObject = { class_name: 'always_true' };
export const ALWAYS_FALSE: JsonObject = { class_name: 'always_false' };

function toStrings(value: unknown): string[] {
  return asArray(value).filter((item): item is string => typeof item === 'string');
}

function userAttributeFromJson(value: unknown): UserAttribute | undefined {
  if (!isRecord(value)) return undefined;
  const operator = asString(value['operator']);
  return {
    key: asString(value['key']),
    values: toStrings(value['values']),
    operator: OPERATORS.includes(operator) ? (operator as UserAttributeOperator) : UserAttributeOperator.IsNull
  };
}

export function rlsPolicyFromJson(value: unknown): RlsPolicy {
  const json = asRecord(value);
  return {
    policyId: asNumber(json['policy_id'], NEW_POLICY_ID),
    userIds: toStrings(json['user_ids']),
    userAttribute: userAttributeFromJson(json['user_attribute']),
    conditions: asArray(json['conditions']).filter(isRecord),
    json
  };
}

export function newRlsPolicy(): RlsPolicy {
  return { policyId: NEW_POLICY_ID, userIds: [], userAttribute: undefined, conditions: [ALWAYS_TRUE], json: {} };
}

/** The policy as `PUT policies` takes it, merged onto what the server sent. */
export function rlsPolicyToJson(policy: RlsPolicy, table: { dbName: string; name: string }): JsonObject {
  const { user_attribute: _userAttribute, ...json } = policy.json;
  const attribute = policy.userAttribute;
  return {
    ...json,
    policy_id: policy.policyId,
    user_ids: policy.userIds,
    ...(attribute && { user_attribute: { key: attribute.key, values: attribute.values, operator: attribute.operator } }),
    db_name: table.dbName,
    tbl_name: table.name,
    conditions: policy.conditions
  };
}
