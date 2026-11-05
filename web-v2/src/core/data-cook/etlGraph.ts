import { operatorParents, withParents, type EtlOperator } from './EtlOperator';

/**
 * An ETL as a flat graph, keyed by destination table name. The server stores only the leaves, each nesting the
 * operators it reads from, so a shared operator is copied into every branch. The editor works on this graph, where
 * each operator exists once, and `leavesFromGraph` builds the trees back for saving.
 */
export interface EtlGraph {
  /** Every operator, parents before the operators that read them. */
  readonly operators: ReadonlyMap<string, EtlOperator>;
  /** Table names each operator reads from, in `operatorParents` order. */
  readonly parentNames: ReadonlyMap<string, readonly string[]>;
}

/** The first copy of an operator wins when a table name shows up twice, as v1's `EtlOperator.unique` did. */
export function etlGraphFromLeaves(leaves: readonly EtlOperator[]): EtlGraph {
  const operators = new Map<string, EtlOperator>();
  const parentNames = new Map<string, readonly string[]>();
  const visit = (operator: EtlOperator) => {
    const name = operator.destTable.tblName;
    if (operators.has(name)) return;
    const parents = operatorParents(operator);
    parents.forEach(visit);
    parentNames.set(name, parents.map(parent => parent.destTable.tblName));
    operators.set(name, operator);
  };
  leaves.forEach(visit);
  return { operators, parentNames };
}

/** Operators no other operator reads from: what the server stores as the ETL's `operators`. */
export function leafNames(graph: EtlGraph): string[] {
  const read = new Set([...graph.parentNames.values()].flat());
  return [...graph.operators.keys()].filter(name => !read.has(name));
}

/** Builds operators with the graph's version of every operator they read from, each once (a cycle stops a branch). */
function treeBuilder(graph: EtlGraph): (name: string) => EtlOperator | undefined {
  const built = new Map<string, EtlOperator>();
  const build = (name: string, path: ReadonlySet<string>): EtlOperator | undefined => {
    const done = built.get(name);
    if (done) return done;
    const operator = graph.operators.get(name);
    if (!operator || path.has(name)) return undefined;
    const nextPath = new Set(path).add(name);
    const parents = (graph.parentNames.get(name) ?? []).map(parent => build(parent, nextPath));
    const result = parents.every(parent => parent !== undefined) ? withParents(operator, parents) : operator;
    built.set(name, result);
    return result;
  };
  return name => build(name, new Set());
}

/** The leaves as trees again, each with the graph's version of every operator it reads from. */
export function leavesFromGraph(graph: EtlGraph): EtlOperator[] {
  const build = treeBuilder(graph);
  return leafNames(graph).flatMap(name => build(name) ?? []);
}

/** The operator writing `name` as a tree: what the server builds that table from. */
export function operatorTree(graph: EtlGraph, name: string): EtlOperator | undefined {
  return treeBuilder(graph)(name);
}

/** Every table `name` reads from, directly or not. */
export function ancestorNames(graph: EtlGraph, name: string): Set<string> {
  const found = new Set<string>();
  const visit = (current: string) => {
    for (const parent of graph.parentNames.get(current) ?? []) {
      if (found.has(parent)) continue;
      found.add(parent);
      visit(parent);
    }
  };
  visit(name);
  return found;
}

/** `base`, or `base_1`, `base_2`, ... when taken (v1 `makeDestTableConfig`). */
export function uniqueTableName(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  let count = 1;
  while (taken.has(`${base}_${count}`)) count += 1;
  return `${base}_${count}`;
}

/**
 * The table name v1 gave a new operator reading from `parents`: up a chain of single parents to the operator a chain
 * starts from, then that operator's table, or `<left>_join_<right>` where two tables meet. A source table is named
 * after itself (`tableNameForSource`). The result is made unique with `uniqueTableName`.
 */
export function baseTableName(parents: readonly EtlOperator[]): string {
  let current = parents;
  for (;;) {
    const first = current[0];
    if (current.length !== 1 || !first) break;
    const grandParents = operatorParents(first);
    if (grandParents.length === 0) break;
    current = grandParents;
  }
  const [left, right] = current;
  if (current.length === 2 && left && right) return `${left.destTable.tblName}_join_${right.destTable.tblName}`;
  return left?.destTable.tblName ?? '';
}
