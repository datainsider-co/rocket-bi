import { snakeCase } from 'lodash-es';
import type { SchemaColumn } from '@/core/schema/SchemaService';

/**
 * A calculated field's formula names columns by display name in brackets (`[Total Profit] * 2`); the server stores the
 * expression with their names (`total_profit * 2`). v1 `ExpressionParser`.
 */

/** A formula that cannot become an expression; its message is shown under the editor. */
export class FormulaError extends Error {}

// Quoted strings are left alone: a bracket or a column name inside one is text.
const QUOTED = String.raw`'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"`;
const BRACKETS = new RegExp(`${QUOTED}|\\[([^\\]]*)\\]`, 'g');
// A name not followed by `(`, so a function sharing a column's name stays a function.
const NAMES = new RegExp(`${QUOTED}|\`([^\`]*)\`|\\b([A-Za-z_][\\w$]*)\\b(?!\\s*\\()`, 'g');

/** The expression of a formula: each `[Display Name]` of `columns` becomes the column's name. */
export function toExpression(formula: string, columns: readonly SchemaColumn[]): string {
  const names = new Map(columns.map(column => [column.displayName.trim(), column.name]));
  return formula.replace(BRACKETS, (match, displayName: string | undefined) => {
    if (displayName === undefined) return match;
    const name = names.get(displayName.trim());
    if (name === undefined) throw new FormulaError(`Column [${displayName.trim()}] does not exist in this table`);
    return name;
  });
}

/**
 * The formula of an expression: each column name becomes `[Display Name]`, matching the case first, then ignoring it
 * as SQL does. One pass, so a display name is never replaced again (v1 replaced name by name, and a later name could
 * match inside an earlier display name).
 */
export function toFormula(expression: string, columns: readonly SchemaColumn[]): string {
  const exact = new Map(columns.map(column => [column.name, column.displayName.trim()]));
  const lower = new Map(columns.map(column => [column.name.toLowerCase(), column.displayName.trim()]));
  const displayOf = (name: string) => exact.get(name) ?? lower.get(name.toLowerCase());
  return expression.replace(NAMES, (match, quoted: string | undefined, plain: string | undefined) => {
    const name = quoted ?? plain;
    const displayName = name === undefined ? undefined : displayOf(name);
    return displayName === undefined ? match : `[${displayName}]`;
  });
}

/**
 * The name of a new column from its display name (v1 `IdGenerator.generateName`): `Total Profit` → `total_profit`.
 * Only ASCII word characters stay, the only ones the server takes in a column's path; `''` when none is left.
 */
export function columnNameOf(displayName: string): string {
  // Accents off first: lodash's `deburr` misses letters with two marks (`ợ`).
  const plain = displayName.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  return snakeCase(plain)
    .replace(/\W+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** A column name as SQL reads it: names that are not plain words go in backticks (v1 `FormulaUtils.escape`). */
export function escapeIdentifier(name: string): string {
  return /^\w+$/.test(name) ? name : `\`${name}\``;
}
