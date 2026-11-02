import { describe, expect, it } from 'vitest';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson } from '@/core/data-cook/EtlJob';
import { etlGraphFromLeaves } from '@/core/data-cook/etlGraph';
import { PositionGroup, readPosition, writePosition } from '@/core/data-cook/etlExtraData';
import type { JsonObject } from '@/core/json/json';
import { boxPoint, layoutEtl } from './etlLayout.utils';

const etl1 = etlJobFromJson(fixture.etlUpdate.response);
const etl2 = etlJobFromJson(fixture.etlGetV1.response);

const table = (extraData: JsonObject, key: string) => readPosition(extraData, PositionGroup.Table, key);
const shape = (extraData: JsonObject, key: string) => readPosition(extraData, PositionGroup.Operator, key);

describe('layoutEtl', () => {
  it('keeps every position v1 saved', () => {
    expect(layoutEtl(etlGraphFromLeaves(etl2.operators), etl2.extraData)).toEqual(etl2.extraData);
  });

  it('places operators right of their parent, each below the one before (ETL 1, saved by curl)', () => {
    const extraData = layoutEtl(etlGraphFromLeaves(etl1.operators), etl1.extraData);

    expect(table(extraData, 'sales')).toEqual({ x: 20, y: 20 });
    expect(shape(extraData, 'sales_sql')).toEqual({ x: 400, y: 20 });
    expect(table(extraData, 'sales_sql')).toEqual({ x: 600, y: 20 });
    expect(table(extraData, 'sales_pivot')).toEqual({ x: 600, y: 180 });
    expect(table(extraData, 'sales_mf')).toEqual({ x: 600, y: 340 });
    expect(table(extraData, 'sales_transform')).toEqual({ x: 600, y: 500 });
    expect(table(extraData, 'sales_py')).toEqual({ x: 600, y: 660 });
  });

  it('puts an email box where its shape would be', () => {
    const extraData = layoutEtl(etlGraphFromLeaves(etl1.operators), etl1.extraData);

    expect(shape(extraData, 'send_email_1')).toEqual({ x: 980, y: 500 });
    expect(table(extraData, 'send_email_1')).toEqual({ x: 980, y: 500 });
  });

  it('stacks sources without a position below everything placed', () => {
    const graph = etlGraphFromLeaves(etl2.operators);
    const withoutCopy = { ...etl2.extraData, table_position: { sales: { top: '20px', left: '20px' } } };

    const extraData = layoutEtl(graph, withoutCopy);

    expect(table(extraData, 'sales_copy')).toEqual({ x: 20, y: 180 });
    // The join, placed again level with sales_copy (180), ends at 340.
    expect(table(extraData, 'sales_join_sales_copy')).toEqual({ x: 600, y: 180 });
    expect(table(extraData, 'sales_1')).toEqual({ x: 20, y: 340 });
  });

  it('places a join level with its lowest parent, right of the furthest', () => {
    const graph = etlGraphFromLeaves(etl2.operators);
    let extraData = writePosition({}, PositionGroup.Table, 'sales', { x: 100, y: 20 });
    extraData = writePosition(extraData, PositionGroup.Table, 'sales_copy', { x: 20, y: 300 });

    const placed = layoutEtl(graph, extraData);

    expect(shape(placed, 'sales_join_sales_copy')).toEqual({ x: 480, y: 300 });
  });

  it('reads a zero coordinate as the margin, as v1 did', () => {
    const graph = etlGraphFromLeaves(etl1.operators);
    const extraData = layoutEtl(graph, writePosition({}, PositionGroup.Table, 'sales', { x: 0, y: 0 }));

    expect(shape(extraData, 'sales_sql')).toEqual({ x: 400, y: 20 });
  });

  it('does not change what it is given', () => {
    const before = JSON.stringify(etl1.extraData);
    layoutEtl(etlGraphFromLeaves(etl1.operators), etl1.extraData);
    expect(JSON.stringify(etl1.extraData)).toBe(before);
  });
});

describe('boxPoint', () => {
  it('goes right of and below the table, stacking a table’s boxes', () => {
    expect(boxPoint({ x: 600, y: 180 })).toEqual({ x: 800, y: 260 });
    expect(boxPoint({ x: 600, y: 180 }, 2)).toEqual({ x: 800, y: 400 });
  });
});
