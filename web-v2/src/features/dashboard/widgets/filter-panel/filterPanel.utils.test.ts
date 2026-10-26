import { describe, expect, it } from 'vitest';
import { filterPanelLook } from './filterPanel.utils';

describe('filterPanelLook', () => {
  it('reads the stored header and footer', () => {
    const look = filterPanelLook({
      extra_data: {
        header: { font_family: 'Inter', color: 'red', font_size: '16px' },
        footer: { align: 'center', apply: { title: 'Go', font_family: 'Inter', font_size: '12px', color: '#fff', background: '#000' } }
      }
    });
    expect(look).toEqual({
      header: { fontFamily: 'Inter', color: 'red', fontSize: '16px' },
      align: 'center',
      applyTitle: 'Go',
      apply: { fontFamily: 'Inter', fontSize: '12px', color: '#fff', background: '#000' }
    });
  });

  it('falls back to v1 defaults', () => {
    const look = filterPanelLook({ extra_data: { footer: { align: 'sideways' } } });
    expect(look.align).toBe('flex-end');
    expect(look.applyTitle).toBe('Apply');
    expect(look.apply.background).toBe('var(--accent)');
    expect(filterPanelLook({}).header).toEqual({ fontFamily: 'Roboto', color: 'var(--text-color)', fontSize: '14px' });
  });
});
