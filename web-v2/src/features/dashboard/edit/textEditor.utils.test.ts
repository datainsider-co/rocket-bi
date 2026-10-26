import { describe, expect, it } from 'vitest';
import { widgetFromJson, type TextWidget } from '@/core/dashboard/Widget';
import { DEFAULT_TEXT_STYLE, textWidgetJson } from '@/core/dashboard/widgetJson';
import { initialTextContent, textPreviewStyle } from './textEditor.utils';

describe('textPreviewStyle', () => {
  it('turns the style into CSS', () => {
    expect(textPreviewStyle({ ...DEFAULT_TEXT_STYLE, isBold: true, isUnderline: true, textAlign: 'center' })).toEqual({
      fontSize: '12px',
      color: 'var(--text-color)',
      textAlign: 'center',
      fontWeight: 'bold',
      fontStyle: undefined,
      textDecoration: 'underline'
    });
  });
});

describe('initialTextContent', () => {
  it('starts empty for a new text', () => {
    expect(initialTextContent(undefined)).toEqual({ content: '', isHtmlRender: false, style: DEFAULT_TEXT_STYLE });
  });

  it("starts from the widget's text and style", () => {
    const content = { content: '<b>Hi</b>', isHtmlRender: true, style: { ...DEFAULT_TEXT_STYLE, fontSize: '20px' } };
    const widget = widgetFromJson({ ...textWidgetJson({}, content), id: 4 }) as TextWidget;
    expect(initialTextContent(widget)).toEqual(content);
  });
});
