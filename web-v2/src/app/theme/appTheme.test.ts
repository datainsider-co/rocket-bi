import { describe, expect, it } from 'vitest';
import { theme } from 'antd';
import { appTheme } from './appTheme';

describe('appTheme', () => {
  it('uses v1 colors and light tooltips in light mode', () => {
    const light = appTheme('light');
    expect(light.algorithm).toBe(theme.defaultAlgorithm);
    expect(light.token).toMatchObject({ colorPrimary: '#0066ff', borderRadius: 4, colorText: '#4f4f4f', colorBorder: '#d6d6d6' });
    expect(light.components?.Tooltip).toEqual({ colorBgSpotlight: '#fff', colorTextLightSolid: '#4f4f4f' });
  });

  it('keeps the shapes but not the light colors in dark mode', () => {
    const dark = appTheme('dark');
    expect(dark.algorithm).toBe(theme.darkAlgorithm);
    expect(dark.token).toMatchObject({ colorPrimary: '#0066ff', borderRadius: 4 });
    expect(dark.token).not.toHaveProperty('colorText');
    expect(dark.token).not.toHaveProperty('colorBorder');
    expect(dark.components?.Tooltip).toBeUndefined();
    expect(dark.components?.Button).toMatchObject({ fontWeight: 500, primaryShadow: 'none' });
  });
});
