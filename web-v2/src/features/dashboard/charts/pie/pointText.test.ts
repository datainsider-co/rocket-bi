import { describe, expect, it } from 'vitest';
import type { VizOptions } from '@/core/query/vizOptions';
import { labelSettingsOf, pointLabel, pointTooltip } from './pointText';

const format = (value: number) => value.toFixed(1);

describe('pointLabel', () => {
  it('says the name and the value by default, in white', () => {
    expect(pointLabel({ name: 'Online', y: 12 }, {}, format)).toBe('<div style="color:#fff">Online : 12.0</div>');
  });

  it('says the percentage or the name alone, in the chosen color', () => {
    const point = { name: 'Online', y: 12, percentage: 40 };
    expect(pointLabel(point, { labelFormat: 'name_and_percent', style: { color: 'red' } }, format)).toBe('<div style="color:red">Online : 40.0 %</div>');
    expect(pointLabel(point, { labelFormat: 'name' }, format)).toBe('<div style="color:#fff">Online</div>');
  });

  it('escapes names, which come from the data', () => {
    expect(pointLabel({ name: '<img src=x>', y: 1 }, { labelFormat: 'name' }, format)).toBe('<div style="color:#fff">&lt;img src=x&gt;</div>');
  });
});

describe('pointTooltip', () => {
  it("heads the value with its dot, in the tooltip's style", () => {
    const options: VizOptions = { tooltip: { style: { color: 'black', fontFamily: 'Arial' } } };
    expect(pointTooltip(options, 'Channel', '#123', 'Online', '12')).toBe(
      '<div style="text-align: left; color: black; font-family: Arial"><span>Channel</span><br/><span style="color:#123; padding-right: 5px;">●</span>Online: <b>12</b></div>'
    );
  });
});

describe('labelSettingsOf', () => {
  it("reads a chart's label settings at their path, nothing when missing", () => {
    const options = { plotOptions: { funnel: { dataLabels: { labelFormat: 'name' } } } } as VizOptions;
    expect(labelSettingsOf(options, 'plotOptions.funnel.dataLabels')).toEqual({ labelFormat: 'name' });
    expect(labelSettingsOf(options, 'plotOptions.pie.dataLabels')).toEqual({});
  });
});
