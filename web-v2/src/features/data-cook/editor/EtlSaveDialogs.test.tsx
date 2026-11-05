import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson, type EtlJob } from '@/core/data-cook/EtlJob';
import { EtlService } from '@/core/data-cook/EtlService';
import { clearSession, saveSession } from '@/core/session/session';
import { ApiError } from '@/shared/http/ApiError';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeEtlService, findDialog, saveThroughDialog } from '../testing';
import { treeOperators } from './preview/etlPreview.utils';

/** ETL 2: `sales_1_1` saved to `dc0_v1_out.regioncount2` (Append), incremental on `sales_1` (DC0). */
const ETL2 = etlJobFromJson(fixture.etlGetV1.response);

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

function setup(overrides: Partial<EtlService> = {}) {
  const service = fakeEtlService({ get: vi.fn<EtlService['get']>(async () => ETL2), update: vi.fn<EtlService['update']>(async etl => etl), ...overrides });
  renderAppAt('/data-warehouse/data-cook/my-etl/dc0-v1-etl-2', fakeAuthenticationService(), [di => di.bindValue(EtlService, service)]);
  return { service, user: userEvent.setup() };
}

const savedEtl = (service: EtlService): EtlJob => vi.mocked(service.update).mock.lastCall![0];
const persistOf = (etl: EtlJob, tblName: string) => etl.operators.map(leaf => treeOperators(leaf).get(tblName)).find(Boolean)?.persist;

async function pickMenu(user: ReturnType<typeof userEvent.setup>, label: string, item: string) {
  await user.click(await screen.findByLabelText(label));
  await user.click((await screen.findAllByRole('menuitem', { name: item })).at(-1)!);
}

// Each test renders the whole app and goes through several dialogs: slower than the default 5 s under a full run.
describe('Save To Data Warehouse and Save', { timeout: 20_000 }, () => {
  it('saves a table to a new database and table, created by the run', async () => {
    const { service, user } = setup();

    await pickMenu(user, 'Actions of sales_1_2', 'Save To Data Warehouse');
    const dialog = await findDialog('Save to Data Warehouse');
    await user.click(within(dialog).getByRole('button', { name: 'Add' }));
    expect(await within(dialog).findByText('Please select or input a database name.')).toBeInTheDocument();
    expect(within(dialog).getByText('Please select or input a table name.')).toBeInTheDocument();

    await user.type(within(dialog).getByRole('combobox', { name: 'Database' }), 'New DB');
    await user.type(within(dialog).getByRole('combobox', { name: 'Table' }), 'Region Count');
    expect(within(dialog).getByText('The database and table will be created on the first run')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('radio', { name: 'Append' }));
    await user.click(within(dialog).getByRole('button', { name: 'Add' }));

    expect(await screen.findByLabelText('Actions of new_db region_count')).toBeInTheDocument();
    await saveThroughDialog(user);
    await waitFor(() => expect(service.update).toHaveBeenCalled());
    expect(persistOf(savedEtl(service), 'sales_1_2')).toEqual({ dbName: 'new_db', tblName: 'region_count', type: 'Append' });
  });

  it('edits where a table is saved from its box', async () => {
    const { service, user } = setup();

    await pickMenu(user, 'Actions of dc0_v1_out regioncount2', 'Edit');
    const dialog = await findDialog('Save to Data Warehouse');
    expect(within(dialog).getByRole('combobox', { name: 'Database' })).toHaveValue('dc0_v1_out');
    expect(within(dialog).getByRole('combobox', { name: 'Table' })).toHaveValue('regioncount2');
    expect(within(dialog).getByRole('radio', { name: 'Append' })).toBeChecked();
    await user.click(within(dialog).getByRole('radio', { name: 'Update' }));
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));

    await saveThroughDialog(user);
    await waitFor(() => expect(service.update).toHaveBeenCalled());
    expect(persistOf(savedEtl(service), 'sales_1_1')).toEqual({ dbName: 'dc0_v1_out', tblName: 'regioncount2', type: 'Update' });
  });

  it('saves the name and the run mode of each source from the Save dialog', async () => {
    const { service, user } = setup();
    await screen.findByLabelText('Actions of sales_1_2');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    const dialog = await findDialog('Save ETL');
    const name = within(dialog).getByPlaceholderText('ETL name');
    expect(name).toHaveValue('DC0 v1 ETL');
    await user.clear(name);
    await user.type(name, 'Sales ETL');
    const sales = within(dialog).getByRole('group', { name: 'Run mode of di0_ingest.sales' });
    await user.click(within(sales).getByRole('radio', { name: 'Incremental' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(sales).findByText('Please select a column')).toBeInTheDocument();
    expect(service.update).not.toHaveBeenCalled();

    await user.click(within(sales).getByRole('combobox'));
    await user.click((await screen.findAllByTitle('order_id')).at(-1)!);
    await user.type(within(sales).getByPlaceholderText('Incremental value'), '100');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(service.update).toHaveBeenCalled());
    expect(savedEtl(service)).toMatchObject({ displayName: 'Sales ETL', incrementalConfigs: { sales: { columnName: 'order_id', value: '100' } } });
    expect(Object.keys(savedEtl(service).incrementalConfigs)).toEqual(['sales', 'sales_1']);
    expect(await screen.findByText('ETL saved')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Incremental Setting')).not.toBeInTheDocument());
  });

  it("keeps the Save dialog open with the server's message when saving fails", async () => {
    const { user } = setup({ update: vi.fn<EtlService['update']>(async () => Promise.reject(new ApiError('Schedule is invalid', 400, 'invalid_param'))) });
    await screen.findByLabelText('Actions of sales_1_2');

    await saveThroughDialog(user);

    const dialog = await findDialog('Save ETL');
    expect(await within(dialog).findByText('Schedule is invalid')).toBeInTheDocument();
  });
});
