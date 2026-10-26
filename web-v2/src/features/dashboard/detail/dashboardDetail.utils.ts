import type { CSSProperties } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { BorderInfo, DashboardSetting, RadiusInfo } from '@/core/dashboard/DashboardSetting';
import { SizeUnit } from '@/core/dashboard/DashboardSetting';
import type { Position, WidgetId } from '@/core/dashboard/Position';
import { nestedWidgetIds, type TabItem } from '@/core/dashboard/Widget';
import { isApiError } from '@/shared/http/ApiError';

/**
 * `color` at `opacity` percent. v1 rewrote hex colors to `#rrggbbaa` and gave up on anything else; `color-mix` does the
 * same for every CSS color, `var(...)` included.
 */
export function withAlpha(color: string, opacity: number): string {
  if (opacity >= 100) return color;
  return `color-mix(in srgb, ${color} ${Math.max(0, opacity)}%, transparent)`;
}

export function radiusCss({ topLeft, topRight, bottomRight, bottomLeft }: RadiusInfo): string {
  if (topLeft === topRight && topLeft === bottomRight && topLeft === bottomLeft) {
    return topLeft === 0 ? '0' : `${topLeft}px`;
  }
  return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
}

export function borderColorCss(border: BorderInfo): string {
  return withAlpha(border.color, border.colorOpacity);
}

function sizeCss(size: number, unit: string): string {
  return unit === SizeUnit.Auto ? 'auto' : `${size}${unit}`;
}

/** The variables `DashboardPage.css` reads (v1 `DashboardDetail.dashboardCssStyle`). */
export function dashboardCssVars(setting: DashboardSetting): CSSProperties {
  const { background, backgroundImage: image, border, size } = setting;
  return {
    '--dashboard-background-color': withAlpha(background.color, background.opacity),
    '--dashboard-background-image': image.path ? `url(${JSON.stringify(image.path)})` : 'none',
    '--dashboard-background-filter': `brightness(${image.brightness}%) contrast(${image.contrast}%) grayscale(${image.grayscale}%) opacity(${image.opacity}%)`,
    '--dashboard-border-radius': radiusCss(border.radius),
    '--dashboard-content-width': sizeCss(size.width, size.widthUnit),
    '--dashboard-stroke-width': `${border.width}px`,
    '--dashboard-stroke-color': borderColorCss(border)
  } as CSSProperties;
}

/** Positions of the widgets placed directly on the dashboard, not inside a tab or filter panel. */
export function topLevelPositions(dashboard: Dashboard): Record<WidgetId, Position> {
  const nested = nestedWidgetIds(dashboard.widgets);
  return Object.fromEntries(Object.entries(dashboard.positions).filter(([id]) => !nested.has(Number(id))));
}

/** Positions of one tab's widgets, in the tab's own grid. Widgets without a stored position are left out. */
export function tabPositions(dashboard: Dashboard, tab: TabItem): Record<WidgetId, Position> {
  const positions: Record<WidgetId, Position> = {};
  for (const id of tab.widgetIds) {
    const position = dashboard.positions[id];
    if (position) positions[id] = position;
  }
  return positions;
}

export function isNotFoundError(error: unknown): boolean {
  return isApiError(error) && (error.status === 404 || error.reason === 'not_found');
}

/** v1 `DashboardStore.handleError` messages. */
export function dashboardErrorMessage(error: unknown): string {
  if (isApiError(error) && (error.reason === 'not_allowed' || error.status === 403)) {
    return "You don't have permission to view dashboard";
  }
  if (isNotFoundError(error)) return 'Dashboard not found';
  return 'Load dashboard error!';
}
