import { describe, expect, it } from 'vitest';
import { widgetFromJson, type TextWidget } from '@/core/dashboard/Widget';
import { DEFAULT_TEXT_STYLE, textWidgetJson } from '@/core/dashboard/widgetJson';
import { initialTextContent, pickerColor, reviewedTextWidget, TEXT_FONT_FAMILIES } from './textEditor.utils';

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

describe('reviewedTextWidget', () => {
  it('is the widget the draft would save', () => {
    const draft = { content: 'Hi', isHtmlRender: false, style: { ...DEFAULT_TEXT_STYLE, background: '#ff0000', backgroundOpacity: 40 } };
    const widget = reviewedTextWidget({ id: 9 }, draft);
    expect(widget).toMatchObject({ kind: 'text', id: 9, content: 'Hi' });
    expect(widget.json['extra_data']).toMatchObject({ style_settings: { background: '#ff0000', background_opacity: 40 } });
  });
});

describe('pickerColor', () => {
  it('passes a hex and drops a theme variable', () => {
    expect(pickerColor('#4f4f4f')).toBe('#4f4f4f');
    expect(pickerColor('var(--text-color)')).toBeUndefined();
  });
});

describe('TEXT_FONT_FAMILIES', () => {
  it("lists the dashboard's own fonts among the others, by name", () => {
    const labels = TEXT_FONT_FAMILIES.map(option => option.label);
    expect(labels).toContain('Primary Text Font');
    expect(labels).toEqual([...labels].sort((one, other) => one.localeCompare(other)));
  });
});
