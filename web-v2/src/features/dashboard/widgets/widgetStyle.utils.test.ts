import { describe, expect, it } from 'vitest';
import { WidgetSetting } from '@/core/dashboard/DashboardSetting';
import { widgetFromJson } from '@/core/dashboard/Widget';
import { widgetBackground, widgetCssVars, widgetPadding } from './widgetStyle.utils';

const chart = (background?: string, vizClass = 'number_chart_setting') =>
  widgetFromJson({
    class_name: 'chart_v3',
    id: 1,
    setting: { options: { class_name: vizClass, options: background ? { background } : {} } }
  });

describe('widgetBackground', () => {
  it('reads a chart background from its viz options', () => {
    expect(widgetBackground(chart('#BEE2CA'))).toEqual({ color: '#BEE2CA', opacity: 100 });
    expect(widgetBackground(chart())).toEqual({ color: '#FAFAFB', opacity: 100 });
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

describe('widgetPadding', () => {
  const defaults = new WidgetSetting({ padding: 15 });

  it.each(['tab_filter_chart_setting', 'slice_filter_setting', 'date_select_filter_setting', 'input_filter_setting'])(
    'gives the %s filter v1 6px',
    vizClass => {
      expect(widgetPadding(chart(undefined, vizClass), defaults)).toBe('6px');
    }
  );

  it.each(['number_chart_setting', 'tree_filter_chart_setting', 'dropdown_filter_chart_setting'])('keeps the dashboard padding for %s', vizClass => {
    expect(widgetPadding(chart(undefined, vizClass), defaults)).toBe('15px');
  });

  it('keeps the dashboard padding for widgets other than charts', () => {
    expect(widgetPadding(widgetFromJson({ class_name: 'text_widget', id: 3 }), defaults)).toBe('15px');
  });
});

describe('widgetCssVars', () => {
  const defaults = new WidgetSetting();

  it('uses the dashboard widget background for theme colored charts', () => {
    const vars = widgetCssVars(chart('var(--chart-background-color)'), defaults) as Record<string, string>;
    expect(vars['--widget-background-color']).toBe('#FFFFFF');
  });

  it('gives charts without a background v1 default color', () => {
    expect((widgetCssVars(chart(), defaults) as Record<string, string>)['--widget-background-color']).toBe('#FAFAFB');
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
