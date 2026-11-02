import { camelCase, snakeCase } from 'lodash-es';
import { asNumber, asRecord, asString, isRecord, type JsonObject } from '@/core/json/json';

/**
 * Where the editor drew each box (`extra_data`), in v1's format so v1 and v2 open each other's layout. v1 kept every
 * map keyed by `camelCase(tableName)` and its HTTP client snake_cased all keys on the way out, so the stored key is
 * `snakeCase(camelCase(tableName))`: `sales_1_1` is stored as `sales_11`. Two names that differ only in their
 * underscores share a key, as they did in v1.
 */

export const PositionGroup = {
  /** An operator's output table (and a source table). */
  Table: 'table_position',
  /** The operator's shape between its parents and its table. */
  Operator: 'operator_position',
  /** Save To Data Warehouse. */
  SavedTable: 'saved_table_position',
  SavedEmail: 'saved_email_config_position',
  /** Save To Database, keyed by table name and the configuration's index. */
  SavedThirdParty: 'saved_third_party_position'
} as const;

export type PositionGroup = (typeof PositionGroup)[keyof typeof PositionGroup];

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Per table: the ChartBuilder state of a Transform or Pivot (a chart's `extra_data`), as v1 stored it. */
const RENDER_OPTIONS = 'render_options';
const STAGE_POSITION = 'stage_position';

/** The key v1 stored a table's entries under. */
export function positionKey(tblName: string): string {
  return snakeCase(camelCase(tblName));
}

/** The key of a table's `index`-th Save To Database box. */
export function thirdPartyPositionKey(tblName: string, index: number): string {
  return positionKey(`${tblName}${index}`);
}

/** `"20px"` → 20; anything else that isn't a number → `undefined`. */
function pixels(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const parsed = Number.parseFloat(asString(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** v1 stored `{ top: "20px", left: "40px" }`. */
export function readPosition(extraData: JsonObject, group: PositionGroup, key: string): Point | undefined {
  const position = asRecord(extraData[group])[key];
  if (!isRecord(position)) return undefined;
  const x = pixels(position['left']);
  const y = pixels(position['top']);
  return x === undefined || y === undefined ? undefined : { x, y };
}

export function writePosition(extraData: JsonObject, group: PositionGroup, key: string, point: Point): JsonObject {
  return {
    ...extraData,
    [group]: { ...asRecord(extraData[group]), [key]: { top: `${point.y}px`, left: `${point.x}px` } }
  };
}

export function removePosition(extraData: JsonObject, group: PositionGroup, key: string): JsonObject {
  const { [key]: _removed, ...rest } = asRecord(extraData[group]);
  return { ...extraData, [group]: rest };
}

/** How far the canvas was panned (v1 `stage_position`, numbers). */
export function readStagePosition(extraData: JsonObject): Point {
  const stage = asRecord(extraData[STAGE_POSITION]);
  return { x: asNumber(stage['x']), y: asNumber(stage['y']) };
}

export function writeStagePosition(extraData: JsonObject, point: Point): JsonObject {
  return { ...extraData, [STAGE_POSITION]: { x: point.x, y: point.y } };
}

/** The ChartBuilder state of the Transform or Pivot writing `tblName`, if v1 or v2 stored one. */
export function readRenderOptions(extraData: JsonObject, tblName: string): JsonObject | undefined {
  const options = asRecord(extraData[RENDER_OPTIONS])[positionKey(tblName)];
  return isRecord(options) ? options : undefined;
}

export function writeRenderOptions(extraData: JsonObject, tblName: string, options: JsonObject): JsonObject {
  return { ...extraData, [RENDER_OPTIONS]: { ...asRecord(extraData[RENDER_OPTIONS]), [positionKey(tblName)]: options } };
}
