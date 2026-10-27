import { get } from 'lodash-es';
import type { VizOptions } from '@/core/query/vizOptions';

/**
 * A setting's current value, read at a lodash path of the viz options, or what v1 showed when it is missing. v1 stored
 * some numbers as text (`gridLineWidth: '0.5'`) and others as numbers, so text and numbers read as either.
 */

export function textAt(viz: VizOptions, path: string, fallback: string): string {
  const value: unknown = get(viz, path);
  if (typeof value === 'string') return value;
  return typeof value === 'number' ? String(value) : fallback;
}

export function numberAt(viz: VizOptions, path: string, fallback: number): number {
  const value: unknown = get(viz, path);
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : fallback;
}

export function boolAt(viz: VizOptions, path: string, fallback: boolean): boolean {
  const value: unknown = get(viz, path);
  return typeof value === 'boolean' ? value : fallback;
}
