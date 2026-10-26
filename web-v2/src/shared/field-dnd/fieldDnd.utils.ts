/**
 * Drop rules for dragging fields into lists ("zones"), as in v1's chart builder (`DropArea`, `DropItem`,
 * `ConfigDraggable`): fields come from outside (the database tree) or from another zone, and land at the end of a
 * zone, between two items, or onto an item.
 */

export type ZoneId = string;

/** What is being dragged. */
export type DragSource =
  /** Something from outside the zones, such as a column in the database tree. `payload` is the caller's. */
  | { kind: 'external'; payload: unknown }
  /** An item already in a zone. */
  | { kind: 'zone'; zoneId: ZoneId; index: number };

/** Where it would land. */
export type DropTarget =
  /** The zone itself, outside any item: add at the end. */
  | { kind: 'zone'; zoneId: ZoneId }
  /** The line above item `index` (`index` = size: below the last one): insert there. */
  | { kind: 'gap'; zoneId: ZoneId; index: number }
  /** Onto item `index`: replace it when the zone allows, otherwise insert before it. */
  | { kind: 'item'; zoneId: ZoneId; index: number };

export interface ZoneRule {
  /** Number of items in the zone now. */
  size: number;
  /** v1 `DraggableConfig.maxItem`. */
  maxItems?: number;
  disabled?: boolean;
  /** Extra check, for zones that only take some fields. */
  accepts?: (source: DragSource) => boolean;
}

export type ZoneRules = Readonly<Record<ZoneId, ZoneRule>>;

/**
 * Whether an item dragged to another zone leaves its zone (`move`) or stays (`copy`). v1 moves between config zones
 * and copies to or from the sorting zone and out of the filter zone.
 */
export type TransferMode = 'move' | 'copy';

export type TransferModeOf = (fromZone: ZoneId, toZone: ZoneId) => TransferMode;

export type DropAction =
  | { type: 'insert'; zoneId: ZoneId; index: number }
  | { type: 'replace'; zoneId: ZoneId; index: number }
  | { type: 'reorder'; zoneId: ZoneId; from: number; to: number }
  | {
      type: 'transfer';
      mode: TransferMode;
      from: { zoneId: ZoneId; index: number };
      to: { zoneId: ZoneId; index: number };
    };

const moveAlways: TransferModeOf = () => 'move';

function canAdd(rule: ZoneRule): boolean {
  return rule.maxItems === undefined || rule.size < rule.maxItems;
}

/** v1 `ConfigDraggable.canReplace`: a single-item zone that is full swaps its item for the dropped field. */
function canReplace(rule: ZoneRule): boolean {
  return rule.maxItems === 1 && rule.size === 1;
}

function isUsable(rule: ZoneRule | undefined, source: DragSource): rule is ZoneRule {
  return !!rule && !rule.disabled && (rule.accepts?.(source) ?? true);
}

function isValidIndex(target: DropTarget, size: number): boolean {
  if (target.kind === 'gap') return Number.isInteger(target.index) && target.index >= 0 && target.index <= size;
  if (target.kind === 'item') return Number.isInteger(target.index) && target.index >= 0 && target.index < size;
  return true;
}

/** Index where a dropped item lands, counted before anything is removed. */
function insertIndex(target: DropTarget, size: number): number {
  return target.kind === 'zone' ? size : target.index;
}

function reorderIndex(target: DropTarget, from: number, size: number): number {
  if (target.kind === 'zone') return size - 1;
  if (target.kind === 'gap') return target.index > from ? target.index - 1 : target.index;
  return target.index;
}

/** What dropping `source` on `target` does, or null when the drop is not allowed or changes nothing. */
export function resolveDrop(
  source: DragSource,
  target: DropTarget,
  zones: ZoneRules,
  transferModeOf: TransferModeOf = moveAlways
): DropAction | null {
  const rule = zones[target.zoneId];
  if (!isUsable(rule, source) || !isValidIndex(target, rule.size)) return null;

  if (source.kind === 'external') {
    if (target.kind === 'item' && canReplace(rule)) return { type: 'replace', zoneId: target.zoneId, index: target.index };
    return canAdd(rule) ? { type: 'insert', zoneId: target.zoneId, index: insertIndex(target, rule.size) } : null;
  }

  const fromRule = zones[source.zoneId];
  if (!fromRule || source.index < 0 || source.index >= fromRule.size) return null;

  if (source.zoneId === target.zoneId) {
    const to = reorderIndex(target, source.index, rule.size);
    return to === source.index ? null : { type: 'reorder', zoneId: target.zoneId, from: source.index, to };
  }

  if (!canAdd(rule)) return null;
  return {
    type: 'transfer',
    mode: transferModeOf(source.zoneId, target.zoneId),
    from: { zoneId: source.zoneId, index: source.index },
    to: { zoneId: target.zoneId, index: insertIndex(target, rule.size) }
  };
}

/** Whether the zone should show as a drop area while `source` is dragged (v1's dashed border). */
export function canAcceptIn(source: DragSource, zoneId: ZoneId, zones: ZoneRules): boolean {
  const rule = zones[zoneId];
  if (!isUsable(rule, source)) return false;
  if (source.kind === 'zone' && source.zoneId === zoneId) return rule.size > 1;
  return canAdd(rule) || (source.kind === 'external' && canReplace(rule));
}

export interface DropItemFactory<T> {
  /** Item for a field dropped from outside; `replacing` is the item it takes the place of. */
  fromExternal: (zoneId: ZoneId, replacing?: T) => T;
  /** Item to put in `zoneId` when one is moved or copied there from another zone. Defaults to the same item. */
  fromZone?: (item: T, zoneId: ZoneId) => T;
}

/**
 * Applies a drop to the zones' lists. Lists that don't change keep their identity, so components showing them don't
 * re-render. Returns the input when the action points at a missing list or item.
 */
export function applyDrop<T>(
  lists: Readonly<Record<ZoneId, readonly T[]>>,
  action: DropAction,
  factory: DropItemFactory<T>
): Readonly<Record<ZoneId, readonly T[]>> {
  switch (action.type) {
    case 'insert': {
      const list = lists[action.zoneId];
      if (!list) return lists;
      return { ...lists, [action.zoneId]: list.toSpliced(action.index, 0, factory.fromExternal(action.zoneId)) };
    }
    case 'replace': {
      const list = lists[action.zoneId];
      const current = list?.[action.index];
      if (!list || current === undefined) return lists;
      return { ...lists, [action.zoneId]: list.with(action.index, factory.fromExternal(action.zoneId, current)) };
    }
    case 'reorder': {
      const list = lists[action.zoneId];
      const item = list?.[action.from];
      if (!list || item === undefined) return lists;
      return { ...lists, [action.zoneId]: list.toSpliced(action.from, 1).toSpliced(action.to, 0, item) };
    }
    case 'transfer': {
      const from = lists[action.from.zoneId];
      const to = lists[action.to.zoneId];
      const item = from?.[action.from.index];
      if (!from || !to || item === undefined) return lists;
      const moved = factory.fromZone ? factory.fromZone(item, action.to.zoneId) : item;
      return {
        ...lists,
        ...(action.mode === 'move' ? { [action.from.zoneId]: from.toSpliced(action.from.index, 1) } : {}),
        [action.to.zoneId]: to.toSpliced(action.to.index, 0, moved)
      };
    }
  }
}

export interface TargetCandidate {
  target: DropTarget;
  /** Area of the droppable's rect, to prefer the innermost of nested zones. */
  area: number;
}

const PRIORITY: Record<DropTarget['kind'], number> = { gap: 0, item: 1, zone: 2 };

/**
 * The target to use among all droppables under the pointer: a gap line over the item it overlaps, an item over its
 * zone, and the smallest of nested zones (a filter AND group inside the filter zone).
 */
export function pickTarget(candidates: readonly TargetCandidate[]): DropTarget | undefined {
  return candidates.toSorted((a, b) => PRIORITY[a.target.kind] - PRIORITY[b.target.kind] || a.area - b.area)[0]?.target;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Reads the source stored in a draggable's `data`. */
export function readSource(data: unknown): DragSource | undefined {
  const source = isRecord(data) ? data['fieldDndSource'] : undefined;
  return isRecord(source) && (source['kind'] === 'external' || source['kind'] === 'zone') ? (source as DragSource) : undefined;
}

/** Reads the target stored in a droppable's `data`. */
export function readTarget(data: unknown): DropTarget | undefined {
  const target = isRecord(data) ? data['fieldDndTarget'] : undefined;
  return isRecord(target) && typeof target['zoneId'] === 'string' ? (target as DropTarget) : undefined;
}

export const sourceData = (source: DragSource) => ({ fieldDndSource: source });
export const targetData = (target: DropTarget) => ({ fieldDndTarget: target });
