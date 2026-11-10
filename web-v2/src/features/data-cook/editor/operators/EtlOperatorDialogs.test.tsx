import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson, etlJobToJson, type EtlJob } from '@/core/data-cook/EtlJob';
import type { EtlOperator } from '@/core/data-cook/EtlOperator';
import { EtlPreviewService } from '@/core/data-cook/EtlPreviewService';
import { EtlService } from '@/core/data-cook/EtlService';
import { readRenderOptions } from '@/core/data-cook/etlExtraData';
import { QueryService } from '@/core/query/QueryService';
import { visualizationResponseFromJson } from '@/core/query/VisualizationResponse';
import { fakeQueryService } from '@/features/dashboard/testing';
import { clearSession, saveSession } from '@/core/session/session';
import type { CodeEditorProps } from '@/shared/code-editor/CodeEditor';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeEtlPreviewService, fakeEtlService, findDialog, saveThroughDialog } from '../../testing';
import { treeOperators } from '../preview/etlPreview.utils';

vi.mock('@/shared/code-editor/LazyCodeEditor', () => ({
  LazyCodeEditor: ({ value, onChange, ariaLabel }: CodeEditorProps) => <textarea aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)} />
}));

const ETL2 = etlJobFromJson(fixture.etlGetV1.response);
const COLUMNS = [
  { name: 'region', displayName: 'region', type: 'string' },
  { name: 'cnt', displayName: 'cnt', type: 'int64' }
];

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

/** Builds every table it is sent, each with the columns region and cnt. */
const builtWithColumns: EtlPreviewService['preview'] = async (id, operators) => ({
  status: 'Done',
  tables: [...new Set(operators.flatMap(operator => [...treeOperators(operator).keys()]))].map(name => ({ dbName: `preview_etl_${id}`, name, columns: COLUMNS })),
  errors: []
});

/** Answers every `chart/query` with one column, region. */
const regionTable: QueryService['query'] = async () =>
  visualizationResponseFromJson({ class_name: 'json_table_response', headers: [{ key: '0', label: 'region', is_group_by: false, is_text_left: true, formatter_key: '' }], records: [{ '0': 'Asia' }], total: 1 });

function setup(preview: Partial<EtlPreviewService> = {}, query = vi.fn<QueryService['query']>(regionTable)) {
  const service = fakeEtlService({ get: vi.fn<EtlService['get']>(async () => ETL2), update: vi.fn<EtlService['update']>(async etl => etl) });
  const previewService = fakeEtlPreviewService({ preview: vi.fn<EtlPreviewService['preview']>(builtWithColumns), ...preview });
  renderAppAt('/data-warehouse/data-cook/my-etl/dc0-v1-etl-2', fakeAuthenticationService(), [
    di => {
      di.bindValue(EtlService, service);
      di.bindValue(EtlPreviewService, previewService);
      di.bindValue(QueryService, fakeQueryService({ query }));
    }
  ]);
  return { service, previewService, query, user: userEvent.setup() };
}

const user = () => userEvent.setup();
const savedEtl = (service: EtlService): EtlJob => vi.mocked(service.update).mock.lastCall![0];
const savedOperator = (service: EtlService, tblName: string): EtlOperator | undefined =>
  savedEtl(service)
    .operators.flatMap(leaf => [...treeOperators(leaf).values()])
    .find(operator => operator.destTable.tblName === tblName);
const builtNames = (previewService: EtlPreviewService) => vi.mocked(previewService.preview).mock.lastCall![1].map(operator => operator.destTable.tblName);

/** Opens an item of a box's menu; antd keeps the menus it opened before, so the last one is the open one. */
async function pickMenu(label: string, item: string, events = user()) {
  await events.click(await screen.findByLabelText(label));
  await events.click((await screen.findAllByRole('menuitem', { name: item })).at(-1)!);
}

/** Every table's preview built: an operator needs the columns of the table it reads. */
async function previewed() {
  await screen.findByLabelText('Actions of sales_1_2');
  await waitFor(() => expect(screen.queryByLabelText('Previewing')).not.toBeInTheDocument());
}

/** The menu item showing `text`; a submenu's title has no accessible name of its own. */
async function findMenuItem(text: string): Promise<HTMLElement> {
  return waitFor(() => {
    const item = screen.getAllByRole('menuitem').findLast(element => element.textContent === text);
    if (!item) throw new Error(`No menu item ${text}`);
    return item;
  });
}

/** The option of the open Select titled `title`. */
async function findOption(title: string): Promise<HTMLElement> {
  return waitFor(() => {
    const option = [...document.querySelectorAll<HTMLElement>('.ant-select-item-option')].findLast(item => item.title === title);
    if (!option) throw new Error(`No option ${title}`);
    return option;
  });
}

async function save(service: EtlService, events: ReturnType<typeof userEvent.setup>) {
  await saveThroughDialog(events);
  await waitFor(() => expect(service.update).toHaveBeenCalled());
}

// Each test renders the whole app and types through several dialogs: slower than the default 5 s under a full run.
describe('operator dialogs', { timeout: 20_000 }, () => {
  it('adds an SQL Query after a table, saving its SQL on the preview database', async () => {
    const { service, previewService, user: events } = setup();
    await previewed();
    expect(previewService.preview).toHaveBeenCalledTimes(1);

    await pickMenu('Actions of sales_1_2', 'SQL Query', events);
    const dialog = await findDialog('SQL Query');
    const editor = within(dialog).getByLabelText('SQL query');
    expect(editor).toHaveValue('select * from sales_1_2');
    await events.clear(editor);
    await events.type(editor, 'select region from sales_1_2');
    await events.click(within(dialog).getByRole('button', { name: 'Add' }));

    expect(await screen.findByLabelText('Actions of sales_1_3')).toBeInTheDocument();
    await waitFor(() => expect(previewService.preview).toHaveBeenCalledTimes(2));
    expect(builtNames(previewService)).toEqual(['sales_1_3']);
    expect(within(screen.getByRole('region', { name: 'Preview' })).getByRole('tab', { name: 'sales_1_3', selected: true })).toBeInTheDocument();

    await save(service, events);
    expect(savedOperator(service, 'sales_1_3')).toMatchObject({ kind: 'sql', query: 'select region from preview_etl_2.sales_1_2' });
    // What was saved is what was built.
    expect(await screen.findByText('ETL saved')).toBeInTheDocument();
    expect(previewService.preview).toHaveBeenCalledTimes(2);
  });

  it('edits an SQL Query, building again only the tables after it', async () => {
    const { service, previewService, user: events } = setup();
    await previewed();

    // A shape can be dragged: React Flow's drag fails on jsdom's mousedown, so a plain click opens its menu.
    fireEvent.click(await screen.findByLabelText('SQL Query of sales_1_1'));
    await events.click((await screen.findAllByRole('menuitem', { name: 'Edit' })).at(-1)!);
    const dialog = await findDialog('SQL Query');
    const editor = within(dialog).getByLabelText('SQL query');
    expect(editor).toHaveValue('select region, count(*) as cnt from sales_1 group by region');
    await events.clear(editor);
    await events.type(editor, 'select region from sales_1');
    await events.click(within(dialog).getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(previewService.preview).toHaveBeenCalledTimes(2));
    expect(builtNames(previewService)).toEqual(['sales_1_2']);
    await save(service, events);
    expect(savedOperator(service, 'sales_1_1')).toMatchObject({ query: 'select region from preview_etl_2.sales_1' });
  });

  it('asks for the SQL', async () => {
    const { user: events } = setup();
    await previewed();
    await pickMenu('Actions of sales_1_2', 'SQL Query', events);
    const dialog = await findDialog('SQL Query');
    await events.clear(within(dialog).getByLabelText('SQL query'));
    await events.click(within(dialog).getByRole('button', { name: 'Add' }));

    expect(await within(dialog).findByText('Please input a query')).toBeInTheDocument();
  });

  it('joins a table with another of the ETL', async () => {
    const { service, user: events } = setup();
    await previewed();

    await pickMenu('Actions of sales_1_2', 'Join Table', events);
    const dialog = await findDialog('Join Table');
    await events.click(within(dialog).getByRole('combobox', { name: 'Table to join' }));
    await events.click(await findOption('di6_probe_newdb.sales_copy'));
    await events.click(within(dialog).getByRole('button', { name: 'Add' }));
    expect(await within(dialog).findByText('Join clause is invalid')).toBeInTheDocument();

    await events.click(within(dialog).getByLabelText('Left field 1'));
    await events.click(await findOption('region'));
    await events.click(within(dialog).getByLabelText('Right field 1'));
    await events.click(await findOption('region'));
    await events.click(within(dialog).getByRole('radio', { name: 'Inner Join' }));
    await events.click(within(dialog).getByRole('button', { name: 'Add' }));

    expect(await screen.findByLabelText('Actions of sales_1_2_join_sales_copy')).toBeInTheDocument();
    await save(service, events);
    const join = savedOperator(service, 'sales_1_2_join_sales_copy');
    expect(join?.kind === 'join' && join.joins[0]).toMatchObject({
      joinType: 'inner',
      conditions: [
        {
          type: 'equal_field',
          leftField: { db_name: 'preview_etl_2', tbl_name: 'sales_1_2', field_name: 'region' },
          rightField: { db_name: 'preview_etl_2', tbl_name: 'sales_copy', field_name: 'region' }
        }
      ]
    });
  });

  it('manages the fields of a table: renamed, hidden, an expression added', async () => {
    const { service, user: events } = setup();
    await previewed();

    await pickMenu('Actions of sales_1_1', 'Manage Fields', events);
    const dialog = await findDialog('Manage Fields');
    await events.click(within(dialog).getByRole('button', { name: 'Hide cnt' }));
    await events.click(within(dialog).getByRole('button', { name: 'Edit region' }));
    const rename = await findDialog('Edit Field');
    await events.clear(within(rename).getByPlaceholderText('Field name'));
    await events.type(within(rename).getByPlaceholderText('Field name'), 'cnt{Enter}');
    expect(await within(rename).findByText('This field name already exists')).toBeInTheDocument();
    await events.clear(within(rename).getByPlaceholderText('Field name'));
    await events.type(within(rename).getByPlaceholderText('Field name'), 'Region{Enter}');

    await events.click(within(dialog).getByRole('button', { name: /Add field/ }));
    const add = await findDialog('Add Field');
    await events.type(within(add).getByPlaceholderText('Field name'), 'Double');
    await events.type(within(add).getByLabelText('Field expression'), '[[cnt] * 2');
    await events.click(within(add).getByRole('button', { name: 'Add' }));
    expect(await within(dialog).findByText('Double')).toBeInTheDocument();
    await events.click(within(dialog).getByRole('button', { name: 'Add' }));

    expect(await screen.findByLabelText('Actions of sales_1_3')).toBeInTheDocument();
    await save(service, events);
    const json = etlJobToJson(savedEtl(service));
    expect(JSON.stringify(json)).toContain('"expression":"cnt * 2"');
    const fields = savedOperator(service, 'sales_1_3');
    expect(fields?.kind === 'manageFields' && fields.fields.map(field => [field.displayName, field.isHidden])).toEqual([
      ['Region', false],
      ['cnt', true]
    ]);
  });

  it.each([
    ['Transform Table', 'transform', 'table_chart_setting', 'table_chart_setting', 'flatten_table'],
    ['Pivot Table', 'pivot', 'pivot_table_chart_setting', 'flatten_pivot_table_chart_setting', 'flatten_pivot_table']
  ])('builds a %s with ChartBuilder on the table it reads', async (title, kind, storedClass, previewClass, chartType) => {
    const { service, query, user: events } = setup();
    await previewed();

    await pickMenu('Actions of sales_1_2', title, events);
    const builder = (await screen.findByRole('heading', { name: title })).closest<HTMLElement>('.ant-modal')!;
    expect(within(builder).getByText('Drag and drop fields into the zones to build the table')).toBeInTheDocument();
    // "click here" lists the table, then its columns.
    await events.click(within(builder).getAllByRole('button', { name: 'click here' })[0]!);
    await events.hover(await findMenuItem('sales_1_2'));
    await events.click(await findMenuItem('region'));
    expect(await within(builder).findByText('Asia')).toBeInTheDocument();
    const asked = vi.mocked(query).mock.lastCall![0]['query_setting'] as Record<string, unknown>;
    expect(asked['class_name']).toBe(previewClass);
    await events.click(within(builder).getByRole('button', { name: 'Add' }));

    expect(await screen.findByLabelText('Actions of sales_1_3')).toBeInTheDocument();
    await save(service, events);
    const operator = savedOperator(service, 'sales_1_3');
    expect(operator?.kind).toBe(kind);
    const stored = operator && 'query' in operator && typeof operator.query === 'object' ? operator.query : {};
    expect(stored).toMatchObject({ class_name: storedClass, options: {} });
    expect(JSON.stringify(stored)).toContain('"db_name":"preview_etl_2","tbl_name":"sales_1_2","field_name":"region"');
    expect(readRenderOptions(savedEtl(service).extraData, 'sales_1_3')).toMatchObject({ current_chart_type: chartType });
  });

  it('says an operator cannot be added after a table whose preview failed', async () => {
    const failing = vi.fn<EtlPreviewService['preview']>(async () => ({ status: 'Error', tables: [], errors: [{ tblName: 'sales_1', message: 'x' }] }));
    const { user: events } = setup({ preview: failing });
    await waitFor(() => expect(failing).toHaveBeenCalled());

    await pickMenu('Actions of sales_1_2', 'Manage Fields', events);

    expect(await screen.findByText('Preview table sales_1_2 has error')).toBeInTheDocument();
    expect(screen.queryByText('Manage Fields', { selector: '.ant-modal-title' })).not.toBeInTheDocument();
  });
});
