import { describe, expect, it } from 'vitest';
import { createNumberFormat } from './numberFormat';

describe('createNumberFormat', () => {
  it('scales with the default k/M/B suffixes', () => {
    const format = createNumberFormat({});
    expect(format(52150)).toBe('52.15k');
    expect(format(250771358.37)).toBe('250.77M');
    expect(format(-1500)).toBe('-1.50k');
    expect(format(1.345)).toBe('1.35');
  });

  it('keeps plain numbers without a unit', () => {
    expect(createNumberFormat({ displayUnit: 'none', precision: 0 })(1234567)).toBe('1,234,567');
  });

  it('uses the configured separators and words', () => {
    expect(createNumberFormat({ displayUnit: 'text', precision: 1, decimalPoint: ',' })(2500000)).toBe('2,5 Million');
  });
});
