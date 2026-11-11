import { asBoolean, asNumber, asRecord, asString, getPath, isRecord, type JsonObject } from '@/core/json/json';
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
  fontFamily: string;
  fontSize: string;
  fontColor: string;
  /** 0 to 100. */
  opacity: number;
  /** `left`, `center`, `right`, or the theme variable a new text starts with. */
  textAlign: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  /** The card's color behind the text, and how much of it shows (0 to 100). */
  background: string;
  backgroundOpacity: number;
}

/** v1 `TextWidget.defaultStyleSettings`, with the theme's variables for colors and the font. */
export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'var(--widget-primary-font-family, Roboto)',
  fontSize: '12px',
  fontColor: 'var(--text-color)',
  opacity: 100,
  textAlign: 'var(--widget-primary-font-align, center)',
  isBold: false,
  isItalic: false,
  isUnderline: false,
  background: 'var(--chart-background-color)',
  backgroundOpacity: 100
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
  const align = asString(style['text_align']);
  const isAlign = align === 'left' || align === 'center' || align === 'right' || align.startsWith('var(');
  // v1: a widget saved before style settings takes their defaults; one with settings, the getter's `left`.
  const hasSettings = isRecord(getPath(json, ['extra_data', 'style_settings']));
  return {
    fontFamily: asString(style['font_family']) || DEFAULT_TEXT_STYLE.fontFamily,
    fontSize: asString(style['font_size'], DEFAULT_TEXT_STYLE.fontSize),
    fontColor: asString(style['font_color'], DEFAULT_TEXT_STYLE.fontColor),
    opacity: asNumber(style['opacity'], DEFAULT_TEXT_STYLE.opacity),
    background: asString(style['background']) || DEFAULT_TEXT_STYLE.background,
    backgroundOpacity: asNumber(style['background_opacity'], DEFAULT_TEXT_STYLE.backgroundOpacity),
    textAlign: isAlign ? align : hasSettings ? 'left' : DEFAULT_TEXT_STYLE.textAlign,
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
        ...styleSettings(json),
        font_family: style.fontFamily,
        font_size: style.fontSize,
        font_color: style.fontColor,
        opacity: style.opacity,
        background: style.background,
        background_opacity: style.backgroundOpacity,
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
