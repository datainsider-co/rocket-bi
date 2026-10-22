import type { CSSProperties } from 'react';
import type { ThemeConfig } from 'antd';
import type { ThemeMode } from '@/app/theme/ThemeContext';

/** v1 `app-theme.scss` values used by the directory table (`DiTable` + `CustomTable`). */
export const V1_TABLE_COLORS = {
  /** `--directory-header-bg` */
  headerBg: '#fafafb',
  /** `--table-header-color`, also `--row-even-color` and `--icon-color` */
  secondaryText: '#5f6368',
  /** `--text-color`, the name column */
  text: '#4f4f4f',
  /** `--directory-row-bg`, also the panel behind the table and the empty state (`--secondary`) */
  rowBg: '#ffffff',
  /** `--directory-hover-color` */
  rowHoverBg: '#f9faff',
  /** `--directory-grid-line-color`, between rows */
  gridLine: '#0000000f'
} as const;

/**
 * antd Table tokens that make it look like v1's: 48px rows with 12px side padding, no header column splits, 4px
 * corners, and the sorted column not tinted. v1 has no dark directory theme, so the colors only apply in light mode
 * and dark mode keeps antd's.
 */
export function directoryTableTheme(mode: ThemeMode): ThemeConfig {
  const layout = {
    cellPaddingBlock: 12,
    cellPaddingInline: 12,
    cellFontSize: 14,
    headerBorderRadius: 4,
    headerSplitColor: 'transparent'
  };
  if (mode === 'dark') return { components: { Table: layout } };
  return {
    components: {
      Table: {
        ...layout,
        colorText: V1_TABLE_COLORS.secondaryText,
        headerBg: V1_TABLE_COLORS.headerBg,
        headerColor: V1_TABLE_COLORS.secondaryText,
        headerSortActiveBg: V1_TABLE_COLORS.headerBg,
        headerSortHoverBg: V1_TABLE_COLORS.headerBg,
        bodySortBg: V1_TABLE_COLORS.rowBg,
        rowHoverBg: V1_TABLE_COLORS.rowHoverBg,
        borderColor: V1_TABLE_COLORS.gridLine
      }
    }
  };
}

/**
 * Colors the table tokens can't reach, read as CSS variables by the cells and the panel behind the table. Unset in
 * dark mode, where they fall back to inherited text and a transparent panel.
 */
export function directoryTableVars(mode: ThemeMode): CSSProperties {
  if (mode === 'dark') return {};
  return {
    '--directory-name-color': V1_TABLE_COLORS.text,
    '--directory-panel-bg': V1_TABLE_COLORS.rowBg
  } as CSSProperties;
}
