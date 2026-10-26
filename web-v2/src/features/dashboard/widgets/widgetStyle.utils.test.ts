import { describe, expect, it } from 'vitest';
import { WidgetSetting } from '@/core/dashboard/DashboardSetting';
import { widgetFromJson } from '@/core/dashboard/Widget';
import { widgetBackground, widgetCssVars } from './widgetStyle.utils';

const chart = (background?: string) =>
  widgetFromJson({ class_name: 'chart_v3', id: 1, setting: { options: { options: background ? { background } : {} } } });

describe('widgetBackground', () => {
  it('reads a chart background from its viz options', () => {
    expect(widgetBackground(chart('#BEE2CA'))).toEqual({ color: '#BEE2CA', opacity: 100 });
    expect(widgetBackground(chart())).toEqual({ color: undefined, opacity: 100 });
  });

  it('reads a text widget background from its style settings', () => {
    const text = widgetFromJson({
      class_name: 'text_widget',
      id: 2,
      extra_data: { style_settings: { background: '#000000', background_opacity: 50 } }
    });
    expect(widgetBackground(text)).toEqual({ color: '#000000', opacity: 50 });
  });
});

describe('widgetCssVars', () => {
  const defaults = new WidgetSetting();

  it('uses the dashboard widget background for theme colored charts', () => {
    const vars = widgetCssVars(chart('var(--chart-background-color)'), defaults) as Record<string, string>;
    expect(vars['--widget-background-color']).toBe('#FFFFFF');
  });

  it('keeps a chart color the user picked', () => {
    expect((widgetCssVars(chart('#BEE2CA'), defaults) as Record<string, string>)['--widget-background-color']).toBe('#BEE2CA');
  });

  it('maps the widget setting', () => {
    const vars = widgetCssVars(chart(), new WidgetSetting({ padding: 8, primary_text: { is_bold: true, font_size: '18px' } }));
    expect(vars).toMatchObject({
      '--widget-padding': '8px',
      '--widget-border-width': '0px',
      '--widget-border-radius': '20px',
      '--text-color': '#4f4f4f',
      '--widget-primary-font-size': '18px',
      '--widget-primary-font-weight': 'bold',
      '--widget-secondary-font-style': 'normal'
    });
  });
});
