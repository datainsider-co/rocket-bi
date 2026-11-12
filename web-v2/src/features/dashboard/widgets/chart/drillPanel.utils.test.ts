import { describe, expect, it } from 'vitest';
import { dimensionValues, drillPanelTitle, groupDrillFields } from './drillPanel.utils';

const region = { label: 'Region', field: { field_name: 'region' }, isDate: false };
const country = { label: 'Country', field: { field_name: 'country' }, isDate: false };
const shipDate = { label: 'Ship date', field: { field_name: 'ship_date' }, isDate: true };

describe('dimensionValues', () => {
  it('reads the categories of a series chart and the names of pie slices', () => {
    expect(dimensionValues({ kind: 'series_one', series: [], xAxis: ['Asia', 'Europe'], yAxis: [] })).toEqual(['Asia', 'Europe']);
    expect(dimensionValues({ kind: 'series_two', series: [{ name: 's', data: [['Online', 1], ['Offline', 2]], points: [] }], total: 3 })).toEqual(['Online', 'Offline']);
  });

  it('is empty for other responses', () => {
    expect(dimensionValues(undefined)).toEqual([]);
    expect(dimensionValues({ kind: 'table', headers: [], records: [], total: 0 })).toEqual([]);
  });
});

describe('groupDrillFields', () => {
  it('groups dates before text and drops empty groups', () => {
    expect(groupDrillFields([region, shipDate, country], '')).toEqual([
      { title: 'Date', fields: [shipDate] },
      { title: 'Text', fields: [region, country] }
    ]);
    expect(groupDrillFields([region], '')).toEqual([{ title: 'Text', fields: [region] }]);
  });

  it('keeps the fields whose name has the keyword, whatever its case', () => {
    expect(groupDrillFields([region, shipDate, country], ' COUN ')).toEqual([{ title: 'Text', fields: [country] }]);
    expect(groupDrillFields([region], 'x')).toEqual([]);
  });
});

describe('drillPanelTitle', () => {
  it('asks for a value first, then for a dimension', () => {
    expect(drillPanelTitle('region', undefined)).toBe('Select a region to drilldown');
    expect(drillPanelTitle('region', 'Asia')).toBe('Select a dimension to drilldown');
  });
});
