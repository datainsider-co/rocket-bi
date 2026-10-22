import { describe, expect, it } from 'vitest';
import { V1_TABLE_COLORS, directoryTableTheme, directoryTableVars } from './directoryTable.theme';

describe('directoryTableTheme', () => {
  it('uses v1 colors in light mode', () => {
    expect(directoryTableTheme('light').components?.Table).toMatchObject({
      headerBg: V1_TABLE_COLORS.headerBg,
      headerColor: V1_TABLE_COLORS.secondaryText,
      rowHoverBg: V1_TABLE_COLORS.rowHoverBg,
      borderColor: V1_TABLE_COLORS.gridLine,
      bodySortBg: V1_TABLE_COLORS.rowBg,
      headerSplitColor: 'transparent',
      cellPaddingBlock: 12
    });
  });

  it('keeps antd colors in dark mode but the same layout', () => {
    const table = directoryTableTheme('dark').components?.Table;
    expect(table).toMatchObject({ cellPaddingBlock: 12, cellPaddingInline: 12, headerSplitColor: 'transparent' });
    expect(table).not.toHaveProperty('headerBg');
    expect(table).not.toHaveProperty('colorText');
  });
});

describe('directoryTableVars', () => {
  it('sets the name color in light mode', () => {
    expect(directoryTableVars('light')).toEqual({ '--directory-name-color': V1_TABLE_COLORS.text });
  });

  it('sets nothing in dark mode', () => {
    expect(directoryTableVars('dark')).toEqual({});
  });
});
