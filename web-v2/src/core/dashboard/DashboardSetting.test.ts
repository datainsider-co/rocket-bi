import { describe, expect, it } from 'vitest';
import { DashboardSetting, MainDateFilterSetting } from './DashboardSetting';

/** As v1 stores it (from the server's DashboardControllerTest template). */
const STORED = {
  version: '1',
  enable_overlap: true,
  theme_name: 'dark_theme1',
  main_date_filter: { id: -99887766, mode: 'last_30_days' },
  border: {
    width: 2,
    color: '#000000',
    color_opacity: 50,
    radius: { top_left: 1, top_right: 2, bottom_right: 3, bottom_left: 4 },
    position: 'inside'
  },
  size: { width: 1200, height: 0, width_unit: 'px', height_unit: 'auto' },
  background_image: {
    image_name: 'bg.png',
    path: '/static/bg.png',
    fit_mode: 'fill',
    brightness: 90,
    contrast: 80,
    grayscale: 10,
    opacity: 70
  },
  background: { color: '#FAFAFB', opacity: 100 },
  widget_setting: {
    primary_text: {
      font_family: 'Roboto',
      font_size: '18px',
      font_weight: '600',
      text_align: 'left',
      color: '#111111',
      color_opacity: 100,
      is_bold: true,
      is_italic: false,
      is_underline: true
    },
    secondary_text: {
      font_family: 'Inter',
      font_size: '12px',
      font_weight: 'normal',
      text_align: 'center',
      color: '#222222',
      color_opacity: 80,
      is_bold: false,
      is_italic: true,
      is_underline: false
    },
    padding: 8,
    border: { width: 0, color: '#f2f2f7', color_opacity: 100, radius: { top_left: 20, top_right: 20, bottom_right: 20, bottom_left: 20 }, position: 'outside' },
    background: { color: '#FFFFFF', opacity: 90 }
  },
  auto_refresh_setting: { is_auto_refresh: true, refresh_interval_ms: 30000 }
};

describe('DashboardSetting', () => {
  it('uses v1 defaults when the server sends no setting', () => {
    const setting = new DashboardSetting(undefined);
    expect(setting.enableOverlap).toBe(false);
    expect(setting.themeName).toBe('light_default');
    expect(setting.mainDateFilter).toBeUndefined();
    expect(setting.border).toMatchObject({ width: 1, color: '#f2f2f7', colorOpacity: 100 });
    expect(setting.border.radius).toMatchObject({ topLeft: 20, topRight: 20, bottomRight: 20, bottomLeft: 20 });
    expect(setting.size).toMatchObject({ width: 100, widthUnit: '%', heightUnit: 'auto' });
    expect(setting.background).toMatchObject({ color: '#FAFAFB', opacity: 100 });
    expect(setting.backgroundImage).toMatchObject({ path: '', fitMode: 'repeat' });
    expect(setting.autoRefreshSetting.isAutoRefresh).toBe(false);
  });

  it('gives widget defaults their own values', () => {
    const { widgetSetting } = new DashboardSetting({});
    expect(widgetSetting.padding).toBe(15);
    expect(widgetSetting.border.width).toBe(0);
    expect(widgetSetting.background.color).toBe('#FFFFFF');
    expect(widgetSetting.primaryText).toMatchObject({ fontSize: '20px', fontWeight: '500', color: '#4f4f4f' });
    expect(widgetSetting.secondaryText).toMatchObject({ fontSize: '14px', fontWeight: 'normal', color: '#5f6368' });
  });

  it('reads every stored field', () => {
    const setting = new DashboardSetting(STORED);
    expect(setting.enableOverlap).toBe(true);
    expect(setting.themeName).toBe('dark_theme1');
    expect(setting.mainDateFilter).toMatchObject({ id: MainDateFilterSetting.ID, mode: 'last_30_days' });
    expect(setting.border.radius).toMatchObject({ topLeft: 1, topRight: 2, bottomRight: 3, bottomLeft: 4 });
    expect(setting.size).toMatchObject({ width: 1200, widthUnit: 'px' });
    expect(setting.backgroundImage).toMatchObject({ path: '/static/bg.png', fitMode: 'fill', grayscale: 10 });
    expect(setting.widgetSetting.padding).toBe(8);
    expect(setting.widgetSetting.primaryText).toMatchObject({ fontSize: '18px', isBold: true, isUnderline: true });
    expect(setting.widgetSetting.secondaryText).toMatchObject({ fontFamily: 'Inter', colorOpacity: 80, isItalic: true });
    expect(setting.autoRefreshSetting).toMatchObject({ isAutoRefresh: true, refreshIntervalMs: 30000 });
  });

  it('writes back what it read', () => {
    expect(new DashboardSetting(STORED).toJson()).toEqual(STORED);
  });
});
