import { describe, expect, it } from 'vitest';
import {
  defaultValueOf,
  fromParameterForm,
  listValuesOf,
  nextParameterName,
  omitValues,
  parameterFormSchema,
  placeholderOf,
  removeParameter,
  renameParameter,
  toParameterForm,
  withValues,
  type ParameterForm
} from './parameters.utils';

const minQty = { displayName: 'min_qty', valueType: 'number', value: '2' };
const region = { displayName: 'region', valueType: 'list', value: 'north', list: ['north', 'south'] };

describe('placeholderOf', () => {
  it('writes the name as v1 did', () => {
    expect(placeholderOf('a')).toBe('{{ a }}');
  });
});

describe('nextParameterName', () => {
  it('numbers from the count of parameters, skipping taken names', () => {
    expect(nextParameterName([])).toBe('untitled_param_0');
    expect(nextParameterName(['a', 'b'])).toBe('untitled_param_2');
    expect(nextParameterName(['untitled_param_1', 'untitled_param_2'])).toBe('untitled_param_3');
  });
});

describe('renameParameter / removeParameter', () => {
  const sql = 'where qty > {{min_qty}} and qty < {{ min_qty }} + {{min_qty2}}';

  it('renames every placeholder of the name only', () => {
    expect(renameParameter(sql, 'min_qty', 'low')).toBe('where qty > {{ low }} and qty < {{ low }} + {{min_qty2}}');
  });

  it('removes every placeholder of the name only', () => {
    expect(removeParameter(sql, 'min_qty')).toBe('where qty >  and qty <  + {{min_qty2}}');
  });

  it('leaves SQL without the name alone', () => {
    expect(renameParameter('select 1', 'a', 'b')).toBe('select 1');
  });
});

describe('withValues', () => {
  it('puts the current values on the parameters that have one', () => {
    const parameters = [minQty, region];
    expect(withValues(parameters, { min_qty: '7' })).toEqual([{ ...minQty, value: '7' }, region]);
    expect(parameters[0]).toBe(minQty);
  });
});

describe('omitValues', () => {
  it('drops the values of the names only', () => {
    const values = { a: '1', b: '2' };
    expect(omitValues(values, ['a', 'c'])).toEqual({ b: '2' });
    expect(omitValues(values, [])).toEqual(values);
    expect(values).toEqual({ a: '1', b: '2' });
  });
});

describe('defaultValueOf', () => {
  it.each([
    ['number', '0'],
    ['date', '2026-11-02'],
    ['text', ''],
    ['list', '']
  ])('%s', (valueType, expected) => {
    expect(defaultValueOf(valueType, '2026-11-02')).toBe(expected);
  });
});

describe('listValuesOf', () => {
  it('takes each non-empty line once, trimmed', () => {
    expect(listValuesOf(' north\n\nsouth\nnorth \n')).toEqual(['north', 'south']);
    expect(listValuesOf('')).toEqual([]);
  });
});

describe('parameter form', () => {
  it('round-trips a parameter', () => {
    expect(fromParameterForm(toParameterForm(region))).toEqual(region);
    expect(fromParameterForm(toParameterForm(minQty))).toEqual(minQty);
  });

  it('trims the name and gives a list without a default its first value', () => {
    expect(fromParameterForm({ displayName: ' region ', valueType: 'list', value: '', listText: 'east\nwest' })).toEqual({
      displayName: 'region',
      valueType: 'list',
      value: 'east',
      list: ['east', 'west']
    });
    expect(fromParameterForm({ displayName: 'r', valueType: 'list', value: '', listText: '' })).toMatchObject({ value: '', list: [] });
  });
});

describe('parameterFormSchema', () => {
  const form: ParameterForm = { displayName: 'min_qty', valueType: 'text', value: '', listText: '' };
  const errors = (value: ParameterForm, taken: string[] = []) => {
    const result = parameterFormSchema(taken).safeParse(value);
    return result.success ? {} : Object.fromEntries(result.error.issues.map(issue => [issue.path[0], issue.message]));
  };

  it('accepts a valid parameter', () => {
    expect(errors(form)).toEqual({});
    expect(errors({ ...form, valueType: 'number', value: '-1.5' })).toEqual({});
    expect(errors({ ...form, valueType: 'list', value: 'b', listText: 'a\nb' })).toEqual({});
  });

  it.each([
    ['', 'Parameter name is required'],
    ['  ', 'Parameter name is required'],
    ['min qty', 'Use only letters, digits and _'],
    ['min-qty', 'Use only letters, digits and _']
  ])('refuses the name %j', (displayName, message) => {
    expect(errors({ ...form, displayName })).toEqual({ displayName: message });
  });

  it('refuses a name another parameter has', () => {
    expect(errors(form, ['min_qty'])).toEqual({ displayName: 'This parameter already exists' });
  });

  it.each(['', 'abc'])('refuses the number %j', value => {
    expect(errors({ ...form, valueType: 'number', value })).toEqual({ value: 'Enter a number' });
  });

  it('refuses a list default that is not in the list', () => {
    expect(errors({ ...form, valueType: 'list', value: 'c', listText: 'a\nb' })).toEqual({ value: 'Pick one of the list values' });
  });
});
