import { theme, type ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

type Tokens = NonNullable<ThemeConfig['token']>;
type Components = NonNullable<ThemeConfig['components']>;

/** v1 brand: `--accent-2` and the Roboto font from `web/src/themes`. */
const BRAND_TOKEN: Tokens = {
  colorPrimary: '#0066ff',
  fontFamily: "Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
};

/** Shapes v1 uses on every page (`themes/scss/_button.scss`, `custom-boostrap-class.scss`): 4px corners, flat controls. */
const SHAPE_TOKEN: Tokens = {
  borderRadius: 4,
  borderRadiusLG: 4,
  borderRadiusSM: 2,
  colorBgMask: 'rgba(19, 19, 23, 0.7)',
  boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
  boxShadowSecondary: '0 4px 4px 0 rgba(0, 0, 0, 0.08)'
};

const SHAPE_COMPONENTS: Components = {
  Button: { fontWeight: 500, primaryShadow: 'none', defaultShadow: 'none', dangerShadow: 'none' },
  Input: { activeShadow: 'none' },
  Select: { activeOutlineColor: 'transparent', optionSelectedFontWeight: 400 },
  Modal: { titleFontSize: 24, titleLineHeight: 1.4 }
};

/** v1's light colors (`themes/app-theme.scss`); the dark mode keeps what antd's dark algorithm derives. */
const LIGHT_TOKEN: Tokens = {
  colorBorder: '#d6d6d6',
  colorSplit: '#f0f0f0',
  colorBorderSecondary: '#f0f0f0',
  colorText: '#4f4f4f',
  colorTextSecondary: '#5f6368'
};

/** v1 tooltips are light (`themes/scss/custom-variables.scss`). */
const LIGHT_COMPONENTS: Components = {
  Tooltip: { colorBgSpotlight: '#fff', colorTextLightSolid: '#4f4f4f' }
};

/** The antd theme of the whole app. The dashboard page adds its own on top (`features/dashboard/theme`). */
export function appTheme(mode: ThemeMode): ThemeConfig {
  const light = mode === 'light';
  return {
    algorithm: light ? theme.defaultAlgorithm : theme.darkAlgorithm,
    token: { ...BRAND_TOKEN, ...SHAPE_TOKEN, ...(light ? LIGHT_TOKEN : {}) },
    components: { ...SHAPE_COMPONENTS, ...(light ? LIGHT_COMPONENTS : {}) }
  };
}
