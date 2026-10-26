import { describe, expect, it } from 'vitest';
import {
  buildTreeNodes,
  initialExpandedKeys,
  keysToLoad,
  treeChildKey,
  treeChildrenSetting,
  treeDepth,
  treePath,
  treeRootKey,
  treeSelectedValues
} from './treeFilter.utils';

const region = { name: 'Region', function: { class_name: 'group', field: { field_name: 'region' } } };
const country = { name: 'Country', function: { class_name: 'group', field: { field_name: 'country' }, scalar_function: { class_name: 'upper' } } };
const setting = { class_name: 'tab_control_chart_setting', values: [region, country], filters: [{ class_name: 'or' }] };

describe('tree keys', () => {
  it('builds and reads paths from the root', () => {
    expect(treeRootKey(setting)).toBe('Region');
    expect(treeRootKey({})).toBe('');
    const key = treeChildKey(treeChildKey('Region', 'Asia'), 'Japan');
    expect(key).toBe('Region//Asia//Japan');
    expect(treePath(key)).toEqual(['Asia', 'Japan']);
    expect(treePath('Region')).toEqual([]);
    expect(treeDepth(setting)).toBe(2);
  });
});

describe('treeSelectedValues', () => {
  it('flattens every checked path in key order', () => {
    expect(treeSelectedValues(['Region//Europe', 'Region//Asia//Japan'], 'Region')).toEqual(['Asia', 'Japan', 'Europe']);
  });

  it('counts a checked node once, not again for its checked children', () => {
    expect(treeSelectedValues(['Region//Asia', 'Region//Asia//Japan', 'Region//Asia//China'], 'Region')).toEqual(['Asia']);
    expect(treeSelectedValues(['Region//Asia//Japan', 'Region//Asia//China'], 'Region')).toEqual(['Asia', 'China', 'Japan']);
  });

  it('is all (empty) when the root is checked or nothing is', () => {
    expect(treeSelectedValues(['Region', 'Region//Asia'], 'Region')).toEqual([]);
    expect(treeSelectedValues([], 'Region')).toEqual([]);
  });
});

describe('treeChildrenSetting', () => {
  it('queries the first level as stored', () => {
    expect(treeChildrenSetting(setting, [])).toEqual({ ...setting, values: [region] });
  });

  it('queries the next level filtered to the path', () => {
    expect(treeChildrenSetting(setting, ['Asia'])).toEqual({
      ...setting,
      values: [country],
      filters: [{ class_name: 'or' }, { class_name: 'and', conditions: [{ class_name: 'equal', field: region.function.field, value: 'Asia' }] }]
    });
  });

  it('has nothing below the last level', () => {
    expect(treeChildrenSetting(setting, ['Asia', 'Japan'])).toBeUndefined();
  });
});

describe('buildTreeNodes', () => {
  it('nests the loaded values under the root, last level as leaves', () => {
    const children = new Map([
      ['Region', ['Asia', 'Europe']],
      ['Region//Asia', ['Japan']]
    ]);
    expect(buildTreeNodes('Region', children, 2)).toEqual([
      {
        title: 'Region',
        key: 'Region',
        isLeaf: false,
        children: [
          { title: 'Asia', key: 'Region//Asia', isLeaf: false, children: [{ title: 'Japan', key: 'Region//Asia//Japan', isLeaf: true }] },
          { title: 'Europe', key: 'Region//Europe', isLeaf: false, children: [] }
        ]
      }
    ]);
  });

  it('shows just the root before anything loads', () => {
    expect(buildTreeNodes('Region', new Map(), 2)).toEqual([{ title: 'Region', key: 'Region', isLeaf: false, children: [] }]);
  });
});

describe('expanded keys', () => {
  it('loads the expanded nodes between the root and the last level', () => {
    expect(keysToLoad(['Region', 'Region//Asia', 'Region//Asia//Japan'], 'Region', 2)).toEqual(['Region//Asia']);
  });

  it('starts from the stored keys, else the root', () => {
    expect(initialExpandedKeys(setting)).toEqual(['Region']);
    const stored = { ...setting, options: { options: { default: { setting: { value: { expanded_keys: ['Region//Asia'] } } } } } };
    expect(initialExpandedKeys(stored)).toEqual(['Region//Asia']);
  });
});
