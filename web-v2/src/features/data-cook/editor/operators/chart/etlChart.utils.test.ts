import { describe, expect, it } from 'vitest';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson } from '@/core/data-cook/EtlJob';
import { etlOperatorToJson, type QuerySettingOperator } from '@/core/data-cook/EtlOperator';
import { etlGraphFromLeaves } from '@/core/data-cook/etlGraph';
import { builderChartTypeOf, builderSettingOf, builderWidgetOf, newQueryOperator, previewQueryOf, storedQueryOf, storedRenderOptionsOf } from './etlChart.utils';

const graph = etlGraphFromLeaves(etlJobFromJson(fixture.etlUpdate.response).operators);
const operators = [...graph.operators.values()];
const transform = operators.find(operator => operator.kind === 'transform') as QuerySettingOperator;
const pivot = operators.find(operator => operator.kind === 'pivot') as QuerySettingOperator;

describe('builderChartTypeOf', () => {
  it('builds a Transform as a Table and a Pivot as a Pivot Table', () => {
    expect(builderChartTypeOf('transform')).toBe('flatten_table');
    expect(builderChartTypeOf('pivot')).toBe('pivot_table');
  });
});

describe('storedQueryOf', () => {
  it('stores the setting without viz options, as the server does', () => {
    expect(storedQueryOf({ ...pivot.query, options: { title: 'x' } })).toEqual(pivot.query);
    expect(storedQueryOf({ ...transform.query, options: { title: 'x' } })).toEqual(transform.query);
  });
});

describe('builderSettingOf', () => {
  it("reads v1's flatten pivot as a pivot", () => {
    expect(builderSettingOf('pivot', { class_name: 'flatten_pivot_table_chart_setting', rows: [] })).toEqual({ class_name: 'pivot_table_chart_setting', rows: [] });
  });

  it('keeps the other settings as they are', () => {
    expect(builderSettingOf('pivot', pivot.query)).toBe(pivot.query);
    expect(builderSettingOf('transform', transform.query)).toBe(transform.query);
  });
});

describe('previewQueryOf', () => {
  it('asks for a pivot flat, without viz options', () => {
    expect(previewQueryOf('pivot', { ...pivot.query, options: { title: 'x' } })).toEqual({ ...pivot.query, class_name: 'flatten_pivot_table_chart_setting' });
  });

  it('asks for a transform as it is', () => {
    expect(previewQueryOf('transform', transform.query)).toEqual(transform.query);
  });
});

describe('storedRenderOptionsOf', () => {
  it("names the chart type v1's way", () => {
    expect(storedRenderOptionsOf('pivot', { configs: {}, current_chart_type: 'pivot_table' })).toEqual({ configs: {}, current_chart_type: 'flatten_pivot_table' });
    expect(storedRenderOptionsOf('transform', { configs: {} })).toEqual({ configs: {}, current_chart_type: 'flatten_table' });
  });
});

describe('builderWidgetOf', () => {
  it('starts a new operator on an empty chart of its type', () => {
    expect(builderWidgetOf('pivot', undefined, undefined)).toEqual({ chartType: 'pivot_table' });
  });

  it("opens an operator on its query and v1's builder state", () => {
    const start = builderWidgetOf('pivot', pivot, { configs: { rows: [] }, current_chart_type: 'flatten_pivot_table' });

    expect(start).toEqual({
      widget: {
        setting: pivot.query,
        extra_data: { configs: { rows: [] }, current_chart_type: 'pivot_table' }
      }
    });
  });

  it('opens an operator without a stored builder state on its query', () => {
    expect(builderWidgetOf('transform', transform, undefined)).toEqual({ widget: { setting: transform.query, extra_data: { current_chart_type: 'flatten_table' } } });
  });
});

describe('newQueryOperator', () => {
  it('writes the JSON the server stores (DC0)', () => {
    const operator = newQueryOperator('pivot', pivot.parent, pivot.destTable, pivot.query);
    const { is_persistent: _persistent, ...expected } = etlOperatorToJson({ ...pivot, json: {} });

    expect(etlOperatorToJson(operator)).toEqual({ ...expected, is_persistent: false });
  });
});
