import type { CompletionKind, Highlight } from '../completions.utils';

/**
 * Monaco's language data for a formula or a query, as plain values (v1 `*Syntax.monarchLanguage` and the
 * `MonacoFormulaController`s' token providers): one tokenizer for every data source, coloring the source's functions
 * and the table's columns.
 */

/** A Monarch rule: `[regex, token]` or `[regex, token, next state]`, or with `cases`. */
type MonarchRule = readonly unknown[];

export interface MonarchLanguage {
  readonly ignoreCase: boolean;
  readonly defaultToken: string;
  readonly functions: readonly string[];
  readonly fields: readonly string[];
  readonly tokenizer: Readonly<Record<string, readonly MonarchRule[]>>;
}

export function monarchOf(highlight: Highlight): MonarchLanguage {
  return {
    // SQL ignores case, so `sum` is coloured like `SUM`.
    ignoreCase: true,
    defaultToken: '',
    functions: highlight.functions,
    fields: highlight.fields,
    tokenizer: {
      root: [
        [/--.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/'/, 'string', '@singleQuoted'],
        [/"/, 'string', '@doubleQuoted'],
        // `[Display Name]` of a calculated column, a backticked name.
        [/\[[^\]]*\]/, 'field'],
        [/`[^`]*`/, 'field'],
        [/\d+(\.\d+)?([eE][-+]?\d+)?/, 'number'],
        [/[A-Za-z_][\w$]*/, { cases: { '@functions': 'function', '@fields': 'field', '@default': 'identifier' } }],
        [/[<>=!%&+\-*/|~^]/, 'operator']
      ],
      comment: [
        [/[^*/]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[*/]/, 'comment']
      ],
      singleQuoted: [
        [/[^'\\]+/, 'string'],
        [/\\./, 'string'],
        [/'/, 'string', '@pop']
      ],
      doubleQuoted: [
        [/[^"\\]+/, 'string'],
        [/\\./, 'string'],
        [/"/, 'string', '@pop']
      ]
    }
  };
}

/** Token colours on the light editor (v1 `formula-theme-light`, close to its palette). */
export const EDITOR_THEME_RULES = [
  { token: 'function', foreground: '0066ff', fontStyle: 'bold' },
  { token: 'field', foreground: '8a3ffc' },
  { token: 'string', foreground: 'b35900' },
  { token: 'number', foreground: '098658' },
  { token: 'comment', foreground: '8c8c8c', fontStyle: 'italic' },
  { token: 'operator', foreground: '595959' }
] as const;

/** Monaco's `CompletionItemKind` names for ours. */
export const COMPLETION_KINDS: Readonly<Record<CompletionKind, 'Function' | 'Field' | 'Struct'>> = { function: 'Function', field: 'Field', table: 'Struct' };

/**
 * How many characters before the typed word a suggestion replaces: a `[` the user typed before a `[Display Name]`
 * suggestion, so it is not doubled.
 */
export function replacedPrefixLength(insertText: string, charBeforeWord: string): number {
  return insertText.startsWith('[') && charBeforeWord === '[' ? 1 : 0;
}
