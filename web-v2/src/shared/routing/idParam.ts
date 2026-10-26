/** URL segments of the form `<slug>-<id>` (v1 `RouterUtils.buildParamPath` / `parseToParamInfo`). */

/** Lower-case ASCII words joined by `-`, Vietnamese accents removed: `Báo cáo Q1` → `bao-cao-q1`. */
export function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** URL segment for an item, `<slug>-<id>`, read back by `parseIdParam`. Same shape as v1's `buildParamPath`. */
export function toIdParam(id: number, name: string): string {
  return `${toSlug(name)}-${id}`;
}

/** The id at the end of a `<slug>-<id>` segment, or a bare id. `undefined` when there is no valid id. */
export function parseIdParam(param: string | undefined): number | undefined {
  if (!param) return undefined;
  const raw = param.slice(param.lastIndexOf('-') + 1);
  if (!/^\d+$/.test(raw)) return undefined;
  return Number(raw);
}

export function dashboardPath(dashboardId: number, name: string): string {
  return `/dashboard/${toIdParam(dashboardId, name)}`;
}
