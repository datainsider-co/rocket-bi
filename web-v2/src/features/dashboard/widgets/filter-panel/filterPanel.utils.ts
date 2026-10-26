import type { CSSProperties } from 'react';
import { asString, getPath, type JsonObject } from '@/core/json/json';

/** How a filter panel looks (v1 `GroupFilter` `extra_data.header` / `footer`), with v1's defaults. */
export interface FilterPanelLook {
  header: CSSProperties;
  /** Footer alignment: `left`, `center` or `right`. */
  align: string;
  applyTitle: string;
  apply: CSSProperties;
}

const ALIGN: Readonly<Record<string, string>> = { left: 'flex-start', center: 'center', right: 'flex-end' };

function text(json: JsonObject, path: readonly string[], fallback: string): string {
  return asString(getPath(json, ['extra_data', ...path])) || fallback;
}

export function filterPanelLook(json: JsonObject): FilterPanelLook {
  return {
    header: {
      fontFamily: text(json, ['header', 'font_family'], 'Roboto'),
      color: text(json, ['header', 'color'], 'var(--text-color)'),
      fontSize: text(json, ['header', 'font_size'], '14px')
    },
    align: ALIGN[text(json, ['footer', 'align'], 'right')] ?? 'flex-end',
    applyTitle: text(json, ['footer', 'apply', 'title'], 'Apply'),
    apply: {
      fontFamily: text(json, ['footer', 'apply', 'font_family'], 'Roboto'),
      fontSize: text(json, ['footer', 'apply', 'font_size'], '14px'),
      color: text(json, ['footer', 'apply', 'color'], 'var(--accent-text-color)'),
      background: text(json, ['footer', 'apply', 'background'], 'var(--accent)')
    }
  };
}
