import { describe, expect, it } from 'vitest';
import { visualizationResponseFromJson, type DrilldownResponse } from '@/core/query/VisualizationResponse';
// The local backend's reply for legends sales_channel, order_priority, region (levels cut to four).
import responses from '@/core/query/queryResponses.fixture.json';
import { drilldownLevelOf, levelPathOf, validLevelSteps, type LevelStep } from './drilldownLevels.utils';

const response = visualizationResponseFromJson(responses.drilldown_chart_setting) as DrilldownResponse;
const empty: DrilldownResponse = { kind: 'drilldown', name: 'region', series: [], drilldown: [] };

const offline: LevelStep = { id: 'Offline', name: 'Offline' };
const offlineC: LevelStep = { id: 'Offline.C', name: 'C' };

describe('validLevelSteps', () => {
  it('keeps the steps the response has', () => {
    expect(validLevelSteps(response, [offline, offlineC])).toEqual([offline, offlineC]);
    expect(validLevelSteps(response, [])).toEqual([]);
  });

  it('stops at the first level the response lost, whatever follows it', () => {
    const gone: LevelStep = { id: 'Wholesale', name: 'Wholesale' };
    expect(validLevelSteps(response, [offline, gone, offlineC])).toEqual([offline]);
    expect(validLevelSteps(response, [gone])).toEqual([]);
    expect(validLevelSteps(empty, [offline])).toEqual([]);
  });

  it('gives a new list and leaves the steps as they were', () => {
    const steps = [offline];
    expect(validLevelSteps(response, steps)).not.toBe(steps);
    expect(steps).toEqual([offline]);
  });
});

describe('drilldownLevelOf', () => {
  it("draws the first legend's points without a step", () => {
    expect(drilldownLevelOf(response, [])).toEqual({
      name: undefined,
      points: [
        { name: 'Offline', y: 127922581.88999999, drilldown: 'Offline' },
        { name: 'Online', y: 122848776.47999996, drilldown: 'Online' }
      ]
    });
  });

  it('draws the points under the last step, named as the server names the level', () => {
    const level = drilldownLevelOf(response, [offline, offlineC]);
    expect(level.name).toBe('Offline.C');
    expect(level.points.map(point => point.name)).toEqual(['Asia', 'Australia and Oceania', 'Central America and the Caribbean']);
  });

  it('keeps a point clickable only when the response has the level under it', () => {
    // The fixture keeps Offline.C and Offline.H of the four levels under Offline.
    expect(drilldownLevelOf(response, [offline]).points.map(point => [point.name, point.drilldown])).toEqual([
      ['C', 'Offline.C'],
      ['H', 'Offline.H'],
      ['L', undefined],
      ['M', undefined]
    ]);
    // The last legend's points: the server names a level under each, and sends none.
    expect(drilldownLevelOf(response, [offline, offlineC]).points.every(point => !('drilldown' in point))).toBe(true);
  });

  it('draws a point the server repeated once', () => {
    // The local backend's "Europe" level for legends region, sales_channel, order_priority sorted by the value, descending.
    const point = (name: string, y: number) => ({ name, y, drilldown: `Europe.${name}` });
    const online = point('Online', 54488966.93000001);
    const offlinePoint = point('Offline', 27912775.340000004);
    const sorted: DrilldownResponse = {
      kind: 'drilldown',
      name: 'region',
      series: [{ name: 'Europe', y: 82401742.27, drilldown: 'Europe' }],
      drilldown: [
        { id: 'Europe', name: 'Europe', data: [online, offlinePoint, online, offlinePoint, online, offlinePoint] },
        { id: 'Europe.Online', name: 'Europe.Online', data: [{ name: 'L', y: 23805381.9, drilldown: 'Europe.Online.L' }] }
      ]
    };
    expect(drilldownLevelOf(sorted, [{ id: 'Europe', name: 'Europe' }]).points).toEqual([online, { name: 'Offline', y: 27912775.340000004 }]);
  });

  it('keeps points alike in name that name no level, which nothing tells apart', () => {
    const plain: DrilldownResponse = { kind: 'drilldown', name: 'x', series: [{ name: 'A', y: 1 }, { name: 'A', y: 1 }], drilldown: [] };
    expect(drilldownLevelOf(plain, []).points).toHaveLength(2);
  });

  it('falls back to the first level for a step the response does not have', () => {
    expect(drilldownLevelOf(response, [{ id: 'Wholesale', name: 'Wholesale' }]).points).toHaveLength(2);
  });

  it('draws nothing for an empty response, and does not change the response', () => {
    expect(drilldownLevelOf(empty, [])).toEqual({ name: undefined, points: [] });
    const before = JSON.stringify(response);
    drilldownLevelOf(response, [offline]);
    expect(JSON.stringify(response)).toBe(before);
  });
});

describe('levelPathOf', () => {
  it('pairs each clicked value with the legend the chart is on after it', () => {
    expect(levelPathOf([offline, offlineC], ['sales_channel', 'order_priority', 'region'])).toEqual([
      { value: 'Offline', name: 'order_priority' },
      { value: 'C', name: 'region' }
    ]);
  });

  it('is empty on the first level, and leaves the name empty past the legends it knows', () => {
    expect(levelPathOf([], ['sales_channel'])).toEqual([]);
    expect(levelPathOf([offline], ['sales_channel'])).toEqual([{ value: 'Offline', name: '' }]);
    expect(levelPathOf([offline], [])).toEqual([{ value: 'Offline', name: '' }]);
  });
});
