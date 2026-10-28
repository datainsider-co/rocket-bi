import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dataSourceFromJson } from '@/core/ingestion/DataSource';
import type { DataSourceService } from '@/core/ingestion/DataSourceService';
import fixture from '@/core/ingestion/ingestion.fixture.json';
import { jobInfoFromJson, type JobInfo } from '@/core/ingestion/Job';
import type { JobService } from '@/core/ingestion/JobService';
import { ApiError } from '@/shared/http/ApiError';
import { findDialog, renderIngestionPage } from '../renderIngestionPage';
import { fakeDataSourceService, fakeJobService } from '../testing';
import { JobsPage } from './JobsPage';

const [syncedRow, initializedRow] = fixture.jobList.response.data;
const SYNCED = jobInfoFromJson(syncedRow);
const SYNCING = jobInfoFromJson({ ...initializedRow, job: { ...initializedRow?.job, current_sync_status: 'Syncing' } });
const GA4 = jobInfoFromJson({ ...syncedRow, job: { ...syncedRow?.job, job_id: 7, class_name: 'ga4_job', display_name: 'GA4 events' } });
const MYSQL = dataSourceFromJson(fixture.sourceGet.response);

function renderJobs(overrides: Partial<JobService> = {}, rows: JobInfo[] = [SYNCED, SYNCING, GA4]) {
  const jobs = fakeJobService({ list: vi.fn<JobService['list']>(async () => ({ total: rows.length, data: rows })), ...overrides });
  const sources = fakeDataSourceService({
    list: vi.fn<DataSourceService['list']>(async () => ({ total: 1, data: [{ source: MYSQL, creator: undefined }] }))
  });
  renderIngestionPage(<JobsPage />, '/data-ingestion/job', { jobs, sources });
  return jobs;
}

function row(name: string): HTMLElement {
  return screen.getByText(name).closest('tr') as HTMLElement;
}

async function openMenu(name: string) {
  await userEvent.click(screen.getByRole('button', { name: `More actions for ${name}` }));
}

describe('JobsPage actions', () => {
  it('force syncs a job now and says so', async () => {
    const jobs = renderJobs();
    await screen.findByText('DI0 sales');

    await userEvent.click(within(row('DI0 sales')).getByRole('button', { name: 'Force Sync' }));

    await waitFor(() => expect(jobs.syncNow).toHaveBeenCalledWith(1, expect.any(Number)));
    expect(await screen.findByText('1 job force synced')).toBeInTheDocument();
  });

  it('cancels a running job, and says when it was not running', async () => {
    const jobs = renderJobs({ cancel: vi.fn<JobService['cancel']>(async () => false) });
    const name = 'DI0 multi (database: caas, table: organization)';
    await screen.findByText(name);

    expect(within(row(name)).queryByRole('button', { name: 'Force Sync' })).not.toBeInTheDocument();
    await userEvent.click(within(row(name)).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(jobs.cancel).toHaveBeenCalledWith(2));
    expect(await screen.findByText('The job is not running')).toBeInTheDocument();
  });

  it('shows why a force sync failed', async () => {
    renderJobs({ syncNow: vi.fn<JobService['syncNow']>(async () => Promise.reject(new ApiError('job not found', 404, 'not_found'))) });
    await screen.findByText('DI0 sales');

    await userEvent.click(within(row('DI0 sales')).getByRole('button', { name: 'Force Sync' }));

    expect(await screen.findByText('job not found')).toBeInTheDocument();
  });

  it('deletes a job from its menu after confirming', async () => {
    const jobs = renderJobs();
    await screen.findByText('DI0 sales');

    await openMenu('DI0 sales');
    await userEvent.click(await screen.findByText('Delete'));
    const dialog = await findDialog("Are you sure to delete job 'DI0 sales'?");
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(jobs.delete).toHaveBeenCalledWith(1));
  });

  it('force syncs and deletes the checked jobs together', async () => {
    const jobs = renderJobs({ syncManyNow: vi.fn<JobService['syncManyNow']>(async () => ({ 1: true, 7: false })) });
    await screen.findByText('DI0 sales');

    await userEvent.click(within(row('DI0 sales')).getByRole('checkbox'));
    await userEvent.click(within(row('GA4 events')).getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /Force Sync \(2\)/ }));

    await waitFor(() => expect(jobs.syncManyNow).toHaveBeenCalledWith([1, 7], expect.any(Number)));
    expect(await screen.findByText('1 job force synced, 1 job failed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Force Sync \(/ })).not.toBeInTheDocument();

    await userEvent.click(within(row('DI0 sales')).getByRole('checkbox'));
    await userEvent.click(within(row('GA4 events')).getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /Delete \(2\)/ }));
    const dialog = await findDialog('Are you sure to delete 2 jobs?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(jobs.deleteMany).toHaveBeenCalledWith([1, 7]));
  });

  it('does not edit job types v2 can not edit', async () => {
    renderJobs();
    await screen.findByText('GA4 events');

    await userEvent.click(screen.getByText('GA4 events'));
    expect(screen.queryByText('Edit Job')).not.toBeInTheDocument();

    await openMenu('GA4 events');
    expect((await screen.findByText('Edit')).closest('li')).toHaveAttribute('aria-disabled', 'true');
  });

  it('edits a job from its row, keeping what the form does not show', async () => {
    const jobs = renderJobs();
    await screen.findByText('DI0 sales');

    await userEvent.click(screen.getByText('DI0 sales'));
    const dialog = await findDialog('Edit Job');
    expect(within(dialog).getByLabelText('From table')).toHaveValue('sales');
    const name = within(dialog).getByLabelText('Job name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Sales nightly');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(jobs.update).toHaveBeenCalledTimes(1));
    const [saved] = vi.mocked(jobs.update).mock.calls[0] ?? [];
    expect(saved).toEqual({ ...SYNCED.job, displayName: 'Sales nightly', scheduleTime: saved?.scheduleTime });
    expect(await screen.findByText('Job updated')).toBeInTheDocument();
  });
});
