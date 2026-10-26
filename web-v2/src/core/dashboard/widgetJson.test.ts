import { describe, expect, it } from 'vitest';
import { widgetFromJson } from './Widget';
import {
  childWidgetIds,
  copyWidgetJson,
  DEFAULT_TEXT_STYLE,
  imageWidgetJson,
  newFilterPanelJson,
  newTabWidgetJson,
  renamedWidgetJson,
  tabItemsToJson,
  textStyleOf,
  textWidgetJson
} from './widgetJson';

describe('textWidgetJson', () => {
  const content = { content: 'Hello', isHtmlRender: false, style: { ...DEFAULT_TEXT_STYLE, fontSize: '20px', isBold: true } };

  it('builds a new text widget the server accepts', () => {
    const json = textWidgetJson({}, content);
    expect(json).toMatchObject({ class_name: 'text_widget', id: -1, content: 'Hello', is_html_render: false });
    expect(json['extra_data']).toMatchObject({ current_chart_type: 'text_widget', style_settings: { font_size: '20px', is_bold: true, opacity: 100 } });
    expect(widgetFromJson(json).kind).toBe('text');
  });

  it('keeps what the stored widget has besides', () => {
    const stored = { class_name: 'text_widget', id: 10, owner_id: 'root', extra_data: { other: 1, style_settings: { background: 'red' } } };
    const json = textWidgetJson(stored, content);
    expect(json).toMatchObject({ id: 10, owner_id: 'root', extra_data: { other: 1, style_settings: { background: 'red', font_size: '20px' } } });
  });

  it('reads the style back, with defaults for what is missing', () => {
    expect(textStyleOf(textWidgetJson({}, content))).toEqual(content.style);
    expect(textStyleOf({})).toEqual(DEFAULT_TEXT_STYLE);
    expect(textStyleOf({ extra_data: { style_settings: { text_align: 'justify' } } }).textAlign).toBe('left');
  });
});

describe('new widgets', () => {
  it('makes an image, a tab and a filter panel', () => {
    expect(widgetFromJson(imageWidgetJson({}, 'https://x/a.png'))).toMatchObject({ kind: 'image', url: 'https://x/a.png', name: 'Image' });
    expect(widgetFromJson(newTabWidgetJson())).toMatchObject({ kind: 'tab', tabItems: [{ name: 'New tab', widgetIds: [] }] });
    expect(widgetFromJson(newFilterPanelJson())).toMatchObject({ kind: 'filter_panel', tabItems: [{ name: 'Filter panel' }] });
  });
});

describe('edits', () => {
  const tab = widgetFromJson({ class_name: 'tab_widget', id: 12, name: 'Tabs', tab_items: [{ name: 'A', widget_ids: [1, 2], options: { x: 1 } }, { name: 'B', widget_ids: [3] }] });

  it('renames on top of the stored JSON', () => {
    expect(renamedWidgetJson(tab, 'New')).toMatchObject({ id: 12, name: 'New', tab_items: expect.any(Array) });
  });

  it('copies without the ids the server gives', () => {
    expect(copyWidgetJson({ id: 7, creator_id: 'a', owner_id: 'b', name: 'X' })).toEqual({ id: -1, name: 'X' });
  });

  it('lists the children of tab widgets only', () => {
    expect(childWidgetIds(tab)).toEqual([1, 2, 3]);
    expect(childWidgetIds(widgetFromJson({ class_name: 'text_widget', id: 1 }))).toEqual([]);
  });

  it('writes tab items back', () => {
    expect(tab.kind === 'tab' && tabItemsToJson(tab.tabItems)).toEqual([
      { name: 'A', widget_ids: [1, 2], options: { x: 1 } },
      { name: 'B', widget_ids: [3], options: {} }
    ]);
  });
});
