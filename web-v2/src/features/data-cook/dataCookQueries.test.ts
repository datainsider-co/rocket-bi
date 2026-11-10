import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { dataCookKeys, etlsChanged } from './dataCookQueries';

describe('etlsChanged', () => {
  it("marks the listings, the history and the ETLs stale, not the editor's previews", async () => {
    const client = new QueryClient();
    const keys = {
      listing: dataCookKeys.etls('mine', { keyword: '', from: 0, size: 20, sorts: [] }),
      history: dataCookKeys.history({ keyword: '', from: 0, size: 20, sorts: [] }),
      etl: dataCookKeys.etl(2),
      preview: dataCookKeys.preview(2, 'sales', 'abc'),
      database: dataCookKeys.database(2),
      sample: dataCookKeys.fieldsSample(2, {})
    };
    Object.values(keys).forEach(key => client.setQueryData(key, 1));

    await etlsChanged(client);

    const stale = (key: readonly unknown[]) => client.getQueryState(key)?.isInvalidated;
    expect([stale(keys.listing), stale(keys.history), stale(keys.etl)]).toEqual([true, true, true]);
    expect([stale(keys.preview), stale(keys.database), stale(keys.sample)]).toEqual([false, false, false]);
  });
});
