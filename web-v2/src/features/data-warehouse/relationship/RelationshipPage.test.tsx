import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RelationshipService } from '@/core/relationship/RelationshipService';
import { SchemaService } from '@/core/schema/SchemaService';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fixtureRelationshipService, fixtureSchemaService, RELATIONSHIP_JSON } from '@/shared/relationship/relationship.fixtures';
import { TABLE_DRAG_TYPE } from '../database-tree/tableDrag';

function setup(globalJson: unknown = RELATIONSHIP_JSON) {
  const relationships = fixtureRelationshipService(undefined, globalJson);
  const save = vi.spyOn(relationships, 'saveGlobalRelationship');
  const router = renderAppAt('/data-warehouse/relationship', fakeAuthenticationService(), [
    di => {
      di.bindValue(RelationshipService, relationships);
      di.bindValue(SchemaService, fixtureSchemaService());
    }
  ]);
  return { router, save, user: userEvent.setup() };
}

/** A drop of `sample_v2.sales` from the tree, as the browser hands it over. */
function dropSales(target: Element) {
  const data = { types: [TABLE_DRAG_TYPE], getData: () => JSON.stringify({ dbName: 'sample_v2', name: 'sales' }), dropEffect: 'none' };
  fireEvent.dragOver(target, { dataTransfer: data });
  fireEvent.drop(target, { dataTransfer: data, clientX: 100, clientY: 100 });
}

const panel = () => screen.findByRole('region', { name: 'Global relationships' });

beforeEach(() => saveSession('ssid-1', 60));
afterEach(() => clearSession());

describe('RelationshipPage', () => {
  it('draws the global relationships, Save disabled until something changes', async () => {
    setup();
    const region = await panel();

    expect(await within(region).findByText('orders')).toBeInTheDocument();
    expect(within(region).getByText('sales')).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('removes a table with its joins and position, and saves the rest', async () => {
    const { save, user } = setup();
    const region = await panel();

    await user.click(await within(region).findByLabelText('Actions of regions'));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove' }));
    await user.click(within(region).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(save).toHaveBeenCalled());
    const json = save.mock.calls[0]![0].toJson();
    expect(json['views']).toEqual([RELATIONSHIP_JSON.views[0], RELATIONSHIP_JSON.views[1]]);
    expect(json['relationships']).toHaveLength(1);
    expect(json['extra_data']).toEqual({ table_positions: { sampleV2Sales: { left: 360, top: 40 }, adhocAnalysisorders: { left: 0, top: 0 } } });
    // Saved: nothing left to save.
    await waitFor(() => expect(within(region).getByRole('button', { name: 'Save' })).toBeDisabled());
  });

  it('adds a table dropped from the tree once, and Discard takes it away', async () => {
    const { user } = setup({ views: [], relationships: [], extra_data: {} });
    const region = await panel();
    await within(region).findByText(/Drag tables from the database tree/);

    dropSales(region.querySelector('.react-flow')!.parentElement!);
    expect(await within(region).findByText('sales')).toBeInTheDocument();
    dropSales(region.querySelector('.react-flow')!.parentElement!);
    expect(await screen.findByText('sales is already on the canvas')).toBeInTheDocument();

    await user.click(within(region).getByRole('button', { name: 'Discard Changes' }));
    await user.click(await screen.findByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(within(region).queryByText('sales')).not.toBeInTheDocument());
  });

  it('asks before leaving with unsaved changes', async () => {
    const { router, user } = setup({ views: [], relationships: [], extra_data: {} });
    const region = await panel();
    await within(region).findByText(/Drag tables from the database tree/);
    dropSales(region.querySelector('.react-flow')!.parentElement!);
    await within(region).findByText('sales');

    void router.navigate('/data-warehouse/schema');

    // antd writes a confirm's title twice.
    expect((await screen.findAllByText('Leave without saving?')).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Stay' }));
    expect(router.state.location.pathname).toBe('/data-warehouse/relationship');
  });
});
