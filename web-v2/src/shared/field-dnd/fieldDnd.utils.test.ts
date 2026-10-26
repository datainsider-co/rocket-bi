import { describe, expect, it } from 'vitest';
import {
  applyDrop,
  canAcceptIn,
  pickTarget,
  readSource,
  readTarget,
  resolveDrop,
  sourceData,
  targetData,
  type DragSource,
  type DropAction,
  type DropItemFactory,
  type ZoneRules
} from './fieldDnd.utils';

const field: DragSource = { kind: 'external', payload: { name: 'price' } };
const fromZone = (zoneId: string, index: number): DragSource => ({ kind: 'zone', zoneId, index });

const zones: ZoneRules = {
  x: { size: 3 },
  y: { size: 2 },
  legend: { size: 1, maxItems: 1 },
  emptyLegend: { size: 0, maxItems: 1 },
  full: { size: 2, maxItems: 2 },
  off: { size: 0, disabled: true },
  numbersOnly: { size: 0, accepts: source => source.kind === 'zone' }
};

describe('resolveDrop', () => {
  describe('a field from outside', () => {
    it.each<[string, Parameters<typeof resolveDrop>[1], DropAction]>([
      ['zone: appends', { kind: 'zone', zoneId: 'x' }, { type: 'insert', zoneId: 'x', index: 3 }],
      ['gap: inserts at the gap', { kind: 'gap', zoneId: 'x', index: 1 }, { type: 'insert', zoneId: 'x', index: 1 }],
      ['gap below the last item', { kind: 'gap', zoneId: 'x', index: 3 }, { type: 'insert', zoneId: 'x', index: 3 }],
      ['item: inserts before it', { kind: 'item', zoneId: 'x', index: 2 }, { type: 'insert', zoneId: 'x', index: 2 }],
      ['item of a full single-item zone: replaces', { kind: 'item', zoneId: 'legend', index: 0 }, { type: 'replace', zoneId: 'legend', index: 0 }],
      ['empty single-item zone: inserts', { kind: 'zone', zoneId: 'emptyLegend' }, { type: 'insert', zoneId: 'emptyLegend', index: 0 }]
    ])('%s', (_, target, expected) => {
      expect(resolveDrop(field, target, zones)).toEqual(expected);
    });

    it.each<[string, Parameters<typeof resolveDrop>[1]]>([
      ['a full zone', { kind: 'zone', zoneId: 'full' }],
      ['a gap of a full zone', { kind: 'gap', zoneId: 'full', index: 0 }],
      ['an item of a full multi-item zone', { kind: 'item', zoneId: 'full', index: 0 }],
      ['a full single-item zone outside its item', { kind: 'zone', zoneId: 'legend' }],
      ['a disabled zone', { kind: 'zone', zoneId: 'off' }],
      ['a zone that does not accept it', { kind: 'zone', zoneId: 'numbersOnly' }],
      ['an unknown zone', { kind: 'zone', zoneId: 'nope' }],
      ['a gap past the end', { kind: 'gap', zoneId: 'x', index: 4 }],
      ['a negative gap', { kind: 'gap', zoneId: 'x', index: -1 }],
      ['an item past the end', { kind: 'item', zoneId: 'x', index: 3 }]
    ])('refuses %s', (_, target) => {
      expect(resolveDrop(field, target, zones)).toBeNull();
    });
  });

  describe('an item within its zone', () => {
    it.each<[string, DragSource, Parameters<typeof resolveDrop>[1], DropAction | null]>([
      ['down onto an item', fromZone('x', 0), { kind: 'item', zoneId: 'x', index: 2 }, { type: 'reorder', zoneId: 'x', from: 0, to: 2 }],
      ['up onto an item', fromZone('x', 2), { kind: 'item', zoneId: 'x', index: 0 }, { type: 'reorder', zoneId: 'x', from: 2, to: 0 }],
      ['down to a gap', fromZone('x', 0), { kind: 'gap', zoneId: 'x', index: 2 }, { type: 'reorder', zoneId: 'x', from: 0, to: 1 }],
      ['to the last gap', fromZone('x', 0), { kind: 'gap', zoneId: 'x', index: 3 }, { type: 'reorder', zoneId: 'x', from: 0, to: 2 }],
      ['up to a gap', fromZone('x', 2), { kind: 'gap', zoneId: 'x', index: 0 }, { type: 'reorder', zoneId: 'x', from: 2, to: 0 }],
      ['to the zone: last', fromZone('x', 0), { kind: 'zone', zoneId: 'x' }, { type: 'reorder', zoneId: 'x', from: 0, to: 2 }],
      ['onto itself', fromZone('x', 1), { kind: 'item', zoneId: 'x', index: 1 }, null],
      ['to the gap above itself', fromZone('x', 1), { kind: 'gap', zoneId: 'x', index: 1 }, null],
      ['to the gap below itself', fromZone('x', 1), { kind: 'gap', zoneId: 'x', index: 2 }, null],
      ['the last item to the zone', fromZone('x', 2), { kind: 'zone', zoneId: 'x' }, null]
    ])('%s', (_, source, target, expected) => {
      expect(resolveDrop(source, target, zones)).toEqual(expected);
    });

    it('reorders a full zone', () => {
      expect(resolveDrop(fromZone('full', 0), { kind: 'item', zoneId: 'full', index: 1 }, zones)).toEqual({
        type: 'reorder',
        zoneId: 'full',
        from: 0,
        to: 1
      });
    });
  });

  describe('an item to another zone', () => {
    it('moves by default, at the target index', () => {
      expect(resolveDrop(fromZone('x', 1), { kind: 'gap', zoneId: 'y', index: 1 }, zones)).toEqual({
        type: 'transfer',
        mode: 'move',
        from: { zoneId: 'x', index: 1 },
        to: { zoneId: 'y', index: 1 }
      });
    });

    it('uses the transfer mode for the pair of zones', () => {
      const action = resolveDrop(fromZone('x', 0), { kind: 'zone', zoneId: 'y' }, zones, (from, to) =>
        from === 'x' && to === 'y' ? 'copy' : 'move'
      );
      expect(action).toMatchObject({ type: 'transfer', mode: 'copy', to: { zoneId: 'y', index: 2 } });
    });

    it('inserts before the item it is dropped on', () => {
      expect(resolveDrop(fromZone('x', 0), { kind: 'item', zoneId: 'y', index: 0 }, zones)).toMatchObject({
        to: { zoneId: 'y', index: 0 }
      });
    });

    it('goes into a zone whose rule accepts zone items', () => {
      expect(resolveDrop(fromZone('x', 0), { kind: 'zone', zoneId: 'numbersOnly' }, zones)).toMatchObject({ type: 'transfer' });
    });

    it.each<[string, DragSource, Parameters<typeof resolveDrop>[1]]>([
      ['a full zone', fromZone('x', 0), { kind: 'zone', zoneId: 'full' }],
      ['a full single-item zone (no replace, as v1)', fromZone('x', 0), { kind: 'item', zoneId: 'legend', index: 0 }],
      ['a disabled zone', fromZone('x', 0), { kind: 'zone', zoneId: 'off' }],
      ['from an unknown zone', fromZone('nope', 0), { kind: 'zone', zoneId: 'y' }],
      ['from an index past the end', fromZone('x', 3), { kind: 'zone', zoneId: 'y' }],
      ['from a negative index', fromZone('x', -1), { kind: 'zone', zoneId: 'y' }]
    ])('refuses %s', (_, source, target) => {
      expect(resolveDrop(source, target, zones)).toBeNull();
    });
  });
});

describe('canAcceptIn', () => {
  it.each<[string, DragSource, string, boolean]>([
    ['a zone with room', field, 'x', true],
    ['a full single-item zone, from outside (replace)', field, 'legend', true],
    ['a full single-item zone, from a zone', fromZone('x', 0), 'legend', false],
    ['a full zone', field, 'full', false],
    ['a disabled zone', field, 'off', false],
    ['a zone that does not accept it', field, 'numbersOnly', false],
    ['an unknown zone', field, 'nope', false],
    ['its own zone with other items', fromZone('x', 0), 'x', true],
    ['its own zone holding only it', fromZone('legend', 0), 'legend', false]
  ])('%s -> %s', (_, source, zoneId, expected) => {
    expect(canAcceptIn(source, zoneId, zones)).toBe(expected);
  });
});

describe('applyDrop', () => {
  const lists = { x: ['a', 'b', 'c'], y: ['d'], sort: [] as string[] };
  const factory: DropItemFactory<string> = {
    fromExternal: (zoneId, replacing) => (replacing ? `new(${replacing})@${zoneId}` : `new@${zoneId}`)
  };

  it('inserts a field from outside', () => {
    expect(applyDrop(lists, { type: 'insert', zoneId: 'x', index: 1 }, factory).x).toEqual(['a', 'new@x', 'b', 'c']);
  });

  it('replaces an item, giving the factory the replaced item', () => {
    expect(applyDrop(lists, { type: 'replace', zoneId: 'y', index: 0 }, factory).y).toEqual(['new(d)@y']);
  });

  it.each([
    [0, 2, ['b', 'c', 'a']],
    [2, 0, ['c', 'a', 'b']],
    [0, 1, ['b', 'a', 'c']]
  ])('reorders from %i to %i', (from, to, expected) => {
    expect(applyDrop(lists, { type: 'reorder', zoneId: 'x', from, to }, factory).x).toEqual(expected);
  });

  it('moves an item to another zone', () => {
    const next = applyDrop(
      lists,
      { type: 'transfer', mode: 'move', from: { zoneId: 'x', index: 1 }, to: { zoneId: 'y', index: 0 } },
      factory
    );
    expect(next).toEqual({ x: ['a', 'c'], y: ['b', 'd'], sort: [] });
  });

  it('copies an item, converting it with fromZone', () => {
    const next = applyDrop(
      lists,
      { type: 'transfer', mode: 'copy', from: { zoneId: 'x', index: 0 }, to: { zoneId: 'sort', index: 0 } },
      { ...factory, fromZone: (item, zoneId) => `${item}@${zoneId}` }
    );
    expect(next.x).toBe(lists.x);
    expect(next.sort).toEqual(['a@sort']);
  });

  it('keeps unchanged lists and does not mutate the input', () => {
    const next = applyDrop(lists, { type: 'insert', zoneId: 'x', index: 0 }, factory);
    expect(next.y).toBe(lists.y);
    expect(lists.x).toEqual(['a', 'b', 'c']);
  });

  it.each<DropAction>([
    { type: 'insert', zoneId: 'nope', index: 0 },
    { type: 'replace', zoneId: 'x', index: 5 },
    { type: 'reorder', zoneId: 'x', from: 9, to: 0 },
    { type: 'transfer', mode: 'move', from: { zoneId: 'x', index: 9 }, to: { zoneId: 'y', index: 0 } },
    { type: 'transfer', mode: 'move', from: { zoneId: 'x', index: 0 }, to: { zoneId: 'nope', index: 0 } }
  ])('returns the input for an action pointing at nothing: %o', action => {
    expect(applyDrop(lists, action, factory)).toBe(lists);
  });
});

describe('pickTarget', () => {
  const zone = { target: { kind: 'zone', zoneId: 'filter' }, area: 10_000 } as const;
  const innerZone = { target: { kind: 'zone', zoneId: 'filter:0' }, area: 2_000 } as const;
  const item = { target: { kind: 'item', zoneId: 'filter:0', index: 0 }, area: 500 } as const;
  const gap = { target: { kind: 'gap', zoneId: 'filter:0', index: 0 }, area: 900 } as const;

  it('prefers a gap, then an item, then a zone', () => {
    expect(pickTarget([zone, item, gap])).toBe(gap.target);
    expect(pickTarget([zone, item])).toBe(item.target);
  });

  it('prefers the innermost zone', () => {
    expect(pickTarget([zone, innerZone])).toBe(innerZone.target);
  });

  it('returns undefined for no candidates', () => {
    expect(pickTarget([])).toBeUndefined();
  });
});

describe('readSource / readTarget', () => {
  it('reads back what sourceData and targetData store', () => {
    expect(readSource(sourceData(field))).toEqual(field);
    expect(readTarget(targetData({ kind: 'gap', zoneId: 'x', index: 0 }))).toEqual({ kind: 'gap', zoneId: 'x', index: 0 });
  });

  it.each([undefined, null, {}, { fieldDndSource: { kind: 'other' } }, { fieldDndTarget: { kind: 'zone' } }])(
    'returns undefined for foreign data %o',
    data => {
      expect(readSource(data)).toBeUndefined();
      expect(readTarget(data)).toBeUndefined();
    }
  );
});
