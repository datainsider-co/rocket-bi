/** v1's diagram panel zoomed in steps of 20 percentage points and not below 10%. */
export const ZOOM_STEP = 0.2;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;

/** The zoom one step in or out, or `undefined` when that step would leave the allowed range (v1 ignored it). */
export function steppedZoom(zoom: number, direction: 1 | -1): number | undefined {
  const next = Math.round((zoom + direction * ZOOM_STEP) * 100) / 100;
  return next < MIN_ZOOM || next > MAX_ZOOM ? undefined : next;
}

/** v1 showed the zoom rounded up to a whole percent. */
export function zoomLabel(zoom: number): string {
  return `${Math.ceil(Math.round(zoom * 10000) / 100)}%`;
}
