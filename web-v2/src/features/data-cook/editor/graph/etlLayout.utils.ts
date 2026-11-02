import type { EtlGraph } from '@/core/data-cook/etlGraph';
import { PositionGroup, positionKey, readPosition, writePosition, type Point } from '@/core/data-cook/etlExtraData';
import type { JsonObject } from '@/core/json/json';

/** v1 `MIN_TOP` and `Distance`: where the editor puts what has no position yet. */
export const MIN_TOP = 20;
const TABLE_TO_OPERATOR = 380;
const OPERATOR_TO_TABLE = 200;
const TABLE_TO_TABLE = 160;
/** A Save To Data Warehouse, Save To Database or email box without a position: right of and below its table. */
const BOX_OFFSET: Point = { x: 200, y: 80 };
/** v2 stacks a table's boxes instead of drawing them on top of each other. */
const BOX_SPACING = 70;

function tablePoint(extraData: JsonObject, tblName: string): Point | undefined {
  return readPosition(extraData, PositionGroup.Table, positionKey(tblName));
}

/** v1 read a missing (or zero) coordinate as `MIN_TOP`. */
function orMin(value: number | undefined): number {
  return value || MIN_TOP;
}

/**
 * Positions for every table and operator that has none, as v1 placed them: a source below everything placed so far, an
 * operator `380` right of its parents and level with the lowest of them, below the operators already reading the same
 * parent, with its table `200` further right. An email operator's box sits where its shape would. v1 counted the new
 * operator itself as a sibling at top 0 (its first child never went above 160); that is not carried over.
 */
export function layoutEtl(graph: EtlGraph, extraData: JsonObject): JsonObject {
  let result = extraData;
  let maxTop = MIN_TOP;
  const placed: string[] = [];

  for (const [name, operator] of graph.operators) {
    const key = positionKey(name);
    const parents = graph.parentNames.get(name) ?? [];
    const table = tablePoint(result, name);

    if (parents.length === 0) {
      const point = table ?? { x: MIN_TOP, y: maxTop };
      if (!table) result = writePosition(result, PositionGroup.Table, key, point);
      maxTop = Math.max(maxTop, point.y + TABLE_TO_TABLE);
    } else if (!table || !readPosition(result, PositionGroup.Operator, key)) {
      let top = MIN_TOP;
      let left = MIN_TOP;
      for (const parent of parents) {
        const parentTable = tablePoint(result, parent);
        let parentTop = orMin(parentTable?.y);
        for (const sibling of placed) {
          if (graph.parentNames.get(sibling)?.includes(parent)) parentTop = Math.max(parentTop, (tablePoint(result, sibling)?.y ?? 0) + TABLE_TO_TABLE);
        }
        top = Math.max(top, parentTop);
        left = Math.max(left, orMin(parentTable?.x) + TABLE_TO_OPERATOR);
      }
      const tableLeft = operator.kind === 'sendEmail' ? left : left + OPERATOR_TO_TABLE;
      result = writePosition(result, PositionGroup.Operator, key, { x: left, y: top });
      result = writePosition(result, PositionGroup.Table, key, { x: tableLeft, y: top });
      maxTop = Math.max(maxTop, top + TABLE_TO_TABLE);
    } else {
      maxTop = Math.max(maxTop, table.y + TABLE_TO_TABLE);
    }
    if (parents.length > 0) placed.push(name);
  }
  return result;
}

/** Where the `index`-th box of a table goes when it has no position of its own. */
export function boxPoint(table: Point, index = 0): Point {
  return { x: table.x + BOX_OFFSET.x, y: table.y + BOX_OFFSET.y + index * BOX_SPACING };
}
