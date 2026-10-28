import { describe, expect, it } from 'vitest';
import mysql from './catalogues/mysql.json';
import { ALL_FUNCTIONS, catalogForFormula, catalogKeyOf, findFunction, functionGroupsOf, functionsOf, type FunctionCatalog } from './functionCatalog.utils';

const catalog: FunctionCatalog = {
  String: [{ name: 'CONCAT', title: 'CONCAT(a, b)', description: 'Joins strings' }],
  Keyword: [{ name: 'SELECT' }],
  Aggregate: [{ name: 'SUM' }, { name: 'AVG' }]
};

describe('catalogKeyOf', () => {
  it.each([
    ['mysql_connection', 'mysql'],
    ['bigquery_connection', 'bigquery'],
    ['vertica_connection', 'vertica'],
    ['unknown_connection', 'clickhouse'],
    [undefined, 'clickhouse']
  ])('reads %j as %j', (sourceType, expected) => {
    expect(catalogKeyOf(sourceType)).toBe(expected);
  });
});

describe('catalogForFormula', () => {
  it('leaves keywords out of a calculated column', () => {
    expect(Object.keys(catalogForFormula(catalog, 'calculated'))).toEqual(['String', 'Aggregate']);
    expect(Object.keys(catalogForFormula({ Keywords: [], Math: [] }, 'calculated'))).toEqual(['Math']);
  });

  it('keeps everything for a measure and a query', () => {
    expect(catalogForFormula(catalog, 'measure')).toBe(catalog);
    expect(catalogForFormula(catalog, 'sql')).toBe(catalog);
  });
});

describe('functionGroupsOf', () => {
  it('lists All first, then the groups by name', () => {
    expect(functionGroupsOf(catalog)).toEqual([ALL_FUNCTIONS, 'Aggregate', 'Keyword', 'String']);
    expect(functionGroupsOf({})).toEqual([ALL_FUNCTIONS]);
  });
});

describe('functionsOf', () => {
  it('gives a group, every group for All, nothing for an unknown group', () => {
    expect(functionsOf(catalog, 'Aggregate').map(info => info.name)).toEqual(['SUM', 'AVG']);
    expect(functionsOf(catalog, ALL_FUNCTIONS).map(info => info.name)).toEqual(['CONCAT', 'SELECT', 'SUM', 'AVG']);
    expect(functionsOf(catalog, 'Nope')).toEqual([]);
  });

  it('lists a name found in several groups once for All, as first seen', () => {
    const shared: FunctionCatalog = { Math: [{ name: 'LEFT', description: 'math' }, { name: 'ABS' }], String: [{ name: 'LEFT', description: 'string' }] };
    expect(functionsOf(shared, ALL_FUNCTIONS)).toEqual([{ name: 'LEFT', description: 'math' }, { name: 'ABS' }]);
  });
});

describe('findFunction', () => {
  it('finds a function by name, ignoring case', () => {
    expect(findFunction(catalog, 'concat')?.title).toBe('CONCAT(a, b)');
    expect(findFunction(catalog, 'nope')).toBeUndefined();
    expect(findFunction(catalog, '')).toBeUndefined();
  });
});

describe('the catalogues', () => {
  it('hold v1 functions with a name in each', () => {
    const functions = Object.values(mysql as FunctionCatalog).flat();
    expect(functions.length).toBeGreaterThan(200);
    expect(functions.every(info => typeof info.name === 'string' && info.name !== '')).toBe(true);
    expect(findFunction(mysql as FunctionCatalog, 'abs')).toMatchObject({ name: 'ABS', title: 'ABS(number)' });
  });
});
