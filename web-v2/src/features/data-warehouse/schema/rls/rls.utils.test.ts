import { describe, expect, it } from 'vitest';
import { ALWAYS_FALSE, ALWAYS_TRUE, rlsPolicyFromJson, UserAttributeOperator } from '@/core/rls/RlsPolicy';
import fixture from '@/core/schema/warehouse.fixture.json';
import {
  conditionsOfKind,
  filterKindOf,
  newPolicyValues,
  operatorInputOf,
  operatorLabel,
  OPERATOR_OPTIONS,
  policyValuesOf,
  rlsFormSchema,
  toAttributeKey,
  toRlsPolicy,
  valuesFor,
  type PolicyValues
} from './rls.utils';

const [byUser, byAttribute, nothing] = fixture.policiesList.response.data.map(rlsPolicyFromJson);
const policy = (patch: Partial<PolicyValues>): PolicyValues => ({ ...newPolicyValues(), key: 'region', values: ['north'], ...patch });

describe('operators', () => {
  it("offers v1's operators in v1's words", () => {
    expect(OPERATOR_OPTIONS.map(option => option.label)).toEqual(['in', 'not in', 'equal', 'not equal', 'is null', 'is not null']);
    expect(operatorLabel(UserAttributeOperator.NotContain)).toBe('not in');
  });

  it.each([
    [UserAttributeOperator.Equal, 'one'],
    [UserAttributeOperator.NotEqual, 'one'],
    [UserAttributeOperator.Contain, 'many'],
    [UserAttributeOperator.NotContain, 'many'],
    [UserAttributeOperator.IsNull, 'none'],
    [UserAttributeOperator.IsNotNull, 'none']
  ] as const)('%s takes %s', (operator, input) => {
    expect(operatorInputOf(operator)).toBe(input);
  });
});

describe('toAttributeKey', () => {
  it('snake cases what was typed', () => {
    expect(toAttributeKey('Sales Region')).toBe('sales_region');
    expect(toAttributeKey('Phòng ban')).toBe('phong_ban');
    expect(toAttributeKey('')).toBe('');
  });
});

describe('valuesFor', () => {
  it('keeps what the operator reads, without blanks', () => {
    expect(valuesFor(UserAttributeOperator.Equal, [' a ', 'b'])).toEqual(['a']);
    expect(valuesFor(UserAttributeOperator.Contain, ['a', ' ', 'b'])).toEqual(['a', 'b']);
    expect(valuesFor(UserAttributeOperator.IsNull, ['a'])).toEqual([]);
  });
});

describe('policyValuesOf / toRlsPolicy', () => {
  it('round trips a saved policy', () => {
    expect(policyValuesOf(byAttribute!)).toMatchObject({ policyId: 2, key: 'department', operator: 'Contain', values: ['sales', 'ops'], conditions: [ALWAYS_TRUE] });
    expect(toRlsPolicy(policyValuesOf(byAttribute!))).toEqual(byAttribute);
  });

  it('keeps the usernames of a policy without a property', () => {
    const values = policyValuesOf(nothing!);
    expect(values).toMatchObject({ key: '', operator: 'Contain', values: [] });
    expect(toRlsPolicy({ ...values, userIds: ['u1'] })).toMatchObject({ userIds: ['u1'], userAttribute: undefined });
  });

  it('sends only the values the operator reads', () => {
    expect(toRlsPolicy(policy({ key: ' region ', operator: UserAttributeOperator.IsNotNull })).userAttribute).toEqual({ key: 'region', operator: 'IsNotNull', values: [] });
    expect(policyValuesOf(byUser!).userIds).toHaveLength(1);
  });
});

describe('rlsFormSchema', () => {
  const issues = (policies: PolicyValues[]) => {
    const result = rlsFormSchema.safeParse({ policies });
    return result.success ? [] : result.error.issues.map(issue => [issue.path.join('.'), issue.message]);
  };

  it('accepts complete policies', () => {
    expect(issues([policy({}), policy({ key: '', userIds: ['u1'] }), policy({ operator: UserAttributeOperator.IsNull, values: [] })])).toEqual([]);
  });

  it('asks for what each operator needs', () => {
    expect(
      issues([
        policy({ key: ' ' }),
        policy({ operator: UserAttributeOperator.NotEqual, values: [' '] }),
        policy({ operator: UserAttributeOperator.NotContain, values: [] }),
        policy({ conditions: [] })
      ])
    ).toEqual([
      ['policies.0.key', 'Attribute name is required'],
      ['policies.1.values', 'Attribute value is required'],
      ['policies.2.values', 'Attribute values are required'],
      ['policies.3.conditions', 'Pick the rows to see']
    ]);
  });
});

describe('filterKindOf', () => {
  it('tells View All, View Nothing and a custom filter apart', () => {
    expect(filterKindOf([ALWAYS_TRUE])).toBe('all');
    expect(filterKindOf([ALWAYS_FALSE])).toBe('nothing');
    expect(filterKindOf([])).toBe('none');
    expect(filterKindOf(byUser!.conditions)).toBe('custom');
    expect(filterKindOf([ALWAYS_TRUE, ALWAYS_FALSE])).toBe('custom');
  });

  it('writes View All and View Nothing', () => {
    expect(conditionsOfKind('all')).toEqual([ALWAYS_TRUE]);
    expect(conditionsOfKind('nothing')).toEqual([ALWAYS_FALSE]);
  });
});

describe('newPolicyValues', () => {
  it('starts a policy that sees every row', () => {
    expect(newPolicyValues()).toMatchObject({ policyId: -1, key: '', operator: 'Contain', conditions: [ALWAYS_TRUE] });
  });
});
