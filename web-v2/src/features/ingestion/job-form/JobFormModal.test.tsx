import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dataSourceFromJson } from '@/core/ingestion/DataSource';
import type { DataSourceService } from '@/core/ingestion/DataSourceService';
import fixture from '@/core/ingestion/ingestion.fixture.json';
import { jdbcJobToJson } from '@/core/ingestion/Job';
import type { SchemaService } from '@/core/schema/SchemaService';
import { findDialog, renderIngestionPage } from '../renderIngestionPage';
import { fakeDataSourceService, fakeJobService, fakeSchemaService } from '../testing';
import { JobFormModal } from './JobFormModal';
import type { JobFormTarget, JobSavePlan } from './jobForm.utils';

const MYSQL = dataSourceFromJson(fixture.sourceGet.response);
const MONGO = dataSourceFromJson({ class_name: 'mongo_db_source', id: 2, display_name: 'Legacy Mongo' });

function renderForm(target: JobFormTarget = { mode: 'create', lockSource: false }) {
  const sources = fakeDataSourceService({
    list: vi.fn<DataSourceService['list']>(async () => ({
      total: 2,
      data: [MYSQL, MONGO].map(source => ({ source, creator: undefined }))
    })),
    listDatabases: vi.fn<DataSourceService['listDatabases']>(async () => ['caas', 'sample_v2']),
    listTables: vi.fn<DataSourceService['listTables']>(async (_id, db) => (db === 'caas' ? ['organization', 'role'] : ['sales'])),
    listColumns: vi.fn<DataSourceService['listColumns']>(async () => ['id', 'updated_at'])
  });
  const jobs = fakeJobService();
  const schema = fakeSchemaService({ listDatabases: vi.fn<SchemaService['listDatabases']>(async () => [{ name: 'analytics', displayName: 'Analytics' }]) });
  const onSaved = vi.fn<(plan: JobSavePlan) => void>();
  renderIngestionPage(<JobFormModal target={target} onSaved={onSaved} onClose={() => {}} />, '/', { sources, jobs, schema });
  return { sources, jobs, onSaved };
}

async function pickSource(dialog: HTMLElement, name: string) {
  await userEvent.click(within(dialog).getByRole('combobox', { name: 'From data source' }));
  await userEvent.click(await screen.findByTitle(name));
}

async function typeInto(dialog: HTMLElement, label: string, text: string) {
  const input = within(dialog).getByLabelText(label);
  await userEvent.clear(input);
  await userEvent.type(input, text);
}

describe('JobFormModal', () => {
  it('checks the form before saving', async () => {
    const { jobs } = renderForm();
    const dialog = await findDialog('Add Job');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(await within(dialog).findByText('Job name is required!')).toBeInTheDocument();
    expect(within(dialog).getByText('Select a data source, please')).toBeInTheDocument();
    expect(within(dialog).getByText('Table name is required!')).toBeInTheDocument();
    expect(jobs.create).not.toHaveBeenCalled();
  });

  it('offers JDBC sources only', async () => {
    renderForm();
    const dialog = await findDialog('Add Job');

    await userEvent.click(within(dialog).getByRole('combobox', { name: 'From data source' }));

    expect(await screen.findByTitle('DI0 MySQL')).toBeInTheDocument();
    expect(screen.queryByTitle('Legacy Mongo')).not.toBeInTheDocument();
  });

  it('creates one job, its destination table following the source table', async () => {
    const { jobs, sources, onSaved } = renderForm();
    const dialog = await findDialog('Add Job');

    await typeInto(dialog, 'Job name', 'Sales');
    await pickSource(dialog, 'DI0 MySQL');
    await waitFor(() => expect(sources.listDatabases).toHaveBeenCalledWith(1, expect.any(AbortSignal)));
    await typeInto(dialog, 'From database', 'sample_v2');
    await waitFor(() => expect(sources.listTables).toHaveBeenCalledWith(1, 'sample_v2', expect.any(AbortSignal)));
    await userEvent.click(await screen.findByText('Select all 1 tables'));
    expect(within(dialog).getByLabelText('To table')).toHaveValue('sales');
    await typeInto(dialog, 'To database', 'di6_new');
    expect(within(dialog).getByText('New database: the first sync creates it.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(jobs.create).toHaveBeenCalledTimes(1));
    const [job] = vi.mocked(jobs.create).mock.calls[0] ?? [];
    expect(job && jdbcJobToJson(job)).toMatchObject({
      class_name: 'jdbc_job',
      display_name: 'Sales',
      source_id: 1,
      database_name: 'sample_v2',
      table_name: 'sales',
      dest_database_name: 'di6_new',
      dest_table_name: 'sales',
      sync_mode: 'FullSync',
      schedule_time: { class_name: 'schedule_once' }
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ kind: 'create' })));
  });

  it('creates a job per table with multi_create, without Minutely', async () => {
    const { jobs } = renderForm({ mode: 'create', source: MYSQL.kind === 'jdbc' ? MYSQL : undefined, lockSource: true });
    const dialog = await findDialog('Add Job');

    expect(within(dialog).getByRole('combobox', { name: 'From data source' })).toBeDisabled();
    await typeInto(dialog, 'Job name', 'CaaS');
    await typeInto(dialog, 'From database', 'caas');
    await userEvent.click(await within(dialog).findByText('Select all 2 tables'));
    expect(within(dialog).queryByLabelText('To table')).not.toBeInTheDocument();
    expect(within(dialog).getByText('Each table syncs to a table of the same name.')).toBeInTheDocument();
    await typeInto(dialog, 'To database', 'analytics');
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Scheduler type' }));
    await userEvent.click(await screen.findByTitle('Recurring'));
    expect(within(dialog).queryByText('Minutely')).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create 2 jobs' }));

    await waitFor(() => expect(jobs.createForTables).toHaveBeenCalledTimes(1));
    const [baseJob, tables] = vi.mocked(jobs.createForTables).mock.calls[0] ?? [];
    expect(tables).toEqual(['organization', 'role']);
    expect(baseJob && jdbcJobToJson(baseJob)).toMatchObject({
      display_name: 'CaaS',
      database_name: 'caas',
      table_name: '',
      dest_database_name: 'analytics',
      dest_table_name: '',
      schedule_time: { class_name: 'schedule_daily', recur_every: 1 }
    });
  });

  it('needs the column and start value of an incremental sync', async () => {
    const { jobs } = renderForm();
    const dialog = await findDialog('Add Job');

    await userEvent.click(within(dialog).getByLabelText('Incremental sync'));
    await userEvent.clear(within(dialog).getByLabelText('Start value'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(await within(dialog).findByText('Incremental column is required!')).toBeInTheDocument();
    expect(within(dialog).getByText('Start value is required!')).toBeInTheDocument();
    expect(jobs.create).not.toHaveBeenCalled();
  });

  it('shows why a save failed', async () => {
    const { jobs } = renderForm();
    vi.mocked(jobs.create).mockRejectedValueOnce(new Error('source not found'));
    const dialog = await findDialog('Add Job');

    await typeInto(dialog, 'Job name', 'Sales');
    await pickSource(dialog, 'DI0 MySQL');
    await typeInto(dialog, 'From database', 'sample_v2');
    await typeInto(dialog, 'From tables', 'x');
    await userEvent.keyboard('{Enter}');
    await typeInto(dialog, 'To database', 'analytics');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(await within(dialog).findByText('source not found')).toBeInTheDocument();
  });
});
