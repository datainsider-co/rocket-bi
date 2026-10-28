import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fixture from '@/core/ingestion/ingestion.fixture.json';
import { jobHistoryFromJson, type JobHistory } from '@/core/ingestion/JobHistory';
import type { JobHistoryService } from '@/core/ingestion/JobHistoryService';
import type { ListingPage } from '@/core/listing/Listing';
import { formatDateTime } from '../listing/listing.utils';
import { findDialog, renderIngestionPage } from '../renderIngestionPage';
import { fakeJobHistoryService } from '../testing';
import { JobHistoryPage } from './JobHistoryPage';

const RUNS: readonly JobHistory[] = fixture.historyList.response.data.map(jobHistoryFromJson);
const FAILED: JobHistory = {
  ...RUNS[0]!,
  syncId: 3,
  syncStatus: 'Error',
  totalSyncedTime: 125_000,
  totalRowsInserted: 1_234_567,
  message: 'Table di0_ingest.sales does not exist in the destination warehouse'
};

function serviceWith(page: ListingPage<JobHistory> = { total: RUNS.length, data: RUNS }) {
  return fakeJobHistoryService({ list: vi.fn<JobHistoryService['list']>(async () => page) });
}

function renderPage(service: JobHistoryService) {
  return renderIngestionPage(<JobHistoryPage />, '/data-ingestion/job-history', { history: service });
}

function lastRequest(service: JobHistoryService) {
  return vi.mocked(service.list).mock.lastCall?.[0];
}

describe('JobHistoryPage', () => {
  it('asks for the first 20 runs, latest first', async () => {
    const service = serviceWith();
    renderPage(service);
    await screen.findAllByText('DI0 sales');
    expect(service.list).toHaveBeenCalledTimes(1);
    expect(lastRequest(service)).toEqual({ from: 0, size: 20, keyword: undefined, sorts: [{ field: 'id', order: 'DESC' }] });
  });

  it('shows the runs with formatted values', async () => {
    const service = serviceWith({ total: 3, data: [FAILED, ...RUNS] });
    renderPage(service);
    const row = (await screen.findByText('Table di0_ingest.sales does not exist in the destination warehouse')).closest('tr')!;
    expect(within(row).getByText('3')).toBeInTheDocument();
    expect(within(row).getByText('DI0 sales')).toBeInTheDocument();
    expect(within(row).getByText(formatDateTime(FAILED.lastSyncTime))).toBeInTheDocument();
    expect(within(row).getByText('2m 5s')).toBeInTheDocument();
    expect(within(row).getByText('Error')).toBeInTheDocument();
    expect(within(row).getByText('1,234,567')).toBeInTheDocument();

    const synced = screen.getByText('391ms').closest('tr')!;
    expect(within(synced).getByText('Synced')).toBeInTheDocument();
    expect(within(synced).getByText('--')).toBeInTheDocument();
    expect(within(synced).getByText('200')).toBeInTheDocument();
  });

  it('shows a long message whole in a tooltip', async () => {
    renderPage(serviceWith({ total: 1, data: [FAILED] }));
    await userEvent.hover(await screen.findByText(FAILED.message));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(FAILED.message);
  });

  it('searches once typing pauses, from the first page', async () => {
    const service = serviceWith();
    renderPage(service);
    await screen.findAllByText('DI0 sales');
    await userEvent.type(screen.getByRole('textbox', { name: 'Search job history' }), 'sales');
    await waitFor(() => expect(lastRequest(service)?.keyword).toBe('sales'));
    expect(service.list).toHaveBeenCalledTimes(2);
    expect(lastRequest(service)).toMatchObject({ from: 0, sorts: [{ field: 'id', order: 'DESC' }] });
  });

  it.each([
    ['Sync Id', 'id', 'ASC'],
    ['Job Name', 'job_name', 'ASC'],
    ['Last Sync Time', 'last_sync_time', 'ASC'],
    ['Total Synced Time', 'total_sync_time', 'ASC'],
    ['Status', 'sync_status', 'ASC'],
    ['Total Inserted Rows', 'total_inserted_rows', 'ASC']
  ])('sorts by %s on the backend column %s', async (header, field, order) => {
    const service = serviceWith();
    renderPage(service);
    await screen.findAllByText('DI0 sales');
    await userEvent.click(screen.getByRole('columnheader', { name: header }));
    await waitFor(() => expect(lastRequest(service)?.sorts).toEqual([{ field, order }]));
  });

  it('flips the order on a second click of the same header', async () => {
    const service = serviceWith();
    renderPage(service);
    await screen.findAllByText('DI0 sales');
    await userEvent.click(screen.getByRole('columnheader', { name: 'Job Name' }));
    await waitFor(() => expect(lastRequest(service)?.sorts).toEqual([{ field: 'job_name', order: 'ASC' }]));
    await userEvent.click(screen.getByRole('columnheader', { name: 'Job Name' }));
    await waitFor(() => expect(lastRequest(service)?.sorts).toEqual([{ field: 'job_name', order: 'DESC' }]));
  });

  it('does not sort by Message', async () => {
    const service = serviceWith();
    renderPage(service);
    await screen.findAllByText('DI0 sales');
    await userEvent.click(screen.getByRole('columnheader', { name: 'Message' }));
    expect(service.list).toHaveBeenCalledTimes(1);
  });

  it('asks for the next page from its offset', async () => {
    const service = serviceWith({ total: 45, data: RUNS });
    renderPage(service);
    await screen.findAllByText('DI0 sales');
    await userEvent.click(screen.getByTitle('2'));
    await waitFor(() => expect(lastRequest(service)).toMatchObject({ from: 20, size: 20 }));
  });

  it('reloads the current page on Refresh', async () => {
    const service = serviceWith();
    renderPage(service);
    await screen.findAllByText('DI0 sales');
    await userEvent.click(screen.getByRole('button', { name: /Refresh/ }));
    await waitFor(() => expect(service.list).toHaveBeenCalledTimes(2));
    expect(vi.mocked(service.list).mock.calls[1]?.[0]).toEqual(vi.mocked(service.list).mock.calls[0]?.[0]);
  });

  it('shows No data yet without runs, with a link to add a job', async () => {
    renderPage(serviceWith({ total: 0, data: [] }));
    expect(await screen.findByText('No data yet')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Click here' }));

    expect(await findDialog('Add Job')).toBeInTheDocument();
  });

  it('says when a search matches nothing', async () => {
    const service = fakeJobHistoryService({
      list: vi.fn<JobHistoryService['list']>(async request =>
        request.keyword ? { total: 0, data: [] } : { total: RUNS.length, data: RUNS }
      )
    });
    renderPage(service);
    await screen.findAllByText('DI0 sales');
    await userEvent.type(screen.getByRole('textbox', { name: 'Search job history' }), 'nothing');
    expect(await screen.findByText('No job history matches your search')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search job history' })).toHaveValue('nothing');
  });

  it('shows the error and retries', async () => {
    const list = vi
      .fn<JobHistoryService['list']>()
      .mockRejectedValueOnce(new Error('history is down'))
      .mockResolvedValue({ total: RUNS.length, data: RUNS });
    renderPage(fakeJobHistoryService({ list }));
    expect(await screen.findByText('history is down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findAllByText('DI0 sales')).toHaveLength(2);
    expect(screen.queryByText('history is down')).not.toBeInTheDocument();
  });
});
