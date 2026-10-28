import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from '@/core/ingestion/ingestion.fixture.json';
import { jobInfoFromJson, QUEUED_STATUSES, type JobInfo } from '@/core/ingestion/Job';
import type { JobService } from '@/core/ingestion/JobService';
import { listingPageFromJson, type ListingPage } from '@/core/listing/Listing';
import { formatDateTime } from '../listing/listing.utils';
import { renderIngestionPage } from '../renderIngestionPage';
import { fakeJobService } from '../testing';
import { JobsPage } from './JobsPage';

const page = listingPageFromJson(fixture.jobList.response, jobInfoFromJson);
const [first, second] = fixture.jobList.response.data;

function serviceReturning(result: ListingPage<JobInfo> = page) {
  return fakeJobService({ list: vi.fn<JobService['list']>(async () => result) });
}

function renderJobs(path = '/data-ingestion/job', jobs = serviceReturning()) {
  return renderIngestionPage(<JobsPage />, path, { jobs });
}

const lastRequest = (jobs: JobService) => vi.mocked(jobs.list).mock.lastCall;

afterEach(() => {
  vi.useRealTimers();
});

describe('JobsPage', () => {
  it('lists every job, newest change first, 20 per page', async () => {
    const { jobs } = renderJobs();

    expect(await screen.findByText('DI0 sales')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Jobs' })).toBeInTheDocument();
    expect(lastRequest(jobs)).toEqual([
      { from: 0, size: 20, keyword: undefined, sorts: [{ field: 'last_modified', order: 'DESC' }] },
      undefined,
      expect.any(AbortSignal)
    ]);
  });

  it('shows the columns of a row', async () => {
    renderJobs();

    const row = (await screen.findByText('DI0 multi (database: caas, table: organization)')).closest('tr');
    if (!row) throw new Error('no row');
    const cells = within(row);
    expect(cells.getByText('DI0 MySQL')).toBeInTheDocument();
    expect(cells.getByText('Full')).toBeInTheDocument();
    expect(cells.getAllByText('Initialized')).toHaveLength(2);
    expect(cells.getByText(formatDateTime(second?.job.next_run_time ?? 0))).toBeInTheDocument();
    expect(cells.getByText('--')).toBeInTheDocument();
  });

  it('shows -- as the next sync of a job that will not run again', async () => {
    renderJobs();

    const row = (await screen.findByText('DI0 sales')).closest('tr');
    if (!row) throw new Error('no row');
    const cells = within(row);
    expect(cells.getAllByText('Synced')).toHaveLength(2);
    expect(cells.getByText(formatDateTime(first?.job.last_successful_sync ?? 0))).toBeInTheDocument();
    expect(cells.getByText('--')).toBeInTheDocument();
  });

  it('lists a job v2 cannot edit and a job whose source was deleted', async () => {
    const rows = [
      { ...first, job: { ...first?.job, job_id: 7, display_name: 'GA4 job', class_name: 'ga4_job' } },
      { ...first, job: { ...first?.job, job_id: 8, display_name: 'Orphan job' }, source: null }
    ];
    renderJobs('/data-ingestion/job', serviceReturning(listingPageFromJson({ data: rows, total: 2 }, jobInfoFromJson)));

    expect(await screen.findByText('GA4 job')).toBeInTheDocument();
    const orphan = screen.getByText('Orphan job').closest('tr');
    if (!orphan) throw new Error('no row');
    expect(within(orphan).getAllByText('--')).toHaveLength(2);
  });

  it('lists queued jobs on Queued Jobs', async () => {
    const jobs = serviceReturning(listingPageFromJson(fixture.jobListQueued.response, jobInfoFromJson));
    renderJobs('/data-ingestion/queued-job', jobs);

    expect(await screen.findByText('DI0 sales')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Queued Jobs' })).toBeInTheDocument();
    expect(lastRequest(jobs)?.[1]).toBe(QUEUED_STATUSES);
  });

  it('searches once typing pauses, from the first page', async () => {
    const user = userEvent.setup();
    const { jobs } = renderJobs();
    await screen.findByText('DI0 sales');

    await user.type(screen.getByRole('textbox', { name: 'Search job' }), 'sales');

    await waitFor(() => expect(lastRequest(jobs)?.[0]).toMatchObject({ from: 0, keyword: 'sales' }));
    expect(vi.mocked(jobs.list).mock.calls.filter(([request]) => request.keyword !== undefined)).toHaveLength(1);
  });

  it('sorts on a header click and flips the order on the next', async () => {
    const user = userEvent.setup();
    const { jobs } = renderJobs();
    await screen.findByText('DI0 sales');

    await user.click(screen.getByRole('columnheader', { name: 'Next Sync' }));
    await waitFor(() => expect(lastRequest(jobs)?.[0].sorts).toEqual([{ field: 'next_run_time', order: 'ASC' }]));

    await user.click(screen.getByRole('columnheader', { name: 'Next Sync' }));
    await waitFor(() => expect(lastRequest(jobs)?.[0].sorts).toEqual([{ field: 'next_run_time', order: 'DESC' }]));
  });

  it('does not sort by source', async () => {
    const user = userEvent.setup();
    const { jobs } = renderJobs();
    await screen.findByText('DI0 sales');
    const calls = vi.mocked(jobs.list).mock.calls.length;

    await user.click(screen.getByRole('columnheader', { name: 'Source Name' }));

    expect(vi.mocked(jobs.list).mock.calls).toHaveLength(calls);
  });

  it('shows the load error and retries', async () => {
    const user = userEvent.setup();
    const list = vi.fn<JobService['list']>().mockRejectedValueOnce(new Error('unauthorized access')).mockResolvedValue(page);
    renderJobs('/data-ingestion/job', fakeJobService({ list }));

    expect(await screen.findByText('unauthorized access')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('DI0 sales')).toBeInTheDocument();
  });

  it('says when there are no jobs', async () => {
    renderJobs('/data-ingestion/job', serviceReturning({ total: 0, data: [] }));

    expect(await screen.findByText('No data yet')).toBeInTheDocument();
  });

  it('reloads every 5 seconds by default', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { jobs } = renderJobs();
    await screen.findByText('DI0 sales');
    const calls = vi.mocked(jobs.list).mock.calls.length;

    await vi.advanceTimersByTimeAsync(5_000);

    await waitFor(() => expect(vi.mocked(jobs.list).mock.calls.length).toBeGreaterThan(calls));
  });

  it('switches to manual refresh and reloads on click', async () => {
    const user = userEvent.setup();
    const { jobs } = renderJobs();
    await screen.findByText('DI0 sales');

    await user.click(screen.getByRole('button', { name: 'Refresh options' }));
    await user.click(await screen.findByText('Manual Refresh'));
    const refresh = await screen.findByRole('button', { name: 'Manual Refresh' });
    const calls = vi.mocked(jobs.list).mock.calls.length;

    await user.click(refresh);

    await waitFor(() => expect(vi.mocked(jobs.list).mock.calls.length).toBe(calls + 1));
  });
});
