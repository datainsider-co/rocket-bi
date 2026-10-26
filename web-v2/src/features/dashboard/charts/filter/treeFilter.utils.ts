import { asArray, asString, getPath, isRecord, type JsonObject } from '@/core/json/json';
import { equalCondition } from '@/core/query/filterRequests';

/**
 * Tree filter (v1 `TreeFilter`): one level per column of `values`. A node's key is the path from the root,
 * `<root>//<level 1 value>//<level 2 value>`, where the root is the first column's name and means "all".
 */

const SEPARATOR = '//';

export function treeRootKey(setting: JsonObject): string {
  const first = asArray(setting['values'])[0];
  return isRecord(first) ? asString(first['name']) : '';
}

export function treeChildKey(parent: string, value: string): string {
  return `${parent}${SEPARATOR}${value}`;
}

/** The values along a key, root left out. */
export function treePath(key: string): string[] {
  return key.split(SEPARATOR).slice(1);
}

function parentKey(key: string): string {
  return key.slice(0, key.lastIndexOf(SEPARATOR));
}

/**
 * What the tree offers as a control: every value along every checked key, none when the root is checked (v1
 * `getSelectedValues`). Checking a node also checks its loaded children; they add nothing to their parent, so only
 * the topmost checked keys count, and each value is sent once (v1 sent the parent again per child).
 */
export function treeSelectedValues(keys: readonly string[], rootKey: string): string[] {
  if (keys.includes(rootKey)) return [];
  const checked = new Set(keys);
  const topmost = [...keys].sort().filter(key => !checked.has(parentKey(key)));
  return [...new Set(topmost.flatMap(treePath))];
}

/**
 * The setting that lists the children of the node at `path`: the next level's column, filtered to the path (v1
 * `buildSubRowRequest`). `undefined` below the last level.
 */
export function treeChildrenSetting(setting: JsonObject, path: readonly string[]): JsonObject | undefined {
  const columns = asArray(setting['values']);
  const next = columns[path.length];
  if (!next) return undefined;
  const conditions = path.flatMap((value, depth) => equalCondition(columns[depth], value) ?? []);
  const filters = asArray(setting['filters']);
  return {
    ...setting,
    values: [next],
    filters: conditions.length > 0 ? [...filters, { class_name: 'and', conditions }] : filters
  };
}

/** Number of levels. */
export function treeDepth(setting: JsonObject): number {
  return asArray(setting['values']).length;
}

export interface TreeNode {
  title: string;
  key: string;
  isLeaf: boolean;
  children?: TreeNode[];
}

/**
 * The tree to show: the root ("all"), then the loaded values of each node (`children` by node key). Nodes on the last
 * level are leaves; others without loaded values can still be expanded.
 */
export function buildTreeNodes(rootKey: string, children: ReadonlyMap<string, readonly string[]>, levels: number): TreeNode[] {
  const build = (key: string, depth: number): TreeNode[] =>
    (children.get(key) ?? []).map(value => {
      const child = treeChildKey(key, value);
      const isLeaf = depth >= levels - 1;
      return { title: value, key: child, isLeaf, ...(!isLeaf && { children: build(child, depth + 1) }) };
    });
  return [{ title: rootKey, key: rootKey, isLeaf: false, children: build(rootKey, 0) }];
}

/** The expanded keys whose values still have to be queried: below the root, above the last level. */
export function keysToLoad(expandedKeys: readonly string[], rootKey: string, levels: number): string[] {
  return expandedKeys.filter(key => key !== rootKey && treePath(key).length < levels);
}

/** Expanded on load: the default's, else the root (v1 `getDefaultExpanded`). */
export function initialExpandedKeys(setting: JsonObject): string[] {
  const stored = asArray(getPath(setting, ['options', 'options', 'default', 'setting', 'value', 'expanded_keys']));
  const keys = stored.filter((key): key is string => typeof key === 'string');
  return keys.length > 0 ? keys : [treeRootKey(setting)];
}
