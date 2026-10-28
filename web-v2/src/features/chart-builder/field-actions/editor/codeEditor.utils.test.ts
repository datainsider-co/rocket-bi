import { describe, expect, it } from 'vitest';
import { monarchOf, replacedPrefixLength } from './codeEditor.utils';

describe('monarchOf', () => {
  it('colours the given functions and fields, ignoring case', () => {
    const language = monarchOf({ functions: ['SUM'], fields: ['total_profit'] });
    expect(language.ignoreCase).toBe(true);
    expect(language.functions).toEqual(['SUM']);
    expect(language.fields).toEqual(['total_profit']);
  });

  it('has a state for every state its rules move to', () => {
    const { tokenizer } = monarchOf({ functions: [], fields: [] });
    const targets = Object.values(tokenizer)
      .flat()
      .map(rule => rule[2])
      .filter((next): next is string => typeof next === 'string' && next !== '@pop');
    expect(targets.length).toBeGreaterThan(0);
    for (const next of targets) expect(tokenizer).toHaveProperty(next.slice(1));
  });

  it('reads bracketed and backticked names as one field token', () => {
    const rules = monarchOf({ functions: [], fields: [] }).tokenizer['root'] ?? [];
    const fieldRules = rules.filter(rule => rule[1] === 'field').map(rule => rule[0] as RegExp);
    expect(fieldRules.some(regex => regex.exec('[Total Profit] * 2')?.[0] === '[Total Profit]')).toBe(true);
    expect(fieldRules.some(regex => regex.exec('`order date`')?.[0] === '`order date`')).toBe(true);
  });
});

describe('replacedPrefixLength', () => {
  it.each([
    ['[Total Profit]', '[', 1],
    ['[Total Profit]', ' ', 0],
    ['SUM', '[', 0],
    ['total_profit', '', 0]
  ])('replaces %j after %j from %i characters back', (insertText, before, expected) => {
    expect(replacedPrefixLength(insertText, before)).toBe(expected);
  });
});
