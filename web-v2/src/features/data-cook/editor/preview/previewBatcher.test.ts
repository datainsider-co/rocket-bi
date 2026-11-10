import { describe, expect, it, vi } from 'vitest';
import { etlOperatorFromJson, type EtlOperator } from '@/core/data-cook/EtlOperator';
import { etlGraphFromLeaves, operatorTree } from '@/core/data-cook/etlGraph';
import type { EtlPreview } from '@/core/data-cook/EtlPreviewService';
import { createPreviewBatcher, type PreviewRun } from './previewBatcher';

const dest = (tblName: string) => ({ tbl_name: tblName, db_display_name: 'ETL Database', tbl_display_name: tblName });
const a = { class_name: 'get_data_operator', dest_table_config: dest('a'), table_schema: { name: 'a', db_name: 'sample', columns: [] } };
const b = { class_name: 'sql_query_operator', operator: a, query: 'select 1', dest_table_configuration: dest('b') };
const c = { class_name: 'sql_query_operator', operator: a, query: 'select 2', dest_table_configuration: dest('c') };
const graph = etlGraphFromLeaves([b, c].map(etlOperatorFromJson));
const tree = (name: string): EtlOperator => operatorTree(graph, name)!;

const built = (...names: string[]): EtlPreview => ({ status: 'Done', tables: names.map(name => ({ dbName: 'preview_etl_1', name, columns: [] })), errors: [] });
const names = (trees: readonly EtlOperator[]) => trees.map(item => item.destTable.tblName);

/** A scheduler the test flushes by hand. */
function manual() {
  const flushes: (() => void)[] = [];
  return {
    schedule: (flush: () => void) => flushes.push(flush),
    flush: () => flushes.splice(0).forEach(flush => flush())
  };
}

describe('createPreviewBatcher', () => {
  it('builds the tables asked for together in one request, without the ones another holds', async () => {
    const run = vi.fn<PreviewRun>(async () => built('a', 'b', 'c'));
    const onBuilt = vi.fn<(names: ReadonlySet<string>) => void>();
    const scheduler = manual();
    const batcher = createPreviewBatcher(run, onBuilt, scheduler.schedule);

    const results = Promise.all([batcher.load(tree('a')), batcher.load(tree('b')), batcher.load(tree('c'))]);
    scheduler.flush();

    expect((await results).map(result => result.kind)).toEqual(['ready', 'ready', 'ready']);
    expect(run).toHaveBeenCalledTimes(1);
    expect(names(run.mock.calls[0]![0])).toEqual(['b', 'c']);
    expect([...onBuilt.mock.calls[0]![0]]).toEqual(['b', 'a', 'c']);
  });

  it('waits for a running build before the next one', async () => {
    let finish: (preview: EtlPreview) => void = () => {};
    const run = vi.fn<PreviewRun>(() => new Promise(resolve => (finish = resolve)));
    const scheduler = manual();
    const batcher = createPreviewBatcher(run, undefined, scheduler.schedule);

    const first = batcher.load(tree('b'));
    scheduler.flush();
    const second = batcher.load(tree('c'));
    scheduler.flush();
    expect(run).toHaveBeenCalledTimes(1);

    finish(built('a', 'b'));
    expect(await first).toMatchObject({ kind: 'ready' });
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    scheduler.flush();
    expect(run).toHaveBeenCalledTimes(2);
    expect(names(run.mock.calls[1]![0])).toEqual(['c']);
    finish(built('a', 'c'));
    expect(await second).toMatchObject({ kind: 'ready' });
  });

  it('fails every table of a request the server refused, and keeps going', async () => {
    const run = vi.fn<PreviewRun>().mockRejectedValueOnce(new Error('500')).mockResolvedValueOnce(built('a', 'b'));
    const scheduler = manual();
    const batcher = createPreviewBatcher(run, undefined, scheduler.schedule);

    const failed = Promise.allSettled([batcher.load(tree('b')), batcher.load(tree('c'))]);
    scheduler.flush();
    expect((await failed).map(result => result.status)).toEqual(['rejected', 'rejected']);

    const retried = batcher.load(tree('b'));
    scheduler.flush();
    expect(await retried).toMatchObject({ kind: 'ready' });
  });
});
