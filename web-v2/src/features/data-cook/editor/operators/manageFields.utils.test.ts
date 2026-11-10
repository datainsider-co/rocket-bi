import { describe, expect, it } from 'vitest';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson } from '@/core/data-cook/EtlJob';
import { etlOperatorToJson, type ManageFieldsOperator } from '@/core/data-cook/EtlOperator';
import { etlGraphFromLeaves } from '@/core/data-cook/etlGraph';
import {
  asTypeOf,
  checkExpression,
  fieldColumn,
  fieldNameError,
  fieldRows,
  fieldsOfTable,
  mergeFields,
  newExpressionField,
  newManageFieldsOperator,
  otherFieldNames,
  sampleRequest,
  sampleValues
} from './manageFields.utils';
import { previewTable } from './testing';

const graph = etlGraphFromLeaves(etlJobFromJson(fixture.etlGetV1.response).operators);
const saved = graph.operators.get('sales_1_2') as ManageFieldsOperator;
const parentTable = previewTable('sales_1_1');
const expression = { fieldName: 'double', displayName: 'Double', expression: 'cnt * 2', asType: undefined, isHidden: false };

describe('asTypeOf', () => {
  it.each([
    ['bool', 'int8'],
    ['int32', 'int32'],
    ['uint64', 'uint64'],
    ['float64', 'double'],
    ['float', 'float'],
    ['datetime64', 'datetime'],
    ['date', 'date'],
    ['nested', 'string'],
    ['string', 'string'],
    ['decimal', undefined]
  ])('%s → %s', (type, asType) => {
    expect(asTypeOf(type)).toBe(asType);
  });
});

describe('fieldsOfTable', () => {
  it('shows every column, cast to its own type, on the preview database (v1 ETL 2)', () => {
    expect(fieldsOfTable(parentTable)).toEqual(saved.fields);
  });
});

describe('mergeFields', () => {
  const fromTable = fieldsOfTable(previewTable('sales_1_1', [['region', 'string'], ['cnt', 'int64'], ['added', 'int32']]));

  it('keeps saved fields, adds new columns and drops gone ones', () => {
    const renamed = { ...saved.fields[0]!, displayName: 'Region', isHidden: true };
    const gone = { ...saved.fields[1]!, field: { ...saved.fields[1]!.field, field_name: 'gone' } };

    const merged = mergeFields(fromTable, [renamed, gone]);

    expect(merged.map(field => [fieldColumn(field), field.displayName, field.isHidden])).toEqual([
      ['region', 'Region', true],
      ['cnt', 'cnt', false],
      ['added', 'added', false]
    ]);
  });

  it("gives a saved field without a cast its column's", () => {
    const [merged] = mergeFields(fromTable, [{ ...saved.fields[0]!, asType: undefined }]);
    expect(merged?.asType).toBe('string');
  });
});

describe('fieldNameError', () => {
  it.each([
    ['', ['a'], 'Please input field name'],
    ['  ', [], 'Please input field name'],
    [' Region ', ['region'], 'This field name already exists'],
    ['Region', ['cnt'], undefined]
  ])('%j among %j', (name, others, error) => {
    expect(fieldNameError(name, others)).toBe(error);
  });
});

describe('fieldRows', () => {
  it('lists the fields then the expressions', () => {
    expect(fieldRows(saved.fields, [expression], '').map(row => [row.kind, row.index])).toEqual([
      ['field', 0],
      ['field', 1],
      ['expression', 0]
    ]);
  });

  it('finds by name or column, ignoring case', () => {
    expect(fieldRows(saved.fields, [expression], 'REG').map(row => row.field.displayName)).toEqual(['region']);
    expect(fieldRows(saved.fields, [expression], 'doub').map(row => row.kind)).toEqual(['expression']);
    expect(fieldRows(saved.fields, [expression], 'zzz')).toEqual([]);
  });
});

describe('otherFieldNames', () => {
  it('leaves out the row being edited', () => {
    expect(otherFieldNames(saved.fields, [expression], { kind: 'field', index: 0 })).toEqual(['cnt', 'Double']);
    expect(otherFieldNames(saved.fields, [expression], { kind: 'expression', index: 0 })).toEqual(['region', 'cnt']);
    expect(otherFieldNames(saved.fields, [expression])).toEqual(['region', 'cnt', 'Double']);
  });
});

describe('newExpressionField', () => {
  it('names its column after it, unique among the expressions', () => {
    expect(newExpressionField(' Double Units ', 'cnt * 2', [])).toEqual({ fieldName: 'double_units', displayName: 'Double Units', expression: 'cnt * 2', asType: undefined, isHidden: false });
    expect(newExpressionField('Double', 'x', [expression]).fieldName).toBe('double_1');
    expect(newExpressionField('ÿ', 'x', []).fieldName).toBe('y');
    expect(newExpressionField('***', 'x', []).fieldName).toBe('field');
  });
});

describe('sampleRequest', () => {
  it('shows the hidden fields, leaving the given ones alone', () => {
    const hidden = { ...saved.fields[0]!, isHidden: true };
    const request = sampleRequest([hidden], [{ ...expression, isHidden: true }]);

    expect(request.fields[0]?.isHidden).toBe(false);
    expect(request.extraFields[0]?.isHidden).toBe(false);
    expect(hidden.isHidden).toBe(true);
  });
});

describe('sampleValues', () => {
  const header = { isGroupBy: false, isTextLeft: false, formatterKey: '', children: [] };
  const headers = [{ ...header, key: '0', label: 'Region' }];

  it("reads a column's values by its name, -- for none", () => {
    expect(sampleValues(headers, [{ '0': 'Asia' }, { '0': null }, {}], 'Region')).toEqual(['Asia', '--', '--']);
  });

  it('is empty for a column the sample lacks', () => {
    expect(sampleValues(headers, [{ '0': 'Asia' }], 'cnt')).toEqual([]);
  });
});

describe('newManageFieldsOperator', () => {
  it('writes the JSON v1 wrote (ETL 2)', () => {
    const operator = newManageFieldsOperator(saved.parent, saved.destTable, saved.fields, []);
    const { active_field_configs: _derived, ...json } = saved.json;

    expect(etlOperatorToJson(operator)).toEqual(etlOperatorToJson({ ...saved, json }));
  });
});

describe('checkExpression', () => {
  const columns = [{ name: 'units_sold', displayName: 'Units Sold', type: 'int32' }];

  it('turns display names into column names', () => {
    expect(checkExpression('Double', ' [Units Sold] * 2 ', [], columns)).toEqual({ ok: true, expression: 'units_sold * 2' });
  });

  it('asks for a name and a formula', () => {
    expect(checkExpression('', '', [], columns)).toEqual({ ok: false, nameError: 'Please input field name', formulaError: 'Please input field expression' });
  });

  it('says which column does not exist, and a name taken', () => {
    expect(checkExpression('Units', '[Gone] + 1', ['units'], columns)).toEqual({
      ok: false,
      nameError: 'This field name already exists',
      formulaError: 'Column [Gone] does not exist in this table'
    });
  });
});
