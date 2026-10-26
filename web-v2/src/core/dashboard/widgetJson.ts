import { asBoolean, asRecord, asString, getPath, type JsonObject } from '@/core/json/json';
import type { Position, WidgetId } from './Position';
import { WidgetClassName, type TabItem, type Widget } from './Widget';

/**
 * Widgets as the server stores them, for creating and editing (v1 `TextWidget.empty`, `TabWidget.empty`,
 * `GroupFilter.empty`, `ImageWidget.fromUrl`). Edits are spread onto the widget's stored JSON, so keys v2 doesn't
 * model stay as they are.
 */

/** Where a new widget goes: nowhere yet, the grid finds it a free slot (v1 `getDefaultPosition`). */
function unplaced(width: number, height: number): Position {
  return { row: -1, column: -1, width, height, zIndex: 1 };
}

export const NEW_WIDGET_POSITION = {
  text: unplaced(8, 3),
  image: unplaced(10, 8),
  tab: unplaced(24, 16)
} as const;

/** v1 `TextWidget.getRenderStyle` options, kept in `extra_data.style_settings`. */
export interface TextStyle {
  fontSize: string;
  fontColor: string;
  textAlign: 'left' | 'center' | 'right';
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
}

/** v1 `TextWidget.defaultStyleSettings`, with the theme's variables for colors. */
export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: '12px',
  fontColor: 'var(--text-color)',
  textAlign: 'left',
  isBold: false,
  isItalic: false,
  isUnderline: false
};

export interface TextContent {
  content: string;
  isHtmlRender: boolean;
  style: TextStyle;
}

function styleSettings(json: JsonObject): JsonObject {
  return asRecord(getPath(json, ['extra_data', 'style_settings']));
}

export function textStyleOf(json: JsonObject): TextStyle {
  const style = styleSettings(json);
  const align = style['text_align'];
  return {
    fontSize: asString(style['font_size'], DEFAULT_TEXT_STYLE.fontSize),
    fontColor: asString(style['font_color'], DEFAULT_TEXT_STYLE.fontColor),
    textAlign: align === 'center' || align === 'right' ? align : 'left',
    isBold: asBoolean(style['is_bold']),
    isItalic: asBoolean(style['is_italic']),
    isUnderline: asBoolean(style['is_underline'])
  };
}

/** The text widget's JSON with new content and style; `json` is empty for a new one. */
export function textWidgetJson(json: JsonObject, { content, isHtmlRender, style }: TextContent): JsonObject {
  const extraData = asRecord(json['extra_data']);
  return {
    class_name: WidgetClassName.Text,
    id: -1,
    name: '',
    description: '',
    font_size: '',
    text_color: '',
    background_color: '',
    ...json,
    content,
    is_html_render: isHtmlRender,
    extra_data: {
      current_chart_type: WidgetClassName.Text,
      ...extraData,
      style_settings: {
        opacity: 100,
        background_opacity: 100,
        font_family: 'Roboto',
        ...styleSettings(json),
        font_size: style.fontSize,
        font_color: style.fontColor,
        text_align: style.textAlign,
        is_bold: style.isBold,
        is_italic: style.isItalic,
        is_underline: style.isUnderline
      }
    }
  };
}

export function imageWidgetJson(json: JsonObject, url: string): JsonObject {
  return { class_name: WidgetClassName.Image, id: -1, name: 'Image', description: '', ...json, url };
}

const TAB_HEADER = {
  position: 'horizontal',
  font_family: 'Roboto',
  color: 'var(--text-color)',
  font_size: '14px',
  in_active: { background: 'var(--tab-widget-background-deactive)' }
};

/** v1 `TabWidget.empty`: one tab named "New tab". */
export function newTabWidgetJson(): JsonObject {
  return {
    class_name: WidgetClassName.Tab,
    id: -1,
    name: '',
    description: '',
    tab_items: [{ name: 'New tab', widget_ids: [], options: {} }],
    extra_data: {
      current_chart_type: '',
      configs: {},
      filters: {},
      header: { ...TAB_HEADER, active: { background: 'var(--tab-widget-background-active)' } }
    }
  };
}

/** v1 `GroupFilter.empty`: a tab widget whose single tab holds filters, with an Apply button. */
export function newFilterPanelJson(): JsonObject {
  return {
    class_name: WidgetClassName.Tab,
    id: -1,
    name: '',
    description: '',
    tab_items: [{ name: 'Filter panel', widget_ids: [], options: {} }],
    extra_data: {
      current_chart_type: 'filter_panel',
      configs: {},
      filters: {},
      header: { ...TAB_HEADER, active: { background: 'var(--chart-background-color)' } },
      footer: {
        align: 'right',
        apply: { font_family: 'Roboto', font_size: '14px', title: 'Apply', color: 'var(--accent-text-color)', background: 'var(--accent)' }
      }
    }
  };
}

export function tabItemsToJson(tabItems: readonly TabItem[]): JsonObject[] {
  return tabItems.map(tab => ({ name: tab.name, widget_ids: [...tab.widgetIds], options: tab.options }));
}

/** A widget's JSON with its name (title) changed; a chart's title is its name too. */
export function renamedWidgetJson(widget: Widget, name: string): JsonObject {
  return { ...widget.json, name };
}

/** What to create for a copy of a widget (duplicate, paste): its JSON without what the server fills in. */
export function copyWidgetJson(json: JsonObject): JsonObject {
  const { id: _id, creator_id: _creator, owner_id: _owner, ...rest } = json;
  return { ...rest, id: -1 };
}

/** The widget ids a tab widget holds, every tab included. */
export function childWidgetIds(widget: Widget): WidgetId[] {
  return widget.kind === 'tab' || widget.kind === 'filter_panel' ? widget.tabItems.flatMap(tab => tab.widgetIds) : [];
}
