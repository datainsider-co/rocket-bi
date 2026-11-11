import type { PickerItem } from '@/core/chart-builder/chartCatalogue';

/** The types offered to pick: like v1, only the ones that can be built. */
export function buildableTypes(items: readonly PickerItem[]): PickerItem[] {
  return items.filter(item => item.buildable);
}
