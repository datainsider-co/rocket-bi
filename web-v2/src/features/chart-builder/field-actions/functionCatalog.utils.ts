/**
 * The SQL functions a formula can use, per data source (v1 `FormulaControllerFactory.getSupportedFunctionInfo` and
 * `FormulaSuggestionStore`). The lists are v1's, in `catalogues/<source>.json`, grouped as v1 grouped them.
 */

export interface FunctionInfo {
  readonly name: string;
  /** The signature, when it says more than the name. */
  readonly title?: string;
  readonly description?: string;
  readonly example?: string;
}

/** Group name → its functions. */
export type FunctionCatalog = Readonly<Record<string, readonly FunctionInfo[]>>;

export type CatalogKey = 'bigquery' | 'clickhouse' | 'mysql' | 'postgresql' | 'redshift' | 'vertica';

const CATALOG_KEYS: Readonly<Record<string, CatalogKey>> = {
  bigquery_connection: 'bigquery',
  clickhouse_connection: 'clickhouse',
  mysql_connection: 'mysql',
  postgresql_connection: 'postgresql',
  redshift_connection: 'redshift',
  vertica_connection: 'vertica'
};

/** The catalogue of a connection's `class_name`; ClickHouse when unknown, as v1 (`ConnectionModule.sourceType`). */
export function catalogKeyOf(sourceType: string | undefined): CatalogKey {
  return CATALOG_KEYS[sourceType ?? ''] ?? 'clickhouse';
}

/** The group listing every function. */
export const ALL_FUNCTIONS = 'All';

const KEYWORD_GROUPS = new Set(['Keyword', 'Keywords']);

/**
 * What a formula of this kind can use: a calculated column is an expression, so SQL keywords (`SELECT`, ...) are left
 * out, as v1 did (v1 missed BigQuery's `Keywords` group).
 */
export function catalogForFormula(catalog: FunctionCatalog, kind: 'calculated' | 'measure' | 'sql'): FunctionCatalog {
  if (kind !== 'calculated') return catalog;
  return Object.fromEntries(Object.entries(catalog).filter(([group]) => !KEYWORD_GROUPS.has(group)));
}

/** The groups to pick from: All, then the groups by name (v1 `CalculatedFieldModal.supportedFunctions`). */
export function functionGroupsOf(catalog: FunctionCatalog): string[] {
  return [ALL_FUNCTIONS, ...Object.keys(catalog).toSorted((a, b) => a.localeCompare(b))];
}

/** The functions of a group, or of every group for All, where a name in several groups shows once. */
export function functionsOf(catalog: FunctionCatalog, group: string): readonly FunctionInfo[] {
  if (group !== ALL_FUNCTIONS) return catalog[group] ?? [];
  const seen = new Set<string>();
  return Object.values(catalog)
    .flat()
    .filter(info => !seen.has(info.name) && Boolean(seen.add(info.name)));
}

/** The function a word of the formula names, ignoring case as SQL does. */
export function findFunction(catalog: FunctionCatalog, word: string): FunctionInfo | undefined {
  const name = word.toLowerCase();
  return name === '' ? undefined : Object.values(catalog).flat().find(info => info.name.toLowerCase() === name);
}
