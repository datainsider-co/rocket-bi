import { z } from 'zod';
import type { JsonObject } from '@/core/json/json';
import { ALWAYS_FALSE, ALWAYS_TRUE, NEW_POLICY_ID, UserAttributeOperator, type RlsPolicy } from '@/core/rls/RlsPolicy';
import { toIdentifier } from '@/shared/schema/identifier.utils';

/**
 * The RLS tab of a table (v1 `ManageRLSPolicy`): each policy names a property of the user's profile, how its value
 * must compare, and which rows those users see. v1 edited no usernames; a policy that has some (made through the API)
 * keeps them.
 */

/** v1's operators, in v1's order and words. */
export const OPERATOR_OPTIONS: readonly { value: UserAttributeOperator; label: string }[] = [
  { value: UserAttributeOperator.Contain, label: 'in' },
  { value: UserAttributeOperator.NotContain, label: 'not in' },
  { value: UserAttributeOperator.Equal, label: 'equal' },
  { value: UserAttributeOperator.NotEqual, label: 'not equal' },
  { value: UserAttributeOperator.IsNull, label: 'is null' },
  { value: UserAttributeOperator.IsNotNull, label: 'is not null' }
];

export function operatorLabel(operator: UserAttributeOperator): string {
  return OPERATOR_OPTIONS.find(option => option.value === operator)?.label ?? operator;
}

/** What an operator compares the property with: one value, a list, or nothing. */
export type OperatorInput = 'one' | 'many' | 'none';

export function operatorInputOf(operator: UserAttributeOperator): OperatorInput {
  switch (operator) {
    case UserAttributeOperator.Equal:
    case UserAttributeOperator.NotEqual:
      return 'one';
    case UserAttributeOperator.Contain:
    case UserAttributeOperator.NotContain:
      return 'many';
    case UserAttributeOperator.IsNull:
    case UserAttributeOperator.IsNotNull:
      return 'none';
  }
}

/** v1 snake cased the property's name as it was typed (`StringUtils.toSnakeCase`). */
export function toAttributeKey(typed: string): string {
  return toIdentifier(typed).toLowerCase();
}

/** One row of the RLS form. */
export interface PolicyValues {
  readonly policyId: number;
  readonly userIds: readonly string[];
  readonly key: string;
  readonly operator: UserAttributeOperator;
  readonly values: readonly string[];
  readonly conditions: readonly JsonObject[];
  /** What the server sent, sent back with the edits. */
  readonly json: JsonObject;
}

export interface RlsFormValues {
  readonly policies: PolicyValues[];
}

export function policyValuesOf(policy: RlsPolicy): PolicyValues {
  const attribute = policy.userAttribute;
  return {
    policyId: policy.policyId,
    userIds: policy.userIds,
    key: attribute?.key ?? '',
    operator: attribute?.operator ?? UserAttributeOperator.Contain,
    values: attribute?.values ?? [],
    conditions: policy.conditions,
    json: policy.json
  };
}

/** The values the operator reads: the first for one, the non-blank ones for a list, none for a null check. */
export function valuesFor(operator: UserAttributeOperator, values: readonly string[]): string[] {
  const filled = values.map(value => value.trim()).filter(value => value !== '');
  switch (operatorInputOf(operator)) {
    case 'one':
      return filled.slice(0, 1);
    case 'many':
      return filled;
    case 'none':
      return [];
  }
}

/** The policy to save. Without a property it targets its usernames only. */
export function toRlsPolicy(values: PolicyValues): RlsPolicy {
  const key = values.key.trim();
  return {
    policyId: values.policyId,
    userIds: values.userIds,
    userAttribute: key ? { key, operator: values.operator, values: valuesFor(values.operator, values.values) } : undefined,
    conditions: values.conditions,
    json: values.json
  };
}

/**
 * The RLS form (v1 `RlsPolicy.ensurePolicy`, plus what v1 skipped): a property unless the policy has usernames, its
 * value for equal / not equal, values for in / not in, and rows to see.
 */
export const rlsFormSchema = z.object({ policies: z.array(z.custom<PolicyValues>()) }).superRefine(({ policies }, ctx) => {
  policies.forEach((policy, index) => {
    const at = (field: string) => ['policies', index, field];
    if (!policy.key.trim()) {
      if (policy.userIds.length === 0) ctx.addIssue({ code: 'custom', path: at('key'), message: 'Attribute name is required' });
      return;
    }
    const input = operatorInputOf(policy.operator);
    const count = valuesFor(policy.operator, policy.values).length;
    if (input === 'one' && count === 0) ctx.addIssue({ code: 'custom', path: at('values'), message: 'Attribute value is required' });
    if (input === 'many' && count === 0) ctx.addIssue({ code: 'custom', path: at('values'), message: 'Attribute values are required' });
    if (policy.conditions.length === 0) ctx.addIssue({ code: 'custom', path: at('conditions'), message: 'Pick the rows to see' });
  });
});

/** What a policy lets its users see. */
export type PolicyFilterKind = 'all' | 'nothing' | 'custom' | 'none';

const isOnly = (conditions: readonly JsonObject[], only: JsonObject) => conditions.length === 1 && conditions[0]?.['class_name'] === only['class_name'];

export function filterKindOf(conditions: readonly JsonObject[]): PolicyFilterKind {
  if (conditions.length === 0) return 'none';
  if (isOnly(conditions, ALWAYS_TRUE)) return 'all';
  if (isOnly(conditions, ALWAYS_FALSE)) return 'nothing';
  return 'custom';
}

/** v1's "View All" and "View Nothing". */
export function conditionsOfKind(kind: 'all' | 'nothing'): JsonObject[] {
  return [kind === 'all' ? ALWAYS_TRUE : ALWAYS_FALSE];
}

/** A policy added in edit mode: v1's, but comparing with a list, the first operator v1 offered, and seeing all rows. */
export function newPolicyValues(): PolicyValues {
  return { policyId: NEW_POLICY_ID, userIds: [], key: '', operator: UserAttributeOperator.Contain, values: [], conditions: conditionsOfKind('all'), json: {} };
}
