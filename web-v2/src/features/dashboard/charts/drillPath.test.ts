import { describe, expect, it } from 'vitest';
import Highcharts from 'highcharts';
import { drillIndexOf, drillPathHtml, withDrillPath } from './drillPath';

const steps = [
  { value: 'Asia', name: 'Country' },
  { value: '<b>Laos</b>', name: 'Item type' }
];

describe('drillPathHtml', () => {
  it('is empty without steps', () => {
    expect(drillPathHtml([])).toBe('');
  });

  it('lists each clicked value, then the current dimension', () => {
    const element = document.createElement('div');
    element.innerHTML = drillPathHtml(steps);
    expect([...element.querySelectorAll('[data-drill-index]')].map(value => value.textContent)).toEqual(['Asia', '<b>Laos</b>']);
    expect(element.querySelector('.drilldown-path__current')?.textContent).toBe('Item type');
    expect(element.querySelector('b')).toBeNull();
  });
});

describe('withDrillPath', () => {
  it('leaves the options alone without steps', () => {
    const options = { subtitle: { text: 'Sub' } };
    expect(withDrillPath(options, [])).toBe(options);
  });

  it('keeps the subtitle text above the path', () => {
    const { subtitle } = withDrillPath({ subtitle: { text: 'Sub', style: { color: 'red' } } }, steps);
    expect(subtitle?.useHTML).toBe(true);
    expect(subtitle?.style).toEqual({ color: 'red' });
    expect(subtitle?.text).toMatch(/^<div class="drilldown-subtitle"><div>Sub<\/div><div class="drilldown-path">/);
  });
});

describe('the path inside a chart', () => {
  it('keeps the step of each value once Highcharts has drawn the subtitle, so a click on one is found', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const chart = Highcharts.chart(container, withDrillPath({ chart: { width: 400, height: 300 }, subtitle: { text: 'Sub' }, series: [{ type: 'line', data: [1, 2] }] }, steps));
    const values = [...container.querySelectorAll('.drilldown-path__value')];
    expect(values.map(value => value.textContent)).toEqual(['Asia', '<b>Laos</b>']);
    expect(values.map(drillIndexOf)).toEqual([0, 1]);
    chart.destroy();
    container.remove();
  });
});

describe('drillIndexOf', () => {
  it('finds the step of a clicked value', () => {
    const element = document.createElement('div');
    element.innerHTML = drillPathHtml(steps);
    expect(drillIndexOf(element.querySelectorAll('[data-drill-index]')[1] ?? null)).toBe(1);
    expect(drillIndexOf(element.querySelector('.drilldown-path__current'))).toBeUndefined();
    expect(drillIndexOf(null)).toBeUndefined();
  });
});
