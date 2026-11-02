import { describe, expect, it } from 'vitest';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson, newEtlJob } from '@/core/data-cook/EtlJob';
import { PositionGroup, readPosition } from '@/core/data-cook/etlExtraData';
import { draftSnapshot, newSourceOperator } from './etlDraft.utils';
import { etlEditorReducer, initEtlEditor, type EtlEditorState } from './etlEditorReducer';

const etl2 = etlJobFromJson(fixture.etlGetV1.response);
const loaded = initEtlEditor(etl2);
const SOURCE = newSourceOperator({ name: 'orders', db_name: 'shop', columns: [] }, 'Shop', new Set());

const isDirty = (state: EtlEditorState) => draftSnapshot(state.draft) !== draftSnapshot(state.base);

describe('etlEditorReducer', () => {
  it('starts clean', () => {
    expect(isDirty(loaded)).toBe(false);
  });

  it('renames the ETL', () => {
    const state = etlEditorReducer(loaded, { type: 'rename', displayName: 'Sales ETL' });
    expect(state.draft.displayName).toBe('Sales ETL');
    expect(isDirty(state)).toBe(true);
  });

  it('adds a source', () => {
    const state = etlEditorReducer(loaded, { type: 'addSource', operator: SOURCE });
    expect(state.draft.graph.operators.get('orders')).toBe(SOURCE);
    expect(isDirty(state)).toBe(true);
  });

  it('removes a table with what reads it, and the boxes of a table', () => {
    const removed = etlEditorReducer(loaded, { type: 'remove', ref: { type: 'operator', tblName: 'sales_1_1' } });
    expect([...removed.draft.graph.operators.keys()]).not.toContain('sales_1_2');

    const unsaved = etlEditorReducer(loaded, { type: 'remove', ref: { type: 'persist', tblName: 'sales_1_1' } });
    expect(unsaved.draft.graph.operators.get('sales_1_1')?.persist).toBeUndefined();

    const email = etlEditorReducer(loaded, { type: 'remove', ref: { type: 'email', tblName: 'sales_1_2' } });
    expect(email.draft.graph.operators.has('sales_1_2')).toBe(false);
  });

  it('removes a Save To Database box', () => {
    const state = etlEditorReducer(loaded, { type: 'remove', ref: { type: 'thirdParty', tblName: 'sales_1_1', index: 0 } });
    // ETL 2 has none: nothing changes.
    expect(state).toBe(loaded);
  });

  it("renames a table's display name", () => {
    const state = etlEditorReducer(loaded, { type: 'renameTable', tblName: 'sales_1_1', displayName: 'Counts' });
    expect(state.draft.graph.operators.get('sales_1_1')?.destTable.tblDisplayName).toBe('Counts');
  });

  it('keeps the state for an edit that changes nothing', () => {
    expect(etlEditorReducer(loaded, { type: 'renameTable', tblName: 'missing', displayName: 'x' })).toBe(loaded);
  });

  it('moves boxes to whole pixels', () => {
    const state = etlEditorReducer(loaded, {
      type: 'move',
      moves: [
        { ref: { type: 'table', tblName: 'sales_1_1' }, point: { x: 10.4, y: 20.6 } },
        { ref: { type: 'persist', tblName: 'sales_1_1' }, point: { x: 5, y: 5 } }
      ]
    });
    expect(readPosition(state.draft.extraData, PositionGroup.Table, 'sales_11')).toEqual({ x: 10, y: 21 });
    expect(readPosition(state.draft.extraData, PositionGroup.SavedTable, 'sales_11')).toEqual({ x: 5, y: 5 });
    expect(isDirty(state)).toBe(true);
  });

  it('discards back to what was loaded', () => {
    const edited = etlEditorReducer(loaded, { type: 'rename', displayName: 'x' });
    expect(etlEditorReducer(edited, { type: 'discard' }).draft).toBe(loaded.draft);
  });

  it('takes the id of a created ETL and keeps the edits unsaved', () => {
    const draft = etlEditorReducer(initEtlEditor(newEtlJob('Untitled ETL')), { type: 'addSource', operator: SOURCE });
    const created = { ...newEtlJob('Untitled ETL'), id: 12 };

    const state = etlEditorReducer(draft, { type: 'created', etl: created });

    expect(state.draft.etl.id).toBe(12);
    expect(state.draft.graph.operators.has('orders')).toBe(true);
    expect(state.base.graph.operators.size).toBe(0);
    expect(isDirty(state)).toBe(true);
  });

  it('starts over from what the server saved', () => {
    const edited = etlEditorReducer(loaded, { type: 'rename', displayName: 'Saved name' });
    const state = etlEditorReducer(edited, { type: 'saved', etl: { ...etl2, displayName: 'Saved name' } });

    expect(state.draft.displayName).toBe('Saved name');
    expect(isDirty(state)).toBe(false);
  });
});
