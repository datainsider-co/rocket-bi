import { describe, expect, it } from 'vitest';
import { isTableDrag, readTableDrag, TABLE_DRAG_TYPE, writeTableDrag } from './tableDrag';

/** The part of `DataTransfer` the helpers use; jsdom has no `DataTransfer`. */
function fakeData(entries: Record<string, string> = {}) {
  const store = new Map(Object.entries(entries));
  return {
    setData: (type: string, value: string) => void store.set(type, value),
    getData: (type: string) => store.get(type) ?? '',
    get types() {
      return [...store.keys()];
    }
  };
}

describe('table drag', () => {
  it('reads back the table it wrote', () => {
    const data = fakeData();

    writeTableDrag(data, { dbName: 'dw0_probe', name: 'products' });

    expect(isTableDrag(data)).toBe(true);
    expect(readTableDrag(data)).toEqual({ dbName: 'dw0_probe', name: 'products' });
  });

  it('ignores other drags', () => {
    const data = fakeData({ 'text/plain': 'products' });

    expect(isTableDrag(data)).toBe(false);
    expect(readTableDrag(data)).toBeUndefined();
  });

  it.each(['not json', 'null', '{"dbName":"a"}', '{"dbName":1,"name":"b"}'])('ignores a malformed table: %s', value => {
    expect(readTableDrag(fakeData({ [TABLE_DRAG_TYPE]: value }))).toBeUndefined();
  });
});
