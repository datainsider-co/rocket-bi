import { describe, expect, it } from 'vitest';
import { dashboardAntdTheme } from './dashboardAntdTheme';

describe('dashboardAntdTheme', () => {
  it.each([
    ['light_default', '#597fff'],
    ['light_theme1', '#e3a845'],
    ['light_theme2', '#a51adf'],
    ['light_theme3', '#1a86df'],
    ['light_theme4', '#222e38'],
    ['dark_theme1', '#597fff']
  ])("takes %s's accent as antd's primary color", (themeName, accent) => {
    const theme = dashboardAntdTheme(themeName);
    expect(theme.token?.colorPrimary).toBe(accent);
    expect(theme.components?.Input).toMatchObject({ hoverBorderColor: accent, activeBorderColor: accent });
  });

  it('falls back to the default accent for an unknown theme', () => {
    expect(dashboardAntdTheme('').token?.colorPrimary).toBe('#597fff');
  });

  it("reads the theme's hover colors from its CSS variables", () => {
    expect(dashboardAntdTheme('light_theme1').components?.Button).toMatchObject({
      colorPrimaryHover: 'var(--accent-hover-color)',
      defaultHoverBg: 'var(--hover-color)'
    });
  });
});
