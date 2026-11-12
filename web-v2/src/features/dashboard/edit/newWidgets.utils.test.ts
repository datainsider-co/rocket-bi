import { describe, expect, it } from 'vitest';
import { addedWidgetIds } from './newWidgets.utils';

describe('addedWidgetIds', () => {
  it('gives the ids that are new, in order', () => {
    expect(addedWidgetIds([1, 2], [3, 1, 2, 4])).toEqual([3, 4]);
  });

  it('gives nothing when no widget was added', () => {
    expect(addedWidgetIds([1, 2], [2, 1])).toEqual([]);
    expect(addedWidgetIds([1, 2], [1])).toEqual([]);
    expect(addedWidgetIds([], [])).toEqual([]);
  });

  it('gives every id when there was none before', () => {
    expect(addedWidgetIds([], [5, 6])).toEqual([5, 6]);
  });
});
