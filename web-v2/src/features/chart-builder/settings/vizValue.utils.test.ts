import { describe, expect, it } from 'vitest';
import type { VizOptions } from '@/core/query/vizOptions';
import { boolAt, numberAt, textAt } from './vizValue.utils';

const viz = {
  title: { text: 'Sales', enabled: false },
  yAxis: [{ gridLineWidth: '0.5' }, { gridLineWidth: 1 }],
  legend: { maxHeight: 'x', title: { text: '' } }
} as unknown as VizOptions;

describe('textAt', () => {
  it('reads text', () => {
    expect(textAt(viz, 'title.text', 'Untitled')).toBe('Sales');
  });

  it('keeps empty text', () => {
    expect(textAt(viz, 'legend.title.text', 'Legend')).toBe('');
  });

  it('reads a number as text', () => {
    expect(textAt(viz, 'yAxis[1].gridLineWidth', '0')).toBe('1');
  });

  it.each([['title.enabled'], ['subtitle.text']])('falls back for %s', path => {
    expect(textAt(viz, path, 'x')).toBe('x');
  });
});

describe('numberAt', () => {
  it('reads a number', () => {
    expect(numberAt(viz, 'yAxis[1].gridLineWidth', 0)).toBe(1);
  });

  it('reads a number stored as text', () => {
    expect(numberAt(viz, 'yAxis[0].gridLineWidth', 0)).toBe(0.5);
  });

  it.each([['legend.maxHeight'], ['legend.title.text'], ['title.enabled'], ['missing']])('falls back for %s', path => {
    expect(numberAt(viz, path, 60)).toBe(60);
  });
});

describe('boolAt', () => {
  it('reads a boolean', () => {
    expect(boolAt(viz, 'title.enabled', true)).toBe(false);
  });

  it.each([['title.text'], ['missing']])('falls back for %s', path => {
    expect(boolAt(viz, path, true)).toBe(true);
  });
});
