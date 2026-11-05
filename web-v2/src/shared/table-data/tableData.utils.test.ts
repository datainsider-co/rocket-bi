import { describe, expect, it } from 'vitest';
import { visualizationResponseFromJson, type JsonTableResponse } from '@/core/query/VisualizationResponse';
import { tableDefinitionFromJson } from '@/core/schema/TableDefinition';
import fixture from '@/core/schema/warehouse.fixture.json';
import { previewColumns, previewRows, tablePreviewRequest } from './tableData.utils';

const products = tableDefinitionFromJson(fixture.tableUpdate.response);

describe('tablePreviewRequest', () => {
  it('builds the request DW0 ran, one select per column', () => {
    const { query_setting, from, size } = fixture.tablePreview.request;
    const request = tablePreviewRequest(products, 1, 3, undefined);

    expect(request).toMatchObject({ from, size, filter_requests: [] });
    expect(request['query_setting']).toMatchObject({ class_name: query_setting.class_name, columns: query_setting.columns, sorts: [] });
  });

  it('pages and sorts by a column', () => {
    const request = tablePreviewRequest(products, 3, 20, { column: 'qty', direction: 'DESC' });

    expect(request).toMatchObject({ from: 40, size: 20 });
    expect(request['query_setting']).toMatchObject({ sorts: fixture.tablePreviewSorted.request.query_setting.sorts });
  });

  it('ignores a sort on a column the table no longer has', () => {
    expect(tablePreviewRequest(products, 1, 20, { column: 'gone', direction: 'ASC' })['query_setting']).toMatchObject({ sorts: [] });
  });
});

describe('previewColumns', () => {
  it('titles the response columns with their display names', () => {
    const response = visualizationResponseFromJson(fixture.tablePreview.response) as JsonTableResponse;

    expect(previewColumns(response, products).slice(0, 2)).toEqual([
      { key: 'b80bb7', name: 'id', title: 'Id' },
      { key: 'b06893', name: 'name', title: 'Name edited' }
    ]);
  });
});

describe('previewRows', () => {
  it('keys each row by its place in the whole result, leaving the records alone', () => {
    const records = [{ a: '1' }, { a: '2' }];

    expect(previewRows(records, 40)).toEqual([
      { a: '1', __row: '40' },
      { a: '2', __row: '41' }
    ]);
    expect(records[0]).toEqual({ a: '1' });
  });
});
