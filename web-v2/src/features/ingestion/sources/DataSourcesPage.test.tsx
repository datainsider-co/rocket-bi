import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dataSourceFromJson } from '@/core/ingestion/DataSource';
import type { DataSourceService, SourceInfo } from '@/core/ingestion/DataSourceService';
import fixture from '@/core/ingestion/ingestion.fixture.json';
import { UserProfile } from '@/core/user/UserProfile';
import { renderIngestionPage } from '../renderIngestionPage';
import { fakeDataSourceService } from '../testing';
import { DataSourcesPage } from './DataSourcesPage';

const [fixtureRow] = fixture.sourceList.response.data;
const MYSQL: SourceInfo = {
  source: dataSourceFromJson(fixtureRow?.data_source),
  creator: new UserProfile(fixtureRow?.creator)
};
const MONGO: SourceInfo = {
  source: dataSourceFromJson({
    class_name: 'mongo_db_source',
    id: 2,
    display_name: 'Legacy Mongo',
    creator_id: 'alice',
    last_modify: 0
  }),
  creator: undefined
};

type List = DataSourceService['list'];

function renderPage(list: List) {
  const sources = fakeDataSourceService({ list: vi.fn<List>(list) });
  renderIngestionPage(<DataSourcesPage />, '/data-ingestion/data-source', { sources });
  return vi.mocked(sources.list);
}

function lastRequest(list: ReturnType<typeof renderPage>) {
  return list.mock.lastCall?.[0];
}

describe('DataSourcesPage', () => {
  beforeEach(() => {
    // A wide screen: Owner and Last Modified only show from `md` / `sm` up.
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

  it('lists sources, newest first, including types v2 cannot edit', async () => {
    const list = renderPage(async () => ({ total: 2, data: [MYSQL, MONGO] }));

    const mysqlRow = (await screen.findByText('DI0 MySQL')).closest('tr');
    expect(mysqlRow).not.toBeNull();
    expect(within(mysqlRow as HTMLElement).getByText('MySQL')).toBeInTheDocument();
    expect(within(mysqlRow as HTMLElement).getByText('root')).toBeInTheDocument();
    const mongoRow = screen.getByText('Legacy Mongo').closest('tr') as HTMLElement;
    expect(within(mongoRow).getByText('MongoDB')).toBeInTheDocument();
    expect(within(mongoRow).getByText('alice')).toBeInTheDocument();
    expect(within(mongoRow).getByText('--')).toBeInTheDocument();
    expect(lastRequest(list)).toEqual({
      from: 0,
      size: 20,
      keyword: undefined,
      sorts: [{ field: 'last_modified', order: 'DESC' }]
    });
    expect(screen.getByRole('columnheader', { name: /Last Modified/ })).toHaveAttribute('aria-sort', 'descending');
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('searches once typing pauses', async () => {
    const list = renderPage(async request => ({ total: request.keyword ? 1 : 2, data: request.keyword ? [MYSQL] : [MYSQL, MONGO] }));
    await screen.findByText('Legacy Mongo');

    await userEvent.type(screen.getByRole('textbox', { name: 'Search data source' }), 'my');

    await waitFor(() => expect(lastRequest(list)?.keyword).toBe('my'));
    expect(list.mock.calls.map(([request]) => request.keyword)).toEqual([undefined, 'my']);
    await waitFor(() => expect(screen.queryByText('Legacy Mongo')).not.toBeInTheDocument());
  });

  it('sorts on the server by the clicked column, flipping on a second click', async () => {
    const list = renderPage(async () => ({ total: 2, data: [MYSQL, MONGO] }));
    await screen.findByText('DI0 MySQL');

    await userEvent.click(screen.getByText('Name'));
    await waitFor(() => expect(lastRequest(list)?.sorts).toEqual([{ field: 'name', order: 'ASC' }]));

    await userEvent.click(screen.getByText('Name'));
    await waitFor(() => expect(lastRequest(list)?.sorts).toEqual([{ field: 'name', order: 'DESC' }]));

    await userEvent.click(screen.getByText('Owner'));
    await waitFor(() => expect(lastRequest(list)?.sorts).toEqual([{ field: 'creator_id', order: 'ASC' }]));

    await userEvent.click(screen.getByText('Type'));
    await waitFor(() => expect(lastRequest(list)?.sorts).toEqual([{ field: 'data_source_type', order: 'ASC' }]));
  });

  it('pages on the server', async () => {
    const list = renderPage(async ({ from }) => ({ total: 45, data: from === 0 ? [MYSQL] : [MONGO] }));
    await screen.findByText('DI0 MySQL');

    await userEvent.click(screen.getByTitle('2'));

    await waitFor(() => expect(lastRequest(list)?.from).toBe(20));
    expect(await screen.findByText('Legacy Mongo')).toBeInTheDocument();
  });

  it('refreshes the same page', async () => {
    const list = renderPage(async () => ({ total: 1, data: [MYSQL] }));
    await screen.findByText('DI0 MySQL');

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(list.mock.calls[1]?.[0]).toEqual(list.mock.calls[0]?.[0]);
  });

  it('tells no data from no search result', async () => {
    renderPage(async () => ({ total: 0, data: [] }));
    expect(await screen.findByText('No data yet')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: 'Search data source' }), 'x');

    expect(await screen.findByText('No data sources found')).toBeInTheDocument();
    expect(screen.queryByText('No data yet')).not.toBeInTheDocument();
  });

  it('shows the error and retries', async () => {
    let calls = 0;
    renderPage(async () => {
      calls += 1;
      if (calls === 1) throw new Error('unauthorized access');
      return { total: 1, data: [MYSQL] };
    });

    expect(await screen.findByText('unauthorized access')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('DI0 MySQL')).toBeInTheDocument();
    expect(screen.queryByText('unauthorized access')).not.toBeInTheDocument();
  });
});
