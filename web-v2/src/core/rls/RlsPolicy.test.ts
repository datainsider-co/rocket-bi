import { describe, expect, it } from 'vitest';
import fixture from '@/core/schema/warehouse.fixture.json';
import { ALWAYS_TRUE, newRlsPolicy, rlsPolicyFromJson, rlsPolicyToJson } from './RlsPolicy';

const table = { dbName: 'dw0_probe', name: 'products' };
const [byUser, byAttribute, toNobody] = fixture.policiesList.response.data.map(rlsPolicyFromJson);

describe('rlsPolicyFromJson', () => {
  it('reads the policies of DW0', () => {
    expect(byUser).toMatchObject({
      policyId: 1,
      userIds: ['up-860803c8-e3be-4afb-b88b-743817456dfc'],
      userAttribute: { key: 'region', values: [], operator: 'IsNull' }
    });
    expect(byUser?.conditions[0]).toMatchObject({ class_name: 'in', possible_values: ['Phở', "O'Brien tea"] });
    expect(byAttribute).toMatchObject({ userIds: [], userAttribute: { key: 'department', values: ['sales', 'ops'], operator: 'Contain' }, conditions: [ALWAYS_TRUE] });
    expect(toNobody).toMatchObject({ userAttribute: undefined, conditions: [{ class_name: 'always_false' }] });
  });

  it('reads an unknown operator as IsNull and drops values that are not text', () => {
    expect(rlsPolicyFromJson({ user_attribute: { key: 'k', values: ['a', 1], operator: 'Like' } }).userAttribute).toEqual({
      key: 'k',
      values: ['a'],
      operator: 'IsNull'
    });
  });
});

describe('rlsPolicyToJson', () => {
  it('sends back a saved policy as the server sent it', () => {
    expect(rlsPolicyToJson(byUser!, table)).toStrictEqual(fixture.policiesList.response.data[0]);
  });

  it('removes the user attribute', () => {
    expect(rlsPolicyToJson({ ...byUser!, userAttribute: undefined }, table)).not.toHaveProperty('user_attribute');
  });

  it('writes a new policy that lets everyone see every row', () => {
    expect(rlsPolicyToJson(newRlsPolicy(), table)).toStrictEqual({
      policy_id: -1,
      user_ids: [],
      db_name: 'dw0_probe',
      tbl_name: 'products',
      conditions: [{ class_name: 'always_true' }]
    });
  });
});
