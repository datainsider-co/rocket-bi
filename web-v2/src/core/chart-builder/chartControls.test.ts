import { describe, expect, it } from 'vitest';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import { widgetFromJson } from '@/core/dashboard/Widget';
import { ChartInfoType, chartControlsOf } from './chartControls';
import stored from './builder.fixture.json';

const widgets = dashboardFromJson(stored).widgets;

const column = (name: string) => ({ name, function: { class_name: 'group', field: { class_name: 'table_field', field_name: name } }, is_horizontal_view: false });

/** A tab filter over two columns, a function controller. */
const tabControl = (defaultKeys?: string[]) =>
  widgetFromJson({
    class_name: 'chart_v3',
    id: 90,
    name: 'Group by',
    extra_data: { current_chart_type: 'tab_filter' },
    setting: {
      class_name: 'tab_control_chart_setting',
      values: [column('region'), column('country')],
      options: { class_name: 'tab_filter_chart_setting', options: { title: { text: 'Group by' }, ...(defaultKeys && { default: { setting: { value: defaultKeys } } }) } }
    }
  });

describe('chartControlsOf', () => {
  it('lists the main date filter and every chart by title, without the edited one', () => {
    const controls = chartControlsOf(widgets, { mainDate: true, excludeId: 31 });
    expect(controls).toHaveLength(widgets.length);
    expect(controls.map(control => control.id)).not.toContain(31);
    expect(controls.map(control => control.title)).toEqual([...controls.map(control => control.title)].sort((a, b) => a.localeCompare(b)));
    expect(controls.find(control => control.id === -99887766)).toMatchObject({ title: 'Main Date Filter', chartType: 'date_select_filter', infoType: ChartInfoType.Normal });
  });

  it("gives a chart v1's control data, without columns", () => {
    const [kpi] = chartControlsOf(widgets.filter(widget => widget.id === 36), { mainDate: false });
    expect(kpi?.data).toEqual({ id: 36, display_name: 'Untitled chart', chart_type: 'kpi', chart_info_type: 'Normal', table_columns: [], default_table_columns: [] });
  });

  it("gives a tab control its columns marked with its id, the default picks first, else the first column", () => {
    const [picked] = chartControlsOf([tabControl(['country_1'])], { mainDate: false });
    expect(picked).toMatchObject({ infoType: ChartInfoType.FunctionController, title: 'Group by' });
    expect(picked?.data['table_columns']).toEqual([
      { ...column('region'), dynamic_function_id: 90 },
      { ...column('country'), dynamic_function_id: 90 }
    ]);
    expect(picked?.data['default_table_columns']).toEqual([{ ...column('country'), dynamic_function_id: 90 }]);
    const [unpicked] = chartControlsOf([tabControl()], { mainDate: false });
    expect(unpicked?.data['default_table_columns']).toEqual([{ ...column('region'), dynamic_function_id: 90 }]);
  });

  it('names a chart without a title by its widget name, and skips other widgets', () => {
    const untitled = widgetFromJson({ class_name: 'chart_v3', id: 5, name: 'Sales', extra_data: { current_chart_type: 'pie' }, setting: { class_name: 'pie_chart_setting' } });
    const text = widgetFromJson({ class_name: 'text_widget', id: 6, name: 'Note', content: '' });
    expect(chartControlsOf([untitled, text], { mainDate: false }).map(control => control.title)).toEqual(['Sales']);
  });
});
