import Deneric from 'deneric2';
import { asArray, asNumber, asRecord, type JsonObject } from '@/core/json/json';
import { parseQueryView, type QueryView } from './QueryView';
import { Relationship } from './Relationship';

/** Top-left corner of a table on the relationship canvas, in canvas pixels. */
export interface TablePosition {
  readonly left: number;
  readonly top: number;
}

/**
 * Keyed by table, see `tablePositionKey` in the relationship feature. Keys are data: they are read and written
 * exactly as stored, never case-converted.
 */
export type TablePositions = Readonly<Record<string, TablePosition>>;

function positionsFromJson(json: unknown): Record<string, TablePosition> {
  return Object.fromEntries(
    Object.entries(asRecord(json)).map(([key, value]) => {
      const position = asRecord(value);
      return [key, { left: asNumber(position.left), top: asNumber(position.top) }];
    })
  );
}

/**
 * Backend `RelationshipInfo`: the views (tables) of a dashboard, or the organization's global ones, how they join,
 * and in `extra_data.table_positions` where the editor draws each table. Views of another kind than table or SQL
 * view are dropped, and so are relationships that use one.
 */
export class RelationshipInfo extends Deneric {
  views: QueryView[] = [];
  relationships: Relationship[] = [];
  tablePositions: TablePositions = {};

  constructor(json?: unknown) {
    super({});
    const source = asRecord(json);
    this.views = asArray(source.views)
      .map(parseQueryView)
      .filter(view => view !== undefined);
    this.relationships = asArray(source.relationships)
      .map(relationship => new Relationship(relationship))
      .filter(relationship => relationship.firstView && relationship.secondView);
    this.tablePositions = positionsFromJson(asRecord(source.extra_data).table_positions);
  }

  static of(views: QueryView[], relationships: Relationship[], tablePositions: TablePositions): RelationshipInfo {
    const info = new RelationshipInfo();
    info.views = views;
    info.relationships = relationships;
    info.tablePositions = tablePositions;
    return info;
  }

  override toJson(): JsonObject {
    return {
      views: this.views.map(view => view.toJson()),
      relationships: this.relationships.map(relationship => relationship.toJson()),
      extra_data: {
        table_positions: Object.fromEntries(
          Object.entries(this.tablePositions).map(([key, { left, top }]) => [key, { left, top }])
        )
      }
    };
  }
}
