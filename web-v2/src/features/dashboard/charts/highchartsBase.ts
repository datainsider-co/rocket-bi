import type { VizOptions } from '@/core/query/vizOptions';

/**
 * v1 `ChartOption.CONFIG`: defaults under every Highcharts chart. Colors and fonts are CSS variables set by the
 * dashboard theme and the widget card.
 */
export const BASE_CONFIG = {
  chart: {
    backgroundColor: '',
    style: { fontFamily: 'Roboto' },
    spacing: [4, 0, 0, 0]
  },
  legend: {
    itemMarginTop: 5,
    symbolHeight: 10,
    backgroundColor: '#00000000',
    navigation: { activeColor: 'var(--accent)', arrowSize: 10 }
  },
  plotOptions: {
    pie: {
      allowPointSelect: true,
      cursor: 'pointer',
      dataLabels: { enabled: false },
      showInLegend: true
    }
  },
  title: {
    style: {
      color: 'var(--text-color)',
      fontFamily: 'var(--widget-primary-font-family, Roboto)',
      fontWeight: 'var(--widget-primary-font-weight, 500)',
      fontStyle: 'var(--widget-primary-font-style, normal)'
    }
  },
  subtitle: {
    style: {
      color: 'var(--secondary-text-color)',
      fontFamily: 'var(--widget-secondary-font-family, Roboto)',
      fontSize: '11px',
      fontWeight: 'var(--widget-secondary-font-weight, 400)',
      fontStyle: 'var(--widget-secondary-font-style, normal)'
    }
  },
  credits: { enabled: false },
  exporting: { enabled: false }
};

/** v1 `ChartOption.colors`: the theme palette unless the chart picked its own colors. */
export function chartColors(options: VizOptions, themeColors: readonly string[]): string[] {
  const own = options.themeColor;
  if (own?.enabled ?? true) return [...themeColors];
  return [...(own?.colors ?? [])];
}

/** v1 shows the title text whatever `enabled` says; v2 honors `enabled: false`. */
export function titleText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value !== 'object' || value === null) return undefined;
  const { text, enabled } = value as { text?: unknown; enabled?: unknown };
  return enabled === false || typeof text !== 'string' ? undefined : text;
}

/** v1 `customAxisLabel`: optional prefix and postfix around an axis label. */
export function axisLabel(value: string, axis: unknown): string {
  const { prefix, postfix } = (axis ?? {}) as { prefix?: { text?: string }; postfix?: { text?: string } };
  return `${prefix?.text ?? ''}${value}${postfix?.text ?? ''}`;
}

export interface MinMaxCondition {
  enabled?: boolean;
  min?: { enabled?: boolean; value?: number; equal?: boolean };
  max?: { enabled?: boolean; value?: number; equal?: boolean };
}

/**
 * Whether a data label shows under a min/max condition. v1's `ChartUtils.isShowValue` hid every non-zero value once a
 * condition was enabled and let the max check overwrite the min one; v2 keeps values inside both bounds.
 */
export function isInsideCondition(value: number, condition: MinMaxCondition | undefined): boolean {
  if (!condition?.enabled) return true;
  const { min, max } = condition;
  if (min?.enabled) {
    const bound = min.value ?? 0;
    if (min.equal ? value < bound : value <= bound) return false;
  }
  if (max?.enabled) {
    const bound = max.value ?? 0;
    if (max.equal ? value > bound : value >= bound) return false;
  }
  return true;
}
