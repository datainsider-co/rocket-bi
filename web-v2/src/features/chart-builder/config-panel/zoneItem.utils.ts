import { z } from 'zod';
import { functionInfoForFamily, SORTING_ZONE } from '@/core/chart-builder/chartCatalogue';
import { AggregationType, FunctionFamily, SortType, type FunctionData } from '@/core/chart-builder/FunctionData';

export const SORT_OPTIONS = [SortType.Unsorted, SortType.Ascending, SortType.Descending] as const;

/** Whether the item shows its family as a menu (v1 `DraggableItem.enableFuncFamily`): not for measures nor chart controls. */
export function showsFamily(item: FunctionData): boolean {
  return item.functionFamily !== '' && item.functionType !== AggregationType.Expression && item.functionFamily !== FunctionFamily.Dynamic;
}

export function showsType(item: FunctionData): boolean {
  return !!item.functionType;
}

/** The item after picking `family` (v1 `handleFunctionFamilyChanged`): the family's first type, not shown as a column. */
export function withFamily(item: FunctionData, family: string): FunctionData {
  const info = functionInfoForFamily(item.field, family);
  return { ...item, functionFamily: info.family, functionType: info.type, displayAsColumn: false };
}

/** "Top 10 value(s)" next to a sorted item that shows its top N. */
export function topNLabel(item: FunctionData): string | undefined {
  return item.isShowNElements && item.numElemsShown ? `Top ${item.numElemsShown} value(s)` : undefined;
}

/** Where the Config dialog offers sorting (v1 `ConfigModal.enableSorting`): the Sorting zone and aggregations. */
export function canSort(zone: string, family: string): boolean {
  return zone === SORTING_ZONE.key || family === FunctionFamily.Aggregation;
}

const TOP_N = /^\d+$/;

/** The Config dialog (v1 `ConfigModal`). The top N is checked only while it is shown and turned on. */
export const itemConfigSchema = z
  .object({
    name: z.string().trim().min(1, 'Field is required.'),
    family: z.string(),
    type: z.string(),
    sorting: z.string(),
    showTopN: z.boolean(),
    topN: z.string().trim()
  })
  .superRefine((values, context) => {
    if (values.sorting === SortType.Unsorted || !values.showTopN) return;
    if (values.topN === '') context.addIssue({ code: 'custom', path: ['topN'], message: 'Field is required.' });
    else if (!TOP_N.test(values.topN) || Number(values.topN) < 1) context.addIssue({ code: 'custom', path: ['topN'], message: 'Field must be positive.' });
  });

export type ItemConfig = z.infer<typeof itemConfigSchema>;

export function itemConfigOf(item: FunctionData): ItemConfig {
  return {
    name: item.name,
    family: item.functionFamily,
    type: item.functionType ?? '',
    sorting: item.sorting,
    showTopN: item.isShowNElements ?? false,
    topN: item.numElemsShown === null || item.numElemsShown === undefined ? '' : String(item.numElemsShown)
  };
}

/** The dialog's family picked: its first type, as the quick menu gives. */
export function configWithFamily(config: ItemConfig, item: FunctionData, family: string): ItemConfig {
  return { ...config, family, type: functionInfoForFamily(item.field, family).type };
}

/**
 * The item as the dialog saves it (v1 `ConfigDraggable.handleSaveConfig`). A top N in use is stored as a number; v1
 * stored the text typed, which it also read back.
 */
export function withItemConfig(item: FunctionData, config: ItemConfig): FunctionData {
  const usesTopN = config.showTopN && config.sorting !== SortType.Unsorted && TOP_N.test(config.topN);
  const familyChanged = config.family !== item.functionFamily;
  return {
    ...item,
    name: config.name.trim(),
    functionFamily: config.family,
    functionType: config.type,
    sorting: config.sorting,
    isShowNElements: config.showTopN,
    numElemsShown: usesTopN ? Number(config.topN) : item.numElemsShown,
    ...(familyChanged && { displayAsColumn: false })
  };
}
