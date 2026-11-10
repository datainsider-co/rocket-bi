import type { ThemeConfig } from 'antd';
import { getDashboardTheme } from './dashboardThemes';

/**
 * antd's theme on the dashboard page, over the app's (`app/theme/appTheme.ts`): the dashboard theme's accent instead
 * of the brand blue, and v1's control looks (`themes/scss/_button.scss`, `DiDropdown.scss`, `DiTab.vue`, `DiSlider.vue`,
 * `DiToggle.vue`). Colors that follow the theme are its CSS variables (`dashboardTheme.css`), which resolve wherever
 * the component renders inside the page; only the accent is a hex, as antd derives a palette from it.
 */
export function dashboardAntdTheme(themeName: string): ThemeConfig {
  const { accent } = getDashboardTheme(themeName);
  return {
    token: {
      colorPrimary: accent,
      controlHeightLG: 40,
      controlPaddingHorizontal: 16,
      colorBgElevated: 'var(--menu-background-color)',
      controlItemBgHover: 'var(--hover-color)'
    },
    components: {
      Button: {
        colorPrimaryHover: 'var(--accent-hover-color)',
        colorPrimaryActive: 'var(--accent-active-color)',
        defaultBg: 'transparent',
        defaultColor: 'var(--secondary-text-color)',
        defaultHoverBg: 'var(--hover-color)',
        defaultHoverColor: 'var(--text-color)',
        defaultHoverBorderColor: '#d6d6d6',
        defaultActiveBg: 'var(--hover-color)',
        defaultActiveColor: 'var(--text-color)',
        defaultActiveBorderColor: '#d6d6d6',
        textHoverBg: 'var(--hover-color)'
      },
      Input: { hoverBorderColor: accent, activeBorderColor: accent },
      Select: { optionSelectedBg: 'var(--active-color)', optionActiveBg: 'var(--active-color)', optionPadding: '8px' },
      Dropdown: { paddingBlock: 12 },
      Tabs: { titleFontSize: 16, horizontalItemGutter: 32, itemHoverColor: accent, itemActiveColor: accent },
      Slider: { railSize: 6, handleSize: 14, handleSizeHover: 14, handleLineWidth: 2, handleLineWidthHover: 2, railBg: '#d8d8d8', railHoverBg: '#d8d8d8' },
      // The off track; as a page token it would also grey every placeholder and disabled text.
      Switch: { colorTextQuaternary: '#ccc', handleSizeSM: 10, trackHeightSM: 16, trackMinWidthSM: 27 }
    }
  };
}
