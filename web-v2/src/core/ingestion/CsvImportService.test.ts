import { describe, expect, it } from 'vitest';
import { csvColumnFromJson, type CsvColumn } from './CsvImport';
import { HttpCsvImportService } from './CsvImportService';
import fixture from './ingestion.fixture.json';
import { fakeHttp, type Reply } from './testing';

function setup(...replies: Reply[]) {
  const { http, requests } = fakeHttp(...replies);
  return { service: new HttpCsvImportService(http), requests };
}

const detected = fixture.csvDetect.response.schema.columns.map(csvColumnFromJson);

/** The types DI0 picked for `di0_csv.products`. */
const typed: CsvColumn[] = detected.map((column, index) => ({ ...column, type: ['int64', 'string', 'double', 'datetime'][index] ?? column.type }));

describe('HttpCsvImportService', () => {
  it('detects a sample without columns, as in DI0', async () => {
    const { service, requests } = setup({ body: fixture.csvDetect.response });

    const preview = await service.detect(fixture.csvDetect.request.sample, { includeHeader: true, delimiter: ',' });

    expect(requests[0]).toEqual({ method: 'POST', url: 'http://api.test/ingestion/csv/detect', body: fixture.csvDetect.request });
    expect(preview.columns.map(column => [column.name, column.type])).toEqual([
      ['id', 'string'],
      ['name', 'string'],
      ['price', 'string'],
      ['created_at', 'datetime']
    ]);
    expect(preview.records).toHaveLength(3);
    expect(preview.records[1]).toEqual(['2', 'Banana, ripe', '0.25', '2024-01-03T11:30:00.000+00:00']);
  });

  it('sends the columns as a schema to convert the sample to their types', async () => {
    const { service, requests } = setup({ body: fixture.csvDetect.response });

    await service.detect('a\n1', { includeHeader: false, delimiter: ';' }, typed);

    expect(requests[0]?.body).toEqual({
      sample: 'a\n1',
      csv_setting: { include_header: false, delimiter: ';', add_batch_info: false },
      schema: { ...fixture.csvSchema.request.schema, name: '', db_name: '', display_name: '' }
    });
  });

  it('creates the table with the columns as the server sent them, as in DI0', async () => {
    const { service, requests } = setup({ body: fixture.csvSchema.response });

    const name = await service.createTable({ dbName: 'di0_csv', name: 'products', displayName: 'Products', columns: typed });

    expect(requests[0]).toEqual({ method: 'POST', url: 'http://api.test/ingestion/csv/schema', body: fixture.csvSchema.request });
    expect(name).toBe('products');
  });

  it("returns the server's name for the table", async () => {
    const { service } = setup({ body: { ...fixture.csvSchema.response, name: 'Don_hang' } });

    await expect(service.createTable({ dbName: 'db', name: 'Đơn hàng', displayName: 'Đơn hàng', columns: [] })).resolves.toBe('Don_hang');
  });

  it('ingests rows without a header, as in DI0', async () => {
    const { service, requests } = setup({ body: fixture.csvIngest.response });

    const inserted = await service.ingest({ dbName: 'di0_csv', name: 'products' }, ',', fixture.csvIngest.request.data);

    expect(requests[0]).toEqual({ method: 'POST', url: 'http://api.test/ingestion/csv', body: fixture.csvIngest.request });
    expect(inserted).toBe(2);
  });

  it('fails with the server message', async () => {
    const { service } = setup({ status: 403, body: { code: 403, message: 'no permission' } });

    await expect(service.ingest({ dbName: 'db', name: 't' }, ',', '1')).rejects.toThrow('no permission');
  });
});
