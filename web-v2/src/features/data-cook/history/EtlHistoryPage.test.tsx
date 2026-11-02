import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlHistoryFromJson, type EtlHistory } from '@/core/data-cook/EtlHistory';
import { EtlHistoryService } from '@/core/data-cook/EtlHistoryService';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { formatDateTime } from '@/shared/listing/listing.utils';
import { fakeEtlHistoryService } from '../testing';

const RUNS: readonly EtlHistory[] = fixture.history.response.data.map(etlHistoryFromJson);
const FAILED = RUNS.find(run => run.status === 'Error')!;

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

function renderHistory(runs: readonly EtlHistory[] = RUNS) {
  const service = fakeEtlHistoryService({ list: vi.fn<EtlHistoryService['list']>(async () => ({ total: runs.length, data: runs })) });
  const router = renderAppAt('/data-warehouse/data-cook/history', fakeAuthenticationService(), [
    di => di.bindValue(EtlHistoryService, service)
  ]);
  return { service, router };
}

function lastRequest(service: EtlHistoryService) {
  return vi.mocked(service.list).mock.lastCall?.[0];
}

describe('EtlHistoryPage', () => {
  it('asks for the latest runs first', async () => {
    const { service } = renderHistory();
    await screen.findAllByText('DC0 probe');

    expect(lastRequest(service)).toEqual({ from: 0, size: 20, keyword: undefined, sorts: [{ field: 'id', order: 'DESC' }] });
  });

  it('shows a run, with how it ended and a link to its ETL', async () => {
    const { router } = renderHistory();
    const summary = await screen.findByText('execute failure, No database selected');
    const row = summary.closest('tr') as HTMLElement;

    expect(within(row).getByText(String(FAILED.id))).toBeInTheDocument();
    expect(within(row).getByText(formatDateTime(FAILED.updatedTime))).toBeInTheDocument();
    expect(within(row).getByText(`${FAILED.totalExecutionTime}ms`)).toBeInTheDocument();
    expect(within(row).getByText('Error')).toBeInTheDocument();

    await userEvent.click(within(row).getByRole('link', { name: 'DC0 probe' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/data-warehouse/data-cook/my-etl/dc0-probe-1'));
  });

  it('shows the whole log', async () => {
    renderHistory([FAILED]);
    await userEvent.click(await screen.findByRole('button', { name: 'View log' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/\+ process GetOperator\(1\) success/)).toBeInTheDocument();
    expect(within(dialog).getByText(/execute failure, No database selected/)).toBeInTheDocument();
  });

  it('searches by ETL name and sorts by a clicked column', async () => {
    const { service } = renderHistory();
    await screen.findAllByText('DC0 probe');

    await userEvent.type(screen.getByRole('textbox', { name: 'Search ETL name' }), 'probe');
    await waitFor(() => expect(lastRequest(service)?.keyword).toBe('probe'));

    await userEvent.click(screen.getByRole('columnheader', { name: 'Total Run Time' }));
    await waitFor(() => expect(lastRequest(service)?.sorts).toEqual([{ field: 'total_execution_time', order: 'ASC' }]));
  });

  it('says when there is no run yet', async () => {
    renderHistory([]);

    expect(await screen.findByText("You don't have any ETL History yet")).toBeInTheDocument();
  });
});
