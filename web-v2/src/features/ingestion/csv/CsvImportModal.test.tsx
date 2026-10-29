import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CsvColumn, CsvPreview } from '@/core/ingestion/CsvImport';
import type { CsvImportService } from '@/core/ingestion/CsvImportService';
import type { SchemaService } from '@/core/schema/SchemaService';
import { findDialog, renderIngestionPage } from '../renderIngestionPage';
import { DataSourcesPage } from '../sources/DataSourcesPage';
import { fakeCsvImportService, fakeSchemaService } from '../testing';

function column(name: string, type = 'string'): CsvColumn {
  return { name, type, json: { class_name: type, name, display_name: name, is_nullable: true } };
}

const DETECTED: CsvPreview = { columns: [column('id'), column('name')], records: [['1', 'Á'], ['x', 'b']] };

/** `detect` guesses strings; with columns, `x` doesn't convert to a number and comes back null. */
function renderWizard(csvOverrides: Partial<CsvImportService> = {}) {
  const csv = fakeCsvImportService({
    detect: vi.fn<CsvImportService['detect']>(async (_sample, _setting, columns) =>
      columns ? { columns, records: [[1, 'Á'], [null, 'b']] } : DETECTED
    ),
    ingest: vi.fn<CsvImportService['ingest']>(async () => 2),
    ...csvOverrides
  });
  const schema = fakeSchemaService({
    listDatabases: vi.fn<SchemaService['listDatabases']>(async () => [{ name: 'sales', displayName: 'Sales' }]),
    getDatabase: vi.fn<SchemaService['getDatabase']>(async name => ({
      name,
      tables: [{ dbName: name, name: 'orders', columns: [{ name: 'id', displayName: 'id', type: 'int64' }] }]
    }))
  });
  renderIngestionPage(<DataSourcesPage />, '/data-ingestion/data-source', { csv, schema });
  return { csv, schema };
}

async function openWizard(): Promise<HTMLElement> {
  await userEvent.click(await screen.findByRole('button', { name: /Add Data Source/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'CSV' }));
  return findDialog('Import CSV');
}

async function pickFile(dialog: HTMLElement, content: string) {
  const input = dialog.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('No file input');
  await userEvent.upload(input, new File([content], 'customers.csv', { type: 'text/csv' }));
}

async function typeInto(dialog: HTMLElement, label: string, text: string) {
  const input = within(dialog).getByLabelText(label);
  await userEvent.clear(input);
  await userEvent.type(input, text);
}

describe('CsvImportModal', () => {
  it('imports a file into a new table', async () => {
    const { csv } = renderWizard();
    const dialog = await openWizard();

    await pickFile(dialog, 'id;name\n1;Á\nx;b\n');
    expect(await within(dialog).findByDisplayValue('id')).toBeInTheDocument();
    expect(csv.detect).toHaveBeenCalledWith('id;name\n1;Á\nx;b\n', { encoding: 'utf-8', includeHeader: true, delimiter: ';' }, undefined, expect.anything());

    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Column 1 type' }));
    await userEvent.click(await screen.findByTitle('Int64'));
    expect(await within(dialog).findByText('1 empty')).toBeInTheDocument();
    expect(vi.mocked(csv.detect).mock.lastCall?.[2]?.map(item => item.type)).toEqual(['int64', 'string']);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    await typeInto(dialog, 'Database', 'sales');
    await typeInto(dialog, 'Table', 'Khách hàng');
    expect(await within(dialog).findByText('New table: Khach_hang')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Import' }));

    expect(await within(dialog).findByText('Imported 2 rows into sales.Khach_hang.')).toBeInTheDocument();
    expect(csv.createTable).toHaveBeenCalledWith({
      dbName: 'sales',
      name: 'Khach_hang',
      displayName: 'Khách hàng',
      columns: [column('id', 'int64'), column('name')].map(item => ({ ...item, json: column(item.name).json }))
    });
    expect(csv.ingest).toHaveBeenCalledWith({ dbName: 'sales', name: 'Khach_hang' }, ';', '1;Á\nx;b\n', expect.anything());

    await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByText('Import CSV')).not.toBeInTheDocument());
  });

  it('refuses an empty file', async () => {
    renderWizard();
    const dialog = await openWizard();

    await pickFile(dialog, '');

    expect(await within(dialog).findByText('This file is empty. Pick another one.')).toBeInTheDocument();
  });

  it('flags duplicate column names before going on', async () => {
    renderWizard();
    const dialog = await openWizard();
    await pickFile(dialog, 'id,name\n1,a\n');

    await within(dialog).findByDisplayValue('id');
    await typeInto(dialog, 'Column 2 name', 'ID');
    await typeInto(dialog, 'Column 1 name', 'ID');

    expect(await within(dialog).findAllByText('Duplicate name')).toHaveLength(2);
    expect(within(dialog).getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it("refuses an existing table whose columns aren't the file's", async () => {
    const { csv } = renderWizard();
    const dialog = await openWizard();
    await pickFile(dialog, 'id,name\n1,a\n');
    await within(dialog).findByDisplayValue('id');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }));

    await typeInto(dialog, 'Database', 'sales');
    await typeInto(dialog, 'Table', 'orders');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Import' }));

    expect(await within(dialog).findByText(/^The table has 1 columns and the file 2/)).toBeInTheDocument();
    expect(csv.createTable).not.toHaveBeenCalled();
    expect(csv.ingest).not.toHaveBeenCalled();
  });

  it('waits on a failed chunk, then retries it', async () => {
    const ingest = vi
      .fn<CsvImportService['ingest']>()
      .mockRejectedValueOnce(new Error('Request timed out'))
      .mockResolvedValueOnce(2);
    renderWizard({ ingest });
    const dialog = await openWizard();
    await pickFile(dialog, 'id,name\n1,a\n');
    await within(dialog).findByDisplayValue('id');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    await typeInto(dialog, 'Database', 'sales');
    await typeInto(dialog, 'Table', 'people');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Import' }));

    expect(await within(dialog).findByText('Chunk 1 failed')).toBeInTheDocument();
    expect(within(dialog).getByText('Request timed out')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Retry' }));

    expect(await within(dialog).findByText('Imported 2 rows into sales.people.')).toBeInTheDocument();
    expect(ingest).toHaveBeenCalledTimes(2);
  });
});
