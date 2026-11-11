import { describe, expect, it } from 'vitest';
import { colorText, isHexColor } from './colorSetting.utils';

describe('isHexColor', () => {
  it.each(['#fff', '#FFFF', '#4f4f4f', '#4F4F4F80', ' #abc '])('accepts %s', text => {
    expect(isHexColor(text)).toBe(true);
  });

  it.each(['', 'fff', '#ff', '#fffff', '#ggg', 'Theme', 'var(--text-color)', 'red', '#4f4f4f8'])('rejects "%s"', text => {
    expect(isHexColor(text)).toBe(false);
  });
});

describe('colorText', () => {
  it('shows a hex as is', () => {
    expect(colorText('#4f4f4f')).toBe('#4f4f4f');
  });

  it('shows Theme for a theme variable', () => {
    expect(colorText('var(--text-color)')).toBe('Theme');
  });
});
