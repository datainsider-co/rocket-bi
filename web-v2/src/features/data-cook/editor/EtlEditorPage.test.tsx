import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson, etlJobToJson, newEtlJob, type EtlJob } from '@/core/data-cook/EtlJob';
import { EtlService } from '@/core/data-cook/EtlService';
import { clearSession, saveSession } from '@/core/session/session';
import { ApiError } from '@/shared/http/ApiError';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeEtlService } from '../testing';

const ETL2 = etlJobFromJson(fixture.etlGetV1.response);
const SALES_JSON = { name: 'sales', db_name: 'sample_v2', display_name: 'Sales', columns: [] };

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

function setup(path: string, overrides: Partial<EtlService> = {}) {
  const service = fakeEtlService({
    get: vi.fn<EtlService['get']>(async () => ETL2),
    update: vi.fn<EtlService['update']>(async etl => etl),
    create: vi.fn<EtlService['create']>(async displayName => ({ ...newEtlJob(displayName), id: 12 })),
    getSourceTable: vi.fn<EtlService['getSourceTable']>(async () => SALES_JSON),
    ...overrides
  });
  const router = renderAppAt(`/data-warehouse/data-cook/my-etl/${path}`, fakeAuthenticationService(), [di => di.bindValue(EtlService, service)]);
  return { service, router, user: userEvent.setup() };
}

const savedEtl = (service: EtlService): EtlJob => vi.mocked(service.update).mock.lastCall![0];

describe('EtlEditorPage', () => {
  it("draws an ETL's tables, operators and boxes", async () => {
    const { service } = setup('dc0-v1-etl-2');

    expect(await screen.findByText('DC0 v1 ETL')).toBeInTheDocument();
    expect(service.get).toHaveBeenCalledWith(2, expect.anything());
    expect(await screen.findByText('sales_join_sales_copy')).toBeInTheDocument();
    expect(screen.getByText('Inner join')).toBeInTheDocument();
    expect(screen.getByText('regioncount2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('renames a table and saves the ETL, keeping its schedule', async () => {
    const { service, user } = setup('dc0-v1-etl-2');

    // Boxes are hidden until React Flow measures them, which jsdom never does: found by label.
    await user.click(await screen.findByLabelText('Actions of sales_1_1'));
    await user.click(await screen.findByRole('menuitem', { name: 'Edit Display Name' }));
    const input = await screen.findByPlaceholderText('Input your title');
    await user.clear(input);
    await user.type(input, 'Region count{Enter}');
    expect(await screen.findByText('Region count')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(service.update).toHaveBeenCalled());
    const json = etlJobToJson(savedEtl(service));
    expect(json['schedule_time']).toEqual(etlJobToJson(ETL2)['schedule_time']);
    expect(JSON.stringify(json['operators'])).toContain('"tbl_display_name":"Region count"');
    expect(await screen.findByText('ETL saved')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled());
  });

  it('removes a table and the steps after it, after a confirm', async () => {
    const { service, user } = setup('dc0-v1-etl-2');

    await user.click(await screen.findByLabelText('Actions of sales_1'));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove' }));
    expect(await screen.findByText("Remove 'sales_1' and the 2 steps after it?")).toBeInTheDocument();
    const dialog = screen.getAllByRole('dialog').at(-1)!;
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.queryByText('regioncount2')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(service.update).toHaveBeenCalled());
    expect(savedEtl(service).operators.map(operator => operator.destTable.tblName)).toEqual(['sales_join_sales_copy']);
  });

  it('creates a new ETL with its first source and moves to its URL, keeping the edit', async () => {
    const { service, router, user } = setup('create');

    expect(await screen.findByText('Untitled ETL')).toBeInTheDocument();
    expect(service.create).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Add Source' }));
    const picker = await screen.findByRole('dialog', { name: 'Add Source' });
    await user.click(await within(picker).findByText('sample_v2'));
    await user.click(await within(picker).findByRole('button', { name: 'sales' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/data-warehouse/data-cook/my-etl/untitled-etl-12'));
    expect(service.create).toHaveBeenCalledWith('Untitled ETL');
    expect(service.getSourceTable).toHaveBeenCalledWith('sample_v2', 'sales');
    expect(await screen.findByText('sales')).toBeInTheDocument();
    expect(service.get).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(service.update).toHaveBeenCalled());
    expect(savedEtl(service)).toMatchObject({ id: 12, displayName: 'Untitled ETL' });
    expect(etlJobToJson(savedEtl(service))['operators']).toEqual([expect.objectContaining({ table_schema: SALES_JSON })]);
  });

  it('renames the ETL in the draft', async () => {
    const { user } = setup('dc0-v1-etl-2');

    await user.click(await screen.findByRole('button', { name: 'Rename ETL' }));
    const input = await screen.findByPlaceholderText('Input your title');
    await user.clear(input);
    await user.type(input, 'a/b{Enter}');
    expect(await screen.findByText("Field can't contain special characters")).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, 'Sales ETL{Enter}');

    expect(await screen.findByText('Sales ETL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('asks before leaving with unsaved changes', async () => {
    const { router, user } = setup('dc0-v1-etl-2');
    await user.click(await screen.findByRole('button', { name: 'Rename ETL' }));
    await user.type(await screen.findByPlaceholderText('Input your title'), ' 2{Enter}');

    await user.click(screen.getByRole('link', { name: /Trash/ }));
    // antd writes a confirm's title twice.
    expect((await screen.findAllByText('It looks like you have been editing something')).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Stay' }));
    expect(router.state.location.pathname).toBe('/data-warehouse/data-cook/my-etl/dc0-v1-etl-2');
  });

  it('says when the ETL is gone', async () => {
    setup('gone-99', { get: vi.fn<EtlService['get']>(async () => Promise.reject(new ApiError('Not found', 404, 'not_found'))) });

    expect(await screen.findByText('ETL not found')).toBeInTheDocument();
  });

  it('is Not found without an id', async () => {
    setup('no-id');
    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});
