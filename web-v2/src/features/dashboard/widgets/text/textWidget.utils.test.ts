import { describe, expect, it } from 'vitest';
import { widgetFromJson, type TextWidget } from '@/core/dashboard/Widget';
import { sanitizeHtml, textRenderStyle } from './textWidget.utils';

const text = (styleSettings?: Record<string, unknown>) =>
  widgetFromJson({ class_name: 'text_widget', id: 1, content: '', extra_data: { style_settings: styleSettings } }) as TextWidget;

describe('textRenderStyle', () => {
  it("falls back to v1's getter defaults for settings that are missing", () => {
    expect(textRenderStyle(text({}))).toEqual({
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

  it("uses v1's default style settings for a widget saved without any", () => {
    expect(textRenderStyle(text())).toMatchObject({ color: 'var(--text-color)', fontSize: '12px', fontFamily: 'var(--widget-primary-font-family, Roboto)' });
  });

  it('takes the old color and size of a widget saved without style settings', () => {
    const old = widgetFromJson({ class_name: 'text_widget', id: 1, content: '', text_color: '#abc', font_size: '20px', extra_data: {} }) as TextWidget;
    expect(textRenderStyle(old)).toMatchObject({ color: '#abc', fontSize: '20px' });
    const empty = widgetFromJson({ class_name: 'text_widget', id: 1, content: '', text_color: '', font_size: '', extra_data: {} }) as TextWidget;
    expect(textRenderStyle(empty)).toMatchObject({ color: 'var(--text-color)', fontSize: '12px' });
  });

  it('ignores the old color and size once the widget has style settings', () => {
    const widget = widgetFromJson({ class_name: 'text_widget', id: 1, content: '', text_color: '#abc', font_size: '20px', extra_data: { style_settings: {} } }) as TextWidget;
    expect(textRenderStyle(widget)).toMatchObject({ color: 'var(--text-color)', fontSize: '13px' });
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
