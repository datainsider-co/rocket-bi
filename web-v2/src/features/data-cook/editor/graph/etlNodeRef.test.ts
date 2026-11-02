import { describe, expect, it } from 'vitest';
import { nodeId, positionTarget, type EtlNodeRef } from './etlNodeRef';

describe('nodeId', () => {
  it.each<[EtlNodeRef, string]>([
    [{ type: 'table', tblName: 'a:b' }, 'table:a:b'],
    [{ type: 'operator', tblName: 'sales' }, 'operator:sales'],
    [{ type: 'persist', tblName: 'sales' }, 'persist:sales'],
    [{ type: 'thirdParty', tblName: 'sales', index: 2 }, 'thirdParty:2:sales'],
    [{ type: 'email', tblName: 'mail' }, 'email:mail']
  ])('%j is %s', (ref, id) => {
    expect(nodeId(ref)).toBe(id);
  });
});

describe('positionTarget', () => {
  it.each<[EtlNodeRef, string, string]>([
    [{ type: 'table', tblName: 'sales_1_1' }, 'table_position', 'sales_11'],
    [{ type: 'operator', tblName: 'sales_1_1' }, 'operator_position', 'sales_11'],
    [{ type: 'persist', tblName: 'sales_1_1' }, 'saved_table_position', 'sales_11'],
    [{ type: 'thirdParty', tblName: 'sales', index: 1 }, 'saved_third_party_position', 'sales_1'],
    [{ type: 'email', tblName: 'mail' }, 'saved_email_config_position', 'mail']
  ])("%j is under v1's %s, key %s", (ref, group, key) => {
    expect(positionTarget(ref)).toEqual({ group, key });
  });
});
