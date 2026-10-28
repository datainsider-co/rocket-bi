import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { DiProvider } from '@/app/di/DiContext';
import { ConnectionService } from '@/core/connection/ConnectionService';
import { createContainer } from '@/core/di/Container';
import { SchemaEditService } from '@/core/schema/SchemaEditService';
import type { TableSchema } from '@/core/schema/SchemaService';
import { fakeConnectionService } from '@/features/data-source/testing';
import { FormulaFieldDialog } from './FormulaFieldDialog';
import { fakeSchemaEditService } from './testing';
import type { FormulaFieldTarget } from './useFormulaFieldForm';

// Monaco doesn't run in jsdom: a textarea stands in for the editor.
vi.mock('./editor/LazyCodeEditor', () => ({
  LazyCodeEditor: ({ value, onChange, ariaLabel }: { value: string; onChange: (value: string) => void; ariaLabel: string }) => (
    <textarea aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)} />
  )
}));

const view: TableSchema = {
  dbName: 'sample_v2',
  name: 'cb8_tmp_view',
  columns: [
    { name: 'Units_Sold', displayName: 'Units Sold', type: 'int32' },
    { name: 'Total_Revenue', displayName: 'Total_Revenue', type: 'double' }
  ],
  calculatedColumns: [{ name: 'double_units', displayName: 'Double Units', type: 'int64', expression: 'Units_Sold * 2', description: 'Calculated field' }]
};

function renderDialog(target: FormulaFieldTarget, edit = fakeSchemaEditService()) {
  const onSaved = vi.fn<(table: TableSchema) => void>();
  const container = createContainer([
    di => {
      di.bindValue(SchemaEditService, edit);
      di.bindValue(ConnectionService, fakeConnectionService({ getSourceType: vi.fn<ConnectionService['getSourceType']>(async () => 'mysql_connection') }));
    }
  ]);
  render(
    <DiProvider container={container}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AntApp>
          <FormulaFieldDialog target={target} onSaved={onSaved} onCancel={() => {}} />
        </AntApp>
      </QueryClientProvider>
    </DiProvider>
  );
  return { edit, onSaved };
}

describe('FormulaFieldDialog', () => {
  it('creates a calculated column from its formula, with its type from the server', async () => {
    const { edit, onSaved } = renderDialog({ kind: 'calculated', table: view });

    await userEvent.type(screen.getByPlaceholderText('Column name'), 'Triple Units');
    await userEvent.type(await screen.findByLabelText('Formula'), '[[Units Sold] * 3');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(edit.detectExpressionType).toHaveBeenCalledWith(view, 'calculated', 'Units_Sold * 3');
    expect(edit.createColumn).toHaveBeenCalledWith(view, 'calculated', { name: 'triple_units', displayName: 'Triple Units', type: 'double', expression: 'Units_Sold * 3', description: 'Calculated field' });
  });

  it('opens an edited column with its formula by display name, and keeps its name', async () => {
    const editing = view.calculatedColumns![0]!;
    const { edit } = renderDialog({ kind: 'calculated', table: view, editing });

    expect(screen.getByRole('dialog', { name: 'Edit Calculated Field' })).toBeInTheDocument();
    const formula = await screen.findByLabelText('Formula');
    expect(formula).toHaveValue('[Units Sold] * 2');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(edit.updateColumn).toHaveBeenCalledWith(view, 'calculated', { ...editing, type: 'double' }));
  });

  it('checks the name and shows the server’s message for a wrong formula', async () => {
    const edit = fakeSchemaEditService({ detectExpressionType: vi.fn<SchemaEditService['detectExpressionType']>(async () => Promise.reject(new Error("Unknown column 'nope'"))) });
    renderDialog({ kind: 'measure', table: view }, edit);

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Column name is required.')).toBeInTheDocument();
    expect(screen.getByText('Formula field is required.')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Column name'), 'Units Sold');
    expect(await screen.findByText('A column with this name already exists in the table.')).toBeInTheDocument();
    await userEvent.clear(screen.getByPlaceholderText('Column name'));
    await userEvent.type(screen.getByPlaceholderText('Column name'), 'Bad');
    await userEvent.type(await screen.findByLabelText('Formula'), 'sum(nope)');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText("Unknown column 'nope'")).toBeInTheDocument();
    expect(edit.createColumn).not.toHaveBeenCalled();
  });

  it('lists the data source’s functions and describes the picked one', async () => {
    renderDialog({ kind: 'measure', table: view });

    const functions = await screen.findByRole('list', { name: 'Functions' });
    await userEvent.click(await within(functions).findByRole('button', { name: 'ABS' }));
    expect(screen.getByRole('heading', { name: 'ABS(number)' })).toBeInTheDocument();
  });
});
