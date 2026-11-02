import { describe, expect, it } from 'vitest';
import type { JsonObject } from '@/core/json/json';
import fixture from './etl.fixture.json';
import {
  etlOperatorFromJson,
  etlOperatorToJson,
  operatorParents,
  withParents,
  type EtlOperator,
  type GetDataOperator
} from './EtlOperator';

const stored = fixture.etlUpdate.response.operators as JsonObject[];
const storedV1 = fixture.etlGetV1.response.operators as JsonObject[];

function parse(json: unknown): EtlOperator {
  return etlOperatorFromJson(json);
}

function source(tblName: string): GetDataOperator {
  return {
    kind: 'getData',
    className: 'get_data_operator',
    destTable: { tblName, dbDisplayName: 'sample_v2', tblDisplayName: tblName },
    persist: undefined,
    thirdPartyPersists: [],
    tableSchema: { dbName: 'sample_v2', name: tblName, columns: [] },
    json: {}
  };
}

/** The server's JSON without what v2 drops on purpose. */
function withoutDerived(json: unknown): unknown {
  if (Array.isArray(json)) return json.map(withoutDerived);
  if (typeof json !== 'object' || json === null) return json;
  return Object.fromEntries(
    Object.entries(json)
      .filter(([key]) => key !== 'active_field_configs')
      .map(([key, value]) => [key, withoutDerived(value)])
  );
}

describe('etlOperatorFromJson', () => {
  it('reads every operator kind the server stores', () => {
    expect(stored.map(json => parse(json).kind)).toEqual(['sql', 'pivot', 'manageFields', 'sendEmail', 'python']);
    expect(storedV1.map(json => parse(json).kind)).toEqual(['join', 'manageFields']);
  });

  it('reads a source table from table_schema and its dest config from dest_table_config', () => {
    const sql = operatorParents(parse(storedV1[1]))[0];
    const get = sql && operatorParents(sql)[0];

    expect(get).toMatchObject({
      kind: 'getData',
      destTable: { tblName: 'sales_1', dbDisplayName: 'sample_v2', tblDisplayName: 'sales_1' },
      tableSchema: { dbName: 'sample_v2', name: 'sales' }
    });
    expect(get?.kind === 'getData' && get.tableSchema.columns).toHaveLength(14);
  });

  it('reads Save To Data Warehouse', () => {
    expect(parse(stored[0]).persist).toEqual({ dbName: 'dc0_out', tblName: 'sales_by_region', type: 'Update' });
    expect(parse(storedV1[1]).kind === 'manageFields' && operatorParents(parse(storedV1[1]))[0]?.persist).toEqual({
      dbName: 'dc0_v1_out',
      tblName: 'regioncount2',
      type: 'Append'
    });
  });

  it('reads a join made with v1', () => {
    const join = parse(storedV1[0]);

    expect(join.kind).toBe('join');
    if (join.kind !== 'join') return;
    expect(join.destTable.tblName).toBe('sales_join_sales_copy');
    expect(join.joins[0]).toMatchObject({
      left: { destTable: { tblName: 'sales' } },
      right: { destTable: { tblName: 'sales_copy' } },
      joinType: 'inner',
      conditions: [{ type: 'equal_field', leftField: { field_name: 'order_id', tbl_name: 'sales' } }]
    });
  });

  it('reads Manage Fields with an expression field', () => {
    const manage = parse(stored[2]);

    expect(manage).toMatchObject({
      kind: 'manageFields',
      fields: [{ displayName: 'Region', isHidden: false, asType: 'string', field: { field_name: 'region' } }],
      extraFields: [{ fieldName: 'double_units', displayName: 'Double Units', expression: 'units_sold * 2' }]
    });
  });

  it('reads Send To Email with the tables it mails', () => {
    const email = parse(stored[3]);

    expect(email).toMatchObject({ kind: 'sendEmail', receivers: ['a@b.co'], subject: 'x', fileType: 'Csv', isZip: false });
    expect(operatorParents(email).map(parent => parent.kind)).toEqual(['transform']);
  });

  it('falls back on defaults for an odd join and an unknown file type', () => {
    const join = parse({ class_name: 'join_operator', join_configs: [{ join_type: 'cross', conditions: [{ class_name: 'and' }] }] });
    const email = parse({ class_name: 'send_to_group_email_operator', file_type: 'Pdf', content: '' });

    expect(join.kind === 'join' && join.joins[0]).toMatchObject({ joinType: 'left', conditions: [{ type: 'equal_field' }] });
    expect(email).toMatchObject({ fileType: 'Csv', content: undefined, receivers: [] });
  });

  it('reads an unknown class_name as unsupported, without parents', () => {
    const operator = parse({ class_name: 'lake_operator', dest_table_configuration: { tbl_name: 'lake' } });

    expect(operator).toMatchObject({ kind: 'unsupported', destTable: { tblName: 'lake', tblDisplayName: 'lake' } });
    expect(operatorParents(operator)).toEqual([]);
  });
});

describe('etlOperatorToJson', () => {
  it.each(stored.map((json, index) => [json['class_name'], index] as const))('writes %s back as the server stored it, less what it derives', (_, index) => {
    expect(etlOperatorToJson(parse(stored[index]))).toEqual(withoutDerived(stored[index]));
  });

  it('writes v1 operators back without the fields the server derives', () => {
    expect(storedV1.map(json => etlOperatorToJson(parse(json)))).toEqual(withoutDerived(storedV1));
  });

  it('drops persist_configuration once Save To Data Warehouse is removed', () => {
    const json = etlOperatorToJson({ ...parse(stored[0]), persist: undefined });

    expect(json['is_persistent']).toBe(false);
    expect(json).not.toHaveProperty('persist_configuration');
  });

  it('writes an unsupported operator unchanged', () => {
    const json = { class_name: 'lake_operator', anything: [1, 2] };

    expect(etlOperatorToJson(parse(json))).toBe(json);
  });
});

describe('operatorParents and withParents', () => {
  it('lists a join as left, right for each join config', () => {
    const join = parse(storedV1[0]);

    expect(operatorParents(join).map(parent => parent.destTable.tblName)).toEqual(['sales', 'sales_copy']);
  });

  it('replaces the parents in the same order', () => {
    const join = parse(storedV1[0]);
    const replaced = withParents(join, [source('a'), source('b')]);

    expect(operatorParents(replaced).map(parent => parent.destTable.tblName)).toEqual(['a', 'b']);
    expect(operatorParents(join).map(parent => parent.destTable.tblName)).toEqual(['sales', 'sales_copy']);
  });

  it('keeps a parent that is not given', () => {
    const sql = parse(stored[0]);

    expect(operatorParents(withParents(sql, []))[0]?.destTable.tblName).toBe('sales');
  });

  it('replaces the tables an email sends', () => {
    expect(operatorParents(withParents(parse(stored[3]), [source('a'), source('b')]))).toHaveLength(2);
  });

  it('leaves sources and unsupported operators alone', () => {
    const get = source('a');

    expect(withParents(get, [source('b')])).toBe(get);
  });
});
