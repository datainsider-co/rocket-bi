import { describe, expect, it } from 'vitest';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import { DashboardSetting } from '@/core/dashboard/DashboardSetting';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import {
  autoRefreshOf,
  mainDateModeOf,
  numberAt,
  settingDraft,
  stringAt,
  withAutoRefresh,
  withMainDate,
  withPath,
  withRadius,
  withTheme
} from './dashboardSettings.utils';

const dashboard = dashboardFromJson({ ...fixture, setting: { theme_name: 'light_theme1', unknown_key: { a: 1 }, main_date_filter: { id: -99887766, mode: 'last_7_days' } } });

describe('settingDraft', () => {
  it('fills every modelled field and keeps the unknown ones', () => {
    const draft = settingDraft(dashboard);
    expect(draft).toMatchObject({
      theme_name: 'light_theme1',
      unknown_key: { a: 1 },
      enable_overlap: false,
      border: { width: 1, radius: { top_left: 20 } },
      size: { width: 100, width_unit: '%' },
      widget_setting: { padding: 15, primary_text: { font_size: '20px' } },
      main_date_filter: { id: -99887766, mode: 'last_7_days' }
    });
  });

  it('reads back as the same setting', () => {
    expect(new DashboardSetting(settingDraft(dashboard)).toJson()).toEqual(dashboard.setting.toJson());
  });

  it('has no main date filter when there is none', () => {
    expect(settingDraft(dashboardFromJson({ ...fixture, setting: {} }))).not.toHaveProperty('main_date_filter');
  });
});

describe('paths', () => {
  it('sets a value without touching the input', () => {
    const json = { a: { b: 1, c: 2 } };
    expect(withPath(json, ['a', 'b'], 5)).toEqual({ a: { b: 5, c: 2 } });
    expect(withPath(json, ['x', 'y'], 1)).toEqual({ a: { b: 1, c: 2 }, x: { y: 1 } });
    expect(withPath(json, [], 1)).toBe(json);
    expect(json).toEqual({ a: { b: 1, c: 2 } });
  });

  it('reads numbers and strings with fallbacks', () => {
    expect(numberAt({ a: 3 }, ['a'], 0)).toBe(3);
    expect(numberAt({ a: '3' }, ['a'], 0)).toBe(0);
    expect(stringAt({ a: 'x' }, ['a'], '')).toBe('x');
    expect(stringAt({}, ['a'], 'y')).toBe('y');
  });

  it('sets the four corners at once', () => {
    expect(withRadius({}, ['border', 'radius'], 8)).toEqual({ border: { radius: { top_left: 8, top_right: 8, bottom_left: 8, bottom_right: 8 } } });
  });
});

describe('withTheme', () => {
  it("applies the theme's border and background (v1 defaultSettings)", () => {
    const dark = withTheme({ unknown: 1 }, 'dark_theme2');
    expect(dark).toMatchObject({
      unknown: 1,
      theme_name: 'dark_theme2',
      enable_overlap: true,
      border: { width: 1, color: '#000', color_opacity: 10, position: 'inside', radius: { bottom_right: 20 } },
      background: { color: '#000', opacity: 10 }
    });
    expect(withTheme({}, 'light_theme3')).toMatchObject({ border: { color: '#f2f2f7', color_opacity: 100 }, background: { color: '#fafafb' } });
  });
});

describe('auto refresh', () => {
  it('turns on with an interval and off keeping it', () => {
    const on = withAutoRefresh({}, 30_000);
    expect(on).toEqual({ auto_refresh_setting: { is_auto_refresh: true, refresh_interval_ms: 30_000 } });
    expect(autoRefreshOf(on)).toBe(30_000);
    const off = withAutoRefresh(on, 0);
    expect(off).toEqual({ auto_refresh_setting: { is_auto_refresh: false, refresh_interval_ms: 30_000 } });
    expect(autoRefreshOf(off)).toBe(0);
  });
});

describe('main date', () => {
  it('sets up and removes the filter in the header', () => {
    const withDate = withMainDate({ theme_name: 'x' }, 'this_month');
    expect(withDate).toEqual({ theme_name: 'x', main_date_filter: { id: -99887766, mode: 'this_month' } });
    expect(mainDateModeOf(withDate)).toBe('this_month');
    expect(withMainDate(withDate, undefined)).toEqual({ theme_name: 'x' });
    expect(mainDateModeOf({})).toBeUndefined();
  });
});
