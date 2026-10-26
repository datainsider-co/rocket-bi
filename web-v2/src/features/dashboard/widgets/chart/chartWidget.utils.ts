import type { ChartWidget } from '@/core/dashboard/Widget';
import { asString, getPath, isRecord } from '@/core/json/json';

/** `title` and `subtitle` are objects in current options; very old charts stored plain strings (v1 `ChartOption.getTitle`). */
function textOf(value: unknown): string {
  if (typeof value === 'string') return value;
  return isRecord(value) ? asString(value['text']) : '';
}

export function chartTitle(widget: ChartWidget): string {
  return textOf(getPath(widget.setting, ['options', 'options', 'title'])) || widget.name;
}

export function chartSubtitle(widget: ChartWidget): string {
  return textOf(getPath(widget.setting, ['options', 'options', 'subtitle']));
}
