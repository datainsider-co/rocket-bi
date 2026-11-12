import type { WidgetId } from '@/core/dashboard/Position';

/** The ids in `current` that `previous` didn't have, in `current`'s order. */
export function addedWidgetIds(previous: readonly WidgetId[], current: readonly WidgetId[]): WidgetId[] {
  const known = new Set(previous);
  return current.filter(id => !known.has(id));
}
