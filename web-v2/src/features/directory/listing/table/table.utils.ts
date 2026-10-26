/** v1 `CustomTable` header row height (`--header-cell-height`), also set on the header cells. */
export const HEADER_HEIGHT = 48;

/**
 * `scroll.y` for a table that fills a box `boxHeight` high: the body gets what the header leaves. `undefined` (no
 * inner scroll) until the box has been measured or when it is too short to hold a row.
 */
export function bodyScrollHeight(boxHeight: number, headerHeight: number = HEADER_HEIGHT): number | undefined {
  const body = Math.floor(boxHeight - headerHeight);
  return body > 0 ? body : undefined;
}
