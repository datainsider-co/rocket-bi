import { describe, expect, it } from 'vitest';
import type { JsonObject } from '@/core/json/json';
import fixture from './etl.fixture.json';
import {
  PositionGroup,
  positionKey,
  readPosition,
  readRenderOptions,
  readStagePosition,
  removePosition,
  thirdPartyPositionKey,
  writePosition,
  writeRenderOptions,
  writeStagePosition
} from './etlExtraData';

/** Saved by v1's editor (DC0). */
const v1ExtraData = fixture.etlGetV1.response.extra_data as JsonObject;

describe('positionKey', () => {
  it.each([
    ['sales', 'sales'],
    ['sales_1', 'sales_1'],
    ['sales_1_1', 'sales_11'],
    ['sales_join_sales_copy', 'sales_join_sales_copy'],
    ['RegionCount2', 'region_count_2'],
    ['', '']
  ])('stores %s under %s', (tblName, key) => {
    expect(positionKey(tblName)).toBe(key);
  });

  it('keys a Save To Database box by table and index', () => {
    expect(thirdPartyPositionKey('sales_1', 0)).toBe('sales_10');
  });
});

describe('readPosition', () => {
  it('reads the boxes v1 placed', () => {
    expect(readPosition(v1ExtraData, PositionGroup.Table, positionKey('sales_1_1'))).toEqual({ x: 600, y: 180 });
    expect(readPosition(v1ExtraData, PositionGroup.Operator, positionKey('sales_join_sales_copy'))).toEqual({ x: 400, y: 340 });
  });

  it('is undefined for a box without a position', () => {
    expect(readPosition(v1ExtraData, PositionGroup.SavedTable, 'sales')).toBeUndefined();
    expect(readPosition({}, PositionGroup.Table, 'sales')).toBeUndefined();
  });

  it('reads numbers too, and refuses what is not one', () => {
    const extraData = { table_position: { a: { top: 5, left: '7.5px' }, b: { top: 'auto', left: '1px' }, c: 'x' } };

    expect(readPosition(extraData, PositionGroup.Table, 'a')).toEqual({ x: 7.5, y: 5 });
    expect(readPosition(extraData, PositionGroup.Table, 'b')).toBeUndefined();
    expect(readPosition(extraData, PositionGroup.Table, 'c')).toBeUndefined();
  });
});

describe('writePosition and removePosition', () => {
  it('writes in v1 format and keeps the rest', () => {
    const written = writePosition(v1ExtraData, PositionGroup.Table, 'sales', { x: 10, y: 30 });

    expect(written['table_position']).toMatchObject({ sales: { top: '30px', left: '10px' }, sales_1: { top: '180px', left: '20px' } });
    expect(written['operator_position']).toBe(v1ExtraData['operator_position']);
    expect(v1ExtraData['table_position']).toMatchObject({ sales: { top: '20px', left: '20px' } });
  });

  it('starts a group that is missing', () => {
    expect(writePosition({}, PositionGroup.SavedEmail, 'a', { x: 1, y: 2 })).toEqual({
      saved_email_config_position: { a: { top: '2px', left: '1px' } }
    });
  });

  it('removes one box', () => {
    const removed = removePosition(v1ExtraData, PositionGroup.Table, 'sales');

    expect(removed['table_position']).not.toHaveProperty('sales');
    expect(removed['table_position']).toHaveProperty('sales_1');
  });
});

describe('stage position', () => {
  it('reads and writes the pan', () => {
    expect(readStagePosition(v1ExtraData)).toEqual({ x: -12, y: -12 });
    expect(readStagePosition({})).toEqual({ x: 0, y: 0 });
    expect(writeStagePosition({ a: 1 }, { x: 3, y: 4 })).toEqual({ a: 1, stage_position: { x: 3, y: 4 } });
  });
});

describe('render options', () => {
  it('reads and writes a Transform state under the position key', () => {
    const written = writeRenderOptions({}, 'sales_1_1', { current_chart_type: 'flatten_table' });

    expect(written).toEqual({ render_options: { sales_11: { current_chart_type: 'flatten_table' } } });
    expect(readRenderOptions(written, 'sales_1_1')).toEqual({ current_chart_type: 'flatten_table' });
    expect(readRenderOptions(v1ExtraData, 'sales')).toBeUndefined();
  });
});
