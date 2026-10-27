import type { ChartTypeInfo, ZoneConfig } from './chartCatalogue';
import type { FunctionData } from './FunctionData';

type Configs = Readonly<Record<string, readonly FunctionData[]>>;

const SORTING = 'sorting';

/** The items of `items` whose family the zone takes, at most `limit` of them. */
function pick(items: readonly FunctionData[], zone: ZoneConfig, limit: number): FunctionData[] {
  const families: readonly string[] = zone.families;
  return items.filter(item => families.includes(item.functionFamily)).slice(0, Math.max(limit, 0));
}

/**
 * The zones of a chart type filled from another type's zones (v1 `ChartConfigUtils.convertToNewConfig`). Each zone
 * first takes the items of the zone with the same key, else the first items of any zone whose family it takes, up to
 * its max; an item goes to one zone only. Sorting is kept as it is. Items keep their function: a sum moved into a
 * table's columns stays a sum.
 *
 * v1 counted the max wrong when it took items from several zones (it subtracted the running total once per zone) and
 * could fill a zone short; here the max counts every item taken.
 */
export function suggestConfigs(info: ChartTypeInfo, previous: Configs): Record<string, FunctionData[]> {
  const left = new Map(Object.entries(previous).filter(([key]) => key !== SORTING));
  const take = (key: string, taken: readonly FunctionData[]) => {
    const remaining = (left.get(key) ?? []).filter(item => !taken.includes(item));
    if (remaining.length > 0) left.set(key, remaining);
    else left.delete(key);
  };

  const zones = info.zones.map((zone): [string, FunctionData[]] => {
    const limit = zone.maxItems ?? Number.MAX_SAFE_INTEGER;
    const sameKey = pick(left.get(zone.key) ?? [], zone, limit);
    if (sameKey.length > 0) {
      take(zone.key, sameKey);
      return [zone.key, sameKey];
    }
    const suggested: FunctionData[] = [];
    for (const [key, items] of [...left]) {
      const taken = pick(items, zone, limit - suggested.length);
      take(key, taken);
      suggested.push(...taken);
      if (suggested.length >= limit) break;
    }
    return [zone.key, suggested];
  });
  return Object.fromEntries([...zones, [SORTING, [...(previous[SORTING] ?? [])]]]);
}
