import { describe, expect, it } from 'vitest';
import { asRecord, type JsonObject } from '@/core/json/json';
import { builderDataFromJson, builderDataToJson } from './BuilderData';
import { functionDataFromJson, functionDataToJson } from './FunctionData';
import sent from './builderRequests.fixture.json';
import stored from './builder.fixture.json';

const extraDataOf = (widget: unknown) => asRecord(asRecord(widget)['extra_data']);

const allExtraData: [string, JsonObject][] = [
  ...Object.entries(sent as Record<string, JsonObject>).map(([key, widget]): [string, JsonObject] => [`sent ${key}`, extraDataOf(widget)]),
  ...stored.widgets.map((widget): [string, JsonObject] => [`stored ${widget.id}`, extraDataOf(widget)])
];

describe('builderDataFromJson / builderDataToJson', () => {
  it.each(allExtraData)('gives back the extra_data of %s as it was', (_, extraData) => {
    expect(builderDataToJson(builderDataFromJson(extraData))).toStrictEqual(extraData);
  });

  it('reads the stored names and values', () => {
    const data = builderDataFromJson(extraDataOf((sent as Record<string, JsonObject>)['column']));
    expect(data.chartType).toBe('column');
    expect(Object.keys(data.configs)).toEqual(['x_axis', 'y_axis', 'sorting']);
    expect(data.configs['sorting']?.[0]).toMatchObject({ functionFamily: 'Aggregation', functionType: 'Sum', sorting: 'Descending', numElemsShown: '10', isShowNElements: true });
    expect(Object.values(data.filters)[0]?.[0]).toMatchObject({ familyType: 'string', subType: 'in', allValues: ['Asia', 'Europe'] });
  });

  it('reads a widget without builder data as empty', () => {
    expect(builderDataFromJson({ current_chart_type: 'kpi' })).toEqual({ chartType: 'kpi', configs: {}, filters: {} });
    expect(builderDataFromJson(undefined)).toEqual({ chartType: '', configs: {}, filters: {} });
  });
});

describe('functionDataFromJson', () => {
  it('leaves out what was absent, so an empty dynamic_function never appears', () => {
    const json = { id: 1, name: 'a', function_family: 'Group By', field: {}, is_nested: false, sorting: 'Unsorted' };
    expect(functionDataFromJson(json)).not.toHaveProperty('dynamicFunction');
    expect(functionDataToJson(functionDataFromJson(json))).toStrictEqual(json);
  });
});
