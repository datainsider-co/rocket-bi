import { PositionGroup, positionKey, thirdPartyPositionKey } from '@/core/data-cook/etlExtraData';

/** What a box on the canvas stands for. Every one belongs to the operator writing `tblName`. */
export type EtlNodeRef =
  | { readonly type: 'table'; readonly tblName: string }
  | { readonly type: 'operator'; readonly tblName: string }
  /** Save To Data Warehouse. */
  | { readonly type: 'persist'; readonly tblName: string }
  /** The `index`-th Save To Database. */
  | { readonly type: 'thirdParty'; readonly tblName: string; readonly index: number }
  /** A Send To Email operator: a box, without a shape or a table of its own. */
  | { readonly type: 'email'; readonly tblName: string };

/** The table name sits last: it may hold any character. */
export function nodeId(ref: EtlNodeRef): string {
  return ref.type === 'thirdParty' ? `thirdParty:${ref.index}:${ref.tblName}` : `${ref.type}:${ref.tblName}`;
}

/** Where `extra_data` keeps the position of the box `ref` stands for. */
export function positionTarget(ref: EtlNodeRef): { group: PositionGroup; key: string } {
  switch (ref.type) {
    case 'table':
      return { group: PositionGroup.Table, key: positionKey(ref.tblName) };
    case 'operator':
      return { group: PositionGroup.Operator, key: positionKey(ref.tblName) };
    case 'persist':
      return { group: PositionGroup.SavedTable, key: positionKey(ref.tblName) };
    case 'thirdParty':
      return { group: PositionGroup.SavedThirdParty, key: thirdPartyPositionKey(ref.tblName, ref.index) };
    case 'email':
      return { group: PositionGroup.SavedEmail, key: positionKey(ref.tblName) };
  }
}
