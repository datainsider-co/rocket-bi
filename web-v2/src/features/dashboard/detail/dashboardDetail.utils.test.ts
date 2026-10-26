import { describe, expect, it } from 'vitest';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import { DashboardSetting, RadiusInfo } from '@/core/dashboard/DashboardSetting';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import { ApiError } from '@/shared/http/ApiError';
import {
  dashboardCssVars,
  dashboardErrorMessage,
  isNotFoundError,
  radiusCss,
  tabPositions,
  topLevelPositions,
  withAlpha
} from './dashboardDetail.utils';

describe('withAlpha', () => {
  it('keeps opaque colors as they are', () => {
    expect(withAlpha('#FAFAFB', 100)).toBe('#FAFAFB');
  });

  it('mixes any CSS color with transparent', () => {
    expect(withAlpha('var(--accent)', 40)).toBe('color-mix(in srgb, var(--accent) 40%, transparent)');
  });
});

describe('radiusCss', () => {
  it('collapses equal corners', () => {
    expect(radiusCss(new RadiusInfo())).toBe('20px');
    expect(radiusCss(new RadiusInfo({ top_left: 0, top_right: 0, bottom_right: 0, bottom_left: 0 }))).toBe('0');
  });

  it('lists mixed corners clockwise from top left', () => {
    expect(radiusCss(new RadiusInfo({ top_left: 1, top_right: 2, bottom_right: 3, bottom_left: 4 }))).toBe('1px 2px 3px 4px');
  });
});

describe('dashboardCssVars', () => {
  it('maps the default setting', () => {
    expect(dashboardCssVars(new DashboardSetting())).toEqual({
      '--dashboard-background-color': '#FAFAFB',
      '--dashboard-background-image': 'none',
      '--dashboard-background-filter': 'brightness(100%) contrast(100%) grayscale(0%) opacity(100%)',
      '--dashboard-border-radius': '20px',
      '--dashboard-content-width': '100%',
      '--dashboard-stroke-width': '1px',
      '--dashboard-stroke-color': '#f2f2f7'
    });
  });

  it('quotes the background image and uses fixed widths', () => {
    const vars = dashboardCssVars(
      new DashboardSetting({ background_image: { path: '/a b.png' }, size: { width: 1200, width_unit: 'px' } })
    ) as Record<string, string>;
    expect(vars['--dashboard-background-image']).toBe('url("/a b.png")');
    expect(vars['--dashboard-content-width']).toBe('1200px');
  });
});

describe('positions per grid', () => {
  const dashboard = dashboardFromJson(fixture);

  it('leaves tab children out of the dashboard grid', () => {
    expect(Object.keys(topLevelPositions(dashboard)).map(Number).sort((a, b) => a - b)).toEqual([3, 4, 6, 7, 8, 10, 12]);
  });

  it('gives a tab its own widgets', () => {
    expect(tabPositions(dashboard, { name: 'Pie', widgetIds: [11, 99], options: {} })).toEqual({
      11: { row: 0, column: 0, width: 48, height: 10, zIndex: 0 }
    });
  });
});

describe('errors', () => {
  it('tells not found apart', () => {
    expect(isNotFoundError(new ApiError('no dashboard', 404, 'not_found'))).toBe(true);
    expect(isNotFoundError(new Error('x'))).toBe(false);
  });

  it('uses v1 messages', () => {
    expect(dashboardErrorMessage(new ApiError('nope', 401, 'not_allowed'))).toBe("You don't have permission to view dashboard");
    expect(dashboardErrorMessage(new ApiError('gone', 404, 'not_found'))).toBe('Dashboard not found');
    expect(dashboardErrorMessage(new Error('x'))).toBe('Load dashboard error!');
  });
});
