import { describe, expect, it } from 'vitest';
import { columnKind } from './columnType.utils';

describe('columnKind', () => {
  it.each([
    ['date', 'date'],
    ['datetime64', 'date'],
    ['int64', 'number'],
    ['double', 'number'],
    ['string', 'text'],
    ['', 'text'],
    ['array', 'text']
  ])('%s -> %s', (type, kind) => {
    expect(columnKind(type)).toBe(kind);
  });
});
