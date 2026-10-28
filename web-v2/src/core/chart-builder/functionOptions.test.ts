import { describe, expect, it } from 'vitest';
import { AggregationType, DateFunctionType, FunctionFamily } from './FunctionData';
import { familyOptionsOf, typeOptionsOf } from './functionOptions';

const column = (type: string) => ({ class_name: 'table_field', db_name: 'db', tbl_name: 't', field_name: 'c', field_type: type });
const measure = { class_name: 'expression_field', db_name: 'db', tbl_name: 't', field_name: 'm', field_type: 'double', expression: 'sum(x)' };
const control = { class_name: 'chart_control_field', control_data: { id: 1 } };

const typesOf = (field: Record<string, unknown>, family: string) => typeOptionsOf(field, family).flatMap(group => group.types);

describe('familyOptionsOf', () => {
  it.each(['string', 'int32', 'datetime'])('offers every family for a %s column', type => {
    expect(familyOptionsOf(column(type))).toEqual([FunctionFamily.GroupBy, FunctionFamily.DateHistogram, FunctionFamily.Aggregation, FunctionFamily.None]);
  });

  it('offers aggregation only for a measure', () => {
    expect(familyOptionsOf(measure)).toEqual([FunctionFamily.Aggregation]);
  });

  it('offers nothing for a chart control', () => {
    expect(familyOptionsOf(control)).toEqual([]);
  });
});

describe('typeOptionsOf', () => {
  it('groups the date functions as v1 did, without Week of Year', () => {
    const groups = typeOptionsOf(column('datetime'), FunctionFamily.DateHistogram);
    expect(groups.map(group => group.label)).toEqual(['Continuous', 'Periodic', 'Timestamp']);
    expect(groups.flatMap(group => group.types)).not.toContain(DateFunctionType.WeekOfYear);
    expect(groups[1]?.types[0]).toBe(DateFunctionType.Year);
  });

  it('offers every aggregation for a number column', () => {
    expect(typesOf(column('double'), FunctionFamily.Aggregation)).toEqual([
      AggregationType.Average,
      AggregationType.Sum,
      AggregationType.Maximum,
      AggregationType.Minimum,
      AggregationType.CountDistinct,
      AggregationType.CountAll
    ]);
  });

  it.each(['string', 'date'])('offers only counts for a %s column', type => {
    expect(typesOf(column(type), FunctionFamily.Aggregation)).toEqual([AggregationType.CountDistinct, AggregationType.CountAll]);
  });

  it.each([FunctionFamily.GroupBy, FunctionFamily.None])('offers no type for %s', family => {
    expect(typeOptionsOf(column('string'), family)).toEqual([]);
  });

  it('offers the expression for a measure, nothing in other families', () => {
    expect(typesOf(measure, FunctionFamily.Aggregation)).toEqual([AggregationType.Expression]);
    expect(typeOptionsOf(measure, FunctionFamily.GroupBy)).toEqual([]);
  });

  it('offers nothing for a chart control', () => {
    expect(typeOptionsOf(control, FunctionFamily.Aggregation)).toEqual([]);
  });
});
