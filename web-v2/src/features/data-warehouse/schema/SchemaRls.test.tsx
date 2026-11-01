import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rlsPolicyFromJson } from '@/core/rls/RlsPolicy';
import { RlsPolicyService } from '@/core/rls/RlsPolicyService';
import { databaseSchemaFromJson, SchemaService } from '@/core/schema/SchemaService';
import fixture from '@/core/schema/warehouse.fixture.json';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeSchemaService } from '@/features/dashboard/testing';
import { fakeRlsPolicyService } from '../testing';

const probe = databaseSchemaFromJson(fixture.databaseGetWithTables.response);
const saved = fixture.policiesList.response.data.map(rlsPolicyFromJson);

function setup(rls = fakeRlsPolicyService({ list: vi.fn<RlsPolicyService['list']>(async () => saved) })) {
  const schema = fakeSchemaService({
    listDatabases: vi.fn<SchemaService['listDatabases']>(async () => [{ name: 'dw0_probe', displayName: 'dw0_probe' }]),
    getDatabase: vi.fn<SchemaService['getDatabase']>(async () => probe)
  });
  renderAppAt('/data-warehouse/schema?database=dw0_probe&table=products', fakeAuthenticationService(), [
    di => {
      di.bindValue(SchemaService, schema);
      di.bindValue(RlsPolicyService, rls);
    }
  ]);
  return { rls, user: userEvent.setup() };
}

async function openRls(user: ReturnType<typeof userEvent.setup>) {
  const table = await screen.findByRole('region', { name: 'Table products' });
  await within(table).findByText('Column (6)');
  await user.click(within(table).getByText('RLS'));
  return table;
}

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

// Typing into a whole table of inputs is slow in jsdom.
describe('Schema page RLS', { timeout: 20_000 }, () => {
  it("lists the table's policies in words", async () => {
    const { rls, user } = setup();
    const table = await openRls(user);

    expect(await within(table).findByText('department')).toBeInTheDocument();
    expect(within(table).getByText('in sales, ops')).toBeInTheDocument();
    expect(within(table).getByText('View All')).toBeInTheDocument();
    expect(within(table).getByText('View Nothing')).toBeInTheDocument();
    expect(within(table).getByText("Name edited in Phở, O'Brien tea")).toBeInTheDocument();
    expect(rls.list).toHaveBeenCalledWith(expect.objectContaining({ dbName: 'dw0_probe', name: 'products' }), expect.anything());
  });

  it('adds a policy and saves the whole list', async () => {
    const { rls, user } = setup();
    const table = await openRls(user);
    await user.click(await within(table).findByRole('button', { name: /Edit RLS/ }));

    await user.click(within(table).getByRole('button', { name: /Add RLS/ }));
    await user.click(within(table).getByRole('button', { name: /Save/ }));
    // The new policy, and DW0's third one, which targets no one.
    expect(await within(table).findAllByText('Attribute name is required')).toHaveLength(2);
    expect(rls.put).not.toHaveBeenCalled();

    await user.type(within(table).getByRole('textbox', { name: 'Attribute name of policy 4' }), 'Sales Region');
    await user.tab();
    expect(within(table).getByRole('textbox', { name: 'Attribute name of policy 4' })).toHaveValue('sales_region');
    await user.type(within(table).getByRole('combobox', { name: 'Value of policy 4' }), 'north,south,');
    await user.click(within(table).getByRole('button', { name: 'Delete policy 3' }));
    await user.click(within(table).getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(rls.put).toHaveBeenCalled());
    const [, policies] = vi.mocked(rls.put).mock.calls[0]!;
    expect(policies.map(policy => [policy.policyId, policy.userAttribute])).toEqual([
      [1, { key: 'region', operator: 'IsNull', values: [] }],
      [2, { key: 'department', operator: 'Contain', values: ['sales', 'ops'] }],
      [-1, { key: 'sales_region', operator: 'Contain', values: ['north', 'south'] }]
    ]);
    expect(policies[0]).toMatchObject({ userIds: saved[0]!.userIds, conditions: saved[0]!.conditions });
    expect(await within(table).findByRole('button', { name: /Edit RLS/ })).toBeInTheDocument();
  });

  it("edits a policy's custom filter with the builder's condition editor", async () => {
    const { rls, user } = setup();
    const table = await openRls(user);
    await user.click(await within(table).findByRole('button', { name: /Edit RLS/ }));

    await user.click(within(table).getByRole('button', { name: 'Rows seen by policy 2' }));
    await user.click(await screen.findByText('Custom...'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Custom filter on products')).toBeInTheDocument();
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Apply' })).toBeDisabled();
    await user.click(within(dialog).getByRole('button', { name: /Add condition/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Qty' }));
    await user.click(await within(dialog).findByRole('button', { name: 'Edit filter Qty' }));
    await user.type(await screen.findByRole('textbox', { name: /value/i }), '5');
    // The condition editor's Apply, in its popover outside the dialog.
    await user.click(screen.getAllByRole('button', { name: 'Apply' }).find(button => !dialog.contains(button))!);
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

    expect(await within(table).findByText('Qty equal 5')).toBeInTheDocument();
    // DW0's third policy targets no one, which the form doesn't save.
    await user.click(within(table).getByRole('button', { name: 'Delete policy 3' }));
    await user.click(within(table).getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(rls.put).toHaveBeenCalled());
    expect(vi.mocked(rls.put).mock.calls[0]![1][1]!.conditions).toEqual([
      { class_name: 'and', conditions: [{ class_name: 'equal', value: '5', field: expect.objectContaining({ field_name: 'qty' }) }] }
    ]);
  });

  it('shows why the policies could not be read', async () => {
    const { user } = setup(fakeRlsPolicyService({ list: vi.fn<RlsPolicyService['list']>(async () => Promise.reject(new Error('No permission'))) }));
    const table = await openRls(user);

    expect(await within(table).findByText('No permission')).toBeInTheDocument();
  });
});
