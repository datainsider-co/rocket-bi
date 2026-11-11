import { describe, expect, it } from 'vitest';
import { buildableTypes } from './chartTypes.utils';

const item = (type: string, buildable: boolean) => ({ type, title: type, icon: `${type}.svg`, buildable });

describe('buildableTypes', () => {
  it('keeps the types that can be built, in order', () => {
    const items = [item('line', true), item('map', false), item('pie', true)];
    expect(buildableTypes(items).map(type => type.type)).toEqual(['line', 'pie']);
    expect(items).toHaveLength(3);
  });

  it('is empty without items', () => {
    expect(buildableTypes([])).toEqual([]);
  });
});
