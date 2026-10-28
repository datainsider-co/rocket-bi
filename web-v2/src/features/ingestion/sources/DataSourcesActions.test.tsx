import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dataSourceFromJson, type JdbcSource } from '@/core/ingestion/DataSource';
import type { DataSourceService, SourceInfo } from '@/core/ingestion/DataSourceService';
import fixture from '@/core/ingestion/ingestion.fixture.json';
import { ApiError } from '@/shared/http/ApiError';
import { findDialog, renderIngestionPage } from '../renderIngestionPage';
import { fakeDataSourceService } from '../testing';
import { DataSourcesPage } from './DataSourcesPage';

const MYSQL = dataSourceFromJson(fixture.sourceGet.response) as JdbcSource;
const POSTGRES = dataSourceFromJson({
  class_name: 'jdbc_source',
  id: 3,
  display_name: 'Warehouse PG',
  database_type: 'Postgres',
  jdbc_url: 'jdbc:postgresql://pg:5432/shop',
  username: 'pg',
  password: 'secret'
});
const MONGO = dataSourceFromJson({ class_name: 'mongo_db_source', id: 2, display_name: 'Legacy Mongo' });
const ROWS: SourceInfo[] = [MYSQL, POSTGRES, MONGO].map(source => ({ source, creator: undefined }));

function renderPage(overrides: Partial<DataSourceService> = {}) {
  const sources = fakeDataSourceService({ list: vi.fn<DataSourceService['list']>(async () => ({ total: ROWS.length, data: ROWS })), ...overrides });
  const page = renderIngestionPage(<DataSourcesPage />, '/data-ingestion/data-source', { sources });
  return { ...page, sources };
}

function row(name: string): HTMLElement {
  return screen.getByText(name).closest('tr') as HTMLElement;
}

async function confirm(text: string) {
  const dialog = await findDialog(text);
  expect(within(dialog).getByText(text)).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
}

describe('DataSourcesPage actions', () => {
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      query =>
        ({
          matches: true,
          media: query,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {}
        }) as unknown as MediaQueryList
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it('edits JDBC sources only', async () => {
    renderPage();
    await screen.findByText('Legacy Mongo');

    expect(screen.getByRole('button', { name: 'Edit DI0 MySQL' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Edit Legacy Mongo' })).toBeDisabled();
  });

  it('deletes a row after confirming, then reloads', async () => {
    const { sources } = renderPage();
    await screen.findByText('Legacy Mongo');

    await userEvent.click(screen.getByRole('button', { name: 'Delete Legacy Mongo' }));
    await confirm("Are you sure to delete data source 'Legacy Mongo'?");

    await waitFor(() => expect(sources.delete).toHaveBeenCalledWith(2));
    await waitFor(() => expect(sources.list).toHaveBeenCalledTimes(2));
  });

  it('deletes the checked rows together', async () => {
    const { sources } = renderPage();
    await screen.findByText('Legacy Mongo');

    await userEvent.click(within(row('DI0 MySQL')).getByRole('checkbox'));
    await userEvent.click(within(row('Legacy Mongo')).getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /Delete \(2\)/ }));
    await confirm('Are you sure to delete 2 data sources?');

    await waitFor(() => expect(sources.deleteMany).toHaveBeenCalledWith([1, 2]));
  });

  it('shows why a delete failed', async () => {
    renderPage({ delete: vi.fn<DataSourceService['delete']>(async () => Promise.reject(new ApiError('source is used by 2 jobs', 400, 'bad_request'))) });
    await screen.findByText('Legacy Mongo');

    await userEvent.click(screen.getByRole('button', { name: 'Delete Legacy Mongo' }));
    await confirm("Are you sure to delete data source 'Legacy Mongo'?");

    expect(await screen.findByText('source is used by 2 jobs')).toBeInTheDocument();
  });

  it('edits a source in a form split from its URL, keeping the rest', async () => {
    const { sources } = renderPage();
    await screen.findByText('Warehouse PG');

    await userEvent.click(screen.getByRole('button', { name: 'Edit Warehouse PG' }));
    const dialog = await findDialog('Edit PostgreSQL Data Source');
    expect(within(dialog).getByLabelText('Host')).toHaveValue('pg');
    expect(within(dialog).getByLabelText('Database name')).toHaveValue('shop');
    await userEvent.clear(within(dialog).getByLabelText('Database name'));
    await userEvent.type(within(dialog).getByLabelText('Database name'), 'shop_v2');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Update' }));

    await waitFor(() =>
      expect(sources.update).toHaveBeenCalledWith({ ...POSTGRES, jdbcUrl: 'jdbc:postgresql://pg:5432/shop_v2' })
    );
    await waitFor(() => expect(screen.queryByText('Edit PostgreSQL Data Source')).not.toBeInTheDocument());
  });

  it('adds a source from the catalog, then opens its first job on it', async () => {
    const create = vi.fn<DataSourceService['create']>(async source => ({ ...source, id: 9 }));
    const { sources } = renderPage({ create });
    await screen.findByText('Legacy Mongo');

    await userEvent.click(screen.getByRole('button', { name: /Add Data Source/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'MySQL' }));
    const dialog = await findDialog('Add MySQL Data Source');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
    expect(await within(dialog).findByText('Display name is required!')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();

    await userEvent.type(within(dialog).getByLabelText('Display name'), 'Shop');
    await userEvent.type(within(dialog).getByLabelText('Host'), 'db');
    await userEvent.type(within(dialog).getByLabelText('Username'), 'root');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'Shop', jdbcUrl: 'jdbc:mysql://db:3306?connectTimeout=30000', username: 'root' })
      )
    );
    const jobDialog = await findDialog('Add Job');
    expect(within(jobDialog).getByText('Shop')).toBeInTheDocument();
    expect(within(jobDialog).getByRole('combobox', { name: 'From data source' })).toBeDisabled();
    expect(sources.list).toHaveBeenCalled();
  });

  it('shows a failed connection test with the driver message', async () => {
    renderPage({ test: vi.fn<DataSourceService['test']>(async () => Promise.reject(new ApiError('unable to connect to data source: refused', 400, 'bad_request'))) });
    await screen.findByText('Warehouse PG');

    await userEvent.click(screen.getByRole('button', { name: 'Edit Warehouse PG' }));
    const dialog = await findDialog('Edit PostgreSQL Data Source');
    await userEvent.click(within(dialog).getByRole('button', { name: /Test connection/ }));

    expect(await within(dialog).findByText('unable to connect to data source: refused')).toBeInTheDocument();
  });

  it('opens a job on the source of a clicked row, but not for types v2 can not sync', async () => {
    renderPage();
    await screen.findByText('Legacy Mongo');

    await userEvent.click(screen.getByText('Legacy Mongo'));
    expect(screen.queryByText('Add Job')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Warehouse PG'));
    const jobDialog = await findDialog('Add Job');
    expect(within(jobDialog).getByText('Warehouse PG')).toBeInTheDocument();
  });

  it('offers to add a source from the empty state', async () => {
    renderPage({ list: vi.fn<DataSourceService['list']>(async () => ({ total: 0, data: [] })) });

    await userEvent.click(await screen.findByRole('button', { name: 'Click here' }));

    expect(await findDialog('Add Data Source')).toBeInTheDocument();
  });
});
