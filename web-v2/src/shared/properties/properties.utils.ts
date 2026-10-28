/** One row of a key / value properties editor (JDBC properties). Keys are data: kept as typed, only trimmed. */
export interface PropertyRow {
  key: string;
  value: string;
}

/** A form that edits properties; `PropertiesFields` works on its `properties` array. */
export interface WithProperties {
  properties: PropertyRow[];
}

/** One entry per row: an error for an empty key or a key used by an earlier row, `undefined` otherwise. */
export function propertyKeyErrors(rows: readonly PropertyRow[]): (string | undefined)[] {
  const seen = new Set<string>();
  return rows.map(({ key }) => {
    const name = key.trim();
    if (!name) return 'Key is required!';
    if (seen.has(name)) return 'This key is already used';
    seen.add(name);
    return undefined;
  });
}

export function toPropertyRows(properties: Readonly<Record<string, string>>): PropertyRow[] {
  return Object.entries(properties).map(([key, value]) => ({ key, value }));
}

/** Valid rows as a map, keys trimmed. */
export function fromPropertyRows(rows: readonly PropertyRow[]): Record<string, string> {
  return Object.fromEntries(rows.map(row => [row.key.trim(), row.value]));
}
