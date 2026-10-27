import { describe, expect, it } from 'vitest';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import { DashboardSetting } from '@/core/dashboard/DashboardSetting';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import {
  AUTO_REFRESH_OPTIONS,
  autoRefreshOf,
  booleanAt,
  DARK_THEMES,
  errorMessage,
  LIGHT_THEMES,
  numberAt,
  settingDraft,
  sharedRadius,
  stringAt,
  toPixels,
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

  it('reads booleans, anything but true being false', () => {
    expect(booleanAt({ a: { b: true } }, ['a', 'b'])).toBe(true);
    expect(booleanAt({ a: 'true' }, ['a'])).toBe(false);
    expect(booleanAt({}, ['a'])).toBe(false);
  });

  it('sets the four corners at once', () => {
    expect(withRadius({}, ['border', 'radius'], 8)).toEqual({ border: { radius: { top_left: 8, top_right: 8, bottom_left: 8, bottom_right: 8 } } });
  });
});

describe('sharedRadius', () => {
  const path = ['border', 'radius'];

  it('is the radius of every corner when they agree', () => {
    expect(sharedRadius(withRadius({}, path, 8), path, 20)).toBe(8);
  });

  it('is undefined when the corners differ (Mixed)', () => {
    expect(sharedRadius({ border: { radius: { top_left: 8, top_right: 8, bottom_left: 8, bottom_right: 0 } } }, path, 20)).toBeUndefined();
  });

  it('counts missing corners as the fallback', () => {
    expect(sharedRadius({}, path, 20)).toBe(20);
    expect(sharedRadius({ border: { radius: { top_left: 20 } } }, path, 20)).toBe(20);
    expect(sharedRadius({ border: { radius: { top_left: 4 } } }, path, 20)).toBeUndefined();
  });
});

describe('toPixels', () => {
  it.each([
    ['12', 12],
    [' 7 ', 7],
    ['0', 0],
    ['2.5', 2.5],
    ['', 0],
    ['abc', 0],
    ['-3', 0],
    ['Mixed', 0]
  ])('reads %j as %d', (text, pixels) => {
    expect(toPixels(text)).toBe(pixels);
  });
});

describe('themes', () => {
  it('lists the five light themes, then the five dark ones, with their v1 names', () => {
    expect(LIGHT_THEMES.map(theme => theme.label)).toEqual(['Dodger Blue', 'Anzac', 'Electric Violet', 'Curious Blue', 'Ebony Clay']);
    expect(DARK_THEMES.map(theme => theme.value)).toEqual(['dark_default', 'dark_theme1', 'dark_theme2', 'dark_theme3', 'dark_theme4']);
  });
});

describe('withTheme', () => {
  it('leaves overlap to the dialog\'s own toggle (v1 saved it over the theme\'s)', () => {
    expect(withTheme({ enable_overlap: false }, 'dark_theme1')).toMatchObject({ enable_overlap: false });
    expect(withTheme({}, 'light_theme1')).not.toHaveProperty('enable_overlap');
  });

  it("applies the theme's border and background (v1 defaultSettings)", () => {
    const dark = withTheme({ unknown: 1 }, 'dark_theme2');
    expect(dark).toMatchObject({
      unknown: 1,
      theme_name: 'dark_theme2',
      border: { width: 1, color: '#000', color_opacity: 10, position: 'inside', radius: { bottom_right: 20 } },
      background: { color: '#000', opacity: 10 }
    });
    expect(withTheme({}, 'light_theme3')).toMatchObject({ border: { color: '#f2f2f7', color_opacity: 100 }, background: { color: '#fafafb' } });
  });
});

describe('auto refresh', () => {
  it("offers v1's intervals in v1's order, Off last", () => {
    expect(AUTO_REFRESH_OPTIONS.map(option => option.value)).toEqual([15_000, 30_000, 60_000, 180_000, 300_000, 0]);
  });

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
    expect(withMainDate(withDate, undefined)).toEqual({ theme_name: 'x' });
    expect(withMainDate({}, undefined)).toEqual({});
  });

  it('replaces the mode of an existing filter', () => {
    expect(withMainDate({ main_date_filter: { id: -99887766, mode: 'all_time' } }, 'last_year')).toEqual({ main_date_filter: { id: -99887766, mode: 'last_year' } });
  });

  it('puts the all time filter of a dashboard saved without a setting into the draft', () => {
    expect(settingDraft(dashboardFromJson(fixture))).toMatchObject({ main_date_filter: { id: -99887766, mode: 'all_time' } });
  });
});

describe('errorMessage', () => {
  it("shows the error's message, else a generic one", () => {
    expect(errorMessage(new Error('Dashboard not found'))).toBe('Dashboard not found');
    expect(errorMessage(new Error(''))).toBe('Cannot save the setting, please try again.');
    expect(errorMessage('boom')).toBe('Cannot save the setting, please try again.');
  });
});
