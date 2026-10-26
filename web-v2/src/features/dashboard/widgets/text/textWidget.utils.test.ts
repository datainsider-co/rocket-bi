import { describe, expect, it } from 'vitest';
import { widgetFromJson, type TextWidget } from '@/core/dashboard/Widget';
import { sanitizeHtml, textRenderStyle } from './textWidget.utils';

const text = (styleSettings?: Record<string, unknown>) =>
  widgetFromJson({ class_name: 'text_widget', id: 1, content: '', extra_data: { style_settings: styleSettings } }) as TextWidget;

describe('textRenderStyle', () => {
  it('falls back to v1 defaults', () => {
    expect(textRenderStyle(text())).toEqual({
      color: 'var(--text-color)',
      fontSize: '13px',
      textAlign: 'left',
      fontFamily: 'Roboto',
      opacity: 1,
      fontWeight: undefined,
      fontStyle: undefined,
      textDecoration: undefined
    });
  });

  it('reads the stored style settings', () => {
    expect(textRenderStyle(text({ font_color: '#111', font_size: '24px', text_align: 'center', opacity: 50, is_bold: true }))).toMatchObject({
      color: '#111',
      fontSize: '24px',
      textAlign: 'center',
      opacity: 0.5,
      fontWeight: 'bold'
    });
  });
});

describe('sanitizeHtml', () => {
  it('keeps formatting and drops scripts', () => {
    expect(sanitizeHtml('<b>Hi</b><img src=x onerror="alert(1)"><script>alert(2)</script>')).toBe('<b>Hi</b><img src="x">');
  });
});
